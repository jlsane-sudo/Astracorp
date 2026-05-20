# Cambio: mercado multijugador online

## Objetivo

Cerrar el exploit de comprar y vender recursos para generar creditos y preparar el mercado para partidas multijugador reales.

## Cambios de cliente

- `src/services/multiplayerActions.js` ahora expone:
  - `getGlobalMarketSecure()`
  - `buyMarketItemSecure({ itemKey, qty })`
  - `sellMarketItemSecure({ itemKey, qty })`
- `src/hooks/engine/useGameActions.js` intenta comprar/vender por RPC cuando el jugador tiene sesion.
- Si la RPC no esta instalada, se mantiene fallback local temporal.
- `src/hooks/useAstraCorpGame.js` sincroniza el mercado al abrir la pestaña Mercado y cada 45 segundos.
- `src/hooks/engine/gamePureLogic.js` guarda `marketCostBasis` para recordar el coste medio de recursos comprados.

## Anti-exploit

Cuando compras un recurso, el juego registra cantidad y coste total en `marketCostBasis`.

Si luego vendes ese mismo recurso comprado, la parte comprada se paga como maximo al 72% de su coste medio, aunque el mercado haya subido. Esto hace que comprar y revender inmediatamente siempre pierda creditos.

Los recursos producidos por empresas pueden venderse a precio de mercado con margen normal, porque no vienen de compra especulativa directa.

## Cambios de Supabase

Nueva migracion:

- `supabase/migrations/20260429_market_multiplayer.sql`

Incluye:

- `astracorp_global_market`: estado global compartido de precio, oferta y demanda.
- `astracorp_market_events`: auditoria de compras y ventas.
- `rpc_get_global_market()`
- `rpc_buy_market_item_secure(p_item_key, p_qty)`
- `rpc_sell_market_item_secure(p_item_key, p_qty)`

## Notas

Hasta ejecutar la migracion en Supabase, el cliente seguira con fallback local. El fallback ya incluye el coste medio para reducir el exploit en invitado/desarrollo.
