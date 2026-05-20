export const COMPANY_TYPES = {
  dew_collector: {
    key: "dew_collector",
    tier: 1,
    unlockLevel: 1,
    name: "Captador de rocio",
    description:
      "Recolecta humedad atmosferica y la convierte en agua utilizable. Es la base hidrica de toda colonia inicial.",
    buildCost: 12,
    resourceKey: "water",
    resourceLabel: "Agua",
    ratePerHour: 30,
    maxStorage: 180,
    icon: "H2O",
    inputs: [],
  },

  solar_panel: {
    key: "solar_panel",
    tier: 1,
    unlockLevel: 2,
    name: "Panel solar",
    description:
      "Convierte radiacion solar en electricidad comerciable. Fundamental para sostener la exportacion inicial.",
    buildCost: 35,
    resourceKey: "energy_cells",
    resourceLabel: "Electricidad",
    ratePerHour: 24,
    maxStorage: 150,
    icon: "EN",
    inputs: [],
  },

  surface_mine: {
    key: "surface_mine",
    tier: 1,
    unlockLevel: 3,
    name: "Mina de superficie",
    description:
      "Extrae mineral bruto de la corteza del planeta. Recurso clave para expansion y procesado industrial.",
    buildCost: 70,
    resourceKey: "mineral",
    resourceLabel: "Mineral",
    ratePerHour: 18,
    maxStorage: 120,
    icon: "MIN",
    inputs: [],
  },

  water_purifier: {
    key: "water_purifier",
    tier: 2,
    unlockLevel: 11,
    name: "Planta de purificacion",
    description:
      "Transforma agua basica en agua purificada usando electricidad. Primer paso real de industria procesada.",
    buildCost: 152,
    resourceKey: "purified_water",
    resourceLabel: "Agua purificada",
    ratePerHour: 5.8,
    maxStorage: 40,
    icon: "PUR",
    inputs: [
      { key: "water", label: "Agua", amount: 2 },
      { key: "energy_cells", label: "Electricidad", amount: 1 },
    ],
  },

  smelter: {
    key: "smelter",
    tier: 2,
    unlockLevel: 12,
    name: "Fundicion",
    description:
      "Refina mineral bruto y lo convierte en componentes metalicos con apoyo electrico.",
    buildCost: 210,
    resourceKey: "metal_components",
    resourceLabel: "Componentes metalicos",
    ratePerHour: 4.8,
    maxStorage: 36,
    icon: "CMP",
    inputs: [
      { key: "mineral", label: "Mineral", amount: 2 },
      { key: "energy_cells", label: "Electricidad", amount: 1 },
    ],
  },

  electrolysis_plant: {
    key: "electrolysis_plant",
    tier: 3,
    unlockLevel: 13,
    name: "Planta de electrolisis",
    description:
      "Separa agua purificada mediante electricidad intensiva y genera tanques de oxigeno listos para uso industrial.",
    buildCost: 420,
    resourceKey: "oxygen_tanks",
    resourceLabel: "Tanques de oxigeno",
    ratePerHour: 2.8,
    maxStorage: 24,
    icon: "O2",
    inputs: [
      { key: "purified_water", label: "Agua purificada", amount: 2 },
      { key: "energy_cells", label: "Electricidad", amount: 2 },
    ],
  },

  industrial_forge: {
    key: "industrial_forge",
    tier: 3,
    unlockLevel: 14,
    name: "Forja industrial",
    description:
      "Combina metal procesado, mineral y electricidad para fabricar estructuras resistentes de aleacion.",
    buildCost: 520,
    resourceKey: "alloy_frames",
    resourceLabel: "Estructuras de aleacion",
    ratePerHour: 2.4,
    maxStorage: 22,
    icon: "ALY",
    inputs: [
      { key: "metal_components", label: "Componentes metalicos", amount: 2 },
      { key: "mineral", label: "Mineral", amount: 1 },
      { key: "energy_cells", label: "Electricidad", amount: 2 },
    ],
  },

  habitat_factory: {
    key: "habitat_factory",
    tier: 3,
    unlockLevel: 15,
    name: "Fabrica de habitats",
    description:
      "Integra oxigeno, aleaciones y agua purificada para ensamblar modulos de habitat de alto valor.",
    buildCost: 760,
    resourceKey: "habitat_modules",
    resourceLabel: "Modulos de habitat",
    ratePerHour: 1.4,
    maxStorage: 14,
    icon: "HAB",
    inputs: [
      { key: "oxygen_tanks", label: "Tanques de oxigeno", amount: 1 },
      { key: "alloy_frames", label: "Estructuras de aleacion", amount: 1 },
      { key: "purified_water", label: "Agua purificada", amount: 1 },
    ],
  },

  research_lab: {
    key: "research_lab",
    tier: 3,
    unlockLevel: 12,
    name: "Laboratorio orbital",
    description:
      "Centro de soporte cientifico que no fabrica recursos comerciales, pero recorta de forma permanente los tiempos de investigacion.",
    buildCost: 620,
    resourceKey: "research_support",
    resourceLabel: "Soporte cientifico",
    ratePerHour: 0,
    maxStorage: 0,
    icon: "LAB",
    inputs: [],
    supportEffect: "Cada laboratorio acelera un 10% las investigaciones futuras hasta un limite seguro.",
  },
};

export const COMPANY_TYPE_LIST = Object.values(COMPANY_TYPES);

export function getCompanyBuildCost(typeKey, ownedCount = 0) {
  const meta = COMPANY_TYPES[typeKey];
  if (!meta) return 0;

  const baseCost = Number(meta.buildCost ?? 0);
  const safeOwnedCount = Math.max(0, Number(ownedCount ?? 0));
  const scaledCost = baseCost * Math.pow(1.35, safeOwnedCount);

  return Math.max(baseCost, Math.round(scaledCost));
}

export function getCompanyType(typeKey) {
  return COMPANY_TYPES[typeKey] || null;
}

export function getCompanyTierList(tier) {
  return COMPANY_TYPE_LIST.filter((c) => c.tier === tier);
}
