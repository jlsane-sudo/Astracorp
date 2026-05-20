# Cambios de producto y usabilidad

## Resumen

Esta pasada mejora la claridad de decision del juego: que hacer ahora, por que un boton no responde, que esta pasando en el mapa y que acciones pueden tener coste irreversible.

## Cambios hechos

- Se anadio un panel de acciones recomendado bajo el director operativo.
- Los botones comunes ahora muestran estado visual breve al pulsar, evitan doble click accidental y conservan tamano estable.
- Balance ahora tiene salidas directas a Empresas, Misiones y Mercado desde el diagnostico operativo.
- Registro ahora clasifica eventos con etiquetas: Riesgo, Mision, Mapa, Economia, Ads y Sistema.
- Mapa ahora muestra en la leyenda los estados de Frente rival y Campana, ademas de Tuyo, Neutral y Hostil.
- Misiones ahora explica en el tooltip por que no se puede entregar, renovar o producir un contrato.
- Vender empresas ahora pide confirmacion antes de ejecutar la venta.
- Reiniciar partida ya pide confirmacion antes de borrar el progreso local.

## Validacion

- `npm run lint`: correcto.
- `npm run build`: correcto.
- Servidor local probado en `http://127.0.0.1:5173`.
- En navegador local responden los tabs principales: Trabajos, Empresas, Mapa, Misiones y Balance.

## Archivos tocados

- `src/App.jsx`
- `src/components/ui.jsx`
- `src/components/views/BalanceView.jsx`
- `src/components/views/BusinessView.jsx`
- `src/components/views/LogView.jsx`
- `src/components/views/MapView.jsx`
- `src/components/views/MissionsView.jsx`
- `src/styles/global.css`
