# Cambios: Conquista y pérdida de sectores como batalla

## Problema
Los sectores se perdían y ganaban con demasiada facilidad y muy rápido.
Un sector podía caer en 2–3 minutos sin que el jugador pudiera hacer nada.

## Soluciones aplicadas

### Opción A — Fases de asedio (nueva mecánica)

Antes de perder un sector, el juego entra en una **fase de asedio** de `TERRITORY_SIEGE_TICKS = 3` ticks.

**Flujo nuevo:**
1. Amenaza ≥ 100 o estabilidad ≤ 0 → **inicio de asedio** (tick 1 de 3)
2. El jugador recibe notificación urgente: `⚔️ Viktor Sokolov asedia Dust Basin. Refuerza ahora — 4 min para perderlo.`
3. Si en los 3 ticks siguientes el jugador refuerza y baja amenaza < 88 + estabilidad > 12 → **asedio levantado**, mensaje de éxito
4. Si llega a tick 3 sin defender → **sector perdido definitivamente**

**Efecto psicológico:** perder un sector es ahora un evento con narrativa y tiempo de respuesta (~4–6 min con los nuevos intervalos), no algo que pasa de un tick al siguiente.

**Nuevos campos en territorio:**
- `siegeTick` — tick actual del asedio (0 = sin asedio)
- `siegeAttacker` — nombre del NPC que inició el asedio
- `siegeStartedAt` — timestamp de inicio del asedio

**Nuevos tipos de alerta:**
- `siege` — asedio iniciado o avanzando (incluye `ticksLeft` y tiempo estimado en minutos)
- `siege_lifted` — asedio levantado tras defenderse con éxito

---

### Opción C — Decaimiento natural de amenaza

Antes la amenaza en territorios propios **nunca bajaba sola** — solo subía. Ahora:

- Si amenaza < `TERRITORY_THREAT_DECAY_CAP = 62` **y** no hay presión NPC activa ese tick:
  → la amenaza baja `-2.0` puntos por tick automáticamente
- Territorios bien gestionados (con fortín, sin ataques recientes) se estabilizan solos
- Solo los sectores bajo ataque activo o muy descuidados se degradan

**Efecto:** el jugador no necesita estar pendiente de sectores estables. La atención se centra en los que realmente están bajo presión.

---

### Ajustes de balance adicionales

| Parámetro | Antes | Ahora | Motivo |
|---|---|---|---|
| `TERRITORY_PRESSURE_MS` | 45s | 90s | Más tiempo de reacción entre ticks |
| Presión orgánica por tick | 0.85–3.05 | 0.4–1.6 | Menos ruido de fondo inevitable |
| Pérdida de estabilidad (amenaza > 78) | -4 a -8/tick | -2 a -5/tick | Degradación más gradual |
| Pérdida de estabilidad (amenaza > 58) | -2.4 a -3.2/tick | -0.8 a -1.8/tick | Margen para reaccionar |

---

## Archivos modificados

### `src/hooks/engine/gameConstants.js`
- `TERRITORY_PRESSURE_MS`: 45_000 → 90_000
- Nueva: `TERRITORY_SIEGE_TICKS = 3`
- Nueva: `TERRITORY_THREAT_DECAY = 2.0`
- Nueva: `TERRITORY_THREAT_DECAY_CAP = 62`

### `src/hooks/engine/gamePureLogic.js`
- `resolveTerritoryPressure` reescrita con:
  - Fase de asedio antes de perder el sector
  - Decaimiento natural de amenaza por debajo del umbral
  - Presión orgánica reducida
  - Pérdida de estabilidad más gradual
  - Cancelación de asedio si el jugador defiende con éxito

### `src/hooks/engine/useGameTicks.js`
- Manejo de alertas `siege` y `siege_lifted`
- Mensaje de asedio incluye tiempo estimado en minutos (`ticksLeft × 1.5 min`)
- Mensaje de asedio levantado como confirmación de éxito

---

## Experiencia de juego resultante

**Antes:** "Dust Basin está en riesgo" → 2 minutos después → "Has perdido Dust Basin"

**Ahora:**
1. "Viktor Sokolov presiona Dust Basin: +4.2 amenaza"
2. "⚔️ Viktor Sokolov asedia Dust Basin. Refuerza ahora — 4 min para perderlo."
3. (jugador refuerza) → "✓ Dust Basin ha resistido el asedio."
   o
3. (jugador no actúa × 3 ticks) → "Has perdido Dust Basin tras resistir el asedio."
