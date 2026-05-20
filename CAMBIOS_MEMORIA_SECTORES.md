# Cambios: memoria de sectores y estados visuales

## Objetivo

Hacer que los sectores se sientan menos genericos y que el mapa comunique rapido el estado real de cada territorio.

## Cambios realizados

- Se ha anadido memoria persistente por sector en `sectorMemory`.
- La memoria registra:
  - Primer dia de control.
  - Numero de conquistas.
  - Numero de defensas.
  - Numero de perdidas.
  - Ultimo rival ante el que se perdio.
  - Ultimo evento relevante.
- La memoria se actualiza cuando:
  - Conquistas un sector completando una campana.
  - Pierdes un sector por frente rival o asedio.
  - Refuerzas un sector.
  - Construyes un fortin.
  - Cortas suministros de un frente rival.
  - Usas blindaje publicitario global.
- El mapa ahora muestra estado visual por sector:
  - `Seguro`
  - `Tenso`
  - `Asediado`
  - `Recuperandose`
  - `Productivo`
  - `Hostil`
  - `Libre`
- Cada sector muestra su estado directamente en el SVG del mapa.
- El panel lateral del sector seleccionado incluye:
  - Estado del sector.
  - Explicacion corta del estado.
  - Memoria del sector.
  - Empresas vinculadas.

## Archivos tocados

- `src/hooks/engine/gamePureLogic.js`
- `src/hooks/engine/useGameActions.js`
- `src/components/views/MapView.jsx`

## Validacion

- `npm run build` ejecutado correctamente.

## Nota tecnica

La memoria vive dentro de cada territorio, no en un sistema separado. Esto reduce acoplamiento y mantiene la informacion junto al dato que describe.

## Nota de diseno

La perdida de un sector ahora puede mostrar contexto propio. Esto hace que sectores como Dust Basin o Alpha District tengan historial, no solo estadisticas actuales.
