# Cambio: trabajos online

## Objetivo

Mover los trabajos manuales a Supabase para que un jugador online no pueda manipular desde el navegador el inicio, el tiempo de finalizacion o el cobro de recursos/creditos/XP.

## Cliente

- `src/services/multiplayerActions.js`
  - `startWorkSecure({ jobLabel })`
  - `completeWorkSecure()`
  - `boostWorkSecure()`

- `src/hooks/engine/useGameActions.js`
  - `doWork` intenta iniciar el trabajo en Supabase si hay sesion.
  - `triggerWorkAdBoost` intenta acelerar el trabajo en Supabase si hay sesion.
  - Si las RPC no estan instaladas, mantiene fallback local para no bloquear el juego.

- `src/hooks/engine/useGameTicks.js`
  - Al terminar el temporizador de un trabajo online, llama a `rpc_complete_work_secure`.
  - La recompensa real se entrega desde Supabase.
  - En invitado o sin RPC instalada, sigue usando la finalizacion local.

## Supabase

Archivos creados:

- `supabase/migrations/20260429_work_online.sql`
- `supabase/migrations/20260429_work_online_BLOCKS.sql`

Funciones principales:

- `rpc_start_work_secure(p_job_label text)`
  - Valida que el trabajo existe en la lista permitida.
  - Bloquea la partida del usuario.
  - Comprueba nivel, energia e integridad.
  - Descuenta energia.
  - Crea `activeJob` con `startedAt` y `endAt` calculados en servidor.

- `rpc_boost_work_secure()`
  - Bloquea la partida.
  - Comprueba que hay trabajo activo y que no se ha usado boost.
  - Recalcula `endAt` en servidor usando investigacion de publicidad.

- `rpc_complete_work_secure()`
  - Bloquea la partida.
  - Comprueba que el trabajo ya ha terminado segun tiempo real del servidor.
  - Entrega 1 recurso del tipo del trabajo, creditos y XP.
  - Ajusta integridad segun `hd`.
  - Incrementa `stats.works`.
  - Avanza misiones `work`, `collect_oxygen_tanks` y `collect_habitat_modules` si corresponde.

## Instalacion

Usa:

`supabase/migrations/20260429_work_online_BLOCKS.sql`

Ejecuta un bloque cada vez en Supabase SQL Editor. Son 20 bloques.

## Resultado jugable

Los trabajos quedan preparados para multijugador: el cliente muestra el temporizador, pero Supabase decide si el trabajo puede empezar, si el boost es valido y si ya se puede cobrar.
