-- AstraCorp - investigacion online
-- Ejecutar preferiblemente el archivo *_BLOCKS.sql por bloques en Supabase SQL Editor.

create table if not exists public.astracorp_research_events (
  id bigserial primary key,
  user_id uuid not null,
  event_type text not null,
  upgrade_key text,
  target_level integer not null default 0,
  credits numeric not null default 0,
  created_at timestamptz not null default now()
);

alter table public.astracorp_research_events enable row level security;

drop policy if exists astracorp_research_events_select_own on public.astracorp_research_events;
create policy astracorp_research_events_select_own
on public.astracorp_research_events
for select
to authenticated
using (user_id = auth.uid());

create or replace function public._astracorp_research_now_ms()
returns numeric
language sql
stable
as $fn$
  select floor(extract(epoch from clock_timestamp()) * 1000)::numeric;
$fn$;

create or replace function public._astracorp_research_meta(p_key text)
returns jsonb
language plpgsql
immutable
as $fn$
declare
  v_key text := trim(coalesce(p_key, ''));
begin
  return case v_key
    when 'field_tools' then jsonb_build_object('key','field_tools','title','Herramientas de campo','maxLevel',5,'creditsBase',34,'creditsStep',18,'timeBaseMin',4,'timeStepMin',2,'resources',jsonb_build_array(jsonb_build_object('key','mineral','base',2,'step',1)))
    when 'aux_batteries' then jsonb_build_object('key','aux_batteries','title','Baterias auxiliares','maxLevel',4,'creditsBase',42,'creditsStep',22,'timeBaseMin',5,'timeStepMin',3,'resources',jsonb_build_array(jsonb_build_object('key','energy_cells','base',2,'step',1)))
    when 'logistics' then jsonb_build_object('key','logistics','title','Logistica orbital','maxLevel',4,'creditsBase',54,'creditsStep',28,'timeBaseMin',6,'timeStepMin',3,'resources',jsonb_build_array(jsonb_build_object('key','metal_components','base',1,'step',1)))
    when 'automation' then jsonb_build_object('key','automation','title','Automatizacion basal','maxLevel',5,'creditsBase',64,'creditsStep',34,'timeBaseMin',7,'timeStepMin',4,'resources',jsonb_build_array(jsonb_build_object('key','mineral','base',3,'step',1),jsonb_build_object('key','energy_cells','base',2,'step',1)))
    when 'efficiency' then jsonb_build_object('key','efficiency','title','Protocolos de eficiencia','maxLevel',4,'creditsBase',48,'creditsStep',24,'timeBaseMin',6,'timeStepMin',3,'resources',jsonb_build_array(jsonb_build_object('key','purified_water','base',2,'step',1)))
    when 'ad_optimization' then jsonb_build_object('key','ad_optimization','title','Optimizacion publicitaria','maxLevel',4,'creditsBase',44,'creditsStep',26,'timeBaseMin',5,'timeStepMin',3,'resources',jsonb_build_array(jsonb_build_object('key','energy_cells','base',2,'step',1),jsonb_build_object('key','water','base',1,'step',1)))
    when 'frontier_doctrine' then jsonb_build_object('key','frontier_doctrine','title','Doctrina de frontera','maxLevel',4,'creditsBase',58,'creditsStep',32,'timeBaseMin',7,'timeStepMin',4,'resources',jsonb_build_array(jsonb_build_object('key','metal_components','base',2,'step',1),jsonb_build_object('key','mineral','base',3,'step',1)))
    when 'defense_grid' then jsonb_build_object('key','defense_grid','title','Malla defensiva','maxLevel',4,'creditsBase',56,'creditsStep',30,'timeBaseMin',7,'timeStepMin',4,'resources',jsonb_build_array(jsonb_build_object('key','energy_cells','base',3,'step',1),jsonb_build_object('key','purified_water','base',2,'step',1)))
    when 'territorial_governance' then jsonb_build_object('key','territorial_governance','title','Gobernanza territorial','maxLevel',4,'creditsBase',68,'creditsStep',36,'timeBaseMin',8,'timeStepMin',5,'resources',jsonb_build_array(jsonb_build_object('key','oxygen_tanks','base',1,'step',1),jsonb_build_object('key','alloy_frames','base',1,'step',1)))
    else null
  end;
end;
$fn$;

create or replace function public._astracorp_research_planet_time_mult(p_planet text)
returns numeric
language plpgsql
immutable
as $fn$
begin
  return case coalesce(p_planet, 'nexus-prime')
    when 'solara' then 0.96
    when 'kryos' then 0.82
    when 'aethon' then 1.02
    when 'thalassa' then 0.9
    when 'duskara' then 1.04
    else 1
  end;
end;
$fn$;

create or replace function public._astracorp_research_lab_time_mult(p_save jsonb)
returns numeric
language plpgsql
stable
as $fn$
declare
  v_lab_count integer := 0;
  v_planet text := coalesce(p_save->'player'->>'currentPlanet', p_save->'player'->>'planet', 'nexus-prime');
begin
  v_lab_count := (
    select count(*)::integer
    from jsonb_array_elements(coalesce(p_save->'companies', '[]'::jsonb)) company
    where coalesce(company.value->>'companyType', company.value->>'type') = 'research_lab'
      and coalesce(company.value->>'status', '') <> 'occupied'
      and coalesce((company.value->>'active')::boolean, true) <> false
  );

  return greatest(0.55, (1 - v_lab_count * 0.1) * public._astracorp_research_planet_time_mult(v_planet));
end;
$fn$;

create or replace function public._astracorp_research_ad_factor(p_save jsonb)
returns numeric
language plpgsql
immutable
as $fn$
declare
  v_research jsonb := coalesce(p_save->'research', '{}'::jsonb);
  v_ad_level numeric := greatest(0, coalesce((v_research->>'ad_optimization')::numeric, 0));
begin
  return greatest(0.4, greatest(0.35, 0.6 - v_ad_level * 0.05) + 0.05);
end;
$fn$;

create or replace function public._astracorp_research_energy_cost(p_save jsonb, p_base numeric)
returns integer
language plpgsql
immutable
as $fn$
declare
  v_research jsonb := coalesce(p_save->'research', '{}'::jsonb);
  v_hq jsonb := coalesce(p_save->'hq', '{}'::jsonb);
  v_efficiency numeric := greatest(0, coalesce((v_research->>'efficiency')::numeric, 0));
  v_operations numeric := greatest(0, coalesce((v_hq->>'operations_room')::numeric, 0));
  v_discount numeric;
begin
  v_discount := least(0.55, least(0.4, v_efficiency * 0.1) + least(0.28, v_operations * 0.04));
  return greatest(0, ceil(coalesce(p_base, 0) * (1 - v_discount))::integer);
end;
$fn$;

create or replace function public._astracorp_research_company_boost_mult(p_research jsonb)
returns numeric
language plpgsql
immutable
as $fn$
declare
  v_ad_level numeric := greatest(0, coalesce((p_research->>'ad_optimization')::numeric, 0));
begin
  return 1.5 + v_ad_level * 0.15;
end;
$fn$;

create or replace function public._astracorp_research_apply_player_energy(p_player jsonb, p_research jsonb, p_bonus numeric)
returns jsonb
language plpgsql
immutable
as $fn$
declare
  v_player jsonb := coalesce(p_player, '{}'::jsonb);
  v_aux_level numeric := greatest(0, coalesce((p_research->>'aux_batteries')::numeric, 0));
  v_max numeric := 100 + v_aux_level * 12;
  v_energy numeric := coalesce((v_player->>'energy')::numeric, 0) + coalesce(p_bonus, 0);
begin
  return v_player || jsonb_build_object('maxEnergy', v_max, 'energy', least(v_max, v_energy));
end;
$fn$;

create or replace function public._astracorp_research_load_save_locked()
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

create or replace function public._astracorp_research_store_save(p_save jsonb)
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

create or replace function public._astracorp_research_add_log(p_save jsonb, p_msg text)
returns jsonb
language plpgsql
volatile
as $fn$
declare
  v_log jsonb := coalesce(p_save->'log', '[]'::jsonb);
  v_entry jsonb := jsonb_build_object('msg', p_msg, 't', public._astracorp_research_now_ms());
begin
  return jsonb_set(p_save, '{log}', jsonb_build_array(v_entry) || v_log, true);
end;
$fn$;

create or replace function public.rpc_start_research_secure(p_upgrade_key text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_save jsonb;
  v_meta jsonb;
  v_research jsonb;
  v_inventory jsonb;
  v_player jsonb;
  v_project jsonb;
  v_project_resources jsonb := '[]'::jsonb;
  v_resource jsonb;
  v_now numeric := public._astracorp_research_now_ms();
  v_key text;
  v_title text;
  v_level integer;
  v_max_level integer;
  v_credits numeric;
  v_time_min integer;
  v_base_time numeric;
  v_required numeric;
  v_have numeric;
  v_res_key text;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  v_meta := public._astracorp_research_meta(p_upgrade_key);
  if v_meta is null then
    raise exception 'Mejora no disponible.';
  end if;

  v_save := public._astracorp_research_load_save_locked();
  if v_save->'researchProjects'->'active' is not null and v_save->'researchProjects'->'active' <> 'null'::jsonb then
    raise exception 'Ya tienes una investigacion en marcha.';
  end if;

  v_key := v_meta->>'key';
  v_title := v_meta->>'title';
  v_research := coalesce(v_save->'research', '{}'::jsonb);
  v_inventory := coalesce(v_save->'inventory', '{}'::jsonb);
  v_player := coalesce(v_save->'player', '{}'::jsonb);
  v_level := greatest(0, coalesce((v_research->>v_key)::integer, 0));
  v_max_level := coalesce((v_meta->>'maxLevel')::integer, 0);

  if v_level >= v_max_level then
    raise exception 'Esa mejora ya esta al maximo.';
  end if;

  v_credits := coalesce((v_meta->>'creditsBase')::numeric, 0) + coalesce((v_meta->>'creditsStep')::numeric, 0) * v_level;
  if coalesce((v_player->>'credits')::numeric, 0) < v_credits then
    raise exception 'Necesitas % creditos.', v_credits;
  end if;

  for v_resource in
    select value from jsonb_array_elements(coalesce(v_meta->'resources', '[]'::jsonb))
  loop
    v_res_key := v_resource->>'key';
    v_required := coalesce((v_resource->>'base')::numeric, 0) + coalesce((v_resource->>'step')::numeric, 0) * v_level;
    v_have := coalesce((v_inventory->>v_res_key)::numeric, 0);
    if v_have < v_required then
      raise exception 'No tienes suficientes recursos para esa mejora.';
    end if;
  end loop;

  for v_resource in
    select value from jsonb_array_elements(coalesce(v_meta->'resources', '[]'::jsonb))
  loop
    v_res_key := v_resource->>'key';
    v_required := coalesce((v_resource->>'base')::numeric, 0) + coalesce((v_resource->>'step')::numeric, 0) * v_level;
    v_have := coalesce((v_inventory->>v_res_key)::numeric, 0);
    v_inventory := jsonb_set(v_inventory, array[v_res_key], to_jsonb(greatest(0, v_have - v_required)), true);
    v_project_resources := v_project_resources || jsonb_build_array(jsonb_build_object('key', v_res_key, 'amount', v_required));
  end loop;

  v_base_time := coalesce((v_meta->>'timeBaseMin')::numeric, 0) + coalesce((v_meta->>'timeStepMin')::numeric, 0) * v_level;
  v_time_min := greatest(1, ceil(v_base_time * public._astracorp_research_lab_time_mult(v_save))::integer);
  v_project := jsonb_build_object(
    'key', v_key,
    'title', v_title,
    'level', v_level + 1,
    'credits', v_credits,
    'timeMin', v_time_min,
    'adBoostUsed', false,
    'resources', v_project_resources,
    'startedAt', v_now,
    'endsAt', v_now + v_time_min * 60 * 1000
  );

  v_player := v_player || jsonb_build_object('credits', round(coalesce((v_player->>'credits')::numeric, 0) - v_credits, 2));
  v_save := jsonb_set(v_save, '{player}', v_player, true);
  v_save := jsonb_set(v_save, '{inventory}', v_inventory, true);
  v_save := jsonb_set(v_save, '{researchProjects}', jsonb_build_object('active', v_project), true);
  v_save := jsonb_set(v_save, '{note}', jsonb_build_object('msg', v_title || ' en investigacion', 'type', 'warn'), true);
  v_save := public._astracorp_research_add_log(v_save, 'Investigacion iniciada: ' || v_title || ' - nivel ' || (v_level + 1)::text || ' - ' || v_time_min::text || ' min');
  v_save := public._astracorp_research_store_save(v_save);

  insert into public.astracorp_research_events(user_id, event_type, upgrade_key, target_level, credits)
  values (v_user, 'start', v_key, v_level + 1, v_credits);

  return jsonb_build_object('ok', true, 'saveData', v_save, 'message', 'Investigacion iniciada: ' || v_title);
end;
$fn$;

create or replace function public.rpc_boost_research_secure()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_save jsonb;
  v_project jsonb;
  v_player jsonb;
  v_now numeric := public._astracorp_research_now_ms();
  v_remaining numeric;
  v_reduced numeric;
  v_energy_cost integer;
  v_energy numeric;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  v_save := public._astracorp_research_load_save_locked();
  v_project := v_save->'researchProjects'->'active';
  if v_project is null or v_project = 'null'::jsonb then
    raise exception 'Necesitas una investigacion activa para acelerar.';
  end if;
  if coalesce((v_project->>'adBoostUsed')::boolean, false) then
    raise exception 'Esa investigacion ya recibio un impulso por anuncio.';
  end if;

  v_player := coalesce(v_save->'player', '{}'::jsonb);
  v_energy_cost := public._astracorp_research_energy_cost(v_save, 1);
  v_energy := coalesce((v_player->>'energy')::numeric, 0);
  if v_energy < v_energy_cost then
    raise exception 'Necesitas % de energia.', v_energy_cost;
  end if;

  v_remaining := greatest(0, coalesce((v_project->>'endsAt')::numeric, v_now) - v_now);
  v_reduced := greatest(60000, round(v_remaining * public._astracorp_research_ad_factor(v_save)));
  v_project := v_project || jsonb_build_object('adBoostUsed', true, 'endsAt', v_now + v_reduced);
  v_player := v_player || jsonb_build_object('energy', greatest(0, v_energy - v_energy_cost));

  v_save := jsonb_set(v_save, '{player}', v_player, true);
  v_save := jsonb_set(v_save, '{researchProjects}', jsonb_build_object('active', v_project), true);
  v_save := jsonb_set(v_save, '{note}', jsonb_build_object('msg', 'Investigacion acelerada: ' || coalesce(v_project->>'title', 'Proyecto'), 'type', 'success'), true);
  v_save := public._astracorp_research_add_log(v_save, 'Impulso de investigacion activado en ' || coalesce(v_project->>'title', 'Proyecto'));
  v_save := public._astracorp_research_store_save(v_save);

  insert into public.astracorp_research_events(user_id, event_type, upgrade_key, target_level)
  values (v_user, 'boost', v_project->>'key', coalesce((v_project->>'level')::integer, 0));

  return jsonb_build_object('ok', true, 'saveData', v_save, 'message', 'Investigacion acelerada por anuncio.');
end;
$fn$;

create or replace function public.rpc_complete_research_secure()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_save jsonb;
  v_project jsonb;
  v_research jsonb;
  v_player jsonb;
  v_ad_boosts jsonb;
  v_key text;
  v_title text;
  v_now numeric := public._astracorp_research_now_ms();
  v_current_level integer;
  v_next_level integer;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  v_save := public._astracorp_research_load_save_locked();
  v_project := v_save->'researchProjects'->'active';
  if v_project is null or v_project = 'null'::jsonb then
    raise exception 'No hay investigacion activa.';
  end if;
  if v_now < coalesce((v_project->>'endsAt')::numeric, 0) then
    raise exception 'La investigacion todavia no ha terminado.';
  end if;

  v_key := v_project->>'key';
  v_title := coalesce(v_project->>'title', 'Investigacion');
  v_research := coalesce(v_save->'research', '{}'::jsonb);
  v_current_level := greatest(0, coalesce((v_research->>v_key)::integer, 0));
  v_next_level := greatest(v_current_level + 1, coalesce((v_project->>'level')::integer, v_current_level + 1));
  v_research := jsonb_set(v_research, array[v_key], to_jsonb(v_next_level), true);

  v_ad_boosts := coalesce(v_save->'adBoosts', '{}'::jsonb) || jsonb_build_object('companyBoostMultiplier', public._astracorp_research_company_boost_mult(v_research));
  v_player := public._astracorp_research_apply_player_energy(coalesce(v_save->'player', '{}'::jsonb), v_research, 6);

  v_save := jsonb_set(v_save, '{research}', v_research, true);
  v_save := jsonb_set(v_save, '{researchProjects}', jsonb_build_object('active', 'null'::jsonb), true);
  v_save := jsonb_set(v_save, '{adBoosts}', v_ad_boosts, true);
  v_save := jsonb_set(v_save, '{player}', v_player, true);
  v_save := jsonb_set(v_save, '{confetti}', 'true'::jsonb, true);
  v_save := jsonb_set(v_save, '{note}', jsonb_build_object('msg', 'Investigacion completada: ' || v_title, 'type', 'success'), true);
  v_save := public._astracorp_research_add_log(v_save, 'Investigacion completada: ' || v_title || ' nivel ' || v_next_level::text);
  v_save := public._astracorp_research_store_save(v_save);

  insert into public.astracorp_research_events(user_id, event_type, upgrade_key, target_level)
  values (v_user, 'complete', v_key, v_next_level);

  return jsonb_build_object('ok', true, 'saveData', v_save, 'message', 'Investigacion completada: ' || v_title);
end;
$fn$;

grant execute on function public.rpc_start_research_secure(text) to authenticated;
grant execute on function public.rpc_boost_research_secure() to authenticated;
grant execute on function public.rpc_complete_research_secure() to authenticated;



