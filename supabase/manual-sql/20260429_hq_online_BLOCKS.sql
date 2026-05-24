-- AstraCorp - sede online por bloques
-- Copia y ejecuta un bloque cada vez en Supabase SQL Editor.
-- No mezcles varios bloques si Supabase empieza a anadir texto automaticamente.

-- ============================================================
-- BLOQUE 1
-- ============================================================
-- AstraCorp - sede e integridad online
-- Ejecutar preferiblemente el archivo *_BLOCKS.sql por bloques en Supabase SQL Editor.

create table if not exists public.astracorp_hq_events (
  id bigserial primary key,
  user_id uuid not null,
  event_type text not null,
  ref_key text,
  level integer not null default 0,
  credits numeric not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- BLOQUE 2
-- ============================================================
alter table public.astracorp_hq_events enable row level security;

-- ============================================================
-- BLOQUE 3
-- ============================================================
drop policy if exists astracorp_hq_events_select_own on public.astracorp_hq_events;

-- ============================================================
-- BLOQUE 4
-- ============================================================
create policy astracorp_hq_events_select_own
on public.astracorp_hq_events
for select
to authenticated
using (user_id = auth.uid());

-- ============================================================
-- BLOQUE 5
-- ============================================================
create or replace function public._astracorp_hq_now_ms()
returns numeric
language sql
stable
as $fn$
  select floor(extract(epoch from clock_timestamp()) * 1000)::numeric;
$fn$;

-- ============================================================
-- BLOQUE 6
-- ============================================================
create or replace function public._astracorp_hq_meta(p_key text)
returns jsonb
language plpgsql
immutable
as $fn$
declare
  v_key text := trim(coalesce(p_key, ''));
begin
  return case v_key
    when 'logistics_center' then jsonb_build_object('key','logistics_center','name','Centro logistico','maxLevel',5,'baseCost',14,'primary','mineral','secondary','metal_components','advanced','alloy_frames','elite','habitat_modules')
    when 'trade_desk' then jsonb_build_object('key','trade_desk','name','Departamento comercial','maxLevel',5,'baseCost',16,'primary','water','secondary','energy_cells','advanced','metal_components','elite','habitat_modules')
    when 'operations_room' then jsonb_build_object('key','operations_room','name','Sala de operaciones','maxLevel',5,'baseCost',18,'primary','energy_cells','secondary','metal_components','advanced','alloy_frames','elite','oxygen_tanks')
    when 'defense_office' then jsonb_build_object('key','defense_office','name','Oficina defensiva','maxLevel',5,'baseCost',18,'primary','mineral','secondary','metal_components','advanced','alloy_frames','elite','oxygen_tanks')
    when 'war_room' then jsonb_build_object('key','war_room','name','Sala tactica','maxLevel',5,'baseCost',20,'primary','mineral','secondary','metal_components','advanced','alloy_frames','elite','habitat_modules')
    else null
  end;
end;
$fn$;

-- ============================================================
-- BLOQUE 7
-- ============================================================
create or replace function public._astracorp_hq_cost(p_key text, p_level integer)
returns jsonb
language plpgsql
immutable
as $fn$
declare
  v_meta jsonb := public._astracorp_hq_meta(p_key);
  v_level integer := greatest(0, coalesce(p_level, 0));
  v_next integer := v_level + 1;
  v_credits numeric;
  v_resources jsonb := '[]'::jsonb;
begin
  if v_meta is null then
    return jsonb_build_object('credits', 0, 'resources', '[]'::jsonb);
  end if;

  v_credits := round(coalesce((v_meta->>'baseCost')::numeric, 10) * power(v_next::numeric, 2.05) * (1 + v_level * 0.18));

  if v_next >= 2 then
    v_resources := v_resources || jsonb_build_array(jsonb_build_object('key', v_meta->>'primary', 'amount', ceil(4 * power(v_next::numeric, 1.35))));
  end if;
  if v_next >= 3 then
    v_resources := v_resources || jsonb_build_array(jsonb_build_object('key', v_meta->>'secondary', 'amount', ceil(2 * power(v_next::numeric, 1.25))));
  end if;
  if v_next >= 4 then
    v_resources := v_resources || jsonb_build_array(jsonb_build_object('key', v_meta->>'advanced', 'amount', ceil(1 * power(v_next::numeric, 1.15))));
  end if;
  if v_next >= 5 then
    v_resources := v_resources || jsonb_build_array(jsonb_build_object('key', v_meta->>'elite', 'amount', 2));
  end if;

  return jsonb_build_object('credits', v_credits, 'resources', v_resources);
end;
$fn$;

-- ============================================================
-- BLOQUE 8
-- ============================================================
create or replace function public._astracorp_hq_repair_cost(p_player jsonb)
returns jsonb
language plpgsql
immutable
as $fn$
declare
  v_health numeric := greatest(0, least(100, coalesce((p_player->>'health')::numeric, 100)));
  v_missing numeric := greatest(0, 100 - v_health);
  v_restore numeric := least(30, v_missing);
  v_tier integer := ceil(v_restore / 10.0)::integer;
  v_resources jsonb := '[]'::jsonb;
  v_credits numeric;
begin
  v_credits := greatest(0, ceil(v_restore * 0.45 + v_tier * 2));
  if v_restore > 0 then
    v_resources := v_resources || jsonb_build_array(jsonb_build_object('key','water','amount',greatest(1, v_tier * 2)));
    if v_health < 60 then
      v_resources := v_resources || jsonb_build_array(jsonb_build_object('key','purified_water','amount',v_tier));
    end if;
    if v_health < 35 then
      v_resources := v_resources || jsonb_build_array(jsonb_build_object('key','oxygen_tanks','amount',1));
    end if;
  end if;

  return jsonb_build_object('restore', v_restore, 'credits', v_credits, 'resources', v_resources);
end;
$fn$;

-- ============================================================
-- BLOQUE 9
-- ============================================================
create or replace function public._astracorp_hq_planet_meta(p_id text)
returns jsonb
language plpgsql
immutable
as $fn$
declare
  v_id text := trim(coalesce(p_id, ''));
begin
  return case v_id
    when 'nexus-prime' then jsonb_build_object('id','nexus-prime','name','Nexus Prime','travelCost',0,'travelResources','[]'::jsonb,'unlock',jsonb_build_object('level',1,'credits',0,'companies',0,'contracts',0,'territoryContracts',0,'territories',0,'hqLevel',0,'researchTotal',0))
    when 'veyron' then jsonb_build_object('id','veyron','name','Veyron','travelCost',450,'travelResources',jsonb_build_array(jsonb_build_object('key','metal_components','amount',20),jsonb_build_object('key','oxygen_tanks','amount',4)),'unlock',jsonb_build_object('level',10,'credits',450,'companies',5,'contracts',3,'territoryContracts',3,'territories',8,'hqLevel',4,'researchTotal',4))
    when 'solara' then jsonb_build_object('id','solara','name','Solara','travelCost',900,'travelResources',jsonb_build_array(jsonb_build_object('key','purified_water','amount',30),jsonb_build_object('key','oxygen_tanks','amount',8)),'unlock',jsonb_build_object('level',11,'credits',900,'companies',6,'contracts',5,'territoryContracts',4,'territories',9,'hqLevel',6,'researchTotal',6))
    when 'kryos' then jsonb_build_object('id','kryos','name','Kryos','travelCost',1600,'travelResources',jsonb_build_array(jsonb_build_object('key','energy_cells','amount',80),jsonb_build_object('key','metal_components','amount',35),jsonb_build_object('key','alloy_frames','amount',6)),'unlock',jsonb_build_object('level',12,'credits',1600,'companies',7,'contracts',7,'territoryContracts',5,'territories',10,'hqLevel',8,'researchTotal',8))
    when 'aethon' then jsonb_build_object('id','aethon','name','Aethon','travelCost',2800,'travelResources',jsonb_build_array(jsonb_build_object('key','mineral','amount',160),jsonb_build_object('key','alloy_frames','amount',14)),'unlock',jsonb_build_object('level',13,'credits',2800,'companies',8,'contracts',9,'territoryContracts',6,'territories',10,'hqLevel',10,'researchTotal',10))
    when 'noctis' then jsonb_build_object('id','noctis','name','Noctis','travelCost',4800,'travelResources',jsonb_build_array(jsonb_build_object('key','metal_components','amount',80),jsonb_build_object('key','habitat_modules','amount',6)),'unlock',jsonb_build_object('level',14,'credits',4800,'companies',9,'contracts',11,'territoryContracts',7,'territories',11,'hqLevel',12,'researchTotal',12))
    when 'thalassa' then jsonb_build_object('id','thalassa','name','Thalassa','travelCost',7600,'travelResources',jsonb_build_array(jsonb_build_object('key','purified_water','amount',120),jsonb_build_object('key','oxygen_tanks','amount',24),jsonb_build_object('key','habitat_modules','amount',8)),'unlock',jsonb_build_object('level',15,'credits',7600,'companies',10,'contracts',14,'territoryContracts',8,'territories',11,'hqLevel',14,'researchTotal',14))
    when 'duskara' then jsonb_build_object('id','duskara','name','Duskara','travelCost',12000,'travelResources',jsonb_build_array(jsonb_build_object('key','alloy_frames','amount',42),jsonb_build_object('key','habitat_modules','amount',14)),'unlock',jsonb_build_object('level',16,'credits',12000,'companies',12,'contracts',18,'territoryContracts',10,'territories',12,'hqLevel',16,'researchTotal',16))
    else null
  end;
end;
$fn$;

-- ============================================================
-- BLOQUE 10
-- ============================================================
create or replace function public._astracorp_hq_total(p_hq jsonb)
returns integer
language sql
immutable
as $fn$
  select coalesce(sum(greatest(0, value::int)), 0)::integer from jsonb_each_text(coalesce(p_hq, '{}'::jsonb));
$fn$;

-- ============================================================
-- BLOQUE 11
-- ============================================================
create or replace function public._astracorp_hq_research_total(p_research jsonb)
returns integer
language sql
immutable
as $fn$
  select coalesce(sum(greatest(0, value::int)), 0)::integer from jsonb_each_text(coalesce(p_research, '{}'::jsonb));
$fn$;

-- ============================================================
-- BLOQUE 12
-- ============================================================
create or replace function public._astracorp_hq_controlled_territories(p_save jsonb)
returns integer
language sql
stable
as $fn$
  select count(*)::integer
  from jsonb_array_elements(coalesce(p_save->'territories', '[]'::jsonb)) territory
  where territory.value->>'controller' = coalesce(p_save->'player'->>'name', 'Invitado');
$fn$;

-- ============================================================
-- BLOQUE 13
-- ============================================================
create or replace function public._astracorp_hq_load_save_locked()
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

-- ============================================================
-- BLOQUE 14
-- ============================================================
create or replace function public._astracorp_hq_store_save(p_save jsonb)
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

-- ============================================================
-- BLOQUE 15
-- ============================================================
create or replace function public._astracorp_hq_add_log(p_save jsonb, p_msg text)
returns jsonb
language plpgsql
volatile
as $fn$
declare
  v_log jsonb := coalesce(p_save->'log', '[]'::jsonb);
  v_entry jsonb := jsonb_build_object('msg', p_msg, 't', public._astracorp_hq_now_ms());
begin
  return jsonb_set(p_save, '{log}', jsonb_build_array(v_entry) || v_log, true);
end;
$fn$;

-- ============================================================
-- BLOQUE 16
-- ============================================================
create or replace function public.rpc_upgrade_hq_secure(p_upgrade_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_save jsonb;
  v_meta jsonb;
  v_cost jsonb;
  v_hq jsonb;
  v_inventory jsonb;
  v_player jsonb;
  v_resource jsonb;
  v_key text;
  v_name text;
  v_level integer;
  v_max_level integer;
  v_credits numeric;
  v_res_key text;
  v_required numeric;
  v_have numeric;
  v_resource_text text := '';
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  v_meta := public._astracorp_hq_meta(p_upgrade_key);
  if v_meta is null then
    raise exception 'Mejora de sede no valida.';
  end if;

  v_save := public._astracorp_hq_load_save_locked();
  v_key := v_meta->>'key';
  v_name := v_meta->>'name';
  v_hq := coalesce(v_save->'hq', '{}'::jsonb);
  v_inventory := coalesce(v_save->'inventory', '{}'::jsonb);
  v_player := coalesce(v_save->'player', '{}'::jsonb);
  v_level := greatest(0, coalesce((v_hq->>v_key)::integer, 0));
  v_max_level := coalesce((v_meta->>'maxLevel')::integer, 5);

  if v_level >= v_max_level then
    raise exception 'Esa mejora ya esta al maximo.';
  end if;

  v_cost := public._astracorp_hq_cost(v_key, v_level);
  v_credits := coalesce((v_cost->>'credits')::numeric, 0);
  if coalesce((v_player->>'credits')::numeric, 0) < v_credits then
    raise exception 'Necesitas % creditos.', v_credits;
  end if;

  for v_resource in select value from jsonb_array_elements(coalesce(v_cost->'resources', '[]'::jsonb)) loop
    v_res_key := v_resource->>'key';
    v_required := coalesce((v_resource->>'amount')::numeric, 0);
    v_have := coalesce((v_inventory->>v_res_key)::numeric, 0);
    if v_have < v_required then
      raise exception 'Faltan recursos para la sede: % %.', v_required, v_res_key;
    end if;
  end loop;

  for v_resource in select value from jsonb_array_elements(coalesce(v_cost->'resources', '[]'::jsonb)) loop
    v_res_key := v_resource->>'key';
    v_required := coalesce((v_resource->>'amount')::numeric, 0);
    v_have := coalesce((v_inventory->>v_res_key)::numeric, 0);
    v_inventory := jsonb_set(v_inventory, array[v_res_key], to_jsonb(round(greatest(0, v_have - v_required), 2)), true);
    v_resource_text := v_resource_text || ' + ' || v_required::text || ' ' || v_res_key;
  end loop;

  v_hq := v_hq || jsonb_build_object(v_key, v_level + 1);
  v_player := v_player || jsonb_build_object('credits', round(coalesce((v_player->>'credits')::numeric, 0) - v_credits, 2));
  v_save := jsonb_set(v_save, '{hq}', v_hq, true);
  v_save := jsonb_set(v_save, '{inventory}', v_inventory, true);
  v_save := jsonb_set(v_save, '{player}', v_player, true);
  v_save := jsonb_set(v_save, '{confetti}', 'true'::jsonb, true);
  v_save := jsonb_set(v_save, '{note}', jsonb_build_object('msg', v_name || ' nivel ' || (v_level + 1)::text, 'type', 'success'), true);
  v_save := public._astracorp_hq_add_log(v_save, 'Sede mejorada: ' || v_name || ' nivel ' || (v_level + 1)::text || ' (-' || v_credits::text || ' creditos' || v_resource_text || ')');
  v_save := public._astracorp_hq_store_save(v_save);

  insert into public.astracorp_hq_events(user_id, event_type, ref_key, level, credits)
  values (v_user, 'upgrade', v_key, v_level + 1, v_credits);

  return jsonb_build_object('ok', true, 'saveData', v_save, 'message', v_name || ' mejorada');
end;
$fn$;

-- ============================================================
-- BLOQUE 17
-- ============================================================
create or replace function public.rpc_repair_integrity_secure()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_save jsonb;
  v_repair jsonb;
  v_player jsonb;
  v_inventory jsonb;
  v_resource jsonb;
  v_restore numeric;
  v_credits numeric;
  v_res_key text;
  v_required numeric;
  v_have numeric;
  v_resource_text text := '';
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  v_save := public._astracorp_hq_load_save_locked();
  v_player := coalesce(v_save->'player', '{}'::jsonb);
  v_inventory := coalesce(v_save->'inventory', '{}'::jsonb);
  v_repair := public._astracorp_hq_repair_cost(v_player);
  v_restore := coalesce((v_repair->>'restore')::numeric, 0);
  v_credits := coalesce((v_repair->>'credits')::numeric, 0);

  if v_restore <= 0 then
    raise exception 'La integridad ya esta al maximo.';
  end if;
  if coalesce((v_player->>'credits')::numeric, 0) < v_credits then
    raise exception 'Necesitas % creditos.', v_credits;
  end if;

  for v_resource in select value from jsonb_array_elements(coalesce(v_repair->'resources', '[]'::jsonb)) loop
    v_res_key := v_resource->>'key';
    v_required := coalesce((v_resource->>'amount')::numeric, 0);
    v_have := coalesce((v_inventory->>v_res_key)::numeric, 0);
    if v_have < v_required then
      raise exception 'Faltan recursos para reparar: % %.', v_required, v_res_key;
    end if;
  end loop;

  for v_resource in select value from jsonb_array_elements(coalesce(v_repair->'resources', '[]'::jsonb)) loop
    v_res_key := v_resource->>'key';
    v_required := coalesce((v_resource->>'amount')::numeric, 0);
    v_have := coalesce((v_inventory->>v_res_key)::numeric, 0);
    v_inventory := jsonb_set(v_inventory, array[v_res_key], to_jsonb(round(greatest(0, v_have - v_required), 2)), true);
    v_resource_text := v_resource_text || ' + ' || v_required::text || ' ' || v_res_key;
  end loop;

  v_player := v_player || jsonb_build_object(
    'credits', round(coalesce((v_player->>'credits')::numeric, 0) - v_credits, 2),
    'health', least(100, coalesce((v_player->>'health')::numeric, 100) + v_restore)
  );
  v_save := jsonb_set(v_save, '{inventory}', v_inventory, true);
  v_save := jsonb_set(v_save, '{player}', v_player, true);
  v_save := jsonb_set(v_save, '{note}', jsonb_build_object('msg', 'Integridad +' || v_restore::text, 'type', 'success'), true);
  v_save := public._astracorp_hq_add_log(v_save, 'Integridad reparada: +' || v_restore::text || ' (-' || v_credits::text || ' creditos' || v_resource_text || ')');
  v_save := public._astracorp_hq_store_save(v_save);

  insert into public.astracorp_hq_events(user_id, event_type, ref_key, credits)
  values (v_user, 'repair', 'integrity', v_credits);

  return jsonb_build_object('ok', true, 'saveData', v_save, 'message', 'Integridad reparada.');
end;
$fn$;

-- ============================================================
-- BLOQUE 18
-- ============================================================
create or replace function public.rpc_select_planet_secure(p_planet_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_save jsonb;
  v_planet jsonb;
  v_unlock jsonb;
  v_player jsonb;
  v_inventory jsonb;
  v_resource jsonb;
  v_current text;
  v_planet_id text;
  v_name text;
  v_travel_cost numeric;
  v_res_key text;
  v_required numeric;
  v_have numeric;
  v_level integer;
  v_company_count integer;
  v_controlled integer;
  v_hq_level integer;
  v_research_total integer;
  v_contracts integer;
  v_territory_contracts integer;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  v_planet := public._astracorp_hq_planet_meta(p_planet_id);
  if v_planet is null then
    raise exception 'Planeta no valido.';
  end if;

  v_save := public._astracorp_hq_load_save_locked();
  v_player := coalesce(v_save->'player', '{}'::jsonb);
  v_inventory := coalesce(v_save->'inventory', '{}'::jsonb);
  v_current := coalesce(v_player->>'currentPlanet', v_player->>'planet', 'nexus-prime');
  v_planet_id := v_planet->>'id';
  v_name := v_planet->>'name';

  if v_planet_id = v_current then
    raise exception 'Ya operas desde %.', v_name;
  end if;

  v_unlock := coalesce(v_planet->'unlock', '{}'::jsonb);
  v_level := coalesce((v_player->>'level')::integer, 1);
  v_company_count := jsonb_array_length(coalesce(v_save->'companies', '[]'::jsonb));
  v_controlled := public._astracorp_hq_controlled_territories(v_save);
  v_hq_level := public._astracorp_hq_total(v_save->'hq');
  v_research_total := public._astracorp_hq_research_total(v_save->'research');
  v_contracts := coalesce((v_save->'stats'->>'contracts')::integer, 0);
  v_territory_contracts := coalesce((v_save->'stats'->>'territoryContracts')::integer, 0);

  if v_level < coalesce((v_unlock->>'level')::integer, 1)
     or coalesce((v_player->>'credits')::numeric, 0) < coalesce((v_unlock->>'credits')::numeric, 0)
     or v_company_count < coalesce((v_unlock->>'companies')::integer, 0)
     or v_contracts < coalesce((v_unlock->>'contracts')::integer, 0)
     or v_territory_contracts < coalesce((v_unlock->>'territoryContracts')::integer, 0)
     or v_controlled < coalesce((v_unlock->>'territories')::integer, 0)
     or v_hq_level < coalesce((v_unlock->>'hqLevel')::integer, 0)
     or v_research_total < coalesce((v_unlock->>'researchTotal')::integer, 0) then
    raise exception 'Aun no puedes viajar a %.', v_name;
  end if;

  v_travel_cost := coalesce((v_planet->>'travelCost')::numeric, 0);
  if coalesce((v_player->>'credits')::numeric, 0) < v_travel_cost then
    raise exception 'Necesitas % creditos para viajar.', v_travel_cost;
  end if;

  for v_resource in select value from jsonb_array_elements(coalesce(v_planet->'travelResources', '[]'::jsonb)) loop
    v_res_key := v_resource->>'key';
    v_required := coalesce((v_resource->>'amount')::numeric, 0);
    v_have := coalesce((v_inventory->>v_res_key)::numeric, 0);
    if v_have < v_required then
      raise exception 'Necesitas % % para viajar.', v_required, v_res_key;
    end if;
  end loop;

  for v_resource in select value from jsonb_array_elements(coalesce(v_planet->'travelResources', '[]'::jsonb)) loop
    v_res_key := v_resource->>'key';
    v_required := coalesce((v_resource->>'amount')::numeric, 0);
    v_have := coalesce((v_inventory->>v_res_key)::numeric, 0);
    v_inventory := jsonb_set(v_inventory, array[v_res_key], to_jsonb(round(greatest(0, v_have - v_required), 2)), true);
  end loop;

  v_player := v_player || jsonb_build_object(
    'planet', v_planet_id,
    'currentPlanet', v_planet_id,
    'currentPlanetName', v_name,
    'currentRegion', coalesce(v_player->>'currentRegion', 'alpha-district'),
    'credits', round(coalesce((v_player->>'credits')::numeric, 0) - v_travel_cost, 2)
  );
  v_save := jsonb_set(v_save, '{player}', v_player, true);
  v_save := jsonb_set(v_save, '{inventory}', v_inventory, true);
  v_save := jsonb_set(v_save, '{contracts}', '[]'::jsonb, true);
  v_save := jsonb_set(v_save, '{confetti}', 'true'::jsonb, true);
  v_save := jsonb_set(v_save, '{note}', jsonb_build_object('msg', 'Destino fijado: ' || v_name, 'type', 'success'), true);
  v_save := public._astracorp_hq_add_log(v_save, 'Viaje orbital completado hacia ' || v_name || ' -' || v_travel_cost::text || ' creditos');
  v_save := public._astracorp_hq_store_save(v_save);

  insert into public.astracorp_hq_events(user_id, event_type, ref_key, credits)
  values (v_user, 'planet', v_planet_id, v_travel_cost);

  return jsonb_build_object('ok', true, 'saveData', v_save, 'message', 'Destino fijado: ' || v_name);
end;
$fn$;

-- ============================================================
-- BLOQUE 19
-- ============================================================
grant execute on function public.rpc_upgrade_hq_secure(text) to authenticated;

-- ============================================================
-- BLOQUE 20
-- ============================================================
grant execute on function public.rpc_repair_integrity_secure() to authenticated;

-- ============================================================
-- BLOQUE 21
-- ============================================================
grant execute on function public.rpc_select_planet_secure(text) to authenticated;

