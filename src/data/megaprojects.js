export const MEGAPROJECTS = [
  {
    id: 'orbital-elevator',
    title: 'Ascensor orbital',
    short: 'Convierte la colonia en puerto planetario.',
    phases: [
      {
        title: 'Cimientos de anclaje',
        credits: 60,
        ads: 1,
        resources: [
          { key: 'mineral', amount: 35 },
          { key: 'metal_components', amount: 12 },
        ],
        reward: { xp: 120, pct: 0.2 },
      },
      {
        title: 'Cable de carga',
        credits: 140,
        ads: 2,
        resources: [
          { key: 'alloy_frames', amount: 10 },
          { key: 'energy_cells', amount: 45 },
        ],
        reward: { xp: 220, pct: 0.4 },
      },
      {
        title: 'Plataforma comercial',
        credits: 280,
        ads: 3,
        resources: [
          { key: 'habitat_modules', amount: 8 },
          { key: 'oxygen_tanks', amount: 24 },
        ],
        reward: { xp: 420, pct: 0.8, credits: 120 },
      },
    ],
  },
  {
    id: 'terraforming-grid',
    title: 'Red de terraformacion',
    short: 'Da sentido a la produccion avanzada y estabiliza sectores.',
    phases: [
      {
        title: 'Pozos climaticos',
        credits: 80,
        ads: 1,
        resources: [
          { key: 'water', amount: 80 },
          { key: 'purified_water', amount: 18 },
        ],
        reward: { xp: 140 },
      },
      {
        title: 'Biosferas piloto',
        credits: 170,
        ads: 2,
        resources: [
          { key: 'oxygen_tanks', amount: 26 },
          { key: 'habitat_modules', amount: 6 },
        ],
        reward: { xp: 260, pct: 0.3 },
      },
      {
        title: 'Malla atmosferica',
        credits: 320,
        ads: 4,
        resources: [
          { key: 'energy_cells', amount: 90 },
          { key: 'alloy_frames', amount: 18 },
        ],
        reward: { xp: 520, credits: 160, pct: 1 },
      },
    ],
  },
  {
    id: 'trade-station',
    title: 'Estacion comercial',
    short: 'Abre un objetivo economico para contratos, mercado y Ads.',
    phases: [
      {
        title: 'Muelle de intercambio',
        credits: 50,
        ads: 1,
        resources: [
          { key: 'metal_components', amount: 16 },
          { key: 'energy_cells', amount: 30 },
        ],
        reward: { xp: 100, credits: 35 },
      },
      {
        title: 'Nucleo de subastas',
        credits: 130,
        ads: 2,
        resources: [
          { key: 'alloy_frames', amount: 12 },
          { key: 'purified_water', amount: 28 },
        ],
        reward: { xp: 240, pct: 0.5 },
      },
      {
        title: 'Bolsa interplanetaria',
        credits: 260,
        ads: 3,
        resources: [
          { key: 'habitat_modules', amount: 10 },
          { key: 'oxygen_tanks', amount: 30 },
        ],
        reward: { xp: 480, credits: 180, pct: 0.8 },
      },
    ],
  },
];

export const SPONSORSHIPS = [
  {
    id: 'orbital-investor',
    title: 'Inversor orbital',
    adsRequired: 3,
    rewardText: '+45 cr al megaproyecto activo',
  },
  {
    id: 'logistics-brand',
    title: 'Patrocinador logistico',
    adsRequired: 2,
    rewardText: '+10 min de produccion acelerada',
  },
  {
    id: 'frontier-media',
    title: 'Campana mediatica',
    adsRequired: 2,
    rewardText: 'Reduce presion territorial',
  },
];

export const createInitialMegaprojects = () => ({
  activeId: MEGAPROJECTS[0].id,
  completedIds: [],
  projects: Object.fromEntries(
    MEGAPROJECTS.map((project) => [
      project.id,
      {
        phase: 0,
        credits: 0,
        ads: 0,
        resources: {},
      },
    ])
  ),
});

export const createInitialSponsorships = (todayKey = '') => ({
  todayKey,
  progress: Object.fromEntries(SPONSORSHIPS.map((sponsor) => [sponsor.id, 0])),
  claimedIds: [],
});

export function getMegaprojectById(projectId) {
  return MEGAPROJECTS.find((project) => project.id === projectId) || MEGAPROJECTS[0];
}

export function getMegaprojectPhase(project, state) {
  const phaseIndex = Math.max(0, Number(state?.phase ?? 0));
  return project?.phases?.[phaseIndex] || null;
}

export function getMegaprojectProgress(project, state) {
  const phase = getMegaprojectPhase(project, state);
  if (!phase) return { pct: 100, missing: [] };
  const parts = [];
  parts.push(Math.min(1, Number(state?.credits ?? 0) / Math.max(1, Number(phase.credits ?? 0))));
  parts.push(Math.min(1, Number(state?.ads ?? 0) / Math.max(1, Number(phase.ads ?? 0))));
  (phase.resources || []).forEach((resource) => {
    parts.push(Math.min(1, Number(state?.resources?.[resource.key] ?? 0) / Math.max(1, Number(resource.amount ?? 0))));
  });
  const pct = parts.length ? parts.reduce((sum, value) => sum + value, 0) / parts.length * 100 : 100;
  return { pct: Math.max(0, Math.min(100, pct)) };
}
