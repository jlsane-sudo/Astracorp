import { Card, Bar, Button } from '../ui';
import { getPlanetById } from '../../data/planets';

const styles = {
  wrap: {
    display: 'grid',
    gap: 14,
  },
  contractHeader: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: 12,
    alignItems: 'end',
  },
  adPanel: {
    display: 'grid',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    background: 'linear-gradient(180deg, rgba(14,23,42,0.94), rgba(2,6,23,0.94))',
    border: '1px solid rgba(56,189,248,0.16)',
    minWidth: 240,
  },
  adText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 1.35,
  },
  adButton: {
    width: '100%',
  },
  contractGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
    gap: 12,
  },
  contractCard: {
    display: 'grid',
    gap: 10,
    minHeight: 278,
    gridTemplateRows: 'auto auto auto 1fr auto',
  },
  contractTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'flex-start',
    minHeight: 74,
  },
  contractTitle: {
    fontWeight: 800,
    color: '#f8fafc',
    fontSize: 15,
    lineHeight: 1.15,
  },
  contractDesc: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 1.45,
    marginTop: 4,
  },
  contractTags: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 8,
    minHeight: 24,
  },
  contractTag: {
    padding: '4px 8px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0.3,
    background: 'rgba(139,92,246,0.14)',
    border: '1px solid rgba(139,92,246,0.2)',
    color: '#c4b5fd',
  },
  territoryTag: {
    background: 'rgba(245,158,11,0.14)',
    border: '1px solid rgba(251,191,36,0.24)',
    color: '#fde68a',
  },
  timer: {
    padding: '4px 8px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: 'nowrap',
    minWidth: 70,
    textAlign: 'center',
    flexShrink: 0,
  },
  demandBox: {
    borderRadius: 12,
    padding: 10,
    background: 'rgba(255,255,255,0.035)',
    border: '1px solid rgba(255,255,255,0.06)',
    display: 'grid',
    gap: 4,
  },
  demandLine: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    fontSize: 13,
    color: '#e2e8f0',
    fontWeight: 700,
  },
  demandMeta: {
    fontSize: 12,
    color: '#94a3b8',
    minHeight: 18,
  },
  rewardLine: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    fontSize: 12,
  },
  rewardBadge: {
    padding: '4px 8px',
    borderRadius: 999,
    background: 'rgba(56,189,248,0.12)',
    border: '1px solid rgba(56,189,248,0.18)',
    color: '#7dd3fc',
    fontWeight: 700,
  },
  rowDeliverButton: {
    minWidth: 96,
    minHeight: 28,
    padding: '5px 10px',
  },
  eventBadge: {
    padding: '4px 8px',
    borderRadius: 999,
    background: 'rgba(250,204,21,0.14)',
    border: '1px solid rgba(250,204,21,0.28)',
    color: '#fde68a',
    fontWeight: 900,
  },
  priorityBadge: {
    padding: '4px 8px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0.3,
    whiteSpace: 'nowrap',
  },
  helper: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 1.45,
    minHeight: 36,
  },
  actionsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))',
    gap: 8,
    alignItems: 'stretch',
  },
  ghostButton: {
    visibility: 'hidden',
    pointerEvents: 'none',
  },
  sectionTitle: {
    fontWeight: 900,
    color: '#f8fafc',
    fontSize: 16,
    marginBottom: 2,
  },
  sectionSub: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 1.45,
  },
};

function formatTimeRemaining(expiresAt) {
  const diff = Math.max(0, Number(expiresAt ?? 0) - Date.now());
  const totalSec = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSec / 60);
  const seconds = totalSec % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function getContractState(contract, inventory) {
  const owned = Number(inventory?.[contract?.itemKey] ?? 0);
  const qty = Number(contract?.qty ?? 0);
  const missing = Math.max(0, qty - owned);
  const expired = Number(contract?.expiresAt ?? 0) <= Date.now();
  return {
    owned,
    qty,
    missing,
    expired,
    canDeliver: !expired && owned >= qty,
  };
}

function getProducedKeys(companies = []) {
  return new Set(
    (companies || [])
      .map((company) => company?.companyType || company?.type)
      .filter(Boolean)
      .map((typeKey) => {
        if (typeKey === 'dew_collector') return 'water';
        if (typeKey === 'solar_panel') return 'energy_cells';
        if (typeKey === 'surface_mine') return 'mineral';
        if (typeKey === 'water_purifier') return 'purified_water';
        if (typeKey === 'smelter') return 'metal_components';
        if (typeKey === 'electrolysis_plant') return 'oxygen_tanks';
        if (typeKey === 'industrial_forge') return 'alloy_frames';
        if (typeKey === 'habitat_factory') return 'habitat_modules';
        return null;
      })
      .filter(Boolean)
  );
}

function getTimerStyle(expired, canDeliver) {
  if (expired) {
    return {
      ...styles.timer,
      background: 'rgba(244,63,94,0.14)',
      border: '1px solid rgba(244,63,94,0.24)',
      color: '#fda4af',
    };
  }

  if (canDeliver) {
    return {
      ...styles.timer,
      background: 'rgba(34,197,94,0.14)',
      border: '1px solid rgba(34,197,94,0.24)',
      color: '#86efac',
    };
  }

  return {
    ...styles.timer,
    background: 'rgba(250,204,21,0.12)',
    border: '1px solid rgba(250,204,21,0.2)',
    color: '#fde68a',
  };
}

function getContractPriority(contract, contractPremium, expiresAt) {
  if (contract?.contractKind === 'massive') {
    return {
      label: contract.contractKindLabel || 'Masivo',
      style: {
        background: 'rgba(251,146,60,0.14)',
        border: '1px solid rgba(251,146,60,0.26)',
        color: '#fed7aa',
      },
    };
  }

  if (contract?.contractKind === 'urgent') {
    return {
      label: contract.contractKindLabel || 'Urgente',
      style: {
        background: 'rgba(248,113,113,0.14)',
        border: '1px solid rgba(248,113,113,0.24)',
        color: '#fecaca',
      },
    };
  }

  if (contract?.contractKind === 'premium') {
    return {
      label: contract.contractKindLabel || 'Premium',
      style: {
        background: 'rgba(74,222,128,0.14)',
        border: '1px solid rgba(74,222,128,0.24)',
        color: '#bbf7d0',
      },
    };
  }

  const remainingMin = Math.max(0, (Number(expiresAt ?? 0) - Date.now()) / 60000);

  if (remainingMin <= 8) {
    return {
      label: 'Urgente',
      style: {
        background: 'rgba(248,113,113,0.14)',
        border: '1px solid rgba(248,113,113,0.24)',
        color: '#fecaca',
      },
    };
  }

  if (contractPremium >= 8) {
    return {
      label: 'Premium',
      style: {
        background: 'rgba(74,222,128,0.14)',
        border: '1px solid rgba(74,222,128,0.24)',
        color: '#bbf7d0',
      },
    };
  }

  return {
    label: 'Estable',
    style: {
      background: 'rgba(96,165,250,0.14)',
      border: '1px solid rgba(96,165,250,0.24)',
      color: '#bfdbfe',
    },
  };
}

function getDemandLabel(qty) {
  const safeQty = Number(qty ?? 0);
  if (safeQty >= 500) return 'Demanda extrema';
  if (safeQty >= 180) return 'Demanda alta';
  if (safeQty >= 60) return 'Demanda media';
  return 'Demanda baja';
}

export function MissionsView({
  missions = [],
  player,
  contracts = [],
  inventory = {},
  companies = [],
  market = {},
  activeEvent = null,
  onDeliverContract,
  onDeliverAllContractsWithAd,
  onRerollContract,
  onOpenTab,
  onClaimMissionReward,
}) {
  const playerLevel = Number(player?.level ?? 1);
  const visibleMissions = missions.filter(
    (mission) => Number(mission?.unlockLevel ?? 1) <= playerLevel
  );
  const pendingMissions = visibleMissions.filter((m) => !m?.done);
  const producedKeys = getProducedKeys(companies);
  const readyContracts = contracts.filter((contract) => getContractState(contract, inventory).canDeliver);
  const sortedContracts = [...contracts].sort((a, b) => {
    const aState = getContractState(a, inventory);
    const bState = getContractState(b, inventory);
    if (Boolean(a.eventBoost) !== Boolean(b.eventBoost)) return a.eventBoost ? -1 : 1;
    if (aState.canDeliver !== bState.canDeliver) return aState.canDeliver ? -1 : 1;
    if (Number(a.expiresAt ?? 0) !== Number(b.expiresAt ?? 0)) return Number(a.expiresAt ?? 0) - Number(b.expiresAt ?? 0);
    if (a?.contractKind === 'massive' && b?.contractKind !== 'massive') return 1;
    if (b?.contractKind === 'massive' && a?.contractKind !== 'massive') return -1;
    return Number(b?.reward?.credits ?? 0) - Number(a?.reward?.credits ?? 0);
  });
  const readyContractReward = readyContracts.reduce(
    (sum, contract) => sum + Number(contract?.reward?.credits ?? contract?.reward?.euros ?? 0),
    0
  );
  const boostedContracts = contracts.filter((contract) => contract?.eventBoost);
  const boostedReward = boostedContracts.reduce((sum, contract) => sum + Number(contract.eventBonusCredits ?? 0), 0);

  const handleDeliverAllWithAd = () => {
    if (!readyContracts.length) return;
    onDeliverAllContractsWithAd?.();
  };

  return (
    <div style={styles.wrap}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: 10,
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        background: readyContracts.length ? 'rgba(20,83,45,0.14)' : 'rgba(15,23,42,0.58)',
        border: readyContracts.length ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(148,163,184,0.12)',
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#f8fafc', fontSize: 14, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {readyContracts.length
              ? `${readyContracts.length} contrato(s) listos · ${readyContractReward.toFixed(2)} cr`
              : boostedContracts.length
                ? `${boostedContracts.length} contrato(s) con evento activo`
                : 'Contratos activos'}
          </div>
          <div style={{ color: '#94a3b8', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {readyContracts.length ? 'Entrega patrocinada no consume energia.' : 'Prioriza los pedidos listos o con menos tiempo.'}
          </div>
        </div>
        <Button
          color="#06b6d4"
          onClick={handleDeliverAllWithAd}
          disabled={!readyContracts.length}
          disabledReason="No hay contratos listos para entregar."
          style={{ minWidth: 150 }}
          title="El patrocinador cubre la logistica: no gasta energia."
        >
          Entregar listos
        </Button>
      </div>

      {activeEvent && boostedContracts.length > 0 && (
        <div style={{
          padding: 9,
          borderRadius: 8,
          border: '1px solid rgba(250,204,21,0.24)',
          background: 'linear-gradient(90deg, rgba(120,53,15,0.18), rgba(15,23,42,0.72))',
          color: '#fde68a',
          fontSize: 11,
          fontWeight: 800,
        }}>
          {activeEvent.title}: {boostedContracts.length} pedido(s) pagan mejor · +{boostedReward.toFixed(2)} cr potenciales
        </div>
      )}

      <div style={{ display: 'grid', gap: 7 }}>
        {sortedContracts.map((contract) => {
          const rewardCredits = Number(contract?.reward?.credits ?? contract?.reward?.euros ?? 0);
          const rewardXp = Number(contract?.reward?.xp ?? 0);
          const state = getContractState(contract, inventory);
          const marketPrice = Number(market?.[contract.itemKey]?.price ?? 0) * 0.88;
          const sellEquivalent = marketPrice * Number(contract?.qty ?? 0);
          const contractPremium = rewardCredits - sellEquivalent;
          const alreadyProduceIt = producedKeys.has(contract.itemKey);
          const priority = getContractPriority(contract, contractPremium, contract.expiresAt);
          const originPlanet = contract?.originPlanetId
            ? getPlanetById(contract.originPlanetId)
            : null;
          const handleRowDeliver = (event) => {
            event.preventDefault();
            event.stopPropagation();
            onDeliverContract?.(contract.id);
          };

          return (
            <details
              key={contract.id}
              style={{
                borderRadius: 8,
                background: state.canDeliver ? 'rgba(20,83,45,0.14)' : contract?.eventBoost ? 'rgba(120,53,15,0.14)' : 'rgba(15,23,42,0.55)',
                border: state.canDeliver ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(148,163,184,0.12)',
                overflow: 'hidden',
              }}
            >
              <summary style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(150px, 1.3fr) minmax(120px, 0.8fr) minmax(95px, 0.5fr) minmax(210px, auto)',
                gap: 8,
                alignItems: 'center',
                padding: '8px 10px',
                cursor: 'pointer',
                listStyle: 'none',
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {contract.icon} {contract.title}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {contract.itemName} x{state.qty}{contract?.territoryExclusive ? ` · ${contract.territoryName || 'territorial'}` : ''}
                  </div>
                </div>
                <div style={{ color: state.canDeliver ? '#86efac' : state.expired ? '#fca5a5' : '#cbd5e1', fontSize: 11, fontWeight: 900 }}>
                  {state.canDeliver ? 'Listo' : state.expired ? 'Expirado' : `${state.owned}/${state.qty}`}
                </div>
                <div style={getTimerStyle(state.expired, state.canDeliver)}>
                  {state.expired ? 'Expirado' : formatTimeRemaining(contract.expiresAt)}
                </div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <span style={{ ...styles.priorityBadge, ...priority.style }}>{priority.label}</span>
                  {contract?.eventBoost ? <span style={styles.eventBadge}>Evento</span> : null}
                  {state.canDeliver ? (
                    <Button
                      color="#22c55e"
                      onClick={handleRowDeliver}
                      title="Entregar este contrato"
                      style={styles.rowDeliverButton}
                    >
                      Entregar
                    </Button>
                  ) : (
                    <span style={styles.rewardBadge}>+{rewardCredits.toFixed(2)} cr</span>
                  )}
                </div>
              </summary>

              <div style={{ display: 'grid', gap: 8, padding: '0 10px 10px' }}>
                <div style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.35 }}>
                  {contract.desc}
                  {contract?.exclusive && originPlanet ? ` · Exclusivo de ${originPlanet.name}` : ''}
                  {alreadyProduceIt ? ' · Ya lo produces.' : ''}
                </div>
                <div style={styles.rewardLine}>
                  <span style={styles.rewardBadge}>+{rewardCredits.toFixed(2)} creditos</span>
                  {contract?.eventBoost ? <span style={styles.eventBadge}>+{Number(contract.eventBonusCredits ?? 0).toFixed(2)} por evento</span> : null}
                  <span style={styles.rewardBadge}>+{rewardXp} XP</span>
                  <span style={styles.rewardBadge}>{contractPremium >= 0 ? '+' : ''}{contractPremium.toFixed(2)} vs vender</span>
                </div>
                <div style={styles.actionsRow}>
                <Button
                  onClick={() => onDeliverContract?.(contract.id)}
                  disabled={!state.canDeliver}
                  disabledReason={
                    state.expired
                      ? 'Este pedido ya ha expirado.'
                      : `Faltan ${state.missing} ${contract.itemName} para poder entregarlo.`
                  }
                  title={
                    state.canDeliver
                      ? 'Entregar este pedido y cobrar'
                      : state.expired
                        ? 'Este pedido ya ha expirado'
                        : `Faltan ${state.missing} ${contract.itemName}`
                  }
                  style={{ width: '100%' }}
                >
                  Entregar
                </Button>
                <Button
                  color="#475569"
                  onClick={() => onRerollContract?.(contract.id)}
                  disabled={state.canDeliver}
                  disabledReason="Entregalo antes de renovarlo."
                  title={state.canDeliver ? 'Entregalo antes de renovarlo' : 'Cambiar este pedido por otro'}
                  style={{ width: '100%' }}
                >
                  Renovar
                </Button>
                <Button
                  color="#334155"
                  onClick={() => onOpenTab?.(contract.targetTab || 'market')}
                  disabled={state.canDeliver || state.expired}
                  disabledReason={state.canDeliver ? 'El pedido ya esta listo para entregar.' : 'El pedido ya expiro.'}
                  title={
                    state.canDeliver
                      ? 'Ya esta listo para entregar'
                      : state.expired
                        ? 'El pedido expiro'
                        : `Ir a ${contract.targetTab === 'business' ? 'Empresas' : 'Mercado'} para conseguir el recurso`
                  }
                  style={{
                    width: '100%',
                    ...(state.canDeliver || state.expired ? styles.ghostButton : null),
                  }}
                >
                  Ir a producir
                </Button>
              </div>
              </div>
            </details>
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', marginTop: 4 }}>
        <div className="pw-section-kicker">MISIONES</div>
        <div style={{ color: '#94a3b8', fontSize: 11 }}>{pendingMissions.length} activa(s)</div>
      </div>

      {pendingMissions.map((m) => {
        const rewardCredits = Number(m?.reward?.credits ?? m?.reward?.euros ?? 0);
        const rewardXp = Number(m?.reward?.xp ?? 0);
        const rewardResources = Array.isArray(m?.reward?.resources) ? m.reward.resources : [];
        const rewardResourceText = rewardResources.length
          ? ` + ${rewardResources.map((resource) => `${resource.amount} ${resource.key}`).join(' + ')}`
          : '';
        const progress = Number(m?.progress ?? 0);
        const goal = Number(m?.goal ?? 1);
        const readyToClaim = Boolean(m?.readyToClaim || progress >= goal);

        return (
          <div
            key={m.id}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(160px, 1fr) minmax(120px, 0.7fr) minmax(140px, auto)',
              gap: 8,
              alignItems: 'center',
              padding: '8px 10px',
              borderRadius: 8,
              background: readyToClaim ? 'rgba(20,83,45,0.13)' : 'rgba(15,23,42,0.5)',
              border: readyToClaim ? '1px solid rgba(74,222,128,0.18)' : '1px solid rgba(148,163,184,0.1)',
              opacity: m.done ? 0.75 : 1,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ color: '#f8fafc', fontSize: 12, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.icon} {m.title}
              </div>
              <div style={{ color: '#94a3b8', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                +{rewardCredits.toFixed(2)} cr · +{rewardXp} XP{rewardResourceText}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 4 }}>
              <div style={{ color: readyToClaim ? '#86efac' : '#94a3b8', fontSize: 11, fontWeight: 900 }}>
                {readyToClaim ? 'Lista' : `${progress}/${goal}`}
              </div>
              <Bar val={progress} max={goal} h={5} />
            </div>
            <div>
              <Button
                onClick={() => onClaimMissionReward?.(m.id)}
                disabled={!readyToClaim}
                disabledReason={`Completa la mision: progreso ${progress}/${goal}.`}
                title={readyToClaim ? 'Cobrar recompensa de mision' : `Completa la mision: progreso ${progress}/${goal}`}
                style={{ width: '100%' }}
              >
                {readyToClaim ? 'Reclamar recompensa' : 'En progreso'}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default MissionsView;
