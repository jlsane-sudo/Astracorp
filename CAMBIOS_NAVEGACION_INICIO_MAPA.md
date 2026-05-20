# Cambios: navegacion agrupada, inicio operativo y mapa compacto

## Objetivo

Reducir la sensacion de demasiadas pestanas y demasiada lectura antes de actuar.

## Cambios realizados

### Navegacion

- Se anade la pestana `Inicio`.
- La navegacion principal pasa de 12 entradas a 6 bloques:
  - `Inicio`
  - `Operar`
  - `Contratos`
  - `Territorio`
  - `Base`
  - `Social`
- Cada bloque muestra subpestanas pequenas solo cuando esta activo.
- Las rutas internas siguen existiendo:
  - Operar: `Trabajos`, `Empresas`
  - Contratos: `Misiones`, `Mercado`
  - Territorio: `Mapa`, `Politica`
  - Base: `Sede`, `Mejoras`, `Balance`
  - Social: `Ads`, `Jugadores`, `Chat`

### Inicio operativo

- Se crea una nueva vista `Inicio`.
- La vista muestra:
  - Prioridad inmediata.
  - 4 tarjetas de estado: empresas, contratos, mapa y base.
  - Accesos rapidos a trabajar, empresas, contratos y mapa.
  - Ultimos movimientos del log.
- En `Inicio` se ocultan paneles redundantes como impacto, foco operativo y action dock para no duplicar informacion.

### Mapa

- Se elimina el bloque explicativo superior antes del mapa.
- La ayuda larga del sector pasa a un desplegable `Ayuda y reglas del sector`.
- El panel del mapa mantiene estado, memoria, metricas y acciones, pero reduce texto visible permanente.

### Motor de estado

- `home` se anade como pestana valida.
- Las partidas nuevas arrancan en `Inicio`.
- La normalizacion de saves acepta `home`.

## Archivos tocados

- `src/components/Tabs.jsx`
- `src/App.jsx`
- `src/hooks/engine/gamePureLogic.js`
- `src/hooks/engine/useGameActions.js`
- `src/components/views/MapView.jsx`
- `src/styles/global.css`

## Validacion

- `npm run build` ejecutado correctamente.

## Nota de diseno

No se han borrado sistemas. Solo se ha cambiado el acceso:

- Menos opciones visibles a la vez.
- Subpestanas dentro de grupos.
- Inicio como punto de entrada accionable.
- Mapa con ayuda bajo demanda.
