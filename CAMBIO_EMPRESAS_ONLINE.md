# Cambio: empresas online server-first

## Objetivo

Cerrar el sistema de empresas para multijugador: construir, vender y recoger produccion pasan primero por Supabase cuando el jugador tiene sesion iniciada.

## Cliente

El cliente ya estaba preparado para llamar a RPCs desde `src/hooks/engine/useGameActions.js`.

Ajuste realizado:

- `src/services/multiplayerActions.js` envia `companyId` como texto para evitar problemas con ids generados como numero decimal o string.

RPCs usadas por el cliente:

- `rpc_build_company_secure(p_company_type_key, p_region_key, p_territory_id)`
- `rpc_sell_company_secure(p_company_id)`
- `rpc_collect_company_secure(p_company_id)`
- `rpc_collect_company_group_secure(p_company_type_key, p_region_key)`
- `rpc_collect_all_companies_ad_secure()`

## Supabase

Nueva migracion:

- `supabase/migrations/20260429_company_multiplayer.sql`

Version por bloques:

- `supabase/migrations/20260429_company_multiplayer_BLOCKS.sql`

Incluye:

- tabla `astracorp_company_events` para auditoria;
- bloqueo de fila en `game_saves` antes de modificar empresas;
- calculo server-side de coste escalado de construccion;
- gasto de energia al construir y recoger;
- hidratacion de produccion antes de recoger/vender;
- consumo de inputs para cadenas industriales;
- recogida individual, por grupo y total por anuncio;
- reembolso controlado al vender.

## Nota

La logica server-side es conservadora: reproduce el nucleo economico de empresas sin depender del navegador. El cliente mantiene fallback local si la RPC no esta instalada, pero en online la autoridad pasa a Supabase.
