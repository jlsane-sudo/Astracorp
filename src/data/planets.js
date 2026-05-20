export const STARTER_PLANET_ID = 'nexus-prime';

export const DEFAULT_PLANET_EFFECTS = {
  workCreditsMult: 1,
  workXpMult: 1,
  workDurationMult: 1,
  companyRateMult: 1,
  companyStorageMult: 1,
  contractRewardMult: 1,
  researchTimeMult: 1,
  adRewardCreditsMult: 1,
  adRewardEnergyMult: 1,
  conquestPowerMult: 1,
  territoryThreatMult: 1,
  marketSellMult: 1,
  resourceRateMult: {},
  resourceMarketSellMult: {},
};

export const PLANETS = [
  {
    id: 'nexus-prime',
    name: 'Nexus Prime',
    subtitle: 'Exportacion basica',
    description: 'Primer planeta centrado en agua, electricidad y mineral para financiar el primer pasaje.',
    colorA: '#55d8ff',
    colorB: '#153b67',
    perks: ['Agua abundante', 'Electricidad estable', 'Mineral accesible'],
    travelCost: 0,
    unlock: {
      level: 1,
      credits: 0,
      companies: 0,
      contracts: 0,
      territories: 0,
      researchTotal: 0,
    },
    effects: {
      ...DEFAULT_PLANET_EFFECTS,
    },
  },
  {
    id: 'veyron',
    name: 'Veyron',
    subtitle: 'Escasez hidrica',
    description: 'Capital comercial con fuerte dependencia de importaciones basicas, especialmente agua.',
    colorA: '#ffd36a',
    colorB: '#6e4b00',
    perks: ['Agua muy escasa', '+18% venta de agua', '+10% contratos'],
    travelCost: 12500,
    travelResources: [
      { key: 'water', amount: 500 },
      { key: 'energy_cells', amount: 300 },
      { key: 'mineral', amount: 250 },
      { key: 'purified_water', amount: 80 },
    ],
    unlock: {
      level: 20,
      credits: 12500,
      companies: 9,
      contracts: 55,
      territoryContracts: 12,
      territories: 4,
      hqLevel: 18,
      researchTotal: 18,
    },
    effects: {
      ...DEFAULT_PLANET_EFFECTS,
      workCreditsMult: 1.04,
      companyRateMult: 0.94,
      contractRewardMult: 1.1,
      adRewardCreditsMult: 1.08,
      marketSellMult: 1.12,
      resourceRateMult: { water: 0.35, energy_cells: 0.75, mineral: 0.7 },
      resourceMarketSellMult: { water: 1.18, energy_cells: 1.08, mineral: 1.06 },
    },
  },
  {
    id: 'solara',
    name: 'Solara',
    subtitle: 'Escasez electrica',
    description: 'Planeta luminoso pero saturado: la red consume mas electricidad de la que produce.',
    colorA: '#81f7a2',
    colorB: '#123f24',
    perks: ['Electricidad escasa', '+18% venta de electricidad', '+12% almacenamiento'],
    travelCost: 1800,
    travelResources: [
      { key: 'purified_water', amount: 90 },
      { key: 'oxygen_tanks', amount: 20 },
    ],
    unlock: {
      level: 12,
      credits: 1800,
      companies: 10,
      contracts: 12,
      territoryContracts: 5,
      territories: 10,
      hqLevel: 8,
      researchTotal: 9,
    },
    effects: {
      ...DEFAULT_PLANET_EFFECTS,
      companyRateMult: 1.04,
      companyStorageMult: 1.12,
      researchTimeMult: 0.96,
      adRewardEnergyMult: 1.25,
      territoryThreatMult: 0.96,
      resourceRateMult: { water: 0.75, energy_cells: 0.34, mineral: 0.72 },
      resourceMarketSellMult: { water: 1.06, energy_cells: 1.18, mineral: 1.06 },
    },
  },
  {
    id: 'kryos',
    name: 'Kryos',
    subtitle: 'Escasez mineral',
    description: 'Mundo tecnologico con gran demanda de mineral y poca extraccion local.',
    colorA: '#a78bfa',
    colorB: '#26164f',
    perks: ['Mineral muy escaso', '+18% venta de mineral', '+14% XP en trabajos'],
    travelCost: 3200,
    travelResources: [
      { key: 'energy_cells', amount: 180 },
      { key: 'metal_components', amount: 90 },
      { key: 'alloy_frames', amount: 18 },
    ],
    unlock: {
      level: 13,
      credits: 3200,
      companies: 12,
      contracts: 16,
      territoryContracts: 7,
      territories: 11,
      hqLevel: 10,
      researchTotal: 12,
    },
    effects: {
      ...DEFAULT_PLANET_EFFECTS,
      workCreditsMult: 0.96,
      workXpMult: 1.14,
      workDurationMult: 0.97,
      companyRateMult: 0.95,
      contractRewardMult: 1.02,
      researchTimeMult: 0.82,
      conquestPowerMult: 0.98,
      marketSellMult: 0.95,
      resourceRateMult: { water: 0.72, energy_cells: 0.74, mineral: 0.32 },
      resourceMarketSellMult: { water: 1.06, energy_cells: 1.06, mineral: 1.18 },
    },
  },
  {
    id: 'aethon',
    name: 'Aethon',
    subtitle: 'Belico',
    description: 'Frontera dura donde la expansion y la presion militar marcan la economia.',
    colorA: '#f97316',
    colorB: '#47210d',
    perks: ['Agua y electricidad escasas', '+16% fuerza de conquista', '-8% amenaza territorial'],
    travelCost: 5600,
    travelResources: [
      { key: 'mineral', amount: 360 },
      { key: 'alloy_frames', amount: 36 },
    ],
    unlock: {
      level: 14,
      credits: 5600,
      companies: 14,
      contracts: 22,
      territoryContracts: 9,
      territories: 12,
      hqLevel: 13,
      researchTotal: 15,
    },
    effects: {
      ...DEFAULT_PLANET_EFFECTS,
      workXpMult: 1.04,
      companyRateMult: 0.98,
      contractRewardMult: 0.94,
      researchTimeMult: 1.02,
      conquestPowerMult: 1.16,
      territoryThreatMult: 0.92,
      resourceRateMult: { water: 0.36, energy_cells: 0.38, mineral: 0.78 },
      resourceMarketSellMult: { water: 1.16, energy_cells: 1.16, mineral: 1.04 },
    },
  },
  {
    id: 'noctis',
    name: 'Noctis',
    subtitle: 'Logistico',
    description: 'Corredor de rutas frias con cadenas de suministro muy eficientes.',
    colorA: '#93c5fd',
    colorB: '#172554',
    perks: ['Agua y mineral escasos', '-6% duracion de trabajos', '+10% almacenamiento'],
    travelCost: 9600,
    travelResources: [
      { key: 'metal_components', amount: 180 },
      { key: 'habitat_modules', amount: 20 },
    ],
    unlock: {
      level: 15,
      credits: 9600,
      companies: 16,
      contracts: 30,
      territoryContracts: 12,
      territories: 13,
      hqLevel: 16,
      researchTotal: 18,
    },
    effects: {
      ...DEFAULT_PLANET_EFFECTS,
      workXpMult: 1.02,
      workDurationMult: 0.94,
      companyRateMult: 1.02,
      companyStorageMult: 1.1,
      contractRewardMult: 1.06,
      marketSellMult: 1.03,
      resourceRateMult: { water: 0.34, energy_cells: 0.78, mineral: 0.38 },
      resourceMarketSellMult: { water: 1.16, energy_cells: 1.04, mineral: 1.16 },
    },
  },
  {
    id: 'thalassa',
    name: 'Thalassa',
    subtitle: 'Hidrica',
    description: 'Mundo de condensacion y refinado, muy fuerte para cadenas de soporte vital.',
    colorA: '#22d3ee',
    colorB: '#164e63',
    perks: ['Electricidad y mineral escasos', '-10% investigacion', '+8% contratos'],
    travelCost: 15200,
    travelResources: [
      { key: 'purified_water', amount: 280 },
      { key: 'oxygen_tanks', amount: 70 },
      { key: 'habitat_modules', amount: 28 },
    ],
    unlock: {
      level: 16,
      credits: 15200,
      companies: 18,
      contracts: 40,
      territoryContracts: 15,
      territories: 14,
      hqLevel: 20,
      researchTotal: 22,
    },
    effects: {
      ...DEFAULT_PLANET_EFFECTS,
      workXpMult: 1.06,
      workDurationMult: 0.98,
      companyRateMult: 1.08,
      companyStorageMult: 1.04,
      contractRewardMult: 1.08,
      researchTimeMult: 0.9,
      adRewardEnergyMult: 1.08,
      conquestPowerMult: 0.98,
      territoryThreatMult: 0.98,
      resourceRateMult: { water: 0.82, energy_cells: 0.36, mineral: 0.36 },
      resourceMarketSellMult: { water: 1.03, energy_cells: 1.16, mineral: 1.16 },
    },
  },
  {
    id: 'duskara',
    name: 'Duskara',
    subtitle: 'Mercado negro',
    description: 'Altos beneficios, presion territorial mayor y economia agresiva.',
    colorA: '#ff7b7b',
    colorB: '#4c1111',
    perks: ['Escasez general extrema', '+12% creditos por trabajo', '+10% riesgo territorial'],
    travelCost: 24000,
    travelResources: [
      { key: 'alloy_frames', amount: 110 },
      { key: 'habitat_modules', amount: 48 },
    ],
    unlock: {
      level: 18,
      credits: 24000,
      companies: 22,
      contracts: 55,
      territoryContracts: 20,
      territories: 16,
      hqLevel: 26,
      researchTotal: 28,
    },
    effects: {
      ...DEFAULT_PLANET_EFFECTS,
      workCreditsMult: 1.12,
      workDurationMult: 0.98,
      companyRateMult: 1.14,
      companyStorageMult: 0.96,
      contractRewardMult: 1.04,
      researchTimeMult: 1.04,
      adRewardCreditsMult: 1.05,
      conquestPowerMult: 1.08,
      territoryThreatMult: 1.1,
      marketSellMult: 1.06,
      resourceRateMult: { water: 0.42, energy_cells: 0.42, mineral: 0.42 },
      resourceMarketSellMult: { water: 1.14, energy_cells: 1.14, mineral: 1.14 },
    },
  },
];

export function getPlanetById(planetId) {
  return PLANETS.find((planet) => planet.id === planetId) || PLANETS[0];
}

export function getPlanetEffects(planetId) {
  return getPlanetById(planetId)?.effects || DEFAULT_PLANET_EFFECTS;
}

export function getPlanetProgress(save = {}) {
  const player = save?.player || {};
  const companies = Array.isArray(save?.companies) ? save.companies : [];
  const contractsDone = Number(save?.stats?.contracts ?? 0);
  const territoryContractsDone = Number(save?.stats?.territoryContracts ?? save?.stats?.territory_contracts ?? 0);
  const research = save?.research && typeof save.research === 'object' ? save.research : {};
  const hq = save?.hq && typeof save.hq === 'object' ? save.hq : {};
  const hqLevel = Object.values(hq).reduce((sum, value) => sum + Number(value ?? 0), 0);
  const researchTotal = Object.values(research).reduce(
    (sum, value) => sum + Number(value ?? 0),
    0
  );
  const territories = Array.isArray(save?.territories) ? save.territories : [];
  const ownedTerritories = territories.filter(
    (territory) => territory.controller === player.name
  ).length;

  return {
    level: Number(player.level ?? 1),
    credits: Number(player.credits ?? 0),
    companies: companies.length,
    contracts: contractsDone,
    territoryContracts: territoryContractsDone,
    territories: ownedTerritories,
    hqLevel,
    researchTotal,
  };
}

export function getPlanetUnlockStatus(planet, save = {}) {
  if (!planet) {
    return {
      unlocked: false,
      missing: [],
      progress: getPlanetProgress(save),
      requirements: {},
    };
  }

  const progress = getPlanetProgress(save);
  const requirements = planet.unlock || {};
  const missing = [];
  const missingAmount = (current, required) =>
    Math.max(0, Number(required ?? 0) - Number(current ?? 0));
  const unitLabel = (amount, singular, plural) =>
    `${amount.toLocaleString('es-ES')} ${amount === 1 ? singular : plural}`;

  if (progress.level < Number(requirements.level ?? 1)) {
    missing.push(unitLabel(missingAmount(progress.level, requirements.level), 'nivel', 'niveles'));
  }
  if (progress.credits < Number(requirements.credits ?? 0)) {
    missing.push(unitLabel(missingAmount(progress.credits, requirements.credits), 'credito', 'creditos'));
  }
  if (progress.companies < Number(requirements.companies ?? 0)) {
    missing.push(unitLabel(missingAmount(progress.companies, requirements.companies), 'empresa', 'empresas'));
  }
  if (progress.contracts < Number(requirements.contracts ?? 0)) {
    missing.push(unitLabel(missingAmount(progress.contracts, requirements.contracts), 'contrato', 'contratos'));
  }
  if (progress.territoryContracts < Number(requirements.territoryContracts ?? 0)) {
    missing.push(unitLabel(missingAmount(progress.territoryContracts, requirements.territoryContracts), 'contrato territorial', 'contratos territoriales'));
  }
  if (progress.territories < Number(requirements.territories ?? 0)) {
    missing.push(unitLabel(missingAmount(progress.territories, requirements.territories), 'territorio', 'territorios'));
  }
  if (progress.hqLevel < Number(requirements.hqLevel ?? 0)) {
    missing.push(unitLabel(missingAmount(progress.hqLevel, requirements.hqLevel), 'nivel de sede', 'niveles de sede'));
  }
  if (progress.researchTotal < Number(requirements.researchTotal ?? 0)) {
    missing.push(unitLabel(missingAmount(progress.researchTotal, requirements.researchTotal), 'nivel de investigacion', 'niveles de investigacion'));
  }

  return {
    unlocked: missing.length === 0,
    missing,
    progress,
    requirements,
  };
}



