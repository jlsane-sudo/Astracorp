import React from 'react';
import { INIT_MARKET } from '../../data/gameData';
import {
  RESEARCH_UPGRADES,
  getResearchEffects,
  getResearchUpgradeCost,
} from '../../data/researchData';

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
  researchProjects,
  companies,
  inventory,
  onUpgrade,
  onTriggerResearchAdBoost,
  onOpenTab,
}) {
  const effects = getResearchEffects(research);
  const energyRecoveryMinutes = Math.max(1, Number(player?.maxEnergy ?? 0) - Number(player?.energy ?? 0));
  const activeProject = researchProjects?.active || null;
  const remainingMs = Math.max(0, Number(activeProject?.endsAt ?? 0) - Date.now());
  const remainingMin = Math.ceil(remainingMs / 60000);
  const activeProjectTotalMin = Math.max(
    1,
    Math.ceil(
      Math.max(
        0,
        Number(activeProject?.endsAt ?? 0) - Number(activeProject?.startedAt ?? 0)
      ) / 60000
    )
  );
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
        {[
          `Trabajos ${formatPct(1 - effects.workDurationMult)}`,
          `Empresas +${formatPct(effects.companyRateMult - 1)}`,
          `Almacen +${formatPct(effects.companyStorageMult - 1)}`,
          `Energia -${formatPct(effects.actionEnergyDiscount)}`,
          `Mapa -${formatPct(1 - effects.territoryThreatMult)}`,
        ].map((line) => (
          <div key={line} style={{ padding: 9, borderRadius: 8, background: 'rgba(15,23,42,0.72)', border: '1px solid rgba(255,255,255,0.07)', color: '#dbeafe', fontSize: 12, fontWeight: 800 }}>
            {line}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        {RESEARCH_UPGRADES.map((upgrade) => {
          const level = Number(research?.[upgrade.key] ?? 0);
          const cost = getResearchUpgradeCost(research, upgrade.key);
          const isMaxed = level >= upgrade.maxLevel;
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
              <div style={{ fontSize: 12, color: '#bbf7d0', fontWeight: 800 }}>{getUpgradeImpact(upgrade, effects)}</div>
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

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div
        style={{
          ...cardStyle,
          display: 'grid',
          gap: 10,
          borderColor: 'rgba(56,189,248,0.16)',
          background:
            'linear-gradient(180deg, rgba(8,20,36,0.96), rgba(7,12,22,0.98))',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ fontSize: 12, letterSpacing: 0.8, color: '#7dd3fc' }}>
              INVESTIGACION
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#eef6ff' }}>
              Mejoras permanentes
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 8,
              minWidth: 'min(100%, 420px)',
              flex: '1 1 320px',
            }}
          >
            <div style={{ ...cardStyle, padding: '10px 12px', borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Creditos listos</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{Number(player?.credits ?? 0).toFixed(2)}</div>
            </div>
            <div style={{ ...cardStyle, padding: '10px 12px', borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Energia actual</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>
                {Number(player?.energy ?? 0)} / {Number(player?.maxEnergy ?? 0)}
              </div>
            </div>
            <div style={{ ...cardStyle, padding: '10px 12px', borderRadius: 14 }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>Recuperacion</div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>1/min</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{energyRecoveryMinutes} min hasta llenarse</div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 8,
          }}
        >
          {[
            `Trabajos: ${formatPct(1 - effects.workDurationMult)} mas rapidos`,
            `Empresas: ${formatPct(effects.companyRateMult - 1)} mas produccion`,
            `Almacen: ${formatPct(effects.companyStorageMult - 1)} extra`,
            `Acciones: ${formatPct(effects.actionEnergyDiscount)} menos energia`,
            `Mapa: ${formatPct(1 - effects.territoryThreatMult)} menos amenaza`,
            `Control: ${formatPct(effects.territoryControlBaseBonus + effects.territoryControlScalingBonus)} mas valor`,
            `Laboratorios: ${researchLabs} - ${labTimeReduction}% menos tiempo`,
          ].map((line) => (
            <div
              key={line}
              style={{
                padding: '9px 11px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                color: '#dbe7f5',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {line}
            </div>
          ))}
        </div>
      </div>

      {activeProject && (
        <div
          style={{
            ...cardStyle,
            display: 'grid',
            gap: 10,
            borderColor: 'rgba(250,204,21,0.24)',
            background:
              'linear-gradient(180deg, rgba(36,24,8,0.94), rgba(17,12,6,0.96))',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div style={{ fontSize: 12, color: '#fcd34d', letterSpacing: 0.7 }}>
                INVESTIGACION EN CURSO
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff7ed' }}>
                {activeProject.title}
              </div>
            </div>

            <div
              style={{
                padding: '8px 12px',
                borderRadius: 999,
                background: 'rgba(250,204,21,0.14)',
                border: '1px solid rgba(250,204,21,0.22)',
                color: '#fde68a',
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              Nivel {activeProject.level} - {remainingMin} min restantes
            </div>
          </div>

          <div
            style={{
              height: 10,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.max(
                  4,
                  Math.min(
                    100,
                    ((Date.now() - Number(activeProject.startedAt ?? 0)) /
                      Math.max(1, Number(activeProject.endsAt ?? 0) - Number(activeProject.startedAt ?? 0))) *
                      100
                  )
                )}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #f59e0b, #fde68a)',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 8,
            }}
          >
            <div
              style={{
                borderRadius: 12,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ fontSize: 11, color: '#fcd34d' }}>Laboratorios activos</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff7ed' }}>{researchLabs}</div>
            </div>

            <div
              style={{
                borderRadius: 12,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ fontSize: 11, color: '#fcd34d' }}>Reduccion aplicada</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff7ed' }}>
                -{labTimeReduction}%
              </div>
            </div>

            <div
              style={{
                borderRadius: 12,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <div style={{ fontSize: 11, color: '#fcd34d' }}>Duracion del proyecto</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff7ed' }}>
                {activeProjectTotalMin} min
              </div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: '#fde68a' }}>
            {researchLabs > 0
              ? `Este proyecto se beneficia de tus laboratorios orbitales: ${researchLabs} activos y ${labTimeReduction}% menos tiempo.`
              : 'Mientras esta investigacion avanza no puedes iniciar otra. Construir laboratorios orbitales reduce el tiempo de los siguientes proyectos.'}
          </div>

          <div style={{ fontSize: 12, color: '#fdba74' }}>
            Cuanto mayor sea el nivel, mas creditos, mas recursos y mas tiempo exigira.
          </div>

          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={handleResearchAdBoost}
              disabled={Boolean(activeProject.adBoostUsed)}
              style={{
                minHeight: 38,
                padding: '0 14px',
                borderRadius: 12,
                border: '1px solid rgba(250,204,21,0.22)',
                background: activeProject.adBoostUsed
                  ? 'rgba(255,255,255,0.05)'
                  : 'linear-gradient(135deg, rgba(250,204,21,0.92), rgba(245,158,11,0.92))',
                color: activeProject.adBoostUsed ? '#94a3b8' : '#221306',
                fontSize: 12,
                fontWeight: 800,
                opacity: activeProject.adBoostUsed ? 0.72 : 1,
              }}
            >
              {activeProject.adBoostUsed
                ? 'Impulso ya usado'
                : 'Ver anuncio: recortar tiempo'}
            </button>

            <div
              style={{
                alignSelf: 'center',
                fontSize: 12,
                color: '#fdba74',
              }}
            >
              Un solo impulso por investigacion.
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 12,
        }}
      >
        {RESEARCH_UPGRADES.map((upgrade) => {
          const cost = getResearchUpgradeCost(research, upgrade.key);
          const level = Number(cost?.level ?? 0);
          const isMaxed = Boolean(cost?.isMaxed);
          const isBusy = Boolean(activeProject);
          const nextTargetLabel = upgrade.targetTab === 'ads' ? 'Abrir Ads' : 'Abrir modulo';
          const impact = getUpgradeImpact(upgrade, effects);

          return (
            <article
              key={upgrade.key}
              style={{
                ...cardStyle,
                display: 'grid',
                gap: 10,
                borderColor: `${upgrade.accent}33`,
                minHeight: 250,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ display: 'grid', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        display: 'grid',
                        placeItems: 'center',
                        background: `${upgrade.accent}22`,
                        border: `1px solid ${upgrade.accent}40`,
                        color: '#f8fafc',
                        fontWeight: 800,
                      }}
                    >
                      {upgrade.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#f8fafc' }}>
                        {upgrade.title}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        Nivel {level}/{upgrade.maxLevel}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.45 }}>
                    {upgrade.desc}
                  </div>
                </div>

                <div
                  style={{
                    padding: '5px 8px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 800,
                    background: `${upgrade.accent}18`,
                    color: upgrade.accent,
                    border: `1px solid ${upgrade.accent}40`,
                  }}
                >
                  {isMaxed ? 'MAX' : `Nvl ${level + 1}`}
                </div>
              </div>

              <div
                style={{
                  borderRadius: 12,
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  Impacto actual
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ecfeff' }}>{impact}</div>
              </div>

              <div style={{ display: 'grid', gap: 6, alignContent: 'start' }}>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Coste de mejora</div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      padding: '5px 8px',
                      borderRadius: 999,
                      background: 'rgba(250,204,21,0.12)',
                      border: '1px solid rgba(250,204,21,0.2)',
                      color: '#fde68a',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {isMaxed ? 'Completada' : `${cost.credits} creditos`}
                  </span>
                  {!isMaxed && (
                    <span
                      style={{
                        padding: '5px 8px',
                        borderRadius: 999,
                        background: 'rgba(96,165,250,0.12)',
                        border: '1px solid rgba(96,165,250,0.22)',
                        color: '#bfdbfe',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {cost.timeMin} min
                    </span>
                  )}
                  {(cost.resources || []).map((resource) => {
                    const marketMeta = INIT_MARKET[resource.key] || {};
                    const owned = Number(inventory?.[resource.key] ?? 0);
                    const enough = owned >= Number(resource.amount ?? 0);

                    return (
                      <span
                        key={resource.key}
                        style={{
                          padding: '5px 8px',
                          borderRadius: 999,
                          background: enough ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          border: enough
                            ? '1px solid rgba(16,185,129,0.24)'
                            : '1px solid rgba(239,68,68,0.22)',
                          color: enough ? '#86efac' : '#fca5a5',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        {marketMeta.name || resource.key} {owned}/{resource.amount}
                      </span>
                    );
                  })}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 8,
                  marginTop: 'auto',
                }}
              >
                <button
                  type="button"
                  onClick={() => onUpgrade(upgrade.key)}
                  disabled={isMaxed || isBusy}
                  style={{
                    minHeight: 38,
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: isMaxed || isBusy
                      ? 'rgba(255,255,255,0.05)'
                      : `linear-gradient(135deg, ${upgrade.accent}, rgba(255,255,255,0.18))`,
                    color: isMaxed || isBusy ? '#94a3b8' : '#08111f',
                    fontSize: 12,
                    fontWeight: 800,
                    opacity: isMaxed || isBusy ? 0.7 : 1,
                  }}
                >
                  {isMaxed ? 'Completada' : isBusy ? 'En espera' : 'Iniciar investigacion'}
                </button>

                <button
                  type="button"
                  onClick={() => onOpenTab(upgrade.targetTab)}
                  style={{
                    minHeight: 38,
                    padding: '0 12px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#dbe7f5',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {nextTargetLabel}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

