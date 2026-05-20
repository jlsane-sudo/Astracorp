# Rebalance de contratos

Fecha: 2026-05-03

## Problema

Los contratos se completaban demasiado facil en partidas avanzadas. La generacion anterior usaba cantidades base muy bajas y solo sumaba `levelBonus / 2`, asi que al nivel 30+ seguian apareciendo pedidos como 15 modulos o 18 componentes cuando el inventario ya acumulaba miles.

## Cambios aplicados

- Subidas las cantidades base de todas las plantillas de contrato en `src/hooks/engine/gameConstants.js`.
- Reducidos los multiplicadores de recompensa para que el aumento de cantidad no dispare premios absurdos.
- Anadidas rarezas reales de contrato:
  - `Estable`: contrato normal.
  - `Urgente`: menor duracion, recompensa algo superior.
  - `Premium`: mejor recompensa con demanda moderadamente mayor.
  - `Masivo`: demanda muy alta para limpiar stock en partidas avanzadas.
- Cambiada la formula de generacion en `src/hooks/engine/gamePureLogic.js`:
  - ahora escala por nivel real de la colonia;
  - los recursos avanzados tienen un multiplicador mayor por tier;
  - los contratos exclusivos de planeta piden un extra;
  - los contratos territoriales tambien aumentan su horquilla de cantidad.
- Actualizada la vista de contratos en `src/components/views/MissionsView.jsx` para mostrar rareza y nivel de demanda.

## Impacto esperado

- En niveles bajos los contratos siguen siendo alcanzables con trabajos y primeras empresas.
- En niveles medios y altos los contratos pasan a ser objetivos de produccion, no cobros inmediatos.
- Los pedidos de componentes, aleaciones y modulos de habitat deberian consumir una parte visible del stock acumulado.
- En nivel 12+ pueden aparecer contratos masivos que funcionan como sumidero de inventario.

## Nota

Los contratos que ya existan en una partida guardada conservan su cantidad actual. El rebalance se nota al completar, expirar o regenerar contratos nuevos.
