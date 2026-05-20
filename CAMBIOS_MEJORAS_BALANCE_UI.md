# Cambios de balance, contratos y UI

Fecha: 2026-05-03

## Resumen

Se anadio una tanda de mejoras centrada en que el jugador entienda mejor la economia, pueda corregir contratos poco utiles y tenga mas visibilidad de la progresion hacia planetas.

## Contratos

- Nuevo boton `Renovar` en cada contrato.
- Renovar cuesta 35 creditos y energia.
- No se permite renovar contratos que ya estan listos para entregar.
- Los contratos ahora se ordenan por prioridad:
  - listos para entregar primero;
  - despues los que expiran antes;
  - los masivos quedan por detras si no estan listos;
  - a igualdad, se prioriza mayor recompensa.

## Balance

- Nuevo panel de simulacion rapida:
  - `+1h`;
  - `+6h`;
  - `+24h`.
- Cada simulacion muestra:
  - mantenimiento estimado;
  - contratos que podrian completarse;
  - recurso critico proyectado.
- El panel muestra tambien el siguiente planeta bloqueado y los requisitos que faltan.

## Mantenimiento y deuda

- El mantenimiento ya no pausa empresas inmediatamente en cuanto faltan creditos.
- Ahora existe `maintenanceDebt`.
- Si falta liquidez, parte del mantenimiento puede diferirse como deuda industrial.
- Si la deuda supera el limite, las empresas productivas se pausan.
- Al recuperar creditos, la deuda se va pagando parcialmente.

## Historial economico

- Nuevo `economicHistory` en la partida.
- Se registran movimientos recientes de:
  - compras;
  - ventas;
  - contratos entregados;
  - misiones reclamadas;
  - empresas construidas;
  - renovacion de contratos;
  - deuda o pausa por mantenimiento.
- El historial se muestra en el tab `Balance`.

## Archivos principales

- `src/components/views/BalanceView.jsx`
- `src/components/views/MissionsView.jsx`
- `src/hooks/engine/useGameActions.js`
- `src/hooks/engine/useGameTicks.js`
- `src/hooks/engine/gamePureLogic.js`
- `src/App.jsx`

## Validacion

- `npm.cmd run lint` pasa correctamente.
- `npm.cmd run build` pasa correctamente.
