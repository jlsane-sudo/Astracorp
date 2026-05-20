# Cambio: panel de frentes activos

## Idea

El jugador no deberia tener que revisar todos los territorios uno a uno para entender donde esta el peligro. El mapa ahora incluye un resumen de inteligencia territorial con los sectores propios mas relevantes.

## Archivo modificado

- `src/components/views/MapView.jsx`

## Cambios aplicados

Se añade el panel `Frentes activos` debajo del resumen del mapa.

El panel muestra hasta 3 territorios propios con mayor riesgo, usando:

- amenaza;
- estabilidad;
- fortificacion;
- presion NPC reciente;
- recomendacion tactica.

## Recomendaciones posibles

- `Reforzar ahora`
- `Construir fortin`
- `Vigilar estabilidad`
- `Controlado`

## Interaccion

Cada fila del panel es clickable. Al pulsarla, selecciona ese territorio en el mapa y muestra su detalle completo.

## Resultado esperado

El mapa se vuelve mas legible:

- el jugador ve de un vistazo los sectores prioritarios;
- los ataques de NPCs tienen seguimiento visual;
- las decisiones de reforzar o construir fortines son mas claras;
- se reduce la necesidad de inspeccionar todos los hexagonos manualmente.

## Verificacion

Ejecutado correctamente:

```bash
npm run build
```

La compilacion de produccion finalizo sin errores.
