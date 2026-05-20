# Cambio: cobro de tasas de ocupacion

## Idea

La ocupacion territorial ahora se cierra economicamente: si controlas un territorio con empresas ajenas operando dentro, puedes cobrar las tasas acumuladas por esas empresas.

## Archivos modificados

- `src/hooks/engine/gamePureLogic.js`
- `src/hooks/engine/useGameActions.js`
- `src/components/views/MapView.jsx`
- `src/App.jsx`

## Cambios de motor

- Las empresas ahora guardan `ownerName`.
- La ocupacion ya no se calcula solo contra el jugador actual, sino contra el propietario real de la empresa.
- Una empresa esta ocupada si el controlador del territorio es distinto de su `ownerName`.
- Las empresas nuevas guardan como propietario el nombre del jugador que las construye.
- Las partidas antiguas normalizan empresas existentes asignandoles propietario.

## Nueva accion

Se añade:

- `collectOccupationTaxes(territoryId)`

La accion:

- comprueba que el territorio exista;
- comprueba que el jugador controle ese territorio;
- busca empresas del territorio cuyo `occupiedBy` sea el jugador;
- suma `occupationTaxPending` por recurso;
- añade esos recursos al inventario;
- pone las tasas cobradas a `0`;
- registra log y notificacion.

## Cambios visuales

En el mapa territorial:

- Al seleccionar un territorio propio aparece el bloque `Tasas de ocupacion`.
- Si hay tasas pendientes, se muestra el recurso y cantidad acumulada.
- Si no hay tasas, se informa claramente.
- Se añade el boton `Cobrar tasas`.
- El boton queda desactivado como `Sin tasas pendientes` cuando no hay nada que cobrar.

## Regla importante

No puedes cobrar tasas de tus propias empresas al reconquistar un territorio. Solo se cobran tasas de empresas cuyo controlador territorial actual eres tu y cuyo propietario es otro.

## Resultado esperado

El control territorial ahora tiene una tercera recompensa economica:

1. tus empresas producen al 100% en territorios propios;
2. desbloqueas contratos territoriales;
3. puedes cobrar tasas de ocupacion a empresas ajenas en tus sectores.

## Verificacion

Ejecutado correctamente:

```bash
npm run build
```

La compilacion de produccion finalizo sin errores.
