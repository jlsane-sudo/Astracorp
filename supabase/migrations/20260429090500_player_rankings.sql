-- AstraCorp - ranking online de jugadores
-- Ejecutar en Supabase SQL Editor.

create or replace function public.rpc_get_player_rankings(p_limit integer default 50)
returns jsonb
as $fn$
declare
  v_players jsonb;
begin
  v_players := (
    with base as (
      select
        gs.user_id,
        gs.save_data,
        gs.updated_at,
        coalesce(nullif(p.username, ''), nullif(gs.save_data #>> '{player,name}', ''), 'Jugador') as player_name
      from public.game_saves gs
      left join public.profiles p on p.id = gs.user_id
      order by gs.updated_at desc
      limit greatest(1, least(100, coalesce(p_limit, 50)))
    ), ranked as (
      select
        user_id::text as id,
        player_name as name,
        'ME' as avatar,
        coalesce((save_data #>> '{player,level}')::numeric, 1) as level,
        coalesce((save_data #>> '{player,credits}')::numeric, 0) as credits,
        coalesce((save_data #>> '{player,pct}')::numeric, 0) as pct,
        coalesce(jsonb_array_length(coalesce(save_data->'companies', '[]'::jsonb)), 0) as companies,
        (
          select count(*)::int
          from jsonb_array_elements(coalesce(save_data->'territories', '[]'::jsonb)) territory
          where territory->>'controller' = player_name
        ) as territory,
        (extract(epoch from updated_at) * 1000)::bigint as "lastSeenAt",
        updated_at > now() - interval '10 minutes' as online
      from base
    ), scored as (
      select
        *,
        round((credits + level * 25 + companies * 12 + territory * 40 + pct * 2)::numeric, 2) as score,
        'online' as source
      from ranked
    )
    select coalesce(jsonb_agg(to_jsonb(scored) order by score desc, level desc, credits desc), '[]'::jsonb)
    from scored
  );

  return jsonb_build_object('ok', true, 'players', coalesce(v_players, '[]'::jsonb));
end;
$fn$
language plpgsql
security definer
set search_path = public;

grant execute on function public.rpc_get_player_rankings(integer) to authenticated;
