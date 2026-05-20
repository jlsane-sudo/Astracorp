export function applyDailyLoginEffects(gameData) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const lastLogin = gameData.lastLoginDate;

  // Si es la primera vez
  if (!lastLogin) {
    return {
      ...gameData,
      lastLoginDate: todayStr,
      dailyPercentage: Math.min((gameData.dailyPercentage || 1) + 1, 100),
    };
  }

  // Convertimos fechas
  const last = new Date(lastLogin);
  const diffTime = today - last;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let pct = gameData.dailyPercentage || 1;

  if (diffDays === 0) {
    // Ya entró hoy → no cambia nada
    return gameData;
  }

  if (diffDays === 1) {
    // Entró ayer → +1%
    pct += 1;
  } else if (diffDays > 1) {
    // Penalización
    const missedDays = diffDays - 1;
    pct -= missedDays * 5;

    // Bonus por volver hoy
    pct += 1;
  }

  // Límites
  pct = Math.max(1, Math.min(100, pct));

  return {
    ...gameData,
    dailyPercentage: pct,
    lastLoginDate: todayStr,
  };
}