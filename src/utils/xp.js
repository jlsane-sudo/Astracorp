export function getXpNeededForLevel(level) {
  const safeLevel = Math.max(1, Number(level ?? 1));
  const earlyCurve = {
    1: 60,
    2: 90,
    3: 130,
    4: 180,
    5: 250,
    6: 330,
    7: 430,
    8: 540,
    9: 670,
    10: 820,
  };

  if (earlyCurve[safeLevel]) {
    return earlyCurve[safeLevel];
  }

  const xp = 820 * Math.pow(1.17, safeLevel - 10);
  return Math.max(820, Math.round(xp / 5) * 5);
}
