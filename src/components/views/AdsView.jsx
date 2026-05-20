import React, { useMemo, useState } from 'react';
import AdSlot from '../ads/AdSlot';
import { getSponsoredAdAvailability } from '../../services/sponsoredAds';
import { getAdControlUpgradeCost } from '../../hooks/engine/gamePureLogic';
import { AD_POOL_REVENUE_PER_VIEW } from '../../hooks/engine/gameConstants';

export function AdsView({
  player,
  rewardAdsToday,
  adsViewedToday,
  lastRewardAdAt,
  adIncomeSummary,
  adIncomeHistory,
  onClaimRewardAd,
  onRefreshAdIncomeSummary,
  onBuyAdControlUpgrade,
  onOpenTab,
}) {
  const [floatingReward, setFloatingReward] = useState(null);
  const pct = typeof player?.pct === 'number' ? player.pct : 1;
  const sponsoredActionsToday = Math.max(
    0,
    Number(rewardAdsToday ?? 0),
    Number(adsViewedToday ?? 0)
  );
  const availability = getSponsoredAdAvailability({
    rewardAdsToday: sponsoredActionsToday,
    lastRewardAdAt,
  });
  const cooldownLeftMin = Math.ceil(Number(availability.cooldownLeftMs ?? 0) / 60000);

  const income = {
    yesterday_payout: Number(adIncomeSummary?.yesterday_payout ?? 0),
    yesterday_pool: Number(adIncomeSummary?.yesterday_pool ?? 0),
    yesterday_estimate: Number(adIncomeSummary?.yesterday_estimate ?? 0),
    yesterday_closed: adIncomeSummary?.yesterday_closed !== false,
    avg_last_10_days: Number(adIncomeSummary?.avg_last_10_days ?? 0),
    total_payout: Number(adIncomeSummary?.total_payout ?? 0),
    total_pool: Number(adIncomeSummary?.total_pool ?? 0),
    today_pool: Number(adIncomeSummary?.today_pool ?? 0),
    today_active_players: Number(adIncomeSummary?.today_active_players ?? 1),
    today_pct: pct,
    today_estimate: Number(adIncomeSummary?.today_estimate ?? 0),
  };

  const visibleTodayPool = Math.max(0, income.today_pool);
  const localTodayEstimate =
    (sponsoredActionsToday * AD_POOL_REVENUE_PER_VIEW / Math.max(income.today_active_players, 1)) *
    (pct / 100);
  const visibleTodayEstimate = Math.max(0, income.today_estimate, localTodayEstimate);
  const visibleYesterdayPool = Math.max(0, income.yesterday_pool);
  const visibleYesterdayPayout = income.yesterday_closed
    ? income.yesterday_payout
    : Math.max(income.yesterday_payout, income.yesterday_estimate);
  const totalPayoutFromHistory = useMemo(
    () => (Array.isArray(adIncomeHistory) ? adIncomeHistory : [])
      .reduce((sum, item) => sum + Number(item?.final_payout ?? 0), 0),
    [adIncomeHistory]
  );
  const visibleTotalEarned = Math.max(income.total_payout, totalPayoutFromHistory) + visibleTodayEstimate;
  const visibleTotalPool = Math.max(0, income.total_pool, visibleTodayPool + visibleYesterdayPool, visibleTodayPool);

  const history = useMemo(
    () => (Array.isArray(adIncomeHistory) ? [...adIncomeHistory].reverse() : []),
    [adIncomeHistory]
  );

  const adControlUpgradeCost = getAdControlUpgradeCost(pct);
  const canBuyAdControlUpgrade =
    Number(player?.credits ?? 0) >= adControlUpgradeCost && pct < 100;

  const triggerFloatingReward = () => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setFloatingReward({ id, text: '+2 creditos - +8 energia' });
    setTimeout(() => {
      setFloatingReward((prev) => (prev?.id === id ? null : prev));
    }, 950);
  };

  const handleRewardAdClick = async () => {
    if (!availability.canShow) return;

    const granted = await onClaimRewardAd?.();
    if (granted !== false) {
      triggerFloatingReward();
      setTimeout(() => onRefreshAdIncomeSummary?.(), 400);
    }
  };

  const statusLabel = availability.canShow
    ? 'Anuncio listo'
    : availability.cooldownLeftMs > 0
      ? `Cooldown ${cooldownLeftMin} min`
      : 'Anuncio no disponible';

  return (
    <div style={styles.wrap}>
      <div style={styles.rewardCard}>
        {floatingReward && <div style={styles.floatReward}>{floatingReward.text}</div>}
        <div style={styles.rewardTop}>
          <div>
            <div style={styles.kicker}>ADS</div>
            <div style={styles.title}>{statusLabel}</div>
            <div style={styles.muted}>
              {sponsoredActionsToday} acciones hoy - recompensa +2 cr y +8 energia - estimacion EUR {visibleTodayEstimate.toFixed(4)}
            </div>
          </div>
          <div style={styles.actions}>
            <button
              type="button"
              onClick={handleRewardAdClick}
              disabled={!availability.canShow}
              style={{
                ...styles.primaryButton,
                ...(availability.canShow ? null : styles.disabledButton),
              }}
            >
              Ver anuncio
            </button>
            <button type="button" onClick={() => onRefreshAdIncomeSummary?.()} style={styles.secondaryButton}>
              Actualizar
            </button>
            <button type="button" onClick={() => onOpenTab?.('projects')} style={styles.secondaryButton}>
              Patrocinios
            </button>
          </div>
        </div>
        <div style={styles.activityLine}>
          <span>Sin limite diario</span>
          <strong>{availability.canShow ? 'Disponible' : `Espera ${cooldownLeftMin} min`}</strong>
        </div>
        {!availability.canShow && (
          <div style={styles.notice}>{availability.reason}</div>
        )}
      </div>

      <div style={styles.kpiGrid}>
        <MiniStat label="Hoy estimado" value={`EUR ${visibleTodayEstimate.toFixed(4)}`} color="#fbbf24" />
        <MiniStat label={income.yesterday_closed ? "Ayer ganado" : "Ayer estimado"} value={`EUR ${visibleYesterdayPayout.toFixed(4)}`} color="#4ade80" />
        <MiniStat label="Ganado total" value={`EUR ${visibleTotalEarned.toFixed(4)}`} color="#60a5fa" />
        <MiniStat label="Pool hoy" value={`EUR ${visibleTodayPool.toFixed(4)}`} color="#a78bfa" />
        <MiniStat label="Pool total" value={`EUR ${visibleTotalPool.toFixed(4)}`} color="#f472b6" />
      </div>

      <div style={styles.upgradeRow}>
        <div>
          <div style={styles.rowTitle}>Optimizacion publicitaria</div>
          <div style={styles.muted}>Este porcentaje solo reparte el pool publicitario; no multiplica directamente los EUR.</div>
        </div>
        <div style={styles.rowMetric}>Actual {pct.toFixed(1)}% - siguiente {Math.min(100, pct + 0.5).toFixed(1)}%</div>
        <div style={canBuyAdControlUpgrade || pct >= 100 ? styles.costOk : styles.costBad}>
          {adControlUpgradeCost} cr - disponibles {Number(player?.credits ?? 0).toFixed(0)}
        </div>
        <button
          type="button"
          onClick={() => onBuyAdControlUpgrade?.()}
          disabled={!canBuyAdControlUpgrade}
          style={{
            ...styles.primaryButton,
            minHeight: 32,
            padding: '7px 10px',
            ...(canBuyAdControlUpgrade ? null : styles.disabledButton),
          }}
        >
          {pct >= 100 ? 'Maximo' : 'Mejorar'}
        </button>
      </div>

      <details style={styles.networkCard}>
        <summary style={styles.summary}>Display e historial</summary>
        <div style={styles.detailsBody}>
          <AdSlot slotKey="adsViewPrimary" minHeight={140} />
          <div style={styles.helperText}>
            Las cifras de hoy combinan el resumen online con una estimacion local inmediata. El cierre real depende del flush y del cierre diario del pool.
          </div>
          <div style={styles.historyTable}>
            {history.slice(0, 6).length ? history.slice(0, 6).map((item) => (
              <div key={item.day_key} style={styles.historyRow}>
                <div style={styles.historyCellStrong}>{formatLongDate(item.day_key)}</div>
                <div style={styles.historyCell}>EUR {Number(item.final_payout ?? 0).toFixed(4)}</div>
                <div style={styles.historyCell}>{Number(item.active_players ?? 0)} activos</div>
                <div style={styles.historyCell}>Reparto {Number(item.pct_applied ?? 0).toFixed(1)}%</div>
              </div>
            )) : (
              <div style={styles.helperText}>Todavia no hay historial cerrado.</div>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}

function formatLongDate(value) {
  if (!value) return '--';
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function MiniStat({ label, value, color }) {
  return (
    <div style={styles.miniStat}>
      <div style={styles.miniLabel}>{label}</div>
      <div style={{ ...styles.miniValue, color }}>{value}</div>
    </div>
  );
}

const panelBg = 'rgba(15,23,42,0.76)';

const styles = {
  wrap: { display: 'grid', gap: 10 },
  rewardCard: {
    position: 'relative',
    overflow: 'hidden',
    display: 'grid',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    background: 'linear-gradient(180deg, rgba(34,197,94,0.08), rgba(15,23,42,0.92))',
    border: '1px solid rgba(34,197,94,0.16)',
  },
  rewardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  kicker: { fontSize: 11, letterSpacing: 0.7, color: '#fbbf24', fontWeight: 900 },
  title: { fontSize: 18, fontWeight: 900, color: '#f8fafc' },
  muted: { fontSize: 12, color: '#94a3b8', lineHeight: 1.45 },
  actions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  primaryButton: {
    width: 'auto',
    minWidth: 120,
    padding: '10px 14px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(90deg,#22c55e,#06b6d4)',
    color: '#04110a',
    fontWeight: 900,
    cursor: 'pointer',
  },
  secondaryButton: {
    width: 'auto',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid rgba(56,189,248,0.18)',
    background: 'rgba(56,189,248,0.08)',
    color: '#7dd3fc',
    fontWeight: 800,
    cursor: 'pointer',
  },
  disabledButton: {
    background: 'rgba(255,255,255,0.08)',
    color: '#64748b',
    cursor: 'not-allowed',
  },
  activityLine: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'center',
    padding: '8px 10px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    color: '#cbd5e1',
    fontSize: 12,
  },
  notice: {
    padding: 9,
    borderRadius: 10,
    background: 'rgba(250,204,21,0.08)',
    border: '1px solid rgba(250,204,21,0.16)',
    color: '#fde68a',
    fontSize: 12,
    fontWeight: 800,
  },
  floatReward: {
    position: 'absolute',
    right: 18,
    bottom: 16,
    fontSize: 15,
    fontWeight: 800,
    color: '#22c55e',
    textShadow: '0 0 12px rgba(34,197,94,0.35)',
    animation: 'company-float-up 900ms ease-out forwards',
    pointerEvents: 'none',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
    gap: 8,
  },
  miniStat: {
    background: panelBg,
    border: '1px solid rgba(148,163,184,0.12)',
    borderRadius: 10,
    padding: 10,
  },
  miniLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  miniValue: { fontSize: 16, fontWeight: 900 },
  upgradeRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(160px, 1fr) minmax(140px, 1fr) minmax(120px, 1fr) 132px',
    gap: 8,
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    background: panelBg,
    border: '1px solid rgba(148,163,184,0.12)',
  },
  rowTitle: { fontSize: 13, fontWeight: 900, color: '#f8fafc' },
  rowMetric: { fontSize: 12, color: '#bae6fd', fontWeight: 800 },
  costOk: { fontSize: 12, color: '#bbf7d0' },
  costBad: { fontSize: 12, color: '#fca5a5' },
  networkCard: {
    padding: 12,
    borderRadius: 12,
    background: panelBg,
    border: '1px solid rgba(148,163,184,0.12)',
  },
  summary: { cursor: 'pointer', color: '#f8fafc', fontWeight: 900 },
  detailsBody: { display: 'grid', gap: 10, marginTop: 10 },
  helperText: { fontSize: 12, lineHeight: 1.55, color: '#94a3b8' },
  historyTable: { display: 'grid', gap: 8 },
  historyRow: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr 1fr 1fr',
    gap: 10,
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 10,
    alignItems: 'center',
  },
  historyCellStrong: { fontSize: 12, color: '#e5e7eb', fontWeight: 800 },
  historyCell: { fontSize: 12, color: '#cbd5e1' },
};
