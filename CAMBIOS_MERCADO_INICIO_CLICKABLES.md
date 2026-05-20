# Cambios: Mercado compacto, Inicio accionable y clics

## Mercado

- La vista de mercado deja de abrir con tarjetas largas.
- Ahora muestra una cabecera con la mejor venta o compra detectable.
- Cada recurso aparece como una fila compacta con:
  - stock,
  - precio de compra,
  - precio de venta,
  - presion de mercado,
  - cantidad,
  - botones de comprar y vender.
- Las ayudas largas quedan plegadas en "Como leer el mercado".
- Los eventos activos siguen marcando los recursos afectados.

## Inicio

- Inicio ahora muestra tres acciones recomendadas reales desde la cola operativa.
- Se anade una franja rapida con:
  - siguiente nivel y XP,
  - energia,
  - deuda.
- La pantalla inicial queda mas orientada a "que hago ahora" y menos a informacion pasiva.

## Clics y capas

- Se refuerza `touch-action: manipulation` en botones para mejorar respuesta en navegador.
- Se asegura `pointer-events: auto` en el marco principal y controles interactivos.
- Se mantiene que avisos flotantes no capturen clics fuera de sus botones.

## Resultado esperado

- Menos texto visible en Mercado.
- Menos desplazamiento vertical.
- Inicio mas util como centro de decisiones.
- Menos riesgo de que capas visuales interfieran con botones de pestanas o vistas.
