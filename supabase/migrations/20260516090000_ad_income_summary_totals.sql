-- AstraCorp - resumen economico completo del pool publicitario
-- Anade totales acumulados y una estimacion de ayer cuando el cierre diario
-- administrativo aun no ha calculado final_payout.

drop function if exists public.rpc_get_my_ad_income_summary();

create or replace function public.rpc_get_my_ad_income_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_today text := public._astracorp_ad_today_key();
  v_yesterday text := to_char(current_date - 1, 'YYYY-MM-DD');
  v_today_pool numeric := 0;
  v_today_active_players integer := 0;
  v_today_pct numeric := 1;
  v_today_estimate numeric := 0;
  v_yesterday_pool numeric := 0;
  v_yesterday_active_players integer := 0;
  v_yesterday_pct numeric := 1;
  v_yesterday_payout numeric := 0;
  v_yesterday_estimate numeric := 0;
  v_yesterday_closed boolean := true;
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

grant execute on function public.rpc_get_my_ad_income_summary() to authenticated;
