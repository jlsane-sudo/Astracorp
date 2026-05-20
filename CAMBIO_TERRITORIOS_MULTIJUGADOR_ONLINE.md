# Cambio: territorios multijugador online

## Que cambia

El mapa deja de depender solo del navegador del jugador. Las acciones importantes de territorio pasan por Supabase RPC cuando hay sesion iniciada y usan un estado global compartido.

## Archivos tocados

- `src/services/multiplayerActions.js`: puente RPC ya preparado para ataque, sabotaje, refuerzo, fortin, tasas y lectura global.
- `src/hooks/engine/useGameActions.js`: nueva accion `syncGlobalTerritories`, que mezcla el mapa global en la partida local.
- `src/hooks/useAstraCorpGame.js`: al abrir el mapa se sincronizan territorios y se refrescan cada 45 segundos mientras el jugador esta conectado.
- `supabase/migrations/20260429_territory_multiplayer.sql`: migracion SQL con tablas y RPCs autoritativas.

## Tablas nuevas

- `astracorp_global_territories`: estado compartido de cada sector. Guarda controlador, estado completo del sector, usuario que lo modifico y fecha.
- `astracorp_territory_events`: registro de acciones territoriales para auditoria y cooldowns.

## RPCs instalables

- `rpc_get_global_territories()`
- `rpc_attack_territory_secure(p_territory_id)`
- `rpc_reinforce_territory_secure(p_territory_id)`
- `rpc_sabotage_territory_secure(p_territory_id)`
- `rpc_build_territory_fort_secure(p_territory_id)`
- `rpc_collect_occupation_taxes_secure(p_territory_id)`

## Reglas de servidor

- Requiere usuario autenticado con `auth.uid()`.
- Bloquea la fila de `game_saves` con `for update` antes de modificar la partida.
- Sincroniza el estado global antes de validar la accion.
- Comprueba propietario del territorio, creditos, energia, integridad y recursos segun la accion.
- Aplica cooldowns por jugador, accion y territorio:
  - ataque: 45s
  - refuerzo: 60s
  - sabotaje: 90s
  - fortin: 120s
  - cobro de tasas: 30s
- Actualiza `game_saves.save_data` y, cuando corresponde, `astracorp_global_territories`.

## Nota de instalacion

Hasta que ejecutes `supabase/migrations/20260429_territory_multiplayer.sql` en Supabase, el cliente seguira usando el fallback local temporal. Cuando la migracion este instalada, el servidor sera quien valide y escriba las acciones territoriales.
