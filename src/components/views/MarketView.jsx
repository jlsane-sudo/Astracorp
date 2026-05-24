import React, { useMemo, useState } from 'react';
import { COMPANY_TYPES } from '../../data/companyTypes';
import { resourceAssets } from '../../assets/generated/assets';
import {
  MARKET_MAX_TRADE_UNITS,
  getMarketBuyQuote,
  getMarketSellQuote,
  getUnlockedMarketKeysForLevel,
} from '../../hooks/engine/gamePureLogic';

const styles = {
  wrapper: {
    display: 'grid',
    gap: 16,
  },

  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 12,
  },

  heroCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 14,
    display: 'grid',
    gap: 6,
    boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
  },

  heroLabel: {
    fontSize: 11,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },

  heroValue: {
    fontSize: 22,
    fontWeight: 900,
    color: '#f8fafc',
    lineHeight: 1.1,
  },

  heroSub: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  recommendation: {
    padding: 12,
    borderRadius: 14,
    background: 'linear-gradient(180deg, rgba(8,15,30,0.96), rgba(3,8,20,0.96))',
    border: '1px solid rgba(56,189,248,0.14)',
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 1.5,
  },
  eventPulse: {
    padding: 12,
    borderRadius: 14,
    border: '1px solid rgba(250,204,21,0.2)',
    background: 'linear-gradient(180deg, rgba(36,24,6,0.94), rgba(20,12,2,0.96))',
    color: '#fef3c7',
    fontSize: 13,
    lineHeight: 1.5,
  },
  spotlight: {
    display: 'grid',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    background: 'linear-gradient(135deg, rgba(10,18,34,0.98), rgba(20,28,48,0.98))',
    border: '1px solid rgba(59,130,246,0.16)',
    boxShadow: '0 12px 28px rgba(0,0,0,0.2)',
  },
  spotlightTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  spotlightTitle: {
    fontSize: 14,
    fontWeight: 900,
    color: '#f8fafc',
  },
  spotlightText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 1.5,
  },
  spotlightBadge: {
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0.35,
    whiteSpace: 'nowrap',
  },
  spotlightGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: 8,
  },
  spotlightBox: {
    padding: 10,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  spotlightLabel: {
    fontSize: 9,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  spotlightValue: {
    fontSize: 12,
    fontWeight: 800,
    color: '#f8fafc',
    lineHeight: 1.35,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: 800,
    color: '#7dd3fc',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: 14,
    alignItems: 'stretch',
  },

  card: {
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(15,23,42,0.92))',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 18,
    padding: 16,
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
    display: 'grid',
    gap: 14,
    minHeight: 620,
    alignContent: 'start',
  },

  cardHot: {
    boxShadow: '0 0 0 1px rgba(56,189,248,0.16), 0 0 24px rgba(56,189,248,0.10)',
    border: '1px solid rgba(56,189,248,0.18)',
  },

  cardCold: {
    boxShadow: '0 0 0 1px rgba(244,63,94,0.12), 0 0 18px rgba(244,63,94,0.08)',
    border: '1px solid rgba(244,63,94,0.14)',
  },

  topGlow: {
    position: 'absolute',
    top: -35,
    right: -12,
    width: 115,
    height: 115,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(56,189,248,0.14), rgba(56,189,248,0))',
    pointerEvents: 'none',
  },

  floatWrap: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  },

  floatTextBuy: {
    position: 'absolute',
    right: 16,
    bottom: 14,
    fontSize: 15,
    fontWeight: 800,
    color: '#22c55e',
    textShadow: '0 0 12px rgba(34,197,94,0.35)',
    animation: 'company-float-up 900ms ease-out forwards',
  },

  floatTextSell: {
    position: 'absolute',
    right: 16,
    bottom: 14,
    fontSize: 15,
    fontWeight: 800,
    color: '#38bdf8',
    textShadow: '0 0 12px rgba(56,189,248,0.35)',
    animation: 'company-float-up 900ms ease-out forwards',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },

  titleBlock: {
    display: 'grid',
    gap: 6,
    minWidth: 0,
  },

  title: {
    fontSize: 18,
    fontWeight: 900,
    color: '#fff',
    lineHeight: 1.1,
    overflowWrap: 'anywhere',
  },
  compactIdentity: {
    display: 'grid',
    gridTemplateColumns: '42px minmax(0, 1fr)',
    gap: 9,
    alignItems: 'center',
    minWidth: 0,
  },
  resourceArt: {
    width: 42,
    height: 42,
    objectFit: 'cover',
    borderRadius: 11,
    border: '1px solid rgba(103,232,249,0.2)',
    background: 'rgba(2,6,23,0.58)',
    boxShadow: '0 8px 18px rgba(2,6,23,0.18)',
  },

  subtitleRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  pill: {
    padding: '5px 9px',
    borderRadius: 999,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  eventTag: {
    padding: '5px 9px',
    borderRadius: 999,
    background: 'rgba(250,204,21,0.12)',
    border: '1px solid rgba(250,204,21,0.2)',
    color: '#fde68a',
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },
  eventOpportunity: {
    padding: 12,
    borderRadius: 14,
    border: '1px solid rgba(250,204,21,0.22)',
    background: 'linear-gradient(90deg, rgba(120,53,15,0.18), rgba(15,23,42,0.76))',
    color: '#fef3c7',
    fontSize: 13,
    lineHeight: 1.45,
  },
  eventCard: {
    boxShadow: '0 0 0 1px rgba(250,204,21,0.2), 0 0 22px rgba(250,204,21,0.1)',
    border: '1px solid rgba(250,204,21,0.28)',
  },

  priceCol: {
    display: 'grid',
    gap: 8,
    justifyItems: 'end',
  },

  priceBadge: {
    padding: '7px 11px',
    borderRadius: 999,
    background: 'rgba(56,189,248,0.12)',
    border: '1px solid rgba(56,189,248,0.18)',
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },

  stateBadge: {
    padding: '6px 10px',
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },

  heroLine: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },

  heroStat: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    minHeight: 70,
  },

  heroStatLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  heroStatValue: {
    fontSize: 17,
    fontWeight: 900,
    color: '#f8fafc',
  },

  trendWrap: {
    display: 'grid',
    gap: 8,
  },

  trendTop: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    fontSize: 12,
    color: '#cbd5e1',
  },

  progressBarBg: {
    height: 12,
    borderRadius: 999,
    background: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.08)',
  },

  progressBarFill: {
    height: '100%',
    borderRadius: 999,
    transition: 'width 0.35s ease',
  },

  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 10,
  },

  statBox: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    minHeight: 72,
  },

  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  statValue: {
    fontSize: 15,
    fontWeight: 800,
    color: '#f8fafc',
  },

  helperBox: {
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 1.55,
  },
  flowTag: {
    padding: '5px 9px',
    borderRadius: 999,
    background: 'rgba(251,191,36,0.12)',
    border: '1px solid rgba(251,191,36,0.22)',
    color: '#fde68a',
    fontSize: 11,
    fontWeight: 800,
    whiteSpace: 'nowrap',
  },

  actions: {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
  alignItems: 'stretch',
},
  quantityPanel: {
    display: 'grid',
    gridTemplateColumns: '84px minmax(70px, 1fr) auto auto',
    gap: 8,
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    minHeight: 58,
  },
  quantityLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  quantityInput: {
    width: '100%',
    minWidth: 64,
    padding: '9px 10px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(2,6,23,0.72)',
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: 800,
    outline: 'none',
  },
  quantityMiniButton: {
    padding: '8px 10px',
    borderRadius: 10,
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.05)',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 900,
    whiteSpace: 'nowrap',
  },

  buyButton: {
  height: 54,
  minHeight: 54,
  padding: '8px 10px',
  borderRadius: 12,
  border: 'none',
  background: 'linear-gradient(90deg,#22c55e,#06b6d4)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 8px 18px rgba(6,182,212,0.18)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  lineHeight: 1.1,
},

sellButton: {
  height: 54,
  minHeight: 54,
  padding: '8px 10px',
  borderRadius: 12,
  border: 'none',
  background: 'rgba(56,189,248,0.14)',
  color: '#7dd3fc',
  fontWeight: 900,
  cursor: 'pointer',
  borderColor: 'transparent',
  boxShadow: '0 8px 18px rgba(56,189,248,0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  lineHeight: 1.1,
},

  buttonDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
};

const formatNumber = (n, max = 2) =>
  Number(n || 0).toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: max,
  });

const getSellableUnits = (value) => Math.max(0, Math.floor(Number(value || 0)));
const getFractionalUnits = (value) => {
  const raw = Math.max(0, Number(value || 0));
  return raw - Math.floor(raw);
};

const getDemandHeat = (item) => {
  const demand = Number(item?.demand ?? 0);
  const supply = Math.max(1, Number(item?.supply ?? 0));
  return demand / supply;
};

const getSellMargin = (item, qty = 1) => {
  return getMarketSellQuote(item, qty).unitPrice;
};

const getMaxAffordableBuy = (item, credits = 0) => {
  const availableSupply = Math.max(0, Math.floor(Number(item?.supply ?? MARKET_MAX_TRADE_UNITS)));
  let low = 0;
  let high = Math.max(0, Math.min(MARKET_MAX_TRADE_UNITS, availableSupply || MARKET_MAX_TRADE_UNITS));

  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const quote = getMarketBuyQuote(item, mid);
    if (Number(credits ?? 0) >= quote.total) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }

  return low;
};

const getMarketState = (heat) => {
  if (heat >= 1.25) {
    return {
      label: 'Mercado caliente',
      tone: 'hot',
      hint: 'La demanda supera claramente la oferta.',
    };
  }

  if (heat <= 0.85) {
    return {
      label: 'Sobreoferta',
      tone: 'cold',
      hint: 'Hay más oferta que presión compradora.',
    };
  }

  return {
    label: 'Mercado estable',
    tone: 'stable',
    hint: 'Oferta y demanda están equilibradas.',
  };
};

const getTrendBar = (heat) => {
  const pct = Math.max(0, Math.min(100, heat * 50));

  if (heat >= 1.25) {
    return {
      pct,
      bg: 'linear-gradient(90deg,#38bdf8,#22c55e)',
    };
  }

  if (heat <= 0.85) {
    return {
      pct,
      bg: 'linear-gradient(90deg,#f87171,#fb7185)',
    };
  }

  return {
    pct,
    bg: 'linear-gradient(90deg,#94a3b8,#cbd5e1)',
  };
};

const getPriceLimitState = (item) => {
  const price = Number(item?.price ?? 0);
  const base = Math.max(0.01, Number(item?.base ?? price ?? 1));
  const floor = Math.max(0.01, base * 0.35);
  const ceiling = base * 2.8;

  if (price <= floor + 0.005) return 'min';
  if (price >= ceiling - 0.005) return 'max';
  return null;
};

const getGlobalPressure = (item) => {
  const netFlow = Number(item?.netFlow ?? 0);
  const lastPriceChange = Number(item?.lastPriceChange ?? 0);
  const lastTradeQty = Number(item?.lastTradeQty ?? 0);
  const action = item?.lastTradeAction;

  if (!netFlow && !lastTradeQty) {
    return {
      label: 'Sin presion global',
      detail: 'Aun no hay operaciones recientes',
      color: '#cbd5e1',
      bg: 'rgba(148,163,184,0.12)',
      border: '1px solid rgba(148,163,184,0.16)',
    };
  }

  if (netFlow > 0) {
    return {
      label: `Compras netas +${formatNumber(netFlow, 0)}`,
      detail: `${action === 'buy' ? 'Ultima compra' : 'Ultima operacion'} x${formatNumber(lastTradeQty, 0)} · ${lastPriceChange >= 0 ? '+' : ''}${formatNumber(lastPriceChange, 2)} cr`,
      color: '#bbf7d0',
      bg: 'rgba(34,197,94,0.13)',
      border: '1px solid rgba(74,222,128,0.22)',
    };
  }

  return {
    label: `Ventas netas ${formatNumber(netFlow, 0)}`,
    detail: `${action === 'sell' ? 'Ultima venta' : 'Ultima operacion'} x${formatNumber(lastTradeQty, 0)} · ${lastPriceChange >= 0 ? '+' : ''}${formatNumber(lastPriceChange, 2)} cr`,
    color: '#fecaca',
    bg: 'rgba(248,113,113,0.13)',
    border: '1px solid rgba(248,113,113,0.22)',
  };
};

const getResourceFlowMap = (companies = []) =>
  (companies || []).reduce((acc, company) => {
    const typeKey = company?.companyType || company?.type;
    const meta = COMPANY_TYPES[typeKey];
    if (!meta?.inputs?.length) return acc;

    const effectiveRatePerHour = Number(company?.effectiveRatePerHour ?? meta.ratePerHour ?? 0);
    if (effectiveRatePerHour <= 0) return acc;

    meta.inputs.forEach((input) => {
      const current = acc[input.key] || {
        amountPerHour: 0,
        consumers: [],
      };

      current.amountPerHour += effectiveRatePerHour * Number(input.amount ?? 0);
      current.consumers.push({
        name: company?.name || meta.name,
        amountPerHour: effectiveRatePerHour * Number(input.amount ?? 0),
      });
      acc[input.key] = current;
    });

    return acc;
  }, {});

export function MarketView({ market, inventory, onBuy, onSell, player, companies = [], activeEvent = null }) {
  const [floatingEvents, setFloatingEvents] = useState([]);
  const [quantities, setQuantities] = useState({});

  const playerLevel = Number(player?.level ?? 1);
  const items = useMemo(() => {
    const entries = Object.entries(market || {});
    if (playerLevel > 10) return entries;
    const earlyKeys = new Set(getUnlockedMarketKeysForLevel(playerLevel));
    return entries.filter(([key]) => earlyKeys.has(key));
  }, [market, playerLevel]);

  const credits = Number(player?.credits ?? 0);

  const resourceFlow = useMemo(() => getResourceFlowMap(companies), [companies]);
  const activeEventKeys = new Set(activeEvent?.affectedKeys || []);
  const activeEventItems = items.filter(([key]) => activeEventKeys.has(key));

  const pushFloat = (key, type, text) => {
    const id = `${key}-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setFloatingEvents((prev) => [...prev, { id, key, type, text }]);

    setTimeout(() => {
      setFloatingEvents((prev) => prev.filter((item) => item.id !== id));
    }, 950);
  };

  const getQuantity = (key) => Math.max(1, Math.floor(Number(quantities[key] || 1)));

  const setQuantity = (key, value) => {
    const nextQty = Math.max(1, Math.floor(Number(value || 1)));
    setQuantities((prev) => ({ ...prev, [key]: nextQty }));
  };

  const handleBuy = (key, item) => {
    const qty = getQuantity(key);
    const quote = getMarketBuyQuote(item, qty);
    if (credits < quote.total) return;

    pushFloat(key, 'buy', `+${quote.amount} ${item?.name || key}`);
    onBuy?.(key, quote.amount);
  };

  const handleSell = (key, item) => {
    const owned = getSellableUnits(Number(inventory?.[key] || 0));
    const qty = Math.min(owned, getQuantity(key));
    if (qty <= 0) return;

    const sellPrice = getSellMargin(item);
    pushFloat(key, 'sell', `+€${formatNumber(sellPrice, 2)}`);
    onSell?.(key, qty);
  };

  const compactRows = items.map(([key, item]) => {
    const rawInventoryOwned = Math.max(0, Number(inventory?.[key] ?? 0));
    const inventoryOwned = getSellableUnits(rawInventoryOwned);
    const owned = inventoryOwned;
    const fractionalOwned = getFractionalUnits(rawInventoryOwned);
    const marketSupply = Math.max(0, Math.floor(Number(item?.supply ?? 0)));
    const price = Number(item?.price ?? 0);
    const selectedQty = getQuantity(key);
    const buyQuote = getMarketBuyQuote(item, selectedQty);
    const sellQuote = getMarketSellQuote(item, Math.max(1, Math.min(owned || 1, selectedQty)));
    const buyDisplayPrice = Number(item?.price ?? 0) * 1.08;
    const sellPrice = Number(item?.price ?? 0) * 0.78;
    const maxBuy = getMaxAffordableBuy(item, credits);
    const canBuy = credits >= buyQuote.total;
    const canSell = owned > 0;
    const heat = getDemandHeat(item);
    const state = getMarketState(heat);
    const trend = getTrendBar(heat);
    const flow = resourceFlow[key] || null;
    const eventAffected = activeEventKeys.has(key);
    const cardEvents = floatingEvents.filter((ev) => ev.key === key);
    const globalPressure = getGlobalPressure(item);
    const priceLimitState = getPriceLimitState(item);

    return { key, item, owned, inventoryOwned, marketSupply, fractionalOwned, price, selectedQty, buyQuote, sellQuote, buyDisplayPrice, sellPrice, maxBuy, canBuy, canSell, heat, state, trend, flow, eventAffected, cardEvents, globalPressure, priceLimitState };
  });

  return (
    <div style={styles.wrapper}>
      {activeEvent && activeEventItems.length > 0 && (
        <div style={{ ...styles.eventOpportunity, padding: 10, borderRadius: 10 }}>
          <strong>{activeEvent.title}:</strong> {activeEventItems.map(([, item]) => item?.name).join(', ')} con demanda alterada.
        </div>
      )}

      <div style={{ display: 'grid', gap: 8 }}>
        {compactRows.map(({ key, item, owned, marketSupply, fractionalOwned, selectedQty, buyQuote, sellQuote, buyDisplayPrice, sellPrice, maxBuy, canBuy, canSell, heat, state, trend, flow, eventAffected, cardEvents, globalPressure, priceLimitState }) => (
          <div key={key} style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'minmax(150px, 1fr) minmax(150px, 0.75fr) minmax(120px, 0.8fr) minmax(330px, 1.2fr)', gap: 10, alignItems: 'center', minHeight: 84, padding: 10, borderRadius: 10, background: eventAffected ? 'rgba(120,53,15,0.22)' : 'rgba(15,23,42,0.76)', border: eventAffected ? '1px solid rgba(250,204,21,0.26)' : '1px solid rgba(148,163,184,0.12)' }}>
            <div style={{ position: 'absolute', right: 12, top: -8, display: 'grid', gap: 4, pointerEvents: 'none' }}>
              {cardEvents.map((ev) => (
                <div key={ev.id} style={ev.type === 'buy' ? styles.floatTextBuy : styles.floatTextSell}>{ev.text}</div>
              ))}
            </div>

            <div style={styles.compactIdentity}>
              {resourceAssets[key] ? (
                <img src={resourceAssets[key]} alt="" aria-hidden="true" style={styles.resourceArt} />
              ) : null}
              <div>
              <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 900 }}>{item?.name || key}</div>
              {owned <= 0 && fractionalOwned > 0 ? (
                <div style={{ color: '#fbbf24', fontSize: 10 }}>
                  Faltan {formatNumber(1 - fractionalOwned, 2)} para poder vender 1 unidad.
                </div>
              ) : null}
              <div style={{ color: '#94a3b8', fontSize: 11 }}>
                Mercado {formatNumber(marketSupply)}
                {` - ${state.label}`}
                {flow?.amountPerHour > 0 ? ` - uso ${formatNumber(flow.amountPerHour, 2)}/h` : ''}
              </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 3 }}>
              <div style={{ fontSize: 12, color: '#cbd5e1' }}>Compra / venta</div>
              <strong style={{ color: '#f8fafc', fontSize: 14 }}>{formatNumber(buyDisplayPrice, 2)} / {formatNumber(sellPrice, 2)} cr</strong>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 11 }}><span>Presion</span><span>{formatNumber(heat, 2)}x</span></div>
              <div style={styles.progressBarBg}><div style={{ ...styles.progressBarFill, width: `${trend.pct}%`, background: trend.bg }} /></div>
              <div style={{ marginTop: 5, display: 'inline-flex', maxWidth: '100%', padding: '4px 7px', borderRadius: 999, background: globalPressure.bg, border: globalPressure.border, color: globalPressure.color, fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap' }} title={globalPressure.detail}>
                {globalPressure.label}
              </div>
              {priceLimitState ? (
                <div style={{ marginTop: 4, display: 'inline-flex', maxWidth: '100%', padding: '4px 7px', borderRadius: 999, background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.2)', color: '#fde68a', fontSize: 10, fontWeight: 900, whiteSpace: 'nowrap' }}>
                  {priceLimitState === 'min' ? 'Precio minimo' : 'Precio maximo'}
                </div>
              ) : null}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '64px 52px 52px minmax(76px, 1fr) minmax(76px, 1fr)', gap: 6, alignItems: 'stretch' }}>
              <input type="number" min="1" step="1" value={selectedQty} onChange={(event) => setQuantity(key, event.target.value)} aria-label={`Cantidad de ${item?.name || key}`} style={{ ...styles.quantityInput, width: '100%', minWidth: 0 }} />
              <button type="button" title="Maximo que puedes comprar" onClick={() => setQuantity(key, Math.max(1, maxBuy))} disabled={maxBuy <= 0} style={{ ...styles.quantityMiniButton, padding: '8px 6px', minWidth: 0, ...(maxBuy <= 0 ? styles.buttonDisabled : null) }}>Max C</button>
              <button type="button" title="Maximo que puedes vender" onClick={() => setQuantity(key, Math.max(1, owned))} disabled={owned <= 0} style={{ ...styles.quantityMiniButton, padding: '8px 6px', minWidth: 0, ...(owned <= 0 ? styles.buttonDisabled : null) }}>Max V</button>
              <button type="button" onClick={() => handleBuy(key, item)} disabled={!canBuy} title={`Compra ${formatNumber(buyQuote.amount)} por ${formatNumber(buyQuote.total, 2)} cr`} style={{ ...styles.buyButton, minHeight: 34, padding: '8px 10px', ...(!canBuy ? styles.buttonDisabled : null) }}>Comprar</button>
              <button type="button" onClick={() => handleSell(key, item)} disabled={!canSell} title={`Vende ${formatNumber(sellQuote.amount)} por ${formatNumber(sellQuote.total, 2)} cr`} style={{ ...styles.sellButton, minHeight: 34, padding: '8px 10px', ...(!canSell ? styles.buttonDisabled : null) }}>Vender</button>
            </div>
          </div>
        ))}
      </div>

      <details style={{ ...styles.helperBox, padding: 10, borderRadius: 10 }}>
        <summary style={{ cursor: 'pointer', color: '#f8fafc', fontWeight: 900 }}>Como leer el mercado</summary>
        <div style={{ marginTop: 8 }}>Hay un solo precio por recurso. Si compras, sube. Si vendes, baja. La presion global resume el saldo acumulado de compras y ventas de los jugadores.</div>
      </details>
    </div>
  );
}

function HeroStat({ label, value, sub }) {
  return (
    <div style={styles.heroCard}>
      <div style={styles.heroLabel}>{label}</div>
      <div style={styles.heroValue}>{value}</div>
      <div style={styles.heroSub}>{sub}</div>
    </div>
  );
}

export default MarketView;
