# Auditoria Supabase / multiplayer

Fecha: 2026-04-30

## Resumen

Se reviso el contrato entre el frontend y Supabase: RPC llamadas desde `src/services`, tablas leidas/escritas directamente y migraciones disponibles en `supabase/migrations`.

Resultado principal:

- Las RPC principales de juego online estan cubiertas por migraciones existentes.
- Faltaba cobertura SQL para perfiles (`profiles`) y para las RPC del pool de anuncios.
- Se anadio la migracion `supabase/migrations/20260430_profiles_adpool.sql`.

## RPC usadas por el frontend

### Cubiertas por migraciones existentes

Empresas:
- `rpc_build_company_secure`
- `rpc_collect_company_secure`
- `rpc_sell_company_secure`
- `rpc_collect_company_group_secure`
- `rpc_collect_all_companies_ad_secure`

Territorios:
- `rpc_get_global_territories`
- `rpc_attack_territory_secure`
- `rpc_reinforce_territory_secure`
- `rpc_sabotage_territory_secure`
- `rpc_build_territory_fort_secure`
- `rpc_collect_occupation_taxes_secure`

Mercado:
- `rpc_get_global_market`
- `rpc_buy_market_item_secure`
- `rpc_sell_market_item_secure`

Misiones y contratos:
- `rpc_deliver_contract_secure`
- `rpc_claim_mission_reward_secure`

Trabajos:
- `rpc_start_work_secure`
- `rpc_boost_work_secure`
- `rpc_complete_work_secure`

Investigacion:
- `rpc_start_research_secure`
- `rpc_boost_research_secure`
- `rpc_complete_research_secure`

Sede / integridad / planeta:
- `rpc_upgrade_hq_secure`
- `rpc_repair_integrity_secure`
- `rpc_select_planet_secure`

Elecciones:
- `rpc_start_election_secure`
- `rpc_vote_election_secure`
- `rpc_resolve_election_secure`

Ranking:
- `rpc_get_player_rankings`

### Cubiertas por la nueva migracion

Publicidad / ingresos:
- `rpc_flush_ad_views`
- `rpc_close_ad_pool_day`
- `rpc_get_my_ad_income_summary`
- `rpc_get_my_ad_income_history`

## Tablas usadas directamente por el frontend

- `game_saves`: cubierta por migraciones online existentes.
- `astracorp_elections`: cubierta por `20260429_elections_online.sql`.
- `profiles`: cubierta por la nueva migracion `20260430_profiles_adpool.sql`.

## Nueva migracion anadida

Archivo:

```text
supabase/migrations/20260430_profiles_adpool.sql
```

Incluye:

- Tabla `profiles`.
- RLS para leer/insertar/actualizar perfil propio.
- Trigger `on_auth_user_created_profile` para crear perfil al registrarse.
- Tabla `astracorp_ad_pool_daily`.
- Tabla `astracorp_ad_player_daily`.
- RLS de lectura para pool y lectura propia para datos de jugador.
- RPC:
  - `rpc_flush_ad_views`
  - `rpc_close_ad_pool_day`
  - `rpc_get_my_ad_income_summary`
  - `rpc_get_my_ad_income_history`

## Orden recomendado para ejecutar SQL

Si la base esta vacia o incompleta, ejecutar primero los archivos normales, no los `_BLOCKS`, salvo que el editor SQL corte funciones largas.

1. `20260429_company_multiplayer.sql`
2. `20260429_territory_multiplayer.sql`
3. `20260429_market_multiplayer.sql`
4. `20260429_missions_contracts_online.sql`
5. `20260429_work_online.sql`
6. `20260429_research_online.sql`
7. `20260429_hq_online.sql`
8. `20260429_player_rankings.sql`
9. `20260429_elections_online.sql`
10. `20260430_profiles_adpool.sql`
11. `20260503_company_cost_rebalance.sql`

Si Supabase SQL Editor da problemas con archivos largos, usar la variante `_BLOCKS.sql` equivalente y ejecutar bloque a bloque.

## Riesgos / cosas a comprobar manualmente

- `profiles` puede existir ya en el proyecto remoto. La migracion usa `create table if not exists`, pero conviene revisar columnas/policies si ya habia una version previa.
- `rpc_close_ad_pool_day` distribuye el pool diario entre jugadores activos usando el mismo criterio visual del frontend: `total_pool / active_players * pct / 100`.
- Las migraciones usan `security definer`; revisar permisos si se modifica `search_path` o se mueven schemas.
- Las tablas de eventos (`astracorp_*_events`) son historicas/diagnosticas; el juego depende sobre todo de `game_saves` y de las RPC.

## Estado de verificacion local

- `npm run lint`: limpio en la ultima verificacion.
- No se ejecuto conexion real a Supabase desde aqui.
- La validacion final debe hacerse aplicando SQL en Supabase y probando:
  1. registro/login;
  2. guardado y carga de partida;
  3. ranking;
  4. anuncios e ingresos;
  5. una accion online de cada modulo principal.
