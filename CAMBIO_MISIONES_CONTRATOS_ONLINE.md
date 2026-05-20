# Cambio: misiones y contratos online

## Objetivo

Evitar que misiones y contratos importantes dependan solo del estado local del navegador. En multijugador, entregar contratos y reclamar misiones debe validarse en Supabase para impedir doble cobro, estados antiguos o recompensas manipuladas desde cliente.

## Cliente

- `src/services/multiplayerActions.js`
  - Nueva RPC `deliverContractSecure` para entregar contratos en servidor.
  - Nueva RPC `claimMissionRewardSecure` para reclamar recompensas de misiones en servidor.

- `src/hooks/engine/useGameActions.js`
  - `deliverContract` ahora intenta primero `rpc_deliver_contract_secure` si el jugador tiene sesion.
  - `claimMissionReward` ahora intenta primero `rpc_claim_mission_reward_secure` si el jugador tiene sesion.
  - Si las RPC no estan instaladas, el juego conserva la logica local como fallback temporal para no romper el modo actual.
  - El modo invitado sigue usando la logica local.

## Servidor Supabase

Archivos creados:

- `supabase/migrations/20260429_missions_contracts_online.sql`
- `supabase/migrations/20260429_missions_contracts_online_BLOCKS.sql`

Funciones principales:

- `rpc_deliver_contract_secure(p_contract_id text)`
  - Bloquea la partida del usuario.
  - Comprueba que el contrato existe, no esta completado y no ha expirado.
  - Comprueba energia e inventario.
  - Si es territorial, comprueba que el territorio sigue bajo control del jugador.
  - Resta recursos y energia.
  - Aplica creditos y XP con la misma curva de niveles del cliente.
  - Marca el contrato como completado.
  - Avanza misiones de tipo `contract` y `territory_contract`.
  - Guarda la partida y registra evento.

- `rpc_claim_mission_reward_secure(p_mission_id text)`
  - Bloquea la partida del usuario.
  - Comprueba que la mision existe, no esta reclamada y esta lista.
  - Entrega creditos, XP y recursos.
  - Marca la mision como `done`.
  - Guarda la partida y registra evento.

## Instalacion en Supabase

Usa preferiblemente:

`supabase/migrations/20260429_missions_contracts_online_BLOCKS.sql`

Ejecuta un bloque cada vez en el SQL Editor. Esto evita los errores que ya vimos de Supabase metiendo texto dentro de una funcion y rompiendo `$fn$`.

## Resultado jugable

Los contratos y misiones ya quedan preparados como acciones server-first para multijugador online. Si dos pestañas, dos dispositivos o dos clicks intentan cobrar lo mismo, Supabase valida el estado real bloqueado y solo debe aceptar una accion valida.
