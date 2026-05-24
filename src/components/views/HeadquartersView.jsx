import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { HQ_UPGRADE_LIST, getHqUpgradeCost, getHqUpgradeTimeMin } from '../../data/hqUpgrades';
import { PLANETS, getPlanetById, getPlanetUnlockStatus } from '../../data/planets';
import { getProgressionStats } from '../../utils/progressionStats';

const styles = {
  wrap: { display: 'grid', gap: 14 },
  hero: {
    display: 'grid',
    gap: 10,
    padding: 16,
    borderRadius: 14,
    background: 'linear-gradient(135deg, rgba(8,15,30,0.98), rgba(18,24,42,0.98))',
    border: '1px solid rgba(96,165,250,0.16)',
    boxShadow: '0 12px 28px rgba(0,0,0,0.22)',
  },
  kicker: {
    fontSize: 11,
    color: '#7dd3fc',
    fontWeight: 900,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  title: { fontSize: 22, fontWeight: 900, color: '#f8fafc', lineHeight: 1.1 },
  text: { fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, maxWidth: 760 },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 8,
  },
  summaryBox: {
    padding: 10,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.035)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.45,
    marginBottom: 4,
  },
  summaryValue: { fontSize: 14, color: '#f8fafc', fontWeight: 900 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: 10,
  },
  card: {
    display: 'grid',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    background: 'rgba(15,23,42,0.88)',
    border: '1px solid rgba(148,163,184,0.14)',
    boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
  },
  top: { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' },
  name: { fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1.2 },
  desc: { fontSize: 12, color: '#94a3b8', lineHeight: 1.45 },
  badge: {
    padding: '5px 8px',
    borderRadius: 999,
    background: 'rgba(56,189,248,0.12)',
    border: '1px solid rgba(56,189,248,0.2)',
    color: '#7dd3fc',
    fontSize: 10,
    fontWeight: 900,
    whiteSpace: 'nowrap',
  },
  effect: {
    padding: 9,
    borderRadius: 10,
    background: 'rgba(34,197,94,0.08)',
    border: '1px solid rgba(34,197,94,0.14)',
    color: '#bbf7d0',
    fontSize: 12,
    fontWeight: 800,
  },
  costBox: {
    display: 'grid',
    gap: 4,
    padding: 9,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.035)',
    border: '1px solid rgba(255,255,255,0.07)',
    fontSize: 12,
    color: '#cbd5e1',
  },
  costMissing: { color: '#fca5a5', fontWeight: 800 },
  costReady: { color: '#bbf7d0', fontWeight: 800 },
  button: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(90deg,#22c55e,#06b6d4)',
    color: '#fff',
    fontSize: 12,
    fontWeight: 900,
    cursor: 'pointer',
  },
  integrityPanel: {
    display: 'grid',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    background: 'linear-gradient(180deg, rgba(244,63,94,0.10), rgba(15,23,42,0.88))',
    border: '1px solid rgba(244,63,94,0.18)',
  },
  integrityTop: { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' },
  integrityTitle: { fontSize: 15, fontWeight: 900, color: '#fecdd3' },
  integrityText: { fontSize: 12, color: '#cbd5e1', lineHeight: 1.5 },
  integrityBar: { height: 9, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  integrityFill: { height: '100%', borderRadius: 999, transition: 'width 0.25s ease' },
  integrityCost: { fontSize: 12, color: '#fda4af', fontWeight: 800 },
  orbitalPanel: {
    display: 'grid',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    background: 'linear-gradient(180deg, rgba(56,189,248,0.10), rgba(15,23,42,0.9))',
    border: '1px solid rgba(56,189,248,0.18)',
  },
  orbitalGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: 8 },
  orbitalReq: { padding: 9, borderRadius: 10, background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)', fontSize: 12, color: '#cbd5e1' },
  orbitalReady: { color: '#bbf7d0', fontWeight: 900 },
  orbitalMissing: { color: '#fca5a5', fontWeight: 900 },
  disabled: { opacity: 0.45, cursor: 'not-allowed', boxShadow: 'none' },
};

const formatNumber = (value, max = 2) =>
  Number(value || 0).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: max,
  });

const formatProgress = (value, target) => `${formatNumber(value, 0)}/${formatNumber(target, 0)}`;
const formatDuration = (ms) => {
  const totalSeconds = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return `${hours} h ${String(rest).padStart(2, '0')} min`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
const formatResourceName = (key) => ({
  water: 'Agua',
  energy_cells: 'Electricidad',
  mineral: 'Mineral',
  purified_water: 'Agua purificada',
  metal_components: 'Componentes',
  oxygen_tanks: 'Oxigeno',
  alloy_frames: 'Aleaciones',
  habitat_modules: 'Habitats',
}[key] || key);

const canAffordResources = (resources = [], inventory = {}) =>
  resources.every((item) => Number(inventory?.[item.key] ?? 0) >= Number(item.amount ?? 0));

const getIntegrityRepairPreview = (player = {}) => {
  const health = Math.max(0, Math.min(100, Number(player?.health ?? 100)));
  const missing = Math.max(0, 100 - health);
  const restore = Math.min(30, missing);
  const tier = Math.ceil(restore / 10);
  return {
    restore,
    credits: Math.max(0, Math.ceil(restore * 1.25 + tier * 10)),
    resources: restore > 0
      ? [
          { key: 'water', amount: Math.max(2, tier * 5) },
          { key: 'energy_cells', amount: Math.max(1, tier * 3) },
          ...(health < 60 ? [{ key: 'purified_water', amount: tier * 2 }] : []),
          ...(health < 35 ? [{ key: 'metal_components', amount: tier }] : []),
        ]
      : [],
  };
};
export function HeadquartersView({ hq = {}, player, inventory = {}, hqProjects = null, save = null, onUpgrade, onTriggerHqAdBoost, onRepairIntegrity, onOpenPlanetProject }) {
  const [now, setNow] = useState(Date.now());
  const credits = Number(player?.credits ?? 0);
  const { commonRows, hqOnlyRows } = getProgressionStats(save?.research, hq);
  const totalLevel = HQ_UPGRADE_LIST.reduce((sum, item) => sum + Number(hq?.[item.key] ?? 0), 0);
  const activeProject = hqProjects?.active || null;
  const activeUpgrade = activeProject ? HQ_UPGRADE_LIST.find((item) => item.key === activeProject.key) : null;
  const remainingMs = activeProject ? Math.max(0, Number(activeProject.endsAt ?? 0) - now) : 0;
  const totalMs = activeProject ? Math.max(1, Number(activeProject.endsAt ?? 0) - Number(activeProject.startedAt ?? 0)) : 1;
  const progressPct = activeProject ? Math.min(100, Math.max(0, ((totalMs - remainingMs) / totalMs) * 100)) : 0;
  const health = Math.max(0, Math.min(100, Number(player?.health ?? 100)));
  const repair = getIntegrityRepairPreview(player);
  const canRepair = repair.restore > 0 && credits >= repair.credits && canAffordResources(repair.resources, inventory);
  const currentPlanetId = player?.currentPlanet || player?.planet || 'nexus-prime';
  const currentPlanetIndex = Math.max(0, PLANETS.findIndex((planet) => planet.id === currentPlanetId));
  const nextPlanet = PLANETS[currentPlanetIndex + 1] || null;
  const orbitalSave = save || { player, hq, inventory, companies: [], territories: [], stats: {}, research: {} };
  const nextStatus = nextPlanet ? getPlanetUnlockStatus(nextPlanet, orbitalSave) : null;
  const nextProgress = nextStatus?.progress || {};
  const nextRequirements = nextStatus?.requirements || {};
  const travelResources = nextPlanet?.travelResources || [];
  const canAffordTravelResources = canAffordResources(travelResources, inventory);
  const currentPlanet = getPlanetById(currentPlanetId);
  const boostDisabled = !activeProject || activeProject.adBoostUsed;

  useEffect(() => {
    if (!activeProject?.endsAt) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeProject?.endsAt]);

  const activeLabel = useMemo(() => {
    if (!activeProject) return null;
    return `${activeProject.title || activeUpgrade?.name || 'Mejora'} nivel ${activeProject.level || ''}`.trim();
  }, [activeProject, activeUpgrade]);

  const handleBoost = () => {
    if (!activeProject || activeProject.adBoostUsed) return;
    onTriggerHqAdBoost?.();
  };

  return (
    <div style={styles.wrap}>
      <div style={{ ...styles.hero, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={styles.kicker}>Sede</div>
            <div style={{ ...styles.title, fontSize: 18 }}>Nivel {totalLevel} · Integridad {formatNumber(health, 0)}/100 · {currentPlanet?.name || currentPlanetId}</div>
            <div style={{ ...styles.text, fontSize: 12 }}>
              {nextPlanet
                ? `${nextPlanet.name}: ${nextStatus?.unlocked ? 'ruta lista' : `${formatNumber((nextStatus?.overallProgress || 0) * 100, 0)}% desbloqueado`}`
                : 'Todas las rutas principales estan abiertas.'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => onRepairIntegrity?.()}
              disabled={!canRepair}
              style={{ ...styles.button, width: 'auto', minWidth: 120, ...(!canRepair ? styles.disabled : null) }}
            >
              {repair.restore <= 0 ? 'Estable' : `Reparar +${formatNumber(repair.restore, 0)}`}
            </button>
            {nextPlanet && (
              <button
                type="button"
                onClick={() => onOpenPlanetProject?.(nextPlanet.id)}
                disabled={!nextStatus?.unlocked && !canAffordTravelResources}
                style={{ ...styles.button, width: 'auto', minWidth: 120, background: 'rgba(14,165,233,0.16)', border: '1px solid rgba(125,211,252,0.28)', ...(!nextStatus?.unlocked && !canAffordTravelResources ? styles.disabled : null) }}
              >
                Ruta orbital
              </button>
            )}
          </div>
        </div>
        <div style={styles.summaryGrid}>
          {commonRows.slice(0, 3).map((row) => (
            <Summary key={row.key} label={row.label} value={row.total} />
          ))}
          <Summary label="Venta" value={hqOnlyRows[0]?.value || '+0%'} />
        </div>
        <ProgressionMatrix rows={commonRows} />
        {activeProject && (
          <div style={{ display: 'grid', gap: 8, padding: 10, borderRadius: 10, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(125,211,252,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={styles.kicker}>Mejora en curso</div>
                <div style={{ ...styles.name, color: '#e0f2fe' }}>{activeLabel}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ ...styles.badge, background: 'rgba(14,165,233,0.16)' }}>{formatDuration(remainingMs)}</div>
                <button
                  type="button"
                  onClick={handleBoost}
                  disabled={boostDisabled}
                  style={{ ...styles.button, width: 'auto', minWidth: 150, padding: '8px 10px', background: 'linear-gradient(90deg,#f59e0b,#06b6d4)', ...(boostDisabled ? styles.disabled : null) }}
                >
                  {activeProject.adBoostUsed ? 'Anuncio usado' : 'Acelerar con anuncio'}
                </button>
              </div>
            </div>
            <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.09)', overflow: 'hidden' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#22c55e,#22d3ee)', transition: 'width 0.25s ease' }} />
            </div>
          </div>
        )}
      </div>

      <div style={styles.table}>
        {HQ_UPGRADE_LIST.map((item) => {
          const level = Number(hq?.[item.key] ?? 0);
          const cost = getHqUpgradeCost(item.key, level);
          const isMaxed = level >= item.maxLevel;
          const isActive = activeProject?.key === item.key;
          const isBusy = Boolean(activeProject);
          const timeMin = getHqUpgradeTimeMin(level);
          const canBuy =
            !isMaxed &&
            !isBusy &&
            credits >= Number(cost.credits ?? 0) &&
            canAffordResources(cost.resources, inventory);
          const hasCredits = credits >= Number(cost.credits ?? 0);
          const currentEffect = item.effectLabel(level);
          const nextEffect = item.effectLabel(Math.min(item.maxLevel, level + 1));
          return (
            <div
              key={item.key}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(150px, 1fr) minmax(160px, 1.25fr) minmax(190px, 1.15fr) 118px',
                gap: 8,
                alignItems: 'center',
                padding: 10,
                borderRadius: 10,
                background: 'rgba(15,23,42,0.76)',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <div>
                <div style={styles.name}>{item.name}</div>
                <div style={styles.desc}>Nivel {level}/{item.maxLevel}</div>
              </div>
              <div style={{ ...styles.effect, padding: 8, display: 'grid', gap: 3 }}>
                <span>{currentEffect}</span>
                <span style={{ color: '#7dd3fc', fontSize: 11 }}>
                  {isMaxed ? 'Modulo completado' : `Siguiente: ${nextEffect}`}
                </span>
              </div>
              <div style={{ display: 'grid', gap: 4, fontSize: 11, color: '#cbd5e1' }}>
                {isMaxed ? (
                  <strong style={{ color: '#bbf7d0' }}>Completado</strong>
                ) : (
                  <>
                    <div style={hasCredits ? styles.costReady : styles.costMissing}>
                      Creditos: {formatNumber(credits, 0)}/{formatNumber(cost.credits, 0)} cr
                    </div>
                    <div style={styles.costReady}>Tiempo: {timeMin} min</div>
                    {cost.resources.length ? cost.resources.map((resource) => {
                      const owned = Number(inventory?.[resource.key] ?? 0);
                      const ok = owned >= Number(resource.amount ?? 0);
                      return (
                        <div key={resource.key} style={ok ? styles.costReady : styles.costMissing}>
                          {formatResourceName(resource.key)}: {formatNumber(owned, 0)}/{formatNumber(resource.amount, 0)}
                        </div>
                      );
                    }) : (
                      <div style={styles.costReady}>Productos: no requiere</div>
                    )}
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => onUpgrade?.(item.key)}
                disabled={!canBuy}
                style={{ ...styles.button, padding: '8px 10px', ...(!canBuy ? styles.disabled : null) }}
              >
                {isMaxed ? 'Maximo' : isActive ? 'En curso' : isBusy ? 'En espera' : 'Iniciar'}
              </button>
            </div>
          );
        })}
      </div>

      {nextPlanet && (
        <details style={styles.card}>
          <summary style={{ cursor: 'pointer', fontWeight: 900, color: '#f8fafc' }}>
            Ver requisitos orbitales de {nextPlanet.name}
          </summary>
          <div style={{ ...styles.orbitalGrid, marginTop: 10 }}>
            {Object.entries(nextRequirements).map(([key, target]) => (
              <div key={key} style={styles.orbitalReq}>
                <strong>{key}</strong>: {formatProgress(nextProgress[key] || 0, target)}
              </div>
            ))}
            {travelResources.map((item) => (
              <div key={item.key} style={styles.orbitalReq}>
                <strong>{item.key}</strong>: {formatProgress(inventory?.[item.key] || 0, item.amount)}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );

}

function Summary({ label, value }) {
  return (
    <div style={styles.summaryBox}>
      <div style={styles.summaryLabel}>{label}</div>
      <div style={styles.summaryValue}>{value}</div>
    </div>
  );
}

function ProgressionMatrix({ rows }) {
  return (
    <div style={{ display: 'grid', gap: 8, padding: 10, borderRadius: 10, background: 'rgba(2,6,23,0.22)', border: '1px solid rgba(148,163,184,0.10)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div>
          <div style={styles.kicker}>Bonos comunes</div>
          <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 900 }}>Investigacion + Sede = efecto real</div>
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>La sede refuerza los mismos ejes que algunas investigaciones.</div>
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {rows.map((row) => (
          <div
            key={row.key}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(110px, 1.1fr) repeat(3, minmax(72px, 0.75fr))',
              gap: 8,
              alignItems: 'center',
              padding: 8,
              borderRadius: 8,
              background: 'rgba(15,23,42,0.72)',
              border: '1px solid rgba(148,163,184,0.10)',
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: '#f8fafc', fontWeight: 900 }}>{row.label}</div>
              <div style={{ fontSize: 10, color: '#94a3b8' }}>{row.detail}</div>
            </div>
            <MatrixValue label="Inv." value={row.research} />
            <MatrixValue label="Sede" value={row.hq} />
            <MatrixValue label="Total" value={row.total} highlight />
          </div>
        ))}
      </div>
    </div>
  );
}

function MatrixValue({ label, value, highlight = false }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 9, color: '#64748b', fontWeight: 900, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 12, color: highlight ? '#bbf7d0' : '#dbeafe', fontWeight: 900 }}>{value}</div>
    </div>
  );
}

export default HeadquartersView;




function OrbitalReq({ label, value, ok }) {
  return (
    <div style={styles.orbitalReq}>
      <div style={styles.summaryLabel}>{label}</div>
      <div style={ok ? styles.orbitalReady : styles.orbitalMissing}>{value}</div>
    </div>
  );
}



