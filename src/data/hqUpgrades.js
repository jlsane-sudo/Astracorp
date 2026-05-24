export const HQ_UPGRADES = {
  logistics_center: {
    key: 'logistics_center',
    icon: 'LOG',
    name: 'Centro logistico',
    desc: 'Amplia almacenes y mejora la organizacion de tus empresas.',
    maxLevel: 5,
    baseCost: 32,
    effectLabel: (level) => `+${level * 10}% almacenamiento empresarial`,
  },
  trade_desk: {
    key: 'trade_desk',
    icon: 'MRK',
    name: 'Departamento comercial',
    desc: 'Negocia mejores precios de salida en el mercado orbital.',
    maxLevel: 5,
    baseCost: 36,
    effectLabel: (level) => `+${level * 5}% venta en mercado`,
  },
  operations_room: {
    key: 'operations_room',
    icon: 'OPS',
    name: 'Sala de operaciones',
    desc: 'Reduce friccion operativa y el gasto energetico de acciones clave.',
    maxLevel: 5,
    baseCost: 40,
    effectLabel: (level) => `-${level * 4}% coste energetico`,
  },
  defense_office: {
    key: 'defense_office',
    icon: 'DEF',
    name: 'Oficina defensiva',
    desc: 'Refuerza administracion territorial y baja la presion hostil.',
    maxLevel: 5,
    baseCost: 40,
    effectLabel: (level) => `-${level * 5}% presion territorial`,
  },
  war_room: {
    key: 'war_room',
    icon: 'WAR',
    name: 'Sala tactica',
    desc: 'Mejora la preparacion militar para conquistar sectores.',
    maxLevel: 5,
    baseCost: 44,
    effectLabel: (level) => `+${level * 5}% potencia de conquista`,
  },
};

export const HQ_UPGRADE_LIST = Object.values(HQ_UPGRADES);

export const createInitialHq = () =>
  HQ_UPGRADE_LIST.reduce((acc, upgrade) => {
    acc[upgrade.key] = 0;
    return acc;
  }, {});

const HQ_RESOURCE_COSTS = {
  logistics_center: {
    primary: 'mineral',
    secondary: 'metal_components',
    advanced: 'alloy_frames',
    elite: 'habitat_modules',
  },
  trade_desk: {
    primary: 'water',
    secondary: 'energy_cells',
    advanced: 'metal_components',
    elite: 'habitat_modules',
  },
  operations_room: {
    primary: 'energy_cells',
    secondary: 'metal_components',
    advanced: 'alloy_frames',
    elite: 'oxygen_tanks',
  },
  defense_office: {
    primary: 'mineral',
    secondary: 'metal_components',
    advanced: 'alloy_frames',
    elite: 'oxygen_tanks',
  },
  war_room: {
    primary: 'mineral',
    secondary: 'metal_components',
    advanced: 'alloy_frames',
    elite: 'habitat_modules',
  },
};

export const getHqUpgradeCost = (upgradeKey, level = 0) => {
  const upgrade = HQ_UPGRADES[upgradeKey];
  if (!upgrade) return { credits: 0, resources: [] };

  const safeLevel = Math.max(0, Number(level || 0));
  const nextLevel = safeLevel + 1;
  const baseCost = Number(upgrade.baseCost || 10);
  const credits = Math.round(baseCost * 1.45 * 2.8 ** safeLevel);
  const resourcePlan = HQ_RESOURCE_COSTS[upgradeKey] || HQ_RESOURCE_COSTS.logistics_center;
  const resources = [];

  if (nextLevel >= 2) {
    resources.push({ key: resourcePlan.primary, amount: Math.ceil(12 * 1.9 ** safeLevel) });
  }
  if (nextLevel >= 3) {
    resources.push({ key: resourcePlan.secondary, amount: Math.ceil(6 * 1.85 ** safeLevel) });
  }
  if (nextLevel >= 4) {
    resources.push({ key: resourcePlan.advanced, amount: Math.ceil(4 * 1.75 ** safeLevel) });
  }
  if (nextLevel >= 5) {
    resources.push({ key: resourcePlan.elite, amount: Math.ceil(6 * 1.7 ** (nextLevel - 5)) });
  }

  return { credits, resources };
};

export const getHqUpgradeTimeMin = (level = 0) => {
  const nextLevel = Math.max(1, Number(level || 0) + 1);
  return Math.ceil(3 * nextLevel ** 1.35);
};

export const getHqEffects = (hq = {}) => {
  const level = (key) => Math.max(0, Number(hq?.[key] ?? 0));

  return {
    companyStorageMult: 1 + level('logistics_center') * 0.1,
    marketSellMult: 1 + level('trade_desk') * 0.05,
    actionEnergyDiscount: Math.min(0.28, level('operations_room') * 0.04),
    territoryThreatMult: Math.max(0.75, 1 - level('defense_office') * 0.05),
    conquestPowerMult: 1 + level('war_room') * 0.05,
  };
};
