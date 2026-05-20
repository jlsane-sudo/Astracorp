const PROTOCOL_UNLOCK_LEVEL = 4;
const PROTOCOL_CREDIT_COST = 12;
const PROTOCOL_ENERGY_COST = 5;

export function PoliticsView({
  player,
  election,
  activeElections = [],
  activeElectionsLoading = false,
  territories = [],
  onStartElection,
  onVote,
  onClearResult,
  onRefreshActiveElections,
  onOpenTab,
  onSelectTerritory,
}) {
  const selectedTerritory = territories.find((t) => t.id === election?.territory);

  const secondsLeft =
    election?.active && election?.endsAt
      ? Math.max(0, Math.round((election.endsAt - Date.now()) / 1000))
      : 0;

  const controlledCount = territories.filter((t) => t.controller === player?.name).length;
  const credits = Number(player?.credits ?? 0);
  const energy = Number(player?.energy ?? 0);
  const level = Number(player?.level ?? 1);
  const canStartProtocol =
    !election?.active &&
    level >= PROTOCOL_UNLOCK_LEVEL &&
    credits >= PROTOCOL_CREDIT_COST &&
    energy >= PROTOCOL_ENERGY_COST;
  const canVote = Boolean(election?.active) && !election?.votes?.[player?.name] && energy >= 1;
  const disputedCount = territories.filter((t) => t.controller && t.controller !== player?.name).length;
  const openMapTerritory = (territory) => {
    onSelectTerritory?.(territory);
    onOpenTab?.("map");
  };

  return (
    <div style={styles.wrapper}>
      <div style={{ display: "grid", gap: 10, padding: 12, borderRadius: 10, background: "rgba(15,23,42,0.72)", border: "1px solid rgba(139,92,246,0.18)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={styles.kicker}>POLITICA REGIONAL</div>
            <div style={{ color: "#f8fafc", fontSize: 18, fontWeight: 900 }}>
              {election?.active ? `Protocolo activo - ${secondsLeft}s` : election?.winner ? `Resultado: ${election.winner}` : "Sin protocolo activo"}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 12 }}>
              {controlledCount} regiones tuyas - {disputedCount} disputadas - coste {PROTOCOL_CREDIT_COST} cr / {PROTOCOL_ENERGY_COST} EN
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={onRefreshActiveElections} disabled={activeElectionsLoading} style={{ ...styles.compactSecondary, ...(activeElectionsLoading ? styles.disabled : null) }}>
              {activeElectionsLoading ? "Actualizando" : "Online"}
            </button>
            {election?.winner && !election?.active && (
              <button type="button" onClick={onClearResult} style={styles.compactPrimary}>Cerrar resultado</button>
            )}
          </div>
        </div>

        {election?.active && (
          <div style={{ display: "grid", gap: 8, padding: 10, borderRadius: 9, background: "rgba(88,28,135,0.18)", border: "1px solid rgba(139,92,246,0.28)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(150px,1fr) auto auto", gap: 8, alignItems: "center" }}>
              <div>
                <strong style={{ color: "#f5f3ff" }}>{selectedTerritory?.name || "Region afectada"}</strong>
                <div style={{ color: "#c4b5fd", fontSize: 12 }}>
                  {player?.name && election?.votes?.[player.name] ? "Tu voto ya esta registrado" : "Voto pendiente"}
                </div>
              </div>
              <button type="button" onClick={() => selectedTerritory && openMapTerritory(selectedTerritory)} style={styles.compactSecondary}>Ver mapa</button>
              <strong style={{ color: "#f5f3ff" }}>{secondsLeft}s</strong>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {election.candidates?.map((candidate) => (
                <div key={candidate} style={{ display: "grid", gridTemplateColumns: "minmax(120px,1fr) auto", gap: 8, alignItems: "center", padding: 8, borderRadius: 8, background: "rgba(15,23,42,0.58)" }}>
                  <span style={{ color: "#f8fafc", fontWeight: 800 }}>{candidate}</span>
                  <button type="button" onClick={() => onVote(candidate)} disabled={!canVote} style={{ ...styles.compactPrimary, ...(!canVote ? styles.disabled : null) }}>
                    {election?.votes?.[player?.name] ? "Votado" : energy < 1 ? "Sin energia" : "Votar"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {territories.map((territory, index) => {
          const regionMeta = getRegionMeta(index);
          const isMine = territory.controller === player?.name;
          const isActive = Number(election?.territory) === Number(territory.id);
          const blockedReason = election?.active
            ? "Hay protocolo activo"
            : level < PROTOCOL_UNLOCK_LEVEL
              ? `Nivel ${PROTOCOL_UNLOCK_LEVEL}`
              : credits < PROTOCOL_CREDIT_COST
                ? "Faltan creditos"
                : energy < PROTOCOL_ENERGY_COST
                  ? "Falta energia"
                  : "";
          return (
            <div key={territory.id} style={{ display: "grid", gridTemplateColumns: "minmax(150px,1fr) 110px 120px minmax(160px,1fr) 190px", gap: 8, alignItems: "center", padding: 10, borderRadius: 10, background: isActive ? "rgba(88,28,135,0.20)" : "rgba(15,23,42,0.66)", border: isActive ? "1px solid rgba(139,92,246,0.32)" : "1px solid rgba(148,163,184,0.12)" }}>
              <div>
                <div style={{ color: territory.color || "#f8fafc", fontWeight: 900 }}>{regionMeta.icon} {territory.customName || territory.name}</div>
                <div style={{ color: "#94a3b8", fontSize: 11 }}>{regionMeta.kind}</div>
              </div>
              <div style={{ color: isMine ? "#bbf7d0" : "#cbd5e1", fontSize: 12, fontWeight: 800 }}>{isMine ? "Tuya" : territory.controller || "Libre"}</div>
              <div style={styles.territoryBonus}>{regionMeta.bonus}</div>
              <div style={{ color: "#cbd5e1", fontSize: 12 }}>
                {isActive ? "Protocolo activo aqui" : isMine ? "Buena para consolidar control" : "Puede cambiar de manos por votacion"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <button type="button" onClick={() => openMapTerritory(territory)} style={styles.compactSecondary}>Mapa</button>
                <button type="button" onClick={() => onStartElection(territory.id)} disabled={!canStartProtocol} title={blockedReason || "Convocar protocolo"} style={{ ...styles.compactPrimary, ...(!canStartProtocol ? styles.disabled : null) }}>
                  {blockedReason || "Convocar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <details style={{ padding: 10, borderRadius: 10, background: "rgba(15,23,42,0.58)", border: "1px solid rgba(148,163,184,0.12)" }}>
        <summary style={{ cursor: "pointer", color: "#f8fafc", fontWeight: 900 }}>Protocolos online y resultado</summary>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {activeElections.length === 0 ? (
            <div style={styles.emptyState}>{activeElectionsLoading ? "Cargando protocolos..." : "No hay protocolos online activos."}</div>
          ) : activeElections.map((item) => {
            const endsIn = item?.endsAt ? Math.max(0, Math.round((item.endsAt - Date.now()) / 1000)) : 0;
            return (
              <div key={item.id} style={styles.onlineRow}>
                <div>
                  <div style={styles.onlineTitle}>{item.territoryName || item.territory || "Sector"}</div>
                  <div style={styles.onlineMeta}>{item.candidates?.length || 0} candidatos - {Object.keys(item.votes || {}).length} votos</div>
                </div>
                <strong>{endsIn}s</strong>
              </div>
            );
          })}

          {!election?.active && election?.winner && (
            <div style={{ display: "grid", gap: 4 }}>
              <div style={styles.resultTitle}>Resultado local: {election.winner}</div>
              {Object.entries(election.counts || {}).map(([candidate, votes]) => (
                <div key={candidate} style={styles.infoRow}>
                  <span>{candidate}</span>
                  <strong>{votes} votos</strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  );

}

function getRegionMeta(index = 0) {
  const presets = [
    {
      icon: "Agua",
      kind: "Distrito de condensacion",
      bonus: "+10% agua",
    },
    {
      icon: "Mineral",
      kind: "Cuenca extractiva",
      bonus: "+10% mineral",
    },
    {
      icon: "Energia",
      kind: "Cresta energetica",
      bonus: "+10% energia",
    },
  ];

  return presets[index % presets.length];
}

const styles = {
  wrapper: {
    display: "grid",
    gap: 12,
  },

  kicker: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: "#22d3ee",
    fontWeight: "bold",
  },

  heroCard: {
    marginBottom: 4,
  },

  heroTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 8,
    color: "#f8fafc",
  },

  heroText: {
    color: "#cbd5e1",
    lineHeight: 1.7,
    fontSize: 14,
  },

  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },

  blockTitle: {
    fontWeight: "bold",
    marginBottom: 10,
    color: "#f8fafc",
    fontSize: 16,
  },

  blockText: {
    fontSize: 14,
    color: "#cbd5e1",
    lineHeight: 1.7,
    marginBottom: 12,
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },

  emptyState: {
    padding: "12px 0",
    color: "#94a3b8",
    fontSize: 14,
  },

  onlineList: {
    display: "grid",
    gap: 8,
  },

  onlineRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.025)",
    color: "#e2e8f0",
  },

  onlineTitle: {
    fontWeight: "bold",
    color: "#f8fafc",
  },

  onlineMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#94a3b8",
  },

  recommendation: {
    fontSize: 14,
    color: "#cbd5e1",
    lineHeight: 1.8,
  },

  infoRow: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: 12,
    alignItems: "center",
    padding: "6px 0",
    fontSize: 14,
    color: "#e2e8f0",
    lineHeight: 1.45,
  },

  territoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginTop: 8,
  },

  territoryCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 12,
  },

  territoryTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },

  territoryName: {
    fontWeight: "bold",
    fontSize: 15,
  },

  territoryType: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
  },

  territoryBonus: {
    fontSize: 11,
    fontWeight: "bold",
    padding: "4px 8px",
    borderRadius: 999,
    color: "#22d3ee",
    background: "rgba(34,211,238,0.08)",
    border: "1px solid rgba(34,211,238,0.16)",
    whiteSpace: "nowrap",
  },

  territoryInfo: {
    fontSize: 13,
    color: "#cbd5e1",
    marginTop: 10,
    lineHeight: 1.6,
  },

  activeCard: {
    marginTop: 4,
    borderColor: "#8b5cf644",
  },

  activeTitle: {
    fontWeight: "bold",
    color: "#8b5cf6",
    marginBottom: 10,
    fontSize: 16,
  },

  candidateList: {
    marginTop: 10,
    display: "grid",
    gap: 8,
  },

  candidateRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },

  resultCard: {
    marginTop: 4,
    borderColor: "#10b98144",
  },

  resultTitle: {
    fontWeight: "bold",
    color: "#10b981",
    marginBottom: 10,
    fontSize: 16,
  },

  voteCountList: {
    marginTop: 10,
    display: "grid",
    gap: 2,
  },
  compactPrimary: {
    minHeight: 32,
    padding: "7px 10px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(90deg,#8b5cf6,#06b6d4)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 900,
  },
  compactSecondary: {
    minHeight: 32,
    padding: "7px 10px",
    borderRadius: 8,
    border: "1px solid rgba(196,181,253,0.25)",
    background: "rgba(88,28,135,0.14)",
    color: "#ddd6fe",
    fontSize: 12,
    fontWeight: 900,
  },
  disabled: {
    opacity: 0.48,
    cursor: "not-allowed",
    filter: "grayscale(0.35)",
  },
};

export default PoliticsView;
