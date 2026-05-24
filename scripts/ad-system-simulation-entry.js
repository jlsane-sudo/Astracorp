import { createInitialSave, applyDailyLoginUpdate } from '../src/hooks/engine/gamePureLogic.js';
import { AD_POOL_REVENUE_PER_VIEW } from '../src/hooks/engine/gameConstants.js';

const round6 = (n) => Number(Number(n || 0).toFixed(6));

function clickRewardAd(save, now) {
  const stats = { ...(save.stats || {}) };
  const currentToday = Math.max(
    Number(stats.adsViewedToday || 0),
    Number(save.rewardAdsToday || 0)
  );
  const currentTotal = Math.max(Number(stats.adsViewed || 0), currentToday);

  stats.adsViewedToday = currentToday + 1;
  stats.adsViewed = currentTotal + 1;

  return {
    ...save,
    stats,
    rewardAdsToday: Math.max(Number(save.rewardAdsToday || 0), Number(stats.adsViewedToday || 0)),
    lastRewardAdAt: now,
    player: {
      ...save.player,
      credits: Number(save.player.credits || 0) + 2,
      energy: Math.min(
        Number(save.player.maxEnergy || 100),
        Math.max(0, Number(save.player.energy || 0) - 1) + 8
      ),
    },
  };
}

const now = Date.now();
const todayKey = new Date(now).toISOString().slice(0, 10);
const previousDayKey = new Date(now - 86_400_000).toISOString().slice(0, 10);

let save = createInitialSave();
save = {
  ...save,
  lastLoginDate: todayKey,
  player: {
    ...save.player,
    credits: 10,
    energy: 40,
    maxEnergy: 100,
    pct: 1,
  },
  adIncomeSummary: {
    ...save.adIncomeSummary,
    today_active_players: 1,
    today_pct: 1,
  },
};

const start = {
  credits: save.player.credits,
  energy: save.player.energy,
};

for (let i = 0; i < 50; i += 1) {
  save = clickRewardAd(save, now + i * 181_000);
}

const localPool = round6(save.rewardAdsToday * AD_POOL_REVENUE_PER_VIEW);
const localPayout = round6(localPool * (save.player.pct / 100));
save = {
  ...save,
  adIncomeSummary: {
    ...save.adIncomeSummary,
    today_pool: localPool,
    today_active_players: 1,
    today_pct: save.player.pct,
    today_estimate: localPayout,
  },
};

const beforeDayChange = {
  rewardAdsToday: save.rewardAdsToday,
  adsViewedToday: save.stats.adsViewedToday,
  adsViewed: save.stats.adsViewed,
  credits: save.player.credits,
  energy: save.player.energy,
  todayPool: save.adIncomeSummary.today_pool,
  todayEstimate: save.adIncomeSummary.today_estimate,
};

save = {
  ...save,
  lastLoginDate: previousDayKey,
  lastProgressAt: now - 86_400_000,
};

const after = applyDailyLoginUpdate(save);

console.log(JSON.stringify({
  start,
  beforeDayChange,
  afterDayChange: {
    lastLoginDate: after.lastLoginDate,
    claimedToday: after.claimedToday,
    rewardAdsToday: after.rewardAdsToday,
    adsViewedToday: after.stats.adsViewedToday,
    adsViewed: after.stats.adsViewed,
    lastRewardAdAt: after.lastRewardAdAt,
    yesterdayPool: after.adIncomeSummary.yesterday_pool,
    yesterdayEstimate: after.adIncomeSummary.yesterday_estimate,
    yesterdayClosed: after.adIncomeSummary.yesterday_closed,
    totalPool: after.adIncomeSummary.total_pool,
    totalPayout: after.adIncomeSummary.total_payout,
    todayPool: after.adIncomeSummary.today_pool,
    todayEstimate: after.adIncomeSummary.today_estimate,
    sponsorshipTodayKey: after.sponsorships.todayKey,
    playerPct: after.player.pct,
    playerCredits: after.player.credits,
    playerEnergy: after.player.energy,
  },
}, null, 2));
