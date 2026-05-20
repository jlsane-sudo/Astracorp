# Cambios: impacto de acciones y botones bloqueados

## Objetivo

Que el jugador entienda que va a pasar antes de actuar y que reciba una respuesta clara cuando intenta pulsar una accion bloqueada.

## Cambios realizados

- Se ha anadido un panel de `Prioridad diaria`.
- La prioridad diaria detecta el estado actual y propone el siguiente foco:
  - Defender frentes rivales.
  - Estabilizar sectores en riesgo.
  - Cerrar contratos urgentes.
  - Cobrar contratos listos.
  - Recoger produccion.
  - Comprar la primera empresa.
  - Subir nivel si no hay urgencias.
- Se ha anadido un panel de impacto contextual por pestana:
  - En `Misiones`, muestra coste de energia, recursos consumidos y recompensa de contrato.
  - En `Empresas`, muestra energia necesaria para recoger y stock acumulado.
  - En `Mapa`, muestra coste de reforzar o atacar, probabilidad de exito y progreso de campana.
  - En `Ads`, muestra coste de energia y beneficio esperado.
  - En `Trabajos`, muestra si hay trabajo activo o el impacto esperado de empezar uno.
- Se ha anadido un bloque de `Consecuencias recientes` usando el log de la partida.
- El boton comun ya no usa bloqueo nativo silencioso.
- Si una accion comun esta bloqueada y el jugador la pulsa, ahora aparece un toast:
  - `No puedes: ...`
- Se mantiene `aria-disabled` para accesibilidad y el estilo visual de boton desactivado.

## Archivos tocados

- `src/App.jsx`
- `src/components/ui.jsx`
- `src/hooks/engine/useGameActions.js`
- `src/styles/global.css`

## Validacion

- `npm run build` ejecutado correctamente.

## Nota de diseno

La mejora importante no es solo mostrar mas texto. Es cerrar el circuito:

1. Que el juego diga que conviene hacer.
2. Que explique el coste y resultado probable.
3. Que responda cuando el jugador pulsa algo bloqueado.
4. Que recuerde las consecuencias recientes.

Esto deberia reducir bastante la sensacion de "he pulsado y no ha pasado nada".
