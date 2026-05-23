-- SECURITY DEFINER routines bypass RLS, so avoid implicit execution grants and
-- prevent caller-controlled schemas from participating in name resolution.
do $$
declare
  v_function record;
begin
  for v_function in
    select n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as identity_args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
  loop
    execute format(
      'alter function %I.%I(%s) set search_path = public, pg_temp',
      v_function.nspname,
      v_function.proname,
      v_function.identity_args
    );
    execute format(
      'revoke execute on function %I.%I(%s) from public, anon, authenticated',
      v_function.nspname,
      v_function.proname,
      v_function.identity_args
    );
  end loop;
end
$$;

-- Authenticated gameplay API surface.
grant execute on function public.rpc_build_company_secure(text, text, integer) to authenticated;
grant execute on function public.rpc_sell_company_secure(text) to authenticated;
grant execute on function public.rpc_collect_company_secure(text) to authenticated;
grant execute on function public.rpc_collect_company_group_secure(text, text) to authenticated;
grant execute on function public.rpc_collect_all_companies_ad_secure() to authenticated;

grant execute on function public.rpc_start_election_secure(text) to authenticated;
grant execute on function public.rpc_vote_election_secure(text) to authenticated;
grant execute on function public.rpc_resolve_election_secure() to authenticated;

grant execute on function public.rpc_upgrade_hq_secure(text) to authenticated;
grant execute on function public.rpc_repair_integrity_secure() to authenticated;
grant execute on function public.rpc_select_planet_secure(text) to authenticated;

grant execute on function public.rpc_get_global_market() to authenticated;
grant execute on function public.rpc_buy_market_item_secure(text, integer) to authenticated;
grant execute on function public.rpc_sell_market_item_secure(text, integer) to authenticated;

grant execute on function public.rpc_deliver_contract_secure(text) to authenticated;
grant execute on function public.rpc_claim_mission_reward_secure(text) to authenticated;
grant execute on function public.rpc_get_player_rankings(integer) to authenticated;

grant execute on function public.rpc_start_research_secure(text) to authenticated;
grant execute on function public.rpc_boost_research_secure() to authenticated;
grant execute on function public.rpc_complete_research_secure() to authenticated;

grant execute on function public.rpc_get_global_territories() to authenticated;
grant execute on function public.rpc_attack_territory_secure(integer) to authenticated;
grant execute on function public.rpc_reinforce_territory_secure(integer) to authenticated;
grant execute on function public.rpc_sabotage_territory_secure(integer) to authenticated;
grant execute on function public.rpc_build_territory_fort_secure(integer) to authenticated;
grant execute on function public.rpc_collect_occupation_taxes_secure(integer) to authenticated;

grant execute on function public.rpc_start_work_secure(text) to authenticated;
grant execute on function public.rpc_boost_work_secure() to authenticated;
grant execute on function public.rpc_complete_work_secure() to authenticated;
grant execute on function public.rpc_reset_game_secure() to authenticated;

grant execute on function public.rpc_flush_ad_views(text, integer, numeric, numeric) to authenticated;
grant execute on function public.rpc_get_my_ad_income_summary() to authenticated;
grant execute on function public.rpc_get_my_ad_income_history(integer) to authenticated;

-- Public read-only ad summary and service-only daily closing.
grant execute on function public.rpc_get_public_ad_pool_summary() to anon, authenticated;
grant execute on function public.rpc_close_ad_pool_day(text) to service_role;
