# Cambio: sede online

## Objetivo

Mover la sede corporativa a Supabase para que en multijugador no se puedan manipular mejoras, reparacion de integridad o viajes planetarios desde el navegador.

## Cliente

- `src/services/multiplayerActions.js`
  - `upgradeHqSecure({ upgradeKey })`
  - `repairIntegritySecure()`
  - `selectPlanetSecure({ planetId })`

- `src/hooks/engine/useGameActions.js`
  - `buyHqUpgrade` intenta mejorar la sede en Supabase si hay sesion.
  - `repairIntegrity` intenta reparar integridad en Supabase si hay sesion.
  - `selectPlanet` intenta viajar de planeta en Supabase si hay sesion.
  - Si las RPC no estan instaladas, mantiene fallback local.

## Supabase

Archivos creados:

- `supabase/migrations/20260429_hq_online.sql`
- `supabase/migrations/20260429_hq_online_BLOCKS.sql`

Funciones principales:

- `rpc_upgrade_hq_secure(p_upgrade_key text)`
  - Valida que la mejora existe y no esta al maximo.
  - Calcula el coste creciente de creditos y productos desde el nivel real.
  - Bloquea la partida.
  - Descuenta creditos/productos y sube el nivel de sede.

- `rpc_repair_integrity_secure()`
  - Calcula la reparacion maxima actual, hasta +30.
  - Valida creditos y productos.
  - Descuenta coste y sube `player.health` sin pasar de 100.

- `rpc_select_planet_secure(p_planet_id text)`
  - Valida requisitos de nivel, creditos, empresas, contratos, contratos territoriales, territorios, sede e investigacion.
  - Valida coste de viaje y productos.
  - Descuenta coste y cambia `currentPlanet` en servidor.
  - Limpia contratos para que el cliente regenere contratos del nuevo planeta al normalizar.

## Instalacion

Usa:

`supabase/migrations/20260429_hq_online_BLOCKS.sql`

Ejecuta un bloque cada vez en Supabase SQL Editor. Son 21 bloques.

## Resultado jugable

La sede, la integridad y el salto planetario quedan protegidos para online. El cliente muestra botones y progreso, pero Supabase decide si se puede pagar, reparar o viajar.
