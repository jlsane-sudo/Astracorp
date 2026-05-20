import React from "react";
import { theme } from "../theme";
import { getPlanetById } from "../data/planets";
import { getXpNeededForLevel } from "../utils/xp";
import { AD_POOL_REVENUE_PER_VIEW } from "../hooks/engine/gameConstants";

export function Header({
  player,
  inventory = {},
  username,
  coins: dbCoins,
  onLogout,
  onOpenLogin,
  onSaveProgress,
  onResetGame,
  onFillEnergyForTest,
  onChangePlanet,
  onOpenAds,
  currentRegion,
  isAuthenticated = false,
  rewardAdsToday = 0,
  adsViewedToday,
  adIncomeSummary,
}) {
  const credits = Number(dbCoins ?? player?.credits ?? 0);
  const energy = Number(player?.energy ?? 0);
  const maxEnergy = Number(player?.maxEnergy ?? 100);
  const health = Number(player?.health ?? 0);
  const maxHealth = 100;
  const level = Number(player?.level ?? 1);
  const xp = Number(player?.xp ?? 0);
  const pct = Number(player?.pct ?? 1);
  const inventoryItems = getHeaderInventoryItems(inventory);
  const adsToday = Math.max(0, Number(rewardAdsToday ?? 0), Number(adsViewedToday ?? 0));
  const todayPool = Math.max(0, Number(adIncomeSummary?.today_pool ?? 0));
  const yesterdayPool = Math.max(0, Number(adIncomeSummary?.yesterday_pool ?? 0));
  const activePlayers = Math.max(1, Number(adIncomeSummary?.today_active_players ?? 1));
  const localTodayEstimate = (adsToday * AD_POOL_REVENUE_PER_VIEW / activePlayers) * (pct / 100);
  const adTodayAmount = Math.max(0, Number(adIncomeSummary?.today_estimate ?? 0), localTodayEstimate);
  const yesterdayClosed = adIncomeSummary?.yesterday_closed !== false;
  const yesterdayAmount = yesterdayClosed
    ? Number(adIncomeSummary?.yesterday_payout ?? 0)
    : Math.max(
        Number(adIncomeSummary?.yesterday_payout ?? 0),
        Number(adIncomeSummary?.yesterday_estimate ?? 0)
      );
  const totalEarned = Math.max(0, Number(adIncomeSummary?.total_payout ?? 0)) + adTodayAmount;
  const totalPool = Math.max(
    0,
    Number(adIncomeSummary?.total_pool ?? 0),
    todayPool + yesterdayPool,
    todayPool
  );

  const currentPlanet =
    player?.currentPlanetName ||
    getPlanetById(player?.currentPlanet || player?.planet)?.name ||
    "Nexus Prime";
  const regionName =
    currentRegion?.name || player?.currentRegionName || "Alpha District";

  const energyPct = maxEnergy > 0 ? Math.min(100, (energy / maxEnergy) * 100) : 0;
  const healthPct = maxHealth > 0 ? Math.min(100, (health / maxHealth) * 100) : 0;
  const xpNeeded = getXpNeededForLevel(level);
  const xpPct = Math.min(100, (xp / xpNeeded) * 100);

  return (
    <header className="pw-header" style={styles.header}>
      <div style={styles.bgGlowLeft} />
      <div style={styles.bgGlowRight} />

      <div style={styles.left}>
        <div style={styles.brandBlock}>
          <div style={styles.title}>ASTRACORP</div>

          <div style={styles.subtitle}>
            {username || "Colono"} · Comercio, sectores y rutas orbitales
          </div>

          <div style={styles.locationRow}>
            <span style={styles.locationPill}>{currentPlanet}</span>
            <span style={styles.locationPill}>{pct.toFixed(1)}% reparto</span>
            <span style={styles.locationPill}>{regionName}</span>
            <button type="button" onClick={onChangePlanet} style={styles.planetButton}>
              Cambiar planeta
            </button>
          </div>
        </div>
      </div>

      <div style={styles.center}>
        <BigStat
          icon="$"
          label="Creditos"
          value={formatNumber(credits)}
          color={theme.colors.cyan}
        />

        <BigStatWithBar
          icon="EN"
          label="Energia"
          value={`${formatAmount(energy)}/${formatAmount(maxEnergy)}`}
          sub={`${energyPct.toFixed(0)}%`}
          color={theme.colors.purple}
          progress={energyPct}
          progressColor="violet"
        />

        <BigStatWithBar
          icon="HP"
          label="Integridad"
          value={`${formatAmount(health)}/${maxHealth}`}
          sub={`${healthPct.toFixed(0)}%`}
          color={theme.colors.rose}
          progress={healthPct}
          progressColor="green"
        />

        <BigStatWithBar
          icon="LV"
          label="Nivel"
          value={`${level}`}
          sub={`${xp}/${xpNeeded} XP`}
          color={theme.colors.amber}
          progress={xpPct}
          progressColor="cyan"
        />
      </div>

      <button type="button" onClick={onOpenAds} style={styles.adsPanel}>
        <div style={styles.adsHeader}>
          <span style={styles.adsIcon}>AD</span>
          <span style={styles.adsTitle}>Publicidad</span>
          <span style={styles.adsControl}>Reparto {pct.toFixed(1)}%</span>
        </div>

        <div style={styles.adsGrid}>
          <AdMetric label="Hoy estimado" value={formatEuro(adTodayAmount, 5)} color="#fbbf24" />
          <AdMetric label={yesterdayClosed ? "Ayer ganado" : "Ayer estim."} value={formatEuro(yesterdayAmount, 5)} color="#86efac" />
          <AdMetric label="Ganado total" value={formatEuro(totalEarned, 5)} color="#67e8f9" />
          <AdMetric label="Pool total" value={formatEuro(totalPool, 5)} color="#c084fc" />
        </div>
      </button>

      <div style={styles.right}>
        <HeaderInventory items={inventoryItems} />
        <div style={styles.authColumn}>
          <div style={styles.authActions}>
            <button type="button" onClick={onResetGame} style={styles.secondaryActionBtn}>
              Empezar de nuevo
            </button>

            <button type="button" onClick={onFillEnergyForTest} style={styles.testActionBtn}>
              Max energia
            </button>

            {!isAuthenticated ? (
              <>
                <button type="button" onClick={onOpenLogin} style={styles.secondaryActionBtn}>
                  Iniciar sesion
                </button>
                <button type="button" onClick={onSaveProgress} style={styles.logoutBtn}>
                  Guardar progreso
                </button>
              </>
            ) : (
              <button type="button" onClick={onLogout} style={styles.logoutBtn}>
                Cerrar sesion
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function AdMetric({ label, value, color }) {
  return (
    <span style={styles.adMetric}>
      <span style={styles.adMetricLabel}>{label}</span>
      <strong style={{ ...styles.adMetricValue, color }}>{value}</strong>
    </span>
  );
}

function getHeaderInventoryItems(inventory = {}) {
  return [
    { key: 'water', icon: 'H2O', label: 'Agua' },
    { key: 'energy_cells', icon: 'EN', label: 'Electricidad' },
    { key: 'mineral', icon: 'MIN', label: 'Mineral' },
    { key: 'purified_water', icon: 'PUR', label: 'Purificada' },
    { key: 'metal_components', icon: 'CMP', label: 'Componentes' },
    { key: 'oxygen_tanks', icon: 'O2', label: 'Oxigeno' },
    { key: 'alloy_frames', icon: 'ALY', label: 'Aleacion' },
    { key: 'habitat_modules', icon: 'HAB', label: 'Habitat' },
  ].map((item) => ({
    ...item,
    amount: Math.floor(Number(inventory?.[item.key] ?? 0)),
  }));
}

function HeaderInventory({ items = [] }) {
  if (!items.length) return null;

  return (
    <div style={styles.inventoryStrip} aria-label="Inventario">
      {items.map((item) => (
        <div key={item.key} style={styles.inventoryChip} title={`${item.label}: ${item.amount}`}>
          <span style={styles.inventoryIcon}>{item.icon}</span>
          <span style={styles.inventoryText}>
            <strong>{item.label}</strong>
            <b>{formatNumber(item.amount)}</b>
          </span>
        </div>
      ))}
    </div>
  );
}

function BigStat({ icon, label, value, color }) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statTop}>
        <div style={styles.statIcon}>{icon}</div>
        <div style={styles.statLabel}>{label}</div>
      </div>

      <div style={{ ...styles.statValue, color }}>{value}</div>
    </div>
  );
}

function BigStatWithBar({
  icon,
  label,
  value,
  sub,
  color,
  progress,
  progressColor,
}) {
  return (
    <div style={styles.statCard}>
      <div style={styles.statTop}>
        <div style={styles.statIcon}>{icon}</div>
        <div style={styles.statLabel}>{label}</div>
      </div>

      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statSub}>{sub}</div>

      <div style={{ marginTop: 6 }}>
        <ProgressBar value={progress} color={progressColor} />
      </div>
    </div>
  );
}

function ProgressBar({ value, color = "cyan", compact = false }) {
  const safeValue = Math.max(0, Math.min(100, Number(value ?? 0)));

  const palette = {
    cyan: "linear-gradient(90deg, rgba(34,211,238,0.95), rgba(6,182,212,0.95))",
    violet: "linear-gradient(90deg, rgba(168,85,247,0.95), rgba(34,211,238,0.95))",
    green: "linear-gradient(90deg, rgba(34,197,94,0.95), rgba(34,211,238,0.95))",
  };

  return (
    <div
      style={{
        ...styles.progressBarBg,
        height: compact ? 7 : 8,
      }}
    >
      <div
        style={{
          ...styles.progressBarFill,
          width: `${safeValue}%`,
          background: palette[color] || palette.cyan,
        }}
      />
    </div>
  );
}

function formatAmount(value) {
  const n = Number(value ?? 0);
  if (Number.isInteger(n)) return `${n}`;
  return n.toFixed(2);
}

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatEuro(value, minDigits = 2) {
  return `EUR ${Number(value ?? 0).toLocaleString("es-ES", {
    minimumFractionDigits: minDigits,
    maximumFractionDigits: Math.max(4, minDigits),
  })}`;
}

const styles = {
  header: {
    position: "relative",
    zIndex: 1,
    display: "grid",
    gridTemplateColumns: "max-content max-content minmax(430px, 1fr) max-content",
    gap: 10,
    alignItems: "center",
    padding: "7px 12px",
    background:
      "linear-gradient(180deg, rgba(6,8,18,0.97) 0%, rgba(5,8,20,0.95) 100%)",
    borderBottom: `1px solid ${theme.colors.borderStrong}`,
    backdropFilter: "blur(12px)",
    overflow: "hidden",
  },

  bgGlowLeft: {
    position: "absolute",
    left: -50,
    top: -40,
    width: 160,
    height: 160,
    borderRadius: "50%",
    background: "rgba(34,211,238,0.08)",
    filter: "blur(70px)",
    pointerEvents: "none",
  },

  bgGlowRight: {
    position: "absolute",
    right: -60,
    top: -50,
    width: 180,
    height: 180,
    borderRadius: "50%",
    background: "rgba(168,85,247,0.08)",
    filter: "blur(80px)",
    pointerEvents: "none",
  },

  left: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.md,
  },

  brandBlock: {
    display: "grid",
    gap: 3,
    width: 210,
    minWidth: 210,
  },

  logo: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.md,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    fontWeight: "bold",
    color: theme.colors.bg,
    background: theme.gradients.primary,
    boxShadow: theme.glow.cyanStrong,
    flexShrink: 0,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1.2,
    lineHeight: 1,
    background: theme.gradients.title,
    WebkitBackgroundClip: "text",
    color: "transparent",
  },

  subtitle: {
    fontSize: theme.font.small,
    color: theme.colors.textSoft,
    lineHeight: 1.35,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  locationRow: {
    display: "grid",
    gridTemplateColumns: "max-content max-content",
    gap: "5px 8px",
    alignItems: "center",
  },

  locationPill: {
    padding: "3px 8px",
    borderRadius: 999,
    fontSize: theme.font.tiny,
    color: theme.colors.cyan,
    background: "rgba(34,211,238,0.08)",
    border: "1px solid rgba(34,211,238,0.14)",
    whiteSpace: "nowrap",
  },
  planetButton: {
    position: "relative",
    zIndex: 3,
    border: "1px solid rgba(251,191,36,0.2)",
    background: "rgba(251,191,36,0.08)",
    color: "#fde68a",
    padding: "3px 9px",
    borderRadius: 999,
    fontSize: theme.font.tiny,
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },

  center: {
    position: "relative",
    zIndex: 2,
    display: "grid",
    gridTemplateColumns: "110px 140px 140px 140px",
    gap: 6,
    alignItems: "stretch",
  },

  adsPanel: {
    position: "relative",
    zIndex: 3,
    minWidth: 430,
    width: "100%",
    minHeight: 70,
    border: "1px solid rgba(251,191,36,0.24)",
    borderRadius: 12,
    padding: "7px 9px",
    display: "grid",
    gap: 6,
    textAlign: "left",
    cursor: "pointer",
    background:
      "linear-gradient(135deg, rgba(251,191,36,0.10), rgba(34,211,238,0.08) 46%, rgba(168,85,247,0.10))",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03), 0 14px 34px rgba(2,6,23,0.16)",
  },

  adsHeader: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    minWidth: 0,
  },

  adsIcon: {
    width: 23,
    height: 23,
    borderRadius: 8,
    display: "grid",
    placeItems: "center",
    background: "rgba(251,191,36,0.14)",
    border: "1px solid rgba(251,191,36,0.22)",
    color: "#fde68a",
    fontSize: 9,
    fontWeight: 900,
  },

  adsTitle: {
    color: "#f8fafc",
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  adsControl: {
    marginLeft: "auto",
    padding: "2px 7px",
    borderRadius: 999,
    background: "rgba(34,211,238,0.10)",
    border: "1px solid rgba(34,211,238,0.18)",
    color: "#bae6fd",
    fontSize: 10,
    fontWeight: 900,
  },

  adsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 6,
  },

  adMetric: {
    minWidth: 0,
    padding: "5px 7px",
    borderRadius: 8,
    background: "rgba(2,6,23,0.38)",
    border: "1px solid rgba(255,255,255,0.06)",
    display: "grid",
    gap: 1,
  },

  adMetricLabel: {
    color: "#94a3b8",
    fontSize: 9,
    fontWeight: 800,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  adMetricValue: {
    minWidth: 0,
    fontSize: 12,
    fontWeight: 900,
    lineHeight: 1.05,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  statCard: {
    background: "linear-gradient(180deg, rgba(15,23,42,0.78), rgba(8,13,24,0.72))",
    border: "1px solid rgba(148,163,184,0.13)",
    borderRadius: 10,
    padding: "8px 9px 7px",
    display: "grid",
    gap: 2,
    minWidth: 0,
    minHeight: 70,
  },

  statTop: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },

  statIcon: {
    width: 20,
    height: 20,
    borderRadius: 7,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${theme.colors.border}`,
    fontSize: 9,
    flexShrink: 0,
    letterSpacing: 0.6,
    fontWeight: 700,
  },

  statLabel: {
    fontSize: theme.font.tiny,
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  statValue: {
    fontSize: 15,
    fontWeight: "bold",
    lineHeight: 1.1,
  },

  statSub: {
    fontSize: theme.font.small,
    color: theme.colors.textSoft,
    lineHeight: 1.3,
  },

  progressBarBg: {
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    border: `1px solid ${theme.colors.border}`,
  },

  progressBarFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.35s ease",
  },

  right: {
    position: "relative",
    zIndex: 3,
    display: "flex",
    alignItems: "center",
    gap: 7,
    flexWrap: "nowrap",
    justifyContent: "flex-end",
    minWidth: 0,
  },

  inventoryStrip: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(84px, 1fr))",
    alignItems: "center",
    gap: 5,
    minWidth: 0,
    maxWidth: 430,
  },

  inventoryChip: {
    display: "grid",
    gridTemplateColumns: "22px minmax(0, 1fr)",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
    padding: "5px 7px",
    borderRadius: 9,
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(103,232,249,0.14)",
  },

  inventoryIcon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    display: "grid",
    placeItems: "center",
    background: "rgba(103,232,249,0.09)",
    border: "1px solid rgba(103,232,249,0.12)",
    color: "#67e8f9",
    fontSize: 8,
    fontWeight: 900,
  },

  inventoryText: {
    display: "grid",
    gap: 1,
    minWidth: 0,
    lineHeight: 1.05,
  },

  authColumn: {
    display: "grid",
    gap: 5,
    justifyItems: "end",
    minWidth: 0,
  },

  authActions: {
    display: "flex",
    gap: 6,
    flexWrap: "nowrap",
    justifyContent: "flex-end",
    position: "relative",
    zIndex: 4,
  },

  authStatus: {
    padding: "3px 8px",
    borderRadius: theme.radius.pill,
    fontSize: theme.font.tiny,
    fontWeight: 800,
    letterSpacing: 0.5,
    whiteSpace: "nowrap",
  },

  authStatusOnline: {
    color: "#86efac",
    background: "rgba(34,197,94,0.12)",
    border: "1px solid rgba(34,197,94,0.22)",
  },

  authStatusGuest: {
    color: "#fde68a",
    background: "rgba(245,158,11,0.12)",
    border: "1px solid rgba(245,158,11,0.22)",
  },

  secondaryActionBtn: {
    position: "relative",
    zIndex: 4,
    padding: "6px 9px",
    borderRadius: 8,
    border: "1px solid rgba(103,232,249,0.18)",
    background: "rgba(103,232,249,0.08)",
    color: "#d9f8ff",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 11,
    whiteSpace: "nowrap",
  },

  testActionBtn: {
    position: "relative",
    zIndex: 4,
    padding: "6px 9px",
    borderRadius: 8,
    border: "1px solid rgba(34,197,94,0.22)",
    background: "rgba(34,197,94,0.1)",
    color: "#bbf7d0",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 11,
    whiteSpace: "nowrap",
  },

  logoutBtn: {
    position: "relative",
    zIndex: 4,
    marginLeft: 2,
    padding: "6px 9px",
    borderRadius: 8,
    border: "1px solid rgba(248,113,113,0.18)",
    background: "rgba(248,113,113,0.08)",
    color: theme.colors.danger,
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: 11,
  },
};
