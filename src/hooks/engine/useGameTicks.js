/**
 * useGameTicks.js
 *
 * Todos los bucles de juego (setInterval).
 * Cada tick tiene una unica responsabilidad.
 * No tiene acceso a user ni a Supabase -- solo modifica el estado del juego.
 */

import { useEffect } from 'react';
import { NPC_MESSAGES, NPC_PLAYERS } from '../../data/gameData';
import { getResearchEffects, normalizeResearch } from '../../data/researchData';
import { createInitialHq } from '../../data/hqUpgrades';
import { bindAdPoolAutoFlush } from '../../services/adpool';
import { completeWorkSecure, completeResearchSecure, resolveElectionSecure } from '../../services/multiplayerActions';
import {
  ACTIVE_JOB_TICK_MS,
  ADS_TICK_MS,
  COMPANY_TICK_MS,
  DEFAULT_AD_BOOSTS,
  ENERGY_REGEN_MS,
  EVENT_CYCLE_MS,
  MARKET_REFRESH_MS,
  TERRITORY_PRESSURE_MS,
  TERRITORY_SIEGE_TICKS,
  CONTRACT_REFRESH_MS,
} from './gameConstants';
import {
  addLog,
  applyCycleEventToContracts,
  applyPlayerXpGain,
  applyResearchToPlayer,
  createSectorEvent,
  createCycleEvent,
  createSessionEvent,
  decorateCycleEvent,
  getCurrentPlanetIdFromSave,
  getCurrentRegionKeyFromSave,
  hydrateCompanies,
  hydrateCompaniesAndInventory,
  randFrom,
  refreshContracts,
  resolveNpcAction,
  resolveTerritorialWeeklyEvent,
  resolveTerritoryPressure,
  syncTutorialState,
  normalizeSave,
} from './gamePureLogic';
import { round2 } from '../../utils/companyMath';

const REMOTE_WORK_ACTIONS_ENABLED = false;

const addEconomicHistory = (save, entry) => ({
  ...save,
  economicHistory: [
    { t: Date.now(), ...entry },
    ...(Array.isArray(save.economicHistory) ? save.economicHistory : []),
  ].slice(0, 80),
});

export function useGameTicks({
  save,
  setSave,
  isRemoteLoaded,
  user,
  authReady,
  updateMission,
}) {
  // -- Energy regen -------------------------------------------------------------
  useEffect(() => {
    if (!isRemoteLoaded) return;

    const t = setInterval(() => {
      setSave((prev) => {
        if (prev.player.energy >= prev.player.maxEnergy) return prev;
        return {
          ...prev,
          player: { ...prev.player, energy: Math.min(prev.player.maxEnergy, prev.player.energy + 1) },
        };
      });
    }, ENERGY_REGEN_MS);

    return () => clearInterval(t);
  }, [isRemoteLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Ads revenue tick ---------------------------------------------------------
  useEffect(() => {
    if (!isRemoteLoaded) return;

    const t = setInterval(() => {
      setSave((prev) => ({
        ...prev,
        adEuros: parseFloat(
          (prev.adEuros + (Math.random() * 0.0005 + 0.00015) * prev.adBoomMult).toFixed(6)
        ),
      }));
    }, ADS_TICK_MS);

    return () => clearInterval(t);
  }, [isRemoteLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Company production tick ---------------------------------------------------
  useEffect(() => {
    if (!isRemoteLoaded) return;

    const t = setInterval(() => {
      setSave((prev) => {
        const hasPaused = (prev.companies || []).some((company) => company?.maintenancePaused);
        const canResume = hasPaused && Number(prev.player?.credits ?? 0) >= 25;
        const sourceCompanies = canResume
          ? (prev.companies || []).map((company) => ({ ...company, maintenancePaused: false }))
          : prev.companies;
        const hydrated = hydrateCompaniesAndInventory(
          sourceCompanies, prev.inventory,
          getCurrentRegionKeyFromSave(prev),
          prev.adBoosts, prev.territories, prev.player?.name,
          prev.research, getCurrentPlanetIdFromSave(prev), prev.hq
        );
        const companiesChanged = JSON.stringify(hydrated.companies) !== JSON.stringify(prev.companies);
        const inventoryChanged = JSON.stringify(hydrated.inventory) !== JSON.stringify(prev.inventory);
        const maintenanceCost = round2(Number(hydrated.maintenanceCost ?? 0));
        if (!companiesChanged && !inventoryChanged && maintenanceCost <= 0) return prev;
        const credits = Number(prev.player?.credits ?? 0);
        const debt = Number(prev.maintenanceDebt ?? 0);
        const debtLimit = 100 + Number(prev.player?.level ?? 1) * 35;
        const shortfall = Math.max(0, maintenanceCost - credits);
        const canDeferMaintenance = shortfall > 0 && debt + shortfall <= debtLimit;
        const maintenanceBlocked = shortfall > 0 && !canDeferMaintenance;
        const paidNow = maintenanceBlocked ? 0 : Math.min(credits, maintenanceCost);
        const creditsAfterMaintenance = maintenanceBlocked ? credits : Math.max(0, credits - maintenanceCost);
        const repayment = !maintenanceBlocked && creditsAfterMaintenance > 0 && debt > 0
          ? Math.min(debt, creditsAfterMaintenance * 0.15)
          : 0;
        const nextDebt = maintenanceBlocked
          ? debt
          : round2(Math.max(0, debt + shortfall - repayment));
        const nextCompanies = maintenanceBlocked
          ? hydrated.companies.map((company) => (
              company?.companyType === 'research_lab' || company?.type === 'research_lab'
                ? company
                : { ...company, maintenancePaused: true, status: 'maintenance_paused' }
            ))
          : hydrated.companies;
        const nextSave = {
          ...prev,
          companies: nextCompanies,
          inventory: hydrated.inventory,
          player: {
            ...(prev.player || {}),
            credits: round2(Math.max(0, creditsAfterMaintenance - repayment)),
          },
          stats: {
            ...(prev.stats || {}),
            maintenancePaid: round2(Number(prev.stats?.maintenancePaid ?? 0) + paidNow),
          },
          maintenanceDebt: nextDebt,
          note: maintenanceBlocked
            ? { msg: 'Mantenimiento impagado: empresas pausadas hasta recuperar liquidez.', type: 'warn' }
            : canResume
              ? { msg: 'Liquidez recuperada: empresas reactivadas.', type: 'success' }
              : prev.note,
        };
        if (maintenanceBlocked) {
          return addEconomicHistory(nextSave, { type: 'maintenance_block', label: 'Pausa por mantenimiento', credits: 0, detail: `Deuda ${nextDebt.toFixed(2)} cr` });
        }
        if (shortfall > 0) {
          return addEconomicHistory(nextSave, { type: 'maintenance_debt', label: 'Mantenimiento diferido', credits: -shortfall, detail: `Deuda ${nextDebt.toFixed(2)} cr` });
        }
        if (repayment > 0) {
          return addEconomicHistory(nextSave, { type: 'maintenance_repay', label: 'Pago de deuda industrial', credits: -repayment, detail: `Deuda ${nextDebt.toFixed(2)} cr` });
        }
        return nextSave;
      });
    }, COMPANY_TICK_MS);

    return () => clearInterval(t);
  }, [isRemoteLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Market refresh tick -------------------------------------------------------
  useEffect(() => {
    if (!isRemoteLoaded) return;

    const t = setInterval(() => {
      setSave((prev) => {
        const eventExpired = prev.activeEvent && Number(prev.activeEvent?.expiresAt ?? Infinity) <= Date.now();
        if (!eventExpired) return prev;

        const market = Object.fromEntries(
          Object.entries(prev.market || {}).map(([key, item]) => [key, {
            ...item,
            eventActive: false,
            eventName: null,
            eventEffect: null,
            eventUntil: null,
          }])
        );
        const contracts = applyCycleEventToContracts(prev.contracts, null, market);

        const stats = prev.activeEventStats || {};
        const used = Number(stats.contractsDelivered ?? 0) + Number(stats.sales ?? 0);
        const summary = used > 0
          ? `${prev.activeEvent.title} terminado: ${Number(stats.contractsDelivered ?? 0)} contrato(s), ${Number(stats.sales ?? 0)} venta(s), +${Number(stats.bonusCredits ?? 0).toFixed(2)} cr extra.`
          : `${prev.activeEvent.title} terminado: oportunidad perdida, nadie cargo la demanda antes del cierre.`;
        return {
          ...prev,
          activeEvent: null,
          activeEventStats: null,
          adBoomMult: prev.activeEvent?.effect === 'adBoom' ? 1 : Number(prev.adBoomMult ?? 1),
          market,
          contracts,
          eventHistory: [
            { id: prev.activeEvent.id, title: prev.activeEvent.title, endedAt: Date.now(), ...stats },
            ...(Array.isArray(prev.eventHistory) ? prev.eventHistory : []),
          ].slice(0, 12),
          log: addLog(prev.log, summary),
          note: { msg: summary, type: used > 0 ? 'success' : 'warn' },
        };
      });
    }, MARKET_REFRESH_MS);

    return () => clearInterval(t);
  }, [isRemoteLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Event cycle tick (day advance) -------------------------------------------
  useEffect(() => {
    if (!isRemoteLoaded) return;

    const t = setInterval(() => {
      setSave((prev) => {
        const cycleEvent  = createCycleEvent(prev.lastEventAt, prev);
        const activeEvent = decorateCycleEvent(cycleEvent);
        const market      = prev.market;
        const contracts   = applyCycleEventToContracts(prev.contracts, activeEvent, market);

        const npcs = prev.npcs.map((npc) => ({
          ...npc,
          credits: Math.max(0, Number(npc.credits ?? 0) + (Math.random() * 1.2 - 0.2)),
          online:  Math.random() > 0.35,
          pct:     Math.min(100, Math.max(1, Number(npc.pct ?? 1) + (Math.random() > 0.55 ? 1 : -2))),
        }));

        let chat = prev.chat;
        if (Math.random() > 0.72) {
          const [msg, from] = randFrom(NPC_MESSAGES);
          const npc = NPC_PLAYERS.find((p) => p.name === from);
          chat = [...prev.chat, { from, msg, t: Date.now(), avatar: npc?.avatar || '???' }].slice(-80);
        }

        const nextAdBoomMult  = activeEvent?.effect === 'adBoom' ? 1.8 : 1;
        const adBoomChanged   = Number(prev.adBoomMult ?? 1) !== nextAdBoomMult;
        const baseLog = activeEvent
          ? addLog(prev.log, `Pulso de mercado: ${activeEvent.title}`)
          : prev.log;
        const nextLog = adBoomChanged
          ? addLog(baseLog, nextAdBoomMult > 1
              ? 'Auge publicitario activo: el pool crece mas rapido.'
              : 'Fin del auge publicitario: el pool vuelve a ritmo normal.')
          : baseLog;
        const nextNote = adBoomChanged
          ? { msg: nextAdBoomMult > 1 ? 'Auge publicitario activo' : 'Fin del auge publicitario', type: nextAdBoomMult > 1 ? 'success' : 'warn' }
          : prev.note;
        const day = Number(prev.day ?? 1) + 1;
        const territorialOutcome = resolveTerritorialWeeklyEvent({
          ...prev,
          day,
          territories: prev.territories,
          inventory: prev.inventory,
          player: prev.player,
          log: nextLog,
          note: nextNote,
        });

        return {
          ...prev, day, market, contracts, npcs, chat,
          territories: territorialOutcome.territories,
          territorialWeeklyEvent: territorialOutcome.event,
          inventory: territorialOutcome.inventory,
          player: territorialOutcome.player,
          activeEvent,
          activeEventStats: activeEvent ? { id: activeEvent.id, title: activeEvent.title, contractsDelivered: 0, sales: 0, bonusCredits: 0 } : null,
          lastEventAt: activeEvent ? Date.now() : Number(prev.lastEventAt ?? 0),
          lastAdBoomAt: activeEvent?.effect === 'adBoom' ? Date.now() : Number(prev.lastAdBoomAt ?? 0),
          adBoomMult: nextAdBoomMult,
          log: territorialOutcome.log,
          note: territorialOutcome.note,
          confetti: territorialOutcome.completed ? true : prev.confetti,
        };
      });
    }, EVENT_CYCLE_MS);

    return () => clearInterval(t);
  }, [isRemoteLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Active session events -----------------------------------------------------
  useEffect(() => {
    if (!isRemoteLoaded) return;

    const timer = setInterval(() => {
      setSave((prev) => {
        const now = Date.now();
        const eventExpired = prev.activeEvent && Number(prev.activeEvent?.expiresAt ?? Infinity) <= now;
        if (eventExpired) {
          return {
            ...prev,
            activeEvent: null,
            activeEventStats: null,
            adBoomMult: prev.activeEvent?.effect === 'adBoom' ? 1 : Number(prev.adBoomMult ?? 1),
          };
        }

        const base = prev.sessionStartedAt ? prev : { ...prev, sessionStartedAt: now };
        const sessionEvent = createSessionEvent(base, now);
        const sectorEvent = createSectorEvent(base, now);
        const npcAction = Math.random() < 0.32 ? resolveNpcAction(base, now) : null;

        if (!sessionEvent && !sectorEvent && !npcAction) return base;

        let next = { ...base };
        let nextLog = next.log;
        let nextChat = next.chat;
        let nextMarket = next.market;
        let nextContracts = next.contracts;
        let nextNote = next.note;

        if (sessionEvent) {
          nextContracts = applyCycleEventToContracts(nextContracts, sessionEvent, nextMarket);
          nextLog = addLog(nextLog, `Evento de sesion: ${sessionEvent.title}`);
          nextNote = { msg: sessionEvent.title, type: 'warn' };
          next = {
            ...next,
            activeEvent: sessionEvent,
            activeEventStats: { id: sessionEvent.id, title: sessionEvent.title, contractsDelivered: 0, sales: 0, bonusCredits: 0 },
            lastSessionEventAt: now,
            lastSessionEventEffect: sessionEvent.effect || null,
            lastAdBoomAt: sessionEvent.effect === 'adBoom' ? now : Number(next.lastAdBoomAt ?? 0),
            adBoomMult: sessionEvent.effect === 'adBoom' ? 1.8 : Number(next.adBoomMult ?? 1),
          };
        }

        if (sectorEvent) {
          nextLog = addLog(nextLog, `Evento de sector: ${sectorEvent.title}. Pide ${sectorEvent.qty} ${sectorEvent.itemName}.`);
          nextNote = { msg: sectorEvent.title, type: 'warn' };
          next = { ...next, activeSectorEvent: sectorEvent, lastSectorEventAt: now };
        }

        if (npcAction) {
          nextLog = addLog(nextLog, npcAction.log);
          nextChat = [
            ...(nextChat || []),
            { from: npcAction.npc.name, msg: npcAction.log, t: now, avatar: npcAction.npc.avatar || 'NPC' },
          ].slice(-80);
        }

        return {
          ...next,
          market: nextMarket,
          contracts: nextContracts,
          chat: nextChat,
          log: nextLog,
          note: nextNote,
        };
      });
    }, 60_000);

    return () => clearInterval(timer);
  }, [isRemoteLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Territory pressure tick ---------------------------------------------------
  useEffect(() => {
    if (!isRemoteLoaded || !save.player?.name) return;

    const timer = setInterval(() => {
      setSave((prev) => {
        const outcome = resolveTerritoryPressure(prev);
        const changed = JSON.stringify(outcome.territories) !== JSON.stringify(prev.territories);
        if (!outcome.alerts.length && !changed) return prev;
        if (!outcome.alerts.length) return { ...prev, territories: outcome.territories };

        const lostAlert     = outcome.alerts.find((a) => a.type === 'lost');
        const criticalAlert = outcome.alerts.find((a) => a.type === 'critical');
        const pressureAlert = outcome.alerts.find((a) => a.type === 'pressure');
        const enemyCampaignAlert = outcome.alerts.find((a) => a.type === 'enemy_campaign');
        let nextLog  = prev.log;
        let nextNote = prev.note;

        const siegeAlert      = outcome.alerts.find((a) => a.type === 'siege');
        const siegeLiftedAlert = outcome.alerts.find((a) => a.type === 'siege_lifted');

        if (lostAlert) {
          const lossDetail = `fortificacion ${lostAlert.fortification ?? 0}%`;
          nextLog  = addLog(nextLog, `Sector perdido: ${lostAlert.territoryName}. Tenias ${lossDetail}.`);
          nextNote = { msg: `Has perdido ${lostAlert.territoryName}: pierdes su bonus territorial.`, type: 'error' };
        } else if (siegeAlert) {
          const ticksLeft = siegeAlert.ticksLeft;
          const timeLeft  = Math.round(ticksLeft * (TERRITORY_PRESSURE_MS / 60_000));
          nextLog  = addLog(nextLog, `ASEDIO: ${siegeAlert.attackerName} asedia ${siegeAlert.territoryName}. ${ticksLeft} ticks para caer (~${timeLeft} min).`);
          nextNote = { msg: `⚔️ ${siegeAlert.attackerName} asedia ${siegeAlert.territoryName}. Refuerza ahora — ${timeLeft} min para perderlo.`, type: 'error' };
        } else if (siegeLiftedAlert) {
          nextLog  = addLog(nextLog, `Asedio levantado: ${siegeLiftedAlert.territoryName} ha resistido.`);
          nextNote = { msg: `✓ ${siegeLiftedAlert.territoryName} ha resistido el asedio.`, type: 'success' };
        } else if (enemyCampaignAlert) {
          nextLog = addLog(nextLog, `${enemyCampaignAlert.attackerName} abre frente en ${enemyCampaignAlert.territoryName}: ${enemyCampaignAlert.stage} ${enemyCampaignAlert.progress}%`);
          nextNote = { msg: `${enemyCampaignAlert.attackerName} avanza en ${enemyCampaignAlert.territoryName} (${enemyCampaignAlert.progress}%).`, type: 'warn' };
        } else if (criticalAlert) {
          nextLog  = addLog(nextLog, `Territorio en riesgo critico: ${criticalAlert.territoryName}`);
          nextNote = { msg: `${criticalAlert.territoryName} esta bajo mucha presion. Refuerza o construye un fortin.`, type: 'warn' };
        } else if (pressureAlert) {
          nextLog = addLog(
            nextLog,
            `${pressureAlert.attackerName} presiona ${pressureAlert.territoryName}: +${pressureAlert.threat} amenaza - mitigado ${pressureAlert.mitigated}%`
          );
          nextNote = { msg: `${pressureAlert.attackerName} presiona ${pressureAlert.territoryName}.`, type: 'warn' };
        }

        return { ...prev, territories: outcome.territories, log: nextLog, note: nextNote };
      });
    }, TERRITORY_PRESSURE_MS);

    return () => clearInterval(timer);
  }, [isRemoteLoaded, save.player?.name]); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Contract refresh tick -----------------------------------------------------
  useEffect(() => {
    if (!isRemoteLoaded) return;

    const timer = setInterval(() => {
      setSave((prev) => {
        const contractState = refreshContracts(prev.contracts, prev.player.level, getCurrentPlanetIdFromSave(prev), Date.now(), prev.territories, prev.player?.name);
        if (!contractState.changed) return prev;
        const contracts = applyCycleEventToContracts(contractState.contracts, prev.activeEvent, prev.market);
        return { ...prev, contracts };
      });
    }, CONTRACT_REFRESH_MS);

    return () => clearInterval(timer);
  }, [isRemoteLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Active job tick
  useEffect(() => {
    if (!isRemoteLoaded || !save.activeJob?.endAt) return;

    let remoteCompletionInFlight = false;
    const t = setInterval(async () => {
      if (Date.now() < Number(save.activeJob?.endAt ?? 0)) return;

      if (user?.id && REMOTE_WORK_ACTIONS_ENABLED && !remoteCompletionInFlight) {
        remoteCompletionInFlight = true;
        const remote = await completeWorkSecure();
        remoteCompletionInFlight = false;
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) {
          setSave((prev) => ({
            ...prev,
            note: { msg: remote.error, type: 'error' },
            log: addLog(prev.log, `Trabajo no completado: ${remote.error}`),
          }));
          return;
        }
      }

      let completedJob = null;

      setSave((prev) => {
        const { activeJob } = prev;
        if (!activeJob || Date.now() < Number(activeJob.endAt ?? 0)) return prev;

        completedJob = activeJob;
        const resourceAmount = round2(Number(activeJob.resourceAmount ?? 1));
        const nextInventory = activeJob.item
          ? { ...prev.inventory, [activeJob.item]: round2((prev.inventory?.[activeJob.item] || 0) + resourceAmount) }
          : { ...(prev.inventory || {}) };
        (Array.isArray(activeJob.operationRewards) ? activeJob.operationRewards : []).forEach((reward) => {
          if (!reward?.key) return;
          nextInventory[reward.key] = round2(Number(nextInventory?.[reward.key] || 0) + Number(reward.amount || 0));
        });
        const operationRewardText = (Array.isArray(activeJob.operationRewards) ? activeJob.operationRewards : [])
          .filter((reward) => reward?.key && Number(reward.amount || 0) > 0)
          .map((reward) => `+${Number(reward.amount).toFixed(2)} ${reward.key}`)
          .join(', ');
        const nextPlayer = applyPlayerXpGain(prev.player, Number(activeJob.xp ?? 0));

        return {
          ...prev,
          activeJob: null,
          player: {
            ...nextPlayer,
            credits: Number(prev.player.credits ?? 0) + Number(activeJob.credits ?? 0),
            health:  Math.min(100, Number(prev.player.health ?? 100) + Number(activeJob.hd ?? 0)),
          },
          inventory: nextInventory,
          stats: { ...prev.stats, works: Number(prev.stats?.works ?? 0) + 1 },
          log:  addLog(prev.log, `Trabajo completado: ${activeJob.icon || ''} ${activeJob.label} - +${resourceAmount.toFixed(2)} recurso${operationRewardText ? ` - ${operationRewardText}` : ''} - +${Number(activeJob.credits ?? 0).toFixed(2)} creditos +${Number(activeJob.xp ?? 0)} XP`),
          note: { msg: `Trabajo completado: ${activeJob.label}`, type: 'success' },
        };
      });

      if (completedJob) {
        updateMission('work');
        if (completedJob.item === 'oxygen_tanks')    updateMission('collect_oxygen_tanks');
        if (completedJob.item === 'habitat_modules') updateMission('collect_habitat_modules');
      }
    }, ACTIVE_JOB_TICK_MS);

    return () => clearInterval(t);
  }, [isRemoteLoaded, save.activeJob?.endAt, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Election resolution tick
  useEffect(() => {
    if (!save.election.active || !save.election.endsAt) return;

    let remoteResolutionInFlight = false;
    const t = setInterval(async () => {
      if (Date.now() < save.election.endsAt) return;

      if (user?.id && !remoteResolutionInFlight) {
        remoteResolutionInFlight = true;
        const remote = await resolveElectionSecure();
        remoteResolutionInFlight = false;
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) {
          setSave((prev) => ({ ...prev, note: { msg: remote.error, type: 'error' }, log: addLog(prev.log, `Protocolo no resuelto: ${remote.error}`) }));
          return;
        }
      }

      setSave((prev) => {
        if (!prev.election.active) return prev;

        const counts = Object.fromEntries(prev.election.candidates.map((c) => [c, 0]));
        Object.values(prev.election.votes).forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
        prev.election.candidates.forEach((c) => { counts[c] += Math.floor(Math.random() * 10) + 2; });

        const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || prev.player.name;
        const territory = prev.territories.find((ter) => ter.id === prev.election.territory);

        return {
          ...prev,
          territories: prev.territories.map((ter) =>
            ter.id === prev.election.territory
              ? { ...ter, controller: winner, stability: 68, threat: 24, fortification: Math.max(4, Number(ter.fortification ?? 0)) }
              : ter
          ),
          election: { ...prev.election, active: false, winner, counts },
          log:  addLog(prev.log, `Protocolo resuelto en ${territory?.name || 'el sector'}: domina ${winner}`),
          note: { msg: `${winner} toma el control del sector`, type: 'warn' },
          selTer: territory ? { ...territory, controller: winner } : prev.selTer,
        };
      });
    }, 1000);

    return () => clearInterval(t);
  }, [save.election.active, save.election.endsAt, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // Research completion tick
  useEffect(() => {
    if (!isRemoteLoaded || !save.researchProjects?.active?.endsAt) return;

    let remoteCompletionInFlight = false;
    const timer = setInterval(async () => {
      const now = Date.now();
      if (Number(save.researchProjects?.active?.endsAt ?? 0) > now) return;

      if (user?.id && !remoteCompletionInFlight) {
        remoteCompletionInFlight = true;
        const remote = await completeResearchSecure();
        remoteCompletionInFlight = false;
        if (remote?.ok && remote.saveData) {
          setSave(normalizeSave(remote.saveData));
          setTimeout(() => setSave((prev) => ({ ...prev, confetti: false })), 1800);
          return;
        }
        if (remote?.error && !remote.fallbackAllowed) {
          setSave((prev) => ({
            ...prev,
            note: { msg: remote.error, type: 'error' },
            log: addLog(prev.log, `Investigacion no completada: ${remote.error}`),
          }));
          return;
        }
      }

      setSave((prev) => {
        const activeProject = prev.researchProjects?.active;
        if (!activeProject || Number(activeProject.endsAt ?? 0) > now) return prev;

        const nextResearch = normalizeResearch({
          ...(prev.research || {}),
          [activeProject.key]: Number(prev.research?.[activeProject.key] ?? 0) + 1,
        });
        const nextAdBoosts = {
          ...DEFAULT_AD_BOOSTS, ...(prev.adBoosts || {}),
          companyBoostMultiplier: Number(getResearchEffects(nextResearch).companyBoostMultiplier ?? 1.5),
        };

        return {
          ...prev,
          research:         nextResearch,
          researchProjects: { active: null },
          adBoosts:         nextAdBoosts,
          player: applyResearchToPlayer({ ...prev.player, energy: Number(prev.player?.energy ?? 0) + 6 }, nextResearch),
          companies: hydrateCompanies(
            prev.companies, getCurrentRegionKeyFromSave(prev),
            nextAdBoosts, prev.territories, prev.player?.name,
            nextResearch, getCurrentPlanetIdFromSave(prev), prev.hq
          ),
          log:  addLog(prev.log, `Investigacion completada: ${activeProject.title} nivel ${Number(nextResearch?.[activeProject.key] ?? 0)}`),
          note: { msg: `Investigacion completada: ${activeProject.title}`, type: 'success' },
          confetti: true,
        };
      });

      setTimeout(() => setSave((prev) => ({ ...prev, confetti: false })), 1800);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRemoteLoaded, save.researchProjects?.active?.endsAt, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // HQ upgrade completion tick
  useEffect(() => {
    if (!isRemoteLoaded || !save.hqProjects?.active?.endsAt) return;

    const timer = setInterval(() => {
      const now = Date.now();
      if (Number(save.hqProjects?.active?.endsAt ?? 0) > now) return;

      setSave((prev) => {
        const activeProject = prev.hqProjects?.active;
        if (!activeProject || Number(activeProject.endsAt ?? 0) > now) return prev;

        const currentLevel = Number(prev.hq?.[activeProject.key] ?? 0);
        const nextHq = {
          ...createInitialHq(),
          ...(prev.hq || {}),
          [activeProject.key]: currentLevel + 1,
        };

        return {
          ...prev,
          hq: nextHq,
          hqProjects: { active: null },
          companies: hydrateCompanies(
            prev.companies,
            getCurrentRegionKeyFromSave(prev),
            prev.adBoosts,
            prev.territories,
            prev.player?.name,
            prev.research,
            getCurrentPlanetIdFromSave(prev),
            nextHq
          ),
          log: addLog(prev.log, `Mejora de sede completada: ${activeProject.title} nivel ${currentLevel + 1}`),
          note: { msg: `Mejora completada: ${activeProject.title}`, type: 'success' },
          confetti: true,
        };
      });

      setTimeout(() => setSave((prev) => ({ ...prev, confetti: false })), 1800);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRemoteLoaded, save.hqProjects?.active?.endsAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // -- Tutorial sync -------------------------------------------------------------
  useEffect(() => {
    if (!isRemoteLoaded) return;
    setSave((prev) => syncTutorialState(prev));
  }, [
    isRemoteLoaded,
    save.stats?.works, save.stats?.sells,
    save.companies?.length, save.rewardAdsToday,
    save.player?.level, save.hq, save.researchProjects?.active, save.research,
    setSave,
  ]);

  // -- Ad pool auto-flush --------------------------------------------------------
  useEffect(() => {
    if (!authReady || !user || !isRemoteLoaded) return;

    const unbind = bindAdPoolAutoFlush({
      userId:       user.id,
      getPlayerPct: () => save.player?.pct ?? 1,
    });

    return () => unbind?.();
  }, [authReady, user, isRemoteLoaded, save.player?.pct]);

  // -- Mission sync side effects -------------------------------------------------
  useEffect(() => {
    if (!isRemoteLoaded) return;
    if (Number(save.player.level ?? 1) <= 1) return;
    updateMission('level', save.player.level);
  }, [isRemoteLoaded, save.player.level]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isRemoteLoaded) return;
    if (Number(save.player.pct ?? 1) <= 1) return;
    updateMission('pct', save.player.pct);
  }, [isRemoteLoaded, save.player.pct]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isRemoteLoaded) return;
    const controlled = (save.territories || []).filter((t) => t.controller === save.player?.name).length;
    updateMission('conquer', Math.max(controlled, Number(save.stats?.conquests ?? 0)));
  }, [isRemoteLoaded, save.stats?.conquests, save.territories, save.player?.name]); // eslint-disable-line react-hooks/exhaustive-deps
}
