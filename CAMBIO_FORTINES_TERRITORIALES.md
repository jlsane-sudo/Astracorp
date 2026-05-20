# Cambio: fortines territoriales

## Idea

Los territorios propios ahora pueden recibir una inversion defensiva permanente: fortines. Es una decision economica basada en recursos, no en reparto publicitario ni dinero real.

## Archivos modificados

- `src/hooks/engine/useGameActions.js`
- `src/components/views/MapView.jsx`
- `src/App.jsx`

## Nueva accion

Se añade:

- `buildTerritoryFort(territoryId)`

La accion:

- solo funciona en territorios controlados por el jugador;
- no permite construir si la fortificacion ya esta al 100%;
- consume recursos industriales del inventario;
- aumenta fortificacion;
- aumenta estabilidad;
- reduce amenaza;
- actualiza el territorio seleccionado, log y notificacion.

## Coste

El coste escala con la fortificacion actual del territorio:

- mineral;
- componentes metalicos;
- estructuras de aleacion a partir de fortificaciones medias/altas.

Esto evita que fortificar todo el mapa sea gratis o trivial.

## Cambios visuales

En el mapa territorial, al seleccionar un territorio propio aparece:

- bloque `Fortin territorial`;
- coste del fortin;
- efecto esperado;
- boton `Construir fortin`;
- estado `Fortin maximo` si ya esta al 100%.

## Diferencia con reforzar

- `Reforzar` es una accion rapida de creditos/energia para estabilizar un sector.
- `Construir fortin` es una inversion de recursos que mejora la defensa territorial de forma mas estructural.

## Resultado esperado

El jugador tiene una decision nueva en el mapa:

- expandirse;
- reforzar temporalmente;
- invertir recursos para blindar territorios clave.

## Verificacion

Ejecutado correctamente:

```bash
npm run build
```

La compilacion de produccion finalizo sin errores.
