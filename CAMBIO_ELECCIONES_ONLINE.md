# Cambio: elecciones/protocolos online

## Objetivo

Mover los protocolos de control de sectores a Supabase para que no dependan solo del estado local del navegador. En una partida online, iniciar, votar y resolver un protocolo debe pasar por RPCs seguras.

## Archivos tocados

- `src/services/multiplayerActions.js`
  - Anade `startElectionSecure`, `voteElectionSecure` y `resolveElectionSecure`.
- `src/hooks/engine/useGameActions.js`
  - `startElection` intenta primero `rpc_start_election_secure` si hay usuario conectado.
  - `voteElection` intenta primero `rpc_vote_election_secure` si hay usuario conectado.
  - Si las RPC no estan instaladas, conserva fallback local temporal.
- `src/hooks/engine/useGameTicks.js`
  - La resolucion automatica del protocolo intenta primero `rpc_resolve_election_secure`.
  - Si no existe la RPC, sigue resolviendo localmente para no bloquear la partida.
- `supabase/migrations/20260429_elections_online.sql`
  - Crea tabla global `astracorp_elections`.
  - Crea RPCs seguras para iniciar, votar y resolver protocolos.
- `supabase/migrations/20260429_elections_online_BLOCKS.sql`
  - Misma migracion separada en 18 bloques para ejecutar en Supabase SQL Editor.

## Funcionamiento

1. El jugador inicia un protocolo desde un sector.
2. Supabase valida nivel, creditos, energia, sector existente y que no haya otro protocolo activo en ese sector.
3. Se crea una fila en `astracorp_elections` con candidatos, votos vacios y cierre a 30 segundos.
4. Al votar, Supabase valida candidato, energia y que ese usuario no haya votado ya.
5. Al terminar el tiempo, la RPC de resolucion calcula votos, suma apoyo NPC y actualiza el controlador del sector en la partida guardada.

## Costes actuales

- Iniciar protocolo: nivel 4, 2 creditos y energia de `startElection`.
- Votar: energia de `voteElection`.
- La energia respeta descuentos por investigacion de eficiencia y sala de operaciones de la sede.

## Instalacion en Supabase

Usar `supabase/migrations/20260429_elections_online_BLOCKS.sql` y ejecutar un bloque cada vez.

Importante: si Supabase anade texto automatico tipo `-- source: dashboard` dentro de una funcion, borra ese texto antes de ejecutar el bloque. No mezcles varios bloques en una sola ejecucion si vuelve a pasar.

## Pendiente recomendado

Ahora los protocolos ya pasan por servidor, pero la interfaz sigue mostrando el protocolo desde el save del jugador. El siguiente paso natural seria anadir una vista/listado de protocolos activos globales para que otros jugadores puedan entrar a votar aunque no hayan iniciado ellos el protocolo.
