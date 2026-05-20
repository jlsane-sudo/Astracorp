# Cambio: integridad operativa

## Objetivo
La integridad deja de ser una barra decorativa y pasa a afectar al ritmo del juego.

## Que baja integridad
- Perder una conquista territorial resta 20 de integridad.
- Ganar una conquista tambien desgasta ligeramente: -4 de integridad.
- Algunos trabajos industriales peligrosos ahora restan integridad:
  - Extraccion superficial: -3
  - Mecanizado basico: -2
  - Forja estructural: -4
  - Montaje de habitat: -2

## Que sube integridad
Algunos trabajos de soporte recuperan integridad:
- Escaneo de rocio: +1
- Mantenimiento solar: +3
- Control de purificacion: +2
- Sintesis de oxigeno: +4

Tambien se puede reparar desde la Sede.

## Penalizaciones
La integridad modifica operaciones:
- 70-100: estable, sin penalizacion.
- 45-69: tocada, trabajos +10% mas largos y conquista x0.90.
- 25-44: danada, trabajos +25% mas largos y conquista x0.75.
- 0-24: critica, trabajos +45% mas largos, conquista x0.55 y no se puede iniciar conquista.
- Por debajo de 15 tampoco se pueden iniciar trabajos hasta reparar.

## Reparacion en Sede
La Sede ahora muestra un panel de integridad operativa.
Permite reparar hasta +30 de integridad por uso.
Coste aproximado:
- creditos segun integridad faltante,
- agua siempre,
- agua purificada si la integridad esta por debajo de 60,
- tanques de oxigeno si esta por debajo de 35.

## Archivos modificados
- `src/hooks/engine/gamePureLogic.js`
- `src/hooks/engine/useGameActions.js`
- `src/data/gameData.js`
- `src/components/views/HeadquartersView.jsx`
- `src/App.jsx`

## Verificacion
Compilacion correcta con `npm run build`.
