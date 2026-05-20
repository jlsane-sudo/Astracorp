# Cambio: contratos exclusivos por territorio

## Idea

Los territorios controlados ahora desbloquean pedidos especiales. El mapa deja de ser solo una capa militar: controlar un sector tambien abre oportunidades economicas concretas.

## Archivos modificados

- `src/hooks/engine/gamePureLogic.js`
- `src/hooks/engine/useGameTicks.js`
- `src/hooks/engine/useGameActions.js`
- `src/components/views/MissionsView.jsx`

## Logica aplicada

- A partir de nivel 4, cada territorio controlado por el jugador puede generar un contrato exclusivo.
- El contrato usa el recurso asociado al bonus economico de ese territorio.
- Los contratos territoriales tienen mejor recompensa que los contratos normales.
- Se mantienen aparte de los slots normales de contratos, asi que no sustituyen los pedidos basicos.
- Si el jugador pierde el territorio, el contrato exclusivo desaparece al refrescar contratos.
- Al entregar un contrato territorial, se comprueba de nuevo que el territorio siga bajo control del jugador.

## Ejemplos

- `Dust Basin` puede generar un mandato de mineral.
- `Helix Ridge` puede generar un mandato de energia.
- `Alpha District` puede generar un mandato de agua.

## Cambios visuales

En la vista de Misiones:

- Los contratos territoriales muestran una etiqueta especial:
  - `Territorial: Nombre del sector`
- El texto de ayuda avisa de que el contrato depende de conservar el territorio.

## Resultado esperado

Conquistar territorios ahora aporta tres efectos claros:

1. recuperas produccion completa en empresas del sector;
2. evitas pagar tasa de ocupacion;
3. desbloqueas pedidos exclusivos con mayor recompensa.

## Verificacion

Ejecutado correctamente:

```bash
npm run build
```

La compilacion de produccion finalizo sin errores.
