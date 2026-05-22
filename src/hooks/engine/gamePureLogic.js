/**
 * gamePureLogic.js
 *
 * Todas las funciones puras del juego. Sin imports de React,
 * sin efectos secundarios, faciles de testear de forma aislada.
 */

import {
  DEFAULT_CHAT,
  DEFAULT_INVENTORY,
  DEFAULT_PLAYER,
  DEFAULT_STATS,
  INIT_MARKET,
  INIT_MISSIONS,
  INIT_TERRITORIES,
  NPC_PLAYERS,
  RANDOM_EVENTS,
} from '../../data/gameData';
import {
  createInitialResearch,
  getResearchEffects,
  normalizeResearch,
} from '../../data/researchData';
import { HQ_UPGRADES, createInitialHq, getHqEffects } from '../../data/hqUpgrades';
import { getCompanyGroupMultiplier, round2 } from '../../utils/companyMath';
import { getXpNeededForLevel } from '../../utils/xp';
import { COMPANY_TYPES } from '../../data/companyTypes';
import {
  STARTER_PLANET_ID,
  getPlanetById,
  getPlanetEffects,
} from '../../data/planets';
import { MILESTONE_DEFINITIONS } from '../../data/milestones';
import { REGIONS, REGION_LIST, REGION_CHANGE_COST, getRegionEconomy, getRegionByTerritoryId } from '../../data/regions';
import { STARTER_INVENTORY } from '../../data/resources';
import {
  createInitialLoginRewards,
  getDailyStreakReward,
  getWelcomeBackReward,
} from '../../data/loginRewards';
import {
  createInitialMegaprojects,
  createInitialSponsorships,
  MEGAPROJECTS,
  SPONSORSHIPS,
} from '../../data/megaprojects';

import {
  ACTION_ENERGY_COSTS,
  CONTRACT_SLOTS,
  CONTRACT_TEMPLATES,
  DEFAULT_AD_BOOSTS,
  AD_POOL_REVENUE_PER_VIEW,
  JOB_DURATION_BY_LEVEL,
  TUTORIAL_STEPS,
  TERRITORY_SIEGE_TICKS,
  TERRITORY_THREAT_DECAY,
  TERRITORY_THREAT_DECAY_CAP,
} from './gameConstants';


export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export const dynPrice = (item) =>
  parseFloat(
    (
      item.base *
      Math.max(0.5, Math.min(2.2, 0.8 + (item.demand / Math.max(item.supply, 1)) * 0.45))
    ).toFixed(2)
  );

export const MARKET_MAX_TRADE_UNITS = 250;
export const MARKET_TRADE_PRICE_STEP = 0.01;
export const MARKET_BUY_MARKUP = 1.08;
export const MARKET_SELL_MARKDOWN = 0.78;
export const CONTRACT_BUY_ARBITRAGE_CAP = 0.9;

export const applyMarketTradePriceImpact = (item, amount = 1, direction = 'sell') => {
  const safeAmount = Math.max(0, Math.floor(Number(amount || 0)));
  const currentPrice = Number(item?.price ?? dynPrice(item || {}));
  const base = Math.max(0.01, Number(item?.base ?? currentPrice ?? 1));
  const delta = safeAmount * MARKET_TRADE_PRICE_STEP;
  const nextPrice = direction === 'buy' ? currentPrice + delta : currentPrice - delta;
  const floor = Math.max(0.01, base * 0.35);
  const ceiling = base * 2.8;
  return round2(clamp(nextPrice, floor, ceiling));
};

export const decorateMarketTradeImpact = (item, quote, direction = 'buy') => {
  const beforePrice = Number(item?.price ?? dynPrice(item || {}));
  const afterPrice = Number(quote?.priceAfterTrade ?? beforePrice);
  const amount = Number(quote?.amount ?? 0);
  const previousBuys = Number(item?.globalBuys ?? 0);
  const previousSells = Number(item?.globalSells ?? 0);
  const nextBuys = direction === 'buy' ? previousBuys + amount : previousBuys;
  const nextSells = direction === 'sell' ? previousSells + amount : previousSells;
  const netFlow = nextBuys - nextSells;

  return {
    price: afterPrice,
    lastTradeAt: Date.now(),
    lastTradeAction: direction,
    lastTradeQty: amount,
    lastPriceChange: round2(afterPrice - beforePrice),
    globalBuys: round2(nextBuys),
    globalSells: round2(nextSells),
    netFlow: round2(netFlow),
    marketPressure: netFlow > 0 ? 'buy' : netFlow < 0 ? 'sell' : 'flat',
  };
};

export const getMarketBuyQuote = (item, qty = 1) => {
  const amount = Math.max(1, Math.min(MARKET_MAX_TRADE_UNITS, Math.floor(Number(qty || 1))));
  const priceAfterTrade = applyMarketTradePriceImpact(item, amount, 'buy');
  const impactedItem = {
    ...(item || {}),
    demand: Number(item?.demand ?? 0) + amount * 2.8,
    supply: Math.max(1, Number(item?.supply ?? 0) - amount),
  };
  const impactedPrice = dynPrice(impactedItem);
  const unitPrice = round2(priceAfterTrade * MARKET_BUY_MARKUP);
  return { amount, unitPrice, total: round2(unitPrice * amount), impactedItem, impactedPrice, priceAfterTrade };
};

export const getMarketSellQuote = (item, qty = 1) => {
  const amount = Math.max(1, Math.min(MARKET_MAX_TRADE_UNITS, Math.floor(Number(qty || 1))));
  const currentPrice = Number(item?.price ?? dynPrice(item || {}));
  const priceAfterTrade = applyMarketTradePriceImpact(item, amount, 'sell');
  const impactedItem = {
    ...(item || {}),
    supply: Number(item?.supply ?? 0) + amount,
    demand: Math.max(0, Number(item?.demand ?? 0) - amount * 2.4),
  };
  const impactedPrice = dynPrice(impactedItem);
  const unitPrice = round2(currentPrice * MARKET_SELL_MARKDOWN);
  return { amount, unitPrice, total: round2(unitPrice * amount), impactedItem, impactedPrice, priceAfterTrade };
};

export const addLog = (logs, msg) => {
  if (logs[0]?.msg === msg) return logs;
  return [{ msg, t: Date.now() }, ...logs].slice(0, 50);
};

const normalizeSectorMemory = (memory = {}) => ({
  firstControlledAt: memory.firstControlledAt || null,
  firstControlledDay: memory.firstControlledDay || null,
  lastConqueredAt: memory.lastConqueredAt || null,
  lastConqueredDay: memory.lastConqueredDay || null,
  lastLostAt: memory.lastLostAt || null,
  lastLostDay: memory.lastLostDay || null,
  lastLostTo: memory.lastLostTo || null,
  lastDefendedAt: memory.lastDefendedAt || null,
  lastDefendedDay: memory.lastDefendedDay || null,
  lastDefendedBy: memory.lastDefendedBy || null,
  conqueredCount: Math.max(0, Number(memory.conqueredCount || 0)),
  lostCount: Math.max(0, Number(memory.lostCount || 0)),
  defendedCount: Math.max(0, Number(memory.defendedCount || 0)),
  lastEvent: memory.lastEvent || null,
});

export const updateTerritoryMemory = (territory, eventType, context = {}) => {
  const now = Number(context.now || Date.now());
  const day = Number(context.day || 1);
  const actor = context.actor || null;
  const memory = normalizeSectorMemory(territory?.sectorMemory);

  if (eventType === 'conquered') {
    return {
      ...memory,
      firstControlledAt: memory.firstControlledAt || now,
      firstControlledDay: memory.firstControlledDay || day,
      lastConqueredAt: now,
      lastConqueredDay: day,
      conqueredCount: memory.conqueredCount + 1,
      lastEvent: actor ? `Conquistado por ${actor}` : 'Conquistado',
    };
  }

  if (eventType === 'lost') {
    return {
      ...memory,
      lastLostAt: now,
      lastLostDay: day,
      lastLostTo: actor,
      lostCount: memory.lostCount + 1,
      lastEvent: actor ? `Perdido ante ${actor}` : 'Perdido',
    };
  }

  if (eventType === 'defended') {
    return {
      ...memory,
      lastDefendedAt: now,
      lastDefendedDay: day,
      lastDefendedBy: actor,
      defendedCount: memory.defendedCount + 1,
      lastEvent: actor ? `Defendido por ${actor}` : 'Defendido',
    };
  }

  return memory;
};

export const randFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const calcShare = (pct, total, count) => (total / Math.max(count, 1)) * (pct / 100);

export const deepClone = (value) => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

export const withTimeout = async (promise, ms, label = 'Operacion') => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`${label} agoto el tiempo de espera`)),
      ms
    );
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const getRandomInt = (min, max) => {
  const safeMin = Math.ceil(Number(min ?? 0));
  const safeMax = Math.floor(Number(max ?? safeMin));
  return Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;
};


export const getCombinedEffects = (research = {}, hq = {}) => {
  const re = getResearchEffects(research);
  const he = getHqEffects(hq);
  return {
    ...re,
    companyStorageMult:
      Number(re.companyStorageMult ?? 1) * Number(he.companyStorageMult ?? 1),
    actionEnergyDiscount: Math.min(
      0.55,
      Number(re.actionEnergyDiscount ?? 0) + Number(he.actionEnergyDiscount ?? 0)
    ),
    territoryThreatMult:
      Number(re.territoryThreatMult ?? 1) * Number(he.territoryThreatMult ?? 1),
    conquestPowerMult:
      Number(re.conquestPowerMult ?? 1) * Number(he.conquestPowerMult ?? 1),
    marketSellMult: Number(he.marketSellMult ?? 1),
  };
};

export const getEnergyCost = (actionKey, research = {}, hq = {}) => {
  const baseCost = Number(ACTION_ENERGY_COSTS[actionKey] ?? 0);
  const discount = Number(getCombinedEffects(research, hq).actionEnergyDiscount ?? 0);
  return Math.max(0, Math.ceil(baseCost * (1 - discount)));
};

export const hasEnoughEnergy = (player, actionKey, research = {}, hq = {}) =>
  Number(player?.energy ?? 0) >= getEnergyCost(actionKey, research, hq);

export const spendEnergy = (player, actionKey, research = {}, hq = {}) => ({
  ...player,
  energy: Math.max(
    0,
    Number(player?.energy ?? 0) - getEnergyCost(actionKey, research, hq)
  ),
});

export const getIntegrityEffects = (player = {}) => {
  const health = clamp(Number(player?.health ?? 100), 0, 100);

  if (health < 25) {
    return {
      health,
      status: 'Critica',
      detail: 'Trabajo lento y conquistas muy penalizadas.',
      workDurationMult: 1.45,
      conquestPowerMult: 0.55,
      canBattle: false,
    };
  }

  if (health < 45) {
    return {
      health,
      status: 'Dañada',
      detail: 'Trabajo mas lento y menor fuerza de conquista.',
      workDurationMult: 1.25,
      conquestPowerMult: 0.75,
      canBattle: true,
    };
  }

  if (health < 70) {
    return {
      health,
      status: 'Tocada',
      detail: 'Ligera penalizacion operativa.',
      workDurationMult: 1.1,
      conquestPowerMult: 0.9,
      canBattle: true,
    };
  }

  return {
    health,
    status: 'Estable',
    detail: 'Sin penalizaciones.',
    workDurationMult: 1,
    conquestPowerMult: 1,
    canBattle: true,
  };
};

export const applyPlayerXpGain = (player, xpGain = 0) => {
  const next = {
    ...(player || {}),
    level: Math.max(1, Number(player?.level ?? 1)),
    xp: Math.max(0, Number(player?.xp ?? 0) + Number(xpGain ?? 0)),
  };
  while (next.xp >= getXpNeededForLevel(next.level)) {
    next.xp -= getXpNeededForLevel(next.level);
    next.level += 1;
  }
  return next;
};

export const getLevelUnlocks = (level = 1) => {
  const safeLevel = Math.max(1, Number(level ?? 1));
  const unlocksByLevel = {
    2: ['Mejor ritmo de agua', 'primeros contratos de suministro', 'mercado basico'],
    3: ['Ventas de mayor volumen', 'mas margen por agua', 'preparacion electrica'],
    4: ['Trabajo electrico', 'panel solar', 'contratos de electricidad'],
    5: ['Mas demanda de electricidad', 'empresas basicas rentables', 'ventas frecuentes'],
    6: ['Mejor lectura del mercado', 'contratos de volumen', 'preparacion minera'],
    7: ['Extraccion mineral', 'mina de superficie', 'contratos de mineral'],
    8: ['Exportacion mixta', 'mayor presion de demanda', 'rutas de pasaje visibles'],
    9: ['Produccion basica consolidada', 'pasaje orbital cercano', 'economia de alto volumen'],
    10: ['Comprar pasaje a Veyron', 'demanda exterior', 'fin de la fase Nexus Prime'],
  };

  return unlocksByLevel[safeLevel] || [
    `Contratos nivel ${safeLevel}`,
    'mejores recompensas por trabajo',
    'mas presion territorial y economica',
  ];
};

export const getNextLevelPreview = (player = {}) => {
  const level = Math.max(1, Number(player?.level ?? 1));
  const xp = Math.max(0, Number(player?.xp ?? 0));
  const needed = getXpNeededForLevel(level);
  const nextLevel = level + 1;
  return {
    level,
    nextLevel,
    xp,
    needed,
    pct: needed > 0 ? clamp((xp / needed) * 100, 0, 100) : 100,
    unlocks: getLevelUnlocks(nextLevel),
  };
};

export const applyResearchToPlayer = (player, research = {}, refillEnergy = false) => {
  const effects = getResearchEffects(research);
  const maxEnergy =
    Number(DEFAULT_PLAYER?.maxEnergy ?? 100) + Number(effects.maxEnergyBonus ?? 0);
  return {
    ...player,
    maxEnergy,
    energy: refillEnergy
      ? maxEnergy
      : Math.min(maxEnergy, Number(player?.energy ?? 0)),
  };
};


export const readPendingAccountSave = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem('astracorp-pending-account-save-v1');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

export const clearPendingAccountSave = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem('astracorp-pending-account-save-v1');
};

export const summarizeSaveForImport = (saveData) => {
  const s = saveData && typeof saveData === 'object' ? saveData : {};
  const player = s.player || {};
  return {
    name: player.name || 'Invitado',
    level: Number(player.level ?? 1),
    credits: Number(player.credits ?? player.euros ?? 0),
    companies: Array.isArray(s.companies) ? s.companies.length : 0,
    contracts: Number(s.stats?.contracts ?? 0),
    conquests: Number(s.stats?.conquests ?? 0),
    currentPlanet:
      player.currentPlanetName ||
      getPlanetById(player.currentPlanet || player.planet)?.name ||
      'Nexus Prime',
  };
};

export const hasMeaningfulProgress = (saveData) => {
  const s = saveData && typeof saveData === 'object' ? saveData : {};
  return (
    Number(s.player?.level ?? 1) > 1 ||
    Number(s.player?.credits ?? s.player?.euros ?? 0) > 0 ||
    (Array.isArray(s.companies) && s.companies.length > 0) ||
    Number(s.stats?.works ?? 0) > 0 ||
    Number(s.stats?.contracts ?? 0) > 0 ||
    Number(s.stats?.conquests ?? 0) > 0
  );
};

export const buildRemoteSavePayload = (saveData) => ({
  ...saveData,
  adEuros: round2(saveData?.adEuros ?? 0),
  confetti: false,
  note: null,
  selTer: null,
  chatInput: '',
  lastProgressAt: Date.now(),
  sessionStartedAt: Date.now(),
  lastSessionEventAt: 0,
  lastSectorEventAt: 0,
  activeSectorEvent: null,
  levelMoment: null,
});

const maxKnownNumber = (previous, incoming) => Math.max(
  Number(previous ?? 0),
  Number(incoming ?? 0)
);

export const mergeAdIncomeSummary = (previous = {}, incoming = {}) => {
  const prev = previous || {};
  const inc = incoming || {};
  const next = { ...prev, ...inc };

  [
    'yesterday_payout',
    'yesterday_pool',
    'yesterday_estimate',
    'avg_last_10_days',
    'total_payout',
    'total_pool',
    'today_pool',
    'today_estimate',
  ].forEach((key) => {
    next[key] = maxKnownNumber(prev[key], inc[key]);
  });

  next.today_active_players = Math.max(1, Number(inc.today_active_players ?? prev.today_active_players ?? 1));
  next.yesterday_active_players = Math.max(1, Number(inc.yesterday_active_players ?? prev.yesterday_active_players ?? 1));
  next.yesterday_closed = inc.yesterday_closed ?? prev.yesterday_closed ?? true;

  return next;
};


const STORAGE_PREFIX = 'astracorp-save-v1';

export const getStorageKey = (userId) =>
  userId ? `${STORAGE_PREFIX}-${userId}` : `${STORAGE_PREFIX}-guest`;

export const readLocalSave = (userId) => {
  if (typeof window === 'undefined') return null;
  try {
    const storage = userId ? window.localStorage : window.sessionStorage;
    const raw = storage.getItem(getStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch (error) {
    console.error('Error leyendo partida local:', error);
    return null;
  }
};

export const writeLocalSave = (userId, data) => {
  if (typeof window === 'undefined') return;
  try {
    const storage = userId ? window.localStorage : window.sessionStorage;
    storage.setItem(getStorageKey(userId), JSON.stringify({ ...data, lastProgressAt: Date.now() }));
    if (!userId) window.localStorage.removeItem(getStorageKey(null));
  } catch (error) {
    console.error('Error guardando partida local:', error);
  }
};


export const getTodayKey = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const diffDaysFromKeys = (oldKey, newKey) => {
  if (!oldKey || !newKey) return 0;
  const ms = new Date(`${newKey}T00:00:00`) - new Date(`${oldKey}T00:00:00`);
  if (!Number.isFinite(ms)) return 0;
  return Math.floor(ms / (1000 * 60 * 60 * 24));
};


export const getCurrentPlanetIdFromSave = (saveData) =>
  saveData?.player?.currentPlanet || saveData?.player?.planet || 'nexus-prime';

export const getCurrentRegionKeyFromSave = (saveData) =>
  saveData?.player?.currentRegion || saveData?.player?.region || 'alpha-district';


export const updateMarketItem = (item) => {
  const demand = clamp(Number(item.demand ?? 0) + (Math.random() - 0.5) * 8, 50, 700);
  const supply = clamp(Number(item.supply ?? 0) + (Math.random() - 0.5) * 6, 30, 700);
  return { ...item, demand, supply, price: dynPrice({ ...item, demand, supply }) };
};

export const ALL_MARKET_KEYS = [
  'water', 'energy_cells', 'mineral', 'purified_water',
  'metal_components', 'oxygen_tanks', 'alloy_frames', 'habitat_modules',
];

export const getEventImpactedKeys = (effect) => {
  if (effect === 'freeWater')  return ['water', 'purified_water'];
  if (effect === 'energyDrain') return ['energy_cells', 'oxygen_tanks'];
  if (effect === 'lottery')    return ['alloy_frames', 'habitat_modules'];
  if (effect === 'subsidy')    return ['metal_components', 'alloy_frames', 'habitat_modules'];
  if (effect === 'adBoom')     return ['metal_components', 'habitat_modules'];
  return ALL_MARKET_KEYS;
};

export const getUnlockedMarketKeysForLevel = (level = 1) => {
  const safeLevel = Number(level ?? 1);
  if (safeLevel <= 1) return ['water'];
  if (safeLevel === 2) return ['water', 'energy_cells'];
  if (safeLevel <= 10) return ['water', 'energy_cells', 'mineral'];
  return ALL_MARKET_KEYS;
};

const filterEventForPlayerLevel = (event, level = 1) => {
  if (!event) return null;
  const allowed = new Set(getUnlockedMarketKeysForLevel(level));
  const affectedKeys = (event.affectedKeys || getEventImpactedKeys(event.effect))
    .filter((key) => allowed.has(key));
  if (!affectedKeys.length) return null;

  if (Number(level ?? 1) <= 1 && affectedKeys.includes('water')) {
    return {
      ...event,
      icon: 'H2O',
      title: event.id?.includes('water') ? event.title : 'Demanda local de agua',
      desc: 'Agua tiene mas demanda durante esta ventana.',
      affectedKeys: ['water'],
      actionHint: 'Vende agua mientras la demanda este activa.',
    };
  }

  return { ...event, affectedKeys };
};

export const createCycleEvent = (lastEventAt = 0, saveData = {}) => {
  const now = Date.now();
  if (saveData?.activeEvent && Number(saveData.activeEvent.expiresAt ?? 0) > now) return null;
  if (now - Number(lastEventAt ?? 0) < 6 * 60 * 1000) return null;
  if (Math.random() > 0.14) return null;
  const source = randFrom(RANDOM_EVENTS);
  return filterEventForPlayerLevel(
    { ...source, affectedKeys: getEventImpactedKeys(source.effect) },
    saveData?.player?.level ?? 1
  );
};

const adjustEventMarketItem = (item, dMult = 1, sMult = 1, dShift = 0, sShift = 0) => {
  const demand = clamp(Number(item?.demand ?? 0) * dMult + dShift, 50, 700);
  const supply = clamp(Number(item?.supply ?? 0) * sMult + sShift, 30, 700);
  return { ...item, demand, supply, price: dynPrice({ ...item, demand, supply }) };
};

export const applyCycleEventToMarket = (market, event) => {
  if (!event?.effect) return market;
  return Object.fromEntries(
    Object.entries(market).map(([key, item]) => {
      const affected = event.affectedKeys?.includes(key);
      const withEventMeta = (nextItem) => affected
        ? {
            ...nextItem,
            eventActive: true,
            eventName: event.title,
            eventEffect: event.effect,
            eventUntil: event.expiresAt || null,
          }
        : {
            ...nextItem,
            eventActive: false,
            eventName: null,
            eventEffect: null,
            eventUntil: null,
          };
      switch (event.effect) {
        case 'priceUp':     return [key, withEventMeta(adjustEventMarketItem(item, affected ? 1.16 : 1.03, affected ? 0.93 : 1))];
        case 'priceDown':   return [key, withEventMeta(adjustEventMarketItem(item, affected ? 0.88 : 0.98, affected ? 1.14 : 1))];
        case 'freeWater':
          if (key === 'water')          return [key, withEventMeta(adjustEventMarketItem(item, 0.92, 1.42))];
          if (key === 'purified_water') return [key, withEventMeta(adjustEventMarketItem(item, 0.97, 1.18))];
          return [key, withEventMeta(adjustEventMarketItem(item, 1.01, 1))];
        case 'energyDrain':
          if (key === 'energy_cells')  return [key, withEventMeta(adjustEventMarketItem(item, 1.32, 0.88))];
          if (key === 'oxygen_tanks')  return [key, withEventMeta(adjustEventMarketItem(item, 1.16, 0.94))];
          return [key, withEventMeta(adjustEventMarketItem(item, affected ? 1.08 : 1.02, 0.98))];
        case 'lottery':
          return [key, withEventMeta(adjustEventMarketItem(item, affected ? 1.18 : 1.04, affected ? 0.96 : 1))];
        case 'subsidy':
          return [key, withEventMeta(adjustEventMarketItem(item, affected ? 1.2 : 1.07, affected ? 0.98 : 1))];
        case 'adBoom':
          return [key, withEventMeta(adjustEventMarketItem(item, affected ? 1.16 : 1.03, affected ? 0.97 : 1))];
        case 'supplyShock':
          if (['metal_components','oxygen_tanks','alloy_frames','habitat_modules'].includes(key)) {
            return [key, withEventMeta(adjustEventMarketItem(item, 1.32, 0.58, 55, -35))];
          }
          return [key, withEventMeta(adjustEventMarketItem(item, 1.08, 0.8))];
        case 'demandSpike':
          if (['purified_water','metal_components','alloy_frames','habitat_modules'].includes(key)) {
            return [key, withEventMeta(adjustEventMarketItem(item, affected ? 1.42 : 1.08, affected ? 0.86 : 0.96, affected ? 80 : 0, affected ? -10 : 0))];
          }
          return [key, withEventMeta(adjustEventMarketItem(item, affected ? 1.22 : 1.04, affected ? 0.92 : 0.98, affected ? 42 : 0, 0))];
        case 'marketDump':
          return [key, withEventMeta(adjustEventMarketItem(item, affected ? 0.64 : 0.9, affected ? 1.75 : 1.05, affected ? -60 : 0, affected ? 120 : 0))];
        default:
          return [key, withEventMeta(item)];
      }
    })
  );
};

export const decorateCycleEvent = (event) => {
  if (!event) return null;
  const names = event.affectedKeys
    ?.map((key) => INIT_MARKET[key]?.name)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');
  return {
    ...event,
    desc: names ? `${event.desc} Impacto principal: ${names}.` : event.desc,
    cycleTag: 'Pulso del ciclo',
  };
};

export const applyCycleEventToContracts = (contracts, event, market) => {
  const impacted = new Set(event?.affectedKeys || []);
  return (Array.isArray(contracts) ? contracts : []).map((contract) => {
    const base = round2(
      Number(contract?.baseRewardCredits ?? contract?.reward?.credits ?? contract?.reward?.euros ?? 0)
    );
    if (!impacted.has(contract?.itemKey)) {
      return { ...contract, baseRewardCredits: base, eventBoost: false, eventBoostLabel: null, eventBonusCredits: 0, eventBonusPct: 0, reward: { ...(contract.reward || {}), credits: base } };
    }
    const sell = Number(market?.[contract?.itemKey]?.price ?? 0) * 0.88 * Math.max(1, Number(contract?.qty ?? 0));
    const floor = (event?.effect === 'priceUp' || event?.effect === 'subsidy') ? 1.22
      : event?.effect === 'energyDrain' ? 1.2 : 1.12;
    const boosted = round2(Math.max(base * 1.08, sell * floor));
    return {
      ...contract,
      baseRewardCredits: base,
      eventBoost: true,
      eventBoostLabel: event?.title || 'Pulso del ciclo',
      eventBonusCredits: round2(Math.max(0, boosted - base)),
      eventBonusPct: base > 0 ? Math.round(((boosted - base) / base) * 100) : 0,
      reward: { ...(contract.reward || {}), credits: boosted },
    };
  });
};

const SESSION_EVENT_TEMPLATES = [
  {
    id: 'convoy-mineral',
    icon: 'REQ',
    title: 'Convoy de emergencia',
    desc: 'Mineral y componentes metalicos pagan mejor durante esta ventana. Aprovecha contratos o vende stock.',
    color: '#fbbf24',
    effect: 'demandSpike',
    affectedKeys: ['mineral', 'metal_components'],
    actionHint: 'Revisa contratos y mercado: si tienes mineral o componentes, este es buen momento para convertirlos en creditos.',
  },
  {
    id: 'energy-boom',
    icon: 'EN',
    title: 'Boom de demanda energetica',
    desc: 'Energia y oxigeno tienen mas demanda durante esta ventana.',
    color: '#67e8f9',
    effect: 'priceUp',
    affectedKeys: ['energy_cells', 'oxygen_tanks'],
    actionHint: 'Vende energia sobrante o prioriza pedidos relacionados antes de que termine.',
  },
  {
    id: 'ad-sponsor',
    icon: 'ADS',
    title: 'Patrocinio orbital activo',
    desc: 'Los patrocinadores empujan el pool publicitario de la sesion.',
    color: '#facc15',
    effect: 'adBoom',
    affectedKeys: ['habitat_modules', 'metal_components'],
    actionHint: 'Pasa por Ads si quieres ver el impacto del patrocinio y tu reparto estimado.',
  },
  {
    id: 'water-relief',
    icon: 'H2O',
    title: 'Solicitud hidrica local',
    desc: 'Agua y agua purificada tienen mas demanda durante esta ventana.',
    color: '#22d3ee',
    effect: 'demandSpike',
    affectedKeys: ['water', 'purified_water'],
    actionHint: 'Prioriza contratos o ventas de agua mientras la demanda este activa.',
  },
];

export const createSessionEvent = (saveData, now = Date.now()) => {
  const sessionStartedAt = Number(saveData?.sessionStartedAt ?? now);
  if (saveData?.activeEvent && Number(saveData.activeEvent.expiresAt ?? 0) > now) return null;
  if (now - sessionStartedAt < 3 * 60 * 1000) return null;
  if (now - Number(saveData?.lastSessionEventAt ?? 0) < 14 * 60 * 1000) return null;
  if (Math.random() > 0.08) return null;
  const playerLevel = Number(saveData?.player?.level ?? 1);
  const lastEventEffect = saveData?.lastSessionEventEffect || saveData?.activeEvent?.effect || null;
  const candidates = SESSION_EVENT_TEMPLATES
    .map((template) => filterEventForPlayerLevel(template, playerLevel))
    .filter((template) => template?.effect !== lastEventEffect)
    .filter(Boolean);
  if (!candidates.length) return null;
  const template = randFrom(candidates);
  return {
    ...template,
    id: `${template.id}-${now}`,
    sessionTag: 'Evento de sesion',
    createdAt: now,
    expiresAt: now + 6 * 60 * 1000,
  };
};

export const createSectorEvent = (saveData, now = Date.now()) => {
  const playerName = saveData?.player?.name;
  const controlled = normalizeTerritories(saveData?.territories)
    .filter((territory) => territory.controller === playerName);
  if (!playerName || controlled.length === 0) return null;
  if (saveData?.activeSectorEvent && Number(saveData.activeSectorEvent.expiresAt ?? 0) > now) return null;
  if (now - Number(saveData?.lastSectorEventAt ?? 0) < 5 * 60 * 1000) return null;
  if (Math.random() > 0.12) return null;

  const territory = randFrom(controlled);
  const options = [
    { key: 'water', itemName: 'Agua', qty: 8, stability: 8, credits: 5 },
    { key: 'energy_cells', itemName: 'Electricidad', qty: 7, stability: 9, credits: 6 },
    { key: 'mineral', itemName: 'Mineral', qty: 10, stability: 7, credits: 6 },
  ];
  const need = randFrom(options);
  return {
    id: `sector-${territory.id}-${now}`,
    territoryId: territory.id,
    territoryName: territory.customName || territory.name,
    title: `${territory.customName || territory.name} solicita apoyo`,
    desc: `${territory.customName || territory.name} necesita ${need.qty} ${need.itemName}. Si respondes, sube su estabilidad permanente.`,
    itemKey: need.key,
    itemName: need.itemName,
    qty: need.qty,
    reward: { credits: need.credits, stability: need.stability },
    createdAt: now,
    expiresAt: now + 8 * 60 * 1000,
  };
};

export const resolveNpcAction = (saveData) => {
  const npcs = Array.isArray(saveData?.npcs) && saveData.npcs.length ? saveData.npcs : NPC_PLAYERS;
  const npc = randFrom(npcs);
  if (!npc) return null;
  const strategy = npc.strategy || 'estable';
  const marketKeys = ['water', 'energy_cells', 'mineral'];
  const key = randFrom(marketKeys);

  if (strategy === 'mercado' || strategy === 'oportunista' || strategy === 'industrial') {
    return {
      type: 'market',
      npc,
      key,
      log: `${npc.name} mueve el mercado de ${INIT_MARKET[key]?.name || key}: ${npc.motive || 'estrategia economica visible'}.`,
    };
  }

  if (strategy === 'contratos') {
    return {
      type: 'contract',
      npc,
      key,
      log: `${npc.name} publica un pedido directo: necesita ${INIT_MARKET[key]?.name || key} y esta mirando tu produccion.`,
    };
  }

  return {
    type: 'territory',
    npc,
    log: `${npc.name} cambia a postura ${strategy}: ${npc.motive || 'presion regional simulada'}.`,
  };
};

const TERRITORIAL_EVENT_DURATION_DAYS = 7;
const TERRITORIAL_EVENT_REWARDS_BY_BONUS = {
  agua: [{ key: 'water', amount: 12 }],
  mineral: [{ key: 'mineral', amount: 10 }],
  energia: [{ key: 'energy_cells', amount: 8 }],
  'agua purificada': [{ key: 'water', amount: 12 }],
  habitat: [{ key: 'energy_cells', amount: 10 }],
  oxigeno: [{ key: 'water', amount: 10 }],
  aleacion: [{ key: 'mineral', amount: 10 }],
};

const getTerritorialEventRewardResources = (territory) =>
  TERRITORIAL_EVENT_REWARDS_BY_BONUS[territory?.bonus] || [{ key: 'mineral', amount: 6 }];

export const createTerritorialWeeklyEvent = (territories = [], day = 1, now = Date.now()) => {
  const pool = normalizeTerritories(territories);
  if (!pool.length) return null;
  const target = pool[Math.abs(Number(day ?? 1)) % pool.length] || pool[0];
  const rewardResources = getTerritorialEventRewardResources(target);
  return {
    id: `territorial-${Number(day ?? 1)}-${target.id}`,
    title: `${target.name} en disputa`,
    territoryId: target.id,
    territoryName: target.name,
    bonus: target.bonus || 'regional',
    objective: 'control_and_stability',
    targetStability: 70,
    startDay: Number(day ?? 1),
    endsDay: Number(day ?? 1) + TERRITORIAL_EVENT_DURATION_DAYS - 1,
    createdAt: now,
    completed: false,
    failed: false,
    lastPenaltyDay: Number(day ?? 1) - 1,
    reward: { credits: 9, xp: 115, resources: rewardResources },
    desc: `Controla ${target.name} y manten su estabilidad en 70 o mas antes de que cierre el foco semanal.`,
  };
};

export const normalizeTerritorialWeeklyEvent = (event, territories = [], day = 1) => {
  if (!event || typeof event !== 'object') return null;
  const territory = normalizeTerritories(territories).find((t) => Number(t.id) === Number(event.territoryId));
  if (!territory) return null;
  return {
    ...event,
    territoryId: territory.id,
    territoryName: event.territoryName || territory.name,
    bonus: event.bonus || territory.bonus || 'regional',
    targetStability: Number(event.targetStability ?? 70),
    startDay: Number(event.startDay ?? day),
    endsDay: Number(event.endsDay ?? Number(day ?? 1) + TERRITORIAL_EVENT_DURATION_DAYS - 1),
    lastPenaltyDay: Number(event.lastPenaltyDay ?? Number(event.startDay ?? day) - 1),
    completed: Boolean(event.completed ?? false),
    failed: Boolean(event.failed ?? false),
    reward: {
      credits: Number(event.reward?.credits ?? 9),
      xp: Number(event.reward?.xp ?? 115),
      resources: (Array.isArray(event.reward?.resources) ? event.reward.resources : getTerritorialEventRewardResources(territory))
        .filter((resource) => resource?.key)
        .map((resource) => ({ key: resource.key, amount: Number(resource.amount ?? 0) })),
    },
  };
};

export const resolveTerritorialWeeklyEvent = (saveData, now = Date.now()) => {
  const day = Number(saveData?.day ?? 1);
  const playerName = saveData?.player?.name;
  const playerLevel = Number(saveData?.player?.level ?? 1);
  const baseTerritories = normalizeTerritories(saveData?.territories);
  if (!playerName || playerLevel < 4) {
    return { territories: baseTerritories, event: null, player: saveData?.player, inventory: saveData?.inventory || {}, log: saveData?.log || [], note: saveData?.note || null, completed: false, created: false, penalized: false };
  }

  let event = normalizeTerritorialWeeklyEvent(saveData?.territorialWeeklyEvent, baseTerritories, day);
  let created = false;
  if (!event || Number(event.endsDay ?? 0) < day || event.completed || event.failed) {
    event = createTerritorialWeeklyEvent(baseTerritories, day, now);
    created = Boolean(event);
  }
  if (!event) {
    return { territories: baseTerritories, event: null, player: saveData?.player, inventory: saveData?.inventory || {}, log: saveData?.log || [], note: saveData?.note || null, completed: false, created, penalized: false };
  }

  const target = baseTerritories.find((territory) => Number(territory.id) === Number(event.territoryId));
  const isControlled = target?.controller === playerName;
  const isStable = Number(target?.stability ?? 0) >= Number(event.targetStability ?? 70);
  let territories = baseTerritories;
  let player = saveData?.player || {};
  let inventory = { ...(saveData?.inventory || {}) };
  let log = saveData?.log || [];
  let note = saveData?.note || null;
  let completed = false;
  let penalized = false;

  if (isControlled && isStable) {
    const rewardCredits = Number(event.reward?.credits ?? 0);
    const rewardXp = Number(event.reward?.xp ?? 0);
    const rewardResources = Array.isArray(event.reward?.resources) ? event.reward.resources : [];
    rewardResources.forEach((resource) => {
      inventory[resource.key] = round2(Number(inventory[resource.key] || 0) + Number(resource.amount || 0));
    });
    player = { ...applyPlayerXpGain(player, rewardXp), credits: round2(Number(player?.credits ?? 0) + rewardCredits) };
    event = { ...event, completed: true, completedAt: now };
    completed = true;
    const resourceText = rewardResources.length ? ` + ${rewardResources.map((r) => `${r.amount} ${r.key}`).join(', ')}` : '';
    log = addLog(log, `Foco territorial completado: ${event.territoryName}. +${rewardCredits.toFixed(2)} creditos +${rewardXp} XP${resourceText}`);
    note = { msg: `Foco territorial completado: ${event.territoryName}`, type: 'success' };
  } else if (Number(event.lastPenaltyDay ?? 0) < day) {
    territories = baseTerritories.map((territory) => {
      if (Number(territory.id) !== Number(event.territoryId)) return territory;
      return {
        ...territory,
        threat: clamp(Number(territory.threat ?? 0) + (isControlled ? 3 : 7), 0, 100),
        stability: clamp(Number(territory.stability ?? 0) - (isControlled ? 1 : 4), 0, 100),
      };
    });
    event = { ...event, lastPenaltyDay: day };
    penalized = true;
    log = addLog(log, `Foco territorial activo: ${event.territoryName} gana presion por resolver.`);
    note = created
      ? { msg: `Nuevo foco territorial: ${event.territoryName}`, type: 'warn' }
      : note;
  }

  return { territories, event, player, inventory, log, note, completed, created, penalized };
};


export const getDefaultTerritoryState = (territory) => ({
  stability: territory?.controller ? 72 : 54,
  threat:    territory?.controller ? 28 : 18,
  fortification: 0,
});

export const TERRITORY_OPERATION_TYPES = {
  conquest: {
    label: 'Conquista lenta',
    durationMs: 36 * 60 * 60 * 1000,
    counter: 'physical',
  },
  sabotage: {
    label: 'Sabotaje encubierto',
    durationMs: 24 * 60 * 60 * 1000,
    counter: 'counterIntel',
  },
  hack: {
    label: 'Intrusion hacker',
    durationMs: 18 * 60 * 60 * 1000,
    counter: 'cyber',
  },
  spy: {
    label: 'Espionaje',
    durationMs: 16 * 60 * 60 * 1000,
    counter: 'counterIntel',
  },
};

export const DEFENSE_ASSET_TYPES = {
  security: {
    label: 'Seguridad privada',
    defense: { physical: 16, counterIntel: 4 },
  },
  informants: {
    label: 'Red de informantes',
    defense: { counterIntel: 16, social: 5 },
  },
  cyber: {
    label: 'Firewall corporativo',
    defense: { cyber: 18, counterIntel: 3 },
  },
  legal: {
    label: 'Oficina legal',
    defense: { legal: 18, economic: 4 },
  },
  media: {
    label: 'Medios locales',
    defense: { social: 16, legal: 4 },
  },
  logistics: {
    label: 'Centro logistico',
    defense: { economic: 12, physical: 8 },
  },
};

const DEFENSE_KEYS = ['physical', 'cyber', 'counterIntel', 'legal', 'social', 'economic'];

export const TERRITORY_DEFENSE_RESPONSE_TYPES = {
  lockdown: {
    label: 'Alerta fisica',
    defense: { physical: 22, economic: 6 },
    durationMs: 12 * 60 * 60 * 1000,
  },
  counterintel: {
    label: 'Contrainteligencia',
    defense: { counterIntel: 24, cyber: 6 },
    durationMs: 12 * 60 * 60 * 1000,
  },
  cyber: {
    label: 'Ciberdefensa',
    defense: { cyber: 26, counterIntel: 4 },
    durationMs: 12 * 60 * 60 * 1000,
  },
  media: {
    label: 'Contrapropaganda',
    defense: { social: 22, legal: 6 },
    durationMs: 12 * 60 * 60 * 1000,
  },
};

export const normalizeTerritoryDefenseAssets = (assets = [], fortification = 0) => {
  const incoming = Array.isArray(assets) ? assets : [];
  const normalized = incoming
    .filter((asset) => asset && DEFENSE_ASSET_TYPES[asset.type])
    .map((asset) => ({
      type: asset.type,
      level: clamp(Number(asset.level ?? 1), 1, 5),
      hidden: asset.hidden !== false,
      installedAt: Number(asset.installedAt ?? Date.now()),
    }));

  if (normalized.length > 0) return normalized.slice(0, 8);

  const legacyLevel = Math.max(0, Math.floor(Number(fortification ?? 0) / 25));
  if (legacyLevel <= 0) return [];

  return [
    { type: 'security', level: clamp(legacyLevel, 1, 5), hidden: true, installedAt: Date.now() },
  ];
};

export const getTerritoryDefenseProfile = (territory = {}) => {
  const profile = DEFENSE_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
  const assets = normalizeTerritoryDefenseAssets(territory.defenseAssets, territory.fortification);
  const fortBase = Number(territory.fortification ?? 0) * 0.22;
  const stabilityBase = Math.max(0, Number(territory.stability ?? 0) - 45) * 0.12;

  DEFENSE_KEYS.forEach((key) => {
    profile[key] += fortBase + stabilityBase;
  });

  assets.forEach((asset) => {
    const def = DEFENSE_ASSET_TYPES[asset.type]?.defense || {};
    Object.entries(def).forEach(([key, value]) => {
      profile[key] = Number(profile[key] ?? 0) + Number(value ?? 0) * Number(asset.level ?? 1);
    });
  });

  const response = normalizeTerritoryDefenseResponse(territory.defenseResponse);
  if (response && response.expiresAt > Date.now()) {
    const def = TERRITORY_DEFENSE_RESPONSE_TYPES[response.type]?.defense || {};
    Object.entries(def).forEach(([key, value]) => {
      profile[key] = Number(profile[key] ?? 0) + Number(value ?? 0);
    });
  }

  return DEFENSE_KEYS.reduce((acc, key) => ({ ...acc, [key]: clamp(Math.round(profile[key]), 0, 100) }), {});
};

export const createTerritoryDefenseResponse = (type = 'counterintel', now = Date.now()) => {
  const def = TERRITORY_DEFENSE_RESPONSE_TYPES[type] || TERRITORY_DEFENSE_RESPONSE_TYPES.counterintel;
  return {
    type,
    label: def.label,
    startedAt: now,
    expiresAt: now + Number(def.durationMs ?? 12 * 60 * 60 * 1000),
  };
};

export const normalizeTerritoryDefenseResponse = (response) => {
  if (!response || typeof response !== 'object') return null;
  const type = TERRITORY_DEFENSE_RESPONSE_TYPES[response.type] ? response.type : 'counterintel';
  const startedAt = Number(response.startedAt ?? Date.now());
  const expiresAt = Number(response.expiresAt ?? startedAt);
  if (expiresAt <= Date.now()) return null;
  return {
    ...response,
    type,
    label: response.label || TERRITORY_DEFENSE_RESPONSE_TYPES[type].label,
    startedAt,
    expiresAt,
  };
};

export const getTerritoryOperationProgress = (operation, now = Date.now()) => {
  if (!operation || typeof operation !== 'object') return 0;
  const startedAt = Number(operation.startedAt ?? now);
  const resolvesAt = Number(operation.resolvesAt ?? startedAt);
  const duration = Math.max(1, resolvesAt - startedAt);
  return clamp(((now - startedAt) / duration) * 100, 0, 100);
};

export const getTerritoryOperationEtaMs = (operation, now = Date.now()) => {
  if (!operation || typeof operation !== 'object') return 0;
  return Math.max(0, Number(operation.resolvesAt ?? now) - now);
};

export const createTerritoryOperation = ({
  type = 'conquest',
  ownerName = '',
  targetController = null,
  power = 0,
  stealth = 0,
  now = Date.now(),
  durationMs,
} = {}) => {
  const def = TERRITORY_OPERATION_TYPES[type] || TERRITORY_OPERATION_TYPES.conquest;
  const duration = Math.max(60 * 60 * 1000, Number(durationMs ?? def.durationMs));
  return {
    type,
    ownerName,
    targetController,
    phase: 'preparing',
    power: Math.max(0, Number(power ?? 0)),
    stealth: clamp(Number(stealth ?? 0), 0, 100),
    detected: false,
    detectionConfidence: 0,
    startedAt: now,
    resolvesAt: now + duration,
    updatedAt: now,
  };
};

export const normalizeTerritoryOperation = (operation) => {
  if (!operation || typeof operation !== 'object') return null;
  const type = TERRITORY_OPERATION_TYPES[operation.type] ? operation.type : 'conquest';
  const startedAt = Number(operation.startedAt ?? Date.now());
  const resolvesAt = Math.max(startedAt + 60 * 60 * 1000, Number(operation.resolvesAt ?? startedAt + TERRITORY_OPERATION_TYPES[type].durationMs));
  return {
    ...operation,
    type,
    phase: operation.phase || 'preparing',
    power: Math.max(0, Number(operation.power ?? 0)),
    stealth: clamp(Number(operation.stealth ?? 0), 0, 100),
    detected: Boolean(operation.detected),
    detectionConfidence: clamp(Number(operation.detectionConfidence ?? 0), 0, 100),
    startedAt,
    resolvesAt,
    updatedAt: Number(operation.updatedAt ?? Date.now()),
  };
};

export const getTerritoryCampaignStage = (progress = 0) => {
  const pct = clamp(Number(progress ?? 0), 0, 100);
  if (pct >= 76) return { id: 'consolidation', label: 'Consolidacion', next: 'Cerrar dominio' };
  if (pct >= 51) return { id: 'assault', label: 'Asalto', next: 'Romper defensa' };
  if (pct >= 26) return { id: 'sabotage', label: 'Sabotaje', next: 'Abrir brecha' };
  return { id: 'recon', label: 'Reconocimiento', next: 'Levantar frente' };
};

export const getTerritoryCampaign = (territory, playerName = '') => {
  const campaign = territory?.campaign && typeof territory.campaign === 'object'
    ? territory.campaign
    : null;
  if (!campaign || campaign.ownerName !== playerName) {
    return { ownerName: playerName, progress: 0, stage: getTerritoryCampaignStage(0), attempts: 0 };
  }

  const progress = clamp(Number(campaign.progress ?? 0), 0, 100);
  return {
    ...campaign,
    ownerName: playerName,
    progress,
    attempts: Math.max(0, Number(campaign.attempts ?? 0)),
    stage: getTerritoryCampaignStage(progress),
  };
};

export const normalizeEnemyCampaign = (campaign) => {
  if (!campaign || typeof campaign !== 'object') return null;
  const progress = clamp(Number(campaign.progress ?? 0), 0, 100);
  return {
    ...campaign,
    attackerName: campaign.attackerName || 'Rival regional',
    progress,
    stageId: getTerritoryCampaignStage(progress).id,
    startedAt: Number(campaign.startedAt ?? Date.now()),
    updatedAt: Number(campaign.updatedAt ?? Date.now()),
  };
};

export const normalizeTerritories = (territories) => {
  const incoming = Array.isArray(territories) ? territories : [];
  const savedById = new Map(incoming.map((territory) => [Number(territory?.id), territory]));
  const knownIds = new Set(INIT_TERRITORIES.map((territory) => Number(territory.id)));
  const merged = INIT_TERRITORIES.map((baseTerritory) => ({
    ...baseTerritory,
    ...(savedById.get(Number(baseTerritory.id)) || {}),
  }));

  incoming.forEach((territory) => {
    if (!knownIds.has(Number(territory?.id))) merged.push(territory);
  });

  return merged.map((territory) => {
    const d = getDefaultTerritoryState(territory);
    return {
      ...territory,
      stability:      clamp(Number(territory?.stability      ?? d.stability),      0, 100),
      threat:         clamp(Number(territory?.threat         ?? d.threat),         0, 100),
      fortification:  clamp(Number(territory?.fortification  ?? d.fortification),  0, 100),
      defenseAssets: normalizeTerritoryDefenseAssets(territory?.defenseAssets, territory?.fortification ?? d.fortification),
      defenseResponse: normalizeTerritoryDefenseResponse(territory?.defenseResponse),
      hiddenDefense: getTerritoryDefenseProfile(territory),
      activeOperation: normalizeTerritoryOperation(territory?.activeOperation),
      sabotageOperation: normalizeTerritoryOperation(territory?.sabotageOperation),
      intelOperation: normalizeTerritoryOperation(territory?.intelOperation),
      hackOperation: normalizeTerritoryOperation(territory?.hackOperation),
      intelReport: territory?.intelReport && typeof territory.intelReport === 'object'
        ? {
            ...territory.intelReport,
            createdAt: Number(territory.intelReport.createdAt ?? Date.now()),
            expiresAt: Number(territory.intelReport.expiresAt ?? Date.now() + 48 * 60 * 60 * 1000),
          }
        : null,
      customName: typeof territory?.customName === 'string' ? territory.customName.slice(0, 36) : '',
      campaign: territory?.campaign && typeof territory.campaign === 'object'
        ? {
            ...territory.campaign,
            progress: clamp(Number(territory.campaign.progress ?? 0), 0, 100),
            attempts: Math.max(0, Number(territory.campaign.attempts ?? 0)),
            operation: normalizeTerritoryOperation(territory.campaign.operation),
          }
        : null,
      enemyCampaign: normalizeEnemyCampaign(territory?.enemyCampaign),
    };
  });
};

export const resolveTerritoryPressure = (saveData) => {
  const playerName = saveData?.player?.name;
  const researchEffects = getCombinedEffects(saveData?.research, saveData?.hq);
  const planetEffects = getPlanetEffects(getCurrentPlanetIdFromSave(saveData));

  if (!playerName) {
    return { territories: normalizeTerritories(saveData?.territories), alerts: [] };
  }

  const alerts = [];
  const territories = normalizeTerritories(saveData?.territories).map((territory) => {
    const isMine = territory.controller === playerName;
    const fort = Number(territory.fortification ?? 0);
    const enemyCampaign = normalizeEnemyCampaign(territory.enemyCampaign);

    // ── Territorio no controlado por el jugador ──────────────────────────────
    if (!isMine) {
      // Opción C: decaimiento de amenaza para territorios no propios también
      const currentThreat = Number(territory.threat ?? 0);
      const decayedThreat = currentThreat <= TERRITORY_THREAT_DECAY_CAP
        ? clamp(currentThreat - TERRITORY_THREAT_DECAY * 0.5, 8, TERRITORY_THREAT_DECAY_CAP)
        : currentThreat;
      return {
        ...territory,
        enemyCampaign: enemyCampaign && territory.controller
          ? normalizeEnemyCampaign({ ...enemyCampaign, progress: Math.max(0, enemyCampaign.progress - 4), updatedAt: Date.now() })
          : null,
        threat: territory.controller
          ? clamp(decayedThreat + (Math.random() - 0.5) * 5, 6, 44)
          : clamp(decayedThreat, 6, 42),
        stability: clamp(Number(territory.stability ?? 0) + (territory.controller ? 0.8 : 0.25), 36, 88),
        fortification: clamp(fort * (0.99 * Number(researchEffects.territoryFortificationDecayMult ?? 1)), 0, 100),
      };
    }

    // ── Territorio propio ────────────────────────────────────────────────────
    const attackerPool = (saveData?.npcs?.length ? saveData.npcs : NPC_PLAYERS)
      .filter((npc) => npc?.name && npc.name !== playerName);
    const attacker = attackerPool.length ? randFrom(attackerPool) : null;
    const pressureRoll = Math.random();
    const hasNamedPressure = Boolean(attacker) && pressureRoll > 0.58;
    const attackerLevel = Math.max(1, Number(attacker?.level ?? 3));
    const defenseProfile = getTerritoryDefenseProfile(territory);
    const region = getRegionByTerritoryId(territory.id);
    const strategicProfile = region ? getRegionEconomy(region.key, getCurrentPlanetIdFromSave(saveData))?.strategicProfile : null;
    const strategicDefense = Number(strategicProfile?.defenseBonus ?? 0);
    const strategicThreatReduction = Number(strategicProfile?.threatReduction ?? 0);
    const activeResponse = normalizeTerritoryDefenseResponse(territory.defenseResponse);
    const fortMitigation = clamp((fort + strategicDefense + Number(defenseProfile.physical ?? 0) * 0.7 + Number(defenseProfile.counterIntel ?? 0) * 0.35) / 180, 0, 0.86);

    const rawNpcPressure = hasNamedPressure
      ? (1.1 + Math.random() * 2.0 + attackerLevel * 0.18)
        * Number(researchEffects.territoryThreatMult ?? 1)
        * Number(planetEffects.territoryThreatMult ?? 1)
        * (1 - strategicThreatReduction)
        * (1 - fortMitigation)
      : 0;

    const organicPressure = (Math.random() * 0.65 + 0.18)
      * Number(researchEffects.territoryThreatMult ?? 1)
      * Number(planetEffects.territoryThreatMult ?? 1)
      * (1 - strategicThreatReduction);

    const pressureThreat = Math.max(0, rawNpcPressure);
    const currentThreat = Number(territory.threat ?? 0);
    const shouldStartEnemyCampaign = !enemyCampaign && Boolean(attacker) && pressureRoll > 0.66 && (currentThreat >= 18 || Number(territory.stability ?? 0) <= 84 || fort < 35);
    const enemyProgressGain = enemyCampaign || shouldStartEnemyCampaign
      ? Math.max(1.5, (pressureThreat || 0.8) * 2.4 + (100 - fort) * 0.025 + (100 - Number(territory.stability ?? 0)) * 0.018)
      : 0;
    const nextEnemyCampaign = enemyCampaign || shouldStartEnemyCampaign
      ? normalizeEnemyCampaign({
          ...(enemyCampaign || {}),
          attackerName: enemyCampaign?.attackerName || attacker?.name || 'Rival regional',
          targetController: playerName,
          progress: Number(enemyCampaign?.progress ?? 0) + enemyProgressGain,
          startedAt: enemyCampaign?.startedAt || Date.now(),
          updatedAt: Date.now(),
        })
      : null;

    // Opción C: decaimiento natural si amenaza < umbral y no hay presión activa
    const threatDecay = (currentThreat <= TERRITORY_THREAT_DECAY_CAP && pressureThreat < 1.0)
      ? TERRITORY_THREAT_DECAY
      : 0;

    const nextThreat = clamp(
      currentThreat
        + organicPressure
        + pressureThreat
        - fort * 0.22
        - Number(defenseProfile.counterIntel ?? 0) * 0.035
        - threatDecay,
      0, 100
    );

    const pressureStabilityHit = pressureThreat > 0
      ? Math.max(0.2, pressureThreat * 0.24 - fort * 0.024)
      : 0;

    const rawDelta = nextThreat > 84 ? -(Math.random() * 1.7 + 0.9 + pressureStabilityHit * 0.55)
      : nextThreat > 64 ? -(Math.random() * 0.9 + 0.2 + pressureStabilityHit * 0.35)
      : Math.random() * 1.5 + fort * 0.022 - pressureStabilityHit * 0.2;

    const delta = rawDelta < 0
      ? rawDelta * Number(researchEffects.territoryStabilityLossMult ?? 1)
      : rawDelta + Number(researchEffects.territoryReinforceStability ?? 0) * 0.03;

    const nextStability = clamp(Number(territory.stability ?? 0) + delta, 0, 100);
    const nextFort = clamp(fort * (0.992 * Number(researchEffects.territoryFortificationDecayMult ?? 1)), 0, 100);

    const pressureMeta = pressureThreat > 0.5
      ? {
          lastPressureAt: Date.now(),
          lastPressureAttacker: attacker?.name || 'Rival regional',
          lastPressureThreat: round2(pressureThreat),
          lastPressureStabilityLoss: round2(Math.max(0, -delta)),
        }
      : {};

    if (pressureThreat > 1.2) {
      alerts.push({
        type: 'pressure',
        territoryName: territory.name,
        attackerName: attacker?.name || 'Rival regional',
        threat: round2(pressureThreat),
        mitigated: Math.round(fortMitigation * 100),
      });
    }

    // ── Opción A: Fase de asedio antes de perder el sector ───────────────────
    if (nextEnemyCampaign && (!enemyCampaign || Math.floor(nextEnemyCampaign.progress / 25) > Math.floor(Number(enemyCampaign.progress ?? 0) / 25))) {
      alerts.push({
        type: 'enemy_campaign',
        territoryName: territory.name,
        attackerName: nextEnemyCampaign.attackerName,
        progress: Math.round(nextEnemyCampaign.progress),
        stage: getTerritoryCampaignStage(nextEnemyCampaign.progress).label,
      });
    }

    if (nextEnemyCampaign?.progress >= 100) {
      alerts.push({
        type: 'lost',
        territoryId: territory.id,
        territoryName: territory.customName || territory.name,
        attackerName: nextEnemyCampaign.attackerName,
        companiesCount: (saveData?.companies || []).filter((company) => Number(company?.territoryId) === Number(territory.id)).length,
        fortification: Math.round(nextFort),
      });
      return {
        ...territory,
        ...pressureMeta,
        controller: nextEnemyCampaign.attackerName,
        stability: 58,
        threat: 36,
        fortification: Math.max(0, nextFort - 14),
        siegeTick: 0,
        siegeAttacker: null,
        siegeStartedAt: null,
        enemyCampaign: null,
        campaign: null,
        sectorMemory: updateTerritoryMemory(territory, 'lost', { actor: nextEnemyCampaign.attackerName, day: saveData?.day }),
      };
    }

    const isInSiege = Boolean(territory.siegeTick);
    const siegeTick = Number(territory.siegeTick ?? 0);

    if (nextThreat >= 99 || nextStability <= 4) {
      if (isInSiege && siegeTick >= TERRITORY_SIEGE_TICKS) {
        // Asedio completado — sector perdido definitivamente
        alerts.push({
          type: 'lost',
          territoryId: territory.id,
          territoryName: territory.customName || territory.name,
          attackerName: attacker?.name || 'Rival regional',
          companiesCount: (saveData?.companies || []).filter((company) => Number(company?.territoryId) === Number(territory.id)).length,
          fortification: Math.round(nextFort),
        });
        return {
          ...territory,
          ...pressureMeta,
          controller: null,
          stability: 52,
          threat: 30,
          fortification: Math.max(0, nextFort - 8),
          siegeTick: 0,
          siegeAttacker: null,
          siegeStartedAt: null,
          enemyCampaign: null,
          sectorMemory: updateTerritoryMemory(territory, 'lost', { actor: attacker?.name || 'Rival regional', day: saveData?.day }),
        };
      } else {
        // Primer tick en zona de pérdida — iniciar o avanzar asedio
        const newSiegeTick = isInSiege ? siegeTick + 1 : 1;
        const siegeAttacker = territory.siegeAttacker || attacker?.name || 'Rival regional';
        alerts.push({
          type: 'siege',
          territoryName: territory.name,
          attackerName: siegeAttacker,
          ticksLeft: TERRITORY_SIEGE_TICKS - newSiegeTick,
        });
        return {
          ...territory,
          ...pressureMeta,
          stability: clamp(nextStability, 2, 100),
          threat: clamp(nextThreat, 0, 99),
          fortification: nextFort,
          enemyCampaign: nextEnemyCampaign,
          siegeTick: newSiegeTick,
          siegeAttacker,
          siegeStartedAt: territory.siegeStartedAt || Date.now(),
        };
      }
    }

    // Si sale de zona crítica, cancelar asedio
    const clearedSiege = isInSiege && nextThreat < 88 && nextStability > 12
      ? { siegeTick: 0, siegeAttacker: null, siegeStartedAt: null }
      : {};

    if (isInSiege && clearedSiege.siegeTick === 0) {
      alerts.push({ type: 'siege_lifted', territoryName: territory.name });
    }

    if (nextThreat >= 82 || nextStability <= 22) {
      alerts.push({ type: 'critical', territoryName: territory.name, attackerName: attacker?.name || 'Rival regional' });
    }

    return {
      ...territory,
      ...pressureMeta,
      ...clearedSiege,
      enemyCampaign: nextEnemyCampaign,
      stability: nextStability,
      threat: nextThreat,
      fortification: nextFort,
      defenseResponse: activeResponse,
    };
  });

  return { territories, alerts };
};
export const getRegionBonusRate = (regionKey, resourceKey, planetId = STARTER_PLANET_ID) => {
  const region = getRegionEconomy(regionKey, planetId);
  if (!region) return 0;
  return region.bonusResource === resourceKey ? clamp(Number(region.bonusRate ?? 0), 0, 0.01) : 0;
};

export const getTerritoryControlBonusRate = (
  regionKey, resourceKey, territories, playerName, research = {}, planetId = STARTER_PLANET_ID
) => {
  if (!regionKey || !resourceKey || !playerName || !Array.isArray(territories)) return 0;
  const region = getRegionEconomy(regionKey, planetId);
  if (!region || region.bonusResource !== resourceKey) return 0;
  const territory = territories.find((t) => t.id === region.territoryId);
  if (!territory || territory.controller !== playerName) return 0;
  const re = getResearchEffects(research);
  const strategicProductionBonus = Number(region?.strategicProfile?.productionBonus ?? 0);
  const stabilityBonus   = clamp((Number(territory.stability ?? 0) - 40) / 15000, 0, 0.004);
  const fortBonus        = clamp(Number(territory.fortification ?? 0) / 25000, 0, 0.004);
  const regionBonus = getRegionBonusRate(regionKey, resourceKey, planetId);
  const rawBonus =
    stabilityBonus + fortBonus + strategicProductionBonus
      + Number(re.territoryControlBaseBonus ?? 0) * 0.1
      + clamp(
          ((Number(territory.stability ?? 0) + Number(territory.fortification ?? 0)) / 200)
            * Number(re.territoryControlScalingBonus ?? 0) * 0.1,
          0, 0.006
        );
  return Math.round(clamp(rawBonus, 0, Math.max(0, 0.03 - regionBonus)) * 10000) / 10000;
};

export const getBestControlledResourceBonus = (
  resourceKey, territories = [], playerName = '', research = {}, planetId = STARTER_PLANET_ID
) => {
  if (!resourceKey || !playerName || !Array.isArray(territories)) {
    return { bonusRate: 0, regionalBonusRate: 0, controlBonusRate: 0, region: null };
  }

  return REGION_LIST
    .map((baseRegion) => getRegionEconomy(baseRegion.key, planetId))
    .filter((region) => region?.bonusResource === resourceKey)
    .map((region) => {
      const territory = territories.find((item) => Number(item?.id) === Number(region.territoryId));
      const isControlled = territory?.controller === playerName;
      const regionalBonusRate = isControlled ? getRegionBonusRate(region.key, resourceKey, planetId) : 0;
      const controlBonusRate = isControlled
        ? getTerritoryControlBonusRate(region.key, resourceKey, territories, playerName, research, planetId)
        : 0;
      return {
        region,
        regionalBonusRate,
        controlBonusRate,
        bonusRate: clamp(regionalBonusRate + controlBonusRate, 0, 0.01),
      };
    })
    .sort((a, b) => b.bonusRate - a.bonusRate)[0] || {
      bonusRate: 0,
      regionalBonusRate: 0,
      controlBonusRate: 0,
      region: null,
    };
};

export const getControlledStrategicEffects = (
  territories = [], playerName = '', planetId = STARTER_PLANET_ID
) => {
  if (!playerName || !Array.isArray(territories)) {
    return {
      productionBonus: 0,
      workCreditsBonus: 0,
      workDurationMult: 1,
      contractValueBonus: 0,
      defenseBonus: 0,
      threatReduction: 0,
      operationRewardBonus: 0,
      profiles: [],
    };
  }

  const controlledProfiles = REGION_LIST
    .map((baseRegion) => {
      const region = getRegionEconomy(baseRegion.key, planetId);
      const territory = territories.find((item) => Number(item?.id) === Number(region?.territoryId));
      if (!region || territory?.controller !== playerName) return null;
      return {
        territoryId: territory.id,
        territoryName: territory.name || region.name,
        regionName: region.name,
        type: region.strategicType,
        ...(region.strategicProfile || {}),
      };
    })
    .filter(Boolean);

  const sum = (key) => controlledProfiles.reduce((total, profile) => total + Number(profile?.[key] ?? 0), 0);
  const durationMult = controlledProfiles.reduce(
    (mult, profile) => mult * Number(profile?.workDurationMult ?? 1),
    1
  );

  return {
    productionBonus: clamp(sum('productionBonus'), 0, 0.06),
    workCreditsBonus: clamp(sum('workCreditsBonus'), 0, 0.08),
    workDurationMult: clamp(durationMult, 0.88, 1),
    contractValueBonus: clamp(sum('contractValueBonus'), 0, 0.18),
    defenseBonus: clamp(sum('defenseBonus'), 0, 24),
    threatReduction: clamp(sum('threatReduction'), 0, 0.18),
    operationRewardBonus: clamp(sum('operationRewardBonus'), 0, 0.3),
    profiles: controlledProfiles,
  };
};

export const getCompanyOccupancyState = (
  companyRegionKey, territories = [], playerName = '', planetId = STARTER_PLANET_ID, companyTerritoryId = null
) => {
  void playerName;
  const region = getRegionEconomy(companyRegionKey, planetId);
  const targetTerritoryId = companyTerritoryId ?? region?.territoryId;
  const territory = targetTerritoryId !== undefined && targetTerritoryId !== null
    ? territories.find((t) => Number(t.id) === Number(targetTerritoryId))
    : null;
  const controller = territory?.controller || null;
  return {
    active:     true,
    productionFactor: 1,
    occupationTaxFactor: 0,
    territoryId: targetTerritoryId ?? null,
    controller,
    status:     'active',
    occupiedBy: null,
  };
};

const getCompanyMaintenanceCreditsPerHour = (typeKey, meta) => {
  if (!meta || typeKey === 'research_lab') return 0;
  const tier = Math.max(1, Number(meta.tier ?? 1));
  return round2(Number(meta.buildCost ?? 0) * (0.006 + tier * 0.002));
};

export const getControlledTerritoryCount = (territories = [], playerName = '') =>
  (territories || []).filter((t) => t.controller === playerName).length;

export const getTerritoryAttackPower = ({ player, inventory, territories, playerName, planetId, research, hq }) => {
  const re = getCombinedEffects(research, hq);
  const pe = getPlanetEffects(planetId);
  const doctrineBonus = Math.max(0, (Number(re.conquestPowerMult ?? 1) - 1) * 14);
  const controlled = getControlledTerritoryCount(territories, playerName || player?.name);
  const mineralReserve = Math.sqrt(Math.max(0, Number(inventory?.mineral ?? 0)));
  const integrity = getIntegrityEffects(player);
  return (
    8 + Number(player?.level ?? 1) * 2.1
    + controlled * 0.7
    + mineralReserve * 1.0
    + doctrineBonus
    + Math.max(0, (Number(pe.conquestPowerMult ?? 1) - 1) * 14)
  ) * Number(integrity.conquestPowerMult ?? 1);
};

export const getTerritoryDefensePower = (territory) => {
  const base = territory?.controller ? 24 : 15;
  return Math.max(
    8,
    base
      + Number(territory?.stability     ?? 0) * 0.26
      + Number(territory?.fortification ?? 0) * 0.34
      - Number(territory?.threat        ?? 0) * 0.05
  );
};

export const getTerritoryBattlePreview = ({ territory, player, inventory, territories, playerName, planetId, research, hq }) => {
  if (!territory || territory.controller === (playerName || player?.name)) return null;
  const re = getResearchEffects(research);
  const campaign = getTerritoryCampaign(territory, playerName || player?.name);
  const atk = getTerritoryAttackPower({ player, inventory, territories, playerName, planetId, research, hq });
  const def = getTerritoryDefensePower(territory);
  const successChance = clamp(
    42 + (atk - def) * 3.4 + campaign.progress * 0.1,
    territory.controller ? 8 : 16,
    territory.controller ? 62 : 76
  );
  const rewardCredits = round2(
    Math.max(4, (def / 4.2 + Number(territory?.threat ?? 0) * 0.06) * Number(re.conquestRewardMult ?? 1))
  );
  const progressOnWin = territory.controller ? 26 : 38;
  const progressOnLoss = territory.controller ? 6 : 10;
  return {
    attackPower: round2(atk),
    defensePower: round2(def),
    successChance: Math.round(successChance),
    rewardCredits,
    campaignProgress: Math.round(campaign.progress),
    campaignStage: campaign.stage,
    progressOnWin,
    progressOnLoss,
  };
};


export const groupCompaniesByType = (companies) => {
  const grouped = {};
  (companies || []).forEach((company) => {
    const typeKey = company?.companyType || company?.type;
    if (!typeKey || company?.active === false) return;
    if (!grouped[typeKey]) grouped[typeKey] = { typeKey, items: [] };
    grouped[typeKey].items.push(company);
  });
  return grouped;
};

export const getHydratedCompanyMeta = (company, context = {}) => {
  const typeKey = company.companyType || company.type;
  const meta = COMPANY_TYPES[typeKey];
  if (!meta) return null;

  const now = Number(context.now ?? Date.now());
  const groupCount = Number(context.groupCount ?? 1);
  const regionKey = company.regionKey || context.regionKey || 'alpha-district';
  const territoryId = company.territoryId ?? context.territoryId ?? null;
  const occupancy = getCompanyOccupancyState(regionKey, context.territories, context.playerName, context.planetId, territoryId, company.ownerName || context.playerName);
  const maintenancePaused = Boolean(company?.maintenancePaused);
  const effectiveOccupancy = maintenancePaused
    ? { ...occupancy, active: true, productionFactor: 0, occupationTaxFactor: 0, status: 'maintenance_paused' }
    : occupancy;
  const sectorBonus = getBestControlledResourceBonus(
    meta.resourceKey,
    context.territories,
    context.playerName,
    context.research,
    context.planetId
  );
  const regionalBonusRate = sectorBonus.regionalBonusRate;
  const controlBonusRate = sectorBonus.controlBonusRate;
  const bonusRate = sectorBonus.bonusRate;

  const boostUntil = Number(context.adBoosts?.companyBoostUntil ?? 0);
  const boostMult  = boostUntil > now ? Number(context.adBoosts?.companyBoostMultiplier ?? getResearchEffects(context.research).companyBoostMultiplier) : 1;
  const re = getCombinedEffects(context.research, context.hq);
  const pe = getPlanetEffects(context.planetId);
  const resourceRateMult = Number(pe.resourceRateMult?.[meta.resourceKey] ?? 1);
  const groupMult = getCompanyGroupMultiplier(groupCount);
  const effectiveGroupRate =
    Number(meta.ratePerHour ?? 0)
    * Number(re.companyRateMult ?? 1)
    * Number(pe.companyRateMult ?? 1)
    * resourceRateMult
    * (1 + bonusRate)
    * groupMult
    * boostMult;
  const effectiveCompanyRate = groupCount > 0 ? effectiveGroupRate / groupCount : effectiveGroupRate;

  const maxStorage = Math.round(
    Number(company.maxStorage ?? meta.maxStorage ?? 0)
    * Number(re.companyStorageMult ?? 1)
    * Number(pe.companyStorageMult ?? 1)
  );
  const currentStorage = Number(company.storage ?? 0);
  const lastTickAt = Number(
    new Date(company.lastTickAt ?? company.lastCollectedAt ?? company.createdAt ?? now).getTime()
    || now
  );
  const elapsedHours = Math.max(0, now - lastTickAt) / (1000 * 60 * 60);
  const grossPotentialProduced = elapsedHours * effectiveCompanyRate;
  const potentialProduced = grossPotentialProduced * Number(effectiveOccupancy.productionFactor ?? 1);
  const remainingStorage = Math.max(0, maxStorage - currentStorage);
  const maintenanceCreditsPerHour = getCompanyMaintenanceCreditsPerHour(typeKey, meta);
  const maintenanceCredits = elapsedHours * maintenanceCreditsPerHour;

  return {
    typeKey, meta, now, groupCount, companyRegionKey: regionKey,
    maxStorage, currentStorage, elapsedMs: Math.max(0, now - lastTickAt),
    bonusRate, regionalBonusRate, controlBonusRate, bonusRegionName: sectorBonus.region?.name || null, boostMult, effectiveGroupMultiplier: groupMult,
    effectiveCompanyRatePerHour: effectiveCompanyRate * Number(occupancy.productionFactor ?? 1),
    grossCompanyRatePerHour: effectiveCompanyRate,
    potentialProduced, remainingStorage, occupancy: effectiveOccupancy,
    maintenanceCreditsPerHour, maintenanceCredits,
  };
};

export const hydrateCompanies = (
  companies, regionKey, adBoosts = DEFAULT_AD_BOOSTS,
  territories = [], playerName = '', research = {}, planetId = 'nexus-prime', hq = {}
) => {
  if (!Array.isArray(companies)) return [];
  const now = Date.now();
  const withOcc = companies.map((c) => ({
    ...c,
    ...getCompanyOccupancyState(c?.regionKey || regionKey || 'alpha-district', territories, playerName, planetId, c?.territoryId ?? null, c?.ownerName || playerName),
  }));
  const grouped = groupCompaniesByType(withOcc);

  return withOcc.map((company) => {
    const typeKey = company?.companyType || company?.type;
    const compRegion = company?.regionKey || regionKey || 'alpha-district';
    const groupCount = grouped[typeKey]?.items?.length || 1;
    const meta = getHydratedCompanyMeta(company, { now, regionKey: compRegion, groupCount, adBoosts, territories, playerName, research, planetId, hq });
    if (!meta) return company;
    const produced = Math.min(meta.remainingStorage, meta.potentialProduced);
    return {
      ...company,
      companyType: typeKey, type: typeKey, regionKey: compRegion, territoryId: meta.occupancy.territoryId,
      name: company.name || meta.meta.name,
      maxStorage: meta.maxStorage,
      storage: round2(Math.min(meta.maxStorage, meta.currentStorage + produced)),
      lastCollectedAt: company.lastCollectedAt || company.createdAt || now,
      lastTickAt: now,
      effectiveRatePerHour: meta.effectiveCompanyRatePerHour,
      grossRatePerHour: meta.grossCompanyRatePerHour,
      productionFactor: meta.occupancy.productionFactor,
      occupationTaxFactor: meta.occupancy.occupationTaxFactor,
      occupationLossPerHour: round2(Math.max(0, meta.grossCompanyRatePerHour - meta.effectiveCompanyRatePerHour)),
      effectiveGroupMultiplier: meta.effectiveGroupMultiplier,
      bonusRate: meta.bonusRate,
      regionalBonusRate: meta.regionalBonusRate,
      controlBonusRate: meta.controlBonusRate,
      bonusRegionName: meta.bonusRegionName,
      companyCountInGroup: groupCount,
      active: meta.occupancy.active,
      status: meta.occupancy.status,
      occupiedBy: meta.occupancy.occupiedBy,
      occupationTaxPending: 0,
      occupationTaxResourceKey: meta.meta.resourceKey,
      maintenanceCreditsPerHour: meta.maintenanceCreditsPerHour,
      maintenancePendingCredits: round2(Number(company.maintenancePendingCredits ?? 0) + meta.maintenanceCredits),
    };
  });
};

export const hydrateCompaniesAndInventory = (
  companies, inventory, regionKey, adBoosts = DEFAULT_AD_BOOSTS,
  territories = [], playerName = '', research = {}, planetId = 'nexus-prime', hq = {}
) => {
  if (!Array.isArray(companies) || companies.length === 0) {
    return { companies: [], inventory: { ...(inventory || {}) } };
  }
  const now = Date.now();
  const withOcc = companies.map((c) => ({
    ...c,
    ...getCompanyOccupancyState(c?.regionKey || regionKey || 'alpha-district', territories, playerName, planetId, c?.territoryId ?? null, c?.ownerName || playerName),
  }));
  const grouped = groupCompaniesByType(withOcc);
  const nextInventory = { ...(inventory || {}) };
  let maintenanceCost = 0;

  const nextCompanies = withOcc.map((company) => {
    const typeKey = company?.companyType || company?.type;
    const compRegion = company?.regionKey || regionKey || 'alpha-district';
    const groupCount = grouped[typeKey]?.items?.length || 1;
    const meta = getHydratedCompanyMeta(company, { now, regionKey: compRegion, groupCount, adBoosts, territories, playerName, research, planetId, hq });
    if (!meta) return company;

    let produced = Math.min(meta.remainingStorage, meta.potentialProduced);
    if (meta.meta.inputs?.length) {
      const maxByInputs = meta.meta.inputs.reduce((min, input) => {
        const avail = Number(nextInventory[input.key] || 0);
        const per   = Number(input.amount || 0);
        return per <= 0 ? min : Math.min(min, avail / per);
      }, Number.POSITIVE_INFINITY);
      produced = Math.min(produced, Number.isFinite(maxByInputs) ? maxByInputs : 0);
      if (produced > 0) {
        meta.meta.inputs.forEach((input) => {
          nextInventory[input.key] = round2(Number(nextInventory[input.key] || 0) - Number(input.amount || 0) * produced);
        });
      } else {
        produced = 0;
      }
    }

    maintenanceCost = round2(maintenanceCost + meta.maintenanceCredits);

    return {
      ...company,
      companyType: typeKey, type: typeKey, regionKey: compRegion, territoryId: meta.occupancy.territoryId,
      name: company.name || meta.meta.name,
      maxStorage: meta.maxStorage,
      storage: round2(Math.min(meta.maxStorage, meta.currentStorage + produced)),
      lastCollectedAt: company.lastCollectedAt || company.createdAt || now,
      lastTickAt: now,
      effectiveRatePerHour: meta.effectiveCompanyRatePerHour,
      grossRatePerHour: meta.grossCompanyRatePerHour,
      productionFactor: meta.occupancy.productionFactor,
      occupationTaxFactor: meta.occupancy.occupationTaxFactor,
      occupationLossPerHour: round2(Math.max(0, meta.grossCompanyRatePerHour - meta.effectiveCompanyRatePerHour)),
      effectiveGroupMultiplier: meta.effectiveGroupMultiplier,
      bonusRate: meta.bonusRate,
      regionalBonusRate: meta.regionalBonusRate,
      controlBonusRate: meta.controlBonusRate,
      bonusRegionName: meta.bonusRegionName,
      companyCountInGroup: groupCount,
      active: meta.occupancy.active,
      status: meta.occupancy.status,
      occupiedBy: meta.occupancy.occupiedBy,
      occupationTaxPending: 0,
      occupationTaxResourceKey: meta.meta.resourceKey,
      maintenanceCreditsPerHour: meta.maintenanceCreditsPerHour,
      maintenancePendingCredits: round2(Number(company.maintenancePendingCredits ?? 0) + meta.maintenanceCredits),
    };
  });

  return { companies: nextCompanies, inventory: nextInventory, maintenanceCost };
};

export const getResearchLabCount = (companies = []) =>
  (companies || []).filter((c) =>
    (c?.companyType || c?.type) === 'research_lab'
    && c?.status !== 'occupied'
    && c?.active !== false
  ).length;

export const getResearchLabTimeMultiplier = (companies = [], planetId = 'nexus-prime') =>
  Math.max(
    0.55,
    (1 - getResearchLabCount(companies) * 0.1) * Number(getPlanetEffects(planetId).researchTimeMult ?? 1)
  );


export const getJobDurationSec = (job) => {
  const explicit = Number(job?.durationSec ?? 0);
  if (explicit > 0) return explicit;
  return JOB_DURATION_BY_LEVEL[Number(job?.unlockLevel ?? 1)] || 60;
};


export const getContractTemplatesForLevel = (level, planetId = STARTER_PLANET_ID) =>
  CONTRACT_TEMPLATES.filter((t) =>
    Number(t.unlockLevel ?? 1) <= Number(level ?? 1) &&
    (!Array.isArray(t.planetIds) || t.planetIds.includes(planetId))
  );

export const getContractSlotsForLevel = (level) =>
  Math.max(1, Math.min(CONTRACT_SLOTS, Number(level ?? 1)));

const CONTRACT_RESOURCE_TIERS = {
  water: 1,
  energy_cells: 1,
  mineral: 1,
  purified_water: 2,
  metal_components: 3,
  oxygen_tanks: 3,
  alloy_frames: 4,
  habitat_modules: 4,
};

const CONTRACT_VARIANTS = {
  standard: { label: 'Estable', qtyMult: 1, rewardMult: 1, xpMult: 1, durationMult: 1.7 },
  urgent: { label: 'Urgente', qtyMult: 0.55, rewardMult: 1.28, xpMult: 1.1, durationMult: 0.85 },
  premium: { label: 'Premium', qtyMult: 0.9, rewardMult: 1.34, xpMult: 1.18, durationMult: 2.4 },
  massive: { label: 'Masivo', qtyMult: 1.25, rewardMult: 1.18, xpMult: 1.35, durationMult: 7.5 },
};

const CONTRACT_CHAIN_BY_KEY = {
  metal_components: ['metal_components', 'alloy_frames', 'habitat_modules'],
  purified_water: ['purified_water', 'oxygen_tanks', 'habitat_modules'],
  energy_cells: ['energy_cells', 'metal_components', 'alloy_frames'],
};

const pickContractVariant = (level, template) => {
  if (template?.territoryExclusive) return CONTRACT_VARIANTS.premium;

  const safeLevel = Math.max(1, Number(level ?? 1));
  const roll = Math.random();

  if (safeLevel >= 12 && roll < 0.08) return CONTRACT_VARIANTS.massive;
  if (safeLevel >= 7 && roll < 0.24) return CONTRACT_VARIANTS.premium;
  if (safeLevel >= 4 && roll < 0.42) return CONTRACT_VARIANTS.urgent;

  return CONTRACT_VARIANTS.standard;
};

export const createContractFromTemplate = (template, level, now = Date.now(), planetId = STARTER_PLANET_ID) => {
  const mm = INIT_MARKET[template.key] || {};
  const safeLevel = Math.max(1, Number(level ?? 1));
  const unlockLevel = Math.max(1, Number(template.unlockLevel ?? 1));
  const levelBonus = Math.max(0, safeLevel - unlockLevel);
  const resourceTier = CONTRACT_RESOURCE_TIERS[template.key] || 1;
  const tierScale = 1 + Math.max(0, resourceTier - 1) * 0.18;
  const levelScale = 1 + Math.pow(levelBonus, 0.82) * (0.11 + resourceTier * 0.028);
  const exclusiveScale = Array.isArray(template.planetIds) && template.planetIds.length > 0 ? 1.15 : 1;
  const variant = pickContractVariant(safeLevel, template);
  const chainKeys = CONTRACT_CHAIN_BY_KEY[template.key] || null;
  const startsChain = !template.territoryExclusive && safeLevel >= 10 && chainKeys && Math.random() < 0.16;
  const chainStep = Number(template.chainStep ?? (startsChain ? 1 : 0));
  const chainTotal = Number(template.chainTotal ?? (startsChain ? chainKeys.length : 0));
  const strategicContractBonus = clamp(Number(template.strategicContractBonus ?? 0), 0, 0.25);
  const qty = Math.max(
    1,
    Math.round(
      getRandomInt(template.minQty, template.maxQty)
      * tierScale
      * levelScale
      * exclusiveScale
      * Number(variant.qtyMult ?? 1)
    )
  );
  const formulaRewardCredits = round2(
    Number(mm.base ?? 1) * qty * Number(template.rewardMult ?? 1.3) * Number(variant.rewardMult ?? 1) * (1 + strategicContractBonus)
  );
  const estimatedMarketUnitBuyPrice = round2(
    Number(mm.price ?? mm.base ?? 1) * MARKET_BUY_MARKUP
  );
  const antiArbitrageRewardCap = round2(
    estimatedMarketUnitBuyPrice * qty * CONTRACT_BUY_ARBITRAGE_CAP
  );
  const rewardCredits = round2(
    Math.min(formulaRewardCredits, antiArbitrageRewardCap)
  );
  const rewardXp = Math.round((Number(template.baseXp ?? 16) + qty * 4 + levelBonus * 3) * Number(variant.xpMult ?? 1));
  const durationMin = Math.max(8, Math.round(Number(template.durationMin ?? 20) * Number(variant.durationMult ?? 1)));
  return {
    id: template.id || `contract-${template.key}-${now}-${Math.random().toString(36).slice(2, 8)}`,
    icon: template.icon || mm.icon || '[]',
    title: chainStep > 0 ? `${template.label} ${chainStep}/${chainTotal}` : template.label,
    desc: chainStep > 0 ? `${template.detail} Entrega encadenada de produccion industrial.` : template.detail,
    contractKind: Object.entries(CONTRACT_VARIANTS).find(([, config]) => config === variant)?.[0] || 'standard',
    contractKindLabel: variant.label || 'Estable',
    contractChain: chainStep > 0 ? {
      id: template.chainId || `chain-${now}-${Math.random().toString(36).slice(2, 7)}`,
      keys: template.chainKeys || chainKeys,
      step: chainStep,
      total: chainTotal,
    } : null,
    itemKey: template.key,
    itemName: mm.name || template.key,
    qty,
    reward: { credits: rewardCredits, xp: rewardXp },
    baseRewardCredits: rewardCredits,
    expiresAt: now + durationMin * 60 * 1000,
    targetTab: template.targetTab || 'market',
    originPlanetId: Array.isArray(template.planetIds) ? planetId : null,
    exclusive: Array.isArray(template.planetIds) && template.planetIds.length > 0,
    territoryExclusive: Boolean(template.territoryExclusive),
    territoryId: template.territoryId ?? null,
    territoryName: template.territoryName || null,
    territoryController: template.territoryController || null,
    strategicDistrictLabel: template.strategicDistrictLabel || null,
    strategicContractBonus,
    completed: false, expired: false, eventBoost: false, eventBoostLabel: null,
  };
};

export const createNextChainedContract = (contract, level, now = Date.now(), planetId = STARTER_PLANET_ID) => {
  const chain = contract?.contractChain;
  if (!chain?.keys?.length || Number(chain.step ?? 0) >= Number(chain.total ?? 0)) return null;

  const nextStep = Number(chain.step ?? 1) + 1;
  const nextKey = chain.keys[nextStep - 1];
  const base = CONTRACT_TEMPLATES.find((template) => template.key === nextKey) || CONTRACT_TEMPLATES[0];
  return createContractFromTemplate({
    ...base,
    chainId: chain.id,
    chainKeys: chain.keys,
    chainStep: nextStep,
    chainTotal: chain.total,
    rewardMult: Number(base.rewardMult ?? 1.3) + 0.14 * nextStep,
    minQty: Math.round(Number(base.minQty ?? 1) * (1 + nextStep * 0.16)),
    maxQty: Math.round(Number(base.maxQty ?? 2) * (1 + nextStep * 0.18)),
  }, level, now, planetId);
};

export const createContracts = (level, count = getContractSlotsForLevel(level), usedKeys = [], planetId = STARTER_PLANET_ID) => {
  const pool = getContractTemplatesForLevel(level, planetId).filter((t) => !usedKeys.includes(t.key));
  const fallback = pool.length ? pool : getContractTemplatesForLevel(level, planetId);
  const result = [];
  const usedNow = [...usedKeys];
  while (result.length < count && fallback.length) {
    const avail = fallback.filter((t) => !usedNow.includes(t.key));
    const src = avail.length ? avail : fallback;
    const template = randFrom(src);
    result.push(createContractFromTemplate(template, level, Date.now(), planetId));
    usedNow.push(template.key);
  }
  return result;
};

const getTerritoryContractTemplate = (territory, level, planetId = STARTER_PLANET_ID, now = Date.now()) => {
  const region = getRegionByTerritoryId(territory?.id);
  const economy = region ? getRegionEconomy(region.key, planetId) : null;
  const resourceKey = economy?.bonusResource || territory?.bonus || 'mineral';
  const base = CONTRACT_TEMPLATES.find((template) => template.key === resourceKey) || CONTRACT_TEMPLATES[0];
  const territoryName = territory?.name || economy?.name || region?.name || 'Sector';
  const strategicProfile = economy?.strategicProfile || null;
  const strategicContractBonus = Number(strategicProfile?.contractValueBonus ?? 0);
  const unlockLevel = Math.max(4, Number(base?.unlockLevel ?? 1));
  const scale = Math.max(0, Number(level ?? 1) - unlockLevel);

  return {
    ...base,
    id: `territory-contract-${territory.id}-${resourceKey}-${now}-${Math.random().toString(36).slice(2, 8)}`,
    label: `Mandato de ${territoryName}`,
    detail: `Contrato exclusivo del territorio ${territoryName}. Solo esta disponible mientras controles el sector.${strategicProfile ? ` Distrito ${strategicProfile.label}: ${strategicProfile.effectsLabel}.` : ''}`,
    minQty: Math.max(1, Math.round(Number(base.minQty ?? 1) * 1.2 + scale * 1.4)),
    maxQty: Math.max(Number(base.maxQty ?? 2), Math.round(Number(base.maxQty ?? 2) * 1.35 + scale * 2.2)),
    rewardMult: Number(base.rewardMult ?? 1.5) + 0.35,
    baseXp: Number(base.baseXp ?? 16) + 12,
    durationMin: Math.max(22, Number(base.durationMin ?? 24) + 8),
    targetTab: base.targetTab || 'business',
    territoryExclusive: true,
    territoryId: territory.id,
    territoryName,
    territoryController: territory.controller || null,
    strategicDistrictLabel: strategicProfile?.label || null,
    strategicContractBonus,
  };
};

const isTerritoryContractStillControlled = (contract, territories = [], playerName = '') => {
  if (!contract?.territoryExclusive) return true;
  const territory = (territories || []).find((t) => Number(t.id) === Number(contract.territoryId));
  return Boolean(territory && playerName && territory.controller === playerName);
};

const createTerritoryContracts = (territories = [], playerName = '', level = 1, planetId = STARTER_PLANET_ID, existing = [], now = Date.now()) => {
  if (!playerName || Number(level ?? 1) < 4) return [];
  const existingTerritoryIds = new Set(
    (existing || [])
      .filter((contract) => contract?.territoryExclusive)
      .map((contract) => Number(contract.territoryId))
  );

  return (territories || [])
    .filter((territory) => territory?.controller === playerName)
    .filter((territory) => !existingTerritoryIds.has(Number(territory.id)))
    .map((territory) => createContractFromTemplate(
      getTerritoryContractTemplate(territory, level, planetId, now),
      level,
      now,
      planetId
    ));
};

export const refreshContracts = (
  contracts, level, planetId = STARTER_PLANET_ID, now = Date.now(), territories = [], playerName = ''
) => {
  const safe = Array.isArray(contracts) ? contracts : [];
  const normal = [];
  const territoryExclusive = [];
  const activeKeys = [];
  let changed = false;

  safe.forEach((contract) => {
    if (!contract || contract.completed) { changed = true; return; }
    if (Number(contract.expiresAt ?? 0) <= now) { changed = true; return; }
    if (contract.territoryExclusive && !isTerritoryContractStillControlled(contract, territories, playerName)) {
      changed = true;
      return;
    }

    const normalized = { ...contract, expired: false };
    if (normalized.territoryExclusive) territoryExclusive.push(normalized);
    else normal.push(normalized);
    activeKeys.push(contract.itemKey);
  });

  const target = getContractSlotsForLevel(level);
  if (normal.length < target) {
    normal.push(...createContracts(level, target - normal.length, activeKeys, planetId));
    changed = true;
  }

  const newTerritoryContracts = createTerritoryContracts(
    territories, playerName, level, planetId, territoryExclusive, now
  );
  if (newTerritoryContracts.length > 0) changed = true;

  // Opción B: total global = CONTRACT_SLOTS + 1 (un slot territorial máximo)
  const maxTerritorial = 1;
  const allTerritorial = [...territoryExclusive, ...newTerritoryContracts].slice(0, maxTerritorial);

  return {
    contracts: [...normal.slice(0, target), ...allTerritorial],
    changed,
  };
};


export const getAdControlUpgradeCost = (pct) =>
  Math.max(10, Math.round(10 + Math.max(1, Number(pct ?? 1)) * 2.5));


export const isTutorialStepComplete = (stepId, saveData) => {
  switch (stepId) {
    case 'work_once':    return Number(saveData?.stats?.works   ?? 0) >= 1;
    case 'build_company':return Array.isArray(saveData?.companies) && saveData.companies.length >= 1;
    case 'level_two':   return Number(saveData?.player?.level   ?? 1) >= 2;
    case 'buy_once':    return Number(saveData?.stats?.buys     ?? 0) >= 1;
    default:            return false;
  }
};

export const syncTutorialState = (saveData) => {
  const tutorial = {
    dismissed: false,
    currentStepId: TUTORIAL_STEPS[0].id,
    completedStepIds: [],
    rewardGrantedStepIds: [],
    finished: false,
    ...(saveData?.tutorial || {}),
  };
  const completedStepIds = TUTORIAL_STEPS
    .filter((s) => isTutorialStepComplete(s.id, saveData))
    .map((s) => s.id);
  const newlyRewarded = TUTORIAL_STEPS.filter(
    (s) => completedStepIds.includes(s.id) && !tutorial.rewardGrantedStepIds.includes(s.id)
  );
  const totalCredits = newlyRewarded.reduce((acc, s) => acc + Number(s.reward?.credits ?? 0), 0);
  const totalXp      = newlyRewarded.reduce((acc, s) => acc + Number(s.reward?.xp      ?? 0), 0);
  const currentStep  = TUTORIAL_STEPS.find((s) => !completedStepIds.includes(s.id));
  const finished     = !currentStep;

  const nextTutorial = {
    ...tutorial,
    completedStepIds,
    rewardGrantedStepIds: [...tutorial.rewardGrantedStepIds, ...newlyRewarded.map((s) => s.id)],
    currentStepId: currentStep?.id || TUTORIAL_STEPS[TUTORIAL_STEPS.length - 1].id,
    finished,
  };

  if (JSON.stringify(nextTutorial) === JSON.stringify(saveData?.tutorial || {}) && !totalCredits && !totalXp) {
    return saveData;
  }

  return {
    ...saveData,
    tutorial: nextTutorial,
    player: totalCredits || totalXp
      ? { ...applyPlayerXpGain(saveData.player, totalXp), credits: Number(saveData.player?.credits ?? 0) + totalCredits }
      : saveData.player,
    log: totalCredits || totalXp
      ? addLog(saveData.log, `Tutorial completado: +${totalCredits.toFixed(2)} creditos y +${totalXp} XP`)
      : saveData.log,
    note: totalCredits || totalXp
      ? { msg: `Tutorial: +${totalCredits.toFixed(2)} creditos y +${totalXp} XP`, type: 'success' }
      : saveData.note,
  };
};


const createInitialMilestones = () => ({
  unlockedIds: [], rewardGrantedIds: [], lastUnlockedId: null, lastUnlockedAt: null,
});

const createInitialResearchProjects = () => ({ active: null });

const normalizeMegaprojects = (incoming) => {
  const base = createInitialMegaprojects();
  const source = incoming && typeof incoming === 'object' ? incoming : {};
  const projects = { ...base.projects };
  MEGAPROJECTS.forEach((project) => {
    const inc = source.projects?.[project.id] || {};
    projects[project.id] = {
      phase: clamp(Number(inc.phase ?? 0), 0, project.phases.length),
      credits: Math.max(0, Number(inc.credits ?? 0)),
      ads: Math.max(0, Number(inc.ads ?? 0)),
      resources: inc.resources && typeof inc.resources === 'object' ? { ...inc.resources } : {},
    };
  });
  return {
    activeId: MEGAPROJECTS.some((project) => project.id === source.activeId) ? source.activeId : base.activeId,
    completedIds: Array.isArray(source.completedIds)
      ? source.completedIds.filter((id) => MEGAPROJECTS.some((project) => project.id === id))
      : [],
    projects,
  };
};

const normalizeSponsorships = (incoming, todayKey = getTodayKey()) => {
  const base = createInitialSponsorships(todayKey);
  const source = incoming && typeof incoming === 'object' ? incoming : {};
  if (source.todayKey !== todayKey) return base;
  return {
    todayKey,
    progress: Object.fromEntries(
      SPONSORSHIPS.map((sponsor) => [
        sponsor.id,
        Math.max(0, Number(source.progress?.[sponsor.id] ?? 0)),
      ])
    ),
    claimedIds: Array.isArray(source.claimedIds)
      ? source.claimedIds.filter((id) => SPONSORSHIPS.some((sponsor) => sponsor.id === id))
      : [],
  };
};

export const createStarterInventory = () => ({
  ...deepClone(DEFAULT_INVENTORY),
  ...deepClone(STARTER_INVENTORY),
});

const createInitialHqProjects = () => ({ active: null });

export const createInitialSave = () => ({
  player: applyResearchToPlayer(
    {
      ...deepClone(DEFAULT_PLAYER),
      name: 'Invitado',
      credits: 0,
      energy: Number(DEFAULT_PLAYER?.energy ?? 40),
      maxEnergy: Number(DEFAULT_PLAYER?.maxEnergy ?? 100),
      health: Number(DEFAULT_PLAYER?.health ?? 100),
      level: Number(DEFAULT_PLAYER?.level ?? 1),
      xp: Number(DEFAULT_PLAYER?.xp ?? 0),
      pct: Number(DEFAULT_PLAYER?.pct ?? 1),
      planet: STARTER_PLANET_ID,
      currentPlanet: STARTER_PLANET_ID,
      currentPlanetName: getPlanetById(STARTER_PLANET_ID)?.name || 'Nexus Prime',
      currentRegion: 'alpha-district',
    },
    createInitialResearch()
  ),
  newName: '',
  hq: createInitialHq(),
  territories: deepClone(INIT_TERRITORIES),
  market: deepClone(INIT_MARKET),
  npcs: deepClone(NPC_PLAYERS).map((npc) => ({ ...npc, credits: Number(npc.credits ?? npc.euros ?? 0) })),
  inventory: createStarterInventory(),
  companies: [],
  activeJob: null,
  missions: deepClone(INIT_MISSIONS).map((m) => ({
    ...m, readyToClaim: false,
    reward: { ...m.reward, credits: Number(m.reward?.credits ?? m.reward?.euros ?? 0), xp: Number(m.reward?.xp ?? 0) },
  })),
  contracts: createContracts(1, getContractSlotsForLevel(1), [], STARTER_PLANET_ID),
  log: [{ msg: '?? Bienvenido a AstraCorp. Tu capsula colonial ha sido activada.', t: Date.now() }],
  chat: deepClone(DEFAULT_CHAT),
  adEuros: 0,
  totalPaid: 0,
  totalAdPaidEuros: 0,
  adBoomMult: 1,
  tab: 'home',
  uiMode: 'compact',
  selTer: null,
  activeEvent: null,
  activeEventStats: null,
  eventHistory: [],
  battle: null,
  note: null,
  day: 1,
  claimedToday: false,
  rewardAdsToday: 0,
  lastRewardAdAt: null,
  adBoosts: { ...DEFAULT_AD_BOOSTS },
  lastLoginDate: null,
  lastEventAt: 0,
  lastSessionEventEffect: null,
  territorialWeeklyEvent: null,
  loginRewards: createInitialLoginRewards(),
  lastProgressAt: Date.now(),
  chatInput: '',
  confetti: false,
  stats: deepClone(DEFAULT_STATS),
  adIncomeSummary: {
    yesterday_payout: 0,
    yesterday_pool: 0,
    yesterday_active_players: 1,
    yesterday_pct: 1,
    yesterday_estimate: 0,
    yesterday_closed: true,
    avg_last_10_days: 0,
    total_payout: 0,
    total_pool: 0,
    today_pool: 0,
    today_active_players: 1,
    today_pct: 1,
    today_estimate: 0,
  },
  adIncomeHistory: [],
  economicHistory: [],
  maintenanceDebt: 0,
  election: { active: false, territory: null, candidates: [], votes: {}, endsAt: null, winner: null, counts: {} },
  importConflict: null,
  tutorial: { dismissed: false, currentStepId: TUTORIAL_STEPS[0].id, completedStepIds: [], rewardGrantedStepIds: [], finished: false },
  milestones: createInitialMilestones(),
  research: createInitialResearch(),
  researchProjects: createInitialResearchProjects(),
  hqProjects: createInitialHqProjects(),
  megaprojects: createInitialMegaprojects(),
  sponsorships: createInitialSponsorships(getTodayKey()),
});

const normalizeResearchProjects = (rp) => {
  const inc = rp && typeof rp === 'object' ? rp : {};
  const active = inc.active && typeof inc.active === 'object'
    ? {
        ...inc.active,
        level:      Number(inc.active.level      ?? 0),
        credits:    Number(inc.active.credits    ?? 0),
        timeMin:    Number(inc.active.timeMin    ?? 0),
        startedAt:  Number(inc.active.startedAt  ?? 0),
        endsAt:     Number(inc.active.endsAt     ?? 0),
        adBoostUsed: Boolean(inc.active.adBoostUsed ?? false),
        resources: Array.isArray(inc.active.resources)
          ? inc.active.resources.map((r) => ({ key: r.key, amount: Number(r.amount ?? 0) }))
          : [],
      }
    : null;
  return { active: active?.key && active?.endsAt > 0 ? active : null };
};

const normalizeHqProjects = (projects) => {
  const inc = projects && typeof projects === 'object' ? projects : {};
  const active = inc.active && typeof inc.active === 'object'
    ? {
        ...inc.active,
        level: Number(inc.active.level ?? 0),
        credits: Number(inc.active.credits ?? 0),
        timeMin: Number(inc.active.timeMin ?? 0),
        startedAt: Number(inc.active.startedAt ?? 0),
        endsAt: Number(inc.active.endsAt ?? 0),
        adBoostUsed: Boolean(inc.active.adBoostUsed ?? false),
        resources: Array.isArray(inc.active.resources)
          ? inc.active.resources.map((resource) => ({ key: resource.key, amount: Number(resource.amount ?? 0) }))
          : [],
      }
    : null;
  return { active: active?.key && HQ_UPGRADES[active.key] && active?.endsAt > 0 ? active : null };
};

const normalizeCompanies = (incomingCompanies, regionKey, territories = [], playerName = '', research = {}, planetId = 'nexus-prime', hq = {}) => {
  if (!Array.isArray(incomingCompanies)) return [];
  const normalized = incomingCompanies.map((company) => {
    const typeKey = company.companyType || company.type;
    const meta = COMPANY_TYPES[typeKey];
    const base = {
      id: company.id ?? Date.now() + Math.random(),
      companyType: typeKey || 'unknown', type: typeKey || 'unknown',
      storage: Number(company.storage ?? 0),
      maxStorage: Number(company.maxStorage ?? meta?.maxStorage ?? 0),
      regionKey: company.regionKey || regionKey || 'alpha-district',
      territoryId: company.territoryId ?? getRegionEconomy(company.regionKey || regionKey || 'alpha-district', planetId)?.territoryId ?? null,
      occupationTaxPending: 0,
      occupationTaxResourceKey: company.occupationTaxResourceKey || meta?.resourceKey || null,
      maintenanceCreditsPerHour: Number(company.maintenanceCreditsPerHour ?? 0),
      maintenancePendingCredits: Number(company.maintenancePendingCredits ?? 0),
      ownerName: company.ownerName || playerName || 'Invitado',
      lastCollectedAt: company.lastCollectedAt || company.createdAt || Date.now(),
      lastTickAt: company.lastTickAt || company.lastCollectedAt || company.createdAt || Date.now(),
      createdAt: company.createdAt || Date.now(),
    };
    return meta ? { ...company, ...base, name: company.name || meta.name } : { ...company, ...base };
  });
  return hydrateCompanies(normalized, regionKey, DEFAULT_AD_BOOSTS, territories, playerName, research, planetId, hq);
};

const normalizeActiveJob = (incomingJob) => {
  if (!incomingJob || typeof incomingJob !== 'object') return null;
  const durationSec = Number(incomingJob.durationSec ?? 0);
  const startedAt   = Number(incomingJob.startedAt   ?? 0);
  const endAt       = Number(incomingJob.endAt ?? 0) || (startedAt > 0 && durationSec > 0 ? startedAt + durationSec * 1000 : 0);
  if (!startedAt || !endAt || durationSec <= 0) return null;
  return {
    ...incomingJob,
    credits: Number(incomingJob.credits ?? incomingJob.euros ?? 0),
    xp: Number(incomingJob.xp ?? 0),
    cost: Number(incomingJob.cost ?? 0),
    durationSec, startedAt, endAt,
    resourceAmount: round2(Number(incomingJob.resourceAmount ?? 1)),
    operationRewards: Array.isArray(incomingJob.operationRewards)
      ? incomingJob.operationRewards
          .filter((reward) => reward?.key)
          .map((reward) => ({ key: reward.key, amount: round2(Number(reward.amount ?? 0)) }))
      : [],
    bonusRate: clamp(Number(incomingJob.bonusRate ?? 0), 0, 0.01),
    regionalBonusRate: clamp(Number(incomingJob.regionalBonusRate ?? 0), 0, 0.01),
    controlBonusRate: clamp(Number(incomingJob.controlBonusRate ?? 0), 0, 0.01),
    unlockLevel: Number(incomingJob.unlockLevel ?? 1),
    adBoostUsed: Boolean(incomingJob.adBoostUsed ?? false),
  };
};

const normalizeTab = (tab) => {
  if (tab === 'company-shop') return 'business';
  if (tab === 'log') return 'map';
  return [
    'home',
    'map',
    'work',
    'business',
    'hq',
    'research',
    'market',
    'ads',
    'projects',
    'missions',
    'balance',
    'politics',
    'players',
    'chat',
  ].includes(tab) ? tab : 'home';
};

export const normalizeSave = (rawSave) => {
  const base   = createInitialSave();
  const source = rawSave && typeof rawSave === 'object' ? rawSave : {};
  const research = normalizeResearch(source.research);
  const researchProjects = normalizeResearchProjects(source.researchProjects);
  const hqProjects = normalizeHqProjects(source.hqProjects);

  const player = { ...base.player, ...(source.player || {}) };
  player.credits   = Number(source.player?.credits ?? source.player?.euros ?? player.credits ?? 0);
  player.energy    = Number(player.energy    ?? 40);
  player.maxEnergy = Number(player.maxEnergy ?? 100);
  player.xp        = Number(player.xp    ?? 0);
  player.level     = Number(player.level ?? 1);
  player.health    = clamp(Number(player.health ?? 100), 0, 100);
  player.pct       = Number(player.pct ?? 1);
  player.name      = typeof player.name === 'string' && player.name.trim() ? player.name.trim() : 'Invitado';
  Object.assign(player, applyPlayerXpGain({ ...player }, 0));
  player.planet        = source.player?.planet        ?? player.planet        ?? STARTER_PLANET_ID;
  player.currentPlanet = source.player?.currentPlanet ?? player.currentPlanet ?? player.planet ?? STARTER_PLANET_ID;
  player.currentPlanetName = getPlanetById(player.currentPlanet || player.planet)?.name || 'Nexus Prime';
  player.currentRegion = source.player?.currentRegion ?? source.player?.region ?? player.currentRegion ?? 'alpha-district';

  const hq = { ...createInitialHq(), ...(source.hq && typeof source.hq === 'object' ? source.hq : {}) };
  Object.keys(hq).forEach((key) => {
    hq[key] = clamp(Number(hq[key] ?? 0), 0, Number(HQ_UPGRADES[key]?.maxLevel ?? 5));
  });
  const normalizedPlayer = applyResearchToPlayer(player, research);

  const sourceMissionsById = new Map(
    (Array.isArray(source.missions) ? source.missions : [])
      .filter(Boolean)
      .map((mission) => [mission.id, mission])
  );
  const missions = (base.missions || []).map((bm) => {
    const m = sourceMissionsById.get(bm.id) || {};
    const baseResources = Array.isArray(bm.reward?.resources) ? bm.reward.resources : [];
    const sourceResources = Array.isArray(m?.reward?.resources) ? m.reward.resources : baseResources;
    return {
      ...bm,
      ...m,
      progress: Number(m?.progress ?? bm.progress ?? 0),
      done: Boolean(m?.done ?? bm.done ?? false),
      readyToClaim: Boolean(m?.readyToClaim ?? false),
      reward: {
        ...(bm.reward || {}),
        ...(m?.reward || {}),
        credits: Number(m?.reward?.credits ?? m?.reward?.euros ?? bm.reward?.credits ?? 0),
        xp: Number(m?.reward?.xp ?? bm.reward?.xp ?? 0),
        resources: sourceResources
          .filter((resource) => resource?.key)
          .map((resource) => ({ key: resource.key, amount: Number(resource.amount ?? 0) })),
      },
    };
  });

  const normalizedTerritories = normalizeTerritories(source.territories ?? base.territories);
  const currentRegionKey = source.player?.currentRegion ?? source.player?.region ?? base.player.currentRegion ?? 'alpha-district';

  const normalizedContracts = Array.isArray(source.contracts)
    ? source.contracts.map((c) => ({
        ...c,
        qty: Number(c?.qty ?? 0),
        reward: { credits: Number(c?.reward?.credits ?? c?.reward?.euros ?? 0), xp: Number(c?.reward?.xp ?? 0) },
        expiresAt: Number(c?.expiresAt ?? 0),
        contractKind: c?.contractKind || 'standard',
        contractKindLabel: c?.contractKindLabel || 'Estable',
        contractChain: c?.contractChain || null,
        originPlanetId: c?.originPlanetId ?? null,
        exclusive: Boolean(c?.exclusive ?? false),
        territoryExclusive: Boolean(c?.territoryExclusive ?? false),
        territoryId: c?.territoryId ?? null,
        territoryName: c?.territoryName ?? null,
        territoryController: c?.territoryController ?? null,
        strategicDistrictLabel: c?.strategicDistrictLabel ?? null,
        strategicContractBonus: Number(c?.strategicContractBonus ?? 0),
        completed: Boolean(c?.completed ?? false),
        expired: Boolean(c?.expired ?? false),
      })).filter(Boolean)
    : base.contracts;

  const contractState = refreshContracts(normalizedContracts, player.level, player.currentPlanet || player.planet || STARTER_PLANET_ID, Date.now(), normalizedTerritories, player.name);
  const npcs = Array.isArray(source.npcs)
    ? source.npcs.map((npc, i) => ({ ...(base.npcs[i] || {}), ...npc, credits: Number(npc?.credits ?? npc?.euros ?? base.npcs[i]?.credits ?? 0) }))
    : base.npcs;
  const marketEntries = Object.entries(base.market).map(([key, item]) => {
    const inc = source.market?.[key] || {};
    const next = { ...item, ...inc };
    return [key, {
      ...next,
      price: Number(next.price ?? item.price ?? 0),
      base: Number(next.base ?? item.base ?? 0),
      supply: Number(next.supply ?? item.supply ?? 0),
      demand: Number(next.demand ?? item.demand ?? 0),
      lastTradeAt: Number(next.lastTradeAt ?? 0) || null,
      lastTradeQty: Number(next.lastTradeQty ?? 0),
      lastPriceChange: Number(next.lastPriceChange ?? 0),
      globalBuys: Number(next.globalBuys ?? 0),
      globalSells: Number(next.globalSells ?? 0),
      netFlow: Number(next.netFlow ?? 0),
      marketPressure: ['buy', 'sell', 'flat'].includes(next.marketPressure) ? next.marketPressure : 'flat',
    }];
  });

  const normalizedAdEuros = Number(source.adEuros ?? source.adCredits ?? base.adEuros ?? 0);
  const normalizedTotalPaid = Number(source.totalPaid ?? source.totalAdPaidEuros ?? base.totalPaid ?? 0);
  const normalizedAdIncomeSummary = mergeAdIncomeSummary(base.adIncomeSummary, source.adIncomeSummary || {});
  const hasLegacyBootstrapPayout =
    Number(source.totalPaid ?? source.totalAdPaidEuros ?? 0) === 127.34 &&
    Number(normalizedAdIncomeSummary.total_payout ?? 0) === 127.34;
  if (hasLegacyBootstrapPayout) {
    normalizedAdIncomeSummary.total_payout = 0;
    normalizedAdIncomeSummary.total_pool = 0;
  }
  const normalizedActiveEvent =
    source.activeEvent && Number(source.activeEvent?.expiresAt ?? 0) > Date.now()
      ? source.activeEvent
      : null;
  const normalizedAdBoomMult = normalizedActiveEvent?.effect === 'adBoom'
    ? Number(source.adBoomMult ?? 1.8)
    : 1;

  return {
    ...base, ...source,
    player: normalizedPlayer,
    territories: normalizedTerritories,
    market: Object.fromEntries(marketEntries),
    npcs,
    inventory: { ...createStarterInventory(), ...(source.inventory || {}) },
    companies: normalizeCompanies(source.companies, currentRegionKey, normalizedTerritories, normalizedPlayer.name, research, getCurrentPlanetIdFromSave(source), hq),
    activeJob: normalizeActiveJob(source.activeJob),
    missions, hq,
    contracts: contractState.contracts,
    log:  Array.isArray(source.log)  && source.log.length  ? source.log  : base.log,
    chat: Array.isArray(source.chat) && source.chat.length ? source.chat : base.chat,
    adEuros: normalizedAdEuros,
    totalPaid: normalizedTotalPaid,
    totalAdPaidEuros: normalizedTotalPaid,
    adBoomMult: normalizedAdBoomMult,
    tab: normalizeTab(source.tab ?? base.tab),
    uiMode: source.uiMode === 'detail' ? 'detail' : 'compact',
    selTer: source.selTer ?? base.selTer,
    activeEvent: normalizedActiveEvent,
    activeEventStats: source.activeEventStats && typeof source.activeEventStats === 'object' ? source.activeEventStats : null,
    eventHistory: Array.isArray(source.eventHistory) ? source.eventHistory.slice(0, 12) : [],
    battle: source.battle ?? base.battle,
    note: source.note ?? base.note, day: Number(source.day ?? base.day ?? 1),
    claimedToday: Boolean(source.claimedToday ?? false),
    rewardAdsToday: Number(source.rewardAdsToday ?? 0),
    lastRewardAdAt: source.lastRewardAdAt ?? null,
    lastEventAt: Number(source.lastEventAt ?? 0),
    lastSessionEventEffect: source.lastSessionEventEffect ?? null,
    territorialWeeklyEvent: normalizeTerritorialWeeklyEvent(source.territorialWeeklyEvent ?? base.territorialWeeklyEvent, normalizedTerritories, Number(source.day ?? base.day ?? 1)),
    loginRewards: { ...createInitialLoginRewards(), ...(source.loginRewards || {}) },
    lastProgressAt: Number(source.lastProgressAt ?? base.lastProgressAt ?? Date.now()),
    sessionStartedAt: Number(source.sessionStartedAt ?? base.sessionStartedAt ?? Date.now()),
    lastSessionEventAt: Number(source.lastSessionEventAt ?? 0),
    lastSectorEventAt: Number(source.lastSectorEventAt ?? 0),
    activeSectorEvent: source.activeSectorEvent && Number(source.activeSectorEvent?.expiresAt ?? 0) > Date.now()
      ? source.activeSectorEvent
      : null,
    levelMoment: source.levelMoment ?? null,
    adBoosts: {
      ...DEFAULT_AD_BOOSTS, ...(source.adBoosts || {}),
      companyBoostUntil: Number(source.adBoosts?.companyBoostUntil ?? 0) || null,
      companyBoostMultiplier: Number(source.adBoosts?.companyBoostMultiplier ?? DEFAULT_AD_BOOSTS.companyBoostMultiplier),
    },
    lastLoginDate: source.lastLoginDate ?? null,
    chatInput: source.chatInput ?? '',
    confetti: Boolean(source.confetti ?? false),
    stats: { ...base.stats, ...(source.stats || {}) },
    adIncomeSummary: normalizedAdIncomeSummary,
    adIncomeHistory: Array.isArray(source.adIncomeHistory) ? source.adIncomeHistory : [],
    economicHistory: Array.isArray(source.economicHistory) ? source.economicHistory.slice(0, 80) : [],
    maintenanceDebt: Number(source.maintenanceDebt ?? 0),
    election: { ...base.election, ...(source.election || {}) },
    importConflict: source.importConflict ?? null,
    tutorial: { ...base.tutorial, ...(source.tutorial || {}) },
    milestones: {
      ...createInitialMilestones(), ...(source.milestones || {}),
      unlockedIds:     Array.isArray(source.milestones?.unlockedIds)     ? source.milestones.unlockedIds     : [],
      rewardGrantedIds: Array.isArray(source.milestones?.rewardGrantedIds) ? source.milestones.rewardGrantedIds : [],
    },
    research,
    researchProjects,
    hqProjects,
    megaprojects: normalizeMegaprojects(source.megaprojects),
    sponsorships: normalizeSponsorships(source.sponsorships, getTodayKey()),
  };
};

export const applyDailyLoginUpdate = (saveData) => {
  const prev = normalizeSave(saveData);
  const todayKey = getTodayKey();
  const now = Date.now();
  const offlineMs = Math.max(0, now - Number(prev.lastProgressAt ?? now));
  const recoveredEnergy = Math.floor(offlineMs / 60_000); // ENERGY_REGEN_MS
  const dayDiff = diffDaysFromKeys(prev.lastLoginDate, todayKey);
  const previousAdSummary = prev.adIncomeSummary || {};
  const previousAdActionsToday = Math.max(
    0,
    Number(prev.rewardAdsToday ?? 0),
    Number(prev.stats?.adsViewedToday ?? 0)
  );
  const previousAdPoolToday = Math.max(
    0,
    Number(previousAdSummary.today_pool ?? 0),
    previousAdActionsToday * AD_POOL_REVENUE_PER_VIEW
  );
  const previousAdActivePlayers = Math.max(1, Number(previousAdSummary.today_active_players ?? 1));
  const previousAdPct = Number(previousAdSummary.today_pct ?? prev.player?.pct ?? 1);
  const localTodayAdPayout =
    (previousAdActionsToday * AD_POOL_REVENUE_PER_VIEW / previousAdActivePlayers) *
    (previousAdPct / 100);
  const localYesterdayAdPayout = dayDiff > 0
    ? Math.max(0, Number(previousAdSummary.today_estimate ?? 0), localTodayAdPayout)
    : 0;
  const localYesterdayAdPool = dayDiff > 0
    ? Math.max(0, Number(previousAdSummary.yesterday_pool ?? 0), previousAdPoolToday)
    : 0;
  const localTotalAdPool = dayDiff > 0
    ? Math.max(
        0,
        Number(previousAdSummary.total_pool ?? 0),
        Number(previousAdSummary.yesterday_pool ?? 0) + previousAdPoolToday
      )
    : Number(previousAdSummary.total_pool ?? 0);

  const next = {
    ...prev,
    claimedToday: false,
    rewardAdsToday: dayDiff > 0 ? 0 : Number(prev.rewardAdsToday ?? 0),
    stats: {
      ...(prev.stats || {}),
      adsViewedToday: dayDiff > 0 ? 0 : Number(prev.stats?.adsViewedToday ?? prev.rewardAdsToday ?? 0),
      adsViewed: Number(prev.stats?.adsViewed ?? 0),
    },
    lastRewardAdAt: dayDiff > 0 ? null : prev.lastRewardAdAt,
    adIncomeSummary: dayDiff > 0
      ? {
          ...previousAdSummary,
          yesterday_payout: localYesterdayAdPayout,
          yesterday_pool: localYesterdayAdPool,
          yesterday_estimate: localYesterdayAdPayout,
          yesterday_closed: false,
          total_payout: Math.max(0, Number(previousAdSummary.total_payout ?? 0)) + localYesterdayAdPayout,
          total_pool: localTotalAdPool,
          today_pool: 0,
          today_active_players: 1,
          today_estimate: 0,
        }
      : previousAdSummary,
    sponsorships: dayDiff > 0 ? createInitialSponsorships(todayKey) : normalizeSponsorships(prev.sponsorships, todayKey),
    lastProgressAt: now,
    player: {
      ...prev.player,
      energy: Math.min(Number(prev.player?.maxEnergy ?? 100), Number(prev.player?.energy ?? 0) + recoveredEnergy),
    },
    loginRewards: { ...createInitialLoginRewards(), ...(prev.loginRewards || {}), lastReturnReward: null },
  };

  if (!prev.lastLoginDate) {
    next.lastLoginDate = todayKey;
    next.loginRewards = { ...next.loginRewards, streak: 1, bestStreak: 1, lastClaimDate: null, lastDailyReward: null };
    next.log = addLog(next.log, '?? Sesion inicial activada. La racha diaria empezara a contar en tu siguiente regreso.');
    next.note = null;
    return next;
  }

  if (dayDiff <= 0) return next;

  const missedDays = Math.max(0, dayDiff - 1);
  let nextPct = Number(next.player.pct ?? 1);
  const nextStreak = dayDiff === 1 ? Number(prev.loginRewards?.streak ?? 0) + 1 : 1;
  const bestStreak = Math.max(Number(prev.loginRewards?.bestStreak ?? 0), nextStreak);
  const dailyReward  = getDailyStreakReward(nextStreak);
  const returnReward = getWelcomeBackReward(missedDays);

  if (missedDays > 0) {
    nextPct = Math.max(1, parseFloat((nextPct - missedDays * 5).toFixed(1)));
    next.log = addLog(next.log, `?? Ausencia de ${missedDays} dia(s): -${missedDays * 5}% de reparto`);
  }
  nextPct = Math.min(100, parseFloat((nextPct + 1).toFixed(1)));

  next.player = {
    ...applyPlayerXpGain(
      {
        ...next.player,
        credits: Number(next.player?.credits ?? 0) + Number(dailyReward.credits ?? 0) + Number(returnReward?.credits ?? 0),
        energy: Math.min(Number(next.player?.maxEnergy ?? 100), Number(next.player?.energy ?? 0) + Number(dailyReward.energy ?? 0) + Number(returnReward?.energy ?? 0)),
      },
      Number(dailyReward.xp ?? 0) + Number(returnReward?.xp ?? 0)
    ),
    pct: nextPct,
  };
  next.claimedToday = true;
  next.lastLoginDate = todayKey;
  next.loginRewards = { ...next.loginRewards, streak: nextStreak, bestStreak, lastClaimDate: todayKey, lastDailyReward: dailyReward, lastReturnReward: returnReward };
  next.log = addLog(next.log, `?? Acceso diario: racha ${nextStreak}  -  +${dailyReward.credits} creditos  -  +${dailyReward.energy} energia  -  +${dailyReward.xp} XP`);
  if (returnReward) {
    next.log = addLog(next.log, `?? Regreso tras ${returnReward.missedDays} dia(s): +${returnReward.credits} creditos  -  +${returnReward.energy} energia  -  +${returnReward.xp} XP`);
  }
  next.note = {
    msg: returnReward
      ? `?? Regreso: +${returnReward.credits} creditos  -  ?? Racha ${nextStreak}: +${dailyReward.credits} creditos`
      : `?? Racha ${nextStreak}: +${dailyReward.credits} creditos  -  +${dailyReward.energy} energia`,
    type: 'success',
  };

  // Finish any pending research that completed while offline
  if (next.researchProjects?.active && Number(next.researchProjects.active.endsAt ?? 0) <= now) {
    const project = next.researchProjects.active;
    const nextResearch = normalizeResearch({ ...(next.research || {}), [project.key]: Number(next.research?.[project.key] ?? 0) + 1 });
    const nextAdBoosts = { ...DEFAULT_AD_BOOSTS, ...(next.adBoosts || {}), companyBoostMultiplier: Number(getResearchEffects(nextResearch).companyBoostMultiplier ?? 1.5) };
    next.research = nextResearch;
    next.researchProjects = { active: null };
    next.adBoosts = nextAdBoosts;
    next.player = applyResearchToPlayer({ ...next.player, energy: Number(next.player?.energy ?? 0) + 6 }, nextResearch);
    next.companies = hydrateCompanies(next.companies, getCurrentRegionKeyFromSave(next), nextAdBoosts, next.territories, next.player?.name, nextResearch, getCurrentPlanetIdFromSave(next), next.hq);
    next.note = { msg: `Investigacion completada: ${project.title}`, type: 'success' };
    next.confetti = true;
    next.log = addLog(next.log, `Investigacion completada: ${project.title} nivel ${Number(nextResearch?.[project.key] ?? 0)}`);
    next.loginRewards = { ...next.loginRewards, lastResearchCompleted: project.title };
  }

  // Finish any pending HQ upgrade that completed while offline
  if (next.hqProjects?.active && Number(next.hqProjects.active.endsAt ?? 0) <= now) {
    const project = next.hqProjects.active;
    const nextLevel = Math.min(
      Number(HQ_UPGRADES[project.key]?.maxLevel ?? 5),
      Number(next.hq?.[project.key] ?? 0) + 1
    );
    const nextHq = { ...createInitialHq(), ...(next.hq || {}), [project.key]: nextLevel };
    next.hq = nextHq;
    next.hqProjects = { active: null };
    next.companies = hydrateCompanies(
      next.companies,
      getCurrentRegionKeyFromSave(next),
      next.adBoosts,
      next.territories,
      next.player?.name,
      next.research,
      getCurrentPlanetIdFromSave(next),
      nextHq
    );
    next.note = { msg: `Mejora completada: ${project.title}`, type: 'success' };
    next.confetti = true;
    next.log = addLog(next.log, `Mejora de sede completada: ${project.title} nivel ${nextLevel}`);
  }

  return next;
};
