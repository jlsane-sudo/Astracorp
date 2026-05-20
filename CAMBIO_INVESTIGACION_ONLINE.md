# Cambio: investigacion online

## Objetivo

Mover la investigacion a Supabase para que en multijugador no se puedan manipular costes, recursos, tiempos ni finalizaciones desde el navegador.

## Cliente

- `src/services/multiplayerActions.js`
  - `startResearchSecure({ upgradeKey })`
  - `boostResearchSecure()`
  - `completeResearchSecure()`

- `src/hooks/engine/useGameActions.js`
  - `buyResearchUpgrade` intenta iniciar la investigacion en Supabase si hay sesion.
  - `triggerResearchAdBoost` intenta acelerar el proyecto en Supabase si hay sesion.
  - Si las RPC no estan instaladas, mantiene fallback local.

- `src/hooks/engine/useGameTicks.js`
  - Cuando el proyecto llega a `endsAt`, llama a `rpc_complete_research_secure`.
  - La subida de nivel de investigacion la decide Supabase.
  - El modo invitado sigue completando localmente.

## Supabase

Archivos creados:

- `supabase/migrations/20260429_research_online.sql`
- `supabase/migrations/20260429_research_online_BLOCKS.sql`

Funciones principales:

- `rpc_start_research_secure(p_upgrade_key text)`
  - Valida que la mejora existe y no esta al maximo.
  - Bloquea la partida del usuario.
  - Comprueba que no hay otra investigacion activa.
  - Calcula coste en creditos, recursos y tiempo desde el nivel actual.
  - Aplica bonus de laboratorios y planeta al tiempo.
  - Descuenta creditos y recursos en servidor.
  - Guarda `researchProjects.active` con `startedAt` y `endsAt` generados en servidor.

- `rpc_boost_research_secure()`
  - Comprueba que hay proyecto activo.
  - Evita usar el boost dos veces.
  - Descuenta energia segun eficiencia e instalaciones de sede.
  - Recalcula `endsAt` en servidor.

- `rpc_complete_research_secure()`
  - Comprueba con tiempo real del servidor que el proyecto ha terminado.
  - Sube el nivel de investigacion.
  - Recalcula energia maxima por baterias auxiliares.
  - Actualiza multiplicador de boost empresarial.
  - Limpia `researchProjects.active`.

## Instalacion

Usa:

`supabase/migrations/20260429_research_online_BLOCKS.sql`

Ejecuta un bloque cada vez en Supabase SQL Editor. Son 21 bloques.

## Resultado jugable

La investigacion queda protegida para online: el cliente puede mostrar la UI y el temporizador, pero Supabase decide si se puede iniciar, acelerar o completar.
