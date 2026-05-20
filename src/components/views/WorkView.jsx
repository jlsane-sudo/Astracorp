import React, { useEffect, useMemo, useState } from 'react';
import IndustryVisual from '../IndustryVisual';
import { companyAssets } from '../../assets/generated/assets';

const JOB_DURATION_BY_LEVEL = {
  1: 180,
  2: 240,
  3: 300,
};

const styles = {
  wrapper: {
    display: 'grid',
    gap: 10,
  },

  sectionTitle: {
    fontSize: 11,
    fontWeight: 800,
    color: '#7dd3fc',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: 10,
    alignItems: 'stretch',
  },

  card: {
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(15,23,42,0.9))',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 10,
    boxShadow: '0 6px 14px rgba(0,0,0,0.14)',
    display: 'grid',
    gap: 8,
    minHeight: 318,
    alignContent: 'start',
  },

  cardActive: {
    boxShadow: '0 0 0 1px rgba(56,189,248,0.18), 0 0 24px rgba(56,189,248,0.12)',
    border: '1px solid rgba(56,189,248,0.18)',
  },

  cardBlocked: {
    opacity: 0.72,
  },

  topGlow: {
    position: 'absolute',
    top: -35,
    right: -12,
    width: 115,
    height: 115,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(168,85,247,0.14), rgba(168,85,247,0))',
    pointerEvents: 'none',
  },

  floatWrap: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },

  floatText: {
    position: 'absolute',
    right: 14,
    bottom: 12,
    fontSize: 13,
    fontWeight: 800,
    color: '#38bdf8',
    textShadow: '0 0 12px rgba(56,189,248,0.35)',
    animation: 'company-float-up 900ms ease-out forwards',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
    alignItems: 'flex-start',
  },

  titleBlock: {
    display: 'grid',
    gap: 4,
    minWidth: 0,
  },

  title: {
    fontSize: 13,
    fontWeight: 900,
    color: '#fff',
    lineHeight: 1.15,
    overflowWrap: 'anywhere',
  },

  subtitle: {
    fontSize: 10,
    color: '#94a3b8',
  },

  visualShell: {
    display: 'grid',
    gridTemplateColumns: '66px 1fr',
    gap: 8,
    alignItems: 'center',
    minHeight: 74,
    padding: 6,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.05)',
  },

  visualShellActive: {
    boxShadow: '0 0 0 1px rgba(255,255,255,0.05), inset 0 0 22px rgba(255,255,255,0.03)',
  },
  compactJobIdentity: {
    display: 'grid',
    gridTemplateColumns: '64px minmax(0, 1fr)',
    gap: 10,
    alignItems: 'center',
    minWidth: 0,
  },
  compactJobArt: {
    width: 64,
    height: 64,
    objectFit: 'cover',
    borderRadius: 12,
    border: '1px solid rgba(103,232,249,0.2)',
    background: 'rgba(2,6,23,0.58)',
    boxShadow: '0 10px 22px rgba(2,6,23,0.2), 0 0 18px rgba(34,211,238,0.08)',
  },

  visualText: {
    display: 'grid',
    gap: 4,
    minWidth: 0,
  },

  visualTitle: {
    fontSize: 11,
    fontWeight: 800,
    color: '#e2e8f0',
    lineHeight: 1.25,
    overflowWrap: 'anywhere',
  },

  visualSub: {
    fontSize: 9,
    color: '#94a3b8',
    lineHeight: 1.35,
    overflowWrap: 'anywhere',
  },

  modePill: {
    display: 'inline-flex',
    width: 'fit-content',
    padding: '3px 7px',
    borderRadius: 999,
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 0.35,
  },

  telemetryRow: {
    display: 'flex',
    alignItems: 'end',
    gap: 4,
    height: 22,
  },

  telemetryBar: {
    flex: 1,
    minWidth: 0,
    borderRadius: 999,
    opacity: 0.95,
  },

  badgeColumn: {
    display: 'grid',
    gap: 6,
    justifyItems: 'end',
  },

  rewardBadge: {
    padding: '4px 7px',
    borderRadius: 999,
    background: 'rgba(34,197,94,0.12)',
    border: '1px solid rgba(34,197,94,0.18)',
    color: '#4ade80',
    fontSize: 9,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },

  operationRewardRow: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
  },

  operationRewardBadge: {
    padding: '3px 6px',
    borderRadius: 999,
    background: 'rgba(34,211,238,0.1)',
    border: '1px solid rgba(34,211,238,0.18)',
    color: '#a5f3fc',
    fontSize: 9,
    fontWeight: 900,
    whiteSpace: 'nowrap',
  },

  operationStockGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 6,
  },

  operationStockBox: {
    display: 'grid',
    gap: 2,
    padding: 8,
    borderRadius: 8,
    background: 'rgba(15,23,42,0.58)',
    border: '1px solid rgba(34,211,238,0.12)',
    minHeight: 52,
  },

  operationStockCode: {
    color: '#a5f3fc',
    fontSize: 11,
    fontWeight: 900,
  },

  operationStockValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 900,
  },

  operationStockUse: {
    color: '#94a3b8',
    fontSize: 9,
    lineHeight: 1.2,
  },

  stateBadge: {
    padding: '4px 7px',
    borderRadius: 999,
    fontSize: 9,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },

  heroLine: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 8,
  },

  heroStat: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 8,
  },

  heroLabel: {
    fontSize: 9,
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  heroValue: {
    fontSize: 12,
    fontWeight: 900,
    color: '#f8fafc',
  },

  activeInlineBox: {
    display: 'grid',
    gap: 6,
    padding: 8,
    borderRadius: 10,
    minHeight: 88,
    alignContent: 'center',
    background: 'linear-gradient(180deg, rgba(56,189,248,0.06), rgba(15,23,42,0.42))',
    border: '1px solid rgba(255,255,255,0.06)',
  },

  progressWrap: {
    display: 'grid',
    gap: 6,
  },

  progressTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    fontSize: 10,
    color: '#cbd5e1',
  },

  progressHint: {
    fontSize: 10,
    color: '#94a3b8',
    lineHeight: 1.35,
  },

  progressOuter: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    background: '#1e293b',
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.04)',
  },

  progressInner: {
    height: '100%',
    borderRadius: 999,
    background: 'linear-gradient(90deg,#38bdf8,#22c55e)',
    transition: 'width 0.3s ease',
    boxShadow: '0 0 18px rgba(56,189,248,0.22)',
  },

  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 6,
  },

  statBox: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 7,
    minHeight: 52,
  },

  statLabel: {
    fontSize: 9,
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  statValue: {
    fontSize: 11,
    fontWeight: 800,
    color: '#f8fafc',
  },

  helperBox: {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 8,
    fontSize: 10,
    color: '#cbd5e1',
    lineHeight: 1.2,
    minHeight: 30,
    display: 'flex',
    alignItems: 'center',
  },

  territoryHint: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
    padding: '8px 10px',
    borderRadius: 8,
    background: 'rgba(8,47,73,0.18)',
    border: '1px solid rgba(34,211,238,0.16)',
    color: '#cbd5e1',
    fontSize: 10,
    lineHeight: 1.35,
  },

  button: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(90deg,#22c55e,#06b6d4)',
    color: '#fff',
    fontSize: 11,
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: '0 6px 14px rgba(6,182,212,0.16)',
  },

  buttonDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },

  adButton: {
    width: '100%',
    padding: '7px 9px',
    borderRadius: 10,
    border: '1px solid rgba(56,189,248,0.18)',
    background: 'rgba(56,189,248,0.08)',
    color: '#7dd3fc',
    fontSize: 10,
    fontWeight: 800,
    cursor: 'pointer',
  },
};

const formatNumber = (n, max = 2) =>
  Number(n || 0).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: max,
  });

const formatDuration = (sec) => {
  const totalSec = Math.max(0, Number(sec || 0));
  const min = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  if (min <= 0) return `${seconds}s`;
  if (seconds === 0) return `${min} min`;
  return `${min} min ${seconds}s`;
};

const formatRemaining = (sec) => {
  const totalSec = Math.max(0, Number(sec || 0));
  const min = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${String(min).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const getJobDurationSec = (job) => {
  const explicit = Number(job?.durationSec ?? 0);
  if (explicit > 0) return explicit;

  const unlockLevel = Number(job?.unlockLevel ?? 1);
  return JOB_DURATION_BY_LEVEL[unlockLevel] || 60;
};

const getResourceLabel = (item) => {
  if (item === 'water') return 'Agua';
  if (item === 'energy_cells') return 'Electricidad';
  if (item === 'mineral') return 'Mineral';
  if (item === 'purified_water') return 'Purificada';
  if (item === 'metal_components') return 'Componentes';
  if (item === 'oxygen_tanks') return 'Oxigeno';
  if (item === 'alloy_frames') return 'Aleaciones';
  if (item === 'habitat_modules') return 'Habitats';
  return 'Recurso';
};

const getOperationRewardLabel = (key) => {
  if (key === 'intel_data') return 'INT';
  if (key === 'exploit_kits') return 'HK';
  if (key === 'security_teams') return 'SEC';
  if (key === 'influence_cells') return 'INF';
  return key || 'OP';
};

const OPERATION_RESOURCE_GUIDE = [
  { key: 'intel_data', code: 'INT', label: 'Inteligencia', use: 'Espiar y apoyar conquista' },
  { key: 'exploit_kits', code: 'HK', label: 'Kits hack', use: 'Hackear y sabotear' },
  { key: 'security_teams', code: 'SEC', label: 'Seguridad', use: 'Defender y conquistar' },
  { key: 'influence_cells', code: 'INF', label: 'Influencia', use: 'Sabotaje encubierto' },
];

const getOperationRewards = (job) =>
  (Array.isArray(job?.operationRewards) ? job.operationRewards : [])
    .filter((reward) => reward?.key && Number(reward.amount ?? 0) > 0);

const getOperationRewardText = (job) => {
  const rewards = getOperationRewards(job);
  if (!rewards.length) return 'No prepara operaciones territoriales.';
  return rewards
    .map((reward) => `+${formatNumber(reward.amount, 2)} ${getOperationRewardLabel(reward.key)}`)
    .join(' + ');
};

const getJobVisualType = (item) => {
  if (item === 'water') return 'dew_collector';
  if (item === 'energy_cells') return 'solar_panel';
  if (item === 'mineral') return 'surface_mine';
  if (item === 'purified_water') return 'water_purifier';
  if (item === 'metal_components') return 'smelter';
  if (item === 'oxygen_tanks') return 'electrolysis_plant';
  if (item === 'alloy_frames') return 'industrial_forge';
  if (item === 'habitat_modules') return 'habitat_factory';
  return 'generic';
};

const getJobProfile = (job) => {
  const item = job?.item;

  if (item === 'water') {
    return {
      mode: 'Captacion',
      hint: 'Barrido atmosferico y lectura de humedad.',
      accent: '#38bdf8',
      shellBg: 'rgba(56,189,248,0.08)',
      shellBorder: 'rgba(56,189,248,0.16)',
      bars: [30, 58, 82, 48],
    };
  }

  if (item === 'energy_cells') {
    return {
      mode: 'Mantenimiento',
      hint: 'Calibracion fotonica y limpieza de captacion.',
      accent: '#facc15',
      shellBg: 'rgba(250,204,21,0.08)',
      shellBorder: 'rgba(250,204,21,0.16)',
      bars: [82, 54, 66, 88],
    };
  }

  if (item === 'mineral') {
    return {
      mode: 'Perforacion',
      hint: 'Excavacion superficial y arrastre mineral.',
      accent: '#fb923c',
      shellBg: 'rgba(251,146,60,0.08)',
      shellBorder: 'rgba(251,146,60,0.16)',
      bars: [52, 80, 68, 42],
    };
  }

  if (item === 'purified_water') {
    return {
      mode: 'Refinado',
      hint: 'Filtro de etapa corta con control de pureza.',
      accent: '#22d3ee',
      shellBg: 'rgba(34,211,238,0.08)',
      shellBorder: 'rgba(34,211,238,0.16)',
      bars: [44, 72, 60, 88],
    };
  }

  if (item === 'metal_components') {
    return {
      mode: 'Mecanizado',
      hint: 'Corte, ensamblaje y tolerancia estructural.',
      accent: '#a78bfa',
      shellBg: 'rgba(167,139,250,0.08)',
      shellBorder: 'rgba(167,139,250,0.16)',
      bars: [64, 38, 84, 58],
    };
  }

  if (item === 'oxygen_tanks') {
    return {
      mode: 'Sintesis',
      hint: 'Compresion de mezcla y sellado de reserva.',
      accent: '#34d399',
      shellBg: 'rgba(52,211,153,0.08)',
      shellBorder: 'rgba(52,211,153,0.16)',
      bars: [36, 76, 90, 62],
    };
  }

  if (item === 'alloy_frames') {
    return {
      mode: 'Forja',
      hint: 'Fase termica y moldeado de aleacion pesada.',
      accent: '#f472b6',
      shellBg: 'rgba(244,114,182,0.08)',
      shellBorder: 'rgba(244,114,182,0.16)',
      bars: [74, 50, 86, 44],
    };
  }

  if (item === 'habitat_modules') {
    return {
      mode: 'Montaje',
      hint: 'Integracion de casco, soporte y modulo vital.',
      accent: '#60a5fa',
      shellBg: 'rgba(96,165,250,0.08)',
      shellBorder: 'rgba(96,165,250,0.16)',
      bars: [42, 68, 92, 74],
    };
  }

  return {
    mode: 'Operacion',
    hint: 'Modulo general de trabajo.',
    accent: '#7dd3fc',
    shellBg: 'rgba(125,211,252,0.08)',
    shellBorder: 'rgba(125,211,252,0.16)',
    bars: [40, 60, 80, 52],
  };
};

const getJobState = ({ activeJob, player, job }) => {
  if (activeJob?.label === job?.label) {
    return { label: 'En curso', tone: 'info' };
  }

  if (activeJob) {
    return { label: 'Ocupado', tone: 'muted' };
  }

  if (Number(player?.level ?? 1) < Number(job?.unlockLevel ?? 1)) {
    return { label: 'Nivel insuficiente', tone: 'danger' };
  }

  if (Number(player?.energy ?? 0) < Number(job?.cost ?? 0)) {
    return { label: 'Falta energia', tone: 'warn' };
  }

  return { label: 'Disponible', tone: 'ok' };
};

const getStateBadgeStyle = (tone) => {
  if (tone === 'ok') {
    return {
      background: 'rgba(34,197,94,0.12)',
      border: '1px solid rgba(34,197,94,0.18)',
      color: '#4ade80',
    };
  }

  if (tone === 'warn') {
    return {
      background: 'rgba(250,204,21,0.12)',
      border: '1px solid rgba(250,204,21,0.18)',
      color: '#fde68a',
    };
  }

  if (tone === 'danger') {
    return {
      background: 'rgba(244,63,94,0.12)',
      border: '1px solid rgba(244,63,94,0.18)',
      color: '#fda4af',
    };
  }

  if (tone === 'info') {
    return {
      background: 'rgba(56,189,248,0.12)',
      border: '1px solid rgba(56,189,248,0.18)',
      color: '#7dd3fc',
    };
  }

  return {
    background: 'rgba(148,163,184,0.12)',
    border: '1px solid rgba(148,163,184,0.18)',
    color: '#cbd5e1',
  };
};

const getJobResourceOutput = (job) => {
  if (!job?.item) return 0;
  return Math.max(0, Number(job?.resourceAmount ?? 1));
};

const getManualRatePerHour = (job) => {
  const durationSec = Math.max(1, getJobDurationSec(job));
  const resourceOutput = getJobResourceOutput(job);
  return (resourceOutput * 3600) / durationSec;
};

export function WorkView({ player, inventory, jobs, activeJob, onWork, onTriggerWorkAdBoost }) {
  const [now, setNow] = useState(Date.now());
  const [floatingStart, setFloatingStart] = useState([]);
  const playerLevel = Number(player?.level ?? 1);

  useEffect(() => {
    if (!activeJob?.endAt) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activeJob?.endAt]);

  const activeProgress = useMemo(() => {
    if (!activeJob?.startedAt || !activeJob?.endAt) return 0;
    const total = Math.max(1, Number(activeJob.endAt) - Number(activeJob.startedAt));
    const elapsed = Math.max(0, now - Number(activeJob.startedAt));
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  }, [activeJob, now]);

  const activeRemainingSec = useMemo(() => {
    if (!activeJob?.endAt) return 0;
    return Math.max(0, Math.ceil((Number(activeJob.endAt) - now) / 1000));
  }, [activeJob, now]);

  const pushFloat = (job) => {
    const id = `${job.label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setFloatingStart((prev) => [...prev, { id, label: `> ${job.label}` }]);

    setTimeout(() => {
      setFloatingStart((prev) => prev.filter((item) => item.id !== id));
    }, 950);
  };

  const handleStartWork = (job) => {
    if (activeJob) return;
    if (Number(player?.energy ?? 0) < Number(job?.cost ?? 0)) return;
    if (Number(player?.level ?? 1) < Number(job?.unlockLevel ?? 1)) return;

    pushFloat(job);
    onWork?.(job);
  };

  const handleWorkAdBoost = () => {
    if (!activeJob || activeJob.adBoostUsed) return;
    onTriggerWorkAdBoost?.();
  };

  const recommendedJob = (jobs || []).find((job) =>
    !activeJob &&
    Number(player?.energy ?? 0) >= Number(job?.cost ?? 0) &&
    Number(player?.level ?? 1) >= Number(job?.unlockLevel ?? 1)
  ) || (jobs || [])[0];
  const strategicEffects = (jobs || []).find((job) => job?.strategicEffects)?.strategicEffects || null;
  const hasStrategicWorkBonus = strategicEffects && (
    Number(strategicEffects.workCreditsBonus ?? 0) > 0 ||
    Number(strategicEffects.operationRewardBonus ?? 0) > 0 ||
    Number(strategicEffects.workDurationMult ?? 1) < 1
  );

  return (
    <div style={styles.wrapper}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: 10,
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        background: activeJob ? 'rgba(8,47,73,0.18)' : 'rgba(15,23,42,0.58)',
        border: activeJob ? '1px solid rgba(34,211,238,0.2)' : '1px solid rgba(148,163,184,0.12)',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#f8fafc', fontSize: 14, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeJob ? `${activeJob.label} en curso - ${activeProgress.toFixed(0)}%` : `Recomendado: ${recommendedJob?.label || 'sin trabajo'}`}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeJob ? `Restante ${formatRemaining(activeRemainingSec)}` : `Energia ${formatNumber(player?.energy ?? 0)} - elige una operacion y sal`}
          </div>
        </div>
        <button
          type="button"
          onClick={handleWorkAdBoost}
          disabled={!activeJob || Boolean(activeJob?.adBoostUsed)}
          style={{ ...styles.adButton, minWidth: 150, ...(!activeJob || activeJob?.adBoostUsed ? styles.buttonDisabled : null) }}
        >
          {!activeJob ? 'Boost al iniciar' : activeJob?.adBoostUsed ? 'Impulso usado' : 'Acelerar'}
        </button>
      </div>

      <div style={styles.territoryHint}>
        <strong style={{ color: '#a5f3fc' }}>Territorio:</strong>
        <span>
          Paso 1: haz trabajos para llenar estos recursos. Luego gastalos en Territorio.
          {hasStrategicWorkBonus
            ? ` Bonus por sectores: +${formatNumber(Number(strategicEffects.workCreditsBonus ?? 0) * 100, 1)}% creditos, +${formatNumber(Number(strategicEffects.operationRewardBonus ?? 0) * 100, 1)}% recursos op.`
            : ''}
        </span>
        <span style={styles.operationRewardBadge}>INT espionaje</span>
        <span style={styles.operationRewardBadge}>HK hackeo</span>
        <span style={styles.operationRewardBadge}>SEC defensa/conquista</span>
        <span style={styles.operationRewardBadge}>INF sabotaje</span>
      </div>

      <div style={styles.operationStockGrid}>
        {OPERATION_RESOURCE_GUIDE.map((resource) => (
          <div key={resource.key} style={styles.operationStockBox}>
            <div style={styles.operationStockCode}>{resource.code} · {resource.label}</div>
            <div style={styles.operationStockValue}>{formatNumber(inventory?.[resource.key] ?? 0, 2)}</div>
            <div style={styles.operationStockUse}>{resource.use}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 7 }}>
        {(jobs || []).map((job) => {
          const canStart =
            !activeJob &&
            Number(player?.energy ?? 0) >= Number(job?.cost ?? 0) &&
            Number(player?.level ?? 1) >= Number(job?.unlockLevel ?? 1);
          const isThisActive = activeJob?.label === job?.label;
          const state = getJobState({ activeJob, player, job });
          const durationSec = getJobDurationSec(job);
          const resourceOutput = getJobResourceOutput(job);
          const manualRatePerHour = getManualRatePerHour(job);
          const operationRewards = getOperationRewards(job);
          const sectorBonusRate = Math.max(0, Math.min(0.01, Number(job?.bonusRate ?? 0)));
          const floats = floatingStart.filter((item) => item.label.includes(job.label));
          const currentProgress = isThisActive ? activeProgress : 0;
          const currentRemainingSec = isThisActive ? activeRemainingSec : durationSec;
          const visualType = getJobVisualType(job?.item);
          const jobArt = companyAssets[visualType];

          return (
            <div
              key={job.label}
              style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: 'minmax(260px, 1.25fr) minmax(120px, 0.75fr) minmax(170px, 1fr) minmax(130px, auto)',
                gap: 8,
                alignItems: 'center',
                minHeight: 82,
                padding: '8px 10px',
                borderRadius: 8,
                background: isThisActive ? 'rgba(8,47,73,0.2)' : canStart ? 'rgba(15,23,42,0.55)' : 'rgba(15,23,42,0.34)',
                border: isThisActive ? '1px solid rgba(34,211,238,0.22)' : '1px solid rgba(148,163,184,0.12)',
                opacity: !canStart && !isThisActive ? 0.72 : 1,
                overflow: 'hidden',
              }}
            >
              <div style={styles.floatWrap}>
                {floats.map((item) => <div key={item.id} style={styles.floatText}>{item.label}</div>)}
              </div>
              <div style={styles.compactJobIdentity}>
                {jobArt ? (
                  <img src={jobArt} alt="" aria-hidden="true" style={styles.compactJobArt} />
                ) : (
                  <IndustryVisual type={visualType} active={isThisActive} size={58} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {job.icon ? `${job.icon} ` : ''}{job.label}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Nivel {formatNumber(job?.unlockLevel ?? 1)} - {getResourceLabel(job?.item)} - Territorio: {getOperationRewardText(job)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 2, color: '#cbd5e1', fontSize: 11 }}>
                <strong style={{ color: '#e2e8f0' }}>+{formatNumber(resourceOutput)} {getResourceLabel(job?.item)}</strong>
                <span>+{formatNumber(job?.credits ?? job?.euros ?? 0, 2)} cr - +{formatNumber(job?.xp ?? 0)} XP</span>
                {operationRewards.length > 0 && (
                  <span style={styles.operationRewardRow}>
                    {operationRewards.map((reward) => (
                      <span key={reward.key} style={styles.operationRewardBadge}>
                        +{formatNumber(reward.amount, 2)} {getOperationRewardLabel(reward.key)}
                      </span>
                    ))}
                  </span>
                )}
                <span style={{ color: sectorBonusRate > 0 ? '#86efac' : '#94a3b8' }}>
                  Sector: {sectorBonusRate > 0 ? `+${formatNumber(sectorBonusRate * 100, 1)}% ${job?.bonusRegionName || 'aplicado'}` : 'sin bonus'}
                </span>
              </div>
              <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, color: '#94a3b8', fontSize: 10 }}>
                  <span>{isThisActive ? `${currentProgress.toFixed(0)}%` : formatDuration(durationSec)}</span>
                  <span>{isThisActive ? formatRemaining(currentRemainingSec) : `${formatNumber(job?.cost ?? 0)} energia`}</span>
                </div>
                <div style={styles.progressOuter}>
                  <div style={{ ...styles.progressInner, width: `${isThisActive ? currentProgress : 0}%`, opacity: isThisActive ? 1 : 0.35 }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                <span style={{ ...styles.stateBadge, ...getStateBadgeStyle(state.tone) }}>{state.label}</span>
                <button
                  type="button"
                  onClick={() => handleStartWork(job)}
                  disabled={!canStart}
                  style={{ ...styles.button, minWidth: 88, ...(!canStart ? styles.buttonDisabled : null) }}
                  title={isThisActive ? 'Este trabajo esta activo' : activeJob ? 'Ya hay otro trabajo activo' : state.tone === 'danger' ? 'Nivel insuficiente' : state.tone === 'warn' ? 'Energia insuficiente' : `${formatNumber(manualRatePerHour, 1)} ${getResourceLabel(job?.item)}/h equivalente`}
                >
                  {isThisActive ? 'Activo' : canStart ? 'Iniciar' : 'Bloqueado'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

}

export default WorkView;
