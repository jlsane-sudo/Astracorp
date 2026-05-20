# Cambios bloqueo del menu por eventos

## Problema

Despues de un rato, algunos botones del menu superior podian dejar de responder hasta recargar la pagina.

La causa mas probable era el banner de eventos: aparece durante la sesion, estaba por encima del topbar y podia interceptar clicks aunque el usuario intentase pulsar `Trabajos`, `Mapa`, `Sede`, `Mejoras` o `Empresas`.

## Cambios hechos

- El topbar ahora queda por encima de las capas informativas cuando esta fijo.
- El banner de evento se coloca por debajo del topbar.
- El banner deja pasar clicks a traves de si mismo.
- Solo el boton `Cerrar` del banner captura clicks.
- Los toasts simples tampoco capturan clicks.
- En pantallas pequenas el banner baja a la parte inferior para no tapar navegacion.

## Resultado esperado

Los tabs del menu deben seguir siendo pulsables aunque aparezcan eventos, avisos o notificaciones despues de varios minutos de juego.

## Validacion

- `npm run lint`: correcto.
- `npm run build`: correcto.
