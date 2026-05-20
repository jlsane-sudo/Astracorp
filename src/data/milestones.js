import { STARTER_PLANET_ID } from "./planets";

function getResearchTotal(save = {}) {
  return Object.values(save?.research || {}).reduce(
    (sum, value) => sum + Number(value ?? 0),
    0
  );
}

export const MILESTONE_DEFINITIONS = [
  {
    id: "first_work",
    icon: "🛠️",
    title: "Primer turno completado",
    detail: "Ya has entrado en el bucle basico de producir y cobrar.",
    tab: "work",
    reward: { credits: 4, xp: 12 },
    isUnlocked: (save) => Number(save?.stats?.works ?? 0) >= 1,
  },
  {
    id: "first_company",
    icon: "🏭",
    title: "Primera empresa operativa",
    detail: "Tu colonia empieza a producir aunque no estes trabajando a mano.",
    tab: "business",
    reward: { credits: 8, xp: 22 },
    isUnlocked: (save) => Array.isArray(save?.companies) && save.companies.length >= 1,
  },
  {
    id: "first_contract",
    icon: "📦",
    title: "Primer contrato entregado",
    detail: "Ya no solo produces: tambien colocas tu produccion donde mejor paga.",
    tab: "missions",
    reward: { credits: 10, xp: 20 },
    isUnlocked: (save) => Number(save?.stats?.contracts ?? 0) >= 1,
  },
  {
    id: "credits_100",
    icon: "💳",
    title: "Caja de 100 creditos",
    detail: "Empiezas a tener margen para decidir, no solo para sobrevivir.",
    tab: "market",
    reward: { credits: 12, xp: 18 },
    isUnlocked: (save) => Number(save?.player?.credits ?? 0) >= 100,
  },
  {
    id: "level_3",
    icon: "⭐",
    title: "Nivel 3 alcanzado",
    detail: "La colonia ya no esta en fase de arranque. Puedes abrir mas caminos.",
    tab: "work",
    reward: { credits: 0, xp: 35 },
    isUnlocked: (save) => Number(save?.player?.level ?? 1) >= 3,
  },
  {
    id: "advanced_industry",
    icon: "⚙️",
    title: "Industria avanzada desbloqueada",
    detail: "Has cruzado de produccion basica a cadenas que transforman valor.",
    tab: "business",
    reward: { credits: 14, xp: 28 },
    isUnlocked: (save) =>
      (Array.isArray(save?.companies) ? save.companies : []).some((company) => {
        const tier = Number(company?.tier ?? company?.meta?.tier ?? 1);
        return tier >= 2;
      }),
  },
  {
    id: "first_conquest",
    icon: "🛰️",
    title: "Primer sector conquistado",
    detail: "Tu colonia ya no solo produce: tambien proyecta poder territorial.",
    tab: "map",
    reward: { credits: 16, xp: 30 },
    isUnlocked: (save) => Number(save?.stats?.conquests ?? 0) >= 1,
  },
  {
    id: "research_started",
    icon: "🔬",
    title: "Primera linea de investigacion",
    detail: "Empiezas a convertir tiempo y recursos en ventajas permanentes.",
    tab: "research",
    reward: { credits: 6, xp: 16 },
    isUnlocked: (save) => getResearchTotal(save) >= 1 || Boolean(save?.researchProjects?.active),
  },
  {
    id: "new_planet",
    icon: "🪐",
    title: "Expansion interplanetaria",
    detail: "Cambiar de planeta ya forma parte de tu estrategia, no de un sueno lejano.",
    tab: "map",
    reward: { credits: 20, xp: 40 },
    isUnlocked: (save) =>
      (save?.player?.currentPlanet || save?.player?.planet || STARTER_PLANET_ID) !==
      STARTER_PLANET_ID,
  },
];

export function getUnlockedMilestones(save = {}) {
  const unlockedIds = new Set(save?.milestones?.unlockedIds || []);
  return MILESTONE_DEFINITIONS.filter((milestone) => unlockedIds.has(milestone.id));
}

export function getNextMilestones(save = {}, limit = 3) {
  const unlockedIds = new Set(save?.milestones?.unlockedIds || []);
  return MILESTONE_DEFINITIONS.filter((milestone) => !unlockedIds.has(milestone.id)).slice(
    0,
    limit
  );
}

export function findNextUnlockedMilestone(save = {}) {
  const unlockedIds = new Set(save?.milestones?.unlockedIds || []);
  return (
    MILESTONE_DEFINITIONS.find(
      (milestone) => !unlockedIds.has(milestone.id) && milestone.isUnlocked(save)
    ) || null
  );
}
