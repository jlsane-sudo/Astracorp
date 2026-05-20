import { supabase } from '../lib/supabase';

const AD_POOL_STORAGE_PREFIX = 'astracorp-adpool-pending-v1';
const DEFAULT_REVENUE_PER_VIEW = 0.00054;
const DEFAULT_FLUSH_EVERY_VIEWS = 5;

function createPendingEntry(dayKey = getTodayKey(), views = 0, revenue = 0) {
  return {
    dayKey,
    views: Number(views ?? 0),
    revenue: Number(revenue ?? 0),
  };
}

function normalizePendingEntry(entry, fallbackDayKey = getTodayKey()) {
  return createPendingEntry(
    entry?.dayKey || fallbackDayKey,
    entry?.views,
    entry?.revenue
  );
}

function hasPendingData(entry) {
  return Number(entry?.views || 0) > 0 || Number(entry?.revenue || 0) > 0;
}

function mergeBacklogEntries(entries) {
  const byDay = new Map();

  (entries || []).forEach((entry) => {
    const normalized = normalizePendingEntry(entry);

    if (!hasPendingData(normalized)) return;

    const existing = byDay.get(normalized.dayKey) || createPendingEntry(normalized.dayKey);
    byDay.set(
      normalized.dayKey,
      createPendingEntry(
        normalized.dayKey,
        Number(existing.views || 0) + Number(normalized.views || 0),
        round6(Number(existing.revenue || 0) + Number(normalized.revenue || 0))
      )
    );
  });

  return Array.from(byDay.values()).sort((a, b) => a.dayKey.localeCompare(b.dayKey));
}

function normalizePendingStore(value) {
  if (value?.current || value?.backlog) {
    return {
      current: normalizePendingEntry(value.current),
      backlog: mergeBacklogEntries(value.backlog),
    };
  }

  return {
    current: normalizePendingEntry(value),
    backlog: [],
  };
}

function getNextFlushTarget(store) {
  if (store.backlog.length > 0) {
    return {
      source: 'backlog',
      entry: store.backlog[0],
    };
  }

  if (hasPendingData(store.current)) {
    return {
      source: 'current',
      entry: store.current,
    };
  }

  return null;
}

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function round6(n) {
  return parseFloat(Number(n || 0).toFixed(6));
}

function getStorageKey(userId) {
  return `${AD_POOL_STORAGE_PREFIX}-${userId || 'guest'}`;
}

function readPending(userId) {
  if (typeof window === 'undefined') {
    return normalizePendingStore(null);
  }

  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (!raw) {
      return normalizePendingStore(null);
    }

    return normalizePendingStore(JSON.parse(raw));
  } catch (error) {
    console.error('Error leyendo acumulado local de anuncios:', error);
    return normalizePendingStore(null);
  }
}

function writePending(userId, data) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(data));
  } catch (error) {
    console.error('Error guardando acumulado local de anuncios:', error);
  }
}

function clearPending(userId) {
  writePending(userId, {
    current: createPendingEntry(getTodayKey()),
    backlog: [],
  });
}

export function adoptGuestPendingStore(userId) {
  if (!userId) return normalizePendingStore(null);

  const guestStore = ensureTodayPendingStore(null);
  const userStore = ensureTodayPendingStore(userId);

  const mergedStore = {
    current:
      guestStore.current.dayKey === userStore.current.dayKey
        ? createPendingEntry(
            userStore.current.dayKey,
            Number(userStore.current.views || 0) + Number(guestStore.current.views || 0),
            round6(Number(userStore.current.revenue || 0) + Number(guestStore.current.revenue || 0))
          )
        : userStore.current,
    backlog: mergeBacklogEntries([
      ...(userStore.backlog || []),
      ...(guestStore.backlog || []),
      guestStore.current.dayKey !== userStore.current.dayKey ? guestStore.current : null,
    ].filter(Boolean)),
  };

  writePending(userId, mergedStore);
  clearPending(null);
  return mergedStore;
}

function ensureTodayPendingStore(userId) {
  const pending = readPending(userId);
  const todayKey = getTodayKey();

  if (pending.current.dayKey !== todayKey) {
    const nextStore = {
      current: createPendingEntry(todayKey),
      backlog: mergeBacklogEntries(
        hasPendingData(pending.current)
          ? [...pending.backlog, pending.current]
          : pending.backlog
      ),
    };

    writePending(userId, nextStore);
    return nextStore;
  }

  return pending;
}

export function getPendingAdPoolData(userId) {
  return ensureTodayPendingStore(userId).current;
}

export function addLocalAdView({
  userId,
  revenuePerView = DEFAULT_REVENUE_PER_VIEW,
  count = 1,
}) {
  const pendingStore = ensureTodayPendingStore(userId);

  const nextCurrent = {
    dayKey: pendingStore.current.dayKey,
    views: Number(pendingStore.current.views || 0) + Number(count || 1),
    revenue: round6(
      Number(pendingStore.current.revenue || 0) +
        Number(revenuePerView || 0) * Number(count || 1)
    ),
  };

  writePending(userId, {
    ...pendingStore,
    current: nextCurrent,
  });

  return nextCurrent;
}

export function shouldFlushAdPool(
  userId,
  flushEveryViews = DEFAULT_FLUSH_EVERY_VIEWS
) {
  const pendingStore = ensureTodayPendingStore(userId);
  const nextTarget = getNextFlushTarget(pendingStore);

  if (!nextTarget) return false;
  if (nextTarget.source === 'backlog') return true;

  return Number(nextTarget.entry.views || 0) >= Number(
    flushEveryViews || DEFAULT_FLUSH_EVERY_VIEWS
  );
}

export async function flushAdViewsToSupabase({
  userId,
  playerPct = 1,
  force = false,
}) {
  const pendingStore = ensureTodayPendingStore(userId);
  const nextTarget = getNextFlushTarget(pendingStore);

  if (!nextTarget) {
    return {
      ok: true,
      skipped: true,
      flushedViews: 0,
      flushedRevenue: 0,
    };
  }

  if (
    !force &&
    nextTarget.source === 'current' &&
    Number(nextTarget.entry.views || 0) < DEFAULT_FLUSH_EVERY_VIEWS
  ) {
    return {
      ok: true,
      skipped: true,
      flushedViews: 0,
      flushedRevenue: 0,
    };
  }

  if (Number(nextTarget.entry.views || 0) <= 0) {
    return {
      ok: true,
      skipped: true,
      flushedViews: 0,
      flushedRevenue: 0,
    };
  }

  const { error } = await supabase.rpc('rpc_flush_ad_views', {
    p_day_key: nextTarget.entry.dayKey,
    p_views: Number(nextTarget.entry.views || 0),
    p_revenue_eur: round6(nextTarget.entry.revenue || 0),
    p_player_pct: Number(playerPct || 1),
  });

  if (error) {
    console.error('Error haciendo flush del pool de anuncios:', error);
    return {
      ok: false,
      skipped: false,
      error,
      flushedViews: 0,
      flushedRevenue: 0,
    };
  }

  const flushedViews = Number(nextTarget.entry.views || 0);
  const flushedRevenue = round6(nextTarget.entry.revenue || 0);

  if (nextTarget.source === 'backlog') {
    writePending(userId, {
      current: pendingStore.current,
      backlog: pendingStore.backlog.slice(1),
    });
  } else {
    writePending(userId, {
      current: createPendingEntry(getTodayKey()),
      backlog: pendingStore.backlog,
    });
  }

  return {
    ok: true,
    skipped: false,
    flushedViews,
    flushedRevenue,
  };
}

export async function flushAllAdViewsToSupabase({
  userId,
  playerPct = 1,
}) {
  let totalViews = 0;
  let totalRevenue = 0;
  let flushedAny = false;

  while (true) {
    const result = await flushAdViewsToSupabase({
      userId,
      playerPct,
      force: true,
    });

    if (!result.ok) {
      return {
        ok: false,
        error: result.error,
        flushedAny,
        flushedViews: totalViews,
        flushedRevenue: round6(totalRevenue),
      };
    }

    if (result.skipped) {
      return {
        ok: true,
        flushedAny,
        flushedViews: totalViews,
        flushedRevenue: round6(totalRevenue),
      };
    }

    flushedAny = true;
    totalViews += Number(result.flushedViews || 0);
    totalRevenue = round6(totalRevenue + Number(result.flushedRevenue || 0));
  }
}

export async function closeYesterdayAdPool() {
  const yesterdayKey = getYesterdayKey();

  const { error } = await supabase.rpc('rpc_close_ad_pool_day', {
    p_day_key: yesterdayKey,
  });

  if (error) {
    console.error('Error cerrando pool de ayer:', error);
    return {
      ok: false,
      error,
    };
  }

  return {
    ok: true,
    dayKey: yesterdayKey,
  };
}

export async function getMyAdIncomeSummary() {
  const { data, error } = await supabase.rpc('rpc_get_my_ad_income_summary');

  if (error) {
    console.error('Error leyendo resumen de ingresos de anuncios:', error);
    return {
      ok: false,
      error,
      summary: null,
    };
  }

  return {
    ok: true,
    error: null,
    summary: data || null,
  };
}

export async function getPublicAdPoolSummary() {
  const { data, error } = await supabase.rpc('rpc_get_public_ad_pool_summary');

  if (error) {
    console.error('Error leyendo resumen publico del pool de anuncios:', error);
    return {
      ok: false,
      error,
      summary: null,
    };
  }

  return {
    ok: true,
    error: null,
    summary: data || null,
  };
}

export async function getMyAdIncomeHistory(limit = 10) {
  const { data, error } = await supabase.rpc('rpc_get_my_ad_income_history', {
    p_limit: Number(limit || 10),
  });

  if (error) {
    console.error('Error leyendo historico de ingresos de anuncios:', error);
    return {
      ok: false,
      error,
      history: [],
    };
  }

  return {
    ok: true,
    error: null,
    history: Array.isArray(data) ? data : [],
  };
}

export function bindAdPoolAutoFlush({
  userId,
  getPlayerPct,
}) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let flushing = false;

  const flushNow = async () => {
    if (flushing) return;
    flushing = true;

    try {
      await flushAdViewsToSupabase({
        userId,
        playerPct: typeof getPlayerPct === 'function' ? getPlayerPct() : 1,
        force: true,
      });
    } finally {
      flushing = false;
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      flushNow();
    }
  };

  const handlePageHide = () => {
    flushNow();
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('pagehide', handlePageHide);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('pagehide', handlePageHide);
  };
}

