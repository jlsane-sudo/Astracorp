# Cambio: presion territorial de NPCs

## Idea

Los territorios ya no reciben solo presion generica. Ahora algunos ticks de presion pueden venir de un NPC concreto, para que el mapa se sienta disputado por rivales reconocibles.

## Archivos modificados

- `src/hooks/engine/gamePureLogic.js`
- `src/hooks/engine/useGameTicks.js`
- `src/components/views/MapView.jsx`

## Cambios de motor

- La presion sobre territorios propios puede generar un atacante NPC.
- El atacante se toma de los NPCs del guardado o de la lista base.
- La presion aumenta amenaza y puede reducir estabilidad.
- La fortificacion mitiga una parte importante de esa presion.
- Cada territorio puede guardar datos del ultimo frente activo:
  - `lastPressureAt`
  - `lastPressureAttacker`
  - `lastPressureThreat`
  - `lastPressureStabilityLoss`

## Cambios en logs y avisos

Cuando ocurre una presion relevante se registra algo como:

- `Viktor Sokolov presiona Dust Basin: +3.4 amenaza · mitigado 32%`

Si el sector llega a estado critico o se pierde, esos avisos siguen teniendo prioridad.

## Cambios visuales

En el mapa territorial:

- Al seleccionar un territorio con presion reciente aparece `Frente activo`.
- Se muestra el NPC que presiono el sector.
- Se muestra la amenaza generada y la perdida de estabilidad si aplica.

## Relacion con fortines

Los fortines reducen la presion efectiva de los NPCs. Esto hace que construir fortines tenga sentido tactico: no solo suben un numero, tambien reducen el impacto de futuras ofensivas indirectas.

## Resultado esperado

El mapa debe sentirse mas vivo:

- los NPCs dejan de ser decorado;
- los territorios propios tienen amenazas con nombre;
- los fortines tienen valor defensivo visible;
- el jugador recibe senales claras de donde debe reforzar o fortificar.

## Verificacion

Ejecutado correctamente:

```bash
npm run build
```

La compilacion de produccion finalizo sin errores.
