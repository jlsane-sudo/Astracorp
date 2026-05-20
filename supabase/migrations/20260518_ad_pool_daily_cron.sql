-- AstraCorp - cierre automatico diario del pool publicitario.
-- Programa un job de base de datos que cierra el dia anterior segun Europe/Madrid.

create extension if not exists pg_cron;

create or replace function public._astracorp_close_ad_pool_day_internal(p_day_key text)
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
begin
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
    'totalPool', coalesce(v_total_pool, 0),
    'activePlayers', coalesce(v_active_players, 0)
  );
end;
$fn$;

create or replace function public._astracorp_close_yesterday_ad_pool()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_yesterday text := to_char(public._astracorp_ad_current_date() - 1, 'YYYY-MM-DD');
begin
  return public._astracorp_close_ad_pool_day_internal(v_yesterday);
end;
$fn$;

create or replace function public.rpc_close_ad_pool_day(p_day_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_role text := coalesce(auth.role(), '');
  v_app_role text := coalesce(auth.jwt() ->> 'app_role', '');
begin
  if v_role <> 'service_role' and v_app_role <> 'admin' then
    raise exception 'Solo un proceso administrativo puede cerrar el pool diario.';
  end if;

  return public._astracorp_close_ad_pool_day_internal(p_day_key);
end;
$fn$;

revoke all on function public._astracorp_close_ad_pool_day_internal(text) from public;
revoke all on function public._astracorp_close_ad_pool_day_internal(text) from anon;
revoke all on function public._astracorp_close_ad_pool_day_internal(text) from authenticated;
revoke all on function public._astracorp_close_yesterday_ad_pool() from public;
revoke all on function public._astracorp_close_yesterday_ad_pool() from anon;
revoke all on function public._astracorp_close_yesterday_ad_pool() from authenticated;

revoke execute on function public.rpc_close_ad_pool_day(text) from authenticated;
grant execute on function public.rpc_close_ad_pool_day(text) to service_role;

do $$
declare
  v_job_id bigint;
begin
  for v_job_id in
    select jobid
    from cron.job
    where jobname = 'astracorp-close-yesterday-ad-pool'
  loop
    perform cron.unschedule(v_job_id);
  end loop;
end $$;

select cron.schedule(
  'astracorp-close-yesterday-ad-pool',
  '10 23 * * *',
  $$select public._astracorp_close_yesterday_ad_pool();$$
);
