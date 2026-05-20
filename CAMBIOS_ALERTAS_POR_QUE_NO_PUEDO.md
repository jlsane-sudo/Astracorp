# Cambios: alertas y motivos de bloqueo

## Objetivo

Reducir la sensacion de "no se que esta pasando" cuando hay acciones importantes o botones desactivados.

## Cambios realizados

- Se ha sustituido el aviso simple superior por un `Centro de alertas`.
- El centro muestra hasta 5 prioridades activas y cada tarjeta salta a la pestana correcta.
- Ahora se avisa de:
  - Eventos de sesion activos.
  - Contratos mejorados por evento.
  - Peticiones de sector.
  - Frentes rivales.
  - Sectores inestables.
  - Contratos urgentes.
  - Contratos listos para entregar.
  - Empresas con almacen lleno o casi lleno.
  - Empresas pausadas por mantenimiento.
  - Deuda operativa.
  - Energia baja.
  - Oportunidad de comprar la primera empresa.
- Se han anadido estilos propios para que las alertas sean compactas y no parezcan tarjetas gigantes.
- El boton comun de la UI ahora acepta `disabledReason`.
- Los botones desactivados pueden mostrar un motivo mediante `title` y `aria-disabled`.
- Se han anadido motivos de bloqueo en contratos y recompensas de mision.
- El boton de actualizar protocolos online tambien explica cuando esta bloqueado por carga.

## Archivos tocados

- `src/App.jsx`
- `src/components/ui.jsx`
- `src/styles/global.css`
- `src/components/views/MissionsView.jsx`
- `src/components/views/PoliticsView.jsx`

## Validacion

- `npm run build` ejecutado correctamente.

## Nota de diseno

Esto no arregla solo un boton concreto: deja una base para que cualquier accion futura pueda explicar por que esta bloqueada. La idea es que el jugador no tenga que adivinar si le falta energia, stock, tiempo, mantenimiento o progreso.
