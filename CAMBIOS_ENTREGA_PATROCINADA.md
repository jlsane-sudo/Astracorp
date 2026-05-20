# Cambios entrega patrocinada

## Decision de balance

La entrega masiva con publicidad no consume energia. La energia operativa solo baja al entregar contratos de forma normal.

Motivo: en la entrega patrocinada el coste lo paga el patrocinador/anuncio. Si tambien gastase energia, la recompensa publicitaria se sentiria doblemente castigada.

## Cambios hechos

- Se renombro `Entrega publicitaria` a `Entrega patrocinada`.
- El boton ahora dice `Entrega patrocinada`.
- El texto indica que no consume energia.
- El tooltip explica que el patrocinador cubre la logistica.
- El log ahora registra: energia cubierta por patrocinador.
- La notificacion tambien aclara que se entrego sin gastar energia.

## Validacion

- `npm run lint`: correcto.
- `npm run build`: correcto.
