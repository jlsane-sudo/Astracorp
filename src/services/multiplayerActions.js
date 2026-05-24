import { supabase } from '../lib/supabase';

/**
 * multiplayerActions.js
 *
 * Capa puente para acciones multijugador.
 *
 * La idea correcta para online es que estas acciones se ejecuten en Supabase
 * mediante funciones RPC. Si las RPC todavia no existen en la base de datos,
 * devolvemos fallbackAllowed: true para que el juego pueda seguir funcionando
 * con la logica local mientras se instala el SQL multijugador.
 */

function isMissingRpcError(error) {
  const msg = String(error?.message || error?.details || error?.hint || '').toLowerCase();
  const code = String(error?.code || '').toLowerCase();
  return (
    code === '42883' ||
    msg.includes('could not find the function') ||
    msg.includes('function') && msg.includes('does not exist') ||
    msg.includes('schema cache')
  );
}

async function callRpc(functionName, params = {}) {
  try {
    const { data, error } = await supabase.rpc(functionName, params);

    if (error) {
      if (isMissingRpcError(error)) {
        return {
          ok: false,
          fallbackAllowed: true,
          error: `RPC ${functionName} no instalada. Se usa logica local temporal.`,
          rawError: error,
        };
      }

      return {
        ok: false,
        fallbackAllowed: false,
        error: error.message || `Error ejecutando ${functionName}.`,
        rawError: error,
      };
    }

    // Las funciones pueden devolver directamente { ok, saveData, ... }
    // o cualquier payload. Normalizamos lo basico.
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return { ok: data.ok !== false, ...data };
    }

    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      fallbackAllowed: true,
      error: err?.message || `No se pudo conectar con ${functionName}.`,
      rawError: err,
    };
  }
}

export async function buildCompanySecure({ companyTypeKey, regionKey, territoryId } = {}) {
  return callRpc('rpc_build_company_secure', {
    p_company_type_key: companyTypeKey,
    p_region_key: regionKey,
    p_territory_id: territoryId,
  });
}

export async function collectCompanySecure({ companyId } = {}) {
  return callRpc('rpc_collect_company_secure', {
    p_company_id: companyId === undefined || companyId === null ? null : String(companyId),
  });
}

export async function sellCompanySecure({ companyId } = {}) {
  return callRpc('rpc_sell_company_secure', {
    p_company_id: companyId === undefined || companyId === null ? null : String(companyId),
  });
}

export async function collectCompanyGroupSecure({ companyTypeKey, regionKey } = {}) {
  return callRpc('rpc_collect_company_group_secure', {
    p_company_type_key: companyTypeKey,
    p_region_key: regionKey,
  });
}

export async function collectAllCompaniesAdSecure() {
  return callRpc('rpc_collect_all_companies_ad_secure', {});
}

export async function attackTerritorySecure({ territoryId } = {}) {
  return callRpc('rpc_attack_territory_secure', {
    p_territory_id: territoryId,
  });
}

export async function reinforceTerritorySecure({ territoryId } = {}) {
  return callRpc('rpc_reinforce_territory_secure', {
    p_territory_id: territoryId,
  });
}

export async function sabotageTerritorySecure({ territoryId } = {}) {
  return callRpc('rpc_sabotage_territory_secure', {
    p_territory_id: territoryId,
  });
}

export async function buildTerritoryFortSecure({ territoryId } = {}) {
  return callRpc('rpc_build_territory_fort_secure', {
    p_territory_id: territoryId,
  });
}

export async function collectOccupationTaxesSecure({ territoryId } = {}) {
  return callRpc('rpc_collect_occupation_taxes_secure', {
    p_territory_id: territoryId,
  });
}

export async function getGlobalTerritoriesSecure() {
  return callRpc('rpc_get_global_territories', {});
}

export async function resetGameSecure() {
  return callRpc('rpc_reset_game_secure', {});
}

export async function getActiveElectionsSecure() {
  try {
    const { data, error } = await supabase
      .from('astracorp_elections')
      .select('id, territory_id, territory_name, candidates, votes, active, winner, counts, ends_at')
      .eq('active', true)
      .order('ends_at', { ascending: true });

    if (error) {
      return {
        ok: false,
        fallbackAllowed: false,
        error: error.message || 'No se pudieron cargar las elecciones activas.',
        rawError: error,
      };
    }

    const elections = (data || []).map((election) => ({
      id: election.id,
      active: Boolean(election.active),
      territory: election.territory_id,
      territoryName: election.territory_name,
      candidates: Array.isArray(election.candidates) ? election.candidates : [],
      votes: election.votes || {},
      endsAt: election.ends_at ? new Date(election.ends_at).getTime() : null,
      winner: election.winner,
      counts: election.counts || {},
    }));

    return { ok: true, elections };
  } catch (err) {
    return {
      ok: false,
      fallbackAllowed: true,
      error: err?.message || 'No se pudo conectar con elecciones activas.',
      rawError: err,
    };
  }
}

export async function getGlobalMarketSecure() {
  return callRpc('rpc_get_global_market', {});
}

export async function buyMarketItemSecure({ itemKey, qty } = {}) {
  return callRpc('rpc_buy_market_item_secure', {
    p_item_key: itemKey,
    p_qty: qty,
  });
}

export async function sellMarketItemSecure({ itemKey, qty } = {}) {
  return callRpc('rpc_sell_market_item_secure', {
    p_item_key: itemKey,
    p_qty: qty,
  });
}

export async function deliverContractSecure({ contractId } = {}) {
  return callRpc('rpc_deliver_contract_secure', {
    p_contract_id: contractId === undefined || contractId === null ? null : String(contractId),
  });
}

export async function claimMissionRewardSecure({ missionId } = {}) {
  return callRpc('rpc_claim_mission_reward_secure', {
    p_mission_id: missionId === undefined || missionId === null ? null : String(missionId),
  });
}
export async function startWorkSecure({ jobLabel } = {}) {
  return callRpc('rpc_start_work_secure', {
    p_job_label: jobLabel === undefined || jobLabel === null ? null : String(jobLabel),
  });
}

export async function completeWorkSecure() {
  return callRpc('rpc_complete_work_secure', {});
}

export async function boostWorkSecure() {
  return callRpc('rpc_boost_work_secure', {});
}
export async function startResearchSecure({ upgradeKey } = {}) {
  return callRpc('rpc_start_research_secure', {
    p_upgrade_key: upgradeKey === undefined || upgradeKey === null ? null : String(upgradeKey),
  });
}

export async function boostResearchSecure() {
  return callRpc('rpc_boost_research_secure', {});
}

export async function completeResearchSecure() {
  return callRpc('rpc_complete_research_secure', {});
}
export async function upgradeHqSecure({ upgradeKey } = {}) {
  return callRpc('rpc_upgrade_hq_secure', {
    p_upgrade_key: upgradeKey === undefined || upgradeKey === null ? null : String(upgradeKey),
  });
}

export async function repairIntegritySecure() {
  return callRpc('rpc_repair_integrity_secure', {});
}

export async function selectPlanetSecure({ planetId } = {}) {
  return callRpc('rpc_select_planet_secure', {
    p_planet_id: planetId === undefined || planetId === null ? null : String(planetId),
  });
}
export async function startElectionSecure({ territoryId } = {}) {
  return callRpc('rpc_start_election_secure', {
    p_territory_id: territoryId === undefined || territoryId === null ? null : String(territoryId),
  });
}

export async function voteElectionSecure({ candidate } = {}) {
  return callRpc('rpc_vote_election_secure', {
    p_candidate: candidate === undefined || candidate === null ? null : String(candidate),
  });
}

export async function resolveElectionSecure() {
  return callRpc('rpc_resolve_election_secure', {});
}


