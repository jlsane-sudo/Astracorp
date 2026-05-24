-- AstraCorp - misiones y contratos online
-- Ejecutar preferiblemente el archivo *_BLOCKS.sql por bloques en Supabase SQL Editor.

create table if not exists public.astracorp_mission_contract_events (
  id bigserial primary key,
  user_id uuid not null,
  event_type text not null,
  ref_id text,
  credits numeric not null default 0,
  xp integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.astracorp_mission_contract_events enable row level security;

drop policy if exists astracorp_mc_events_select_own on public.astracorp_mission_contract_events;
create policy astracorp_mc_events_select_own
on public.astracorp_mission_contract_events
for select
to authenticated
using (user_id = auth.uid());

create or replace function public._astracorp_mc_now_ms()
returns numeric
language sql
stable
as $fn$
  select floor(extract(epoch from clock_timestamp()) * 1000)::numeric;
$fn$;

create or replace function public._astracorp_mc_xp_needed(p_level integer)
returns numeric
language plpgsql
immutable
as $fn$
declare
  v_level integer := greatest(1, coalesce(p_level, 1));
  v_xp numeric;
begin
  if v_level = 1 then return 45; end if;
  if v_level = 2 then return 75; end if;
  if v_level = 3 then return 100; end if;
  if v_level = 4 then return 130; end if;
  if v_level = 5 then return 165; end if;
  if v_level = 6 then return 205; end if;
  if v_level = 7 then return 250; end if;
  if v_level = 8 then return 300; end if;

  v_xp := 300 * power(1.17::numeric, (v_level - 8)::numeric);
  return greatest(300, round(v_xp / 5) * 5);
end;
$fn$;

create or replace function public._astracorp_mc_apply_xp(p_player jsonb, p_xp numeric)
returns jsonb
language plpgsql
immutable
as $fn$
declare
  v_player jsonb := coalesce(p_player, '{}'::jsonb);
  v_level integer := greatest(1, coalesce((v_player->>'level')::integer, 1));
  v_xp numeric := greatest(0, coalesce((v_player->>'xp')::numeric, 0) + coalesce(p_xp, 0));
  v_needed numeric;
begin
  loop
    v_needed := public._astracorp_mc_xp_needed(v_level);
    exit when v_xp < v_needed;
    v_xp := v_xp - v_needed;
    v_level := v_level + 1;
  end loop;

  return v_player || jsonb_build_object('level', v_level, 'xp', v_xp);
end;
$fn$;

create or replace function public._astracorp_mc_contract_mult(p_save jsonb)
returns numeric
language plpgsql
immutable
as $fn$
declare
  v_research jsonb := coalesce(p_save->'research', '{}'::jsonb);
  v_player jsonb := coalesce(p_save->'player', '{}'::jsonb);
  v_ad_level numeric := greatest(0, coalesce((v_research->>'ad_optimization')::numeric, 0));
  v_planet text := coalesce(v_player->>'currentPlanet', v_player->>'planet', 'nexus');
  v_planet_mult numeric := 1;
begin
  v_planet_mult := case v_planet
    when 'cryon' then 1.1
    when 'elysium' then 1.02
    when 'aethon' then 0.94
    when 'noctis' then 1.06
    when 'thalassa' then 1.08
    when 'duskara' then 1.04
    else 1
  end;

  return (1 + v_ad_level * 0.08) * v_planet_mult;
end;
$fn$;

create or replace function public._astracorp_mc_load_save_locked()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_save jsonb;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  v_save := (
    select save_data
    from public.game_saves
    where user_id = v_user
    for update
  );

  if v_save is null then
    raise exception 'No hay partida guardada en esta cuenta.';
  end if;

  return v_save;
end;
$fn$;

create or replace function public._astracorp_mc_store_save(p_save jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  update public.game_saves
  set save_data = p_save,
      updated_at = now()
  where user_id = v_user;

  return p_save;
end;
$fn$;

create or replace function public._astracorp_mc_add_log(p_save jsonb, p_msg text)
returns jsonb
language plpgsql
volatile
as $fn$
declare
  v_log jsonb := coalesce(p_save->'log', '[]'::jsonb);
  v_entry jsonb := jsonb_build_object('msg', p_msg, 't', public._astracorp_mc_now_ms());
begin
  return jsonb_set(p_save, '{log}', jsonb_build_array(v_entry) || v_log, true);
end;
$fn$;

create or replace function public._astracorp_mc_progress_mission(p_save jsonb, p_type text, p_amount integer default 1)
returns jsonb
language plpgsql
immutable
as $fn$
declare
  v_missions jsonb := '[]'::jsonb;
  v_mission jsonb;
  v_progress numeric;
  v_goal numeric;
begin
  for v_mission in
    select value from jsonb_array_elements(coalesce(p_save->'missions', '[]'::jsonb))
  loop
    if v_mission->>'type' = p_type and not coalesce((v_mission->>'done')::boolean, false) then
      v_goal := greatest(0, coalesce((v_mission->>'goal')::numeric, 0));
      v_progress := least(v_goal, coalesce((v_mission->>'progress')::numeric, 0) + greatest(1, coalesce(p_amount, 1)));
      v_mission := v_mission || jsonb_build_object(
        'progress', v_progress,
        'readyToClaim', v_goal > 0 and v_progress >= v_goal
      );
    end if;

    v_missions := v_missions || jsonb_build_array(v_mission);
  end loop;

  return jsonb_set(p_save, '{missions}', v_missions, true);
end;
$fn$;

create or replace function public.rpc_deliver_contract_secure(p_contract_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_save jsonb;
  v_contract jsonb;
  v_contracts jsonb := '[]'::jsonb;
  v_item jsonb;
  v_inventory jsonb;
  v_player jsonb;
  v_stats jsonb;
  v_now numeric := public._astracorp_mc_now_ms();
  v_item_key text;
  v_item_name text;
  v_qty numeric;
  v_have numeric;
  v_energy numeric;
  v_reward_credits numeric;
  v_reward_xp integer;
  v_mult numeric;
  v_territory jsonb;
  v_player_name text;
  v_is_territory boolean;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  if nullif(trim(coalesce(p_contract_id, '')), '') is null then
    raise exception 'Contrato no valido.';
  end if;

  v_save := public._astracorp_mc_load_save_locked();
  v_contract := (
    select value
    from jsonb_array_elements(coalesce(v_save->'contracts', '[]'::jsonb))
    where value->>'id' = p_contract_id
    limit 1
  );

  if v_contract is null or coalesce((v_contract->>'completed')::boolean, false) then
    raise exception 'Ese contrato ya no esta disponible.';
  end if;

  if coalesce((v_contract->>'expiresAt')::numeric, 0) <= v_now then
    raise exception 'Ese contrato ya ha expirado.';
  end if;

  v_item_key := v_contract->>'itemKey';
  v_item_name := coalesce(v_contract->>'itemName', v_item_key, 'producto');
  v_qty := greatest(0, coalesce((v_contract->>'qty')::numeric, 0));
  v_inventory := coalesce(v_save->'inventory', '{}'::jsonb);
  v_have := coalesce((v_inventory->>v_item_key)::numeric, 0);

  if v_item_key is null or v_qty <= 0 then
    raise exception 'Contrato corrupto.';
  end if;

  if v_have < v_qty then
    raise exception 'Te faltan %.', v_item_name;
  end if;

  v_player := coalesce(v_save->'player', '{}'::jsonb);
  v_player_name := coalesce(v_player->>'name', 'Invitado');
  v_energy := coalesce((v_player->>'energy')::numeric, 0);
  if v_energy < 1 then
    raise exception 'Necesitas 1 de energia.';
  end if;

  v_is_territory := coalesce((v_contract->>'territoryExclusive')::boolean, false);
  if v_is_territory then
    v_territory := (
      select value
      from jsonb_array_elements(coalesce(v_save->'territories', '[]'::jsonb))
      where value->>'id' = v_contract->>'territoryId'
         or value->>'id' = (v_contract->>'territoryId')::text
      limit 1
    );

    if v_territory is null or coalesce(v_territory->>'controller', '') <> v_player_name then
      raise exception 'Ese contrato territorial ya no esta bajo tu control.';
    end if;
  end if;

  v_mult := public._astracorp_mc_contract_mult(v_save);
  v_reward_credits := round(coalesce((v_contract->'reward'->>'credits')::numeric, 0) * v_mult, 2);
  v_reward_xp := round(coalesce((v_contract->'reward'->>'xp')::numeric, 0) * v_mult)::integer;

  v_inventory := jsonb_set(v_inventory, array[v_item_key], to_jsonb(greatest(0, v_have - v_qty)), true);
  v_player := public._astracorp_mc_apply_xp(v_player, v_reward_xp);
  v_player := v_player || jsonb_build_object(
    'credits', round(coalesce((v_player->>'credits')::numeric, 0) + v_reward_credits, 2),
    'energy', greatest(0, v_energy - 1)
  );

  for v_item in
    select value from jsonb_array_elements(coalesce(v_save->'contracts', '[]'::jsonb))
  loop
    if v_item->>'id' = p_contract_id then
      v_item := v_item || jsonb_build_object('completed', true, 'completedAt', v_now);
    end if;
    v_contracts := v_contracts || jsonb_build_array(v_item);
  end loop;

  v_stats := coalesce(v_save->'stats', '{}'::jsonb);
  v_stats := v_stats || jsonb_build_object(
    'contracts', coalesce((v_stats->>'contracts')::integer, 0) + 1,
    'territoryContracts', coalesce((v_stats->>'territoryContracts')::integer, 0) + case when v_is_territory then 1 else 0 end
  );

  v_save := jsonb_set(v_save, '{inventory}', v_inventory, true);
  v_save := jsonb_set(v_save, '{player}', v_player, true);
  v_save := jsonb_set(v_save, '{contracts}', v_contracts, true);
  v_save := jsonb_set(v_save, '{stats}', v_stats, true);
  v_save := public._astracorp_mc_progress_mission(v_save, 'contract', 1);
  if v_is_territory then
    v_save := public._astracorp_mc_progress_mission(v_save, 'territory_contract', 1);
  end if;
  v_save := jsonb_set(v_save, '{confetti}', 'true'::jsonb, true);
  v_save := jsonb_set(v_save, '{note}', jsonb_build_object('msg', 'Contrato entregado: +' || v_reward_credits::text || ' creditos', 'type', 'success'), true);
  v_save := public._astracorp_mc_add_log(v_save, 'Contrato completado: ' || v_item_name || ' x' || v_qty::text || ' - +' || v_reward_credits::text || ' creditos +' || v_reward_xp::text || ' XP');
  v_save := public._astracorp_mc_store_save(v_save);

  insert into public.astracorp_mission_contract_events(user_id, event_type, ref_id, credits, xp)
  values (v_user, 'contract', p_contract_id, v_reward_credits, v_reward_xp);

  return jsonb_build_object(
    'ok', true,
    'saveData', v_save,
    'rewardCredits', v_reward_credits,
    'rewardXp', v_reward_xp,
    'message', 'Contrato entregado: +' || v_reward_credits::text || ' creditos'
  );
end;
$fn$;

create or replace function public.rpc_claim_mission_reward_secure(p_mission_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_save jsonb;
  v_mission jsonb;
  v_missions jsonb := '[]'::jsonb;
  v_item jsonb;
  v_inventory jsonb;
  v_player jsonb;
  v_resources jsonb;
  v_resource jsonb;
  v_key text;
  v_amount numeric;
  v_current numeric;
  v_progress numeric;
  v_goal numeric;
  v_reward_credits numeric;
  v_reward_xp integer;
  v_title text;
  v_resource_text text := '';
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  if nullif(trim(coalesce(p_mission_id, '')), '') is null then
    raise exception 'Mision no valida.';
  end if;

  v_save := public._astracorp_mc_load_save_locked();
  v_mission := (
    select value
    from jsonb_array_elements(coalesce(v_save->'missions', '[]'::jsonb))
    where value->>'id' = p_mission_id
    limit 1
  );

  if v_mission is null then
    raise exception 'Esta mision ya no existe.';
  end if;

  if coalesce((v_mission->>'done')::boolean, false) then
    raise exception 'Esta mision ya fue reclamada.';
  end if;

  v_progress := coalesce((v_mission->>'progress')::numeric, 0);
  v_goal := coalesce((v_mission->>'goal')::numeric, 0);
  if not coalesce((v_mission->>'readyToClaim')::boolean, false) and v_progress < v_goal then
    raise exception 'Esta mision todavia no esta lista para reclamar.';
  end if;

  v_reward_credits := round(coalesce((v_mission->'reward'->>'credits')::numeric, 0), 2);
  v_reward_xp := round(coalesce((v_mission->'reward'->>'xp')::numeric, 0))::integer;
  v_title := coalesce(v_mission->>'title', 'Mision');
  v_inventory := coalesce(v_save->'inventory', '{}'::jsonb);
  v_resources := coalesce(v_mission->'reward'->'resources', '[]'::jsonb);

  for v_resource in
    select value from jsonb_array_elements(v_resources)
  loop
    v_key := v_resource->>'key';
    v_amount := coalesce((v_resource->>'amount')::numeric, 0);
    if v_key is not null and v_amount <> 0 then
      v_current := coalesce((v_inventory->>v_key)::numeric, 0);
      v_inventory := jsonb_set(v_inventory, array[v_key], to_jsonb(round(v_current + v_amount, 2)), true);
      v_resource_text := v_resource_text || ' +' || v_amount::text || ' ' || v_key;
    end if;
  end loop;

  v_player := public._astracorp_mc_apply_xp(coalesce(v_save->'player', '{}'::jsonb), v_reward_xp);
  v_player := v_player || jsonb_build_object(
    'credits', round(coalesce((v_player->>'credits')::numeric, 0) + v_reward_credits, 2)
  );

  for v_item in
    select value from jsonb_array_elements(coalesce(v_save->'missions', '[]'::jsonb))
  loop
    if v_item->>'id' = p_mission_id then
      v_item := v_item || jsonb_build_object(
        'progress', greatest(coalesce((v_item->>'progress')::numeric, 0), coalesce((v_item->>'goal')::numeric, 0)),
        'readyToClaim', false,
        'done', true
      );
    end if;
    v_missions := v_missions || jsonb_build_array(v_item);
  end loop;

  v_save := jsonb_set(v_save, '{missions}', v_missions, true);
  v_save := jsonb_set(v_save, '{inventory}', v_inventory, true);
  v_save := jsonb_set(v_save, '{player}', v_player, true);
  v_save := jsonb_set(v_save, '{confetti}', 'true'::jsonb, true);
  v_save := jsonb_set(v_save, '{note}', jsonb_build_object('msg', 'Recompensa reclamada: +' || v_reward_credits::text || ' creditos' || v_resource_text, 'type', 'success'), true);
  v_save := public._astracorp_mc_add_log(v_save, 'Mision reclamada: ' || v_title || '. +' || v_reward_credits::text || ' creditos +' || v_reward_xp::text || ' XP' || v_resource_text);
  v_save := public._astracorp_mc_store_save(v_save);

  insert into public.astracorp_mission_contract_events(user_id, event_type, ref_id, credits, xp)
  values (v_user, 'mission', p_mission_id, v_reward_credits, v_reward_xp);

  return jsonb_build_object(
    'ok', true,
    'saveData', v_save,
    'rewardCredits', v_reward_credits,
    'rewardXp', v_reward_xp,
    'message', 'Mision reclamada: ' || v_title || v_resource_text
  );
end;
$fn$;

grant execute on function public.rpc_deliver_contract_secure(text) to authenticated;
grant execute on function public.rpc_claim_mission_reward_secure(text) to authenticated;


