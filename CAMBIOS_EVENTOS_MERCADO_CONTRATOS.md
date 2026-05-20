# Cambios eventos conectados a mercado y contratos

## Objetivo

Que los eventos temporales de sesion dejen de sentirse decorativos y tengan lectura economica clara.

## Cambios hechos

- El banner de evento ahora muestra:
  - contratos afectados,
  - creditos extra potenciales,
  - recursos impactados,
  - botones directos a contratos/mercado.

- Los contratos afectados por evento:
  - suben al principio de la lista,
  - muestran badge `Evento activo`,
  - muestran porcentaje de mejora,
  - muestran creditos extra por evento.

- El mercado ahora marca oportunidades de evento:
  - panel de evento activo con recursos afectados,
  - tarjetas afectadas con borde especial,
  - etiqueta con el nombre del evento,
  - recomendacion clara para vender/cerrar contratos.

- Se anadio memoria de eventos:
  - al terminar un evento se guarda en historial,
  - el sidebar muestra eventos recientes,
  - registra contratos entregados, ventas y creditos extra.

- Si un evento termina sin aprovecharse:
  - el log avisa que fue una oportunidad perdida.

## Validacion

- `npm run lint`: correcto.
- `npm run build`: correcto.
