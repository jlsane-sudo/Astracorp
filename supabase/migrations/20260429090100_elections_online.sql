-- AstraCorp - elecciones/protocolos online
-- Ejecutar preferiblemente el archivo *_BLOCKS.sql por bloques en Supabase SQL Editor.

create table if not exists public.astracorp_elections (
  id uuid primary key default gen_random_uuid(),
  territory_id text not null,
  territory_name text,
  candidates jsonb not null default '[]'::jsonb,
  votes jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  winner text,
  counts jsonb not null default '{}'::jsonb,
  started_by uuid not null,
  started_at timestamptz not null default now(),
  ends_at timestamptz not null,
  resolved_at timestamptz
);

create index if not exists astracorp_elections_active_idx on public.astracorp_elections(active, territory_id);

alter table public.astracorp_elections enable row level security;

drop policy if exists astracorp_elections_select on public.astracorp_elections;
create policy astracorp_elections_select
on public.astracorp_elections
for select
to authenticated
using (true);

create or replace function public._astracorp_election_now_ms()
returns numeric
language sql
stable
as $fn$
  select floor(extract(epoch from clock_timestamp()) * 1000)::numeric;
$fn$;

create or replace function public._astracorp_election_energy_cost(p_save jsonb, p_action text)
returns integer
language plpgsql
immutable
as $fn$
declare
  v_base numeric := case p_action when 'startElection' then 5 when 'voteElection' then 1 else 0 end;
  v_research jsonb := coalesce(p_save->'research', '{}'::jsonb);
  v_hq jsonb := coalesce(p_save->'hq', '{}'::jsonb);
  v_efficiency numeric := greatest(0, coalesce((v_research->>'efficiency')::numeric, 0));
  v_operations numeric := greatest(0, coalesce((v_hq->>'operations_room')::numeric, 0));
  v_discount numeric;
begin
  v_discount := least(0.55, least(0.4, v_efficiency * 0.1) + least(0.28, v_operations * 0.04));
  return greatest(0, ceil(v_base * (1 - v_discount))::integer);
end;
$fn$;

create or replace function public._astracorp_election_load_save_locked()
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

  return public._astracorp_apply_global_territories(v_save);
end;
$fn$;

create or replace function public._astracorp_election_store_save(p_save jsonb)
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

create or replace function public._astracorp_election_add_log(p_save jsonb, p_msg text)
returns jsonb
language plpgsql
volatile
as $fn$
declare
  v_log jsonb := coalesce(p_save->'log', '[]'::jsonb);
  v_entry jsonb := jsonb_build_object('msg', p_msg, 't', public._astracorp_election_now_ms());
begin
  return jsonb_set(p_save, '{log}', jsonb_build_array(v_entry) || v_log, true);
end;
$fn$;

create or replace function public._astracorp_election_payload(p_election public.astracorp_elections)
returns jsonb
language plpgsql
stable
as $fn$
begin
  return jsonb_build_object(
    'id', p_election.id::text,
    'active', p_election.active,
    'territory', p_election.territory_id,
    'territoryName', p_election.territory_name,
    'candidates', p_election.candidates,
    'votes', p_election.votes,
    'endsAt', floor(extract(epoch from p_election.ends_at) * 1000),
    'winner', p_election.winner,
    'counts', p_election.counts
  );
end;
$fn$;

create or replace function public._astracorp_election_sync_save(p_save jsonb, p_election public.astracorp_elections)
returns jsonb
language plpgsql
stable
as $fn$
begin
  return jsonb_set(p_save, '{election}', public._astracorp_election_payload(p_election), true);
end;
$fn$;

create or replace function public.rpc_start_election_secure(p_territory_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_save jsonb;
  v_player jsonb;
  v_territory jsonb;
  v_territory_id text := trim(coalesce(p_territory_id, ''));
  v_player_name text;
  v_energy_cost integer;
  v_election public.astracorp_elections;
  v_election_id uuid;
  v_candidates jsonb;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;
  if v_territory_id = '' then
    raise exception 'Territorio no valido.';
  end if;

  v_save := public._astracorp_election_load_save_locked();
  v_player := coalesce(v_save->'player', '{}'::jsonb);
  v_player_name := coalesce(v_player->>'name', 'Invitado');

  if coalesce((v_player->>'level')::integer, 1) < 4 then
    raise exception 'Necesitas nivel 4.';
  end if;
  if coalesce((v_player->>'credits')::numeric, 0) < 12 then
    raise exception 'Necesitas 12 creditos.';
  end if;
  v_energy_cost := public._astracorp_election_energy_cost(v_save, 'startElection');
  if coalesce((v_player->>'energy')::numeric, 0) < v_energy_cost then
    raise exception 'Necesitas % de energia.', v_energy_cost;
  end if;

  v_territory := (
    select value
    from jsonb_array_elements(coalesce(v_save->'territories', '[]'::jsonb))
    where value->>'id' = v_territory_id
    limit 1
  );
  if v_territory is null then
    raise exception 'Territorio no valido.';
  end if;

  if exists(select 1 from public.astracorp_elections where active = true and territory_id = v_territory_id) then
    raise exception 'Ya hay un protocolo activo en este sector.';
  end if;
  if coalesce((v_save->'election'->>'active')::boolean, false) then
    raise exception 'Ya hay un protocolo activo.';
  end if;

  v_candidates := jsonb_build_array(v_player_name, 'Viktor Sokolov', 'Maria Chen');
  v_election_id := gen_random_uuid();

  insert into public.astracorp_elections(id, territory_id, territory_name, candidates, votes, active, started_by, ends_at)
  values (v_election_id, v_territory_id, coalesce(v_territory->>'name', 'Sector'), v_candidates, '{}'::jsonb, true, v_user, now() + interval '30 seconds');

  v_election := (select e from public.astracorp_elections e where e.id = v_election_id);

  v_player := v_player || jsonb_build_object(
    'credits', round(coalesce((v_player->>'credits')::numeric, 0) - 12, 2),
    'energy', greatest(0, coalesce((v_player->>'energy')::numeric, 0) - v_energy_cost)
  );
  v_save := jsonb_set(v_save, '{player}', v_player, true);
  v_save := public._astracorp_election_sync_save(v_save, v_election);
  v_save := public._astracorp_election_add_log(v_save, 'Protocolo de control iniciado en ' || coalesce(v_territory->>'name', 'el sector'));
  v_save := public._astracorp_election_store_save(v_save);

  return jsonb_build_object('ok', true, 'saveData', v_save, 'electionId', v_election.id::text, 'message', 'Protocolo iniciado: duracion 30 segundos.');
end;
$fn$;

create or replace function public.rpc_vote_election_secure(p_candidate text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_save jsonb;
  v_player jsonb;
  v_player_name text;
  v_candidate text := trim(coalesce(p_candidate, ''));
  v_election_id uuid;
  v_election public.astracorp_elections;
  v_energy_cost integer;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;
  if v_candidate = '' then
    raise exception 'Candidato no valido.';
  end if;

  v_save := public._astracorp_election_load_save_locked();
  v_player := coalesce(v_save->'player', '{}'::jsonb);
  v_player_name := coalesce(v_player->>'name', 'Invitado');
  v_election_id := nullif(v_save->'election'->>'id', '')::uuid;
  if v_election_id is null then
    raise exception 'No hay protocolo activo.';
  end if;

  v_election := (select e from public.astracorp_elections e where e.id = v_election_id for update);
  if v_election.id is null or not v_election.active then
    raise exception 'No hay protocolo activo.';
  end if;
  if now() >= v_election.ends_at then
    raise exception 'El protocolo ya ha cerrado votacion.';
  end if;
  if not exists(select 1 from jsonb_array_elements_text(v_election.candidates) c(candidate) where c.candidate = v_candidate) then
    raise exception 'Candidato no valido.';
  end if;
  if v_election.votes ? (v_user::text) then
    raise exception 'Ya has emitido tu voto en este protocolo.';
  end if;

  v_energy_cost := public._astracorp_election_energy_cost(v_save, 'voteElection');
  if coalesce((v_player->>'energy')::numeric, 0) < v_energy_cost then
    raise exception 'Necesitas % de energia.', v_energy_cost;
  end if;

  update public.astracorp_elections
  set votes = votes || jsonb_build_object((v_user::text), v_candidate)
  where id = v_election_id;

  v_election := (select e from public.astracorp_elections e where e.id = v_election_id);

  v_player := v_player || jsonb_build_object('energy', greatest(0, coalesce((v_player->>'energy')::numeric, 0) - v_energy_cost));
  v_save := jsonb_set(v_save, '{player}', v_player, true);
  v_save := public._astracorp_election_sync_save(v_save, v_election);
  v_save := public._astracorp_election_add_log(v_save, v_player_name || ' apoya a ' || v_candidate);
  v_save := public._astracorp_election_store_save(v_save);

  return jsonb_build_object('ok', true, 'saveData', v_save, 'message', 'Voto registrado para ' || v_candidate);
end;
$fn$;

create or replace function public.rpc_resolve_election_secure()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_user uuid := auth.uid();
  v_save jsonb;
  v_election_id uuid;
  v_election public.astracorp_elections;
  v_candidate text;
  v_vote text;
  v_counts jsonb := '{}'::jsonb;
  v_score integer;
  v_winner text := null;
  v_best integer := -1;
  v_territory jsonb;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  v_save := public._astracorp_election_load_save_locked();
  v_election_id := nullif(v_save->'election'->>'id', '')::uuid;
  if v_election_id is null then
    raise exception 'No hay protocolo activo.';
  end if;

  v_election := (select e from public.astracorp_elections e where e.id = v_election_id for update);
  if v_election.id is null then
    raise exception 'No hay protocolo activo.';
  end if;
  if not v_election.active then
    v_save := public._astracorp_election_sync_save(v_save, v_election);
    v_save := public._astracorp_election_store_save(v_save);
    return jsonb_build_object('ok', true, 'saveData', v_save, 'message', 'Protocolo ya resuelto.');
  end if;
  if now() < v_election.ends_at then
    raise exception 'El protocolo todavia no ha terminado.';
  end if;

  for v_candidate in select jsonb_array_elements_text(v_election.candidates) loop
    v_score := 2 + floor(random() * 10)::integer;
    for v_vote in select value from jsonb_each_text(v_election.votes) loop
      if v_vote = v_candidate then
        v_score := v_score + 1;
      end if;
    end loop;
    v_counts := v_counts || jsonb_build_object(v_candidate, v_score);
    if v_score > v_best then
      v_best := v_score;
      v_winner := v_candidate;
    end if;
  end loop;

  if v_winner is null then
    v_winner := coalesce(v_save->'player'->>'name', 'Invitado');
  end if;

  update public.astracorp_elections
  set active = false,
      winner = v_winner,
      counts = v_counts,
      resolved_at = now()
  where id = v_election_id;

  v_election := (select e from public.astracorp_elections e where e.id = v_election_id);

  v_save := jsonb_set(
    v_save,
    '{territories}',
    coalesce((
      select jsonb_agg(
        case when value->>'id' = v_election.territory_id then
          value || jsonb_build_object('controller', v_winner, 'stability', 68, 'threat', 24, 'fortification', greatest(4, coalesce((value->>'fortification')::numeric, 0)))
        else value end
      )
      from jsonb_array_elements(coalesce(v_save->'territories', '[]'::jsonb))
    ), '[]'::jsonb),
    true
  );

  v_territory := (
    select value from jsonb_array_elements(coalesce(v_save->'territories', '[]'::jsonb))
    where value->>'id' = v_election.territory_id
    limit 1
  );

  if v_territory is not null then
    perform public._astracorp_write_global_territory((v_election.territory_id)::integer, v_territory);
  end if;

  v_save := public._astracorp_election_sync_save(v_save, v_election);
  v_save := jsonb_set(v_save, '{note}', jsonb_build_object('msg', v_winner || ' toma el control del sector', 'type', 'warn'), true);
  v_save := jsonb_set(v_save, '{selTer}', coalesce(v_territory, 'null'::jsonb), true);
  v_save := public._astracorp_election_add_log(v_save, 'Protocolo resuelto en ' || coalesce(v_election.territory_name, 'el sector') || ': domina ' || v_winner);
  v_save := public._astracorp_election_store_save(v_save);

  return jsonb_build_object('ok', true, 'saveData', v_save, 'winner', v_winner, 'counts', v_counts, 'message', 'Protocolo resuelto: domina ' || v_winner);
end;
$fn$;

grant execute on function public.rpc_start_election_secure(text) to authenticated;
grant execute on function public.rpc_vote_election_secure(text) to authenticated;
grant execute on function public.rpc_resolve_election_secure() to authenticated;



