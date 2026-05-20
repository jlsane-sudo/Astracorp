export const REGION_CHANGE_COST = 6;

export const STRATEGIC_DISTRICT_TYPES = {
  water: {
    id: "water",
    label: "Soporte vital",
    shortLabel: "Vital",
    color: "#22d3ee",
    effectsLabel: "+produccion hidrica - +estabilidad",
    productionBonus: 0.006,
    workCreditsBonus: 0,
    contractValueBonus: 0.02,
    defenseBonus: 4,
    threatReduction: 0.02,
    operationRewardBonus: 0.04,
  },
  energy: {
    id: "energy",
    label: "Energetico",
    shortLabel: "Energia",
    color: "#facc15",
    effectsLabel: "+electricidad - trabajos mas rapidos",
    productionBonus: 0.006,
    workDurationMult: 0.985,
    contractValueBonus: 0,
    defenseBonus: 2,
    threatReduction: 0,
    operationRewardBonus: 0.03,
  },
  industrial: {
    id: "industrial",
    label: "Industrial",
    shortLabel: "Industria",
    color: "#fb923c",
    effectsLabel: "+mineral/componentes - +SEC",
    productionBonus: 0.008,
    workCreditsBonus: 0.01,
    contractValueBonus: 0.015,
    defenseBonus: 3,
    threatReduction: 0,
    operationRewardBonus: 0.08,
  },
  logistics: {
    id: "logistics",
    label: "Logistico",
    shortLabel: "Logistica",
    color: "#60a5fa",
    effectsLabel: "+contratos - operaciones mas baratas",
    productionBonus: 0.004,
    workCreditsBonus: 0.008,
    contractValueBonus: 0.04,
    defenseBonus: 2,
    threatReduction: 0.01,
    operationRewardBonus: 0.06,
  },
  tech: {
    id: "tech",
    label: "Tecnologico",
    shortLabel: "Tecnologia",
    color: "#a78bfa",
    effectsLabel: "+INT/HK - mejor espionaje",
    productionBonus: 0.004,
    workCreditsBonus: 0,
    contractValueBonus: 0.01,
    defenseBonus: 5,
    threatReduction: 0.02,
    operationRewardBonus: 0.12,
  },
  political: {
    id: "political",
    label: "Politico",
    shortLabel: "Politica",
    color: "#34d399",
    effectsLabel: "+contratos - menos presion",
    productionBonus: 0.003,
    workCreditsBonus: 0.012,
    contractValueBonus: 0.05,
    defenseBonus: 4,
    threatReduction: 0.04,
    operationRewardBonus: 0.05,
  },
};

const REGION_STRATEGIC_TYPES = {
  "alpha-district": "water",
  "dust-basin": "industrial",
  "helix-ridge": "energy",
  "outer-condensers": "water",
  "central-hub": "political",
  "solar-spines": "energy",
  "crater-line": "industrial",
  "ion-fields": "tech",
  "glass-dunes": "industrial",
  "frost-quarries": "industrial",
  "bio-vaults": "water",
  "relay-crown": "logistics",
  "neon-flats": "energy",
  "iron-narrows": "industrial",
  "oasis-belt": "water",
  "pylon-reach": "energy",
  "ashen-gate": "industrial",
  "harbor-nine": "logistics",
};

export const REGIONS = {
  "alpha-district": {
    key: "alpha-district",
    territoryId: 0,
    name: "Alpha District",
    kind: "Distrito de condensacion",
    description:
      "Zona urbana optimizada para condensacion atmosferica y captacion hidrica. Muy buena para economias tempranas.",
    bonusResource: "water",
    bonusRate: 0.007,
    bonusLabel: "+0,7% agua",
    icon: "",
  },

  "dust-basin": {
    key: "dust-basin",
    territoryId: 1,
    name: "Dust Basin",
    kind: "Cuenca extractiva",
    description:
      "Region seca rica en vetas superficiales. Excelente para extraccion y escalado industrial.",
    bonusResource: "mineral",
    bonusRate: 0.004,
    bonusLabel: "+0,4% mineral",
    icon: "",
  },

  "helix-ridge": {
    key: "helix-ridge",
    territoryId: 2,
    name: "Helix Ridge",
    kind: "Cresta energetica",
    description:
      "Altiplanicie con buen rendimiento para captacion y estabilidad energetica. Muy util para sostener industria.",
    bonusResource: "energy_cells",
    bonusRate: 0.006,
    bonusLabel: "+0,6% electricidad",
    icon: "",
  },

  "outer-condensers": {
    key: "outer-condensers",
    territoryId: 3,
    name: "Outer Condensers",
    kind: "Anillo hidrico exterior",
    description:
      "Area periferica especializada en captacion hidrica y acumulacion de reservas basicas.",
    bonusResource: "water",
    bonusRate: 0.003,
    bonusLabel: "+0,3% agua",
    icon: "",
  },

  "central-hub": {
    key: "central-hub",
    territoryId: 4,
    name: "Central Hub",
    kind: "Nucleo administrativo",
    description:
      "Centro neuralgico del planeta. Coordina comercio y red electrica de la primera colonia.",
    bonusResource: "energy_cells",
    bonusRate: 0.005,
    bonusLabel: "+0,5% electricidad",
    icon: "",
  },

  "solar-spines": {
    key: "solar-spines",
    territoryId: 5,
    name: "Solar Spines",
    kind: "Espinas solares",
    description:
      "Cordillera expuesta a radiacion intensa. Muy favorable para produccion electrica.",
    bonusResource: "energy_cells",
    bonusRate: 0.009,
    bonusLabel: "+0,9% electricidad",
    icon: "",
  },

  "crater-line": {
    key: "crater-line",
    territoryId: 6,
    name: "Crater Line",
    kind: "Linea de crateres",
    description:
      "Franja geologica con depositos minerales accesibles para la expansion temprana.",
    bonusResource: "mineral",
    bonusRate: 0.002,
    bonusLabel: "+0,2% mineral",
    icon: "",
  },

  "ion-fields": {
    key: "ion-fields",
    territoryId: 7,
    name: "Ion Fields",
    kind: "Campos ionicos",
    description:
      "Llanura de tormentas suaves con alto rendimiento energetico. Interesante para industrias que consumen muchas celdas.",
    bonusResource: "energy_cells",
    bonusRate: 0.008,
    bonusLabel: "+0,8% electricidad",
    icon: "EN",
  },

  "glass-dunes": {
    key: "glass-dunes",
    territoryId: 8,
    name: "Glass Dunes",
    kind: "Dunas vitrificadas",
    description:
      "Zona abrasiva con mineral fragmentado y vetas superficiales de facil salida al mercado.",
    bonusResource: "mineral",
    bonusRate: 0.006,
    bonusLabel: "+0,6% mineral",
    icon: "CMP",
  },

  "frost-quarries": {
    key: "frost-quarries",
    territoryId: 9,
    name: "Frost Quarries",
    kind: "Canteras criogenicas",
    description:
      "Canteras frias con mineral denso y baja poblacion. Buen objetivo para expansion extractiva temprana.",
    bonusResource: "mineral",
    bonusRate: 0.005,
    bonusLabel: "+0,5% mineral",
    icon: "MIN",
  },

  "bio-vaults": {
    key: "bio-vaults",
    territoryId: 10,
    name: "Bio Vaults",
    kind: "Bovedas de soporte vital",
    description:
      "Complejo biologico usado para estabilizar agua y reservas de supervivencia de la colonia.",
    bonusResource: "water",
    bonusRate: 0.009,
    bonusLabel: "+0,9% agua",
    icon: "O2",
  },

  "relay-crown": {
    key: "relay-crown",
    territoryId: 11,
    name: "Relay Crown",
    kind: "Corona de retransmision",
    description:
      "Nodo elevado de comunicaciones y transporte. Refuerza la distribucion electrica temprana.",
    bonusResource: "energy_cells",
    bonusRate: 0.004,
    bonusLabel: "+0,4% electricidad",
    icon: "HAB",
  },

  "neon-flats": {
    key: "neon-flats",
    territoryId: 12,
    name: "Neon Flats",
    kind: "Llanuras de acumulacion",
    description:
      "Planicie cargada por tormentas suaves. Buen punto de apoyo para cadenas energeticas y reservas de emergencia.",
    bonusResource: "energy_cells",
    bonusRate: 0.007,
    bonusLabel: "+0,7% electricidad",
    icon: "EN",
  },

  "iron-narrows": {
    key: "iron-narrows",
    territoryId: 13,
    name: "Iron Narrows",
    kind: "Paso metalurgico",
    description:
      "Corredor estrecho lleno de vetas y talleres rivales. Produce mineral con buen margen.",
    bonusResource: "mineral",
    bonusRate: 0.008,
    bonusLabel: "+0,8% mineral",
    icon: "CMP",
  },

  "oasis-belt": {
    key: "oasis-belt",
    territoryId: 14,
    name: "Oasis Belt",
    kind: "Cinturon de condensacion",
    description:
      "Arco periferico con captacion hidrica estable. Es valioso para exportar agua sin depender del mercado.",
    bonusResource: "water",
    bonusRate: 0.006,
    bonusLabel: "+0,6% agua",
    icon: "PUR",
  },

  "pylon-reach": {
    key: "pylon-reach",
    territoryId: 15,
    name: "Pylon Reach",
    kind: "Bosque de pilones",
    description:
      "Red de torres energeticas expuestas. Mantenerla cuesta, pero compensa a colonias con industria electrificada.",
    bonusResource: "energy_cells",
    bonusRate: 0.01,
    bonusLabel: "+1% electricidad",
    icon: "EN",
  },

  "ashen-gate": {
    key: "ashen-gate",
    territoryId: 16,
    name: "Ashen Gate",
    kind: "Puerta de fundicion",
    description:
      "Frontera caliente con yacimientos expuestos. Ideal para mineral y expansion temprana.",
    bonusResource: "mineral",
    bonusRate: 0.003,
    bonusLabel: "+0,3% mineral",
    icon: "ALY",
  },

  "harbor-nine": {
    key: "harbor-nine",
    territoryId: 17,
    name: "Harbor Nine",
    kind: "Puerto orbital",
    description:
      "Nodo logistico cercano a elevadores de carga. Favorece exportaciones de electricidad.",
    bonusResource: "energy_cells",
    bonusRate: 0.005,
    bonusLabel: "+0,5% electricidad",
    icon: "HAB",
  },
};

export const REGION_LIST = Object.values(REGIONS);

const RESOURCE_LABELS = {
  water: "agua",
  energy_cells: "electricidad",
  mineral: "mineral",
  purified_water: "agua purificada",
  metal_components: "componentes metalicos",
  oxygen_tanks: "tanques de oxigeno",
  alloy_frames: "estructuras de aleacion",
  habitat_modules: "modulos de habitat",
};

const MAX_REGION_BONUS_RATE = 0.03;
const REGION_BONUS_SCALE = 1;

function normalizeRegionBonusRate(bonusRate) {
  return Math.min(MAX_REGION_BONUS_RATE, Math.max(0, Number(bonusRate ?? 0) * REGION_BONUS_SCALE));
}

const PLANET_REGION_OVERRIDES = {
  veyron: {
    "central-hub": { bonusResource: "metal_components", bonusRate: 0.006 },
    "dust-basin": { bonusResource: "mineral", bonusRate: 0.007 },
    "glass-dunes": { bonusResource: "metal_components", bonusRate: 0.009 },
    "relay-crown": { bonusResource: "habitat_modules", bonusRate: 0.004 },
    "harbor-nine": { bonusResource: "habitat_modules", bonusRate: 0.008 },
  },
  solara: {
    "helix-ridge": { bonusResource: "energy_cells", bonusRate: 0.008 },
    "outer-condensers": { bonusResource: "purified_water", bonusRate: 0.006 },
    "ion-fields": { bonusResource: "energy_cells", bonusRate: 0.009 },
    "neon-flats": { bonusResource: "energy_cells", bonusRate: 0.004 },
    "pylon-reach": { bonusResource: "energy_cells", bonusRate: 0.01 },
    "bio-vaults": { bonusResource: "oxygen_tanks", bonusRate: 0.005 },
  },
  kryos: {
    "central-hub": { bonusResource: "metal_components", bonusRate: 0.009 },
    "helix-ridge": { bonusResource: "energy_cells", bonusRate: 0.005 },
    "frost-quarries": { bonusResource: "mineral", bonusRate: 0.007 },
    "iron-narrows": { bonusResource: "metal_components", bonusRate: 0.01 },
    "relay-crown": { bonusResource: "energy_cells", bonusRate: 0.006 },
  },
  aethon: {
    "solar-spines": { bonusResource: "oxygen_tanks", bonusRate: 0.008 },
    "crater-line": { bonusResource: "alloy_frames", bonusRate: 0.006 },
    "glass-dunes": { bonusResource: "metal_components", bonusRate: 0.004 },
    "frost-quarries": { bonusResource: "alloy_frames", bonusRate: 0.007 },
    "ashen-gate": { bonusResource: "alloy_frames", bonusRate: 0.01 },
  },
  noctis: {
    "central-hub": { bonusResource: "habitat_modules", bonusRate: 0.007 },
    "helix-ridge": { bonusResource: "energy_cells", bonusRate: 0.004 },
    "relay-crown": { bonusResource: "habitat_modules", bonusRate: 0.009 },
    "ion-fields": { bonusResource: "energy_cells", bonusRate: 0.006 },
    "harbor-nine": { bonusResource: "habitat_modules", bonusRate: 0.01 },
  },
  thalassa: {
    "alpha-district": { bonusResource: "water", bonusRate: 0.009 },
    "outer-condensers": { bonusResource: "purified_water", bonusRate: 0.007 },
    "oasis-belt": { bonusResource: "purified_water", bonusRate: 0.01 },
    "solar-spines": { bonusResource: "oxygen_tanks", bonusRate: 0.006 },
    "bio-vaults": { bonusResource: "purified_water", bonusRate: 0.008 },
  },
  duskara: {
    "dust-basin": { bonusResource: "mineral", bonusRate: 0.009 },
    "crater-line": { bonusResource: "alloy_frames", bonusRate: 0.006 },
    "central-hub": { bonusResource: "metal_components", bonusRate: 0.004 },
    "glass-dunes": { bonusResource: "metal_components", bonusRate: 0.008 },
    "frost-quarries": { bonusResource: "mineral", bonusRate: 0.01 },
  },
};

function formatBonusLabel(resourceKey, bonusRate) {
  const resourceLabel = RESOURCE_LABELS[resourceKey] || resourceKey || "recurso";
  return `+${(normalizeRegionBonusRate(bonusRate) * 100).toLocaleString("es-ES", { maximumFractionDigits: 1 })}% ${resourceLabel}`;
}

export function getRegion(regionKey) {
  return REGIONS[regionKey] || null;
}

export function getRegionEconomy(regionKey, planetId = "nexus-prime") {
  const baseRegion = getRegion(regionKey);
  if (!baseRegion) return null;
  const strategicType = REGION_STRATEGIC_TYPES[regionKey] || "industrial";
  const strategicProfile = STRATEGIC_DISTRICT_TYPES[strategicType] || STRATEGIC_DISTRICT_TYPES.industrial;

  const override = PLANET_REGION_OVERRIDES?.[planetId]?.[regionKey];
  if (!override) {
    const bonusRate = normalizeRegionBonusRate(baseRegion.bonusRate);
    return {
      ...baseRegion,
      strategicType,
      strategicProfile,
      bonusRate,
      bonusLabel: formatBonusLabel(baseRegion.bonusResource, baseRegion.bonusRate),
    };
  }

  const bonusResource = override.bonusResource || baseRegion.bonusResource;
  const rawBonusRate = Number(override.bonusRate ?? baseRegion.bonusRate ?? 0);
  const bonusRate = normalizeRegionBonusRate(rawBonusRate);

  return {
    ...baseRegion,
    ...override,
    strategicType,
    strategicProfile,
    bonusResource,
    bonusRate,
    bonusLabel: formatBonusLabel(bonusResource, rawBonusRate),
  };
}

export function getRegionByTerritoryId(territoryId) {
  return REGION_LIST.find((region) => region.territoryId === territoryId) || null;
}



