-- AstraCorp - costes geometricos para sede e investigacion
-- Mantiene cliente y servidor alineados: niveles altos dejan de escalar de forma lineal/suave.

create or replace function public._astracorp_hq_meta(p_key text)
returns jsonb
language plpgsql
immutable
as $fn$
declare
  v_key text := trim(coalesce(p_key, ''));
begin
  return case v_key
    when 'logistics_center' then jsonb_build_object('key','logistics_center','name','Centro logistico','maxLevel',5,'baseCost',32,'primary','mineral','secondary','metal_components','advanced','alloy_frames','elite','habitat_modules')
    when 'trade_desk' then jsonb_build_object('key','trade_desk','name','Departamento comercial','maxLevel',5,'baseCost',36,'primary','water','secondary','energy_cells','advanced','metal_components','elite','habitat_modules')
    when 'operations_room' then jsonb_build_object('key','operations_room','name','Sala de operaciones','maxLevel',5,'baseCost',40,'primary','energy_cells','secondary','metal_components','advanced','alloy_frames','elite','oxygen_tanks')
    when 'defense_office' then jsonb_build_object('key','defense_office','name','Oficina defensiva','maxLevel',5,'baseCost',40,'primary','mineral','secondary','metal_components','advanced','alloy_frames','elite','oxygen_tanks')
    when 'war_room' then jsonb_build_object('key','war_room','name','Sala tactica','maxLevel',5,'baseCost',44,'primary','mineral','secondary','metal_components','advanced','alloy_frames','elite','habitat_modules')
    else null
  end;
end;
$fn$;

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

  v_credits := round(coalesce((v_meta->>'baseCost')::numeric, 10) * power(2.35, v_level));

  if v_next >= 2 then
    v_resources := v_resources || jsonb_build_array(jsonb_build_object('key', v_meta->>'primary', 'amount', ceil(8 * power(1.65, v_level))));
  end if;
  if v_next >= 3 then
    v_resources := v_resources || jsonb_build_array(jsonb_build_object('key', v_meta->>'secondary', 'amount', ceil(4 * power(1.6, v_level))));
  end if;
  if v_next >= 4 then
    v_resources := v_resources || jsonb_build_array(jsonb_build_object('key', v_meta->>'advanced', 'amount', ceil(2 * power(1.55, v_level))));
  end if;
  if v_next >= 5 then
    v_resources := v_resources || jsonb_build_array(jsonb_build_object('key', v_meta->>'elite', 'amount', ceil(4 * power(1.5, v_next - 5))));
  end if;

  return jsonb_build_object('credits', v_credits, 'resources', v_resources);
end;
$fn$;

create or replace function public._astracorp_research_credit_cost(p_meta jsonb, p_level integer)
returns numeric
language sql
immutable
as $fn$
  select ceil(
    (
      coalesce((p_meta->>'creditsBase')::numeric, 0)
      + coalesce((p_meta->>'creditsStep')::numeric, 0)
    )
    * power(1.72, greatest(0, coalesce(p_level, 0)))
  );
$fn$;

create or replace function public._astracorp_research_resource_cost(p_resource jsonb, p_level integer)
returns numeric
language sql
immutable
as $fn$
  select ceil(
    (
      coalesce((p_resource->>'base')::numeric, 0)
      + coalesce((p_resource->>'step')::numeric, 0)
    )
    * power(1.55, greatest(0, coalesce(p_level, 0)))
  );
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

  v_credits := public._astracorp_research_credit_cost(v_meta, v_level);
  if coalesce((v_player->>'credits')::numeric, 0) < v_credits then
    raise exception 'Necesitas % creditos.', v_credits;
  end if;

  for v_resource in
    select value from jsonb_array_elements(coalesce(v_meta->'resources', '[]'::jsonb))
  loop
    v_res_key := v_resource->>'key';
    v_required := public._astracorp_research_resource_cost(v_resource, v_level);
    v_have := coalesce((v_inventory->>v_res_key)::numeric, 0);
    if v_have < v_required then
      raise exception 'No tienes suficientes recursos para esa mejora.';
    end if;
  end loop;

  for v_resource in
    select value from jsonb_array_elements(coalesce(v_meta->'resources', '[]'::jsonb))
  loop
    v_res_key := v_resource->>'key';
    v_required := public._astracorp_research_resource_cost(v_resource, v_level);
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

grant execute on function public._astracorp_research_credit_cost(jsonb, integer) to authenticated;
grant execute on function public._astracorp_research_resource_cost(jsonb, integer) to authenticated;
