# Cambios aplicados al Asistente de colonia

Archivo modificado:

- `src/components/views/BusinessView.jsx`

## Mejoras incluidas

- Estado global de economía:
  - Economía en colapso
  - Economía inestable
  - Economía estable
  - Colonia en arranque

- Bloque de prioridad:
  - Prioridad: reparar cadena
  - Prioridad: escalar

- Impacto de acción:
  - Explica qué mejora produce la recomendación actual.
  - En construcción, muestra producción/hora que añade.
  - En recogida, venta o contrato, explica por qué conviene hacerlo.

- Producción neta mejorada:
  - Cada recurso muestra estado: crítico, inestable u óptimo.
  - Si un recurso está en negativo, muestra pérdida estimada por hora.

- Preparado para territorios:
  - Si detecta empresas con campos de ocupación (`isOccupied`, `occupied`, `occupation.isOccupied`, `occupier` u `occupiedBy`), muestra aviso de ocupación territorial.

## Nota

No he tocado la lógica crítica de producción ni de Supabase en este cambio. Es una mejora de lectura, prioridad y experiencia visual del asistente.
