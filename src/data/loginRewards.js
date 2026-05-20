export function createInitialLoginRewards() {
  return {
    streak: 0,
    bestStreak: 0,
    lastClaimDate: null,
    lastDailyReward: null,
    lastReturnReward: null,
  };
}

export function getDailyStreakReward(streak = 1) {
  const safeStreak = Math.max(1, Number(streak ?? 1));
  return {
    credits: Math.min(22, 4 + safeStreak * 2),
    energy: Math.min(18, 5 + safeStreak),
    xp: Math.min(42, 8 + safeStreak * 3),
  };
}

export function getWelcomeBackReward(missedDays = 0) {
  const safeMissed = Math.max(0, Number(missedDays ?? 0));
  if (safeMissed <= 0) return null;

  return {
    missedDays: safeMissed,
    credits: Math.min(36, 6 + safeMissed * 5),
    energy: Math.min(20, 4 + safeMissed * 2),
    xp: Math.min(40, 10 + safeMissed * 4),
  };
}
