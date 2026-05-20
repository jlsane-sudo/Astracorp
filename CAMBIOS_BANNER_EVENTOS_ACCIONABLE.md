# Cambios banner de eventos accionable

## Problema

Eventos como `Convoy de emergencia` aparecian sin explicar claramente que significaban ni que podia hacer el jugador.

## Cambios hechos

- El texto de `Convoy de emergencia` ahora explica que mineral y componentes metalicos pagan mejor durante la ventana.
- Los eventos de sesion tienen una pista de accion (`actionHint`).
- El banner muestra recursos afectados.
- El banner muestra tiempo restante aproximado cuando el evento tiene caducidad.
- El banner incluye botones directos:
  - `Ver contratos`
  - `Ver mercado`
  - `Ver Ads` cuando es un evento publicitario.
- El banner sigue dejando pasar clicks fuera de sus botones para no bloquear el menu.

## Resultado esperado

Cuando aparezca un evento, el jugador debe entender:

- Que esta pasando.
- Que recursos afecta.
- Cuanto dura.
- Donde ir para aprovecharlo.

## Validacion

- `npm run lint`: correcto.
- `npm run build`: correcto.
