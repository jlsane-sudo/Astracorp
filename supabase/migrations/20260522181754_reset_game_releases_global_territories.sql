create or replace function public.rpc_reset_game_secure()
returns jsonb
as $fn$
declare
  v_user uuid := auth.uid();
  v_save jsonb;
  v_player_name text;
  v_territories jsonb;
begin
  if v_user is null then
    raise exception 'Debes iniciar sesion.';
  end if;

  select save_data into v_save
  from public.game_saves
  where user_id = v_user
  for update;

  if v_save is null then
    raise exception 'No hay partida guardada en esta cuenta.';
  end if;

  v_player_name := nullif(coalesce(v_save #>> '{player,name}', ''), '');

  if v_player_name is not null then
    update public.astracorp_global_territories as g
    set controller = null,
        updated_by = v_user,
        updated_at = now(),
        state = jsonb_set(
          jsonb_set(
            jsonb_set(coalesce(g.state, '{}'::jsonb), '{controller}', 'null'::jsonb, true),
            '{campaign}',
            'null'::jsonb,
            true
          ),
          '{enemyCampaign}',
          'null'::jsonb,
          true
        )
    where g.controller = v_player_name;
  end if;

  v_territories := coalesce(v_save->'territories', '[]'::jsonb);

  if jsonb_typeof(v_territories) = 'array' then
    select jsonb_agg(
      case
        when territory->>'controller' = v_player_name then
          jsonb_set(
            jsonb_set(
              jsonb_set(territory, '{controller}', 'null'::jsonb, true),
              '{campaign}',
              'null'::jsonb,
              true
            ),
            '{enemyCampaign}',
            'null'::jsonb,
            true
          )
        else territory
      end
      order by ord
    )
    into v_territories
    from jsonb_array_elements(v_territories) with ordinality items(territory, ord);
  end if;

  v_save := jsonb_set(v_save, '{territories}', coalesce(v_territories, '[]'::jsonb), true);

  update public.game_saves
  set save_data = v_save,
      updated_at = now()
  where user_id = v_user;

  return jsonb_build_object(
    'ok', true,
    'message', 'Partida reiniciada y territorios globales liberados.'
  );
end;
$fn$
language plpgsql
security definer
set search_path = public;

grant execute on function public.rpc_reset_game_secure() to authenticated;
