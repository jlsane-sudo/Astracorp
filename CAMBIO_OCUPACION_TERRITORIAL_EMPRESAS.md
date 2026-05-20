# Cambio: ocupacion territorial en empresas

## Idea

El territorio empieza a ser parte directa de la economia: una empresa no solo esta en una region, tambien depende del territorio asociado a esa zona.

Si otra faccion controla el territorio donde opera una empresa del jugador, la empresa sigue funcionando, pero produce menos.

## Cambios aplicados

Archivos modificados:

- `src/hooks/engine/gamePureLogic.js`
- `src/components/views/BusinessView.jsx`

## Logica de juego

- Las empresas ubicadas en territorio controlado por otro jugador/NPC producen al 60%.
- El 40% restante se calcula como tasa de ocupacion.
- La tasa solo se acumula si la empresa realmente produce.
- Si una empresa no produce por falta de insumos o almacen lleno, no genera tasa falsa.
- Cada empresa hidratada guarda datos utiles para UI:
  - `grossRatePerHour`
  - `effectiveRatePerHour`
  - `productionFactor`
  - `occupationTaxFactor`
  - `occupationLossPerHour`
  - `occupationTaxPending`

## Cambios visuales

En la vista de empresas:

- Las empresas ocupadas ya no se muestran como apagadas.
- Ahora aparecen como operativas al 60%.
- Las tarjetas bajo ocupacion tienen estado visual propio.
- Los grupos muestran avisos como:
  - `Ocupada 60%`
  - `Ocupacion parcial`
  - `1 al 60%`
- El panel de propiedades muestra:
  - tasa de ocupacion por hora;
  - tasa cedida acumulada;
  - sectores ocupados al 60% y controlador.

## Resultado esperado

Conquistar territorios ahora tiene impacto economico inmediato:

- si controlas el territorio, tus empresas producen al 100%;
- si pierdes el territorio, tus empresas siguen funcionando pero pierden produccion;
- recuperar el territorio devuelve la produccion completa;
- construir en zonas hostiles sigue siendo posible, pero menos rentable.

## Verificacion

Ejecutado correctamente:

```bash
npm run build
```

La compilacion de produccion finalizo sin errores.
