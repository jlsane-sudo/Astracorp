export const SPONSORED_AD_URL = 'https://omg10.com/4/10912107';

export const SPONSORED_AD_COOLDOWN_MS = 1000 * 60 * 3;

export function getSponsoredAdAvailability({
  rewardAdsToday = 0,
  lastRewardAdAt = null,
  now = Date.now(),
} = {}) {
  const lastAt = Number(lastRewardAdAt ?? 0);
  const cooldownLeftMs = lastAt
    ? Math.max(0, SPONSORED_AD_COOLDOWN_MS - (now - lastAt))
    : 0;

  if (cooldownLeftMs > 0) {
    return {
      canShow: false,
      reason: `Espera ${Math.ceil(cooldownLeftMs / 60000)} min para otra emision.`,
      cooldownLeftMs,
    };
  }

  return {
    canShow: true,
    reason: null,
    cooldownLeftMs: 0,
  };
}

export function openSponsoredAd() {
  try {
    const popup = window.open(SPONSORED_AD_URL, '_blank', 'noopener,noreferrer');
    if (popup && !popup.closed) return true;
  } catch {
    // Popup blockers are expected; fall back to an anchor click.
  }

  try {
    const link = document.createElement('a');
    link.href = SPONSORED_AD_URL;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch {
    return false;
  }
}
