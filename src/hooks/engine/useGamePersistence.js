/**
 * useGamePersistence.js
 *
 * Responsabilidades:
 *  - Auth con Supabase (sesión + cambios de estado)
 *  - Carga inicial de la partida (remoto → local → nuevo)
 *  - Guardado automático local y remoto
 *  - Gestión del pendingAccountSave (conflictos guest→cuenta)
 */

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { loadGame, saveGame } from '../../services/gameSave';
import { getMyProfile } from '../../services/auth';
import {
  adoptGuestPendingStore,
  flushAllAdViewsToSupabase,
  getMyAdIncomeSummary,
  getMyAdIncomeHistory,
  getPublicAdPoolSummary,
} from '../../services/adpool';
import {
  readLocalSave,
  writeLocalSave,
  buildRemoteSavePayload,
  applyDailyLoginUpdate,
  createInitialSave,
  hasMeaningfulProgress,
  summarizeSaveForImport,
  readPendingAccountSave,
  clearPendingAccountSave,
  mergeAdIncomeSummary,
  withTimeout,
} from './gamePureLogic';

const RETURN_SCREEN_SHOWN_PREFIX = 'astracorp-return-screen-shown-v1';

const getReturnScreenStorageKey = (userId) =>
  `${RETURN_SCREEN_SHOWN_PREFIX}-${userId || 'guest'}`;

function wasReturnScreenShown(userId, claimDate) {
  if (typeof window === 'undefined' || !claimDate) return false;
  try {
    return window.sessionStorage.getItem(getReturnScreenStorageKey(userId)) === claimDate;
  } catch {
    return false;
  }
}

function markReturnScreenShown(userId, claimDate) {
  if (typeof window === 'undefined' || !claimDate) return;
  try {
    window.sessionStorage.setItem(getReturnScreenStorageKey(userId), claimDate);
  } catch {
    // No pasa nada si el navegador bloquea sessionStorage.
  }
}

function buildReturnData(prevSave, normalized, userId = null) {
  if (!normalized.loginRewards?.lastDailyReward) return null;
  const claimDate = normalized.loginRewards?.lastClaimDate || normalized.lastLoginDate;
  const prevClaimDate = prevSave?.loginRewards?.lastClaimDate || prevSave?.lastLoginDate || null;
  if (!claimDate || claimDate === prevClaimDate || wasReturnScreenShown(userId, claimDate)) return null;

  const now = Date.now();
  const offlineMs = Math.max(0, now - Number(prevSave?.lastProgressAt ?? now));
  const missedDays = Number(normalized.loginRewards?.lastReturnReward?.missedDays ?? 0);
  const companiesReady = (normalized.companies || []).filter(c => {
    const s = Number(c?.storage ?? 0);
    const m = Number(c?.maxStorage ?? 0);
    return m > 0 && s >= m * 0.95;
  }).length;
  const contractsExpiring = (normalized.contracts || []).filter(c =>
    c?.expiresAt && Number(c.expiresAt) - now < 5 * 60 * 1000
  ).length;
  const territoriesUnderPressure = (normalized.territories || [])
    .filter(t => t.controller === normalized.player?.name && Number(t.threat ?? 0) >= 65)
    .map(t => ({ name: t.name, threat: Math.round(Number(t.threat)) }))
    .slice(0, 3);
  const researchDone = normalized.loginRewards?.lastResearchCompleted
    ? { title: normalized.loginRewards.lastResearchCompleted }
    : null;
  return {
    streak:          Number(normalized.loginRewards?.streak ?? 1),
    missedDays,
    offlineHours:    Math.floor(offlineMs / 3_600_000),
    recoveredEnergy: Math.floor(offlineMs / 60_000),
    pctLost:         missedDays * 5,
    dailyReward:     normalized.loginRewards?.lastDailyReward || {},
    returnReward:    normalized.loginRewards?.lastReturnReward || null,
    researchDone,
    territoriesUnderPressure,
    companiesReady,
    contractsExpiring,
  };
}

function showReturnScreenOnce(prevSave, normalized, userId, setReturnData) {
  const data = buildReturnData(prevSave, normalized, userId);
  if (!data) return;
  const claimDate = normalized.loginRewards?.lastClaimDate || normalized.lastLoginDate;
  markReturnScreenShown(userId, claimDate);
  setReturnData(data);
}

export function useGamePersistence(setSave) {
  const [user, setUser]                   = useState(null);
  const [isRemoteLoaded, setIsRemoteLoaded] = useState(false);
  const [authReady, setAuthReady]           = useState(false);
  const [returnData, setReturnData]         = useState(null);
  const [saveStatus, setSaveStatus]         = useState({
    local: 'idle',
    remote: 'idle',
    lastLocalAt: null,
    lastRemoteAt: null,
    error: null,
  });

  const latestSaveRef           = useRef(null);
  const lastRemoteSnapshotRef   = useRef('');
  const latestAuthUserIdRef     = useRef(null);

  // ── Keep latestSaveRef fresh (called from parent hook) ──────────────────────
  const updateLatestSaveRef = (save) => { latestSaveRef.current = save; };

  // ── Remote persist ──────────────────────────────────────────────────────────
  const persistRemoteSave = async (userId, nextSave, options = {}) => {
    if (!userId) return false;
    const payload  = buildRemoteSavePayload(nextSave);
    const snapshot = JSON.stringify(payload);
    if (!options.force && snapshot === lastRemoteSnapshotRef.current) return false;
    setSaveStatus((prev) => ({ ...prev, remote: 'saving', error: null }));
    await saveGame(userId, payload);
    lastRemoteSnapshotRef.current = snapshot;
    setSaveStatus((prev) => ({ ...prev, remote: 'synced', lastRemoteAt: Date.now(), error: null }));
    return true;
  };

  // ── Auth init ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(), 5000, 'Inicio de sesion'
        );
        if (!mounted) return;
        latestAuthUserIdRef.current = session?.user?.id ?? null;
        setUser(session?.user || null);
      } catch (error) {
        console.warn('Supabase auth no respondio a tiempo, iniciando en local:', error);
        if (!mounted) return;
        latestAuthUserIdRef.current = null;
        setUser(null);
      } finally {
        if (mounted) setAuthReady(true);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null;
      const prevUserId = latestAuthUserIdRef.current;
      latestAuthUserIdRef.current = nextUserId;
      if (!session?.user) lastRemoteSnapshotRef.current = '';
      setUser(session?.user || null);
      if (nextUserId !== prevUserId) setIsRemoteLoaded(false);
      setAuthReady(true);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  // ── Load game on auth ready ──────────────────────────────────────────────────
  useEffect(() => {
    async function fetchSavedGame() {
      if (!authReady) return;

      if (!user) {
        lastRemoteSnapshotRef.current = '';
        const guestSave = readLocalSave(null);
        const normalized = applyDailyLoginUpdate(guestSave || createInitialSave());
        setSave(normalized);
        writeLocalSave(null, normalized);
        showReturnScreenOnce(guestSave, normalized, null, setReturnData);
        setIsRemoteLoaded(true);
        return;
      }

      try {
        const pendingAccountSave = readPendingAccountSave();
        const remoteSave = await withTimeout(loadGame(user.id), 6000, 'Carga remota');

        // Guest save pending — check for conflict with existing remote progress
        if (pendingAccountSave?.mode === 'save' && pendingAccountSave?.save) {
          if (remoteSave && hasMeaningfulProgress(remoteSave)) {
            const normalizedRemote = applyDailyLoginUpdate(remoteSave);
            const withConflict = {
              ...normalizedRemote,
              importConflict: {
                pendingSave:    pendingAccountSave.save,
                localSummary:   summarizeSaveForImport(pendingAccountSave.save),
                remoteSummary:  summarizeSaveForImport(normalizedRemote),
              },
            };
            setSave(withConflict);
            writeLocalSave(user.id, withConflict);
            await withTimeout(persistRemoteSave(user.id, normalizedRemote, { force: true }), 6000, 'Guardado remoto');
            return;
          }

          const normalized = applyDailyLoginUpdate(pendingAccountSave.save);
          setSave(normalized);
          writeLocalSave(user.id, normalized);
          showReturnScreenOnce(pendingAccountSave.save, normalized, user.id, setReturnData);
          await withTimeout(persistRemoteSave(user.id, normalized, { force: true }), 6000, 'Guardado remoto');
          clearPendingAccountSave();
          return;
        }

        if (remoteSave && typeof remoteSave === 'object') {
          const normalized = applyDailyLoginUpdate(remoteSave);
          setSave(normalized);
          writeLocalSave(user.id, normalized);
          showReturnScreenOnce(remoteSave, normalized, user.id, setReturnData);
          await withTimeout(persistRemoteSave(user.id, normalized, { force: true }), 6000, 'Guardado remoto');
        } else {
          const userLocalSave = readLocalSave(user.id);
          const base = userLocalSave && typeof userLocalSave === 'object'
            ? userLocalSave
            : createInitialSave();
          const normalized = applyDailyLoginUpdate(base);
          setSave(normalized);
          writeLocalSave(user.id, normalized);
          showReturnScreenOnce(base, normalized, user.id, setReturnData);
          await withTimeout(persistRemoteSave(user.id, normalized, { force: true }), 6000, 'Guardado remoto');
        }
      } catch (error) {
        console.error('Error cargando partida remota:', error);
        const fallbackBase = readLocalSave(user?.id) || createInitialSave();
        const fallback = applyDailyLoginUpdate(fallbackBase);
        setSave(fallback);
        writeLocalSave(user?.id || null, fallback);
        showReturnScreenOnce(fallbackBase, fallback, user?.id || null, setReturnData);
      } finally {
        setIsRemoteLoaded(true);
      }
    }

    fetchSavedGame();
  }, [authReady, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fallback timer in case remote never resolves ─────────────────────────────
  useEffect(() => {
    if (!authReady || isRemoteLoaded) return;

    const timer = setTimeout(() => {
      console.warn('Fallback de carga activado: abriendo la partida local para evitar bloqueo.');
      const timerBase = readLocalSave(user?.id || null) || latestSaveRef.current || createInitialSave();
      const fallback = applyDailyLoginUpdate(timerBase);
      setSave(fallback);
      writeLocalSave(user?.id || null, fallback);
      showReturnScreenOnce(timerBase, fallback, user?.id || null, setReturnData);
      setIsRemoteLoaded(true);
    }, 7000);

    return () => clearTimeout(timer);
  }, [authReady, isRemoteLoaded, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync username from profile ───────────────────────────────────────────────
  useEffect(() => {
    if (!authReady || !user || !isRemoteLoaded) return;

    getMyProfile()
      .then((profile) => {
        if (!profile?.username) return;
        setSave((prev) => ({
          ...prev,
          newName: profile.username,
          player: {
            ...prev.player,
            name: prev.player.name && !['Tú', 'Invitado', 'Colono'].includes(prev.player.name)
              ? prev.player.name
              : profile.username,
          },
        }));
      })
      .catch((err) => console.error('Error cargando perfil:', err));
  }, [authReady, user, isRemoteLoaded, setSave]);

  // ── Ad pool init ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authReady || !isRemoteLoaded) return;

    async function initAdPool() {
      if (user?.id) {
        try {
          adoptGuestPendingStore(user.id);
          await flushAllAdViewsToSupabase({
            userId:    user.id,
            playerPct: latestSaveRef.current?.player?.pct ?? 1,
          });
        } catch (err) {
          console.error('Error sincronizando acciones patrocinadas pendientes:', err);
        }
      }

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
        console.error('Error cargando datos de ingresos de anuncios:', err);
      }
    }

    initAdPool();
  }, [authReady, user, isRemoteLoaded, setSave]);

  // ── Local save on every state change ────────────────────────────────────────
  const persistLocal = (save) => {
    if (!authReady || !isRemoteLoaded) return;
    try {
      writeLocalSave(user?.id || null, save);
      setSaveStatus((prev) => ({ ...prev, local: 'saved', lastLocalAt: Date.now(), error: null }));
    } catch (error) {
      setSaveStatus((prev) => ({ ...prev, local: 'error', error: error?.message || 'Error guardando local' }));
    }
  };

  // ── Debounced remote save on state change ────────────────────────────────────
  const scheduleRemoteSave = (save) => {
    if (!authReady || !user || !isRemoteLoaded) return null;
    const snapshot = JSON.stringify(buildRemoteSavePayload(save));
    if (snapshot === lastRemoteSnapshotRef.current) return null;

    const timeout = setTimeout(() => {
      persistRemoteSave(user.id, save).catch((err) =>
        {
          console.error('Error guardando partida remota:', err);
          setSaveStatus((prev) => ({ ...prev, remote: 'error', error: err?.message || 'Error guardando en la nube' }));
        }
      );
    }, 1000);

    return () => clearTimeout(timeout);
  };

  // ── Save on visibility hidden / page hide ────────────────────────────────────
  useEffect(() => {
    const persist = () => {
      writeLocalSave(user?.id || null, latestSaveRef.current);
      if (authReady && user && isRemoteLoaded) {
        persistRemoteSave(user.id, latestSaveRef.current).catch((err) =>
          console.error('Error sincronizando partida al ocultar la app:', err)
        );
      }
    };

    const onVisibility = () => { if (document.visibilityState === 'hidden') persist(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', persist);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', persist);
    };
  }, [authReady, user, isRemoteLoaded]);

  return {
    user,
    isRemoteLoaded,
    authReady,
    persistRemoteSave,
    persistLocal,
    scheduleRemoteSave,
    updateLatestSaveRef,
    saveStatus: {
      ...saveStatus,
      remote: user ? saveStatus.remote : 'guest',
    },
    returnData,
    clearReturnData: () => setReturnData(null),
  };
}
