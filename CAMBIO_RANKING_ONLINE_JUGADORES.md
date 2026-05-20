# Cambio: ranking online de jugadores

## Objetivo

La pestaña Jugadores deja de ser una lista local de NPCs y pasa a poder mostrar jugadores reales guardados en Supabase.

## Cambios de cliente

- Nuevo servicio `src/services/rankings.js` con `getPlayerRankingsSecure()`.
- `src/hooks/useAstraCorpGame.js` carga el ranking al abrir la pestaña `Jugadores` y lo refresca cada 60 segundos.
- Si la RPC no existe todavia, se mantiene el fallback local con NPCs y el jugador actual.
- `src/components/views/PlayersView.jsx` ahora muestra:
  - ranking por puntuacion estimada;
  - nivel;
  - creditos;
  - sectores controlados;
  - empresas;
  - actividad reciente.

## Cambios de Supabase

Nueva migracion:

- `supabase/migrations/20260429_player_rankings.sql`

Version por bloques para el SQL Editor:

- `supabase/migrations/20260429_player_rankings_BLOCKS.sql`

RPC nueva:

- `rpc_get_player_rankings(p_limit integer default 50)`

## Formula de puntuacion

`creditos + nivel * 25 + empresas * 12 + territorios * 40 + pct * 2`

No es una economia definitiva, solo una puntuacion compacta para ordenar el ranking.
