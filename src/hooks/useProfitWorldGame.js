/**
 * useProfitWorldGame.js  (orquestador)
 *
 * Antes: 4888 líneas.
 * Ahora: coordina los cuatro módulos del engine.
 *
 * Interfaz pública idéntica a la versión anterior —
 * ningún componente consumidor necesita cambios.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { REGIONS, REGION_CHANGE_COST, getRegionEconomy, getRegionByTerritoryId } from '../data/regions';
import { getResearchEffects } from '../data/researchData';
import { getPlanetEffects } from '../data/planets';
import { round2 } from '../utils/companyMath';
import { JOBS } from '../data/gameData';
import { MILESTONE_DEFINITIONS, findNextUnlockedMilestone } from '../data/milestones';

import { TUTORIAL_STEPS } from './engine/gameConstants';
import {
  addLog,
  applyPlayerXpGain,
  calcShare,
  createInitialSave,
  getCurrentPlanetIdFromSave,
  getCurrentRegionKeyFromSave,
  getBestControlledResourceBonus,
  getControlledStrategicEffects,
  getJobDurationSec,
} from './engine/gamePureLogic';
import { useGamePersistence } from './engine/useGamePersistence';
import { useGameTicks }       from './engine/useGameTicks';
import { useGameActions }     from './engine/useGameActions';

// ─── Milestone helpers (internal) ────────────────────────────────────────────

function createInitialMilestones() {
  return { unlockedIds: [], rewardGrantedIds: [], lastUnlockedId: null, lastUnlockedAt: null };
}

// ─────────────────────────────────────────────────────────────────────────────

export function useProfitWorldGame() {
  const [save, setSave] = useState(() => createInitialSave());
  const noteTimer       = useRef(null);
  const latestSaveRef   = useRef(save);

  // Keep the ref fresh
  useEffect(() => {
    latestSaveRef.current = save;
  }, [save]);

  // ── Persistence layer ─────────────────────────────────────────────────────
  const {
    user, isRemoteLoaded, authReady,
    persistRemoteSave, persistLocal, scheduleRemoteSave, updateLatestSaveRef,
  } = useGamePersistence(setSave);

  // Sync latestSaveRef into the persistence layer
  useEffect(() => { updateLatestSaveRef(save); }, [save, updateLatestSaveRef]);

  // Write local save on every state change
  useEffect(() => {
    persistLocal(save);
  }, [save]); // eslint-disable-line react-hooks/exhaustive-deps

  // Schedule remote save (debounced)
  useEffect(() => {
    const cleanup = scheduleRemoteSave(save);
    return cleanup ?? undefined;
  }, [save]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toast notifications ───────────────────────────────────────────────────
  const notify = (msg, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setSave((prev) => ({
      ...prev,
      toasts: [
        ...(prev.toasts || []),
        {
          id, msg, type,
          onClose: (toastId) => setSave((p) => ({ ...p, toasts: (p.toasts || []).filter((t) => t.id !== toastId) })),
        },
      ].slice(-4),
    }));
    setTimeout(() => {
      setSave((prev) => ({ ...prev, toasts: (prev.toasts || []).filter((t) => t.id !== id) }));
    }, 2800);
  };

  // ── Note auto-clear ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!save.note) return;
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => {
      setSave((prev) => ({ ...prev, note: null }));
    }, 2600);
    return () => clearTimeout(noteTimer.current);
  }, [save.note]);

  // ── Mission tracker ───────────────────────────────────────────────────────
  const updateMission = (type, amount = 1) => {
    setSave((prev) => {
      let missionReady = false;
      let readyTitle   = '';

      const missions = prev.missions.map((m) => {
        if (m.done || m.readyToClaim || m.type !== type) return m;
        const absolute = type === 'level' || type === 'pct' || type === 'conquer';
        const nextProgress = Math.min(m.goal, absolute ? Math.max(Number(m.progress ?? 0), amount) : Number(m.progress ?? 0) + amount);
        if (nextProgress >= m.goal) { missionReady = true; readyTitle = m.title || 'Mision'; }
        return { ...m, progress: nextProgress, readyToClaim: nextProgress >= m.goal };
      });

      if (!missionReady) return { ...prev, missions };
      return { ...prev, missions, log: addLog(prev.log, `?? Misión lista para reclamar: ${readyTitle}`), note: { msg: `?? Misión lista: ${readyTitle}`, type: 'success' } };
    });
  };

  // ── Tick engines ─────────────────────────────────────────────────────────
  useGameTicks({ save, setSave, isRemoteLoaded, user, authReady, updateMission });

  // ── Actions ───────────────────────────────────────────────────────────────
  const actions = useGameActions({ save, setSave, user, persistRemoteSave, updateMission, notify });

  // ── Milestone detection ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isRemoteLoaded || !save.player?.name) return;

    const next = findNextUnlockedMilestone(save);
    if (!next) return;

    setSave((prev) => {
      const ids = Array.isArray(prev.milestones?.unlockedIds) ? prev.milestones.unlockedIds : [];
      if (ids.includes(next.id) || !next.isUnlocked(prev)) return prev;
      return {
        ...prev,
        milestones: { ...createInitialMilestones(), ...(prev.milestones || {}), unlockedIds: [...ids, next.id], lastUnlockedId: next.id, lastUnlockedAt: Date.now() },
        log:  addLog(prev.log, `${next.icon} Hito desbloqueado: ${next.title}`),
        note: { msg: `${next.icon} ${next.title}`, type: 'success' },
        confetti: true,
      };
    });

    notify(`${next.icon} ${next.title}`, 'success');
    const t = setTimeout(() => setSave((prev) => ({ ...prev, confetti: false })), 2200);
    return () => clearTimeout(t);
  }, [
    isRemoteLoaded, save.player?.name, save.player?.credits, save.player?.level,
    save.player?.currentPlanet, save.player?.planet, save.stats?.works,
    save.stats?.contracts, save.stats?.conquests, save.companies?.length,
    save.researchProjects?.active, save.research, save.milestones?.unlockedIds,
    save,
  ]);

  // ── Milestone rewards ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRemoteLoaded || !save.player?.name) return;
    const ids       = Array.isArray(save.milestones?.unlockedIds)      ? save.milestones.unlockedIds      : [];
    const granted   = Array.isArray(save.milestones?.rewardGrantedIds) ? save.milestones.rewardGrantedIds : [];
    const pendingId = ids.find((id) => !granted.includes(id));
    if (!pendingId) return;

    setSave((prev) => {
      const pid = (prev.milestones?.unlockedIds || []).find((id) => !(prev.milestones?.rewardGrantedIds || []).includes(id));
      if (!pid) return prev;
      const def = MILESTONE_DEFINITIONS.find((m) => m.id === pid);
      if (!def) return prev;
      const rewardCredits = Number(def.reward?.credits ?? 0);
      const rewardXp      = Number(def.reward?.xp      ?? 0);
      return {
        ...prev,
        player: { ...applyPlayerXpGain(prev.player, rewardXp), credits: Number(prev.player?.credits ?? 0) + rewardCredits },
        milestones: { ...createInitialMilestones(), ...(prev.milestones || {}), unlockedIds: prev.milestones?.unlockedIds || [], rewardGrantedIds: [...(prev.milestones?.rewardGrantedIds || []), pid] },
        log:  addLog(prev.log, `${def.icon} Hito premiado: +${rewardCredits.toFixed(2)} creditos y +${rewardXp} XP`),
        note: { msg: `${def.icon} +${rewardCredits.toFixed(0)} creditos · +${rewardXp} XP`, type: 'success' },
      };
    });

    const t = setTimeout(() => {
      const def = MILESTONE_DEFINITIONS.find((m) => m.id === pendingId);
      if (def) notify(`${def.icon} Recompensa del hito: +${Number(def.reward?.credits ?? 0)} creditos y +${Number(def.reward?.xp ?? 0)} XP`, 'success');
    }, 0);
    return () => clearTimeout(t);
  }, [isRemoteLoaded, save.player?.name, save.milestones?.unlockedIds, save.milestones?.rewardGrantedIds]);

  // ── Derived values ────────────────────────────────────────────────────────
  const allUsers = useMemo(() => {
    if (!save.player.name) return save.npcs;
    return [
      ...save.npcs,
      { id: 'me', name: save.player.name, avatar: '?????', credits: save.player.credits, level: save.player.level, online: true, pct: save.player.pct, territory: save.territories.filter((t) => t.controller === save.player.name).length },
    ];
  }, [save.npcs, save.player, save.territories]);

  const equalShare = save.adEuros / Math.max(allUsers.length, 1);
  const myAdShare  = save.player.name ? calcShare(save.player.pct, save.adEuros, allUsers.length) : 0;

  const currentRegion = useMemo(
    () => getRegionEconomy(getCurrentRegionKeyFromSave(save), getCurrentPlanetIdFromSave(save)),
    [save]
  );

  const jobs = useMemo(() => {
    const effects      = getResearchEffects(save.research);
    const planetEffects = getPlanetEffects(getCurrentPlanetIdFromSave(save));
    const planetId = getCurrentPlanetIdFromSave(save);
    const playerName = save.player?.name;
    const strategicEffects = getControlledStrategicEffects(save.territories, playerName, planetId);
    const getBestWorkRegionBonus = (resourceKey) => {
      return getBestControlledResourceBonus(resourceKey, save.territories, playerName, save.research, planetId);
    };
    return JOBS
      .filter((job) => Number(job.unlockLevel ?? 1) <= Number(save.player.level ?? 1))
      .map((job) => {
        const workBonus = getBestWorkRegionBonus(job.item);
        const regionalBonusRate = workBonus.regionalBonusRate;
        const controlBonusRate = workBonus.controlBonusRate;
        const bonusRate = workBonus.bonusRate;
        const operationRewards = Array.isArray(job.operationRewards)
          ? job.operationRewards.map((reward) => ({
              ...reward,
              amount: round2(Number(reward.amount ?? 0) * (1 + Number(strategicEffects.operationRewardBonus ?? 0))),
            }))
          : [];
        return {
          ...job,
          credits:     round2(Number(job.credits ?? job.euros ?? 0) * Number(planetEffects.workCreditsMult  ?? 1) * (1 + Number(strategicEffects.workCreditsBonus ?? 0))),
          xp:          Math.round(Number(job.xp ?? 0)              * Number(planetEffects.workXpMult       ?? 1)),
          durationSec: Math.max(15, Math.round(getJobDurationSec(job) * Number(effects.workDurationMult ?? 1) * Number(planetEffects.workDurationMult ?? 1) * Number(strategicEffects.workDurationMult ?? 1))),
          resourceAmount: round2(1 + bonusRate),
          operationRewards,
          strategicEffects,
          bonusRate,
          regionalBonusRate,
          controlBonusRate,
          bonusRegionName: workBonus.region?.name || null,
        };
      });
  }, [save.player.level, save.research, save.player.currentPlanet, save.player.planet, save.player.currentRegion, save.player.region, save.player.name, save.territories]); // eslint-disable-line react-hooks/exhaustive-deps

  const tutorialStep =
    TUTORIAL_STEPS.find((s) => s.id === save.tutorial?.currentStepId) || TUTORIAL_STEPS[0];

  // ── Public interface (identical to original) ──────────────────────────────
  return {
    save,
    allUsers,
    equalShare,
    equalShareEuros: equalShare,
    myAdShare,
    myAdShareEuros:  myAdShare,
    actions,
    jobs,
    regions: REGIONS,
    currentRegion,
    regionChangeCost: REGION_CHANGE_COST,
    getRegionByTerritoryId,
    isRemoteLoaded,
    authReady,
    tutorialStep,
    tutorialSteps: TUTORIAL_STEPS,
  };
}
