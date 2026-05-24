export const RESEARCH_UPGRADES = [
  {
    key: 'field_tools',
    icon: '[]',
    title: 'Herramientas de campo',
    desc: 'Reduce la duracion base de los trabajos de campo.',
    maxLevel: 5,
    accent: '#38bdf8',
    targetTab: 'work',
    cost: {
      creditsBase: 34,
      creditsStep: 18,
      timeBaseMin: 4,
      timeStepMin: 2,
      resources: [{ key: 'mineral', base: 2, step: 1 }],
    },
  },
  {
    key: 'aux_batteries',
    icon: '[=]',
    title: 'Baterias auxiliares',
    desc: 'Aumenta la energia maxima de la colonia.',
    maxLevel: 4,
    accent: '#fbbf24',
    targetTab: 'ads',
    cost: {
      creditsBase: 42,
      creditsStep: 22,
      timeBaseMin: 5,
      timeStepMin: 3,
      resources: [{ key: 'energy_cells', base: 2, step: 1 }],
    },
  },
  {
    key: 'logistics',
    icon: '[#]',
    title: 'Logistica orbital',
    desc: 'Aumenta la capacidad de almacenamiento de las empresas.',
    maxLevel: 4,
    accent: '#10b981',
    targetTab: 'business',
    cost: {
      creditsBase: 54,
      creditsStep: 28,
      timeBaseMin: 6,
      timeStepMin: 3,
      resources: [{ key: 'metal_components', base: 1, step: 1 }],
    },
  },
  {
    key: 'automation',
    icon: '[*]',
    title: 'Automatizacion basal',
    desc: 'Incrementa la produccion por hora de las empresas.',
    maxLevel: 5,
    accent: '#60a5fa',
    targetTab: 'business',
    cost: {
      creditsBase: 64,
      creditsStep: 34,
      timeBaseMin: 7,
      timeStepMin: 4,
      resources: [
        { key: 'mineral', base: 3, step: 1 },
        { key: 'energy_cells', base: 2, step: 1 },
      ],
    },
  },
  {
    key: 'efficiency',
    icon: '[~]',
    title: 'Protocolos de eficiencia',
    desc: 'Reduce el gasto de energia en acciones clave.',
    maxLevel: 4,
    accent: '#22d3ee',
    targetTab: 'map',
    cost: {
      creditsBase: 48,
      creditsStep: 24,
      timeBaseMin: 6,
      timeStepMin: 3,
      resources: [{ key: 'purified_water', base: 2, step: 1 }],
    },
  },
  {
    key: 'ad_optimization',
    icon: '[+]',
    title: 'Optimizacion publicitaria',
    desc: 'Hace mas potentes los impulsos por anuncio y el reparto.',
    maxLevel: 4,
    accent: '#f472b6',
    targetTab: 'ads',
    cost: {
      creditsBase: 44,
      creditsStep: 26,
      timeBaseMin: 5,
      timeStepMin: 3,
      resources: [
        { key: 'energy_cells', base: 2, step: 1 },
        { key: 'water', base: 1, step: 1 },
      ],
    },
  },
  {
    key: 'frontier_doctrine',
    icon: '[>]',
    title: 'Doctrina de frontera',
    desc: 'Mejora la ofensiva y deja los territorios conquistados mas estables.',
    maxLevel: 4,
    accent: '#fb7185',
    targetTab: 'map',
    cost: {
      creditsBase: 58,
      creditsStep: 32,
      timeBaseMin: 7,
      timeStepMin: 4,
      resources: [
        { key: 'metal_components', base: 2, step: 1 },
        { key: 'mineral', base: 3, step: 1 },
      ],
    },
  },
  {
    key: 'defense_grid',
    icon: '[!]',
    title: 'Malla defensiva',
    desc: 'Reduce la amenaza y hace mucho mas eficaces los refuerzos.',
    maxLevel: 4,
    accent: '#2dd4bf',
    targetTab: 'map',
    cost: {
      creditsBase: 56,
      creditsStep: 30,
      timeBaseMin: 7,
      timeStepMin: 4,
      resources: [
        { key: 'energy_cells', base: 3, step: 1 },
        { key: 'purified_water', base: 2, step: 1 },
      ],
    },
  },
  {
    key: 'territorial_governance',
    icon: '[^]',
    title: 'Gobernanza territorial',
    desc: 'Aumenta el bonus economico de los sectores bien mantenidos.',
    maxLevel: 4,
    accent: '#a78bfa',
    targetTab: 'map',
    cost: {
      creditsBase: 68,
      creditsStep: 36,
      timeBaseMin: 8,
      timeStepMin: 5,
      resources: [
        { key: 'oxygen_tanks', base: 1, step: 1 },
        { key: 'alloy_frames', base: 1, step: 1 },
      ],
    },
  },
];

export const createInitialResearch = () =>
  Object.fromEntries(RESEARCH_UPGRADES.map((upgrade) => [upgrade.key, 0]));

export const normalizeResearch = (research) => {
  const incoming = research && typeof research === 'object' ? research : {};

  return Object.fromEntries(
    RESEARCH_UPGRADES.map((upgrade) => {
      const level = Number(incoming[upgrade.key] ?? 0);
      return [upgrade.key, Math.max(0, Math.min(upgrade.maxLevel, Math.floor(level)))];
    })
  );
};

export const getResearchLevel = (research, key) => Number(research?.[key] ?? 0);

export const getResearchUpgradeCost = (research, key) => {
  const upgrade = RESEARCH_UPGRADES.find((item) => item.key === key);
  if (!upgrade) return null;

  const level = getResearchLevel(research, key);
  const isMaxed = level >= upgrade.maxLevel;

  return {
    upgrade,
    level,
    isMaxed,
    credits: isMaxed
      ? 0
      : Math.ceil((upgrade.cost.creditsBase + upgrade.cost.creditsStep) * 1.8 * 2.2 ** level),
    timeMin: isMaxed
      ? 0
      : upgrade.cost.timeBaseMin + upgrade.cost.timeStepMin * level,
    resources: isMaxed
      ? []
      : (upgrade.cost.resources || []).map((resource) => ({
          key: resource.key,
          amount: Math.ceil((resource.base + resource.step) * 1.75 * 1.85 ** level),
        })),
  };
};

export const getResearchEffects = (research) => {
  const fieldToolsLevel = getResearchLevel(research, 'field_tools');
  const auxBatteriesLevel = getResearchLevel(research, 'aux_batteries');
  const logisticsLevel = getResearchLevel(research, 'logistics');
  const automationLevel = getResearchLevel(research, 'automation');
  const efficiencyLevel = getResearchLevel(research, 'efficiency');
  const adOptimizationLevel = getResearchLevel(research, 'ad_optimization');
  const frontierDoctrineLevel = getResearchLevel(research, 'frontier_doctrine');
  const defenseGridLevel = getResearchLevel(research, 'defense_grid');
  const territorialGovernanceLevel = getResearchLevel(research, 'territorial_governance');

  return {
    workDurationMult: Math.max(0.55, 1 - fieldToolsLevel * 0.08),
    maxEnergyBonus: auxBatteriesLevel * 12,
    companyStorageMult: 1 + logisticsLevel * 0.18,
    companyRateMult: 1 + automationLevel * 0.12,
    actionEnergyDiscount: Math.min(0.4, efficiencyLevel * 0.1),
    companyBoostMultiplier: 1.5 + adOptimizationLevel * 0.15,
    workAdRemainingFactor: Math.max(0.35, 0.6 - adOptimizationLevel * 0.05),
    adControlUpgradeBonus: 0.5 + adOptimizationLevel * 0.1,
    contractRewardMult: 1 + adOptimizationLevel * 0.08,
    territoryThreatMult: Math.max(0.62, 1 - defenseGridLevel * 0.08),
    territoryStabilityLossMult: Math.max(0.65, 1 - defenseGridLevel * 0.07),
    territoryFortificationDecayMult: Math.max(0.55, 1 - defenseGridLevel * 0.09),
    territoryReinforceStability: defenseGridLevel * 6,
    territoryReinforceThreatReduction: defenseGridLevel * 7,
    territoryReinforceFortification: defenseGridLevel * 6,
    conquestPowerMult: 1 + frontierDoctrineLevel * 0.14,
    conquestRewardMult: 1 + frontierDoctrineLevel * 0.08,
    conquestStarterStability: frontierDoctrineLevel * 4,
    conquestStarterFortification: frontierDoctrineLevel * 5,
    territoryControlBaseBonus: territorialGovernanceLevel * 0.035,
    territoryControlScalingBonus: territorialGovernanceLevel * 0.02,
  };
};
