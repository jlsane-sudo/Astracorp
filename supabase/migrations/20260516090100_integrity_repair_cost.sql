-- AstraCorp - reparacion de integridad mas costosa y alineada con cliente

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
  v_credits := greatest(0, ceil(v_restore * 1.25 + v_tier * 10));

  if v_restore > 0 then
    v_resources := v_resources || jsonb_build_array(
      jsonb_build_object('key', 'water', 'amount', greatest(2, v_tier * 5)),
      jsonb_build_object('key', 'energy_cells', 'amount', greatest(1, v_tier * 3))
    );

    if v_health < 60 then
      v_resources := v_resources || jsonb_build_array(
        jsonb_build_object('key', 'purified_water', 'amount', v_tier * 2)
      );
    end if;

    if v_health < 35 then
      v_resources := v_resources || jsonb_build_array(
        jsonb_build_object('key', 'metal_components', 'amount', v_tier)
      );
    end if;
  end if;

  return jsonb_build_object('restore', v_restore, 'credits', v_credits, 'resources', v_resources);
end;
$fn$;
