import React, { useMemo } from 'react';
import { COMPANY_TYPES, getCompanyBuildCost } from '../../data/companyTypes';
import { getCompanyGroupMultiplier } from '../../utils/companyMath';

const styles = {
  wrapper: {
    display: 'grid',
    gap: 14,
  },
  overviewCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#f8fafc',
    marginBottom: 6,
  },
  overviewSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 14,
    lineHeight: 1.5,
  },
  tierGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 12,
  },
  tierColumn: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 12,
  },
  tierHeader: {
    fontSize: 14,
    fontWeight: 800,
    color: '#e5e7eb',
    marginBottom: 10,
  },
  tierList: {
    display: 'grid',
    gap: 10,
  },
  tierItem: {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 10,
  },
  tierItemTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: '#f8fafc',
    marginBottom: 4,
  },
  tierItemText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 1.45,
  },
  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  titleBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 800,
    color: '#f8fafc',
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  badge: {
    padding: '6px 10px',
    borderRadius: 999,
    background: 'rgba(59,130,246,0.15)',
    border: '1px solid rgba(59,130,246,0.25)',
    color: '#bfdbfe',
    fontSize: 12,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  description: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 1.5,
    marginBottom: 14,
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 10,
    marginBottom: 14,
  },
  statBox: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 700,
    color: '#f8fafc',
  },
  chainWrap: {
    display: 'grid',
    gap: 10,
    marginBottom: 14,
  },
  chainBox: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
  },
  chainTitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  chainText: {
    fontSize: 14,
    color: '#e5e7eb',
    lineHeight: 1.5,
  },
  inputsList: {
    display: 'grid',
    gap: 8,
  },
  inputRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: '8px 10px',
    fontSize: 13,
    color: '#cbd5e1',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  footerInfo: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  footerWarn: {
    fontSize: 13,
    color: '#fca5a5',
  },
  buyButton: {
    border: 'none',
    borderRadius: 12,
    padding: '10px 14px',
    fontWeight: 700,
    fontSize: 14,
    cursor: 'pointer',
    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
    color: '#fff',
  },
  buyButtonDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  empty: {
    padding: 18,
    borderRadius: 16,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#cbd5e1',
  },
};

const safeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const round2 = (n) => parseFloat(Number(n || 0).toFixed(2));

const formatNumber = (n, max = 2) =>
  Number(n || 0).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: max,
  });

const getOwnedCountByType = (companies = []) => {
  return companies.reduce((acc, company) => {
    const typeKey = company?.companyType || company?.type;
    if (!typeKey) return acc;
    acc[typeKey] = (acc[typeKey] || 0) + 1;
    return acc;
  }, {});
};

const formatInputsSummary = (inputs = []) => {
  if (!inputs.length) return 'No necesita insumos.';
  return inputs.map((input) => `${input.amount} ${input.label || input.key}`).join(' + ');
};

const getChainText = (meta) => {
  const output = meta?.resourceLabel || meta?.resourceKey || 'Recurso';
  const inputs = meta?.inputs || [];

  if (!inputs.length) {
    return `Produce ${output} directamente.`;
  }

  return `${formatInputsSummary(inputs)} -> ${output}`;
};

const getUnlockLevel = (meta) => safeNumber(meta?.unlockLevel ?? meta?.tier ?? 1, 1);

const getTierLabel = (tier) => {
  if (tier === 1) return 'Tier 1 - Base';
  if (tier === 2) return 'Tier 2 - Procesado';
  if (tier === 3) return 'Tier 3 - Avanzado';
  return `Tier ${tier}`;
};

const EMPTY_ARRAY = [];
const EMPTY_OBJECT = {};
const EARLY_UNIQUE_COMPANY_LEVEL = 10;
const EARLY_UNIQUE_COMPANY_PLANET = 'nexus-prime';
const EARLY_COMPANY_TYPES = new Set(['dew_collector', 'solar_panel', 'surface_mine']);

function isEarlyUniqueCompanyLimit(save, ownedCount = 0) {
  const planet = save?.player?.currentPlanet || save?.player?.planet || EARLY_UNIQUE_COMPANY_PLANET;
  return planet === EARLY_UNIQUE_COMPANY_PLANET &&
    safeNumber(save?.player?.level ?? 1, 1) <= EARLY_UNIQUE_COMPANY_LEVEL &&
    safeNumber(ownedCount, 0) > 0;
}

export default function CompaniesShopView({ save, actions }) {
  const companies = save?.companies || EMPTY_ARRAY;
  const player = save?.player || {};
  const inventory = save?.inventory || EMPTY_OBJECT;

  const ownedCountByType = useMemo(() => getOwnedCountByType(companies), [companies]);

  const tierOverview = useMemo(() => {
    const byTier = { 1: [], 2: [], 3: [] };

    Object.values(COMPANY_TYPES || {}).forEach((meta) => {
      if (safeNumber(player.level ?? 1, 1) <= EARLY_UNIQUE_COMPANY_LEVEL && !EARLY_COMPANY_TYPES.has(meta.key)) return;
      if (getUnlockLevel(meta) > safeNumber(player.level ?? 1, 1)) return;

      const tier = Number(meta?.tier ?? 1);
      if (!byTier[tier]) byTier[tier] = [];
      byTier[tier].push(meta);
    });

    Object.keys(byTier).forEach((tier) => {
      byTier[tier].sort((a, b) => safeNumber(a.buildCost) - safeNumber(b.buildCost));
    });

    return byTier;
  }, [player.level]);

  const shopItems = useMemo(() => {
    return Object.values(COMPANY_TYPES || {})
      .filter(Boolean)
      .filter((meta) => safeNumber(player.level ?? 1, 1) > EARLY_UNIQUE_COMPANY_LEVEL || EARLY_COMPANY_TYPES.has(meta.key))
      .filter((meta) => getUnlockLevel(meta) <= safeNumber(player.level ?? 1, 1))
      .map((meta) => {
        const ownedCount = ownedCountByType[meta.key] || 0;
        const currentMultiplier = ownedCount > 0 ? getCompanyGroupMultiplier(ownedCount) : 0;
        const nextMultiplier = getCompanyGroupMultiplier(ownedCount + 1);

        const baseRatePerHour = safeNumber(meta.ratePerHour ?? 0);
        const currentEffectivePerHour =
          ownedCount > 0 ? round2(baseRatePerHour * currentMultiplier) : 0;
        const nextEffectivePerHour = round2(baseRatePerHour * nextMultiplier);

        const baseBuildCost = safeNumber(meta.buildCost ?? 0);
        const buildCost = getCompanyBuildCost(meta.key, ownedCount);
        const requiredLevel = getUnlockLevel(meta);
        const storage = safeNumber(meta.maxStorage ?? 0);

        const canAfford = safeNumber(player.credits ?? 0) >= buildCost;
        const hasLevel = safeNumber(player.level ?? 1) >= requiredLevel;
        const uniqueBlocked = isEarlyUniqueCompanyLimit(save, ownedCount);
        const canBuild = canAfford && hasLevel && !uniqueBlocked;

        const inputs = (meta.inputs || []).map((input) => ({
          ...input,
          available: safeNumber(inventory?.[input.key] ?? 0),
        }));

        return {
          ...meta,
          ownedCount,
          currentMultiplier,
          nextMultiplier,
          currentEffectivePerHour,
          nextEffectivePerHour,
          baseBuildCost,
          buildCost,
          requiredLevel,
          storage,
          canAfford,
          hasLevel,
          uniqueBlocked,
          canBuild,
          inputs,
          chainText: getChainText(meta),
        };
      })
      .sort((a, b) => {
        if (a.requiredLevel !== b.requiredLevel) return a.requiredLevel - b.requiredLevel;
        return a.buildCost - b.buildCost;
      });
  }, [ownedCountByType, player.credits, player.level, inventory, save]);

  if (!shopItems.length) {
    return <div style={styles.empty}>No hay empresas disponibles.</div>;
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.overviewCard}>
        <div style={styles.overviewTitle}>Cadena industrial</div>
        <div style={styles.overviewSubtitle}>
          La tienda ya no muestra toda la escalada de golpe. Solo ves las fases industriales que
          realmente te toca explorar en tu nivel actual.
        </div>

        <div style={styles.tierGrid}>
          {[1, 2, 3].map((tier) => (
            <div key={tier} style={styles.tierColumn}>
              <div style={styles.tierHeader}>{getTierLabel(tier)}</div>

              <div style={styles.tierList}>
                {(tierOverview[tier] || []).length ? (
                  (tierOverview[tier] || []).map((item) => (
                    <div key={item.key} style={styles.tierItem}>
                      <div style={styles.tierItemTitle}>
                        {item.icon ? `${item.icon} ` : ''}
                        {item.name}
                      </div>
                      <div style={styles.tierItemText}>
                        <strong>Produce:</strong> {item.resourceLabel || item.resourceKey}
                      </div>
                      <div style={styles.tierItemText}>
                        <strong>Cadena:</strong> {getChainText(item)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.tierItem}>
                    <div style={styles.tierItemText}>
                      Esta fase industrial aun no esta disponible para tu nivel actual.
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {shopItems.map((item) => {
        let statusText = `Siguiente multiplicador: x${formatNumber(item.nextMultiplier, 1)}`;
        let statusStyle = styles.footerInfo;

        if (!item.hasLevel) {
          statusText = `Necesitas nivel ${item.requiredLevel}`;
          statusStyle = styles.footerWarn;
        } else if (item.uniqueBlocked) {
          statusText = `Licencia unica en Nexus Prime hasta nivel ${EARLY_UNIQUE_COMPANY_LEVEL}`;
          statusStyle = styles.footerWarn;
        } else if (!item.canAfford) {
          statusText = `Te faltan ${formatNumber(item.buildCost - safeNumber(player.credits ?? 0))} creditos`;
          statusStyle = styles.footerWarn;
        } else if (item.ownedCount > 0) {
          statusText = `Ahora: x${formatNumber(item.currentMultiplier, 1)} -> siguiente: x${formatNumber(item.nextMultiplier, 1)}`;
        }

        return (
          <div key={item.key} style={styles.card}>
            <div style={styles.headerRow}>
              <div style={styles.titleBlock}>
                <div style={styles.title}>
                  {item.icon ? `${item.icon} ` : ''}
                  {item.name || item.key}
                </div>
                <div style={styles.subtitle}>
                  Produce: {item.resourceLabel || item.resourceKey || 'Recurso'}
                </div>
              </div>

              <div style={styles.badge}>Tienes: {item.ownedCount}</div>
            </div>

            <div style={styles.description}>
              {item.description || 'Infraestructura industrial para el crecimiento de tu colonia.'}
            </div>

            <div style={styles.statGrid}>
              <div style={styles.statBox}>
                <div style={styles.statLabel}>Coste</div>
                <div style={styles.statValue}>{formatNumber(item.buildCost)} creditos</div>
              </div>

              <div style={styles.statBox}>
                <div style={styles.statLabel}>Coste base</div>
                <div style={styles.statValue}>{formatNumber(item.baseBuildCost)} creditos</div>
              </div>

              <div style={styles.statBox}>
                <div style={styles.statLabel}>Nivel requerido</div>
                <div style={styles.statValue}>{item.requiredLevel}</div>
              </div>

              <div style={styles.statBox}>
                <div style={styles.statLabel}>Produccion base / hora</div>
                <div style={styles.statValue}>{formatNumber(item.ratePerHour ?? 0)}</div>
              </div>

              <div style={styles.statBox}>
                <div style={styles.statLabel}>Almacenamiento</div>
                <div style={styles.statValue}>{formatNumber(item.storage)}</div>
              </div>

              <div style={styles.statBox}>
                <div style={styles.statLabel}>Produccion actual efectiva / hora</div>
                <div style={styles.statValue}>{formatNumber(item.currentEffectivePerHour)}</div>
              </div>

              <div style={styles.statBox}>
                <div style={styles.statLabel}>Produccion si compras 1 mas</div>
                <div style={styles.statValue}>{formatNumber(item.nextEffectivePerHour)}</div>
              </div>
            </div>

            <div style={styles.chainWrap}>
              <div style={styles.chainBox}>
                <div style={styles.chainTitle}>Cadena de produccion</div>
                <div style={styles.chainText}>{item.chainText}</div>
              </div>

              {!!item.inputs.length && (
                <div style={styles.chainBox}>
                  <div style={styles.chainTitle}>Insumos necesarios</div>
                  <div style={styles.inputsList}>
                    {item.inputs.map((input) => (
                      <div key={input.key} style={styles.inputRow}>
                        <span>
                          {input.label || input.key}: {formatNumber(input.amount)}
                        </span>
                        <span>Disponibles: {formatNumber(input.available)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={styles.footer}>
              <div style={statusStyle}>{statusText}</div>

              <button
                type="button"
                onClick={() => actions?.buildCompany?.(item.key)}
                disabled={!item.canBuild}
                style={{
                  ...styles.buyButton,
                  ...(!item.canBuild ? styles.buyButtonDisabled : null),
                }}
              >
                {item.uniqueBlocked ? 'Unica' : 'Comprar'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
