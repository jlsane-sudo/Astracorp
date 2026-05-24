-- AstraCorp - lectura publica del pool publicitario global
-- Expone solo datos agregados, sin historial ni reparto individual.

create or replace function public.rpc_get_public_ad_pool_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_today text := public._astracorp_ad_today_key();
  v_yesterday text := to_char(current_date - 1, 'YYYY-MM-DD');
  v_today_pool numeric := 0;
  v_today_active_players integer := 0;
  v_yesterday_pool numeric := 0;
  v_yesterday_active_players integer := 0;
  v_yesterday_closed boolean := true;
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

grant execute on function public.rpc_get_public_ad_pool_summary() to anon;
grant execute on function public.rpc_get_public_ad_pool_summary() to authenticated;
