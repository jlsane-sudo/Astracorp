export const ROLES = [
  {
    id: 'worker',
    icon: 'WRK',
    name: 'Trabajador',
    color: '#f59e0b',
    desc: 'Acepta trabajos locales y progresa con rapidez al inicio.',
  },
  {
    id: 'businessman',
    icon: 'BIZ',
    name: 'Empresario',
    color: '#10b981',
    desc: 'Construye empresas y convierte recursos en crecimiento estable.',
  },
  {
    id: 'fighter',
    icon: 'COM',
    name: 'Combatiente',
    color: '#ef4444',
    desc: 'Se orienta al conflicto y al control regional cuando la base ya es solida.',
  },
  {
    id: 'politician',
    icon: 'POL',
    name: 'Politico',
    color: '#8b5cf6',
    desc: 'Participa en protocolos y gobernanza regional.',
  },
];

export const NPC_PLAYERS = [
  { id: 'p1', name: 'Viktor Sokolov', avatar: 'RU', credits: 34.5, level: 5, online: true, territory: 2, pct: 45, strategy: 'agresivo', motive: 'abre frentes y castiga sectores debiles' },
  { id: 'p2', name: 'Maria Chen', avatar: 'CN', credits: 112.0, level: 8, online: true, territory: 4, pct: 100, strategy: 'mercado', motive: 'mueve precios y compra recursos clave' },
  { id: 'p3', name: 'Juan Reyes', avatar: 'MX', credits: 67.2, level: 6, online: false, territory: 4, pct: 12, strategy: 'contratos', motive: 'lanza pedidos directos y pactos regionales' },
  { id: 'p4', name: 'Lena Muller', avatar: 'DE', credits: 18.9, level: 3, online: true, territory: 1, pct: 7, strategy: 'estable', motive: 'crece lento y refuerza produccion base' },
  { id: 'p5', name: 'Ahmed Hassan', avatar: 'EG', credits: 29.1, level: 4, online: true, territory: 2, pct: 33, strategy: 'defensivo', motive: 'fortifica y presiona sectores disputados' },
  { id: 'p6', name: 'Sofia Rossi', avatar: 'IT', credits: 88.4, level: 7, online: false, territory: 0, pct: 88, strategy: 'industrial', motive: 'acumula recursos avanzados' },
  { id: 'p7', name: 'Carlos Lima', avatar: 'BR', credits: 9.2, level: 2, online: true, territory: 1, pct: 1, strategy: 'oportunista', motive: 'aprovecha caidas de precio' },
  { id: 'p8', name: 'Yuki Tanaka', avatar: 'JP', credits: 52.1, level: 6, online: true, territory: 5, pct: 55, strategy: 'publicidad', motive: 'compite por el reparto del pool' },
];

export const INIT_TERRITORIES = [
  { id: 0, name: 'Alpha District', x: 200, y: 70, color: '#22d3ee', bonus: 'agua', controller: null, population: 1200, gdp: 45000 },
  { id: 1, name: 'Dust Basin', x: 200, y: 290, color: '#f59e0b', bonus: 'mineral', controller: null, population: 2100, gdp: 72000 },
  { id: 2, name: 'Helix Ridge', x: 370, y: 180, color: '#a855f7', bonus: 'energia', controller: 'Alpha Corp', population: 900, gdp: 31000 },
  { id: 3, name: 'Outer Condensers', x: 50, y: 180, color: '#06b6d4', bonus: 'agua purificada', controller: 'Beta Force', population: 800, gdp: 28000 },
  { id: 4, name: 'Central Hub', x: 200, y: 180, color: '#8b5cf6', bonus: 'habitat', controller: 'Gamma Guild', population: 3500, gdp: 120000 },
  { id: 5, name: 'Solar Spines', x: 370, y: 310, color: '#facc15', bonus: 'oxigeno', controller: null, population: 1500, gdp: 55000 },
  { id: 6, name: 'Crater Line', x: 50, y: 310, color: '#94a3b8', bonus: 'aleacion', controller: null, population: 600, gdp: 22000 },
  { id: 7, name: 'Ion Fields', x: 520, y: 70, color: '#38bdf8', bonus: 'energia', controller: 'Viktor Sokolov', population: 1100, gdp: 48000 },
  { id: 8, name: 'Glass Dunes', x: 520, y: 180, color: '#fb7185', bonus: 'componentes', controller: null, population: 1700, gdp: 68000 },
  { id: 9, name: 'Frost Quarries', x: 520, y: 310, color: '#67e8f9', bonus: 'mineral', controller: 'Viktor Sokolov', population: 700, gdp: 26000 },
  { id: 10, name: 'Bio Vaults', x: 200, y: 420, color: '#34d399', bonus: 'soporte vital', controller: null, population: 1300, gdp: 61000 },
  { id: 11, name: 'Relay Crown', x: 370, y: 420, color: '#c084fc', bonus: 'logistica', controller: 'Maria Chen', population: 2300, gdp: 93000 },
  { id: 12, name: 'Neon Flats', x: 55, y: 70, color: '#2dd4bf', bonus: 'energia', controller: null, population: 980, gdp: 41000 },
  { id: 13, name: 'Iron Narrows', x: 665, y: 70, color: '#94a3b8', bonus: 'componentes', controller: 'Ahmed Hassan', population: 1450, gdp: 59000 },
  { id: 14, name: 'Oasis Belt', x: 55, y: 420, color: '#38bdf8', bonus: 'agua purificada', controller: null, population: 1750, gdp: 74000 },
  { id: 15, name: 'Pylon Reach', x: 665, y: 420, color: '#fbbf24', bonus: 'energia', controller: 'Yuki Tanaka', population: 1250, gdp: 53000 },
  { id: 16, name: 'Ashen Gate', x: 285, y: 520, color: '#fb923c', bonus: 'aleacion', controller: null, population: 760, gdp: 36000 },
  { id: 17, name: 'Harbor Nine', x: 455, y: 520, color: '#60a5fa', bonus: 'habitat', controller: 'Maria Chen', population: 2400, gdp: 98000 },
];

export const INIT_MARKET = {
  water: { name: 'Agua', icon: 'H2O', base: 2.2, price: 2.2, supply: 190, demand: 178 },
  energy_cells: { name: 'Electricidad', icon: 'ELE', base: 3.0, price: 3.0, supply: 160, demand: 174 },
  mineral: { name: 'Mineral', icon: 'MIN', base: 3.8, price: 3.8, supply: 144, demand: 158 },
  purified_water: { name: 'Agua purificada', icon: 'PUR', base: 5.2, price: 5.2, supply: 92, demand: 122 },
  metal_components: { name: 'Componentes metalicos', icon: 'CMP', base: 6.8, price: 6.8, supply: 84, demand: 118 },
  oxygen_tanks: { name: 'Tanques de oxigeno', icon: 'O2', base: 10.4, price: 10.4, supply: 62, demand: 112 },
  alloy_frames: { name: 'Estructuras de aleacion', icon: 'ALY', base: 13.2, price: 13.2, supply: 54, demand: 108 },
  habitat_modules: { name: 'Modulos de habitat', icon: 'HAB', base: 21.5, price: 21.5, supply: 34, demand: 96 },
};

export const INIT_MISSIONS = [
  { id: 'm1', icon: 'WRK', title: 'Primer turno completo', desc: 'Trabaja 2 veces', goal: 2, type: 'work', unlockLevel: 1, reward: { credits: 8, xp: 20 }, progress: 0, done: false },
  { id: 'm3', icon: 'BIZ', title: 'Infraestructura basica', desc: 'Construye tu primera empresa', goal: 1, type: 'company', unlockLevel: 2, reward: { credits: 12, xp: 50 }, progress: 0, done: false },
  { id: 'm4', icon: 'MKT', title: 'Primer lote de mercado', desc: 'Vende 10 productos', goal: 10, type: 'sell', unlockLevel: 1, reward: { credits: 18, xp: 80 }, progress: 0, done: false },
  { id: 'm5', icon: 'XP', title: 'Operador veterano', desc: 'Alcanza el nivel 4', goal: 4, type: 'level', unlockLevel: 4, reward: { credits: 7, xp: 42 }, progress: 0, done: false },
  { id: 'm2', icon: 'COM', title: 'Primer conflicto', desc: 'Participa en 2 batallas', goal: 2, type: 'battle', unlockLevel: 5, reward: { credits: 6, xp: 80 }, progress: 0, done: false },
  { id: 'm6a', icon: 'MAP', title: 'Primer dominio territorial', desc: 'Controla tu primer territorio', goal: 1, type: 'conquer', unlockLevel: 4, reward: { credits: 6, xp: 90, resources: [{ key: 'mineral', amount: 18 }, { key: 'water', amount: 10 }] }, progress: 0, done: false },
  { id: 'm6b', icon: 'FT', title: 'Blindaje de frontera', desc: 'Construye 2 fortines territoriales', goal: 2, type: 'build_fort', unlockLevel: 4, reward: { credits: 8, xp: 115, resources: [{ key: 'mineral', amount: 14 }] }, progress: 0, done: false },
  { id: 'm6c', icon: 'CTR', title: 'Mandato regional', desc: 'Completa 2 contratos territoriales', goal: 2, type: 'territory_contract', unlockLevel: 4, reward: { credits: 10, xp: 140, resources: [{ key: 'energy_cells', amount: 14 }] }, progress: 0, done: false },
  { id: 'm6d', icon: 'TAX', title: 'Derechos de ocupacion', desc: 'Cobra tasas de ocupacion 3 veces', goal: 3, type: 'collect_tax', unlockLevel: 4, reward: { credits: 10, xp: 125, resources: [{ key: 'energy_cells', amount: 14 }] }, progress: 0, done: false },
  { id: 'm6', icon: 'MAP', title: 'Expansion regional', desc: 'Conquista 4 territorios', goal: 4, type: 'conquer', unlockLevel: 6, reward: { credits: 14, xp: 180 }, progress: 0, done: false },
  { id: 'm7', icon: 'PCT', title: 'Presencia consolidada', desc: 'Llega al 50% de reparto', goal: 50, type: 'pct', unlockLevel: 7, reward: { credits: 10, xp: 130 }, progress: 0, done: false },
  { id: 'm8', icon: 'PAX', title: 'Pasaje casi listo', desc: 'Alcanza el nivel 9', goal: 9, type: 'level', unlockLevel: 9, reward: { credits: 120, xp: 120 }, progress: 0, done: false },
  { id: 'm9', icon: 'ORB', title: 'Billete orbital', desc: 'Alcanza el nivel 10', goal: 10, type: 'level', unlockLevel: 10, reward: { credits: 180, xp: 160 }, progress: 0, done: false },
];

export const RANDOM_EVENTS = [
  { icon: 'UP', title: 'Boom economico', desc: 'Los precios del mercado suben un tiempo.', color: '#10b981', effect: 'priceUp' },
  { icon: 'DN', title: 'Crisis financiera', desc: 'Los precios del mercado bajan temporalmente.', color: '#ef4444', effect: 'priceDown' },
  { icon: 'ELE', title: 'Sobrecarga electrica', desc: 'La electricidad disponible cae temporalmente.', color: '#f59e0b', effect: 'energyDrain' },
  { icon: 'H2O', title: 'Condensacion abundante', desc: 'Se detecta mas agua disponible en la atmosfera.', color: '#22d3ee', effect: 'freeWater' },
  { icon: 'LCK', title: 'Loteria orbital', desc: 'Puedes obtener un pequeno premio de creditos.', color: '#8b5cf6', effect: 'lottery' },
  { icon: 'SUB', title: 'Subsidio regional', desc: 'Se inyectan creditos en el sistema.', color: '#60a5fa', effect: 'subsidy' },
  { icon: 'ADS', title: 'Boom publicitario', desc: 'El pool publicitario crece temporalmente.', color: '#fbbf24', effect: 'adBoom' },
  { icon: 'BLK', title: 'Bloqueo logistico', desc: 'La oferta cae y los precios se tensan.', color: '#fb7185', effect: 'supplyShock' },
  { icon: 'REQ', title: 'Pico de demanda', desc: 'Las colonias rivales compran recursos industriales.', color: '#34d399', effect: 'demandSpike' },
  { icon: 'DMP', title: 'Liquidacion orbital', desc: 'Entra stock barato, pero vender paga peor.', color: '#93c5fd', effect: 'marketDump' },
];

export const NPC_MESSAGES = [
  ['Alguien vende agua a buen precio? H2O', 'Viktor Sokolov'],
  ['Mi produccion electrica ha mejorado este ciclo ELE', 'Maria Chen'],
  ['La region central se esta moviendo politicamente POL', 'Juan Reyes'],
  ['Busco trabajo en una mina o un panel solar WRK', 'Lena Muller'],
  ['Helix Ridge vuelve a estar disputada COM', 'Ahmed Hassan'],
  ['El mineral esta subiendo en el mercado MIN', 'Sofia Rossi'],
  ['Estoy ampliando infraestructura en Nexus Prime BIZ', 'Maria Chen'],
  ['Alguien quiere intercambiar electricidad por agua?', 'Carlos Lima'],
  ['La economia regional parece mas estable UP', 'Sofia Rossi'],
  ['El reparto publicitario sigue creciendo ADS', 'Yuki Tanaka'],
  ['Alpha District es buena zona para empezar H2O', 'Lena Muller'],
  ['Los componentes metalicos estan muy demandados CMP', 'Maria Chen'],
  ['La purificacion de agua deja mejor margen este ciclo PUR', 'Sofia Rossi'],
  ['Los tanques de oxigeno estan escasos en Solar Spines O2', 'Maria Chen'],
  ['Crater Line esta reforzando produccion de aleaciones ALY', 'Viktor Sokolov'],
  ['Central Hub paga bien por modulos de habitat HAB', 'Sofia Rossi'],
];

export const JOBS = [
  { label: 'Escaneo de rocio', icon: 'H2O', credits: 5.5, xp: 30, cost: 2, item: 'water', unlockLevel: 1, durationSec: 180, hd: 1, operationRewards: [{ key: 'intel_data', amount: 0.25 }] },
  { label: 'Mantenimiento solar', icon: 'ELE', credits: 8, xp: 36, cost: 3, item: 'energy_cells', unlockLevel: 2, durationSec: 240, hd: 2, operationRewards: [{ key: 'exploit_kits', amount: 0.2 }] },
  { label: 'Extraccion superficial', icon: 'MIN', credits: 11, xp: 44, cost: 4, item: 'mineral', unlockLevel: 3, durationSec: 300, hd: -2, operationRewards: [{ key: 'security_teams', amount: 0.2 }] },
  { label: 'Control de purificacion', icon: 'PUR', credits: 12.5, xp: 50, cost: 6, item: 'purified_water', unlockLevel: 11, durationSec: 780, hd: 2, operationRewards: [{ key: 'influence_cells', amount: 0.3 }] },
  { label: 'Mecanizado basico', icon: 'CMP', credits: 15.5, xp: 58, cost: 7, item: 'metal_components', unlockLevel: 12, durationSec: 840, hd: -2, operationRewards: [{ key: 'security_teams', amount: 0.35 }] },
  { label: 'Sintesis de oxigeno', icon: 'O2', credits: 19.5, xp: 68, cost: 9, item: 'oxygen_tanks', unlockLevel: 13, durationSec: 900, hd: 4, operationRewards: [{ key: 'intel_data', amount: 0.35 }] },
  { label: 'Forja estructural', icon: 'ALY', credits: 24, xp: 78, cost: 11, item: 'alloy_frames', unlockLevel: 14, durationSec: 960, hd: -4, operationRewards: [{ key: 'security_teams', amount: 0.5 }] },
  { label: 'Montaje de habitat', icon: 'HAB', credits: 32, xp: 96, cost: 14, item: 'habitat_modules', unlockLevel: 15, durationSec: 1080, hd: -2, operationRewards: [{ key: 'influence_cells', amount: 0.45 }, { key: 'intel_data', amount: 0.25 }] },
];

export const DEFAULT_PLAYER = {
  name: '',
  planet: null,
  credits: 0,
  energy: 50,
  maxEnergy: 100,
  xp: 0,
  level: 1,
  health: 100,
  pct: 1,
  currentRegion: 'alpha-district',
};

export const DEFAULT_INVENTORY = {
  water: 0,
  energy_cells: 0,
  mineral: 0,
  purified_water: 0,
  metal_components: 0,
  oxygen_tanks: 0,
  alloy_frames: 0,
  habitat_modules: 0,
  intel_data: 0,
  exploit_kits: 0,
  security_teams: 0,
  influence_cells: 0,
};

export const DEFAULT_STATS = {
  works: 0,
  battles: 0,
  conquests: 0,
  buys: 0,
  sells: 0,
  contracts: 0,
  adsViewedToday: 0,
  adsViewed: 0,
};

export const DEFAULT_CHAT = [
  {
    from: 'Maria Chen',
    msg: 'Bienvenido a Nexus Prime. El agua, la electricidad y el mineral mandan aqui. NSP',
    t: Date.now() - 120000,
    avatar: 'CN',
  },
  {
    from: 'Viktor Sokolov',
    msg: 'Si buscas crecer rapido, asegura primero tu produccion basica. CMP',
    t: Date.now() - 60000,
    avatar: 'RU',
  },
];



