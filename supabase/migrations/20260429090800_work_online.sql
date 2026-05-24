-- AstraCorp - trabajos online
-- Ejecutar preferiblemente el archivo *_BLOCKS.sql por bloques en Supabase SQL Editor.

create table if not exists public.astracorp_work_events (
  id bigserial primary key,
  user_id uuid not null,
  event_type text not null,
  job_label text,
  credits numeric not null default 0,
  xp integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.astracorp_work_events enable row level security;

drop policy if exists astracorp_work_events_select_own on public.astracorp_work_events;
create policy astracorp_work_events_select_own
on public.astracorp_work_events
for select
to authenticated
using (user_id = auth.uid());

create or replace function public._astracorp_work_now_ms()
returns numeric
language sql
stable
as $fn$
  select floor(extract(epoch from clock_timestamp()) * 1000)::numeric;
$fn$;

create or replace function public._astracorp_work_xp_needed(p_level integer)
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

create or replace function public._astracorp_work_apply_xp(p_player jsonb, p_xp numeric)
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
    v_needed := public._astracorp_work_xp_needed(v_level);
    exit when v_xp < v_needed;
    v_xp := v_xp - v_needed;
    v_level := v_level + 1;
  end loop;

  return v_player || jsonb_build_object('level', v_level, 'xp', v_xp);
end;
$fn$;

create or replace function public._astracorp_work_integrity_duration_mult(p_health numeric)
returns numeric
language plpgsql
immutable
as $fn$
declare
  v_health numeric := greatest(0, least(100, coalesce(p_health, 100)));
begin
  if v_health < 15 then return 1.45; end if;
  if v_health < 45 then return 1.25; end if;
  if v_health < 70 then return 1.10; end if;
  return 1;
end;
$fn$;

create or replace function public._astracorp_work_ad_factor(p_save jsonb)
returns numeric
language plpgsql
immutable
as $fn$
declare
  v_research jsonb := coalesce(p_save->'research', '{}'::jsonb);
  v_ad_level numeric := greatest(0, coalesce((v_research->>'ad_optimization')::numeric, 0));
begin
  return greatest(0.35, 0.6 - v_ad_level * 0.05);
end;
$fn$;

create or replace function public._astracorp_work_job_by_label(p_label text)
returns jsonb
language plpgsql
immutable
as $fn$
declare
  v_label text := trim(coalesce(p_label, ''));
begin
  return case v_label
    when 'Escaneo de rocio' then jsonb_build_object('label','Escaneo de rocio','icon','H2O','credits',1.4,'xp',4,'cost',2,'item','water','unlockLevel',1,'durationSec',45,'hd',1)
    when 'Mantenimiento solar' then jsonb_build_object('label','Mantenimiento solar','icon','EN','credits',2.1,'xp',6,'cost',3,'item','energy_cells','unlockLevel',2,'durationSec',60,'hd',3)
    when 'Extraccion superficial' then jsonb_build_object('label','Extraccion superficial','icon','MIN','credits',3.0,'xp',8,'cost',4,'item','mineral','unlockLevel',3,'durationSec',85,'hd',-3)
    when 'Control de purificacion' then jsonb_build_object('label','Control de purificacion','icon','PUR','credits',4.6,'xp',10,'cost',6,'item','purified_water','unlockLevel',4,'durationSec',100,'hd',2)
    when 'Mecanizado basico' then jsonb_build_object('label','Mecanizado basico','icon','CMP','credits',6.0,'xp',12,'cost',7,'item','metal_components','unlockLevel',5,'durationSec',130,'hd',-2)
    when 'Sintesis de oxigeno' then jsonb_build_object('label','Sintesis de oxigeno','icon','O2','credits',8.5,'xp',14,'cost',9,'item','oxygen_tanks','unlockLevel',6,'durationSec',180,'hd',4)
    when 'Forja estructural' then jsonb_build_object('label','Forja estructural','icon','ALY','credits',10.5,'xp',16,'cost',11,'item','alloy_frames','unlockLevel',7,'durationSec',240,'hd',-4)
    when 'Montaje de habitat' then jsonb_build_object('label','Montaje de habitat','icon','HAB','credits',14,'xp',22,'cost',14,'item','habitat_modules','unlockLevel',8,'durationSec',330,'hd',-2)
    else null
  end;
end;
$fn$;

create or replace function public._astracorp_work_load_save_locked()
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

create or replace function public._astracorp_work_store_save(p_save jsonb)
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

create or replace function public._astracorp_work_add_log(p_save jsonb, p_msg text)
returns jsonb
language plpgsql
volatile
as $fn$
declare
  v_log jsonb := coalesce(p_save->'log', '[]'::jsonb);
  v_entry jsonb := jsonb_build_object('msg', p_msg, 't', public._astracorp_work_now_ms());
begin
  return jsonb_set(p_save, '{log}', jsonb_build_array(v_entry) || v_log, true);
end;
$fn$;

create or replace function public._astracorp_work_progress_mission(p_save jsonb, p_type text, p_amount integer default 1)
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

create or replace function public.rpc_start_work_secure(p_job_label text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_save jsonb;
  v_job jsonb;
  v_player jsonb;
  v_now numeric := public._astracorp_work_now_ms();
  v_level integer;
  v_energy numeric;
  v_health numeric;
  v_cost numeric;
  v_unlock integer;
  v_duration numeric;
  v_adjusted integer;
  v_active jsonb;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  v_job := public._astracorp_work_job_by_label(p_job_label);
  if v_job is null then
    raise exception 'Trabajo no valido.';
  end if;

  v_save := public._astracorp_work_load_save_locked();
  if v_save->'activeJob' is not null and v_save->>'activeJob' <> 'null' then
    raise exception 'Ya tienes un trabajo en curso.';
  end if;

  v_player := coalesce(v_save->'player', '{}'::jsonb);
  v_level := greatest(1, coalesce((v_player->>'level')::integer, 1));
  v_energy := coalesce((v_player->>'energy')::numeric, 0);
  v_health := greatest(0, least(100, coalesce((v_player->>'health')::numeric, 100)));
  v_cost := coalesce((v_job->>'cost')::numeric, 0);
  v_unlock := greatest(1, coalesce((v_job->>'unlockLevel')::integer, 1));

  if v_level < v_unlock then
    raise exception 'Necesitas nivel %.', v_unlock;
  end if;
  if v_energy < v_cost then
    raise exception 'No tienes suficiente energia.';
  end if;
  if v_health < 15 then
    raise exception 'Integridad critica: repara en la sede antes de trabajar.';
  end if;

  v_duration := greatest(1, coalesce((v_job->>'durationSec')::numeric, 60));
  v_adjusted := greatest(10, ceil(v_duration * public._astracorp_work_integrity_duration_mult(v_health))::integer);
  v_active := v_job || jsonb_build_object(
    'durationSec', v_adjusted,
    'startedAt', v_now,
    'endAt', v_now + v_adjusted * 1000,
    'adBoostUsed', false
  );

  v_player := v_player || jsonb_build_object('energy', greatest(0, v_energy - v_cost));
  v_save := jsonb_set(v_save, '{activeJob}', v_active, true);
  v_save := jsonb_set(v_save, '{player}', v_player, true);
  v_save := jsonb_set(v_save, '{note}', jsonb_build_object('msg', coalesce(v_job->>'label', 'Trabajo') || ' en marcha', 'type', 'success'), true);
  v_save := public._astracorp_work_add_log(v_save, 'Trabajo iniciado: ' || coalesce(v_job->>'icon', '') || ' ' || coalesce(v_job->>'label', 'Trabajo') || ' - duracion ' || v_adjusted::text || 's');
  v_save := public._astracorp_work_store_save(v_save);

  insert into public.astracorp_work_events(user_id, event_type, job_label)
  values (v_user, 'start', v_job->>'label');

  return jsonb_build_object('ok', true, 'saveData', v_save, 'message', coalesce(v_job->>'label', 'Trabajo') || ' en marcha');
end;
$fn$;

create or replace function public.rpc_boost_work_secure()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_save jsonb;
  v_job jsonb;
  v_now numeric := public._astracorp_work_now_ms();
  v_remaining numeric;
  v_reduced numeric;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  v_save := public._astracorp_work_load_save_locked();
  v_job := v_save->'activeJob';

  if v_job is null or v_job = 'null'::jsonb then
    raise exception 'Necesitas un trabajo activo para acelerarlo.';
  end if;
  if coalesce((v_job->>'adBoostUsed')::boolean, false) then
    raise exception 'Ese trabajo ya recibio un impulso por anuncio.';
  end if;

  v_remaining := greatest(0, coalesce((v_job->>'endAt')::numeric, v_now) - v_now);
  v_reduced := greatest(5000, round(v_remaining * public._astracorp_work_ad_factor(v_save)));
  v_job := v_job || jsonb_build_object('endAt', v_now + v_reduced, 'adBoostUsed', true);

  v_save := jsonb_set(v_save, '{activeJob}', v_job, true);
  v_save := jsonb_set(v_save, '{note}', jsonb_build_object('msg', 'Trabajo acelerado: ' || coalesce(v_job->>'label', 'Trabajo'), 'type', 'success'), true);
  v_save := public._astracorp_work_add_log(v_save, 'Impulso laboral activado en ' || coalesce(v_job->>'label', 'Trabajo'));
  v_save := public._astracorp_work_store_save(v_save);

  insert into public.astracorp_work_events(user_id, event_type, job_label)
  values (v_user, 'boost', v_job->>'label');

  return jsonb_build_object('ok', true, 'saveData', v_save, 'message', 'Impulso laboral activado: el trabajo terminara antes.');
end;
$fn$;

create or replace function public.rpc_complete_work_secure()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_save jsonb;
  v_job jsonb;
  v_player jsonb;
  v_inventory jsonb;
  v_stats jsonb;
  v_now numeric := public._astracorp_work_now_ms();
  v_item text;
  v_credits numeric;
  v_xp integer;
  v_hd numeric;
  v_health numeric;
  v_current_resource numeric;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  v_save := public._astracorp_work_load_save_locked();
  v_job := v_save->'activeJob';

  if v_job is null or v_job = 'null'::jsonb then
    raise exception 'No hay trabajo activo.';
  end if;
  if v_now < coalesce((v_job->>'endAt')::numeric, 0) then
    raise exception 'El trabajo todavia no ha terminado.';
  end if;

  v_item := v_job->>'item';
  v_credits := round(coalesce((v_job->>'credits')::numeric, 0), 2);
  v_xp := round(coalesce((v_job->>'xp')::numeric, 0))::integer;
  v_hd := coalesce((v_job->>'hd')::numeric, 0);
  v_inventory := coalesce(v_save->'inventory', '{}'::jsonb);
  if v_item is not null and length(v_item) > 0 then
    v_current_resource := coalesce((v_inventory->>v_item)::numeric, 0);
    v_inventory := jsonb_set(v_inventory, array[v_item], to_jsonb(round(v_current_resource + 1, 2)), true);
  end if;

  v_player := public._astracorp_work_apply_xp(coalesce(v_save->'player', '{}'::jsonb), v_xp);
  v_health := greatest(0, least(100, coalesce((v_player->>'health')::numeric, 100) + v_hd));
  v_player := v_player || jsonb_build_object(
    'credits', round(coalesce((v_player->>'credits')::numeric, 0) + v_credits, 2),
    'health', v_health
  );

  v_stats := coalesce(v_save->'stats', '{}'::jsonb) || jsonb_build_object(
    'works', coalesce((v_save->'stats'->>'works')::integer, 0) + 1
  );

  v_save := jsonb_set(v_save, '{activeJob}', 'null'::jsonb, true);
  v_save := jsonb_set(v_save, '{inventory}', v_inventory, true);
  v_save := jsonb_set(v_save, '{player}', v_player, true);
  v_save := jsonb_set(v_save, '{stats}', v_stats, true);
  v_save := public._astracorp_work_progress_mission(v_save, 'work', 1);
  if v_item = 'oxygen_tanks' then
    v_save := public._astracorp_work_progress_mission(v_save, 'collect_oxygen_tanks', 1);
  end if;
  if v_item = 'habitat_modules' then
    v_save := public._astracorp_work_progress_mission(v_save, 'collect_habitat_modules', 1);
  end if;
  v_save := jsonb_set(v_save, '{note}', jsonb_build_object('msg', 'Trabajo completado: ' || coalesce(v_job->>'label', 'Trabajo'), 'type', 'success'), true);
  v_save := public._astracorp_work_add_log(v_save, 'Trabajo completado: ' || coalesce(v_job->>'icon', '') || ' ' || coalesce(v_job->>'label', 'Trabajo') || ' - +' || v_credits::text || ' creditos +' || v_xp::text || ' XP');
  v_save := public._astracorp_work_store_save(v_save);

  insert into public.astracorp_work_events(user_id, event_type, job_label, credits, xp)
  values (v_user, 'complete', v_job->>'label', v_credits, v_xp);

  return jsonb_build_object(
    'ok', true,
    'saveData', v_save,
    'rewardCredits', v_credits,
    'rewardXp', v_xp,
    'message', 'Trabajo completado: ' || coalesce(v_job->>'label', 'Trabajo')
  );
end;
$fn$;

grant execute on function public.rpc_start_work_secure(text) to authenticated;
grant execute on function public.rpc_boost_work_secure() to authenticated;
grant execute on function public.rpc_complete_work_secure() to authenticated;
