-- AstraCorp - alinear el dia publicitario con la fecha local de Espana.
-- El cliente genera day_key con la fecha local. Supabase suele evaluar
-- current_date en UTC, lo que puede hacer que "hoy" y "ayer" apunten a
-- dias distintos durante la madrugada en Europe/Madrid.

create or replace function public._astracorp_ad_current_date()
returns date
language sql
stable
as $fn$
  select (now() at time zone 'Europe/Madrid')::date;
$fn$;

create or replace function public._astracorp_ad_today_key()
returns text
language sql
stable
as $fn$
  select to_char(public._astracorp_ad_current_date(), 'YYYY-MM-DD');
$fn$;

create or replace function public.rpc_flush_ad_views(
  p_day_key text,
  p_views integer,
  p_revenue_eur numeric,
  p_player_pct numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_today_date date := public._astracorp_ad_current_date();
  v_today text := to_char(v_today_date, 'YYYY-MM-DD');
  v_day_key text := trim(coalesce(p_day_key, v_today));
  v_views integer := greatest(0, least(50, coalesce(p_views, 0)));
  v_revenue_per_view numeric := 0.00054;
  v_revenue numeric := 0;
  v_pct numeric := 1;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;
  if v_day_key = '' then
    raise exception 'Dia no valido.';
  end if;
  if v_day_key::date > v_today_date then
    raise exception 'No se pueden registrar acciones patrocinadas futuras.';
  end if;
  if v_day_key::date < v_today_date - 7 then
    raise exception 'El acumulado publicitario es demasiado antiguo.';
  end if;
  if exists(select 1 from public.astracorp_ad_pool_daily where day_key = v_day_key and closed = true) then
    raise exception 'El pool de anuncios de este dia ya esta cerrado.';
  end if;
  if v_views <= 0 then
    return jsonb_build_object('ok', true, 'skipped', true);
  end if;

  v_revenue := round(v_views * v_revenue_per_view, 6);
  v_pct := public._astracorp_ad_player_pct(v_user);

  insert into public.astracorp_ad_pool_daily(day_key, total_views, total_revenue_eur, updated_at)
  values (v_day_key, v_views, v_revenue, now())
  on conflict (day_key) do update
  set total_views = public.astracorp_ad_pool_daily.total_views + excluded.total_views,
      total_revenue_eur = round(public.astracorp_ad_pool_daily.total_revenue_eur + excluded.total_revenue_eur, 6),
      updated_at = now();

  insert into public.astracorp_ad_player_daily(day_key, user_id, views, revenue_eur, player_pct, updated_at)
  values (v_day_key, v_user, v_views, v_revenue, v_pct, now())
  on conflict (day_key, user_id) do update
  set views = public.astracorp_ad_player_daily.views + excluded.views,
      revenue_eur = round(public.astracorp_ad_player_daily.revenue_eur + excluded.revenue_eur, 6),
      player_pct = excluded.player_pct,
      updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'dayKey', v_day_key,
    'views', v_views,
    'revenue', v_revenue,
    'estimated', true
  );
end;
$fn$;

create or replace function public.rpc_close_ad_pool_day(p_day_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_today_date date := public._astracorp_ad_current_date();
  v_day_key text := trim(coalesce(p_day_key, ''));
  v_total_pool numeric := 0;
  v_active_players integer := 0;
  v_role text := coalesce(auth.role(), '');
  v_app_role text := coalesce(auth.jwt() ->> 'app_role', '');
begin
  if v_role <> 'service_role' and v_app_role <> 'admin' then
    raise exception 'Solo un proceso administrativo puede cerrar el pool diario.';
  end if;
  if v_day_key = '' then
    raise exception 'Dia no valido.';
  end if;
  if v_day_key::date >= v_today_date then
    raise exception 'Solo se pueden cerrar dias ya finalizados.';
  end if;

  insert into public.astracorp_ad_pool_daily(day_key)
  values (v_day_key)
  on conflict (day_key) do nothing;

  select total_revenue_eur
  into v_total_pool
  from public.astracorp_ad_pool_daily
  where day_key = v_day_key;

  select count(*)
  into v_active_players
  from public.astracorp_ad_player_daily
  where day_key = v_day_key and views > 0;

  update public.astracorp_ad_player_daily
  set final_payout = case
        when v_active_players > 0 then round((v_total_pool / v_active_players) * (greatest(0, least(100, player_pct)) / 100), 6)
        else 0
      end,
      updated_at = now()
  where day_key = v_day_key;

  update public.astracorp_ad_pool_daily
  set closed = true,
      closed_at = coalesce(closed_at, now()),
      updated_at = now()
  where day_key = v_day_key;

  return jsonb_build_object(
    'ok', true,
    'dayKey', v_day_key,
    'totalPool', v_total_pool,
    'activePlayers', v_active_players
  );
end;
$fn$;

create or replace function public.rpc_get_my_ad_income_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_today_date date := public._astracorp_ad_current_date();
  v_today text := to_char(v_today_date, 'YYYY-MM-DD');
  v_yesterday text := to_char(v_today_date - 1, 'YYYY-MM-DD');
  v_today_pool numeric := 0;
  v_today_active_players integer := 0;
  v_today_pct numeric := 1;
  v_today_estimate numeric := 0;
  v_yesterday_pool numeric := 0;
  v_yesterday_active_players integer := 0;
  v_yesterday_pct numeric := 1;
  v_yesterday_payout numeric := 0;
  v_yesterday_estimate numeric := 0;
  v_yesterday_closed boolean := false;
  v_avg_last_10 numeric := 0;
  v_total_payout numeric := 0;
  v_total_pool numeric := 0;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  select coalesce(total_revenue_eur, 0)
  into v_today_pool
  from public.astracorp_ad_pool_daily
  where day_key = v_today;

  select count(*)
  into v_today_active_players
  from public.astracorp_ad_player_daily
  where day_key = v_today and views > 0;

  select coalesce(player_pct, public._astracorp_ad_player_pct(v_user))
  into v_today_pct
  from public.astracorp_ad_player_daily
  where day_key = v_today and user_id = v_user;

  select
    coalesce(total_revenue_eur, 0),
    coalesce(closed, false)
  into v_yesterday_pool, v_yesterday_closed
  from public.astracorp_ad_pool_daily
  where day_key = v_yesterday;

  select count(*)
  into v_yesterday_active_players
  from public.astracorp_ad_player_daily
  where day_key = v_yesterday and views > 0;

  select
    coalesce(player_pct, public._astracorp_ad_player_pct(v_user)),
    coalesce(final_payout, 0)
  into v_yesterday_pct, v_yesterday_payout
  from public.astracorp_ad_player_daily
  where day_key = v_yesterday and user_id = v_user;

  select coalesce(avg(final_payout), 0)
  into v_avg_last_10
  from (
    select final_payout
    from public.astracorp_ad_player_daily
    where user_id = v_user and day_key < v_today
    order by day_key desc
    limit 10
  ) recent;

  select coalesce(sum(final_payout), 0)
  into v_total_payout
  from public.astracorp_ad_player_daily
  where user_id = v_user and day_key < v_yesterday;

  select coalesce(sum(total_revenue_eur), 0)
  into v_total_pool
  from public.astracorp_ad_pool_daily;

  v_today_active_players := greatest(1, coalesce(v_today_active_players, 0));
  v_today_pct := coalesce(v_today_pct, public._astracorp_ad_player_pct(v_user), 1);
  v_today_estimate := round((coalesce(v_today_pool, 0) / v_today_active_players) * (greatest(0, least(100, v_today_pct)) / 100), 6);

  v_yesterday_active_players := greatest(1, coalesce(v_yesterday_active_players, 0));
  v_yesterday_pct := coalesce(v_yesterday_pct, public._astracorp_ad_player_pct(v_user), 1);
  v_yesterday_estimate := round((coalesce(v_yesterday_pool, 0) / v_yesterday_active_players) * (greatest(0, least(100, v_yesterday_pct)) / 100), 6);
  v_yesterday_payout := case
    when coalesce(v_yesterday_closed, false) then coalesce(v_yesterday_payout, 0)
    else greatest(coalesce(v_yesterday_payout, 0), coalesce(v_yesterday_estimate, 0))
  end;
  v_total_payout := round(coalesce(v_total_payout, 0) + coalesce(v_yesterday_payout, 0), 6);

  return jsonb_build_object(
    'yesterday_payout', round(coalesce(v_yesterday_payout, 0), 6),
    'yesterday_pool', round(coalesce(v_yesterday_pool, 0), 6),
    'yesterday_active_players', v_yesterday_active_players,
    'yesterday_pct', v_yesterday_pct,
    'yesterday_estimate', v_yesterday_estimate,
    'yesterday_closed', coalesce(v_yesterday_closed, false),
    'avg_last_10_days', round(coalesce(v_avg_last_10, 0), 6),
    'total_payout', round(coalesce(v_total_payout, 0), 6),
    'total_pool', round(coalesce(v_total_pool, 0), 6),
    'today_pool', round(coalesce(v_today_pool, 0), 6),
    'today_active_players', v_today_active_players,
    'today_pct', v_today_pct,
    'today_estimate', v_today_estimate
  );
end;
$fn$;

create or replace function public.rpc_get_public_ad_pool_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_today_date date := public._astracorp_ad_current_date();
  v_today text := to_char(v_today_date, 'YYYY-MM-DD');
  v_yesterday text := to_char(v_today_date - 1, 'YYYY-MM-DD');
  v_today_pool numeric := 0;
  v_today_active_players integer := 0;
  v_yesterday_pool numeric := 0;
  v_yesterday_active_players integer := 0;
  v_yesterday_closed boolean := false;
  v_total_pool numeric := 0;
begin
  select coalesce(total_revenue_eur, 0)
  into v_today_pool
  from public.astracorp_ad_pool_daily
  where day_key = v_today;

  select count(*)
  into v_today_active_players
  from public.astracorp_ad_player_daily
  where day_key = v_today and views > 0;

  select
    coalesce(total_revenue_eur, 0),
    coalesce(closed, false)
  into v_yesterday_pool, v_yesterday_closed
  from public.astracorp_ad_pool_daily
  where day_key = v_yesterday;

  select count(*)
  into v_yesterday_active_players
  from public.astracorp_ad_player_daily
  where day_key = v_yesterday and views > 0;

  select coalesce(sum(total_revenue_eur), 0)
  into v_total_pool
  from public.astracorp_ad_pool_daily;

  return jsonb_build_object(
    'today_pool', round(coalesce(v_today_pool, 0), 6),
    'today_active_players', greatest(1, coalesce(v_today_active_players, 0)),
    'yesterday_pool', round(coalesce(v_yesterday_pool, 0), 6),
    'yesterday_active_players', greatest(1, coalesce(v_yesterday_active_players, 0)),
    'yesterday_closed', coalesce(v_yesterday_closed, false),
    'total_pool', round(coalesce(v_total_pool, 0), 6)
  );
end;
$fn$;

revoke execute on function public.rpc_close_ad_pool_day(text) from authenticated;
grant execute on function public.rpc_close_ad_pool_day(text) to service_role;
grant execute on function public._astracorp_ad_current_date() to anon;
grant execute on function public._astracorp_ad_current_date() to authenticated;
grant execute on function public._astracorp_ad_today_key() to anon;
grant execute on function public._astracorp_ad_today_key() to authenticated;
grant execute on function public.rpc_flush_ad_views(text, integer, numeric, numeric) to authenticated;
grant execute on function public.rpc_get_my_ad_income_summary() to authenticated;
grant execute on function public.rpc_get_public_ad_pool_summary() to anon;
grant execute on function public.rpc_get_public_ad_pool_summary() to authenticated;
