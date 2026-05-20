import { AD_POOL_REVENUE_PER_VIEW } from '../hooks/engine/gameConstants';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function getSponsoredActionsToday({
  rewardAdsToday = 0,
  adsViewedToday = 0,
} = {}) {
  return Math.max(0, toNumber(rewardAdsToday), toNumber(adsViewedToday));
}

export function getVisibleAdIncomeMetrics({
  adIncomeSummary = {},
  playerPct = 1,
  rewardAdsToday = 0,
  adsViewedToday = 0,
} = {}) {
  const sponsoredActionsToday = getSponsoredActionsToday({
    rewardAdsToday,
    adsViewedToday,
  });
  const pct = toNumber(playerPct, 1);
  const activePlayers = Math.max(1, toNumber(adIncomeSummary?.today_active_players, 1));
  const localTodayPool = sponsoredActionsToday * AD_POOL_REVENUE_PER_VIEW;
  const visibleTodayPool = Math.max(0, toNumber(adIncomeSummary?.today_pool), localTodayPool);
  const localTodayEstimate = (localTodayPool / activePlayers) * (pct / 100);
  const visibleTodayEstimate = Math.max(
    0,
    toNumber(adIncomeSummary?.today_estimate),
    localTodayEstimate
  );
  const yesterdayClosed = adIncomeSummary?.yesterday_closed !== false;
  const visibleYesterdayPayout = yesterdayClosed
    ? toNumber(adIncomeSummary?.yesterday_payout)
    : Math.max(
        toNumber(adIncomeSummary?.yesterday_payout),
        toNumber(adIncomeSummary?.yesterday_estimate)
      );
  const visibleYesterdayPool = Math.max(0, toNumber(adIncomeSummary?.yesterday_pool));
  const visibleTotalPool = Math.max(
    0,
    toNumber(adIncomeSummary?.total_pool),
    visibleTodayPool + visibleYesterdayPool,
    visibleTodayPool
  );
  const totalEarnedEstimate = Math.max(0, toNumber(adIncomeSummary?.total_payout)) + visibleTodayEstimate;
  const visibleTotalEarned = visibleTotalPool > 0
    ? Math.min(totalEarnedEstimate, visibleTotalPool)
    : totalEarnedEstimate;

  return {
    sponsoredActionsToday,
    pct,
    activePlayers,
    localTodayPool,
    localTodayEstimate,
    visibleTodayPool,
    visibleTodayEstimate,
    visibleYesterdayPool,
    visibleYesterdayPayout,
    visibleTotalEarned,
    visibleTotalPool,
    yesterdayClosed,
  };
}
