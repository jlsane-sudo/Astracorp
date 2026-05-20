-- AstraCorp - endurecimiento del pool publicitario estimado
-- Las impresiones reales siguen dependiendo del proveedor. Esta capa solo
-- registra acciones patrocinadas estimadas y evita inflados triviales.

create or replace function public._astracorp_ad_player_pct(p_user uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_pct numeric := 1;
begin
  select coalesce((save_data #>> '{player,pct}')::numeric, 1)
  into v_pct
  from public.game_saves
  where user_id = p_user;

  return greatest(1, least(100, coalesce(v_pct, 1)));
exception
  when others then
    return 1;
end;
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
  v_today text := public._astracorp_ad_today_key();
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
  if v_day_key::date > current_date then
    raise exception 'No se pueden registrar acciones patrocinadas futuras.';
  end if;
  if v_day_key::date < current_date - 7 then
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
  if v_day_key::date >= current_date then
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

revoke execute on function public.rpc_close_ad_pool_day(text) from authenticated;
grant execute on function public.rpc_close_ad_pool_day(text) to service_role;
grant execute on function public._astracorp_ad_player_pct(uuid) to authenticated;
