# Cambios: vistas compactas y menos lectura

## Objetivo

Reducir la carga visual de las pestanas principales. La idea es que el jugador vea primero accion, estado y boton; los detalles quedan debajo o en modal.

## Cambios realizados

### Empresas

- La vista deja de abrir con varios paneles largos de explicacion.
- El asistente se reduce a una franja de accion inmediata.
- Las empresas pasan de tarjetas verticales a filas compactas.
- Cada fila muestra:
  - Nombre y cantidad.
  - Recurso y region.
  - Estado.
  - Stock/progreso.
  - Botones principales: recoger, comprar, detalles, vender.
- Los detalles avanzados se mantienen en el modal de `Detalles`.
- Las empresas no construidas se muestran como filas pequenas de compra.

### Misiones

- Los contratos pasan de tarjetas grandes a filas expandibles.
- La cabecera muestra solo lo importante:
  - Contratos listos.
  - Creditos potenciales.
  - Boton de entrega patrocinada.
- El evento activo se muestra como una banda pequena, no como tarjeta completa.
- Cada contrato muestra en una linea:
  - Pedido.
  - Progreso de recurso.
  - Tiempo restante.
  - Prioridad/recompensa.
- Los detalles del contrato quedan bajo desplegable.
- Las misiones pasivas se muestran como filas compactas con barra y boton.

### Trabajos

- Los trabajos pasan de tarjetas grandes a filas compactas.
- La cabecera muestra:
  - Trabajo activo o recomendado.
  - Energia disponible.
  - Tiempo restante si hay trabajo activo.
- Cada trabajo muestra:
  - Nombre.
  - Recurso.
  - Recompensa.
  - Duracion/coste.
  - Estado.
  - Boton iniciar.
- Se elimina de la vista principal el texto explicativo repetido.

## Archivos tocados

- `src/components/views/BusinessView.jsx`
- `src/components/views/MissionsView.jsx`
- `src/components/views/WorkView.jsx`

## Validacion

- `npm run build` ejecutado correctamente.

## Nota de diseno

Este cambio no elimina informacion: cambia la jerarquia.

- Lo urgente queda arriba.
- Lo accionable queda en filas.
- Lo secundario queda en detalles.

El objetivo es que el usuario pueda actuar en 2 segundos sin leer una pared de texto.
