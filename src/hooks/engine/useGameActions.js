/**
 * useGameActions.js
 *
 * Todas las acciones que puede disparar el jugador.
 * Recibe setSave, save, user y los helpers de persistencia.
 * No contiene ningun setInterval ni useEffect.
 */

import { startTransition } from 'react';
import { getResearchEffects, getResearchUpgradeCost } from '../../data/researchData';
import { HQ_UPGRADES, getHqUpgradeCost, getHqUpgradeTimeMin } from '../../data/hqUpgrades';
import { COMPANY_TYPES, getCompanyBuildCost } from '../../data/companyTypes';
import { getPlanetById, getPlanetEffects, getPlanetUnlockStatus } from '../../data/planets';
import { REGIONS, REGION_CHANGE_COST, getRegionEconomy } from '../../data/regions';
import { NPC_PLAYERS } from '../../data/gameData';
import { MEGAPROJECTS, SPONSORSHIPS, createInitialSponsorships, getMegaprojectById } from '../../data/megaprojects';
import { round2 } from '../../utils/companyMath';
import {
  addLocalAdView,
  flushAdViewsToSupabase,
  getMyAdIncomeSummary,
  getMyAdIncomeHistory,
  getPublicAdPoolSummary,
} from '../../services/adpool';
import {
  getSponsoredAdAvailability,
  openSponsoredAd,
} from '../../services/sponsoredAds';
import { saveGame } from '../../services/gameSave';
import { buildCompanySecure, collectCompanySecure, sellCompanySecure, collectCompanyGroupSecure, collectAllCompaniesAdSecure, attackTerritorySecure, reinforceTerritorySecure, sabotageTerritorySecure, buildTerritoryFortSecure, collectOccupationTaxesSecure, getGlobalTerritoriesSecure, getGlobalMarketSecure, buyMarketItemSecure, sellMarketItemSecure, deliverContractSecure, claimMissionRewardSecure, startWorkSecure, boostWorkSecure, startResearchSecure, boostResearchSecure, upgradeHqSecure, repairIntegritySecure, startElectionSecure, voteElectionSecure } from '../../services/multiplayerActions';

const VALID_TABS = new Set([
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
]);

const REMOTE_TERRITORY_ATTACKS_ENABLED = false;
const REMOTE_TERRITORY_ACTIONS_ENABLED = false;
const REMOTE_TERRITORY_REINFORCE_ENABLED = true;
const REMOTE_COMPANY_COLLECTION_ENABLED = false;
const REMOTE_WORK_ACTIONS_ENABLED = false;
const REMOTE_HQ_UPGRADES_ENABLED = false;
const EARLY_UNIQUE_COMPANY_LEVEL = 10;
const EARLY_UNIQUE_COMPANY_PLANET = 'nexus-prime';

import {
  AD_POOL_REVENUE_PER_VIEW,
  DEFAULT_AD_BOOSTS,
  ELECTION_CREDIT_COST,
  ELECTION_UNLOCK_LEVEL,
  TERRITORY_ATTACK_CREDIT_COST,
  TERRITORY_DEFENSE_RESPONSE_COST,
  TERRITORY_HACK_COST,
  TERRITORY_REINFORCE_COST,
  TERRITORY_SABOTAGE_COST,
  TERRITORY_SPY_COST,
  TUTORIAL_STEPS,
} from './gameConstants';
import {
  addLog,
  applyDailyLoginUpdate,
  applyPlayerXpGain,
  clearPendingAccountSave,
  createInitialSave,
  getCurrentPlanetIdFromSave,
  getCurrentRegionKeyFromSave,
  getAdControlUpgradeCost,
  decorateMarketTradeImpact,
  getEnergyCost,
  getIntegrityEffects,
  getMarketBuyQuote,
  getMarketSellQuote,
  getTerritoryCampaign,
  getTerritoryCampaignStage,
  createTerritoryOperation,
  getTerritoryDefenseProfile,
  getTerritoryOperationEtaMs,
  getTerritoryOperationProgress,
  normalizeTerritoryOperation,
  createTerritoryDefenseResponse,
  TERRITORY_DEFENSE_RESPONSE_TYPES,
  createNextChainedContract,
  hasEnoughEnergy,
  hydrateCompanies,
  hydrateCompaniesAndInventory,
  clamp,
  mergeAdIncomeSummary,
  getResearchLabTimeMultiplier,
  getTerritoryBattlePreview,
  normalizeSave,
  normalizeTerritories,
  refreshContracts,
  spendEnergy,
  updateTerritoryMemory,
  writeLocalSave,
} from './gamePureLogic';

const getFortificationCost = (territory) => {
  const fort = Math.max(0, Number(territory?.fortification ?? 0));
  const tier = Math.floor(fort / 25);
  return [
    { key: 'mineral', amount: 12 + tier * 6 },
    { key: 'energy_cells', amount: 5 + tier * 3 },
  ];
};

const DEFENSE_BUILD_ORDER = ['security', 'informants', 'cyber', 'legal', 'media', 'logistics'];

const getNextDefenseAssetType = (territory = {}) => {
  const assets = Array.isArray(territory.defenseAssets) ? territory.defenseAssets : [];
  const levels = new Map(assets.map((asset) => [asset.type, Number(asset.level ?? 0)]));
  return DEFENSE_BUILD_ORDER
    .map((type) => ({ type, level: levels.get(type) || 0 }))
    .sort((a, b) => a.level - b.level)[0]?.type || 'security';
};

const getCompanySellRefund = (companyTypeKey, ownedCount = 1) => {
  const previousOwned = Math.max(0, Number(ownedCount || 1) - 1);
  const lastUnitCost = Number(getCompanyBuildCost(companyTypeKey, previousOwned) || 0);
  return round2(Math.max(1, lastUnitCost * 0.45));
};

const addEconomicHistory = (save, entry) => ({
  ...save,
  economicHistory: [
    { t: Date.now(), ...entry },
    ...(Array.isArray(save.economicHistory) ? save.economicHistory : []),
  ].slice(0, 80),
});

const getIntegrityRepairCost = (player = {}) => {
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

const formatResourceCost = (cost) =>
  (cost || []).map((item) => `${item.amount} ${item.key}`).join(', ');
const formatTaxAmount = (amount) => Number(amount || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 });
const OPERATION_RESOURCE_COSTS = {
  conquest: [{ key: 'security_teams', amount: 0.5 }, { key: 'intel_data', amount: 0.25 }],
  sabotage: [{ key: 'influence_cells', amount: 0.75 }, { key: 'exploit_kits', amount: 0.35 }],
  spy: [{ key: 'intel_data', amount: 0.5 }],
  hack: [{ key: 'exploit_kits', amount: 0.75 }],
  defense: [{ key: 'security_teams', amount: 0.5 }, { key: 'intel_data', amount: 0.25 }],
};
const hasResourceCost = (inventory = {}, cost = []) =>
  (cost || []).every((item) => Number(inventory?.[item.key] ?? 0) >= Number(item.amount ?? 0));
const spendResourceCost = (inventory = {}, cost = []) => {
  const next = { ...(inventory || {}) };
  (cost || []).forEach((item) => {
    next[item.key] = round2(Math.max(0, Number(next[item.key] || 0) - Number(item.amount || 0)));
  });
  return next;
};
const formatEta = (ms) => {
  const totalMinutes = Math.ceil(Math.max(0, Number(ms ?? 0)) / 60000);
  if (totalMinutes <= 0) return 'lista';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min`;
  return `${hours} h ${minutes} min`;
};

const mergeGlobalMarketIntoSave = (currentSave, globalMarket = {}) => ({
  ...currentSave,
  marketSyncedAt: Date.now(),
  market: {
    ...(currentSave?.market || {}),
    ...(globalMarket || {}),
  },
});

const getLastDefendedAt = (territory = {}) => Number(territory?.sectorMemory?.lastDefendedAt ?? 0);

const mergeGlobalTerritoriesIntoSave = (currentSave, globalTerritories = []) => {
  const remoteTerritories = normalizeTerritories(globalTerritories);
  const localById = new Map((currentSave?.territories || []).map((territory) => [Number(territory?.id), territory]));
  const playerName = currentSave?.player?.name;
  const mergedTerritories = remoteTerritories.map((remoteTerritory) => {
    const localTerritory = localById.get(Number(remoteTerritory?.id));
    const localDefenseIsNewer = (
      localTerritory?.controller === playerName &&
      remoteTerritory?.controller === playerName &&
      getLastDefendedAt(localTerritory) > getLastDefendedAt(remoteTerritory)
    );

    return localDefenseIsNewer ? localTerritory : remoteTerritory;
  });
  const selectedId = currentSave?.selTer?.id;

  return {
    ...currentSave,
    territories: mergedTerritories,
    selTer: selectedId === undefined || selectedId === null
      ? currentSave?.selTer ?? null
      : mergedTerritories.find((territory) => Number(territory.id) === Number(selectedId)) || null,
  };
};

export function useGameActions({ save, setSave, user, persistRemoteSave, updateMission, notify }) {

  const updateSave = (patch) => setSave((prev) => ({ ...prev, ...patch }));
  const setTab = (tab) => {
    const nextTab = VALID_TABS.has(tab) ? tab : 'home';
    startTransition(() => updateSave({ tab: nextTab }));
  };

  const getFreshEconomicSave = (baseSave) => {
    const currentRegionKey = getCurrentRegionKeyFromSave(baseSave);
    const currentPlanetId  = getCurrentPlanetIdFromSave(baseSave);
    const hydrated = hydrateCompaniesAndInventory(
      baseSave.companies || [],
      baseSave.inventory || {},
      currentRegionKey,
      baseSave.adBoosts,
      baseSave.territories,
      baseSave.player?.name,
      baseSave.research,
      currentPlanetId,
      baseSave.hq
    );

    return {
      ...baseSave,
      companies: hydrated.companies,
      inventory: hydrated.inventory,
    };
  };

  const syncBeforeSecureAction = async ({
    sourceSave = save,
    hydrateEconomy = false,
    label = 'accion segura',
  } = {}) => {
    const nextSave = hydrateEconomy ? getFreshEconomicSave(sourceSave) : sourceSave;
    if (!user?.id) return nextSave;

    try {
      await persistRemoteSave(user.id, nextSave, { force: true });
    } catch (error) {
      console.warn(`No se pudo sincronizar antes de ${label}:`, error);
    }

    return nextSave;
  };

  const isEarlyUniqueCompanyBlocked = (liveSave, companyTypeKey, ownedCount = 0) =>
    getCurrentPlanetIdFromSave(liveSave) === EARLY_UNIQUE_COMPANY_PLANET &&
    Number(liveSave.player?.level ?? 1) <= EARLY_UNIQUE_COMPANY_LEVEL &&
    Number(ownedCount ?? 0) > 0;

  const markAdViewedStats = (liveSave = {}) => {
    const currentToday = Math.max(
      Number(liveSave.stats?.adsViewedToday ?? 0),
      Number(liveSave.rewardAdsToday ?? 0)
    );
    const currentTotal = Math.max(Number(liveSave.stats?.adsViewed ?? 0), currentToday);
    return {
      ...(liveSave.stats || {}),
      adsViewedToday: currentToday + 1,
      adsViewed: currentTotal + 1,
    };
  };

  const getSponsoredBlockReason = (liveSave = {}, now = Date.now()) => {
    const availability = getSponsoredAdAvailability({
      rewardAdsToday: liveSave.rewardAdsToday,
      lastRewardAdAt: liveSave.lastRewardAdAt,
      now,
    });

    return availability.canShow ? null : availability.reason;
  };

  const markSponsoredAdAction = (liveSave = {}, now = Date.now()) => {
    const stats = markAdViewedStats(liveSave);
    return {
      stats,
      rewardAdsToday: Math.max(
        Number(liveSave.rewardAdsToday ?? 0),
        Number(stats.adsViewedToday ?? 0)
      ),
      lastRewardAdAt: now,
    };
  };

  const recordEstimatedAdPoolView = async () => {
    if (!user?.id) return;

    addLocalAdView({
      userId: user.id,
      revenuePerView: AD_POOL_REVENUE_PER_VIEW,
      count: 1,
    });

    await flushAdViewsToSupabase({
      userId: user.id,
      playerPct: save.player?.pct ?? 1,
      force: true,
    });
    await refreshAdIncomeSummary();
  };

  const openSponsoredAction = () => {
    if (openSponsoredAd()) return true;
    notify('No se pudo abrir el anuncio patrocinado.', 'warn');
    return false;
  };

  const getBuildBlockReason = (liveSave, meta, buildCost, reqLevel, companyTypeKey, ownedCount = 0) => {
    if (isEarlyUniqueCompanyBlocked(liveSave, companyTypeKey, ownedCount)) {
      return `Ya tienes ${meta.name}. En Nexus Prime hasta nivel ${EARLY_UNIQUE_COMPANY_LEVEL} solo puedes tener una empresa de cada tipo.`;
    }
    if (Number(liveSave.player?.level ?? 1) < reqLevel) {
      return `Necesitas nivel ${reqLevel} para construir ${meta.name}.`;
    }
    if (Number(liveSave.player?.credits ?? 0) < buildCost) {
      return `Necesitas ${buildCost} creditos para construir ${meta.name}.`;
    }
    if (!hasEnoughEnergy(liveSave.player, 'buildCompany', liveSave.research, liveSave.hq)) {
      return `Necesitas ${getEnergyCost('buildCompany', liveSave.research, liveSave.hq)} de energia.`;
    }
    return null;
  };

  const getWholeCollectableUnits = (value) => Math.max(0, Math.floor(Number(value ?? 0)));
  const getRemainingFractionalStorage = (value) => round2(Math.max(0, Number(value ?? 0) - getWholeCollectableUnits(value)));

  const refreshAdIncomeSummary = async () => {
    try {
      const [summaryResult, historyResult] = user?.id
        ? await Promise.all([
            getMyAdIncomeSummary(),
            getMyAdIncomeHistory(10),
          ])
        : [await getPublicAdPoolSummary(), { ok: true, history: [] }];
      setSave((prev) => ({
        ...prev,
        adIncomeSummary: summaryResult?.ok && summaryResult.summary
          ? mergeAdIncomeSummary(prev.adIncomeSummary, summaryResult.summary)
          : prev.adIncomeSummary,
        adIncomeHistory: historyResult?.ok && Array.isArray(historyResult.history)
          ? historyResult.history
          : prev.adIncomeHistory,
      }));
    } catch (err) {
      console.error('Error refrescando ingresos de anuncios:', err);
    }
  };

  return {
    notifyBlockedAction: (reason) => {
      notify(`No puedes: ${reason || 'accion no disponible ahora.'}`, 'warn');
    },
    setTab,
    setUiMode: (uiMode) => updateSave({ uiMode: uiMode === 'detail' ? 'detail' : 'compact' }),
    setNewName:    (newName)   => updateSave({ newName }),
    setSelTer:     (selTer)   => updateSave({ selTer }),
    setChatInput:  (chatInput) => updateSave({ chatInput }),
    closeEventBanner: ()       => setSave((prev) => ({
      ...prev,
      activeEvent: null,
      activeEventStats: null,
      adBoomMult: prev.activeEvent?.effect === 'adBoom' ? 1 : Number(prev.adBoomMult ?? 1),
    })),
    closeSectorEvent: ()       => updateSave({ activeSectorEvent: null }),
    renameTerritory: (territoryId, customName) => {
      const cleanName = String(customName || '').trim().slice(0, 36);
      setSave((prev) => {
        const territory = (prev.territories || []).find((item) => Number(item.id) === Number(territoryId));
        if (!territory || territory.controller !== prev.player?.name) return prev;
        return {
          ...prev,
          territories: (prev.territories || []).map((item) =>
            Number(item.id) === Number(territoryId)
              ? { ...item, customName: cleanName }
              : item
          ),
          selTer: prev.selTer && Number(prev.selTer.id) === Number(territoryId)
            ? { ...prev.selTer, customName: cleanName }
            : prev.selTer,
          log: addLog(prev.log, cleanName
            ? `Sector renombrado: ${territory.name} ahora es ${cleanName}`
            : `Sector restaurado: ${territory.name} recupera su nombre oficial`),
        };
      });
      notify(cleanName ? 'Sector renombrado.' : 'Nombre del sector restaurado.', 'success');
    },
    resolveSectorEvent: () => {
      let resolved = false;
      let blockReason = '';
      setSave((prev) => {
        const event = prev.activeSectorEvent;
        if (!event) { blockReason = 'No hay evento de sector activo.'; return prev; }
        if (Number(event.expiresAt ?? 0) <= Date.now()) {
          blockReason = 'Ese evento de sector ya ha caducado.';
          return { ...prev, activeSectorEvent: null };
        }
        const owned = Number(prev.inventory?.[event.itemKey] ?? 0);
        const qty = Number(event.qty ?? 0);
        if (owned < qty) {
          blockReason = `Faltan ${qty - owned} ${event.itemName}.`;
          return prev;
        }
        const rewardCredits = Number(event.reward?.credits ?? 0);
        const stabilityGain = Number(event.reward?.stability ?? 0);
        resolved = true;
        return addEconomicHistory({
          ...prev,
          activeSectorEvent: null,
          inventory: { ...(prev.inventory || {}), [event.itemKey]: round2(owned - qty) },
          player: { ...(prev.player || {}), credits: round2(Number(prev.player?.credits ?? 0) + rewardCredits) },
          territories: (prev.territories || []).map((territory) =>
            Number(territory.id) === Number(event.territoryId)
              ? { ...territory, stability: clamp(Number(territory.stability ?? 0) + stabilityGain, 0, 100) }
              : territory
          ),
          log: addLog(prev.log, `Sector asistido: ${event.territoryName} recibe ${event.itemName} x${qty}. +${stabilityGain}% estabilidad.`),
          note: { msg: `${event.territoryName} estabilizado: +${stabilityGain}%`, type: 'success' },
        }, { type: 'sector_event', label: `Sector: ${event.territoryName}`, credits: rewardCredits, detail: `${event.itemName} x${qty}` });
      });
      notify(resolved ? 'Evento de sector resuelto.' : blockReason || 'No se pudo resolver el evento.', resolved ? 'success' : 'warn');
    },
    dismissTutorial:  ()       => setSave((prev) => ({ ...prev, tutorial: { ...(prev.tutorial || {}), dismissed: true } })),
    reopenTutorial:   ()       => setSave((prev) => ({ ...prev, tutorial: { ...(prev.tutorial || {}), dismissed: false } })),

    resolveImportConflict: async (choice) => {
      if (!user?.id) return false;

      if (choice === 'remote') {
        clearPendingAccountSave();
        setSave((prev) => ({ ...prev, importConflict: null }));
        return true;
      }

      if (choice === 'local') {
        const pendingSave = save.importConflict?.pendingSave;
        if (!pendingSave) return false;
        const normalized = applyDailyLoginUpdate(pendingSave);
        setSave({ ...normalized, importConflict: null });
        writeLocalSave(user.id, normalized);
        await persistRemoteSave(user.id, normalized, { force: true });
        clearPendingAccountSave();
        return true;
      }

      return false;
    },

    syncGlobalMarket: async () => {
      if (!user?.id) return false;

      const remote = await getGlobalMarketSecure();
      if (remote?.ok && remote.market && typeof remote.market === 'object') {
        setSave((prev) => mergeGlobalMarketIntoSave(prev, remote.market));
        return true;
      }

      if (remote?.error && !remote.fallbackAllowed) {
        notify(remote.error, 'error');
      }

      return false;
    },

    syncGlobalTerritories: async () => {


      if (!user?.id) return false;



      const remote = await getGlobalTerritoriesSecure();


      if (remote?.ok && Array.isArray(remote.territories)) {


        setSave((prev) => mergeGlobalTerritoriesIntoSave(prev, remote.territories));


        return true;


      }



      if (remote?.error && !remote.fallbackAllowed) {


        notify(remote.error, 'error');


      }



      return false;


    },



    resetGame: async () => {
      const newSave = applyDailyLoginUpdate(createInitialSave());
      setSave(newSave);
      writeLocalSave(user?.id || null, newSave);
      if (user) {
        try { await saveGame(user.id, newSave); }
        catch (err) { console.error('Error reseteando partida remota:', err); }
      }
    },

    fillEnergyForTest: () => setSave((prev) => ({
      ...prev,
      player: { ...prev.player, energy: Number(prev.player?.maxEnergy ?? 100) },
      note: { msg: 'Energia rellenada al maximo para test.', type: 'success' },
      log: addLog(prev.log, 'TEST: energia rellenada al maximo'),
    })),

    startGame: (name) => {
      const starterPlanet = getPlanetById('nexus-prime');
      setSave((prev) => ({
        ...prev,
        newName: name,
        player: { ...prev.player, name: name || 'Colono', planet: 'nexus-prime', currentPlanet: 'nexus-prime', currentPlanetName: starterPlanet?.name || 'Nexus Prime', currentRegion: prev.player.currentRegion || 'alpha-district' },
        log: addLog(prev.log, `Nuevo colono registrado en el sector: ${name || 'Colono'}`),
        confetti: true,
        note: { msg: `Bienvenido a bordo, ${name || 'Colono'}`, type: 'success' },
      }));
      setTimeout(() => updateSave({ confetti: false }), 2200);
    },

    buyHqUpgrade: async (upgradeKey) => {
      if (user?.id && REMOTE_HQ_UPGRADES_ENABLED) {
        const remote = await upgradeHqSecure({ upgradeKey });
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          setTimeout(() => updateSave({ confetti: false }), 1800);
          notify(remote.message || 'Sede mejorada.', 'success');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }

      const upgrade = HQ_UPGRADES[upgradeKey];
      if (!upgrade) return notify('Mejora de sede no valida.', 'error');

      if (save.hqProjects?.active) return notify('Ya hay una mejora de sede en curso.', 'warn');

      const currentLevel = Number(save.hq?.[upgradeKey] ?? 0);
      const maxLevel     = Number(upgrade.maxLevel ?? 5);
      if (currentLevel >= maxLevel) return notify('Esa mejora ya esta al maximo.', 'warn');

      const cost = getHqUpgradeCost(upgradeKey, currentLevel);
      const missing = (cost.resources || []).find((item) => Number(save.inventory?.[item.key] ?? 0) < Number(item.amount ?? 0));
      if (Number(save.player?.credits ?? 0) < Number(cost.credits ?? 0)) return notify(`Necesitas ${cost.credits} creditos.`, 'error');
      if (missing) return notify(`Faltan recursos para la sede: ${missing.amount} ${missing.key}.`, 'error');

      setSave((prev) => {
        if (prev.hqProjects?.active) return prev;
        const liveLevel = Number(prev.hq?.[upgradeKey] ?? 0);
        const liveCost  = getHqUpgradeCost(upgradeKey, liveLevel);
        const liveMissing = (liveCost.resources || []).find((item) => Number(prev.inventory?.[item.key] ?? 0) < Number(item.amount ?? 0));
        if (liveLevel >= maxLevel || Number(prev.player?.credits ?? 0) < Number(liveCost.credits ?? 0) || liveMissing) return prev;
        const nextInventory = { ...(prev.inventory || {}) };
        (liveCost.resources || []).forEach((item) => {
          nextInventory[item.key] = round2(Number(nextInventory[item.key] || 0) - Number(item.amount || 0));
        });
        const resourceText = liveCost.resources?.length
          ? ` + ${liveCost.resources.map((item) => `${item.amount} ${item.key}`).join(', ')}`
          : '';
        const timeMin = getHqUpgradeTimeMin(liveLevel);
        const startedAt = Date.now();
        return {
          ...prev,
          inventory: nextInventory,
          player: { ...prev.player, credits: Number(prev.player?.credits ?? 0) - Number(liveCost.credits ?? 0) },
          hqProjects: {
            active: {
              key: upgradeKey,
              title: upgrade.name,
              level: liveLevel + 1,
              credits: Number(liveCost.credits ?? 0),
              timeMin,
              adBoostUsed: false,
              resources: liveCost.resources || [],
              startedAt,
              endsAt: startedAt + timeMin * 60 * 1000,
            },
          },
          log:  addLog(prev.log, `Mejora de sede iniciada: ${upgrade.name} nivel ${liveLevel + 1} (-${liveCost.credits} creditos${resourceText}) - ${timeMin} min`),
          note: { msg: `${upgrade.name} en mejora`, type: 'warn' },
        };
      });
      notify(`Mejora iniciada: ${upgrade.name}`, 'success');
    },

    triggerHqAdBoost: async () => {
      const project = save.hqProjects?.active;
      const now = Date.now();
      const sponsoredBlock = getSponsoredBlockReason(save, now);
      if (!project) return notify('Necesitas una mejora de sede activa para acelerar.', 'warn');
      if (project.adBoostUsed) return notify('Esa mejora ya recibio un impulso por anuncio.', 'warn');
      if (sponsoredBlock) return notify(sponsoredBlock, 'warn');
      if (!hasEnoughEnergy(save.player, 'triggerHqAdBoost', save.research, save.hq)) return notify(`Necesitas ${getEnergyCost('triggerHqAdBoost', save.research, save.hq)} de energia.`, 'error');
      if (!openSponsoredAction()) return false;

      let applied = false;
      setSave((prev) => {
        const active = prev.hqProjects?.active;
        if (!active || active.adBoostUsed) return prev;
        const liveBlock = getSponsoredBlockReason(prev, now);
        if (liveBlock) return prev;
        const remaining = Math.max(0, Number(active.endsAt ?? now) - now);
        const factor = Math.max(0.45, Number(getResearchEffects(prev.research).workAdRemainingFactor ?? 0.6) + 0.05);
        const reduced = Math.max(60_000, Math.round(remaining * factor));
        applied = true;
        return {
          ...prev,
          ...markSponsoredAdAction(prev, now),
          player: spendEnergy(prev.player, 'triggerHqAdBoost', prev.research, prev.hq),
          hqProjects: { active: { ...active, adBoostUsed: true, endsAt: now + reduced } },
          log: addLog(prev.log, `Impulso de sede activado en ${active.title}`),
          note: { msg: `Mejora acelerada: ${active.title}`, type: 'success' },
        };
      });
      if (applied) {
        try { await recordEstimatedAdPoolView(); }
        catch (err) { console.error('Error actualizando el pool de anuncios:', err); }
        notify('Mejora de sede acelerada por anuncio.', 'success');
      }
    },

    repairIntegrity: async () => {
      if (user?.id) {
        const remote = await repairIntegritySecure();
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          notify(remote.message || 'Integridad reparada.', 'success');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }

      const repair = getIntegrityRepairCost(save.player);
      if (repair.restore <= 0) return notify('La integridad ya esta al maximo.', 'warn');
      if (Number(save.player?.credits ?? 0) < Number(repair.credits ?? 0)) return notify(`Necesitas ${repair.credits} creditos.`, 'error');
      const missing = (repair.resources || []).find((item) => Number(save.inventory?.[item.key] ?? 0) < Number(item.amount ?? 0));
      if (missing) return notify(`Faltan recursos para reparar: ${missing.amount} ${missing.key}.`, 'error');

      setSave((prev) => {
        const liveRepair = getIntegrityRepairCost(prev.player);
        const liveMissing = (liveRepair.resources || []).find((item) => Number(prev.inventory?.[item.key] ?? 0) < Number(item.amount ?? 0));
        if (liveRepair.restore <= 0 || Number(prev.player?.credits ?? 0) < Number(liveRepair.credits ?? 0) || liveMissing) return prev;
        const nextInventory = { ...(prev.inventory || {}) };
        (liveRepair.resources || []).forEach((item) => {
          nextInventory[item.key] = round2(Number(nextInventory[item.key] || 0) - Number(item.amount || 0));
        });
        const resourceText = liveRepair.resources?.length
          ? ` + ${liveRepair.resources.map((item) => `${item.amount} ${item.key}`).join(', ')}`
          : '';
        return {
          ...prev,
          inventory: nextInventory,
          player: {
            ...prev.player,
            credits: Number(prev.player?.credits ?? 0) - Number(liveRepair.credits ?? 0),
            health: Math.min(100, Number(prev.player?.health ?? 100) + Number(liveRepair.restore ?? 0)),
          },
          log: addLog(prev.log, `Integridad reparada: +${liveRepair.restore} (-${liveRepair.credits} creditos${resourceText})`),
          note: { msg: `Integridad +${liveRepair.restore}`, type: 'success' },
        };
      });
      notify('Integridad reparada.', 'success');
    },
    selectPlanet: async (planet) => {
      if (!planet?.id) { notify('Planeta no valido.', 'error'); return false; }

      const currentPlanetId = getCurrentPlanetIdFromSave(save);
      const unlockStatus    = getPlanetUnlockStatus(planet, save);
      const travelCost      = Number(planet.travelCost ?? 0);
      const travelResources = Array.isArray(planet.travelResources) ? planet.travelResources : [];

      if (planet.id === currentPlanetId)   { notify(`Ya operas desde ${planet.name}.`, 'warn');                                          return false; }
      if (!unlockStatus.unlocked)          { notify(`Aun no puedes viajar a ${planet.name}.`, 'warn');                                   return false; }
      if (Number(save.player?.credits ?? 0) < travelCost) { notify(`Necesitas ${travelCost.toLocaleString('es-ES')} creditos para viajar.`, 'error'); return false; }
      const missingResource = travelResources.find((item) => Number(save.inventory?.[item.key] ?? 0) < Number(item.amount ?? 0));
      if (missingResource) { notify(`Necesitas ${missingResource.amount} ${missingResource.key} para viajar.`, 'error'); return false; }

      let nextSave = null;
      setSave((prev) => {
        const resolved     = getPlanetById(planet.id);
        const nextContracts = refreshContracts([], prev.player.level, planet.id, Date.now(), prev.territories, prev.player?.name).contracts;
        const nextInventory = { ...(prev.inventory || {}) };
        travelResources.forEach((item) => {
          nextInventory[item.key] = Math.max(0, Number(nextInventory[item.key] ?? 0) - Number(item.amount ?? 0));
        });
        nextSave = {
          ...prev,
          player: { ...prev.player, planet: planet.id, currentPlanet: planet.id, currentPlanetName: resolved.name, currentRegion: prev.player.currentRegion || 'alpha-district', credits: Math.max(0, Number(prev.player?.credits ?? 0) - travelCost) },
          contracts: nextContracts,
          inventory: nextInventory,
          log:  addLog(prev.log, `Viaje orbital completado hacia ${resolved.name} -${travelCost.toLocaleString('es-ES')} creditos`),
          note: { msg: `Destino fijado: ${resolved.name}`, type: 'success' },
          confetti: true,
        };
        return nextSave;
      });
      setTimeout(() => updateSave({ confetti: false }), 2200);
      notify(`Billete orbital comprado: destino ${planet.name}`, 'success');

      try {
        if (nextSave) {
          writeLocalSave(user?.id || null, nextSave);
          if (user) await persistRemoteSave(user.id, nextSave, { force: true });
        }
        return true;
      } catch (err) {
        console.error('Error guardando planeta:', err);
        notify('No se pudo guardar el planeta.', 'error');
        return false;
      }
    },

    setCurrentRegion: (regionKey) => {
      const region     = getRegionEconomy(regionKey, getCurrentPlanetIdFromSave(save));
      const currentKey = getCurrentRegionKeyFromSave(save);
      if (!region)                { notify('Region no valida.', 'error');           return; }
      if (currentKey === region.key) { notify('Esa ya es tu region operativa.', 'warn'); return; }
      if (Number(save.player.credits ?? 0) < REGION_CHANGE_COST) {
        notify(`Necesitas ${REGION_CHANGE_COST} creditos para cambiar de region.`, 'error'); return;
      }
      if (!hasEnoughEnergy(save.player, 'setCurrentRegion', save.research, save.hq)) {
        notify(`Necesitas ${getEnergyCost('setCurrentRegion', save.research, save.hq)} de energia para mover la operacion.`, 'error'); return;
      }
      setSave((prev) => ({
        ...prev,
        player: { ...spendEnergy(prev.player, 'setCurrentRegion', prev.research, prev.hq), credits: Number(prev.player.credits ?? 0) - REGION_CHANGE_COST, currentRegion: region.key },
        log:  addLog(prev.log, `?? Region operativa reasignada a ${region.name}  -  coste ${REGION_CHANGE_COST} creditos  -  ${region.bonusLabel}`),
        note: { msg: `?? Region activa: ${region.name} (-${REGION_CHANGE_COST} creditos)`, type: 'success' },
      }));
    },

    doWork: async (job) => {
      if (user?.id && REMOTE_WORK_ACTIONS_ENABLED) {
        const remote = await startWorkSecure({ jobLabel: job?.label });
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          notify(remote.message || `${job?.label || 'Trabajo'} en marcha`, 'success');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }

      if (save.activeJob) return notify('Ya tienes un trabajo en curso.', 'warn');
      if (save.player.level < Number(job.unlockLevel ?? 1)) return notify(`Necesitas nivel ${job.unlockLevel}.`, 'error');
      if (save.player.energy < Number(job.cost ?? 0)) return notify('No tienes suficiente energia.', 'error');
      const integrity = getIntegrityEffects(save.player);
      if (integrity.health < 15) return notify('Integridad critica: repara en la sede antes de trabajar.', 'error');

      const now = Date.now();
      const durationSec = (() => {
        const explicit = Number(job?.durationSec ?? 0);
        if (explicit > 0) return explicit;
        const byLevel = { 1: 60, 2: 180, 3: 540 };
        return byLevel[Number(job?.unlockLevel ?? 1)] || 60;
      })();
      const adjustedDurationSec = Math.max(10, Math.ceil(durationSec * Number(integrity.workDurationMult ?? 1)));
      const healthDelta = Number(job.hd ?? 0);

      setSave((prev) => ({
        ...prev,
        activeJob: {
          label: job.label,
          icon: job.icon,
          item: job.item,
          credits: Number(job.credits ?? job.euros ?? 0),
          xp: Number(job.xp ?? 0),
          cost: Number(job.cost ?? 0),
          hd: healthDelta,
          unlockLevel: Number(job.unlockLevel ?? 1),
          durationSec: adjustedDurationSec,
          startedAt: now,
          endAt: now + adjustedDurationSec * 1000,
          resourceAmount: round2(Number(job.resourceAmount ?? 1)),
          bonusRate: Number(job.bonusRate ?? 0),
          regionalBonusRate: Number(job.regionalBonusRate ?? 0),
          controlBonusRate: Number(job.controlBonusRate ?? 0),
          operationRewards: Array.isArray(job.operationRewards)
            ? job.operationRewards.map((reward) => ({ key: reward.key, amount: Number(reward.amount ?? 0) }))
            : [],
        },
        player: { ...prev.player, energy: Math.max(0, Number(prev.player.energy ?? 0) - Number(job.cost ?? 0)) },
        log:  addLog(prev.log, `Trabajo iniciado: ${job.icon || ''} ${job.label} - duracion ${adjustedDurationSec}s`),
        note: { msg: `${job.label} en marcha`, type: 'success' },
      }));
    },
    doBattle: async (territory) => {
      if (territory?.id === undefined || territory?.id === null) return notify('Territorio no valido.', 'error');
      try {
        if (user?.id && REMOTE_TERRITORY_ATTACKS_ENABLED) {
          const remote = await attackTerritorySecure({ territoryId: territory.id });
          if (remote?.ok && remote.saveData) {
            setSave(normalizeSave(remote.saveData));
            updateMission('battle');
            if (remote.result?.completed) updateMission('conquer');
            notify(
              remote.result?.completed
                ? `Sector asegurado! +${remote.result?.rewardCredits ?? 0} creditos`
                : remote.result?.win
                  ? `Campana avanzada: ${Math.round(Number(remote.result?.progress ?? 0))}%`
                  : `Derrota tactica. Intel recuperada: ${Math.round(Number(remote.result?.progress ?? 0))}%`,
              remote.result?.win ? 'success' : 'error'
            );
            return;
          }
          if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
        }
        if (territory.controller === save.player.name)              return notify('Ya controlas este territorio.', 'warn');
        const battleEnergyCost = getEnergyCost('doBattle', save.research, save.hq);
        const hasPreparedAttack = Boolean(territory?.activeOperation || territory?.campaign?.operation);
        if (!hasPreparedAttack && save.player.energy < battleEnergyCost) return notify(`Necesitas ${battleEnergyCost} de energia.`, 'error');
        if (!hasPreparedAttack && save.player.credits < TERRITORY_ATTACK_CREDIT_COST) return notify(`Necesitas ${TERRITORY_ATTACK_CREDIT_COST} creditos.`, 'error');
        if (!hasPreparedAttack && !hasResourceCost(save.inventory, OPERATION_RESOURCE_COSTS.conquest)) return notify(`Faltan recursos operativos: ${formatResourceCost(OPERATION_RESOURCE_COSTS.conquest)}.`, 'error');
        if (!getIntegrityEffects(save.player).canBattle)              return notify('Integridad critica: repara en la sede antes de conquistar.', 'error');

        let battleApplied = false, battleWon = false, battleReward = 0, campaignCompleted = false, campaignProgress = 0;
        let operationStarted = false, operationPendingEta = 0;

        setSave((prev) => {
          const liveTer = (prev.territories || []).find((t) => t.id === territory.id);
          if (!liveTer || liveTer.controller === prev.player.name) return prev;

          const preview = getTerritoryBattlePreview({ territory: liveTer, player: prev.player, inventory: prev.inventory, territories: prev.territories, playerName: prev.player.name, planetId: getCurrentPlanetIdFromSave(prev), research: prev.research, hq: prev.hq });
          if (!preview) return prev;

          const currentCampaign = getTerritoryCampaign(liveTer, prev.player.name);
          const currentOperation = normalizeTerritoryOperation(currentCampaign.operation || liveTer.activeOperation);
          const battleNow = Date.now();
          const eta = getTerritoryOperationEtaMs(currentOperation, battleNow);

          if (currentOperation && eta > 0) {
            operationPendingEta = eta;
            return prev;
          }

          if (!currentOperation) {
            const liveEnergy = getEnergyCost('doBattle', prev.research, prev.hq);
            if (Number(prev.player?.energy ?? 0) < liveEnergy) return prev;
            if (Number(prev.player?.credits ?? 0) < TERRITORY_ATTACK_CREDIT_COST) return prev;
            if (!hasResourceCost(prev.inventory, OPERATION_RESOURCE_COSTS.conquest)) return prev;

            const operation = createTerritoryOperation({
              type: 'conquest',
              ownerName: prev.player.name,
              targetController: liveTer.controller || null,
              power: preview.attackPower,
              stealth: 34 + Math.min(28, Math.sqrt(Math.max(0, Number(prev.inventory?.mineral ?? 0)))),
              now: battleNow,
            });
            const nextCampaign = {
              ownerName: prev.player.name,
              progress: currentCampaign.progress,
              stageId: getTerritoryCampaignStage(currentCampaign.progress).id,
              attempts: Number(currentCampaign.attempts ?? 0),
              targetController: liveTer.controller || null,
              operation,
              updatedAt: battleNow,
            };

            battleApplied = true;
            operationStarted = true;
            campaignProgress = currentCampaign.progress;

            return {
              ...prev,
              player: {
                ...spendEnergy(prev.player, 'doBattle', prev.research, prev.hq),
                credits: Number(prev.player.credits ?? 0) - TERRITORY_ATTACK_CREDIT_COST,
              },
              inventory: spendResourceCost(prev.inventory, OPERATION_RESOURCE_COSTS.conquest),
              territories: prev.territories.map((t) =>
                t.id === liveTer.id
                  ? {
                      ...t,
                      campaign: nextCampaign,
                      activeOperation: operation,
                      threat: clamp(Number(t.threat ?? 0) + 3, 0, 100),
                    }
                  : t
              ),
              log: addLog(prev.log, `Operacion de conquista iniciada en ${liveTer.name}. Resolucion en ${formatEta(operation.resolvesAt - battleNow)}.`),
              note: { msg: `${liveTer.name}: operacion en preparacion (${formatEta(operation.resolvesAt - battleNow)})`, type: 'success' },
              selTer: prev.selTer?.id === liveTer.id
                ? { ...liveTer, campaign: nextCampaign, activeOperation: operation, threat: clamp(Number(liveTer.threat ?? 0) + 3, 0, 100) }
                : prev.selTer,
            };
          }

          const operationProgress = getTerritoryOperationProgress(currentOperation, battleNow);
          const defenseProfile = getTerritoryDefenseProfile(liveTer);
          const hiddenResistance = Number(defenseProfile.physical ?? 0) * 0.22 + Number(defenseProfile.counterIntel ?? 0) * 0.08;
          const preparedPower = Number(currentOperation.power ?? preview.attackPower) + operationProgress * 0.08;
          const adjustedChance = clamp(preview.successChance + (preparedPower - preview.attackPower) * 1.8 - hiddenResistance * 0.32, 6, liveTer.controller ? 68 : 82);
          const win = Math.random() * 100 < adjustedChance;
          const progressGain = win ? Number(preview.progressOnWin ?? 30) : Number(preview.progressOnLoss ?? 8);
          const nextCampaignProgress = clamp(currentCampaign.progress + progressGain, 0, 100);
          const completesCampaign = win && nextCampaignProgress >= 100;
          const reward = completesCampaign ? round2(Number(preview.rewardCredits) * (0.9 + Math.random() * 0.3)) : 0;
          const nextPlayer = applyPlayerXpGain(prev.player, win ? 55 : 20);
          const re = getResearchEffects(prev.research);
          const conqueredStability = clamp(58 + Number(re.conquestStarterStability ?? 0), 0, 100);
          const conqueredFortification = Math.max(
            6 + Number(re.conquestStarterFortification ?? 0),
            Number(liveTer.fortification ?? 0)
          );
          battleApplied = true;
          battleWon = win;
          battleReward = reward;
          campaignCompleted = completesCampaign;
          campaignProgress = nextCampaignProgress;
          const nextCampaign = completesCampaign
            ? null
            : {
                ownerName: prev.player.name,
                progress: nextCampaignProgress,
                stageId: getTerritoryCampaignStage(nextCampaignProgress).id,
                attempts: Number(currentCampaign.attempts ?? 0) + 1,
                targetController: liveTer.controller || null,
                operation: null,
                updatedAt: battleNow,
              };

          return {
            ...prev,
            player: { ...nextPlayer, credits: Number(prev.player.credits ?? 0) + reward, health: win ? Math.max(0, Number(prev.player.health ?? 100) - 5) : Math.max(10, Number(prev.player.health ?? 100) - 12) },
            territories: prev.territories.map((t) =>
              t.id === liveTer.id
                ? completesCampaign
                  ? { ...t, controller: prev.player.name, stability: conqueredStability, threat: 38, fortification: conqueredFortification, siegeTick: 0, siegeAttacker: null, siegeStartedAt: null, campaign: null, activeOperation: null, sectorMemory: updateTerritoryMemory(t, 'conquered', { actor: prev.player.name, day: prev.day, now: battleNow }) }
                  : {
                      ...t,
                      campaign: nextCampaign,
                      activeOperation: null,
                      stability: clamp(Number(t.stability ?? 0) - (win ? 4 : 1), 0, 100),
                      threat: clamp(Number(t.threat ?? 0) + (win ? 5 : 2), 0, 100),
                    }
                : t
            ),
            battle: { ter: liveTer, win, rew: reward, pow: preview.attackPower.toFixed(1), def: preview.defensePower.toFixed(1), chance: Math.round(adjustedChance), campaignCompleted: completesCampaign, progress: nextCampaignProgress, stage: getTerritoryCampaignStage(nextCampaignProgress).label },
            stats: { ...prev.stats, battles: Number(prev.stats?.battles ?? 0) + 1, conquests: Number(prev.stats?.conquests ?? 0) + (completesCampaign ? 1 : 0) },
            log: addLog(
              prev.log,
              completesCampaign
                ? `Campana completada en ${liveTer.name}. +${reward} creditos`
                : win
                  ? `Campana avanza en ${liveTer.name}: ${Math.round(nextCampaignProgress)}%`
                  : `Incursion fallida en ${liveTer.name}: inteligencia parcial (${Math.round(nextCampaignProgress)}%)`
            ),
            selTer: prev.selTer?.id === liveTer.id
              ? (completesCampaign
                ? { ...liveTer, controller: prev.player.name, stability: conqueredStability, threat: 38, fortification: conqueredFortification, campaign: null, activeOperation: null, sectorMemory: updateTerritoryMemory(liveTer, 'conquered', { actor: prev.player.name, day: prev.day, now: battleNow }) }
                : { ...liveTer, campaign: nextCampaign, activeOperation: null, stability: clamp(Number(liveTer.stability ?? 0) - (win ? 4 : 1), 0, 100), threat: clamp(Number(liveTer.threat ?? 0) + (win ? 5 : 2), 0, 100) })
              : prev.selTer,
          };
        });

        if (operationPendingEta > 0) return notify(`La operacion aun esta en preparacion: faltan ${formatEta(operationPendingEta)}.`, 'warn');
        if (!battleApplied) return notify('La ofensiva ya no es valida con el estado actual.', 'warn');
        updateMission('battle');
        if (campaignCompleted) updateMission('conquer');
        notify(
          operationStarted
            ? `Operacion lanzada. Resolucion en unas ${formatEta(36 * 60 * 60 * 1000)}.`
            : campaignCompleted
            ? `Sector asegurado! +${battleReward} creditos`
            : battleWon
              ? `Campana avanzada: ${Math.round(campaignProgress)}%`
              : `Derrota tactica. Intel recuperada: ${Math.round(campaignProgress)}%`,
          operationStarted || battleWon ? 'success' : 'error'
        );
        setTimeout(() => updateSave({ battle: null }), 3000);
      } catch (err) {
        console.error('Error lanzando ofensiva:', err);
        notify('La ofensiva fallo por un error interno.', 'error');
      }
    },

    sabotageTerritory: async (territoryId) => {
      const territory = (save.territories || []).find((t) => t.id === territoryId);
      if (!territory)                                                      return notify('Territorio no valido.', 'error');
      if (!territory.controller || territory.controller === save.player.name) return notify('Solo puedes sabotear territorios hostiles.', 'warn');
      const hasPreparedSabotage = Boolean(territory.sabotageOperation);
      if (!hasPreparedSabotage && Number(save.player.credits ?? 0) < TERRITORY_SABOTAGE_COST) return notify(`Necesitas ${TERRITORY_SABOTAGE_COST} creditos para sabotear.`, 'error');
      if (!hasPreparedSabotage && !hasEnoughEnergy(save.player, 'sabotageTerritory', save.research, save.hq)) return notify(`Necesitas ${getEnergyCost('sabotageTerritory', save.research, save.hq)} de energia.`, 'error');
      if (!hasPreparedSabotage && !hasResourceCost(save.inventory, OPERATION_RESOURCE_COSTS.sabotage)) return notify(`Faltan recursos operativos: ${formatResourceCost(OPERATION_RESOURCE_COSTS.sabotage)}.`, 'error');

      if (user?.id && (REMOTE_TERRITORY_ACTIONS_ENABLED || REMOTE_TERRITORY_REINFORCE_ENABLED)) {
        const remote = await sabotageTerritorySecure({ territoryId });
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          notify(remote.message || 'Sabotaje completado online.', 'success');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }

      setSave((prev) => {
        const re     = getResearchEffects(prev.research);
        const now = Date.now();
        const liveTerritory = (prev.territories || []).find((t) => t.id === territoryId);
        if (!liveTerritory || !liveTerritory.controller || liveTerritory.controller === prev.player?.name) return prev;
        const currentOperation = normalizeTerritoryOperation(liveTerritory.sabotageOperation);
        const eta = getTerritoryOperationEtaMs(currentOperation, now);

        if (currentOperation && eta > 0) {
          return {
            ...prev,
            note: { msg: `Sabotaje en preparacion: faltan ${formatEta(eta)}`, type: 'warn' },
          };
        }

        if (!currentOperation) {
          if (!hasResourceCost(prev.inventory, OPERATION_RESOURCE_COSTS.sabotage)) return prev;
          const operation = createTerritoryOperation({
            type: 'sabotage',
            ownerName: prev.player?.name,
            targetController: liveTerritory.controller || null,
            power: 14 + Math.round((Number(re.conquestPowerMult ?? 1) - 1) * 20),
            stealth: 58,
            now,
          });
          const nextTerritories = prev.territories.map((t) =>
            t.id !== territoryId ? t : {
              ...t,
              sabotageOperation: operation,
              threat: clamp(Number(t.threat ?? 0) + 2, 0, 100),
            }
          );
          return {
            ...prev,
            territories: nextTerritories,
            inventory: spendResourceCost(prev.inventory, OPERATION_RESOURCE_COSTS.sabotage),
            player: { ...spendEnergy(prev.player, 'sabotageTerritory', prev.research, prev.hq), credits: Number(prev.player.credits ?? 0) - TERRITORY_SABOTAGE_COST },
            log: addLog(prev.log, `Sabotaje iniciado en ${liveTerritory.name}. Resolucion en ${formatEta(operation.resolvesAt - now)}.`),
            note: { msg: `${liveTerritory.name}: sabotaje en marcha (${formatEta(operation.resolvesAt - now)})`, type: 'success' },
            selTer: prev.selTer?.id === territoryId ? nextTerritories.find((t) => t.id === territoryId) || prev.selTer : prev.selTer,
          };
        }

        const defense = getTerritoryDefenseProfile(liveTerritory);
        const resistance = Number(defense.counterIntel ?? 0) * 0.35 + Number(defense.cyber ?? 0) * 0.12;
        const operationPower = Number(currentOperation.power ?? 14);
        const power = clamp(operationPower - resistance * 0.16 + Math.random() * 8, 4, 28);
        const nextTerritories = prev.territories.map((t) =>
          t.id !== territoryId ? t : {
            ...t,
            stability:    clamp(Number(t.stability    ?? 0) - power,       0, 100),
            threat:       clamp(Number(t.threat       ?? 0) + power + 4,   0, 100),
            fortification:clamp(Number(t.fortification?? 0) - (power - 2), 0, 100),
            sabotageOperation: null,
          }
        );
        return {
          ...prev, territories: nextTerritories,
          log:  addLog(prev.log, `Sabotaje resuelto en ${territory.name}: -${Math.round(power)} estabilidad/defensa.`),
          note: { msg: `${territory.name} ha quedado expuesto.`, type: 'success' },
          selTer: prev.selTer?.id === territoryId ? nextTerritories.find((t) => t.id === territoryId) || prev.selTer : prev.selTer,
        };
      });
      notify('Operacion de sabotaje actualizada.', 'success');
    },

    spyTerritory: async (territoryId) => {
      const territory = (save.territories || []).find((t) => Number(t.id) === Number(territoryId));
      if (!territory) return notify('Territorio no valido.', 'error');
      if (!territory.controller || territory.controller === save.player.name) return notify('Solo puedes espiar territorios hostiles.', 'warn');

      const hasPreparedSpy = Boolean(territory.intelOperation);
      if (!hasPreparedSpy && Number(save.player?.credits ?? 0) < TERRITORY_SPY_COST) return notify(`Necesitas ${TERRITORY_SPY_COST} creditos para espiar.`, 'error');
      if (!hasPreparedSpy && !hasEnoughEnergy(save.player, 'spyTerritory', save.research, save.hq)) return notify(`Necesitas ${getEnergyCost('spyTerritory', save.research, save.hq)} de energia.`, 'error');
      if (!hasPreparedSpy && !hasResourceCost(save.inventory, OPERATION_RESOURCE_COSTS.spy)) return notify(`Faltan recursos operativos: ${formatResourceCost(OPERATION_RESOURCE_COSTS.spy)}.`, 'error');

      let result = 'pending';
      let reportConfidence = 0;
      setSave((prev) => {
        const now = Date.now();
        const liveTerritory = (prev.territories || []).find((t) => Number(t.id) === Number(territoryId));
        if (!liveTerritory || !liveTerritory.controller || liveTerritory.controller === prev.player?.name) return prev;
        const currentOperation = normalizeTerritoryOperation(liveTerritory.intelOperation);
        const eta = getTerritoryOperationEtaMs(currentOperation, now);

        if (currentOperation && eta > 0) {
          result = 'waiting';
          return {
            ...prev,
            note: { msg: `Espionaje en curso: faltan ${formatEta(eta)}`, type: 'warn' },
          };
        }

        if (!currentOperation) {
          if (!hasResourceCost(prev.inventory, OPERATION_RESOURCE_COSTS.spy)) return prev;
          const operation = createTerritoryOperation({
            type: 'spy',
            ownerName: prev.player?.name,
            targetController: liveTerritory.controller || null,
            power: 18 + Number(prev.player?.level ?? 1) * 1.5,
            stealth: 64,
            now,
          });
          const nextTerritories = prev.territories.map((t) => Number(t.id) === Number(territoryId) ? { ...t, intelOperation: operation } : t);
          return {
            ...prev,
            territories: nextTerritories,
            inventory: spendResourceCost(prev.inventory, OPERATION_RESOURCE_COSTS.spy),
            player: { ...spendEnergy(prev.player, 'spyTerritory', prev.research, prev.hq), credits: Number(prev.player?.credits ?? 0) - TERRITORY_SPY_COST },
            log: addLog(prev.log, `Espionaje iniciado en ${liveTerritory.name}. Informe en ${formatEta(operation.resolvesAt - now)}.`),
            note: { msg: `${liveTerritory.name}: espionaje en marcha`, type: 'success' },
            selTer: prev.selTer?.id === territoryId ? nextTerritories.find((t) => Number(t.id) === Number(territoryId)) || prev.selTer : prev.selTer,
          };
        }

        const defense = getTerritoryDefenseProfile(liveTerritory);
        const resistance = Number(defense.counterIntel ?? 0) * 0.42 + Number(defense.social ?? 0) * 0.12;
        const score = Number(currentOperation.power ?? 20) + Math.random() * 28 - resistance * 0.28;
        const confidence = clamp(45 + score, 18, 92);
        reportConfidence = Math.round(confidence);
        result = confidence >= 45 ? 'success' : 'partial';
        const exact = confidence >= 70;
        const profile = getTerritoryDefenseProfile(liveTerritory);
        const report = {
          createdAt: now,
          expiresAt: now + 48 * 60 * 60 * 1000,
          confidence: reportConfidence,
          ownerName: prev.player?.name,
          summary: exact ? 'Informe fiable' : 'Informe parcial',
          defense: exact
            ? profile
            : Object.fromEntries(Object.entries(profile).map(([key, value]) => [key, clamp(Math.round(Number(value) + (Math.random() * 24 - 12)), 0, 100)])),
          assets: exact
            ? (liveTerritory.defenseAssets || []).map((asset) => ({ type: asset.type, level: asset.level }))
            : (liveTerritory.defenseAssets || []).slice(0, 2).map((asset) => ({ type: asset.type, level: '?' })),
        };
        const nextTerritories = prev.territories.map((t) => Number(t.id) === Number(territoryId)
          ? { ...t, intelOperation: null, intelReport: report, threat: clamp(Number(t.threat ?? 0) + (result === 'partial' ? 2 : 0), 0, 100) }
          : t);
        return {
          ...prev,
          territories: nextTerritories,
          log: addLog(prev.log, `Informe de inteligencia en ${liveTerritory.name}: confianza ${reportConfidence}%.`),
          note: { msg: `Inteligencia obtenida: ${reportConfidence}% confianza`, type: 'success' },
          selTer: prev.selTer?.id === territoryId ? nextTerritories.find((t) => Number(t.id) === Number(territoryId)) || prev.selTer : prev.selTer,
        };
      });

      if (result === 'waiting') return notify('El espionaje aun no esta listo.', 'warn');
      if (result === 'pending') return notify('Espionaje iniciado.', 'success');
      notify(`Informe de inteligencia listo (${reportConfidence}%).`, 'success');
    },

    hackTerritory: async (territoryId) => {
      const territory = (save.territories || []).find((t) => Number(t.id) === Number(territoryId));
      if (!territory) return notify('Territorio no valido.', 'error');
      if (!territory.controller || territory.controller === save.player.name) return notify('Solo puedes hackear territorios hostiles.', 'warn');

      const hasPreparedHack = Boolean(territory.hackOperation);
      if (!hasPreparedHack && Number(save.player?.credits ?? 0) < TERRITORY_HACK_COST) return notify(`Necesitas ${TERRITORY_HACK_COST} creditos para hackear.`, 'error');
      if (!hasPreparedHack && !hasEnoughEnergy(save.player, 'hackTerritory', save.research, save.hq)) return notify(`Necesitas ${getEnergyCost('hackTerritory', save.research, save.hq)} de energia.`, 'error');
      if (!hasPreparedHack && !hasResourceCost(save.inventory, OPERATION_RESOURCE_COSTS.hack)) return notify(`Faltan recursos operativos: ${formatResourceCost(OPERATION_RESOURCE_COSTS.hack)}.`, 'error');

      let result = 'pending';
      setSave((prev) => {
        const now = Date.now();
        const liveTerritory = (prev.territories || []).find((t) => Number(t.id) === Number(territoryId));
        if (!liveTerritory || !liveTerritory.controller || liveTerritory.controller === prev.player?.name) return prev;
        const currentOperation = normalizeTerritoryOperation(liveTerritory.hackOperation);
        const eta = getTerritoryOperationEtaMs(currentOperation, now);

        if (currentOperation && eta > 0) {
          result = 'waiting';
          return { ...prev, note: { msg: `Hackeo en curso: faltan ${formatEta(eta)}`, type: 'warn' } };
        }

        if (!currentOperation) {
          if (!hasResourceCost(prev.inventory, OPERATION_RESOURCE_COSTS.hack)) return prev;
          const operation = createTerritoryOperation({
            type: 'hack',
            ownerName: prev.player?.name,
            targetController: liveTerritory.controller || null,
            power: 16 + Number(prev.player?.level ?? 1) * 1.8,
            stealth: 52,
            now,
          });
          const nextTerritories = prev.territories.map((t) => Number(t.id) === Number(territoryId) ? { ...t, hackOperation: operation } : t);
          return {
            ...prev,
            territories: nextTerritories,
            inventory: spendResourceCost(prev.inventory, OPERATION_RESOURCE_COSTS.hack),
            player: { ...spendEnergy(prev.player, 'hackTerritory', prev.research, prev.hq), credits: Number(prev.player?.credits ?? 0) - TERRITORY_HACK_COST },
            log: addLog(prev.log, `Intrusion hacker iniciada en ${liveTerritory.name}. Resolucion en ${formatEta(operation.resolvesAt - now)}.`),
            note: { msg: `${liveTerritory.name}: intrusion hacker preparada`, type: 'success' },
            selTer: prev.selTer?.id === territoryId ? nextTerritories.find((t) => Number(t.id) === Number(territoryId)) || prev.selTer : prev.selTer,
          };
        }

        const defense = getTerritoryDefenseProfile(liveTerritory);
        const resistance = Number(defense.cyber ?? 0) * 0.48 + Number(defense.counterIntel ?? 0) * 0.18;
        const power = clamp(Number(currentOperation.power ?? 18) + Math.random() * 18 - resistance * 0.18, 3, 26);
        result = power >= 10 ? 'success' : 'partial';
        const nextTerritories = prev.territories.map((t) => Number(t.id) === Number(territoryId)
          ? {
              ...t,
              hackOperation: null,
              stability: clamp(Number(t.stability ?? 0) - power * 0.55, 0, 100),
              fortification: clamp(Number(t.fortification ?? 0) - power * 0.7, 0, 100),
              threat: clamp(Number(t.threat ?? 0) + power * 0.45, 0, 100),
            }
          : t);
        return {
          ...prev,
          territories: nextTerritories,
          log: addLog(prev.log, `Hackeo resuelto en ${liveTerritory.name}: brecha ${Math.round(power)}.`),
          note: { msg: `Brecha hacker: ${Math.round(power)} impacto`, type: result === 'success' ? 'success' : 'warn' },
          selTer: prev.selTer?.id === territoryId ? nextTerritories.find((t) => Number(t.id) === Number(territoryId)) || prev.selTer : prev.selTer,
        };
      });

      if (result === 'waiting') return notify('El hackeo aun no esta listo.', 'warn');
      if (result === 'pending') return notify('Hackeo iniciado.', 'success');
      notify(result === 'success' ? 'Hackeo resuelto con exito.' : 'Hackeo parcial: la defensa redujo el impacto.', result === 'success' ? 'success' : 'warn');
    },

    activateTerritoryDefense: async (territoryId, type = 'counterintel') => {
      const territory = (save.territories || []).find((t) => Number(t.id) === Number(territoryId));
      if (!territory) return notify('Territorio no valido.', 'error');
      if (territory.controller !== save.player.name) return notify('Solo puedes activar defensa en territorios propios.', 'error');
      if (!TERRITORY_DEFENSE_RESPONSE_TYPES[type]) return notify('Respuesta defensiva no valida.', 'error');
      if (Number(save.player?.credits ?? 0) < TERRITORY_DEFENSE_RESPONSE_COST) return notify(`Necesitas ${TERRITORY_DEFENSE_RESPONSE_COST} creditos.`, 'error');
      if (!hasEnoughEnergy(save.player, 'territoryDefenseResponse', save.research, save.hq)) return notify(`Necesitas ${getEnergyCost('territoryDefenseResponse', save.research, save.hq)} de energia.`, 'error');
      if (!hasResourceCost(save.inventory, OPERATION_RESOURCE_COSTS.defense)) return notify(`Faltan recursos operativos: ${formatResourceCost(OPERATION_RESOURCE_COSTS.defense)}.`, 'error');

      let applied = false;
      setSave((prev) => {
        const liveTerritory = (prev.territories || []).find((t) => Number(t.id) === Number(territoryId));
        if (!liveTerritory || liveTerritory.controller !== prev.player?.name) return prev;
        if (!hasResourceCost(prev.inventory, OPERATION_RESOURCE_COSTS.defense)) return prev;
        const now = Date.now();
        const response = createTerritoryDefenseResponse(type, now);
        const nextTerritories = prev.territories.map((t) => Number(t.id) === Number(territoryId)
          ? {
              ...t,
              defenseResponse: response,
              threat: clamp(Number(t.threat ?? 0) - 8, 0, 100),
              sectorMemory: updateTerritoryMemory(t, 'defended', { actor: prev.player?.name, day: prev.day, now }),
            }
          : t);
        applied = true;
        return {
          ...prev,
          territories: nextTerritories,
          inventory: spendResourceCost(prev.inventory, OPERATION_RESOURCE_COSTS.defense),
          player: { ...spendEnergy(prev.player, 'territoryDefenseResponse', prev.research, prev.hq), credits: Number(prev.player?.credits ?? 0) - TERRITORY_DEFENSE_RESPONSE_COST },
          log: addLog(prev.log, `${response.label} activada en ${liveTerritory.name}.`),
          note: { msg: `${response.label}: 12h de cobertura`, type: 'success' },
          selTer: prev.selTer?.id === territoryId ? nextTerritories.find((t) => Number(t.id) === Number(territoryId)) || prev.selTer : prev.selTer,
        };
      });

      notify(applied ? 'Respuesta defensiva activada.' : 'No se pudo activar la defensa.', applied ? 'success' : 'warn');
    },

    reinforceTerritory: async (territoryId) => {
      const territory = (save.territories || []).find((t) => t.id === territoryId);
      if (!territory)                                      return notify('Territorio no valido.', 'error');
      if (territory.controller !== save.player.name)       return notify('Solo puedes reforzar territorios bajo tu control.', 'error');
      if (Number(save.player.credits ?? 0) < TERRITORY_REINFORCE_COST) return notify(`Necesitas ${TERRITORY_REINFORCE_COST} creditos.`, 'error');
      if (!hasEnoughEnergy(save.player, 'reinforceTerritory', save.research, save.hq)) return notify(`Necesitas ${getEnergyCost('reinforceTerritory', save.research, save.hq)} de energia.`, 'error');

      if (user?.id && REMOTE_TERRITORY_ACTIONS_ENABLED) {
        const remote = await reinforceTerritorySecure({ territoryId });
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          notify(remote.message || 'Refuerzo desplegado online.', 'success');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }
      setSave((prev) => {
        const re = getResearchEffects(prev.research);
        const defenseNow = Date.now();
        const nextTerritories = prev.territories.map((t) =>
          t.id !== territoryId ? t : {
            ...t,
            stability:    clamp(Number(t.stability    ?? 0) + 28 + Number(re.territoryReinforceStability       ?? 0), 0, 100),
            threat:       clamp(Number(t.threat       ?? 0) - 34 - Number(re.territoryReinforceThreatReduction ?? 0), 0, 100),
            fortification:clamp(Number(t.fortification?? 0) + 26 + Number(re.territoryReinforceFortification   ?? 0), 0, 100),
            enemyCampaign: t.enemyCampaign
              ? { ...t.enemyCampaign, progress: clamp(Number(t.enemyCampaign.progress ?? 0) - 18, 0, 100), updatedAt: defenseNow }
              : null,
            sectorMemory: updateTerritoryMemory(t, 'defended', { actor: prev.player?.name, day: prev.day, now: defenseNow }),
          }
        );
        return {
          ...prev, territories: nextTerritories,
          player: { ...spendEnergy(prev.player, 'reinforceTerritory', prev.research, prev.hq), credits: Number(prev.player.credits ?? 0) - TERRITORY_REINFORCE_COST },
          log:  addLog(prev.log, `Refuerzo desplegado en ${territory.name}  -  -${TERRITORY_REINFORCE_COST} creditos`),
          note: { msg: `${territory.name} ha sido reforzado.`, type: 'success' },
          selTer: prev.selTer?.id === territoryId ? nextTerritories.find((t) => t.id === territoryId) || prev.selTer : prev.selTer,
        };
      });
      notify('Refuerzo desplegado.', 'success');
    },

    buildTerritoryFort: async (territoryId) => {
      const territory = (save.territories || []).find((t) => Number(t.id) === Number(territoryId));
      if (!territory) return notify('Territorio no valido.', 'error');
      if (territory.controller !== save.player.name) return notify('Solo puedes construir fortines en territorios bajo tu control.', 'error');
      if (Number(territory.fortification ?? 0) >= 100) return notify('Este territorio ya esta completamente fortificado.', 'warn');

      const cost = getFortificationCost(territory);
      const missing = cost.find((item) => Number(save.inventory?.[item.key] ?? 0) < Number(item.amount ?? 0));
      if (missing) return notify(`Faltan recursos para el fortin: ${formatResourceCost(cost)}.`, 'error');

      if (user?.id && REMOTE_TERRITORY_ACTIONS_ENABLED) {
        const remote = await buildTerritoryFortSecure({ territoryId });
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          updateMission('build_fort');
          notify(remote.message || 'Fortin construido online.', 'success');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }
      let built = false;
      setSave((prev) => {
        const liveTerritory = (prev.territories || []).find((t) => Number(t.id) === Number(territoryId));
        if (!liveTerritory || liveTerritory.controller !== prev.player?.name) return prev;
        if (Number(liveTerritory.fortification ?? 0) >= 100) return prev;

        const liveCost = getFortificationCost(liveTerritory);
        const liveMissing = liveCost.find((item) => Number(prev.inventory?.[item.key] ?? 0) < Number(item.amount ?? 0));
        if (liveMissing) return prev;

        const nextInventory = { ...(prev.inventory || {}) };
        liveCost.forEach((item) => {
          nextInventory[item.key] = round2(Number(nextInventory[item.key] || 0) - Number(item.amount || 0));
        });
        const defenseNow = Date.now();
        const nextAssetType = getNextDefenseAssetType(liveTerritory);
        const currentAssets = Array.isArray(liveTerritory.defenseAssets) ? liveTerritory.defenseAssets : [];
        const nextDefenseAssets = currentAssets.some((asset) => asset.type === nextAssetType)
          ? currentAssets.map((asset) => asset.type === nextAssetType ? { ...asset, level: clamp(Number(asset.level ?? 1) + 1, 1, 5), hidden: true } : asset)
          : [...currentAssets, { type: nextAssetType, level: 1, hidden: true, installedAt: defenseNow }];

        const nextTerritories = (prev.territories || []).map((t) => {
          if (Number(t.id) !== Number(territoryId)) return t;
          return {
            ...t,
            fortification: clamp(Number(t.fortification ?? 0) + 18, 0, 100),
            stability: clamp(Number(t.stability ?? 0) + 8, 0, 100),
            threat: clamp(Number(t.threat ?? 0) - 14, 0, 100),
            defenseAssets: nextDefenseAssets,
            hiddenDefense: getTerritoryDefenseProfile({ ...t, defenseAssets: nextDefenseAssets, fortification: clamp(Number(t.fortification ?? 0) + 18, 0, 100) }),
            fortLevel: Number(t.fortLevel ?? 0) + 1,
            sectorMemory: updateTerritoryMemory(t, 'defended', { actor: prev.player?.name, day: prev.day, now: defenseNow }),
          };
        });
        const updatedTerritory = nextTerritories.find((t) => Number(t.id) === Number(territoryId));
        built = true;

        return {
          ...prev,
          inventory: nextInventory,
          territories: nextTerritories,
          selTer: prev.selTer?.id === territoryId ? updatedTerritory || prev.selTer : prev.selTer,
          log: addLog(prev.log, `Activo defensivo instalado en ${liveTerritory.name}  -  coste ${formatResourceCost(liveCost)}`),
          note: { msg: `Defensa oculta ampliada en ${liveTerritory.name}`, type: 'success' },
        };
      });

      if (!built) return notify('No se pudo construir el fortin con el estado actual.', 'warn');
      updateMission('build_fort');
      notify('Activo defensivo instalado.', 'success');
    },
    collectOccupationTaxes: async (territoryId) => {
      if (user?.id) {
        const remote = await collectOccupationTaxesSecure({ territoryId });
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          updateMission('collect_tax');
          notify(remote.collectedText ? `Tasas cobradas: ${remote.collectedText}` : (remote.message || 'Tasas cobradas online.'), 'success');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }
      let collected = false;
      let collectedText = '';

      setSave((prev) => {
        const playerName = prev.player?.name;
        const territory = (prev.territories || []).find((t) => Number(t.id) === Number(territoryId));
        if (!territory || territory.controller !== playerName) return prev;

        const totals = {};
        const nextCompanies = (prev.companies || []).map((company) => {
          const sameTerritory = Number(company?.territoryId) === Number(territoryId);
          const controlledByPlayer = company?.occupiedBy === playerName;
          const pending = Math.max(0, Number(company?.occupationTaxPending ?? 0));
          if (!sameTerritory || !controlledByPlayer || pending <= 0) return company;

          const resourceKey = company?.occupationTaxResourceKey || COMPANY_TYPES[company?.companyType || company?.type]?.resourceKey;
          if (!resourceKey) return company;
          totals[resourceKey] = round2(Number(totals[resourceKey] || 0) + pending);
          return { ...company, occupationTaxPending: 0 };
        });

        const entries = Object.entries(totals).filter(([, amount]) => Number(amount) > 0);
        if (!entries.length) return prev;

        const nextInventory = { ...(prev.inventory || {}) };
        entries.forEach(([resourceKey, amount]) => {
          nextInventory[resourceKey] = round2(Number(nextInventory[resourceKey] || 0) + Number(amount));
        });

        collected = true;
        collectedText = entries.map(([resourceKey, amount]) => `${formatTaxAmount(amount)} ${resourceKey}`).join(', ');

        return {
          ...prev,
          companies: nextCompanies,
          inventory: nextInventory,
          log: addLog(prev.log, `Tasas cobradas en ${territory.name}: ${collectedText}`),
          note: { msg: `Tasas cobradas: ${collectedText}`, type: 'success' },
        };
      });

      if (!collected) return notify('No hay tasas pendientes en ese territorio.', 'warn');
      updateMission('collect_tax');
      notify(`Tasas cobradas: ${collectedText}`, 'success');
    },
    buyItem: async (key, qty = 1) => {
      const amount = Math.max(1, Math.floor(Number(qty || 1)));

      if (user?.id) {
        const syncedSave = await syncBeforeSecureAction({
          hydrateEconomy: true,
          label: 'comprar en mercado',
        });
        const remote = await buyMarketItemSecure({ itemKey: key, qty: amount });
        if (remote?.ok && remote.saveData) {
          const normalized = normalizeSave(remote.saveData);
          setSave(normalized);
          const boughtAmount = Number(remote.qty ?? amount);
          if (key === 'oxygen_tanks')    updateMission('collect_oxygen_tanks', boughtAmount);
          if (key === 'habitat_modules') updateMission('collect_habitat_modules', boughtAmount);
          updateMission('buy', boughtAmount);
          notify(remote.message || `Adquirido x${boughtAmount}`, 'success');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
        if (syncedSave) setSave(syncedSave);
      }

      let applied = false;
      let boughtItem = null;
      let boughtAmount = amount;
      let blockReason = '';

      setSave((prev) => {
        const live = getFreshEconomicSave(prev);
        const marketItem = live.market?.[key];
        if (!marketItem) { blockReason = 'Ese recurso ya no esta disponible en el mercado.'; return live; }

        const availableSupply = Math.max(0, Math.floor(Number(marketItem.supply ?? 0)));
        const finalAmount = Math.max(1, Math.min(amount, availableSupply || amount));
        if (availableSupply <= 0) { blockReason = 'Sin stock disponible ahora mismo.'; return live; }

        const quote = getMarketBuyQuote(marketItem, finalAmount);
        const totalCost = quote.total;
        if (Number(live.player?.credits ?? 0) < totalCost) { blockReason = 'Creditos insuficientes.'; return live; }
        if (!hasEnoughEnergy(live.player, 'buyItem', live.research, live.hq)) {
          blockReason = `Necesitas ${getEnergyCost('buyItem', live.research, live.hq)} de energia.`;
          return live;
        }

        const nextItem = {
          ...quote.impactedItem,
          ...decorateMarketTradeImpact(marketItem, quote, 'buy'),
        };

        applied = true;
        boughtItem = marketItem;
        boughtAmount = quote.amount;

        return addEconomicHistory({
          ...live,
          player:    { ...spendEnergy(live.player, 'buyItem', live.research, live.hq), credits: round2(Number(live.player?.credits ?? 0) - totalCost) },
          inventory: { ...live.inventory, [key]: round2(Number(live.inventory?.[key] || 0) + quote.amount) },
          market:    { ...live.market, [key]: nextItem },
          stats:     { ...live.stats, buys: Number(live.stats?.buys ?? 0) + quote.amount },
          log:       addLog(live.log, `Compraste ${marketItem.name} x${quote.amount} por ${totalCost.toFixed(2)} creditos`),
        }, { type: 'buy', label: `Compra: ${marketItem.name}`, credits: -totalCost, detail: `x${quote.amount}` });
      });

      if (!applied) return notify(blockReason || 'La compra ya no es valida con el estado actual.', 'warn');
      if (key === 'oxygen_tanks')    updateMission('collect_oxygen_tanks', boughtAmount);
      if (key === 'habitat_modules') updateMission('collect_habitat_modules', boughtAmount);
      updateMission('buy', boughtAmount);
      notify(`Adquirido: ${boughtItem?.icon || ''} x${boughtAmount}`, 'success');
    },

    sellItem: async (key, qty = 1) => {
      const requestedAmount = Math.max(1, Math.floor(Number(qty || 1)));

      if (user?.id) {
        const syncedSave = await syncBeforeSecureAction({
          hydrateEconomy: true,
          label: 'vender en mercado',
        });
        const localAvailable = Math.floor(Number(syncedSave?.inventory?.[key] ?? 0));
        if (localAvailable >= requestedAmount) {
          const remote = await sellMarketItemSecure({ itemKey: key, qty: requestedAmount });
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          const soldAmount = Number(remote.qty ?? requestedAmount);
          updateMission('sell', soldAmount);
          notify(remote.message || `+${Number(remote.totalReceived ?? 0).toFixed(2)} creditos`, 'success');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) {
          const remoteInventoryMismatch = /no tienes|stock|recurso/i.test(String(remote.error || ''));
          if (!remoteInventoryMismatch) return notify(remote.error, 'error');
        }
        }
        if (syncedSave) setSave(syncedSave);
      }

      let applied = false;
      let totalReceived = 0;
      let soldAmount = 0;
      let blockReason = 'No tienes stock de ese recurso para vender.';

      setSave((prev) => {
        const live = getFreshEconomicSave(prev);
        const marketItem = live.market?.[key];
        if (!marketItem) { blockReason = 'Ese recurso ya no esta disponible en el mercado.'; return live; }

        const owned = Math.max(0, Math.floor(Number(live.inventory?.[key] ?? 0)));
        if (owned < 1) {
          blockReason = 'No tienes stock de ese recurso para vender.';
          return live;
        }

        const amount = Math.max(1, Math.min(owned, requestedAmount));
        if (!hasEnoughEnergy(live.player, 'sellItem', live.research, live.hq)) {
          blockReason = `Necesitas ${getEnergyCost('sellItem', live.research, live.hq)} de energia.`;
          return live;
        }

        const quote = getMarketSellQuote(marketItem, amount);
        const nextItem = {
          ...quote.impactedItem,
          ...decorateMarketTradeImpact(marketItem, quote, 'sell'),
        };
        const total = quote.total;

        applied = true;
        totalReceived = total;
        soldAmount = quote.amount;

        const eventAffected = live.activeEvent?.affectedKeys?.includes(key);

        return addEconomicHistory({
          ...live,
          player:    { ...spendEnergy(live.player, 'sellItem', live.research, live.hq), credits: round2(Number(live.player?.credits ?? 0) + total) },
          inventory: { ...live.inventory, [key]: round2(Math.max(0, Number(live.inventory?.[key] ?? 0) - quote.amount)) },
          market:    { ...live.market, [key]: nextItem },
          activeEventStats: eventAffected
            ? {
                ...(live.activeEventStats || { id: live.activeEvent?.id, title: live.activeEvent?.title }),
                sales: Number(live.activeEventStats?.sales ?? 0) + 1,
                bonusCredits: round2(Number(live.activeEventStats?.bonusCredits ?? 0) + Math.max(0, total * 0.12)),
              }
            : live.activeEventStats,
          log:       addLog(live.log, `Vendiste ${marketItem.name} x${quote.amount} por ${total.toFixed(2)} creditos`),
        }, { type: 'sell', label: `Venta: ${marketItem.name}`, credits: total, detail: `x${quote.amount}` });
      });

      if (!applied) return notify(blockReason || 'La venta ya no es valida con el estado actual.', 'warn');
      updateMission('sell', soldAmount);
      notify(`+${totalReceived.toFixed(2)} creditos`, 'success');
    },

    rerollContract: async (contractId) => {
      const cost = 35;
      let applied = false;
      let blockReason = '';

      setSave((prev) => {
        const active = (prev.contracts || []).find((contract) => contract.id === contractId);
        if (!active) { blockReason = 'Ese contrato ya no esta disponible.'; return prev; }
        if (Number(prev.player?.credits ?? 0) < cost) { blockReason = `Necesitas ${cost} creditos para renovar el pedido.`; return prev; }
        if (!hasEnoughEnergy(prev.player, 'deliverContract', prev.research, prev.hq)) {
          blockReason = `Necesitas ${getEnergyCost('deliverContract', prev.research, prev.hq)} de energia.`;
          return prev;
        }

        const remaining = (prev.contracts || []).filter((contract) => contract.id !== contractId);
        const contractState = refreshContracts(remaining, prev.player.level, getCurrentPlanetIdFromSave(prev), Date.now(), prev.territories, prev.player?.name);
        applied = true;
        return addEconomicHistory({
          ...prev,
          player: {
            ...spendEnergy(prev.player, 'deliverContract', prev.research, prev.hq),
            credits: round2(Number(prev.player?.credits ?? 0) - cost),
          },
          contracts: contractState.contracts,
          log: addLog(prev.log, `Contrato renovado: ${active.title} (-${cost} creditos)`),
          note: { msg: 'Contrato renovado.', type: 'success' },
        }, { type: 'contract_reroll', label: 'Renovar contrato', credits: -cost, detail: active.title });
      });

      if (!applied) return notify(blockReason || 'No se pudo renovar el contrato.', 'warn');
      notify('Contrato renovado.', 'success');
    },

    deliverContract: async (contractId) => {
      const active = (save.contracts || []).find((c) => c.id === contractId);

      if (user?.id) {
        if (active && !active.completed) {
          await syncBeforeSecureAction({ hydrateEconomy: true, label: 'entregar contrato' });
        }

        const remote = await deliverContractSecure({ contractId });
        if (remote?.ok && remote.saveData) {
          const normalizedRemote = normalizeSave(remote.saveData);
          const chained = createNextChainedContract(
            active,
            normalizedRemote.player?.level ?? save.player?.level,
            Date.now(),
            getCurrentPlanetIdFromSave(normalizedRemote)
          );
          const nextRemoteSave = chained
            ? { ...normalizedRemote, contracts: [chained, ...(normalizedRemote.contracts || [])].slice(0, 4) }
            : normalizedRemote;
          setSave(nextRemoteSave);
          if (chained) {
            try {
              await persistRemoteSave(user.id, nextRemoteSave, { force: true });
            } catch (error) {
              console.warn('No se pudo sincronizar el siguiente contrato encadenado:', error);
            }
          }
          setTimeout(() => updateSave({ confetti: false }), 2200);
          notify(remote.message || 'Contrato entregado.', 'success');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }

      if (!active || active.completed) return notify('Ese contrato ya no esta disponible.', 'error');
      if (Number(active.expiresAt ?? 0) <= Date.now()) {
        setSave((prev) => ({
          ...prev,
          contracts: refreshContracts(prev.contracts, prev.player.level, getCurrentPlanetIdFromSave(prev), Date.now(), prev.territories, prev.player?.name).contracts,
        }));
        return notify('Ese contrato ya ha expirado.', 'warn');
      }
      if (!hasEnoughEnergy(save.player, 'deliverContract', save.research, save.hq)) {
        return notify(`Necesitas ${getEnergyCost('deliverContract', save.research, save.hq)} de energia.`, 'error');
      }
      if (Number(save.inventory?.[active.itemKey] ?? 0) < Number(active.qty ?? 0)) {
        return notify(`Te faltan ${active.itemName}.`, 'error');
      }
      if (active.territoryExclusive) {
        const territory = (save.territories || []).find((t) => Number(t.id) === Number(active.territoryId));
        if (!territory || territory.controller !== save.player?.name) {
          return notify('Ese contrato territorial ya no esta bajo tu control.', 'warn');
        }
      }

      const pe = getPlanetEffects(getCurrentPlanetIdFromSave(save));
      const mult = Number(getResearchEffects(save.research).contractRewardMult ?? 1) * Number(pe.contractRewardMult ?? 1);
      const rewardCredits = round2(Number(active.reward?.credits ?? 0) * mult);
      const rewardXp = Math.round(Number(active.reward?.xp ?? 0) * mult);
      const nextInventory = {
        ...(save.inventory || {}),
        [active.itemKey]: Math.max(0, Number(save.inventory?.[active.itemKey] ?? 0) - Number(active.qty ?? 0)),
      };
      const remaining = (save.contracts || []).filter((c) => c.id !== contractId);
      const contractState = refreshContracts(remaining, save.player.level, getCurrentPlanetIdFromSave(save), Date.now(), save.territories, save.player?.name);
      const chained = createNextChainedContract(active, save.player.level, Date.now(), getCurrentPlanetIdFromSave(save));
      const nextPlayer = applyPlayerXpGain(spendEnergy(save.player, 'deliverContract', save.research, save.hq), rewardXp);
      const completedTerritoryContract = Boolean(active.territoryExclusive);
      const eventAffected = save.activeEvent?.affectedKeys?.includes(active.itemKey);
      const eventBonusCredits = Number(active.eventBonusCredits ?? 0);

      setSave(addEconomicHistory({
        ...save,
        inventory: nextInventory,
        contracts: chained ? [chained, ...contractState.contracts].slice(0, 4) : contractState.contracts,
        player: { ...nextPlayer, credits: Number(save.player?.credits ?? 0) + rewardCredits },
        stats: {
          ...save.stats,
          contracts: Number(save.stats?.contracts ?? 0) + 1,
          territoryContracts: Number(save.stats?.territoryContracts ?? 0) + (completedTerritoryContract ? 1 : 0),
        },
        activeEventStats: eventAffected
          ? {
              ...(save.activeEventStats || { id: save.activeEvent?.id, title: save.activeEvent?.title }),
              contractsDelivered: Number(save.activeEventStats?.contractsDelivered ?? 0) + 1,
              bonusCredits: round2(Number(save.activeEventStats?.bonusCredits ?? 0) + eventBonusCredits),
            }
          : save.activeEventStats,
        confetti: true,
        log: addLog(save.log, `Contrato completado: ${active.itemName} x${active.qty} - +${rewardCredits.toFixed(2)} creditos +${rewardXp} XP`),
        note: { msg: `Contrato entregado: +${rewardCredits.toFixed(2)} creditos`, type: 'success' },
      }, { type: 'contract', label: `Contrato: ${active.itemName}`, credits: rewardCredits, detail: `x${active.qty}` }));

      if (completedTerritoryContract) updateMission('territory_contract');
      setTimeout(() => updateSave({ confetti: false }), 2200);
      notify('Contrato entregado.', 'success');
    },
    deliverAllContractsWithAd: async () => {
      const now = Date.now();
      const sponsoredBlock = getSponsoredBlockReason(save, now);
      if (sponsoredBlock) return notify(sponsoredBlock, 'warn');
      const hasDeliverable = (save.contracts || []).some((contract) => {
        const owned = Number(save.inventory?.[contract?.itemKey] ?? 0);
        const qty = Number(contract?.qty ?? 0);
        const expired = Number(contract?.expiresAt ?? 0) <= now;
        return !expired && owned >= qty;
      });
      if (!hasDeliverable) return notify('No hay contratos listos para entregar.', 'warn');
      if (!openSponsoredAction()) return false;

      let deliveredCount = 0;
      let rewardCredits = 0;
      let rewardXp = 0;
      let territoryContractCount = 0;
      let summary = '';

      setSave((prev) => {
        const inventory = { ...(prev.inventory || {}) };
        const liveBlock = getSponsoredBlockReason(prev, now);
        if (liveBlock) return prev;
        const deliverable = (prev.contracts || []).filter((contract) => {
          const owned = Number(inventory?.[contract?.itemKey] ?? 0);
          const qty = Number(contract?.qty ?? 0);
          const expired = Number(contract?.expiresAt ?? 0) <= now;
          return !expired && owned >= qty;
        });

        if (!deliverable.length) return prev;

        deliverable.forEach((contract) => {
          inventory[contract.itemKey] = Math.max(0, Number(inventory?.[contract.itemKey] ?? 0) - Number(contract.qty ?? 0));
          rewardCredits = round2(rewardCredits + Number(contract.reward?.credits ?? contract.reward?.euros ?? 0));
          rewardXp += Number(contract.reward?.xp ?? 0);
          if (contract.territoryExclusive) territoryContractCount += 1;
        });

        deliveredCount = deliverable.length;
        const eventDeliverable = deliverable.filter((contract) => prev.activeEvent?.affectedKeys?.includes(contract.itemKey));
        const eventBonusCredits = eventDeliverable.reduce((sum, contract) => sum + Number(contract.eventBonusCredits ?? 0), 0);
        summary = deliverable.map((contract) => `${contract.itemName} x${contract.qty}`).join(', ');
        const remaining = (prev.contracts || []).filter((contract) => !deliverable.some((ready) => ready.id === contract.id));
        const contractState = refreshContracts(
          remaining,
          prev.player.level,
          getCurrentPlanetIdFromSave(prev),
          now,
          prev.territories,
          prev.player?.name
        );
        const nextPlayer = applyPlayerXpGain(prev.player, rewardXp);

        return {
          ...prev,
          inventory,
          contracts: contractState.contracts,
          player: {
            ...nextPlayer,
            credits: round2(Number(prev.player?.credits ?? 0) + rewardCredits),
          },
          stats: {
            ...markSponsoredAdAction(prev, now).stats,
            contracts: Number(prev.stats?.contracts ?? 0) + deliveredCount,
            territoryContracts: Number(prev.stats?.territoryContracts ?? 0) + territoryContractCount,
          },
          rewardAdsToday: markSponsoredAdAction(prev, now).rewardAdsToday,
          lastRewardAdAt: now,
          activeEventStats: eventDeliverable.length
            ? {
                ...(prev.activeEventStats || { id: prev.activeEvent?.id, title: prev.activeEvent?.title }),
                contractsDelivered: Number(prev.activeEventStats?.contractsDelivered ?? 0) + eventDeliverable.length,
                bonusCredits: round2(Number(prev.activeEventStats?.bonusCredits ?? 0) + eventBonusCredits),
              }
            : prev.activeEventStats,
          confetti: true,
          log: addLog(prev.log, `Entrega patrocinada: ${summary} - +${rewardCredits.toFixed(2)} creditos +${rewardXp} XP - energia cubierta por patrocinador`),
          note: { msg: `Entrega patrocinada: +${rewardCredits.toFixed(2)} creditos sin gastar energia`, type: 'success' },
        };
      });

      if (!deliveredCount) return notify('No hay contratos listos para entregar.', 'warn');
      if (territoryContractCount > 0) updateMission('territory_contract', territoryContractCount);
      try { await recordEstimatedAdPoolView(); }
      catch (err) { console.error('Error actualizando el pool de anuncios:', err); }
      setTimeout(() => updateSave({ confetti: false }), 2200);
      notify(`Entrega patrocinada: ${deliveredCount} contratos sin gastar energia.`, 'success');
    },
    claimMissionReward: async (missionId) => {
      if (user?.id) {
        await syncBeforeSecureAction({ hydrateEconomy: true, label: 'reclamar mision' });
        const remote = await claimMissionRewardSecure({ missionId });
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          setTimeout(() => updateSave({ confetti: false }), 2200);
          notify(remote.message || 'Mision reclamada.', 'success');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }

      let claimed = false, rewardCredits = 0, rewardXp = 0, title = '', resourceText = '';
      setSave((prev) => {
        const mission = (prev.missions || []).find((m) => m.id === missionId);
        if (!mission || mission.done || !mission.readyToClaim) return prev;
        rewardCredits = Number(mission.reward?.credits ?? 0);
        rewardXp      = Number(mission.reward?.xp     ?? 0);
        title = mission.title || 'Mision';
        claimed = true;
        const rewardResources = Array.isArray(mission.reward?.resources) ? mission.reward.resources : [];
        const nextInventory = { ...(prev.inventory || {}) };
        rewardResources.forEach((resource) => {
          nextInventory[resource.key] = round2(Number(nextInventory[resource.key] || 0) + Number(resource.amount || 0));
        });
        resourceText = rewardResources.length ? ` + ${rewardResources.map((r) => `${r.amount} ${r.key}`).join(', ')}` : '';
        const nextPlayer = applyPlayerXpGain(prev.player, rewardXp);
        return addEconomicHistory({
          ...prev,
          missions: prev.missions.map((m) => m.id === missionId ? { ...m, progress: Math.max(Number(m.progress ?? 0), Number(m.goal ?? 0)), readyToClaim: false, done: true } : m),
          inventory: nextInventory,
          player: { ...nextPlayer, credits: Number(prev.player?.credits ?? 0) + rewardCredits },
          log:  addLog(prev.log, `Mision reclamada: ${title}. +${rewardCredits.toFixed(2)} creditos +${rewardXp} XP${resourceText}`),
          confetti: true,
          note: { msg: `Recompensa reclamada: +${rewardCredits.toFixed(2)} creditos${resourceText}`, type: 'success' },
        }, { type: 'mission', label: `Mision: ${title}`, credits: rewardCredits, detail: `${rewardXp} XP` });
      });
      if (!claimed) return notify('Esta mision todavia no esta lista para reclamar.', 'warn');
      setTimeout(() => updateSave({ confetti: false }), 2200);
      notify(`Mision reclamada: ${title}${resourceText}`, 'success');
    },

    buildCompany: async (companyTypeKey) => {
      const meta = COMPANY_TYPES[companyTypeKey];
      if (!meta) return notify('Tipo de empresa no valido.', 'error');

      const preLive = getFreshEconomicSave(save);
      const preOwned = (preLive.companies || []).filter((c) => (c?.companyType || c?.type) === companyTypeKey).length;
      const preCost = getCompanyBuildCost(companyTypeKey, preOwned);
      const preReqLevel = Number(meta.unlockLevel ?? meta.tier ?? 1);
      const preBlockReason = getBuildBlockReason(preLive, meta, preCost, preReqLevel, companyTypeKey, preOwned);
      if (preBlockReason) return notify(preBlockReason, 'warn');

      if (user?.id) {
        const regionKey = getCurrentRegionKeyFromSave(save);
        const region = getRegionEconomy(regionKey, getCurrentPlanetIdFromSave(save));
        const remote = await buildCompanySecure({ companyTypeKey, regionKey, territoryId: region?.territoryId ?? null });
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          updateMission('company');
          notify(` ${meta.name} operativa`, 'success');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }

      const now = Date.now();

      // Evita el aviso falso: no dependemos de una variable `applied`
      // modificada dentro de setSave((prev) => ...), porque React puede
      // ejecutar ese actualizador de forma diferida.
      const live = getFreshEconomicSave(save);
      const prevOwned = (live.companies || []).filter((c) => (c?.companyType || c?.type) === companyTypeKey).length;
      const liveCost = getCompanyBuildCost(companyTypeKey, prevOwned);
      const reqLevel = Number(meta.unlockLevel ?? meta.tier ?? 1);
      const blockReason = getBuildBlockReason(live, meta, liveCost, reqLevel, companyTypeKey, prevOwned);

      if (blockReason) return notify(blockReason, 'warn');

      const regionKey = getCurrentRegionKeyFromSave(live);
      const region = getRegionEconomy(regionKey, getCurrentPlanetIdFromSave(live));
      const builtRegionName = region?.name || 'tu region';

      setSave(addEconomicHistory({
        ...live,
        player: {
          ...spendEnergy(live.player, 'buildCompany', live.research, live.hq),
          credits: round2(Number(live.player?.credits ?? 0) - liveCost),
        },
        companies: [
          ...(live.companies || []),
          {
            id: now + Math.random(),
            companyType: meta.key,
            type: meta.key,
            name: meta.name,
            storage: 0,
            maxStorage: meta.maxStorage,
            regionKey,
            territoryId: region?.territoryId ?? null,
            active: true,
            status: 'active',
            occupiedBy: null,
            occupationTaxPending: 0,
            occupationTaxResourceKey: meta.resourceKey,
            createdAt: now,
            lastCollectedAt: now,
            lastTickAt: now,
          },
        ],
        log: addLog(live.log, ` Construida ${meta.name} en ${builtRegionName}  -  coste ${liveCost} creditos`),
        confetti: true,
      }, { type: 'build', label: `Empresa: ${meta.name}`, credits: -liveCost, detail: builtRegionName }));

      updateMission('company');
      setTimeout(() => updateSave({ confetti: false }), 2200);
      notify(` ${meta.name} operativa`, 'success');
    },

    sellCompany: async (companyId) => {
      if (!companyId) return notify('Selecciona una empresa para vender.', 'warn');

      if (user?.id) {
        const remote = await sellCompanySecure({ companyId });
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          notify(remote.refund ? `Empresa vendida: +${Number(remote.refund).toFixed(2)} creditos` : 'Empresa vendida.', 'success');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }

      const live = getFreshEconomicSave(save);
      const company = (live.companies || []).find((item) => item?.id === companyId);
      if (!company) return notify('La empresa ya no existe.', 'warn');

      const companyTypeKey = company.companyType || company.type;
      const meta = COMPANY_TYPES[companyTypeKey];
      if (!meta) return notify('Tipo de empresa no valido.', 'error');

      const ownedCount = (live.companies || []).filter((item) => (item?.companyType || item?.type) === companyTypeKey).length;
      const refund = getCompanySellRefund(companyTypeKey, ownedCount);
      const nextCompanies = (live.companies || []).filter((item) => item?.id !== companyId);

      setSave({
        ...live,
        companies: nextCompanies,
        player: {
          ...live.player,
          credits: round2(Number(live.player?.credits ?? 0) + refund),
        },
        log: addLog(live.log, `Empresa vendida: ${meta.name} +${refund.toFixed(2)} creditos`),
        note: { msg: `Empresa vendida: +${refund.toFixed(2)} creditos`, type: 'success' },
      });

      notify(`Empresa vendida: +${refund.toFixed(2)} creditos`, 'success');
    },
    foundCompany(companyTypeKey) {
      // Alias kept for backwards compatibility
      return this.buildCompany(companyTypeKey || 'dew_collector');
    },

    collectCompany: async (companyId) => {
      if (REMOTE_COMPANY_COLLECTION_ENABLED && user?.id) {
        await syncBeforeSecureAction({ hydrateEconomy: true, label: 'recoger empresa' });
        const remote = await collectCompanySecure({ companyId });
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          notify(remote.amount > 0 ? `?? +${remote.amount} ${remote.resourceLabel || ''}` : 'No hay produccion acumulada.', remote.amount > 0 ? 'success' : 'warn');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }
      if (!hasEnoughEnergy(save.player, 'collectCompany', save.research, save.hq)) return notify(`Necesitas ${getEnergyCost('collectCompany', save.research, save.hq)} de energia.`, 'error');
      let amount = 0, label = '', resourceKey = null, applied = false;

      setSave((prev) => {
        if (!hasEnoughEnergy(prev.player, 'collectCompany', prev.research, prev.hq)) return prev;
        const hydrated = hydrateCompaniesAndInventory(prev.companies, prev.inventory, getCurrentRegionKeyFromSave(prev), prev.adBoosts, prev.territories, prev.player?.name, prev.research, getCurrentPlanetIdFromSave(prev), prev.hq);
        const company  = hydrated.companies.find((c) => c.id === companyId);
        if (!company) return prev;
        const meta = COMPANY_TYPES[company.companyType];
        if (!meta || getWholeCollectableUnits(company.storage) < 1) return prev;

        amount = getWholeCollectableUnits(company.storage); label = meta.resourceLabel; resourceKey = meta.resourceKey; applied = true;
        const remainingStorage = getRemainingFractionalStorage(company.storage);
        const now = Date.now();
        return {
          ...prev,
          companies: hydrated.companies.map((c) => c.id === companyId ? { ...c, storage: remainingStorage, lastCollectedAt: now, lastTickAt: now } : c),
          inventory: { ...hydrated.inventory, [meta.resourceKey]: round2(Number(hydrated.inventory?.[meta.resourceKey] || 0) + amount) },
          player: spendEnergy(prev.player, 'collectCompany', prev.research, prev.hq),
          log:   addLog(prev.log, `?? Recogiste ${amount} de ${meta.resourceLabel} de ${company.name}`),
        };
      });

      if (!applied) return notify('Necesitas al menos 1 unidad completa para recoger.', 'warn');
      if (resourceKey === 'oxygen_tanks')    updateMission('collect_oxygen_tanks');
      if (resourceKey === 'habitat_modules') updateMission('collect_habitat_modules');
      notify(amount > 0 ? `?? +${amount} ${label}` : 'No hay produccion acumulada.', amount > 0 ? 'success' : 'warn');
    },

    collectCompanyGroup: async (companyTypeKey, regionKey) => {
      if (REMOTE_COMPANY_COLLECTION_ENABLED && user?.id) {
        await syncBeforeSecureAction({ hydrateEconomy: true, label: 'recoger grupo de empresas' });
        const remote = await collectCompanyGroupSecure({ companyTypeKey, regionKey });
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          notify(remote.amount > 0 ? `?? +${remote.amount} ${remote.resourceLabel || ''}` : 'No hay produccion acumulada.', remote.amount > 0 ? 'success' : 'warn');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }
      if (!hasEnoughEnergy(save.player, 'collectCompanyGroup', save.research, save.hq)) return notify(`Necesitas ${getEnergyCost('collectCompanyGroup', save.research, save.hq)} de energia.`, 'error');
      let total = 0, label = '', resourceKey = null, applied = false;

      setSave((prev) => {
        if (!hasEnoughEnergy(prev.player, 'collectCompanyGroup', prev.research, prev.hq)) return prev;
        const activeRegion = getCurrentRegionKeyFromSave(prev);
        const hydrated = hydrateCompaniesAndInventory(prev.companies, prev.inventory, activeRegion, prev.adBoosts, prev.territories, prev.player?.name, prev.research, getCurrentPlanetIdFromSave(prev), prev.hq);
        const targets = hydrated.companies.filter((c) => {
          const sameType   = (c.companyType || c.type) === companyTypeKey;
          const sameRegion = !regionKey || (c.regionKey || 'alpha-district') === (regionKey || 'alpha-district');
          return sameType && sameRegion && c.active !== false;
        });
        if (!targets.length) return prev;
        const meta = COMPANY_TYPES[companyTypeKey];
        if (!meta) return prev;
        const totalStored = targets.reduce((s, c) => s + getWholeCollectableUnits(c.storage), 0);
        if (totalStored < 1) return prev;

        total = round2(totalStored); label = meta.resourceLabel; resourceKey = meta.resourceKey; applied = true;
        const now = Date.now();
        return {
          ...prev,
          companies: hydrated.companies.map((c) => {
            const match = (c.companyType || c.type) === companyTypeKey && (!regionKey || (c.regionKey || 'alpha-district') === regionKey) && c.active !== false;
            return match ? { ...c, storage: getRemainingFractionalStorage(c.storage), lastCollectedAt: now, lastTickAt: now } : c;
          }),
          inventory: { ...hydrated.inventory, [meta.resourceKey]: round2(Number(hydrated.inventory?.[meta.resourceKey] || 0) + total) },
          player: spendEnergy(prev.player, 'collectCompanyGroup', prev.research, prev.hq),
          log:   addLog(prev.log, `?? Recogiste ${total} de ${meta.resourceLabel} de ${meta.name}`),
        };
      });

      if (!applied) return notify('Necesitas al menos 1 unidad completa para recoger.', 'warn');
      if (resourceKey === 'oxygen_tanks')    updateMission('collect_oxygen_tanks');
      if (resourceKey === 'habitat_modules') updateMission('collect_habitat_modules');
      notify(total > 0 ? `?? +${total} ${label}` : 'No hay produccion acumulada.', total > 0 ? 'success' : 'warn');
    },

    collectAllCompaniesWithAd: async () => {
      const now = Date.now();
      const sponsoredBlock = getSponsoredBlockReason(save, now);
      if (sponsoredBlock) {
        notify(sponsoredBlock, 'warn');
        return false;
      }

      const fresh = getFreshEconomicSave(save);
      const localCollectable = (fresh.companies || []).reduce((sum, company) => {
        if (company?.active === false) return sum;
        const meta = COMPANY_TYPES[company.companyType || company.type];
        if (!meta?.resourceKey) return sum;
        return sum + getWholeCollectableUnits(company.storage);
      }, 0);

      if (localCollectable < 1) {
        notify('Necesitas al menos 1 unidad completa para recoger.', 'warn');
        return false;
      }
      if (!openSponsoredAction()) return false;

      if (REMOTE_COMPANY_COLLECTION_ENABLED && user?.id) {
        await syncBeforeSecureAction({ sourceSave: fresh, label: 'recoger todo con anuncio' });

        const remote = await collectAllCompaniesAdSecure();
        if (remote?.ok && remote.saveData) {
          const normalized = normalizeSave(remote.saveData);
          setSave({ ...normalized, ...markSponsoredAdAction(normalized, now) });
          try { await recordEstimatedAdPoolView(); }
          catch (err) { console.error('Error actualizando el pool de anuncios:', err); }
          notify(remote.summary || 'Produccion recogida por anuncio.', 'success');
          return true;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }

      const live = fresh;
      const nextInventory = { ...(live.inventory || {}) };
      const totals = {};
      let totalAmount = 0;

      const nextCompanies = (live.companies || []).map((company) => {
        if (company?.active === false) return company;
        const meta = COMPANY_TYPES[company.companyType || company.type];
        const stored = getWholeCollectableUnits(company.storage);
        if (!meta?.resourceKey || stored < 1) return company;
        totals[meta.resourceKey] = round2(Number(totals[meta.resourceKey] || 0) + stored);
        totalAmount = round2(totalAmount + stored);
        nextInventory[meta.resourceKey] = round2(Number(nextInventory[meta.resourceKey] || 0) + stored);
        return { ...company, storage: getRemainingFractionalStorage(company.storage), lastCollectedAt: now, lastTickAt: now };
      });

      if (totalAmount < 1) {
        notify('Necesitas al menos 1 unidad completa para recoger.', 'warn');
        return false;
      }

      const summary = Object.entries(totals).map(([key, amount]) => `${amount} ${key}`).join(', ');
      setSave({
        ...live,
        companies: nextCompanies,
        inventory: nextInventory,
        ...markSponsoredAdAction(live, now),
        log: addLog(live.log, `Recogida total por anuncio: ${summary}`),
        note: { msg: `Recogido todo: ${summary}`, type: 'success' },
      });

      if (totals.oxygen_tanks > 0) updateMission('collect_oxygen_tanks');
      if (totals.habitat_modules > 0) updateMission('collect_habitat_modules');
      try { await recordEstimatedAdPoolView(); }
      catch (err) { console.error('Error actualizando el pool de anuncios:', err); }
      notify(`Recogido todo: ${summary}`, 'success');
      return true;
    },

    reinforceAllTerritoriesWithAd: async () => {
      const now = Date.now();
      let blockedMessage = null, applied = false, affected = 0;
      const playerName = save.player?.name;
      const ownedTerritories = (save.territories || []).filter((territory) => territory.controller === playerName);
      const needsReinforce = ownedTerritories.filter((territory) =>
        Number(territory.stability ?? 0) < 100 ||
        Number(territory.threat ?? 0) > 0 ||
        Number(territory.fortification ?? 0) < 100 ||
        Number(territory.siegeTick ?? 0) > 0
      );
      const sponsoredBlock = getSponsoredBlockReason(save, now);

      if (!playerName || ownedTerritories.length === 0) return notify('No controlas ningun sector para reforzar.', 'warn');
      if (needsReinforce.length === 0) return notify('Todos tus sectores ya estan al maximo.', 'warn');
      if (sponsoredBlock) return notify(sponsoredBlock, 'warn');
      if (!openSponsoredAction()) return false;

      setSave((prev) => {
        const playerName = prev.player?.name;
        const ownedTerritories = (prev.territories || []).filter((territory) => territory.controller === playerName);
        const needsReinforce = ownedTerritories.filter((territory) =>
          Number(territory.stability ?? 0) < 100 ||
          Number(territory.threat ?? 0) > 0 ||
          Number(territory.fortification ?? 0) < 100 ||
          Number(territory.siegeTick ?? 0) > 0
        );
        const sponsoredBlock = getSponsoredBlockReason(prev, now);

        if (!playerName || ownedTerritories.length === 0) { blockedMessage = 'No controlas ningun sector para reforzar.'; return prev; }
        if (needsReinforce.length === 0) { blockedMessage = 'Todos tus sectores ya estan al maximo.'; return prev; }
        if (sponsoredBlock) { blockedMessage = sponsoredBlock; return prev; }

        affected = needsReinforce.length;
        applied = true;
        const nextTerritories = (prev.territories || []).map((territory) =>
          territory.controller === playerName
            ? {
            ...territory,
            stability: 100,
            threat: 0,
            fortification: 100,
            enemyCampaign: null,
            siegeTick: 0,
                siegeAttacker: null,
                siegeStartedAt: null,
                sectorMemory: updateTerritoryMemory(territory, 'defended', { actor: playerName, day: prev.day, now }),
              }
            : territory
        );

        return {
          ...prev,
          territories: nextTerritories,
          selTer: prev.selTer?.id !== undefined && prev.selTer?.id !== null
            ? nextTerritories.find((territory) => Number(territory.id) === Number(prev.selTer.id)) || prev.selTer
            : prev.selTer,
          ...markSponsoredAdAction(prev, now),
          log: addLog(prev.log, `Blindaje publicitario: ${affected} sector(es) reforzados al maximo`),
          note: { msg: `Blindaje completo: ${affected} sector(es) al maximo`, type: 'success' },
          confetti: true,
        };
      });

      if (blockedMessage) { notify(blockedMessage, 'warn'); return false; }

      if (applied) {
        try {
          await recordEstimatedAdPoolView();
        } catch (err) { console.error('Error actualizando el pool de anuncios:', err); }
        notify(`Blindaje publicitario completado: ${affected} sector(es) al maximo.`, 'success');
        setTimeout(() => updateSave({ confetti: false }), 1800);
      }

      return applied;
    },

    disruptEnemyCampaign: async (territoryId) => {
      const territory = (save.territories || []).find((t) => Number(t.id) === Number(territoryId));
      if (!territory) return notify('Territorio no valido.', 'error');
      if (territory.controller !== save.player?.name) return notify('Solo puedes cortar frentes en sectores tuyos.', 'error');
      if (!territory.enemyCampaign) return notify('No hay frente rival activo en este sector.', 'warn');
      if (Number(save.player?.credits ?? 0) < 6) return notify('Necesitas 6 creditos para contrainteligencia.', 'error');
      if (!hasEnoughEnergy(save.player, 'sabotageTerritory', save.research, save.hq)) return notify(`Necesitas ${getEnergyCost('sabotageTerritory', save.research, save.hq)} de energia.`, 'error');

      let applied = false;
      setSave((prev) => {
        const liveTerritory = (prev.territories || []).find((t) => Number(t.id) === Number(territoryId));
        if (!liveTerritory?.enemyCampaign || liveTerritory.controller !== prev.player?.name) return prev;
        const nextProgress = clamp(Number(liveTerritory.enemyCampaign.progress ?? 0) - 34, 0, 100);
        const defenseNow = Date.now();
        const nextTerritories = (prev.territories || []).map((t) =>
          Number(t.id) === Number(territoryId)
            ? {
                ...t,
                enemyCampaign: nextProgress <= 0 ? null : { ...t.enemyCampaign, progress: nextProgress, updatedAt: defenseNow },
                threat: clamp(Number(t.threat ?? 0) - 12, 0, 100),
                stability: clamp(Number(t.stability ?? 0) + 6, 0, 100),
                sectorMemory: updateTerritoryMemory(t, 'defended', { actor: prev.player?.name, day: prev.day, now: defenseNow }),
              }
            : t
        );
        applied = true;
        return {
          ...prev,
          territories: nextTerritories,
          selTer: prev.selTer?.id === territoryId ? nextTerritories.find((t) => Number(t.id) === Number(territoryId)) || prev.selTer : prev.selTer,
          player: { ...spendEnergy(prev.player, 'sabotageTerritory', prev.research, prev.hq), credits: Number(prev.player?.credits ?? 0) - 6 },
          log: addLog(prev.log, `Contrainteligencia en ${liveTerritory.name}: frente rival reducido a ${Math.round(nextProgress)}%`),
          note: { msg: `Frente rival reducido en ${liveTerritory.name}`, type: 'success' },
        };
      });

      if (applied) notify('Contrainteligencia completada.', 'success');
      else notify('El frente rival ya no esta activo.', 'warn');
    },

    disruptAllEnemyCampaigns: async () => {
      const playerName = save.player?.name;
      const activeFronts = (save.territories || []).filter((territory) =>
        territory.controller === playerName && territory.enemyCampaign
      );
      const energyCost = getEnergyCost('sabotageTerritory', save.research, save.hq);
      const totalCredits = activeFronts.length * 6;
      const totalEnergy = activeFronts.length * energyCost;

      if (!activeFronts.length) return notify('No hay frentes rivales activos.', 'warn');
      if (Number(save.player?.credits ?? 0) < totalCredits) return notify(`Necesitas ${totalCredits} creditos para cortar todos los frentes.`, 'error');
      if (Number(save.player?.energy ?? 0) < totalEnergy) return notify(`Necesitas ${totalEnergy} de energia para cortar todos los frentes.`, 'error');

      let affected = 0;
      setSave((prev) => {
        const livePlayerName = prev.player?.name;
        const defenseNow = Date.now();
        const liveFronts = (prev.territories || []).filter((territory) =>
          territory.controller === livePlayerName && territory.enemyCampaign
        );
        if (!liveFronts.length) return prev;

        affected = liveFronts.length;
        const nextTerritories = (prev.territories || []).map((territory) => {
          if (territory.controller !== livePlayerName || !territory.enemyCampaign) return territory;
          const nextProgress = clamp(Number(territory.enemyCampaign.progress ?? 0) - 34, 0, 100);
          return {
            ...territory,
            enemyCampaign: nextProgress <= 0 ? null : { ...territory.enemyCampaign, progress: nextProgress, updatedAt: defenseNow },
            threat: clamp(Number(territory.threat ?? 0) - 12, 0, 100),
            stability: clamp(Number(territory.stability ?? 0) + 6, 0, 100),
            sectorMemory: updateTerritoryMemory(territory, 'defended', { actor: livePlayerName, day: prev.day, now: defenseNow }),
          };
        });

        return {
          ...prev,
          territories: nextTerritories,
          selTer: prev.selTer?.id !== undefined && prev.selTer?.id !== null
            ? nextTerritories.find((territory) => Number(territory.id) === Number(prev.selTer.id)) || prev.selTer
            : prev.selTer,
          player: {
            ...prev.player,
            energy: Math.max(0, Number(prev.player?.energy ?? 0) - affected * energyCost),
            credits: Number(prev.player?.credits ?? 0) - affected * 6,
          },
          log: addLog(prev.log, `Contrainteligencia global: ${affected} frente(s) rival(es) reducidos.`),
          note: { msg: `Cortados ${affected} frente(s) rivales.`, type: 'success' },
        };
      });

      if (affected > 0) notify(`Contrainteligencia global completada: ${affected} frente(s).`, 'success');
    },

    claimDaily: () => {
      if (save.claimedToday) return notify('La bonificacion diaria ya esta registrada hoy.', 'warn');
      const pct      = Math.min(100, parseFloat((save.player.pct + 1).toFixed(1)));
      const todayKey = new Date().toISOString().slice(0, 10);
      setSave((prev) => ({ ...prev, claimedToday: true, lastLoginDate: todayKey, player: { ...prev.player, pct }, log: addLog(prev.log, `?? Acceso diario registrado manualmente: ${pct}% actual`) }));
      notify(`+1% de control del reparto ? ahora tienes ${pct}%`, 'success');
    },

    claimRewardAd: async () => {
      const now = Date.now();
      let blockedMessage = null, granted = false;

      if (!hasEnoughEnergy(save.player, 'claimRewardAd', save.research, save.hq)) {
        notify(`Necesitas ${getEnergyCost('claimRewardAd', save.research, save.hq)} de energia para lanzar la emision.`, 'error');
        return false;
      }
      const sponsoredBlock = getSponsoredBlockReason(save, now);
      if (sponsoredBlock) { notify(sponsoredBlock, 'warn'); return false; }
      if (!openSponsoredAction()) return false;

      setSave((prev) => {
        const pe = getPlanetEffects(getCurrentPlanetIdFromSave(prev));
        const sponsoredBlock = getSponsoredBlockReason(prev, now);
        if (sponsoredBlock) { blockedMessage = sponsoredBlock; return prev; }

        const rewardCredits = round2(2 * Number(pe.adRewardCreditsMult ?? 1));
        const rewardEnergy  = Math.max(1, Math.round(8 * Number(pe.adRewardEnergyMult ?? 1)));
        granted = true;
        return {
          ...prev,
          ...markSponsoredAdAction(prev, now),
          player: { ...prev.player, credits: Number(prev.player?.credits ?? 0) + rewardCredits, energy: Math.min(Number(prev.player?.maxEnergy ?? 100), Math.max(0, Number(prev.player?.energy ?? 0) - getEnergyCost('claimRewardAd', prev.research, prev.hq)) + rewardEnergy) },
          log:  addLog(prev.log, `?? Emision completada: +${rewardCredits.toFixed(2)} creditos y +${rewardEnergy} energia`),
          note: { msg: `?? +${rewardCredits.toFixed(2)} creditos y +${rewardEnergy} energia`, type: 'success' },
          confetti: true,
        };
      });

      if (blockedMessage) { notify(blockedMessage, 'warn'); return false; }

      if (granted) {
        try {
          await recordEstimatedAdPoolView();
        } catch (err) { console.error('Error actualizando el pool de anuncios:', err); }
        setTimeout(() => updateSave({ confetti: false }), 1800);
      }
      return granted;
    },

    triggerWorkAdBoost: async () => {
      const now = Date.now();
      const sponsoredBlock = getSponsoredBlockReason(save, now);
      if (sponsoredBlock) return notify(sponsoredBlock, 'warn');
      if (!save.activeJob)              return notify('Necesitas un trabajo activo para acelerarlo.', 'warn');
      if (save.activeJob.adBoostUsed)   return notify('Ese trabajo ya recibio un impulso por anuncio.', 'warn');
      if (!openSponsoredAction()) return false;

      if (user?.id && REMOTE_WORK_ACTIONS_ENABLED) {
        const remote = await boostWorkSecure();
        if (remote?.ok && remote.saveData) {
          const normalized = normalizeSave(remote.saveData);
          const withAdStats = { ...normalized, ...markSponsoredAdAction(normalized, now) };
          const keepGuidedStart = Number(normalized?.player?.level ?? 1) <= 2 && !normalized?.tutorial?.finished;
          setSave(keepGuidedStart ? { ...withAdStats, tab: 'home' } : withAdStats);
          try { await recordEstimatedAdPoolView(); }
          catch (err) { console.error('Error actualizando el pool de anuncios:', err); }
          notify(remote.message || 'Impulso laboral activado: el trabajo terminara antes.', 'success');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }

      let applied = false;
      setSave((prev) => {
        const job = prev.activeJob;
        if (!job || job.adBoostUsed) return prev;
        const liveBlock = getSponsoredBlockReason(prev, now);
        if (liveBlock) return prev;
        const remaining = Math.max(0, Number(job.endAt ?? now) - now);
        const reduced   = Math.max(5000, Math.round(remaining * Number(getResearchEffects(prev.research).workAdRemainingFactor ?? 0.6)));
        applied = true;
        const keepGuidedStart = Number(prev?.player?.level ?? 1) <= 2 && !prev?.tutorial?.finished;
        return { ...prev, tab: keepGuidedStart ? 'home' : prev.tab, ...markSponsoredAdAction(prev, now), activeJob: { ...job, endAt: now + reduced, adBoostUsed: true }, log: addLog(prev.log, `?? Impulso laboral activado en ${job.label}`), note: { msg: `?? Trabajo acelerado: ${job.label}`, type: 'success' } };
      });
      if (applied) {
        try { await recordEstimatedAdPoolView(); }
        catch (err) { console.error('Error actualizando el pool de anuncios:', err); }
        notify('Impulso laboral activado: el trabajo terminara antes.', 'success');
      }
    },

    triggerCompanyAdBoost: async () => {
      const now = Date.now();
      const sponsoredBlock = getSponsoredBlockReason(save, now);
      if (sponsoredBlock) return notify(sponsoredBlock, 'warn');
      if (Number(save.adBoosts?.companyBoostUntil ?? 0) > now) return notify('La produccion acelerada ya esta activa.', 'warn');
      if (!openSponsoredAction()) return false;
      let applied = false;
      setSave((prev) => {
        const liveBlock = getSponsoredBlockReason(prev, now);
        if (liveBlock) return prev;
        const nextAdBoosts = { ...DEFAULT_AD_BOOSTS, ...(prev.adBoosts || {}), companyBoostUntil: now + 600_000, companyBoostMultiplier: Number(getResearchEffects(prev.research).companyBoostMultiplier ?? 1.5) };
        const hydrated = hydrateCompanies(prev.companies, getCurrentRegionKeyFromSave(prev), nextAdBoosts, prev.territories, prev.player?.name, prev.research, getCurrentPlanetIdFromSave(prev), prev.hq);
        applied = true;
        return { ...prev, ...markSponsoredAdAction(prev, now), adBoosts: nextAdBoosts, companies: hydrated, log: addLog(prev.log, '?? Produccion acelerada: +50% durante 10 minutos'), note: { msg: '?? Empresas aceleradas durante 10 min', type: 'success' } };
      });
      if (applied) {
        try { await recordEstimatedAdPoolView(); }
        catch (err) { console.error('Error actualizando el pool de anuncios:', err); }
        notify('Produccion empresarial acelerada durante 10 minutos.', 'success');
      }
    },

    buyAdControlUpgrade: () => {
      const pct  = Number(save.player?.pct ?? 1);
      const cost = getAdControlUpgradeCost(pct);
      if (Number(save.player?.credits ?? 0) < cost) return notify(`Necesitas ${cost} creditos para mejorar publicidad.`, 'warn');
      const nextPct = Math.min(100, parseFloat((pct + 0.5).toFixed(1)));
      setSave((prev) => ({ ...prev, player: { ...prev.player, credits: Number(prev.player?.credits ?? 0) - cost, pct: nextPct }, log: addLog(prev.log, `?? Publicidad optimizada: +0.5% de control del reparto  -  coste ${cost} creditos`), note: { msg: `?? +0.5% reparto  -  -${cost} creditos`, type: 'success' } }));
      notify(`Publicidad mejorada: ahora tienes ${nextPct}% de reparto`, 'success');
    },

    setActiveMegaproject: (projectId) => {
      if (!MEGAPROJECTS.some((project) => project.id === projectId)) return notify('Megaproyecto no valido.', 'error');
      updateSave({ megaprojects: { ...(save.megaprojects || {}), activeId: projectId } });
    },

    contributeMegaprojectPhase: (projectId) => {
      const project = getMegaprojectById(projectId);
      let completedPhase = false;
      let blockedMessage = null;

      setSave((prev) => {
        const mp = prev.megaprojects || {};
        const state = mp.projects?.[project.id] || { phase: 0, credits: 0, ads: 0, resources: {} };
        const phase = project.phases?.[Number(state.phase ?? 0)];
        if (!phase) {
          blockedMessage = 'Este megaproyecto ya esta completado.';
          return prev;
        }

        const creditNeed = Math.max(0, Number(phase.credits ?? 0) - Number(state.credits ?? 0));
        const creditMove = Math.min(Number(prev.player?.credits ?? 0), creditNeed);
        const nextResources = { ...(state.resources || {}) };
        const nextInventory = { ...(prev.inventory || {}) };
        let resourceMove = 0;

        (phase.resources || []).forEach((resource) => {
          const need = Math.max(0, Number(resource.amount ?? 0) - Number(nextResources[resource.key] ?? 0));
          const move = Math.min(Number(nextInventory[resource.key] ?? 0), need);
          if (move > 0) {
            nextInventory[resource.key] = Number(nextInventory[resource.key] ?? 0) - move;
            nextResources[resource.key] = Number(nextResources[resource.key] ?? 0) + move;
            resourceMove += move;
          }
        });

        const nextState = {
          ...state,
          credits: Number(state.credits ?? 0) + creditMove,
          resources: nextResources,
        };
        const resourcesReady = (phase.resources || []).every((resource) => Number(nextState.resources?.[resource.key] ?? 0) >= Number(resource.amount ?? 0));
        const ready = Number(nextState.credits ?? 0) >= Number(phase.credits ?? 0) &&
          Number(nextState.ads ?? 0) >= Number(phase.ads ?? 0) &&
          resourcesReady;

        if (creditMove <= 0 && resourceMove <= 0 && !ready) {
          blockedMessage = 'No tienes recursos o creditos para aportar ahora.';
          return prev;
        }

        const nextProjects = { ...(mp.projects || {}), [project.id]: nextState };
        let nextPlayer = { ...prev.player, credits: Number(prev.player?.credits ?? 0) - creditMove };
        let completedIds = Array.isArray(mp.completedIds) ? [...mp.completedIds] : [];
        let logText = `Aporte a ${project.title}: ${creditMove.toFixed(0)} cr y ${resourceMove.toFixed(0)} recursos.`;

        if (ready) {
          completedPhase = true;
          const reward = phase.reward || {};
          const nextPhase = Number(state.phase ?? 0) + 1;
          nextProjects[project.id] = { phase: nextPhase, credits: 0, ads: 0, resources: {} };
          nextPlayer = applyPlayerXpGain({
            ...nextPlayer,
            credits: Number(nextPlayer.credits ?? 0) + Number(reward.credits ?? 0),
            pct: Math.min(100, Number(nextPlayer.pct ?? 1) + Number(reward.pct ?? 0)),
          }, Number(reward.xp ?? 0));
          logText = `Megaproyecto: fase completada en ${project.title} (${phase.title}).`;
          if (nextPhase >= project.phases.length && !completedIds.includes(project.id)) {
            completedIds.push(project.id);
            logText = `MEGAPROYECTO COMPLETADO: ${project.title}.`;
          }
        }

        return {
          ...prev,
          player: nextPlayer,
          inventory: nextInventory,
          megaprojects: { ...mp, activeId: project.id, completedIds, projects: nextProjects },
          log: addLog(prev.log, logText),
          note: { msg: completedPhase ? `Fase completada: ${project.title}` : `Aporte registrado: ${project.title}`, type: 'success' },
          confetti: completedPhase ? true : prev.confetti,
        };
      });

      if (blockedMessage) notify(blockedMessage, 'warn');
      else notify(completedPhase ? 'Fase de megaproyecto completada.' : 'Aporte registrado.', 'success');
      if (completedPhase) setTimeout(() => updateSave({ confetti: false }), 1800);
    },

    claimSponsorshipAd: async (sponsorId) => {
      const now = Date.now();
      const sponsoredBlock = getSponsoredBlockReason(save, now);
      if (sponsoredBlock) return notify(sponsoredBlock, 'warn');

      const sponsor = SPONSORSHIPS.find((item) => item.id === sponsorId);
      if (!sponsor) return notify('Patrocinio no valido.', 'error');
      const todayKey = new Date().toISOString().slice(0, 10);
      const currentSponsorships = save.sponsorships?.todayKey === todayKey
        ? save.sponsorships
        : createInitialSponsorships(todayKey);
      if (currentSponsorships.claimedIds?.includes(sponsor.id)) {
        return notify('Este patrocinio ya esta cerrado hoy.', 'warn');
      }
      if (!openSponsoredAction()) return false;

      let completed = false;
      let blockedMessage = null;

      setSave((prev) => {
        const sponsorships = prev.sponsorships?.todayKey === todayKey
          ? prev.sponsorships
          : createInitialSponsorships(todayKey);
        if (sponsorships.claimedIds?.includes(sponsor.id)) {
          blockedMessage = 'Este patrocinio ya esta cerrado hoy.';
          return prev;
        }
        const liveBlock = getSponsoredBlockReason(prev, now);
        if (liveBlock) {
          blockedMessage = liveBlock;
          return prev;
        }

        const nextProgress = Number(sponsorships.progress?.[sponsor.id] ?? 0) + 1;
        const nextSponsorships = {
          ...sponsorships,
          progress: { ...(sponsorships.progress || {}), [sponsor.id]: nextProgress },
          claimedIds: [...(sponsorships.claimedIds || [])],
        };
        let next = {
          ...prev,
          ...markSponsoredAdAction(prev, now),
          sponsorships: nextSponsorships,
          log: addLog(prev.log, `Anuncio de patrocinio: ${sponsor.title} (${nextProgress}/${sponsor.adsRequired}).`),
          note: { msg: `${sponsor.title}: ${nextProgress}/${sponsor.adsRequired}`, type: 'success' },
        };

        if (nextProgress >= Number(sponsor.adsRequired ?? 1)) {
          completed = true;
          nextSponsorships.claimedIds.push(sponsor.id);
          if (sponsor.id === 'orbital-investor') {
            const activeId = prev.megaprojects?.activeId || MEGAPROJECTS[0].id;
            const activeProject = getMegaprojectById(activeId);
            const state = prev.megaprojects?.projects?.[activeId] || { phase: 0, credits: 0, ads: 0, resources: {} };
            next = {
              ...next,
              megaprojects: {
                ...(prev.megaprojects || {}),
                activeId,
                projects: {
                  ...(prev.megaprojects?.projects || {}),
                  [activeId]: { ...state, credits: Number(state.credits ?? 0) + 45, ads: Number(state.ads ?? 0) + 1 },
                },
              },
              log: addLog(next.log, `Patrocinio completado: ${sponsor.title}. ${activeProject.title} recibe +45 cr y +1 anuncio.`),
            };
          } else if (sponsor.id === 'logistics-brand') {
            const now = Date.now();
            const nextAdBoosts = { ...DEFAULT_AD_BOOSTS, ...(prev.adBoosts || {}), companyBoostUntil: now + 600_000, companyBoostMultiplier: Number(getResearchEffects(prev.research).companyBoostMultiplier ?? 1.5) };
            next = { ...next, adBoosts: nextAdBoosts, companies: hydrateCompanies(prev.companies, getCurrentRegionKeyFromSave(prev), nextAdBoosts, prev.territories, prev.player?.name, prev.research, getCurrentPlanetIdFromSave(prev), prev.hq) };
          } else if (sponsor.id === 'frontier-media') {
            next = {
              ...next,
              territories: (prev.territories || []).map((territory) =>
                territory.controller === prev.player?.name
                  ? { ...territory, threat: clamp(Number(territory.threat ?? 0) - 10, 0, 100), stability: clamp(Number(territory.stability ?? 0) + 4, 0, 100) }
                  : territory
              ),
            };
          }
          next.note = { msg: `Patrocinio completado: ${sponsor.title}`, type: 'success' };
        }

        return next;
      });

      if (blockedMessage) notify(blockedMessage, 'warn');
      else {
        try { await recordEstimatedAdPoolView(); }
        catch (err) { console.error('Error actualizando el pool de anuncios:', err); }
        notify(completed ? `Patrocinio completado: ${sponsor.title}` : `Anuncio registrado: ${sponsor.title}`, 'success');
      }
    },

    buyResearchUpgrade: async (upgradeKey) => {
      if (user?.id) {
        const remote = await startResearchSecure({ upgradeKey });
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          notify(remote.message || 'Investigacion iniciada.', 'success');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }

      const cost = getResearchUpgradeCost(save.research, upgradeKey);
      if (!cost?.upgrade)                                                      return notify('Mejora no disponible.', 'error');
      if (cost.isMaxed)                                                        return notify('Esa mejora ya esta al maximo.', 'warn');
      if (save.researchProjects?.active)                                       return notify('Ya tienes una investigacion en marcha.', 'warn');
      if (Number(save.player?.credits ?? 0) < Number(cost.credits ?? 0))      return notify(`Necesitas ${cost.credits} creditos.`, 'error');
      const missing = (cost.resources || []).find((r) => Number(save.inventory?.[r.key] ?? 0) < Number(r.amount ?? 0));
      if (missing) return notify('No tienes suficientes recursos para esa mejora.', 'error');

      setSave((prev) => {
        const liveCost      = getResearchUpgradeCost(prev.research, upgradeKey);
        const nextInventory = { ...(prev.inventory || {}) };
        (liveCost?.resources || []).forEach((r) => { nextInventory[r.key] = Math.max(0, Number(nextInventory[r.key] ?? 0) - Number(r.amount ?? 0)); });
        const timeMult  = getResearchLabTimeMultiplier(prev.companies, getCurrentPlanetIdFromSave(prev));
        const timeMin   = Math.max(1, Math.ceil(Number(liveCost.timeMin ?? 0) * timeMult));
        const startedAt = Date.now();
        return {
          ...prev,
          player: { ...prev.player, credits: Number(prev.player?.credits ?? 0) - Number(liveCost?.credits ?? 0) },
          inventory: nextInventory,
          researchProjects: { active: { key: upgradeKey, title: liveCost.upgrade.title, level: Number(liveCost.level ?? 0) + 1, credits: Number(liveCost.credits ?? 0), timeMin, adBoostUsed: false, resources: liveCost.resources || [], startedAt, endsAt: startedAt + timeMin * 60 * 1000 } },
          log:  addLog(prev.log, `Investigacion iniciada: ${liveCost.upgrade.title}  -  nivel ${Number(liveCost.level ?? 0) + 1}  -  ${timeMin} min`),
          note: { msg: `${liveCost.upgrade.title} en investigacion`, type: 'warn' },
        };
      });
      notify(`Investigacion iniciada: ${cost.upgrade.title}`, 'success');
    },

    triggerResearchAdBoost: async () => {
      const now = Date.now();
      const sponsoredBlock = getSponsoredBlockReason(save, now);
      if (sponsoredBlock) return notify(sponsoredBlock, 'warn');

      const project = save.researchProjects?.active;
      if (!project)               return notify('Necesitas una investigacion activa para acelerar.', 'warn');
      if (project.adBoostUsed)    return notify('Esa investigacion ya recibio un impulso por anuncio.', 'warn');
      if (!hasEnoughEnergy(save.player, 'triggerResearchAdBoost', save.research, save.hq)) return notify(`Necesitas ${getEnergyCost('triggerResearchAdBoost', save.research, save.hq)} de energia.`, 'error');
      if (!openSponsoredAction()) return false;

      if (user?.id) {
        const remote = await boostResearchSecure();
        if (remote?.ok && remote.saveData) {
          const normalized = normalizeSave(remote.saveData);
          setSave({ ...normalized, ...markSponsoredAdAction(normalized, now) });
          try { await recordEstimatedAdPoolView(); }
          catch (err) { console.error('Error actualizando el pool de anuncios:', err); }
          notify(remote.message || 'Investigacion acelerada por anuncio.', 'success');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }

      let applied = false;
      setSave((prev) => {
        const p = prev.researchProjects?.active;
        if (!p || p.adBoostUsed) return prev;
        const liveBlock = getSponsoredBlockReason(prev, now);
        if (liveBlock) return prev;
        const remaining = Math.max(0, Number(p.endsAt ?? now) - now);
        const factor    = Math.max(0.4, Number(getResearchEffects(prev.research).workAdRemainingFactor ?? 0.6) + 0.05);
        const reduced   = Math.max(60_000, Math.round(remaining * factor));
        applied = true;
        return { ...prev, ...markSponsoredAdAction(prev, now), player: spendEnergy(prev.player, 'triggerResearchAdBoost', prev.research, prev.hq), researchProjects: { active: { ...p, adBoostUsed: true, endsAt: now + reduced } }, log: addLog(prev.log, `Impulso de investigacion activado en ${p.title}`), note: { msg: `Investigacion acelerada: ${p.title}`, type: 'success' } };
      });
      if (applied) {
        try { await recordEstimatedAdPoolView(); }
        catch (err) { console.error('Error actualizando el pool de anuncios:', err); }
        notify('Investigacion acelerada por anuncio.', 'success');
      }
    },

    startElection: async (territoryId) => {
      if (user?.id) {
        const remote = await startElectionSecure({ territoryId });
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          notify(remote.message || 'Protocolo iniciado: duracion 30 segundos.', 'warn');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }
      if (Number(save.player.level ?? 1) < ELECTION_UNLOCK_LEVEL) return notify(`Necesitas nivel ${ELECTION_UNLOCK_LEVEL}.`, 'error');
      if (save.player.credits < ELECTION_CREDIT_COST)             return notify(`Necesitas ${ELECTION_CREDIT_COST} creditos.`, 'error');
      if (save.election.active)                                    return notify('Ya hay un protocolo activo.', 'warn');
      if (!hasEnoughEnergy(save.player, 'startElection', save.research, save.hq)) return notify(`Necesitas ${getEnergyCost('startElection', save.research, save.hq)} de energia.`, 'error');

      let applied = false;
      setSave((prev) => {
        if (Number(prev.player?.level ?? 1) < ELECTION_UNLOCK_LEVEL) return prev;
        if (Number(prev.player?.credits ?? 0) < ELECTION_CREDIT_COST) return prev;
        if (prev.election?.active) return prev;
        if (!hasEnoughEnergy(prev.player, 'startElection', prev.research, prev.hq)) return prev;

        const territory  = (prev.territories || []).find((t) => t.id === territoryId);
        const candidates = [prev.player.name, ...NPC_PLAYERS.slice(0, 2).map((p) => p.name)];
        applied = true;
        return {
          ...prev,
          player: { ...spendEnergy(prev.player, 'startElection', prev.research, prev.hq), credits: prev.player.credits - ELECTION_CREDIT_COST },
          election: { active: true, territory: territoryId, candidates, votes: {}, endsAt: Date.now() + 30_000, winner: null, counts: {} },
          log: addLog(prev.log, `Protocolo de control iniciado en ${territory?.name || 'el sector'}`),
        };
      });
      if (!applied) return notify('El protocolo ya no es valido con el estado actual.', 'warn');
      notify('Protocolo iniciado: duracion 30 segundos.', 'warn');
    },

    voteElection: async (candidate, electionId = null) => {
      if (user?.id) {
        const remote = await voteElectionSecure({ candidate, electionId });
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          notify(remote.message || `Voto registrado para ${candidate}`, 'success');
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) return notify(remote.error, 'error');
      }
      if (!save.election.active) return notify('No hay protocolo activo.', 'error');
      if (save.election.votes[save.player.name]) return notify('Ya has emitido tu voto en este protocolo.', 'warn');
      if (!hasEnoughEnergy(save.player, 'voteElection', save.research, save.hq)) return notify(`Necesitas ${getEnergyCost('voteElection', save.research, save.hq)} de energia.`, 'error');

      let applied = false;
      setSave((prev) => {
        if (!prev.election?.active || prev.election?.votes?.[prev.player.name]) return prev;
        if (!hasEnoughEnergy(prev.player, 'voteElection', prev.research, prev.hq)) return prev;
        applied = true;
        return { ...prev, player: spendEnergy(prev.player, 'voteElection', prev.research, prev.hq), election: { ...prev.election, votes: { ...prev.election.votes, [prev.player.name]: candidate } }, log: addLog(prev.log, `${prev.player.name} apoya a ${candidate}`) };
      });
      if (!applied) return notify('El voto ya no es valido con el estado actual.', 'warn');
      notify(`Voto registrado para ${candidate}`, 'success');
    },

    clearElectionResult: () => setSave((prev) => ({ ...prev, election: { active: false, territory: null, candidates: [], votes: {}, endsAt: null, winner: null, counts: {} } })),

    sendChat: () => {
      if (!save.chatInput.trim()) return;
      setSave((prev) => ({
        ...prev,
        chat: [...prev.chat, { from: prev.player.name || 'Tu', msg: prev.chatInput.trim(), t: Date.now(), avatar: 'TU' }].slice(-80),
        chatInput: '',
      }));
    },

    missDaySimulate: () => {
      const pct = Math.max(1, parseFloat((save.player.pct - 5).toFixed(1)));
      setSave((prev) => ({ ...prev, player: { ...prev.player, pct }, log: addLog(prev.log, `?? Simulacion de ausencia: reparto reducido a ${pct}%`) }));
      notify(`?? -5% de control del reparto ? ahora tienes ${pct}%`, 'warn');
    },

    refreshAdIncomeSummary,
  };
}


















