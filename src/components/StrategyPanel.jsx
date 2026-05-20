import { Card, Button } from "./ui";

const ROADMAP_STAGES = [
  {
    id: "stage-1",
    label: "Nivel 1-2",
    title: "Arrancar la colonia",
    description:
      "Trabaja, junta creditos y construye agua. En esta fase no hace falta abrir todos los sistemas.",
    goals: [
      { label: "Haz trabajos basicos", tab: "work" },
      { label: "Construye captador de rocio", tab: "business" },
      { label: "Sube al nivel 2", tab: "work" },
    ],
  },
  {
    id: "stage-2",
    label: "Nivel 3-4",
    title: "Estabilizar la base",
    description:
      "Completa agua, electricidad y mineral. Empieza a leer el mercado y prepara el pasaje orbital.",
    goals: [
      { label: "Añade panel solar", tab: "business" },
      { label: "Desbloquea mineral", tab: "work" },
      { label: "Haz tu primer intercambio util", tab: "market" },
    ],
  },
  {
    id: "stage-3",
    label: "Nivel 5-6",
    title: "Entrar en procesado",
    description:
      "A partir de aqui ya importa producir cadenas, no solo recursos base. Contratos y politica empiezan a tener sentido.",
    goals: [
      { label: "Construye purificacion o fundicion", tab: "business" },
      { label: "Empieza a cerrar contratos", tab: "missions" },
      { label: "Evalua politica regional", tab: "politics" },
    ],
  },
  {
    id: "stage-4",
    label: "Nivel 7+",
    title: "Especializar y escalar",
    description:
      "Con toda la base abierta, el juego acelera: optimiza regiones, cadenas avanzadas, mercado y poder politico.",
    goals: [
      { label: "Activa industria avanzada", tab: "business" },
      { label: "Busca la cadena mas rentable", tab: "market" },
      { label: "Domina regiones clave", tab: "map" },
    ],
  },
];

const styles = {
  card: {
    padding: 12,
    background: "linear-gradient(180deg, rgba(34,211,238,0.05) 0%, rgba(255,255,255,0.02) 100%)",
    border: "1px solid rgba(34,211,238,0.12)",
    boxShadow: "0 8px 22px rgba(2,6,23,0.16)",
  },
  header: {
    display: "grid",
    gap: 6,
    marginBottom: 10,
  },
  kicker: {
    fontSize: 10,
    fontWeight: 800,
    color: "#67e8f9",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 16,
    fontWeight: 900,
    color: "#f8fafc",
  },
  text: {
    fontSize: 12,
    lineHeight: 1.55,
    color: "#cbd5e1",
  },
  currentBox: {
    display: "grid",
    gap: 8,
    padding: 12,
    borderRadius: 14,
    background: "rgba(15,23,42,0.44)",
    border: "1px solid rgba(103,232,249,0.14)",
    marginBottom: 10,
  },
  currentLabel: {
    fontSize: 10,
    fontWeight: 800,
    color: "#67e8f9",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  currentTitle: {
    fontSize: 15,
    fontWeight: 800,
    color: "#f8fafc",
  },
  stageGrid: {
    display: "grid",
    gap: 8,
  },
  stageCard: {
    display: "grid",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  stageCardActive: {
    background: "linear-gradient(180deg, rgba(34,211,238,0.08), rgba(255,255,255,0.025))",
    border: "1px solid rgba(103,232,249,0.18)",
    boxShadow: "0 0 0 1px rgba(103,232,249,0.06) inset",
  },
  stageTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  stageLabel: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 0.45,
    textTransform: "uppercase",
    color: "#94a3b8",
  },
  stageName: {
    fontSize: 14,
    fontWeight: 800,
    color: "#f8fafc",
    marginTop: 2,
  },
  stageDesc: {
    fontSize: 12,
    color: "#cbd5e1",
    lineHeight: 1.5,
  },
  activeBadge: {
    padding: "5px 8px",
    borderRadius: 999,
    background: "rgba(103,232,249,0.12)",
    border: "1px solid rgba(103,232,249,0.22)",
    color: "#a5f3fc",
    fontSize: 10,
    fontWeight: 800,
    whiteSpace: "nowrap",
  },
  goals: {
    display: "grid",
    gap: 6,
  },
  goalButton: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
    width: "100%",
    padding: "8px 10px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.02)",
    color: "#dbe7f5",
    fontSize: 12,
    textAlign: "left",
  },
  hint: {
    padding: 10,
    borderRadius: 12,
    background: "rgba(245,158,11,0.08)",
    border: "1px solid rgba(245,158,11,0.18)",
    color: "#fde68a",
    fontSize: 12,
    lineHeight: 1.5,
    marginTop: 10,
  },
};

function getCurrentStageIndex(level = 1) {
  if (level <= 2) return 0;
  if (level <= 4) return 1;
  if (level <= 6) return 2;
  return 3;
}

function getLongTermHint(level = 1) {
  if (level <= 2) {
    return "No abras politica ni persigas contratos complejos todavia. El foco correcto es llegar a agua estable y nivel 2.";
  }
  if (level <= 4) {
    return "Ya puedes mirar mercado con mas intencion, pero tu prioridad sigue siendo estabilizar electricidad y mineral.";
  }
  if (level <= 6) {
    return "Este es el punto en que contratos y politica empiezan a tener sentido, pero solo si tu base productiva no se atasca.";
  }
  return "Ya tienes suficientes sistemas abiertos. A partir de aqui la clave es especializarte y decidir donde eres mas fuerte.";
}

function getPsychologyHint(save) {
  const territories = Array.isArray(save?.territories) ? save.territories : [];
  const playerName = save?.player?.name;
  const enemyFronts = territories.filter((territory) => territory.controller === playerName && territory.enemyCampaign).length;
  const ownCampaigns = territories.filter((territory) =>
    territory.controller !== playerName &&
    territory.campaign?.ownerName === playerName &&
    Number(territory.campaign?.progress ?? 0) > 0
  ).length;
  const contractsReady = (Array.isArray(save?.contracts) ? save.contracts : []).filter((contract) =>
    Number(save?.inventory?.[contract?.itemKey] ?? 0) >= Number(contract?.qty ?? 0)
  ).length;

  if (enemyFronts > 0) return "Modo mental recomendado: defensa tranquila. Limpia el frente y luego vuelve a crecer.";
  if (ownCampaigns > 0) return "Modo mental recomendado: cierre. Termina una campana empezada antes de abrir otra.";
  if (contractsReady > 0) return "Modo mental recomendado: recompensa rapida. Cobra pedidos listos para recuperar impulso.";
  return "Modo mental recomendado: una cosa cada vez. Elige una cadena, empujala y deja que el resto espere.";
}

export default function StrategyPanel({ save, onOpenTab }) {
  const playerLevel = Number(save?.player?.level ?? 1);
  const currentStageIndex = getCurrentStageIndex(playerLevel);
  const currentStage = ROADMAP_STAGES[currentStageIndex];

  return (
    <Card style={styles.card}>
      <div style={styles.header}>
        <div style={styles.kicker}>Hoja de ruta</div>
        <div style={styles.title}>Que toca despues</div>
        <div style={styles.text}>
          Esta guia te marca la etapa natural del juego segun tu nivel, para que no tengas que
          adivinar cuando conviene abrir cada sistema.
        </div>
      </div>

      <div style={styles.currentBox}>
        <div style={styles.currentLabel}>Etapa actual</div>
        <div style={styles.currentTitle}>
          {currentStage.label} · {currentStage.title}
        </div>
        <div style={styles.text}>{currentStage.description}</div>
      </div>

      <div style={styles.stageGrid}>
        {ROADMAP_STAGES.map((stage, index) => {
          const isActive = index === currentStageIndex;

          return (
            <div
              key={stage.id}
              style={{
                ...styles.stageCard,
                ...(isActive ? styles.stageCardActive : null),
              }}
            >
              <div style={styles.stageTop}>
                <div>
                  <div style={styles.stageLabel}>{stage.label}</div>
                  <div style={styles.stageName}>{stage.title}</div>
                </div>
                {isActive ? <div style={styles.activeBadge}>Ahora</div> : null}
              </div>

              <div style={styles.stageDesc}>{stage.description}</div>

              <div style={styles.goals}>
                {stage.goals.map((goal) => (
                  <button
                    key={goal.label}
                    type="button"
                    style={styles.goalButton}
                    onClick={() => goal.tab && onOpenTab?.(goal.tab)}
                  >
                    <span>{goal.label}</span>
                    <span>{goal.tab ? "Abrir" : ""}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.hint}>{getLongTermHint(playerLevel)}</div>
      <div style={styles.hint}>{getPsychologyHint(save)}</div>
    </Card>
  );
}
