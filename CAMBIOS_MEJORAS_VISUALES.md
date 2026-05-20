# Cambios visuales AstraCorp

## Resumen

Se ha hecho una pasada visual centrada en legibilidad, jerarquia y sensacion de juego. El objetivo fue reducir ruido en la cabecera, hacer que las vistas respiren mas y que el jugador vea antes cual es la siguiente accion importante.

## Cambios aplicados

- Cabecera mas compacta y escaneable.
- Tarjetas de estado con menos peso visual y mejor contraste.
- Botones de sesion, energia y reinicio reducidos para que no compitan con los recursos.
- Navegacion por tabs con marcadores visuales cortos por sistema.
- Tab activo con mas presencia y mejor diferenciacion.
- Banda de prioridad operativa dentro del area de juego.
- Indicadores rapidos de region, riesgo y accion recomendada.
- Animacion suave al cambiar entre vistas.
- Cambio de tab con scroll automatico al inicio de la vista.
- Panel de actividad lateral mas discreto.
- Layout de columnas ajustado para dar mas espacio al contenido central.
- Sticky laterales corregidos para respetar la cabecera fija.
- En anchos medios, la cabecera deja de ser fija para evitar que robe pantalla util.
- En ventanas con poca altura, se activa modo compacto: tabs en una sola fila, guia inicial oculta y prioridad reducida para que la vista principal suba mas.

## Archivos tocados

- `src/App.jsx`
- `src/components/Header.jsx`
- `src/components/Tabs.jsx`
- `src/styles/global.css`

## Verificacion

- `npm run lint`
- `npm run build`
