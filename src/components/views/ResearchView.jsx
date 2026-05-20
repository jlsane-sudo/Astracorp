import React from 'react';
import { INIT_MARKET } from '../../data/gameData';
import {
  RESEARCH_UPGRADES,
  getResearchEffects,
  getResearchUpgradeCost,
} from '../../data/researchData';
import { getProgressionStats } from '../../utils/progressionStats';

const cardStyle = {
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'linear-gradient(180deg, rgba(15,23,42,0.88), rgba(10,16,28,0.94))',
  borderRadius: 18,
  padding: 14,
  boxShadow: '0 12px 28px rgba(2,6,23,0.22)',
};

const formatPct = (value) => `${Math.round(Number(value || 0) * 100)}%`;

function getUpgradeImpact(upgrade, effects) {
  switch (upgrade.key) {
    case 'field_tools':
      return `${formatPct(1 - effects.workDurationMult)} menos duracion en trabajos`;
    case 'aux_batteries':
      return `+${effects.maxEnergyBonus} energia maxima`;
    case 'logistics':
      return `${formatPct(effects.companyStorageMult - 1)} mas almacenamiento`;
    case 'automation':
      return `${formatPct(effects.companyRateMult - 1)} mas produccion por hora`;
    case 'efficiency':
      return `${formatPct(effects.actionEnergyDiscount)} menos coste energetico`;
    case 'ad_optimization':
      return `Boosts mas fuertes y +${effects.adControlUpgradeBonus.toFixed(1)} por mejora`;
    case 'frontier_doctrine':
      return `${formatPct(effects.conquestPowerMult - 1)} mas fuerza al conquistar`;
    case 'defense_grid':
      return `${formatPct(1 - effects.territoryThreatMult)} menos presion y refuerzo mejorado`;
    case 'territorial_governance':
      return `${formatPct(effects.territoryControlBaseBonus + effects.territoryControlScalingBonus)} mas valor territorial`;
    default:
      return upgrade.desc;
  }
}

export default function ResearchView({
  player,
  research,
  hq,
  researchProjects,
  companies,
  inventory,
  onUpgrade,
  onTriggerResearchAdBoost,
  onOpenTab,
}) {
  const { researchEffects: effects, commonRows, researchOnlyRows, hqOnlyRows } = getProgressionStats(research, hq);
  const energyRecoveryMinutes = Math.max(1, Number(player?.maxEnergy ?? 0) - Number(player?.energy ?? 0));
  const activeProject = researchProjects?.active || null;
  const remainingMs = Math.max(0, Number(activeProject?.endsAt ?? 0) - Date.now());
  const remainingMin = Math.ceil(remainingMs / 60000);
  const researchLabs = (companies || []).filter(
    (company) => (company?.companyType || company?.type) === 'research_lab'
  ).length;
  const labTimeReduction = Math.min(45, researchLabs * 10);
  const handleResearchAdBoost = () => {
    onTriggerResearchAdBoost?.();
  };

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ ...cardStyle, padding: 12, borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 0.7, color: '#7dd3fc', fontWeight: 900 }}>MEJORAS</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#eef6ff' }}>
              {activeProject ? `${activeProject.title} · ${remainingMin} min` : 'Elige la siguiente investigacion'}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              {researchLabs} laboratorios · -{labTimeReduction}% tiempo · {Number(player?.credits ?? 0).toFixed(0)} cr · {Number(player?.energy ?? 0)}/{Number(player?.maxEnergy ?? 0)} energia
            </div>
          </div>
          <button
            type="button"
            onClick={handleResearchAdBoost}
            disabled={!activeProject || Boolean(activeProject?.adBoostUsed)}
            style={{
              minHeight: 34,
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid rgba(250,204,21,0.35)',
              background: !activeProject || activeProject?.adBoostUsed ? 'rgba(148,163,184,0.10)' : '#f59e0b',
              color: !activeProject || activeProject?.adBoostUsed ? '#94a3b8' : '#221306',
              fontWeight: 900,
              cursor: !activeProject || activeProject?.adBoostUsed ? 'not-allowed' : 'pointer',
            }}
          >
            {activeProject?.adBoostUsed ? 'Boost usado' : 'Acelerar con anuncio'}
          </button>
        </div>
        {activeProject && (
          <div style={{ height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginTop: 10 }}>
            <div
              style={{
                width: `${Math.max(4, Math.min(100, ((Date.now() - Number(activeProject.startedAt ?? 0)) / Math.max(1, Number(activeProject.endsAt ?? 0) - Number(activeProject.startedAt ?? 0))) * 100))}%`,
                height: '100%',
                background: 'linear-gradient(90deg,#f59e0b,#22c55e)',
              }}
            />
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
        {[...commonRows.map((row) => `${row.label} ${row.total}`), ...researchOnlyRows.map((row) => `${row.label} ${row.value}`), ...hqOnlyRows.map((row) => `${row.label} ${row.value}`)].map((line) => (
          <div key={line} style={{ padding: 9, borderRadius: 8, background: 'rgba(15,23,42,0.72)', border: '1px solid rgba(255,255,255,0.07)', color: '#dbeafe', fontSize: 12, fontWeight: 800 }}>
            {line}
          </div>
        ))}
      </div>

      <ProgressionMatrix rows={commonRows} />

      <div style={{ display: 'grid', gap: 8 }}>
        {RESEARCH_UPGRADES.map((upgrade) => {
          const level = Number(research?.[upgrade.key] ?? 0);
          const cost = getResearchUpgradeCost(research, upgrade.key);
          const isMaxed = level >= upgrade.maxLevel;
          const currentImpact = getUpgradeImpact(upgrade, effects);
          const nextEffects = getResearchEffects({
            ...(research || {}),
            [upgrade.key]: Math.min(upgrade.maxLevel, level + 1),
          });
          const nextImpact = getUpgradeImpact(upgrade, nextEffects);
          const hasResources = (cost.resources || []).every((resource) => Number(inventory?.[resource.key] ?? 0) >= Number(resource.amount ?? 0));
          const canBuy = !isMaxed && !activeProject && Number(player?.credits ?? 0) >= Number(cost.credits ?? 0) && hasResources;
          const resourceText = (cost.resources || []).map((resource) => {
            const marketMeta = INIT_MARKET[resource.key] || {};
            const owned = Number(inventory?.[resource.key] ?? 0);
            return `${marketMeta.name || resource.key} ${owned}/${resource.amount}`;
          }).join(' + ');
          return (
            <div
              key={upgrade.key}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(150px, 1fr) minmax(170px, 1.35fr) minmax(120px, 1fr) 112px',
                gap: 8,
                alignItems: 'center',
                padding: 10,
                borderRadius: 10,
                background: 'rgba(15,23,42,0.76)',
                border: '1px solid rgba(148,163,184,0.12)',
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#f8fafc' }}>{upgrade.title}</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Nivel {level}/{upgrade.maxLevel}</div>
              </div>
              <div style={{ display: 'grid', gap: 3 }}>
                <div style={{ fontSize: 12, color: '#bbf7d0', fontWeight: 800 }}>{currentImpact}</div>
                <div style={{ fontSize: 11, color: '#7dd3fc', fontWeight: 800 }}>
                  {isMaxed ? 'Rama completada' : `Siguiente: ${nextImpact}`}
                </div>
              </div>
              <div style={{ fontSize: 11, color: canBuy || isMaxed ? '#cbd5e1' : '#fca5a5' }}>
                {isMaxed ? 'Completada' : `${cost.credits} cr · ${cost.timeMin} min${resourceText ? ` · ${resourceText}` : ''}`}
              </div>
              <button
                type="button"
                onClick={() => onUpgrade?.(upgrade.key)}
                disabled={!canBuy}
                style={{
                  minHeight: 32,
                  borderRadius: 8,
                  border: 'none',
                  background: canBuy ? 'linear-gradient(90deg,#22c55e,#06b6d4)' : 'rgba(148,163,184,0.12)',
                  color: canBuy ? '#fff' : '#64748b',
                  fontWeight: 900,
                  cursor: canBuy ? 'pointer' : 'not-allowed',
                }}
              >
                {activeProject ? 'Ocupado' : isMaxed ? 'Maximo' : 'Investigar'}
              </button>
            </div>
          );
        })}
      </div>

      <details style={{ ...cardStyle, padding: 12, borderRadius: 12 }}>
        <summary style={{ cursor: 'pointer', color: '#f8fafc', fontWeight: 900 }}>Ver contexto y accesos</summary>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <button type="button" onClick={() => onOpenTab?.('business')} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(125,211,252,0.24)', background: 'rgba(14,165,233,0.10)', color: '#bae6fd', fontWeight: 800 }}>Empresas</button>
          <button type="button" onClick={() => onOpenTab?.('map')} style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(125,211,252,0.24)', background: 'rgba(14,165,233,0.10)', color: '#bae6fd', fontWeight: 800 }}>Mapa</button>
          <span style={{ fontSize: 12, color: '#94a3b8', alignSelf: 'center' }}>Recuperacion energetica: {energyRecoveryMinutes} min hasta llenarse.</span>
        </div>
      </details>
    </div>
  );

}

function ProgressionMatrix({ rows }) {
  return (
    <div style={{ ...cardStyle, padding: 12, borderRadius: 12, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 0.7, color: '#7dd3fc', fontWeight: 900 }}>BONOS COMUNES</div>
          <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 900 }}>Investigacion + Sede = efecto real</div>
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>Estas estadisticas se acumulan entre las dos pantallas.</div>
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

