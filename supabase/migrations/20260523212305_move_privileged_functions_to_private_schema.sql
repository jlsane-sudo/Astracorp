-- Keep elevated implementations outside schemas exposed through the Data API.
-- Public SQL wrappers preserve existing RPC and cron names without elevating callers.
create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to anon, authenticated, service_role;

alter default privileges in schema private
  revoke execute on functions from public, anon, authenticated;

create temporary table moved_privileged_functions
on commit drop
as
select
  p.proname,
  pg_get_function_identity_arguments(p.oid) as identity_args,
  pg_get_function_arguments(p.oid) as full_args,
  pg_get_function_result(p.oid) as result_type,
  p.proretset,
  p.prorettype = 'pg_catalog.trigger'::regtype as is_trigger,
  coalesce(
    (
      select string_agg(format('$%s', arg_no), ', ' order by arg_no)
      from generate_series(1, p.pronargs) as arg_no
    ),
    ''
  ) as arg_refs
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef;

do $$
declare
  v_function record;
begin
  for v_function in select * from moved_privileged_functions
  loop
    execute format(
      'alter function public.%I(%s) set schema private',
      v_function.proname,
      v_function.identity_args
    );
    execute format(
      'revoke execute on function private.%I(%s) from public, anon, authenticated',
      v_function.proname,
      v_function.identity_args
    );
  end loop;
end
$$;

do $$
declare
  v_function record;
  v_body text;
begin
  for v_function in
    select *
    from moved_privileged_functions
    where not is_trigger
  loop
    if v_function.proretset then
      v_body := format(
        'select * from private.%I(%s)',
        v_function.proname,
        v_function.arg_refs
      );
    else
      v_body := format(
        'select private.%I(%s)',
        v_function.proname,
        v_function.arg_refs
      );
    end if;

    execute format(
      'create function public.%I(%s) returns %s language sql security invoker set search_path = '''' as %L',
      v_function.proname,
      v_function.full_args,
      v_function.result_type,
      v_body
    );
    execute format(
      'revoke execute on function public.%I(%s) from public, anon, authenticated',
      v_function.proname,
      v_function.identity_args
    );
  end loop;
end
$$;

-- Authenticated gameplay API surface.
do $$
declare
  v_signature text;
begin
  foreach v_signature in array array[
    'rpc_build_company_secure(text, text, integer)',
    'rpc_sell_company_secure(text)',
    'rpc_collect_company_secure(text)',
    'rpc_collect_company_group_secure(text, text)',
    'rpc_collect_all_companies_ad_secure()',
    'rpc_start_election_secure(text)',
    'rpc_vote_election_secure(text)',
    'rpc_resolve_election_secure()',
    'rpc_upgrade_hq_secure(text)',
    'rpc_repair_integrity_secure()',
    'rpc_select_planet_secure(text)',
    'rpc_get_global_market()',
    'rpc_buy_market_item_secure(text, integer)',
    'rpc_sell_market_item_secure(text, integer)',
    'rpc_deliver_contract_secure(text)',
    'rpc_claim_mission_reward_secure(text)',
    'rpc_get_player_rankings(integer)',
    'rpc_start_research_secure(text)',
    'rpc_boost_research_secure()',
    'rpc_complete_research_secure()',
    'rpc_get_global_territories()',
    'rpc_attack_territory_secure(integer)',
    'rpc_reinforce_territory_secure(integer)',
    'rpc_sabotage_territory_secure(integer)',
    'rpc_build_territory_fort_secure(integer)',
    'rpc_collect_occupation_taxes_secure(integer)',
    'rpc_start_work_secure(text)',
    'rpc_boost_work_secure()',
    'rpc_complete_work_secure()',
    'rpc_reset_game_secure()',
    'rpc_flush_ad_views(text, integer, numeric, numeric)',
    'rpc_get_my_ad_income_summary()',
    'rpc_get_my_ad_income_history(integer)'
  ]
  loop
    execute format('grant execute on function public.%s to authenticated', v_signature);
    execute format('grant execute on function private.%s to authenticated', v_signature);
  end loop;
end
$$;

grant execute on function public.rpc_get_public_ad_pool_summary() to anon, authenticated;
grant execute on function private.rpc_get_public_ad_pool_summary() to anon, authenticated;

grant execute on function public.rpc_close_ad_pool_day(text) to service_role;
grant execute on function private.rpc_close_ad_pool_day(text) to service_role;

notify pgrst, 'reload schema';
