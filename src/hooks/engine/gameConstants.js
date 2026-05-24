export const ENERGY_REGEN_MS        = 60_000;
export const ADS_TICK_MS            = 3_500;
export const MARKET_REFRESH_MS      = 5 * 60 * 1000;
export const EVENT_CYCLE_MS         = 24 * 60 * 60 * 1000;
export const EVENT_MIN_INTERVAL_MS  = 6 * 60 * 1000;
export const COMPANY_TICK_MS        = 10_000;
export const ACTIVE_JOB_TICK_MS     = 1_000;
export const TERRITORY_PRESSURE_MS       = 180_000; // 3 min por pulso territorial: mas tiempo real para reaccionar
export const TERRITORY_SIEGE_TICKS       = 6;       // Asedio largo antes de perder un sector
export const TERRITORY_THREAT_DECAY      = 2.6;     // La amenaza baja mejor si el sector no esta bajo presion
export const TERRITORY_THREAT_DECAY_CAP  = 70;      // Umbral amplio para que el mapa se estabilice
export const CONTRACT_REFRESH_MS    = 15_000;

export const TERRITORY_ATTACK_CREDIT_COST = 6;
export const TERRITORY_REINFORCE_COST = 10;
export const TERRITORY_SABOTAGE_COST  = 18;
export const TERRITORY_SPY_COST = 8;
export const TERRITORY_HACK_COST = 14;
export const TERRITORY_DEFENSE_RESPONSE_COST = 8;

export const ELECTION_UNLOCK_LEVEL = 4;
export const ELECTION_CREDIT_COST  = 12;

export const AD_POOL_REVENUE_PER_VIEW  = 0.00054;
export const AD_POOL_FLUSH_EVERY_VIEWS = 5;

export const CONTRACT_SLOTS = 3;

export const STORAGE_PREFIX           = 'astracorp-save-v1';
export const PENDING_ACCOUNT_SAVE_KEY = 'astracorp-pending-account-save-v1';

export const ACTION_ENERGY_COSTS = {
  setCurrentRegion:       2,
  buyItem:                1,
  sellItem:               1,
  deliverContract:        1,
  buildCompany:           4,
  collectCompany:         1,
  collectCompanyGroup:    1,
  claimRewardAd:          1,
  triggerWorkAdBoost:     1,
  triggerCompanyAdBoost:  1,
  triggerResearchAdBoost: 1,
  triggerHqAdBoost:       1,
  buyAdControlUpgrade:    2,
  reinforceTerritory:     6,
  sabotageTerritory:      10,
  spyTerritory:           4,
  hackTerritory:          8,
  territoryDefenseResponse: 5,
  doBattle:               6,
  startElection:          5,
  voteElection:           1,
};

export const JOB_DURATION_BY_LEVEL = {
  1: 45,
  2: 60,
  3: 85,
  4: 100,
  5: 480,
  6: 540,
  7: 600,
  8: 660,
  9: 720,
  10: 780,
};

export const DEFAULT_AD_BOOSTS = {
  companyBoostUntil:      null,
  companyBoostMultiplier: 1.5,
};

export const TUTORIAL_STEPS = [
  {
    id: 'work_once',
    title: 'Haz tu primer trabajo',
    desc: 'Empieza por trabajos manuales para reunir tus primeros creditos y algo de experiencia.',
    ctaLabel: 'Ir a Trabajos',
    ctaTab: 'work',
    reward: { credits: 1, xp: 6 },
  },
  {
    id: 'build_company',
    title: 'Construye tu captador de rocio',
    desc: 'Tu primer objetivo industrial es automatizar agua. Primero crea una base estable antes de tocar sistemas mas complejos.',
    ctaLabel: 'Abrir Empresas',
    ctaTab: 'business',
    reward: { credits: 2, xp: 10 },
  },
  {
    id: 'sell_once',
    title: 'Vende tu primer recurso',
    desc: 'Cuando tu primera empresa empiece a producir, usa el mercado para convertir produccion en creditos.',
    ctaLabel: 'Abrir Mercado',
    ctaTab: 'market',
    reward: { credits: 3, xp: 12 },
  },
  {
    id: 'level_two',
    title: 'Sube al nivel 2',
    desc: 'Con trabajo, empresa y mercado ya entendidos, sube un escalon antes de abrir otra capa.',
    ctaLabel: 'Seguir en Trabajos',
    ctaTab: 'work',
    reward: { credits: 2, xp: 10 },
  },
  {
    id: 'open_hq',
    title: 'Compra tu primera mejora de base',
    desc: 'La sede introduce decisiones estructurales. Abrela cuando ya tengas una economia minima funcionando.',
    ctaLabel: 'Abrir Sede',
    ctaTab: 'hq',
    reward: { credits: 3, xp: 14 },
  },
  {
    id: 'start_research',
    title: 'Activa tu primera investigacion',
    desc: 'Ahora ya toca pensar a medio plazo: una mejora pequena hoy te acelera el juego despues.',
    ctaLabel: 'Abrir Mejoras',
    ctaTab: 'research',
    reward: { credits: 4, xp: 16 },
  },
];

export const CONTRACT_TEMPLATES = [
  { key: 'water',             unlockLevel: 1,  minQty: 24, maxQty: 52, rewardMult: 1.42, baseXp: 42,  durationMin: 55, label: 'Suministro vital',               detail: 'La colonia necesita reservas basicas para seguir operando.',         targetTab: 'market' },
  { key: 'energy_cells',      unlockLevel: 2,  minQty: 24, maxQty: 50, rewardMult: 1.46, baseXp: 54,  durationMin: 58, label: 'Pulso electrico',                detail: 'Se ha pedido electricidad para estabilizar la red orbital.',         targetTab: 'market' },
  { key: 'mineral',           unlockLevel: 3,  minQty: 24, maxQty: 48, rewardMult: 1.50, baseXp: 68,  durationMin: 62, label: 'Carga de excavacion',             detail: 'Un convoy industrial quiere mineral bruto cuanto antes.',           targetTab: 'market' },
  { key: 'purified_water',    unlockLevel: 11, minQty: 16, maxQty: 30, rewardMult: 1.44, baseXp: 82,  durationMin: 30, label: 'Lote medico',                     detail: 'Se demanda agua purificada para modulos sensibles.',                targetTab: 'business' },
  { key: 'metal_components',  unlockLevel: 12, minQty: 18, maxQty: 34, rewardMult: 1.48, baseXp: 92,  durationMin: 32, label: 'Kit de mantenimiento',            detail: 'La infraestructura exterior necesita repuestos metalicos.',         targetTab: 'business' },
  { key: 'oxygen_tanks',      unlockLevel: 13, minQty: 12, maxQty: 24, rewardMult: 1.56, baseXp: 112, durationMin: 34, label: 'Respiracion profunda',           detail: 'Un habitat vecino necesita oxigeno de reserva.',                   targetTab: 'business' },
  { key: 'alloy_frames',      unlockLevel: 14, minQty: 10, maxQty: 20, rewardMult: 1.64, baseXp: 132, durationMin: 36, label: 'Estructura critica',              detail: 'Hay una ampliacion industrial pendiente de marcos de aleacion.',   targetTab: 'business' },
  { key: 'habitat_modules',   unlockLevel: 15, minQty: 7,  maxQty: 14, rewardMult: 1.78, baseXp: 152, durationMin: 40, label: 'Expansion habitacional',          detail: 'Un distrito quiere modulos completos para crecer.',                targetTab: 'business' },
  { key: 'water',             unlockLevel: 10, minQty: 44, maxQty: 82, rewardMult: 1.86, baseXp: 96,  durationMin: 52, label: 'Reserva seca de Veyron',          detail: 'Veyron compra agua de Nexus Prime porque sus fuentes son escasas.', targetTab: 'market', planetIds: ['veyron'] },
  { key: 'energy_cells',      unlockLevel: 10, minQty: 42, maxQty: 78, rewardMult: 1.78, baseXp: 94,  durationMin: 54, label: 'Red de arranque de Veyron',       detail: 'Veyron paga mejor por electricidad para nodos comerciales.',        targetTab: 'market', planetIds: ['veyron'] },
  { key: 'mineral',           unlockLevel: 10, minQty: 40, maxQty: 76, rewardMult: 1.74, baseXp: 92,  durationMin: 56, label: 'Carga estructural de Veyron',     detail: 'Las rutas financieras tambien necesitan mineral de primera etapa.', targetTab: 'market', planetIds: ['veyron'] },
  { key: 'energy_cells',      unlockLevel: 11, minQty: 52, maxQty: 96, rewardMult: 1.94, baseXp: 120, durationMin: 54, label: 'Bateria para Solara',            detail: 'Solara tiene demanda electrica irregular y compra excedentes.',     targetTab: 'market', planetIds: ['solara'] },
  { key: 'mineral',           unlockLevel: 12, minQty: 58, maxQty: 104,rewardMult: 2.02, baseXp: 132, durationMin: 58, label: 'Ensayo de laboratorio criogenico',detail: 'Kryos paga fuerte por mineral de precision.',                       targetTab: 'research', planetIds: ['kryos'] },
];
