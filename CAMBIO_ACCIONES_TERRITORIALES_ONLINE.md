# Cambio: acciones territoriales online server-first

## Objetivo

AstraCorp es multijugador online, asi que las acciones que cambian el mapa no deben depender solo del cliente. Este cambio prepara las acciones territoriales para pasar primero por Supabase RPC cuando el jugador tiene sesion iniciada.

## Acciones conectadas

Ahora estas acciones intentan ejecutarse en servidor antes de usar la logica local:

- sabotear territorio: `rpc_sabotage_territory_secure`
- reforzar territorio: `rpc_reinforce_territory_secure`
- construir fortin: `rpc_build_territory_fort_secure`
- cobrar tasas de ocupacion: `rpc_collect_occupation_taxes_secure`

La conquista ya usaba `rpc_attack_territory_secure` y se mantiene igual.

## Fallback temporal

Si la RPC no existe todavia en Supabase, el puente devuelve `fallbackAllowed: true` y el juego sigue usando la logica local. Esto permite desarrollar sin romper partidas, pero deja clara la ruta online real.

Si la RPC existe pero devuelve error de validacion, el cliente no aplica cambios locales y muestra el error del servidor.

## Sincronizacion

Cuando una RPC devuelve `saveData`, el cliente normaliza ese estado con `normalizeSave` y reemplaza la partida local. Esto evita que el navegador decida por su cuenta el resultado final de una accion territorial.

## Pendiente para servidor

Falta instalar/implementar las RPC en Supabase para que validen de forma autoritativa:

- propietario del territorio;
- energia y creditos;
- recursos necesarios para fortines;
- tasas pendientes;
- cooldowns o bloqueos si dos jugadores actuan a la vez.

Tambien queda preparado el puente `rpc_get_global_territories` para una siguiente fase: cargar el mapa global compartido por todos los jugadores.
