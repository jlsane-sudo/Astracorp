# Cambios: ReturnScreen + Autonomía prominente

## Archivos modificados

### `src/hooks/engine/useGamePersistence.js`
- Añadido estado `returnData` y función helper `buildReturnData`
- `buildReturnData` extrae del save normalizado: racha, días de ausencia, horas offline,
  energía recuperada, % de reparto perdido, recompensas, territorios bajo presión,
  empresas con almacenamiento lleno, contratos a punto de expirar, e investigación
  completada offline
- Se llama a `buildReturnData` en los 6 puntos donde se ejecuta `applyDailyLoginUpdate`:
  carga de invitado, `pendingAccountSave`, save remoto, save local, catch de error,
  y fallback de temporizador
- Expuesto `returnData` y `clearReturnData` en el return del hook

### `src/hooks/engine/gamePureLogic.js`
- En el bloque de investigación completada offline, se guarda `lastResearchCompleted`
  en `loginRewards` para que `buildReturnData` pueda mostrarlo en la ReturnScreen

### `src/hooks/useAstraCorpGame.js`
- Destructurado `returnData` y `clearReturnData` desde `useGamePersistence`
- Reexportados en el objeto de retorno del hook para que `App.jsx` pueda acceder

### `src/App.jsx`
- Importado `ReturnScreen` desde `./components/ReturnScreen`
- Añadido `returnData` y `clearReturnData` a la destructuración de `game`
- Añadido guard de render entre el `ScreenLoader` de carga y el juego principal:
  si `returnData` tiene datos, se muestra `ReturnScreen` antes de entrar al juego

### `src/components/views/BalanceView.jsx`
- Añadido componente `AutonomyStat` que muestra la autonomía de colonia como
  stat principal y prominente encima de la cuadrícula de stats
- El número grande (ej. "4h 30m") cambia de color según urgencia:
  - 🟢 Verde (`#20c8a0`): más de 4h o sin costes
  - 🟡 Amarillo (`#e8a020`): entre 1h y 4h
  - 🔴 Rojo (`#e84040`): menos de 1h
- Incluye texto de urgencia contextual ("Critico", "Bajo", "Estable", "Autosuficiente")
- El stat de Mantenimiento/h ya no repite la autonomía como subtexto (eliminada redundancia)

---

## Qué hace ReturnScreen

Cuando el jugador vuelve al juego tras al menos un día de ausencia, ve una pantalla
de resumen antes de entrar al juego principal con:

- Tiempo fuera de la app
- Racha actual con puntos animados
- Créditos / Energía / XP ganados (con contadores animados)
- Aviso de % de reparto perdido si hubo días de ausencia
- Alertas de: empresas con almacenamiento lleno, contratos expirando,
  territorios bajo presión territorial, investigación completada offline
- Botón "Entrar al imperio" con efecto shimmer

La pantalla solo aparece cuando `loginRewards.lastDailyReward` existe en el save
normalizado, lo que garantiza que solo se muestra en retornos reales (dayDiff > 0).
