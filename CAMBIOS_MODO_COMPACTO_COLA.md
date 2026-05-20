# Cambios: modo compacto y cola operativa

## Objetivo

Evitar que el jugador vea varios bloques diciendo cosas parecidas. La pantalla principal debe responder a una pregunta: que tengo que hacer ahora.

## Cambios realizados

### Modo compacto / detalle

- Se anade un selector global `Compacto / Detalle`.
- El modo se guarda en la partida como `uiMode`.
- Las partidas nuevas arrancan en modo `compact`.
- En modo `Compacto` se ocultan:
  - Alertas extendidas.
  - Panel de impacto.
  - Director operativo.
- En modo `Detalle` vuelven esos paneles para jugadores que quieran mas contexto.

### Cola operativa

- Se reemplaza el bloque de acciones disponibles por una `Cola operativa`.
- La cola muestra hasta 5 acciones prioritarias.
- Cada fila tiene:
  - Accion.
  - Motivo corto.
  - Boton/CTA.
- La cola detecta:
  - Frentes rivales.
  - Contratos listos.
  - Contratos urgentes.
  - Almacenes casi llenos.
  - Empresas con stock.
  - Energia baja.
  - Primera empresa disponible.
  - Balance/trabajo como fallback.

### Acciones directas

- Si la cola muestra `Entregar pedidos`, intenta entregar contratos listos.
- Si muestra `Recoger produccion` o `Vaciar almacenes`, intenta recoger toda la produccion con el flujo existente.
- El resto de acciones abre la pestana correspondiente.

## Archivos tocados

- `src/App.jsx`
- `src/styles/global.css`
- `src/hooks/engine/gamePureLogic.js`
- `src/hooks/engine/useGameActions.js`

## Validacion

- `npm run build` ejecutado correctamente.

## Nota de diseno

Antes teniamos varios niveles simultaneos: alertas, impacto, director, action dock e inicio. Ahora el modo compacto deja una sola fuente principal: `Cola operativa`.

El modo detalle conserva el contexto profundo sin obligar a todos los jugadores a leerlo siempre.
