import { supabase } from '../lib/supabase';

function isMissingRpcError(error) {
  const msg = String(error?.message || error?.details || error?.hint || '').toLowerCase();
  const code = String(error?.code || '').toLowerCase();
  return (
    code === '42883' ||
    msg.includes('could not find the function') ||
    (msg.includes('function') && msg.includes('does not exist')) ||
    msg.includes('schema cache')
  );
}

export async function getPlayerRankingsSecure({ limit = 50 } = {}) {
  try {
    const { data, error } = await supabase.rpc('rpc_get_player_rankings', {
      p_limit: limit,
    });

    if (error) {
      return {
        ok: false,
        fallbackAllowed: isMissingRpcError(error),
        error: error.message || 'No se pudo cargar el ranking online.',
        rawError: error,
      };
    }

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return { ok: data.ok !== false, ...data };
    }

    return { ok: true, players: Array.isArray(data) ? data : [] };
  } catch (err) {
    return {
      ok: false,
      fallbackAllowed: true,
      error: err?.message || 'No se pudo conectar con el ranking online.',
      rawError: err,
    };
  }
}
