-- The guided start uses stats.sells, so authenticated market sales must update
-- the same progress marker as offline/local sales.
create or replace function private.rpc_sell_market_item_secure(p_item_key text, p_qty integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_save jsonb;
  v_item jsonb;
  v_next_item jsonb;
  v_qty integer;
  v_owned numeric;
  v_supply numeric;
  v_demand numeric;
  v_base numeric;
  v_post_price numeric;
  v_market_unit numeric;
  v_total numeric;
  v_credits numeric;
  v_energy numeric;
  v_inventory jsonb;
  v_stats jsonb;
  v_basis jsonb;
  v_basis_item jsonb;
  v_basis_qty numeric;
  v_basis_value numeric;
  v_bought_sell_qty numeric;
  v_produced_sell_qty numeric;
  v_avg_cost numeric;
  v_capped_bought_unit numeric;
  v_next_price numeric;
  v_global_buys numeric;
  v_global_sells numeric;
  v_net_flow numeric;
begin
  v_qty := greatest(1, least(250, coalesce(p_qty, 1)));
  v_save := public._astracorp_market_load_save_locked();
  v_item := v_save #> array['market', p_item_key];

  if v_item is null then raise exception 'Ese recurso no existe en el mercado.'; end if;

  v_inventory := coalesce(v_save->'inventory', '{}'::jsonb);
  v_owned := coalesce((v_inventory->>p_item_key)::numeric, 0);
  if v_owned <= 0 then raise exception 'No tienes ese recurso.'; end if;

  v_qty := least(v_qty, floor(v_owned)::int);
  v_energy := coalesce((v_save #>> '{player,energy}')::numeric, 0);
  if v_energy < 1 then raise exception 'Necesitas 1 de energia.'; end if;

  v_base := coalesce((v_item->>'base')::numeric, coalesce((v_item->>'price')::numeric, 1));
  v_post_price := coalesce((v_item->>'price')::numeric, v_base);
  v_next_price := public._astracorp_market_trade_price(
    v_post_price,
    v_base,
    coalesce((v_item->>'demand')::numeric, 1),
    coalesce((v_item->>'supply')::numeric, 1),
    v_qty,
    'sell'
  );
  v_market_unit := round((v_post_price * 0.78)::numeric, 2);

  v_supply := coalesce((v_item->>'supply')::numeric, 0) + v_qty;
  v_demand := greatest(0, coalesce((v_item->>'demand')::numeric, 0) - v_qty * 2.4);
  v_global_buys := coalesce((v_item->>'globalBuys')::numeric, 0);
  v_global_sells := coalesce((v_item->>'globalSells')::numeric, 0) + v_qty;
  v_net_flow := v_global_buys - v_global_sells;

  v_basis := coalesce(v_save->'marketCostBasis', '{}'::jsonb);
  v_basis_item := coalesce(v_basis->p_item_key, '{}'::jsonb);
  v_basis_qty := greatest(0, coalesce((v_basis_item->>'qty')::numeric, 0));
  v_basis_value := greatest(0, coalesce((v_basis_item->>'value')::numeric, 0));
  v_bought_sell_qty := least(v_qty, v_basis_qty);
  v_produced_sell_qty := greatest(0, v_qty - v_bought_sell_qty);
  v_avg_cost := case when v_basis_qty > 0 then v_basis_value / v_basis_qty else v_market_unit end;
  v_capped_bought_unit := least(v_market_unit, v_avg_cost * 0.72);
  v_total := round((v_bought_sell_qty * v_capped_bought_unit + v_produced_sell_qty * v_market_unit)::numeric, 2);

  v_basis_qty := round(greatest(0, v_basis_qty - v_bought_sell_qty)::numeric, 2);
  v_basis_value := round(greatest(0, v_basis_value - v_avg_cost * v_bought_sell_qty)::numeric, 2);
  v_basis := jsonb_set(v_basis, array[p_item_key], jsonb_build_object('qty', v_basis_qty, 'value', v_basis_value), true);

  v_next_item := jsonb_set(v_item, '{demand}', to_jsonb(v_demand), true);
  v_next_item := jsonb_set(v_next_item, '{supply}', to_jsonb(v_supply), true);
  v_next_item := jsonb_set(v_next_item, '{price}', to_jsonb(v_next_price), true);
  v_next_item := jsonb_set(v_next_item, '{lastTradeAt}', to_jsonb((extract(epoch from now()) * 1000)::bigint), true);
  v_next_item := jsonb_set(v_next_item, '{lastTradeAction}', to_jsonb('sell'::text), true);
  v_next_item := jsonb_set(v_next_item, '{lastTradeQty}', to_jsonb(v_qty), true);
  v_next_item := jsonb_set(v_next_item, '{lastPriceChange}', to_jsonb(round((v_next_price - v_post_price)::numeric, 2)), true);
  v_next_item := jsonb_set(v_next_item, '{globalBuys}', to_jsonb(round(v_global_buys::numeric, 2)), true);
  v_next_item := jsonb_set(v_next_item, '{globalSells}', to_jsonb(round(v_global_sells::numeric, 2)), true);
  v_next_item := jsonb_set(v_next_item, '{netFlow}', to_jsonb(round(v_net_flow::numeric, 2)), true);
  v_next_item := jsonb_set(v_next_item, '{marketPressure}', to_jsonb((case when v_net_flow > 0 then 'buy' when v_net_flow < 0 then 'sell' else 'flat' end)::text), true);

  v_inventory := jsonb_set(v_inventory, array[p_item_key], to_jsonb(round(greatest(0, v_owned - v_qty)::numeric, 2)), true);
  v_stats := coalesce(v_save->'stats', '{}'::jsonb);
  v_stats := jsonb_set(v_stats, '{sells}', to_jsonb(coalesce((v_stats->>'sells')::integer, 0) + v_qty), true);
  v_credits := coalesce((v_save #>> '{player,credits}')::numeric, 0);

  v_save := jsonb_set(v_save, array['market', p_item_key], v_next_item, true);
  v_save := jsonb_set(v_save, '{inventory}', v_inventory, true);
  v_save := jsonb_set(v_save, '{stats}', v_stats, true);
  v_save := jsonb_set(v_save, '{marketCostBasis}', v_basis, true);
  v_save := jsonb_set(v_save, '{player,credits}', to_jsonb(round((v_credits + v_total)::numeric, 2)), true);
  v_save := jsonb_set(v_save, '{player,energy}', to_jsonb(greatest(0, floor(v_energy - 1))::integer), true);

  perform public._astracorp_market_write_item(p_item_key, v_next_item);
  insert into public.astracorp_market_events(user_id, item_key, action, qty, unit_price, total)
  values (auth.uid(), p_item_key, 'sell', v_qty, case when v_qty > 0 then round((v_total / v_qty)::numeric, 2) else 0 end, v_total);
  perform public._astracorp_market_store_save(v_save);

  return jsonb_build_object('ok', true, 'saveData', v_save, 'qty', v_qty, 'totalReceived', v_total, 'message', format('+%s creditos', v_total));
end;
$fn$;
