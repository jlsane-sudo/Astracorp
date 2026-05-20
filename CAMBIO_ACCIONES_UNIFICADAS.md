# Cambio: acciones unificadas y estado fresco

Se ha corregido la desincronización entre construcción y mercado.

## Archivos modificados

- `src/hooks/engine/useGameActions.js`

## Qué cambia

- `buyItem`, `sellItem` y `buildCompany` ahora usan `setSave(prev => ...)`.
- Antes de validar una acción se recalcula la economía con `hydrateCompaniesAndInventory(...)`.
- Construcción, compra y venta validan contra el estado vivo más reciente, no contra una copia antigua del estado.
- Los mensajes de bloqueo son más concretos: créditos, energía, nivel, stock o recurso no disponible.
- Se reduce el caso en el que el asistente recomienda construir y al pulsar aparece "la construcción ya no es válida" por estado desactualizado.

## Nota

La capa RPC de Supabase sigue teniendo prioridad cuando exista. Si las RPC no están instaladas, el juego usa la lógica local corregida como fallback.
