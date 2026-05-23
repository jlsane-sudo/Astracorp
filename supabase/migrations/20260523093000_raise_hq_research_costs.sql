-- AstraCorp - endurecer mucho mas los costes de sede e investigacion

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

  v_credits := round(coalesce((v_meta->>'baseCost')::numeric, 10) * 1.45 * power(2.8, v_level));

  if v_next >= 2 then
    v_resources := v_resources || jsonb_build_array(jsonb_build_object('key', v_meta->>'primary', 'amount', ceil(12 * power(1.9, v_level))));
  end if;
  if v_next >= 3 then
    v_resources := v_resources || jsonb_build_array(jsonb_build_object('key', v_meta->>'secondary', 'amount', ceil(6 * power(1.85, v_level))));
  end if;
  if v_next >= 4 then
    v_resources := v_resources || jsonb_build_array(jsonb_build_object('key', v_meta->>'advanced', 'amount', ceil(4 * power(1.75, v_level))));
  end if;
  if v_next >= 5 then
    v_resources := v_resources || jsonb_build_array(jsonb_build_object('key', v_meta->>'elite', 'amount', ceil(6 * power(1.7, v_next - 5))));
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
    * 1.8
    * power(2.2, greatest(0, coalesce(p_level, 0)))
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
    * 1.75
    * power(1.85, greatest(0, coalesce(p_level, 0)))
  );
$fn$;

grant execute on function public._astracorp_research_credit_cost(jsonb, integer) to authenticated;
grant execute on function public._astracorp_research_resource_cost(jsonb, integer) to authenticated;
