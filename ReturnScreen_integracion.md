# Integración de ReturnScreen

## 1. En `useGamePersistence.js`

Añade un estado para los datos de retorno y expórtalo:

```js
// Al inicio del hook:
const [returnData, setReturnData] = useState(null);

// En cada punto donde llamas a applyDailyLoginUpdate(), después de calcular
// normalized, comprueba si el jugador volvió tras al menos un día:

const dayDiff = /* ya lo calcula applyDailyLoginUpdate internamente */
// La señal más fácil: si normalized.loginRewards?.lastDailyReward existe,
// es que dayDiff > 0.

if (normalized.loginRewards?.lastDailyReward) {
  const prevSave = guestSave || remoteSave || base; // el save ANTES de normalizar
  const now = Date.now();
  const offlineMs = Math.max(0, now - Number(prevSave?.lastProgressAt ?? now));

  const companiesReady = (normalized.companies || []).filter(c => {
    const s = Number(c?.storage ?? 0);
    const m = Number(c?.maxStorage ?? 0);
    return m > 0 && s >= m * 0.95;
  }).length;

  const contractsExpiring = (normalized.contracts || []).filter(c =>
    c?.expiresAt && Number(c.expiresAt) - now < 5 * 60 * 1000
  ).length;

  const territoriesUnderPressure = (normalized.territories || [])
    .filter(t => t.controller === normalized.player?.name && Number(t.threat ?? 0) >= 65)
    .map(t => ({ name: t.name, threat: Math.round(t.threat) }))
    .slice(0, 3);

  const researchDone = normalized.loginRewards?.lastResearchCompleted
    ? { title: normalized.loginRewards.lastResearchCompleted }
    : null;

  setReturnData({
    streak:       Number(normalized.loginRewards?.streak ?? 1),
    missedDays:   Number(normalized.loginRewards?.lastReturnReward?.missedDays ?? 0),
    offlineHours: Math.floor(offlineMs / 3_600_000),
    recoveredEnergy: Math.floor(offlineMs / 60_000),
    pctLost:      normalized.loginRewards?.lastReturnReward?.missedDays
                    ? normalized.loginRewards.lastReturnReward.missedDays * 5
                    : 0,
    dailyReward:  normalized.loginRewards?.lastDailyReward || {},
    returnReward: normalized.loginRewards?.lastReturnReward || null,
    researchDone,
    territoriesUnderPressure,
    companiesReady,
    contractsExpiring,
  });
}
```

Expón `returnData` y `clearReturnData` en el return del hook:

```js
return {
  save, setSave, isRemoteLoaded, /* ... ya existente ... */
  returnData,
  clearReturnData: () => setReturnData(null),
};
```

---

## 2. En `App.jsx`

```jsx
import ReturnScreen from './components/ReturnScreen';

// Desestructura los nuevos valores:
const { save, setSave, isRemoteLoaded, returnData, clearReturnData } = useAstraCorpGame(...);

// Justo antes del return principal, añade:
if (returnData) {
  return (
    <ReturnScreen
      data={returnData}
      onContinue={clearReturnData}
    />
  );
}
```

O si prefieres overlay en lugar de pantalla completa (sin desmontar el juego):

```jsx
<>
  {returnData && (
    <ReturnScreen
      data={returnData}
      onContinue={clearReturnData}
    />
  )}
  {/* ... resto del juego ... */}
</>
```

---

## 3. Opcional: guardar `lastResearchCompleted` en `applyDailyLoginUpdate`

Si quieres mostrar la investigación completada en la pantalla de retorno,
en `gamePureLogic.js` dentro del bloque que completa la investigación offline:

```js
// Justo después de next.log = addLog(...)
next.loginRewards = {
  ...next.loginRewards,
  lastResearchCompleted: project.title,
};
```

---

## Qué muestra la pantalla

| Dato | Fuente |
|---|---|
| Días de ausencia | `missedDays` (de `returnReward`) |
| Horas offline | calculado de `lastProgressAt` |
| Racha | `loginRewards.streak` |
| Créditos ganados | `dailyReward.credits + returnReward?.credits` |
| Energía recuperada | offline energy regen + daily reward |
| XP ganado | `dailyReward.xp + returnReward?.xp` |
| % reparto perdido | `missedDays * 5` |
| Empresas llenas | filtro sobre `companies` |
| Contratos expirando | filtro sobre `contracts` |
| Territorios en presión | filtro sobre `territories` donde `threat >= 65` |
| Investigación completada offline | campo nuevo en `loginRewards` |
