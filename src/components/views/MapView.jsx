import React from "react";
import { useState } from "react";
import { theme } from "../../theme";
import { getRegionByTerritoryId, getRegionEconomy } from "../../data/regions";
import { getPlanetById } from "../../data/planets";
import { getResearchEffects } from "../../data/researchData";
import {
  ACTION_ENERGY_COSTS,
  TERRITORY_ATTACK_CREDIT_COST,
  TERRITORY_DEFENSE_RESPONSE_COST,
  TERRITORY_HACK_COST,
  TERRITORY_REINFORCE_COST,
  TERRITORY_SABOTAGE_COST,
  TERRITORY_SPY_COST,
} from "../../hooks/engine/gameConstants";
import {
  DEFENSE_ASSET_TYPES,
  TERRITORY_DEFENSE_RESPONSE_TYPES,
  getTerritoryDefenseProfile,
  getTerritoryOperationEtaMs,
  getTerritoryOperationProgress,
} from "../../hooks/engine/gamePureLogic";

const REINFORCE_COST = TERRITORY_REINFORCE_COST;
const SABOTAGE_COST = TERRITORY_SABOTAGE_COST;
const SPY_COST = TERRITORY_SPY_COST;
const HACK_COST = TERRITORY_HACK_COST;
const DEFENSE_RESPONSE_COST = TERRITORY_DEFENSE_RESPONSE_COST;
const ATTACK_ENERGY_COST = ACTION_ENERGY_COSTS.doBattle;
const SPY_ENERGY_COST = ACTION_ENERGY_COSTS.spyTerritory;
const HACK_ENERGY_COST = ACTION_ENERGY_COSTS.hackTerritory;
const DEFENSE_RESPONSE_ENERGY_COST = ACTION_ENERGY_COSTS.territoryDefenseResponse;
const ATTACK_CREDIT_COST = TERRITORY_ATTACK_CREDIT_COST;
const OPERATION_RESOURCE_COSTS = {
  conquest: [{ key: "security_teams", amount: 0.5 }, { key: "intel_data", amount: 0.25 }],
  sabotage: [{ key: "influence_cells", amount: 0.75 }, { key: "exploit_kits", amount: 0.35 }],
  spy: [{ key: "intel_data", amount: 0.5 }],
  hack: [{ key: "exploit_kits", amount: 0.75 }],
  defense: [{ key: "security_teams", amount: 0.5 }, { key: "intel_data", amount: 0.25 }],
};
const PROTOCOL_UNLOCK_LEVEL = 4;
const PROTOCOL_CREDIT_COST = 12;
const PROTOCOL_ENERGY_COST = 5;
const AD_REINFORCE_COOLDOWN_MS = 1000 * 60 * 3;
const HEX_RADIUS = 52;
const MAP_SHAPES = {
  12: { cx: 118, cy: 92 },
  0: { cx: 274, cy: 92 },
  2: { cx: 378, cy: 92 },
  7: { cx: 482, cy: 92 },
  13: { cx: 638, cy: 92 },
  3: { cx: 222, cy: 182 },
  4: { cx: 326, cy: 182 },
  5: { cx: 430, cy: 182 },
  8: { cx: 534, cy: 182 },
  6: { cx: 274, cy: 272 },
  1: { cx: 378, cy: 272 },
  9: { cx: 482, cy: 272 },
  14: { cx: 118, cy: 362 },
  10: { cx: 326, cy: 362 },
  11: { cx: 430, cy: 362 },
  15: { cx: 638, cy: 362 },
  16: { cx: 274, cy: 452 },
  17: { cx: 482, cy: 452 },
};

const MAP_LABELS = {
  0: "Alpha",
  1: "Dust",
  2: "Helix",
  3: "Outer",
  4: "Central",
  5: "Solar",
  6: "Crater",
  7: "Ion",
  8: "Glass",
  9: "Frost",
  10: "Bio",
  11: "Relay",
  12: "Neon",
  13: "Iron",
  14: "Oasis",
  15: "Pylon",
  16: "Ashen",
  17: "Harbor",
};

const MAP_RESOURCE_CODES = {
  water: "H2O",
  energy_cells: "EN",
  mineral: "MIN",
  purified_water: "PUR",
  metal_components: "CMP",
  oxygen_tanks: "O2",
  alloy_frames: "ALY",
  habitat_modules: "HAB",
};
const PLANET_MAP_NOTES = {
  "nexus-prime": {
    title: "Nexus Prime",
    detail: "Base estable para aprender, expandirte y levantar tu primera red industrial seria.",
    favored: "Mapa equilibrado - sin sectores extremos",
  },
  veyron: {
    title: "Veyron",
    detail: "Las rutas comerciales mandan. Las zonas mejor conectadas tienen mas valor economico.",
    favored: "Prioriza venta, contratos y flujo de creditos",
  },
  solara: {
    title: "Solara",
    detail: "Las regiones luminosas favorecen soporte vital, almacenamiento y crecimiento sostenido.",
    favored: "Ideal para agua refinada, energia y cadenas largas",
  },
  kryos: {
    title: "Kryos",
    detail: "Planeta de ciencia y prototipos. El mapa se siente mas tecnico y menos mercantil.",
    favored: "Brilla al empujar investigacion y soporte cientifico",
  },
  aethon: {
    title: "Aethon",
    detail: "Frontera caliente. Cada sector importa mas y la presion territorial se nota antes.",
    favored: "Mejor para expansion agresiva y control militar",
  },
  noctis: {
    title: "Noctis",
    detail: "Mundo logistico de nodos conectados. Los movimientos y el stock tienen mas peso.",
    favored: "Funciona muy bien con modulos y cadenas compactas",
  },
  thalassa: {
    title: "Thalassa",
    detail: "Planeta humedo con valor alto en soporte vital y produccion hidrica avanzada.",
    favored: "Muy fuerte para oxigeno, agua y refinado",
  },
  duskara: {
    title: "Duskara",
    detail: "Mercados duros, ganancias altas y mas friccion sobre el control territorial.",
    favored: "Rinde mejor con produccion agresiva y venta intensa",
  },
};

function createHexPath(cx, cy, radius = HEX_RADIUS) {
  const points = Array.from({ length: 6 }, (_, index) => {
    const angle = ((60 * index) - 30) * (Math.PI / 180);
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    return `${Math.round(x)} ${Math.round(y)}`;
  });

  return `M${points[0]} L${points.slice(1).join(' L')} Z`;
}

function pctStyle(value, mode = "good") {
  if (mode === "danger") {
    return value >= 75 ? "#f87171" : value >= 45 ? "#fbbf24" : "#4ade80";
  }

  return value >= 70 ? "#4ade80" : value >= 40 ? "#fbbf24" : "#f87171";
}

function MiniBar({ value, mode = "good" }) {
  return (
    <div style={styles.barTrack}>
      <div
        style={{
          ...styles.barFill,
          width: `${Math.max(0, Math.min(100, Number(value ?? 0)))}%`,
          background: pctStyle(Number(value ?? 0), mode),
        }}
      />
    </div>
  );
}

function formatResourceAmount(amount) {
  return Number(amount || 0).toLocaleString("es-ES", { maximumFractionDigits: 2 });
}

function formatRewardResources(resources = []) {
  return resources.map((resource) => `${resource.amount} ${resource.key}`).join(" + ");
}

function getShortMapBonusLabel(region) {
  const rate = Number(region?.bonusRate ?? 0) * 100;
  const code = MAP_RESOURCE_CODES[region?.bonusResource] || "BON";
  return rate > 0 ? `+${rate.toLocaleString("es-ES", { maximumFractionDigits: 1 })}% ${code}` : "Sin bonus";
}

function getTerritoryEconomyBonus(region) {
  const stabilityBonus = Math.max(0, (Number(region?.stability ?? 0) - 40) / 15000);
  const fortificationBonus = Math.max(0, Number(region?.fortification ?? 0) / 25000);
  return Math.round(Math.min(0.01, stabilityBonus + fortificationBonus) * 1000) / 10;
}

function getStrategicEffectLine(region) {
  const profile = region?.strategicProfile;
  if (!profile) return "Sector sin especializacion estrategica.";
  const bits = [];
  if (Number(profile.productionBonus ?? 0) > 0) bits.push(`+${(Number(profile.productionBonus) * 100).toLocaleString("es-ES", { maximumFractionDigits: 1 })}% produccion`);
  if (Number(profile.contractValueBonus ?? 0) > 0) bits.push(`+${(Number(profile.contractValueBonus) * 100).toLocaleString("es-ES", { maximumFractionDigits: 0 })}% contratos`);
  if (Number(profile.operationRewardBonus ?? 0) > 0) bits.push(`+${(Number(profile.operationRewardBonus) * 100).toLocaleString("es-ES", { maximumFractionDigits: 0 })}% recursos op.`);
  if (Number(profile.defenseBonus ?? 0) > 0) bits.push(`+${Number(profile.defenseBonus)} defensa`);
  if (Number(profile.threatReduction ?? 0) > 0) bits.push(`-${(Number(profile.threatReduction) * 100).toLocaleString("es-ES", { maximumFractionDigits: 0 })}% presion`);
  if (Number(profile.workDurationMult ?? 1) < 1) bits.push("trabajos mas rapidos");
  return bits.join(" · ") || profile.effectsLabel || "Especializacion territorial.";
}

function getStrategicTargetScore(region, playerName) {
  if (!region || region.controller === playerName) return -1;
  const profile = region.strategicProfile || {};
  const value =
    Number(profile.productionBonus ?? 0) * 900 +
    Number(profile.contractValueBonus ?? 0) * 120 +
    Number(profile.operationRewardBonus ?? 0) * 80 +
    Number(profile.defenseBonus ?? 0) * 0.8 +
    Number(region.bonusRate ?? 0) * 700;
  const vulnerability =
    Math.max(0, 75 - Number(region.fortification ?? 0)) * 0.16 +
    Math.max(0, 70 - Number(region.stability ?? 0)) * 0.08 -
    Math.max(0, Number(region.threat ?? 0) - 60) * 0.04;
  const hostilePenalty = region.controller ? 1.8 : 0;
  return value + vulnerability - hostilePenalty;
}

function getFortCost(region) {
  const fort = Math.max(0, Number(region?.fortification ?? 0));
  const tier = Math.floor(fort / 25);
  return [
    { key: "mineral", amount: 12 + tier * 6 },
    { key: "metal_components", amount: 5 + tier * 3 },
    ...(fort >= 50 ? [{ key: "alloy_frames", amount: 2 + Math.floor((fort - 50) / 20) }] : []),
  ];
}

function canAffordResourceCost(cost = [], inventory = {}) {
  return cost.every((item) => Number(inventory?.[item.key] ?? 0) >= Number(item.amount ?? 0));
}

function formatCost(cost = []) {
  return cost.map((item) => `${item.amount} ${item.key}`).join(" - ");
}

function hasOperationResourceCost(inventory = {}, cost = []) {
  return (cost || []).every((item) => Number(inventory?.[item.key] ?? 0) >= Number(item.amount ?? 0));
}

function formatEta(ms) {
  const totalMinutes = Math.ceil(Math.max(0, Number(ms ?? 0)) / 60000);
  if (totalMinutes <= 0) return "lista";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min`;
  return `${hours} h ${minutes} min`;
}

function getBattlePreview(region, player, inventory, ownedCount, research, playerName) {
  if (!region) return null;

  const researchEffects = getResearchEffects(research);
  const doctrineBonus = Math.max(
    0,
    (Number(researchEffects.conquestPowerMult ?? 1) - 1) * 14
  );
  const mineralReserve = Math.sqrt(Math.max(0, Number(inventory?.mineral ?? 0)));
  const attackPower =
    8 +
    Number(player?.level ?? 1) * 2.1 +
    Number(ownedCount ?? 0) * 0.7 +
    mineralReserve * 1.0 +
    doctrineBonus;
  const defensePower = Math.max(
    8,
    (region.controller ? 24 : 15) +
      Number(region?.stability ?? 0) * 0.26 +
      Number(region?.fortification ?? 0) * 0.34 -
      Number(region?.threat ?? 0) * 0.05
  );
  const campaign = getCampaignState(region, playerName || player?.name);
  const successChance = Math.max(
    region.controller ? 8 : 16,
    Math.min(region.controller ? 62 : 76, 42 + (attackPower - defensePower) * 3.4 + campaign.progress * 0.1)
  );

  return {
    attackPower: Math.round(attackPower * 10) / 10,
    defensePower: Math.round(defensePower * 10) / 10,
    successChance: Math.round(successChance),
    campaignProgress: Math.round(campaign.progress),
    campaignStage: campaign.stage,
    progressOnWin: region.controller ? 26 : 38,
    progressOnLoss: region.controller ? 6 : 10,
    outlook:
      successChance >= 72
        ? "Ventana favorable"
        : successChance >= 48
          ? "Choque equilibrado"
          : "Defensa dura",
  };
}

function getCampaignStage(progress = 0) {
  const pct = Math.max(0, Math.min(100, Number(progress ?? 0)));
  if (pct >= 76) return { id: "consolidation", label: "Consolidacion", next: "Cerrar dominio" };
  if (pct >= 51) return { id: "assault", label: "Asalto", next: "Romper defensa" };
  if (pct >= 26) return { id: "sabotage", label: "Sabotaje", next: "Abrir brecha" };
  return { id: "recon", label: "Reconocimiento", next: "Levantar frente" };
}

function getCampaignState(region, playerName = "") {
  const campaign = region?.campaign && typeof region.campaign === "object" ? region.campaign : null;
  if (!campaign || campaign.ownerName !== playerName) {
    return { progress: 0, stage: getCampaignStage(0), attempts: 0 };
  }
  const progress = Math.max(0, Math.min(100, Number(campaign.progress ?? 0)));
  return { ...campaign, progress, stage: getCampaignStage(progress), attempts: Number(campaign.attempts ?? 0) };
}

function getEnemyCampaignState(region) {
  const campaign = region?.enemyCampaign && typeof region.enemyCampaign === "object" ? region.enemyCampaign : null;
  if (!campaign) return null;
  const progress = Math.max(0, Math.min(100, Number(campaign.progress ?? 0)));
  return { ...campaign, progress, stage: getCampaignStage(progress), attackerName: campaign.attackerName || "Rival regional" };
}

function getTerritoryConflictState(region, playerName) {
  const own = getCampaignState(region, playerName);
  const enemy = getEnemyCampaignState(region);
  const hasPrep = Boolean(region?.activeOperation || own.operation || region?.sabotageOperation || region?.intelOperation || region?.hackOperation);
  const isMine = region?.controller === playerName;
  const threat = Number(region?.threat ?? 0);
  const stability = Number(region?.stability ?? 0);

  if (isMine && enemy && enemy.progress >= 75) return { id: "crisis", label: "En crisis", color: "#ef4444", detail: "Un rival esta cerca de romper el control." };
  if (isMine && enemy) return { id: "attacked", label: "Bajo ataque", color: "#fb7185", detail: "Hay un frente rival activo." };
  if (!isMine && own.progress >= 75) return { id: "crisis", label: "En crisis", color: "#f59e0b", detail: "Tu operacion esta cerca de capturar el sector." };
  if (!isMine && own.progress >= 50) return { id: "contested", label: "Disputado", color: "#22d3ee", detail: "La conquista ya esta en fase abierta." };
  if (!isMine && own.progress >= 25) return { id: "infiltrated", label: "Infiltrado", color: "#38bdf8", detail: "Tienes presencia operativa dentro." };
  if (!isMine && (own.progress > 0 || hasPrep)) return { id: "suspicious", label: "Sospechoso", color: "#a78bfa", detail: "Hay una operacion en preparacion o presion inicial." };
  if (isMine && (threat >= 72 || stability <= 28)) return { id: "fragile", label: "Fragil", color: "#f97316", detail: "Necesita defensa antes de otro golpe." };
  if (isMine) return { id: "safe", label: "Seguro", color: "#4ade80", detail: "Sin conflicto territorial abierto." };
  if (region?.controller) return { id: "hostile", label: "Hostil", color: "#fb7185", detail: `Controlado por ${region.controller}.` };
  return { id: "free", label: "Libre", color: "#cbd5e1", detail: "Sin controlador estable." };
}

function getOperationLabel(type = "conquest") {
  if (type === "sabotage") return "Sabotaje";
  if (type === "spy") return "Espionaje";
  if (type === "hack") return "Hackeo";
  return "Conquista";
}

function getRegionState(region, playerName) {
  const isMine = region.controller === playerName;
  const isFree = !region.controller;
  const isCurrent = false;
  return {
    isMine,
    isFree,
    isCurrent,
    risk: isMine && (region.threat >= 70 || region.stability <= 30),
  };
}

function getSectorVisualState(region, playerName) {
  const isMine = region?.controller === playerName;
  const enemyCampaign = getEnemyCampaignState(region);
  const threat = Number(region?.threat ?? 0);
  const stability = Number(region?.stability ?? 0);
  const fortification = Number(region?.fortification ?? 0);

  if (isMine && (enemyCampaign || Number(region?.siegeTick ?? 0) > 0)) {
    return { label: "Asediado", color: "#f87171", detail: enemyCampaign ? `${enemyCampaign.attackerName} avanza al ${Math.round(enemyCampaign.progress)}%` : "Sector bajo asedio" };
  }
  if (isMine && (threat >= 70 || stability <= 30)) {
    return { label: "Tenso", color: "#f59e0b", detail: "Amenaza alta o estabilidad baja" };
  }
  if (isMine && (stability < 58 || threat > 42)) {
    return { label: "Recuperandose", color: "#38bdf8", detail: "Necesita estabilidad o menos amenaza" };
  }
  if (isMine && stability >= 72 && threat <= 22 && fortification >= 55) {
    return { label: "Productivo", color: "#4ade80", detail: "Buen control y defensa economica" };
  }
  if (isMine) {
    return { label: "Seguro", color: "#86efac", detail: "Controlado, sin presion critica" };
  }
  if (region?.controller) {
    return { label: "Hostil", color: "#fb7185", detail: `Controlado por ${region.controller}` };
  }
  return { label: "Libre", color: "#cbd5e1", detail: "Sin controlador estable" };
}

function getSectorMemoryLines(region) {
  const memory = region?.sectorMemory || {};
  const lines = [];

  if (memory.firstControlledDay) lines.push(`Primer control: dia ${memory.firstControlledDay}`);
  if (memory.conqueredCount) lines.push(`Conquistas tuyas: ${memory.conqueredCount}`);
  if (memory.defendedCount) lines.push(`Defensas realizadas: ${memory.defendedCount}`);
  if (memory.lostCount) lines.push(`Perdidas: ${memory.lostCount}${memory.lastLostTo ? ` ante ${memory.lastLostTo}` : ""}`);
  if (memory.lastEvent) lines.push(`Ultimo evento: ${memory.lastEvent}`);

  return lines;
}

function getFill(region, playerName) {
  if (region.controller === playerName) return `${region.color}cc`;
  if (!region.controller) return "rgba(148,163,184,0.28)";
  return `${region.color}66`;
}

function getStroke(region, isSelected, playerName) {
  if (isSelected) return "#f8fafc";
  if (region.controller === playerName) return "#86efac";
  if (!region.controller) return "rgba(226,232,240,0.45)";
  return "rgba(248,113,113,0.7)";
}

function getAdCooldownLabel(lastRewardAdAt) {
  const lastAt = Number(lastRewardAdAt ?? 0);
  const remaining = lastAt ? AD_REINFORCE_COOLDOWN_MS - (Date.now() - lastAt) : 0;
  if (remaining <= 0) return null;
  return `${Math.ceil(remaining / 60000)} min`;
}

export function MapView({
  territories = [],
  selected,
  playerName,
  player,
  inventory,
  companies = [],
  territorialWeeklyEvent,
  research,
  battle,
  election,
  playerCredits = 0,
  rewardAdsToday = 0,
  lastRewardAdAt = null,
  activeSectorEvent = null,
  onClaimRewardAd,
  onSelect,
  onRenameTerritory,
  onResolveSectorEvent,
  onCloseSectorEvent,
  onBattle,
  onSabotage,
  onSpy,
  onHack,
  onActivateDefense,
  onReinforce,
  onReinforceAllWithAd,
  onDisruptEnemyCampaign,
  onDisruptAllEnemyCampaigns,
  onBuildTerritoryFort,
  onStartElection,
  onOpenPolitics,
  onGoWork,
}) {
  const currentPlanet = getPlanetById(player?.currentPlanet || player?.planet);
  const currentPlanetNote =
    PLANET_MAP_NOTES[currentPlanet?.id] || PLANET_MAP_NOTES["nexus-prime"];
  const regions = territories.map((territory) => {
    const baseRegion = getRegionByTerritoryId(territory.id);
    const region = getRegionEconomy(baseRegion?.key, currentPlanet?.id) || baseRegion;

    return {
      ...territory,
      regionKey: region?.key || null,
      regionName: territory?.customName || region?.name || territory.name,
      officialName: region?.name || territory.name,
      regionKind: region?.kind || "Region",
      regionDescription: region?.description || "Zona operativa del planeta.",
      regionBonusLabel: region?.bonusLabel || "Sin bonus",
      strategicType: region?.strategicType || "industrial",
      strategicProfile: region?.strategicProfile || null,
      bonusResource: region?.bonusResource || null,
      bonusRate: Number(region?.bonusRate ?? 0),
      regionIcon: region?.icon || "[]",
      stability: Number(territory?.stability ?? 0),
      threat: Number(territory?.threat ?? 0),
      fortification: Number(territory?.fortification ?? 0),
      mapShape: MAP_SHAPES[territory.id],
    };
  });

  const selectedRegion = selected
    ? regions.find((region) => region.id === selected.id) || null
    : regions[0] || null;

  const mineCount = regions.filter((region) => region.controller === playerName).length;
  const bestBonusRegion = regions
    .filter((region) => region.controller === playerName && Number(region.bonusRate ?? 0) > 0)
    .sort((a, b) => Number(b.bonusRate ?? 0) - Number(a.bonusRate ?? 0))[0] || null;
  const avgStability = mineCount
    ? Math.round(
        regions
          .filter((region) => region.controller === playerName)
          .reduce((sum, region) => sum + region.stability, 0) / mineCount
      )
    : 0;
  const riskCount = regions.filter(
    (region) => region.controller === playerName && (region.threat >= 70 || region.stability <= 30)
  ).length;
  const ownedNeedingMax = regions.filter((region) =>
    region.controller === playerName &&
    (
      Number(region.stability ?? 0) < 100 ||
      Number(region.threat ?? 0) > 0 ||
      Number(region.fortification ?? 0) < 100 ||
      Number(region.siegeTick ?? 0) > 0
    )
  ).length;
  const adCooldownLabel = getAdCooldownLabel(lastRewardAdAt);
  const canReinforceAllWithAd = ownedNeedingMax > 0 && !adCooldownLabel;

  const isSelectedMine = selectedRegion?.controller === playerName;
  const canAttackSelected = Boolean(selectedRegion) && !isSelectedMine;
  const canAffordReinforce = Number(playerCredits ?? 0) >= REINFORCE_COST;
  const canAffordSabotage = Number(playerCredits ?? 0) >= SABOTAGE_COST;
  const canAffordConquestResources = hasOperationResourceCost(inventory, OPERATION_RESOURCE_COSTS.conquest);
  const canAffordSabotageResources = hasOperationResourceCost(inventory, OPERATION_RESOURCE_COSTS.sabotage);
  const canAffordSpyResources = hasOperationResourceCost(inventory, OPERATION_RESOURCE_COSTS.spy);
  const canAffordHackResources = hasOperationResourceCost(inventory, OPERATION_RESOURCE_COSTS.hack);
  const canAffordDefenseResources = hasOperationResourceCost(inventory, OPERATION_RESOURCE_COSTS.defense);
  const canAffordSpy = Number(playerCredits ?? 0) >= SPY_COST && Number(player?.energy ?? 0) >= SPY_ENERGY_COST && canAffordSpyResources;
  const canAffordHack = Number(playerCredits ?? 0) >= HACK_COST && Number(player?.energy ?? 0) >= HACK_ENERGY_COST && canAffordHackResources;
  const canAffordDefenseResponse = Number(playerCredits ?? 0) >= DEFENSE_RESPONSE_COST && Number(player?.energy ?? 0) >= DEFENSE_RESPONSE_ENERGY_COST && canAffordDefenseResources;
  const canAffordAttackEnergy = Number(player?.energy ?? 0) >= ATTACK_ENERGY_COST;
  const canAffordAttackCredits = Number(playerCredits ?? 0) >= ATTACK_CREDIT_COST;
  const hasSelectedPreparedAttack = Boolean(selectedRegion?.activeOperation || selectedRegion?.campaign?.operation);
  const hasSelectedPreparedSabotage = Boolean(selectedRegion?.sabotageOperation);
  const hasSelectedPreparedSpy = Boolean(selectedRegion?.intelOperation);
  const hasSelectedPreparedHack = Boolean(selectedRegion?.hackOperation);
  const canLaunchAttack = canAttackSelected && (hasSelectedPreparedAttack || (canAffordAttackEnergy && canAffordAttackCredits && canAffordConquestResources));
  const canLaunchSabotage = !isSelectedMine && Boolean(selectedRegion?.controller) && (hasSelectedPreparedSabotage || (canAffordSabotage && canAffordSabotageResources));
  const canLaunchSpy = !isSelectedMine && Boolean(selectedRegion?.controller) && (hasSelectedPreparedSpy || canAffordSpy);
  const canLaunchHack = !isSelectedMine && Boolean(selectedRegion?.controller) && (hasSelectedPreparedHack || canAffordHack);
  const selectedAttackBlockReason = !canAttackSelected
    ? null
    : hasSelectedPreparedAttack
      ? null
      : !canAffordAttackEnergy
      ? `Falta energia: necesitas ${ATTACK_ENERGY_COST}`
      : !canAffordAttackCredits
        ? `Faltan creditos: necesitas ${ATTACK_CREDIT_COST}`
        : !canAffordConquestResources
          ? `Faltan recursos operativos: ${formatCost(OPERATION_RESOURCE_COSTS.conquest)}`
        : null;
  const selectedCampaign = selectedRegion ? getCampaignState(selectedRegion, playerName) : null;
  const selectedEnemyCampaign = selectedRegion ? getEnemyCampaignState(selectedRegion) : null;
  const selectedOperation = selectedCampaign?.operation || selectedRegion?.activeOperation || null;
  const selectedSabotageOperation = selectedRegion?.sabotageOperation || null;
  const selectedIntelOperation = selectedRegion?.intelOperation || null;
  const selectedHackOperation = selectedRegion?.hackOperation || null;
  const selectedOperationEta = selectedOperation ? getTerritoryOperationEtaMs(selectedOperation) : 0;
  const selectedOperationProgress = selectedOperation ? getTerritoryOperationProgress(selectedOperation) : 0;
  const selectedSabotageEta = selectedSabotageOperation ? getTerritoryOperationEtaMs(selectedSabotageOperation) : 0;
  const selectedSabotageProgress = selectedSabotageOperation ? getTerritoryOperationProgress(selectedSabotageOperation) : 0;
  const selectedIntelEta = selectedIntelOperation ? getTerritoryOperationEtaMs(selectedIntelOperation) : 0;
  const selectedHackEta = selectedHackOperation ? getTerritoryOperationEtaMs(selectedHackOperation) : 0;
  const selectedDefenseProfile = selectedRegion ? getTerritoryDefenseProfile(selectedRegion) : null;
  const selectedDefenseAssets = Array.isArray(selectedRegion?.defenseAssets) ? selectedRegion.defenseAssets : [];
  const selectedDefenseResponse = selectedRegion?.defenseResponse || null;
  const selectedAttackActionLabel = hasSelectedPreparedAttack
    ? selectedOperationEta > 0 ? "Operacion en curso" : "Resolver operacion"
    : selectedCampaign?.progress > 0
      ? `Preparar siguiente fase`
      : `Preparar operacion`;
  const selectedSabotageActionLabel = hasSelectedPreparedSabotage
    ? selectedSabotageEta > 0 ? "Sabotaje en curso" : "Resolver sabotaje"
    : `Preparar sabotaje`;
  const selectedSpyActionLabel = hasSelectedPreparedSpy
    ? selectedIntelEta > 0 ? "Espionaje en curso" : "Resolver espionaje"
    : `Espiar defensas`;
  const selectedHackActionLabel = hasSelectedPreparedHack
    ? selectedHackEta > 0 ? "Hackeo en curso" : "Resolver hackeo"
    : `Hackear sistemas`;
  const canAffordElectionLevel = Number(player?.level ?? 1) >= PROTOCOL_UNLOCK_LEVEL;
  const canAffordElectionCredits = Number(playerCredits ?? 0) >= PROTOCOL_CREDIT_COST;
  const canAffordElectionEnergy = Number(player?.energy ?? 0) >= PROTOCOL_ENERGY_COST;
  const canStartElection =
    Boolean(selectedRegion) &&
    !election?.active &&
    canAffordElectionLevel &&
    canAffordElectionCredits &&
    canAffordElectionEnergy;
  const selectedTerritoryEconomyBonus = selectedRegion
    ? getTerritoryEconomyBonus(selectedRegion)
    : 0;
  const selectedSectorState = selectedRegion ? getSectorVisualState(selectedRegion, playerName) : null;
  const selectedMemoryLines = selectedRegion ? getSectorMemoryLines(selectedRegion) : [];
  const selectedBattlePreview = canAttackSelected
    ? getBattlePreview(selectedRegion, player, inventory, mineCount, research, playerName)
    : null;
  const selectedFortCost = selectedRegion ? getFortCost(selectedRegion) : [];
  const canAffordSelectedFort = canAffordResourceCost(selectedFortCost, inventory);
  const selectedFortIsMaxed = Number(selectedRegion?.fortification ?? 0) >= 100;
  const canBuildSelectedFort = isSelectedMine && canAffordSelectedFort && !selectedFortIsMaxed;
  const activeTerritorialEvent = territorialWeeklyEvent && !territorialWeeklyEvent.completed && !territorialWeeklyEvent.failed
    ? territorialWeeklyEvent
    : null;
  const eventRegion = activeTerritorialEvent
    ? regions.find((region) => Number(region.id) === Number(activeTerritorialEvent.territoryId))
    : null;
  const eventIsControlled = eventRegion?.controller === playerName;
  const eventStabilityReady = Number(eventRegion?.stability ?? 0) >= Number(activeTerritorialEvent?.targetStability ?? 70);
  const eventRewardText = activeTerritorialEvent?.reward?.resources?.length
    ? formatRewardResources(activeTerritorialEvent.reward.resources)
    : "creditos y XP";
  const activeFronts = regions.flatMap((region) => {
      const ownCampaign = getCampaignState(region, playerName);
      const enemy = getEnemyCampaignState(region);
      return [
        ...(ownCampaign.progress > 0 && region.controller !== playerName
        ? [{ id: `own-${region.id}`, type: "own", region, title: "Operacion propia", actor: playerName, progress: ownCampaign.progress, stage: ownCampaign.stage }]
        : []),
      ...(enemy
        ? [{ id: `enemy-${region.id}`, type: "enemy", region, title: "Frente rival", actor: enemy.attackerName, progress: enemy.progress, stage: enemy.stage }]
        : []),
    ];
  }).sort((a, b) => b.progress - a.progress).slice(0, 6);
  const potentialFronts = regions
    .filter((region) => region.controller === playerName && !getEnemyCampaignState(region))
    .map((region) => ({
      region,
      risk: Math.round(
        Number(region.threat ?? 0) * 0.9 +
        Math.max(0, 100 - Number(region.stability ?? 0)) * 0.35 +
        Math.max(0, 100 - Number(region.fortification ?? 0)) * 0.18
      ),
    }))
    .filter((front) => front.risk >= 28)
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 3);
  const [mapFilter, setMapFilter] = useState("risk");
  const enemyFrontCount = regions.filter((region) => region.controller === playerName && getEnemyCampaignState(region)).length;
  const ownCampaignCount = regions.filter((region) => region.controller !== playerName && getCampaignState(region, playerName).progress > 0).length;
  const activeOperationCount = regions.filter((region) => {
    const campaign = getCampaignState(region, playerName);
    return Boolean(region.activeOperation || region.sabotageOperation || region.intelOperation || region.hackOperation || campaign.operation || campaign.progress > 0);
  }).length;
  const operationQueue = regions.flatMap((region) => {
    const own = getCampaignState(region, playerName);
    const entries = [];
    const conquestOperation = own.operation || region.activeOperation;
    if (own.progress > 0 || conquestOperation) {
      entries.push({
        id: `conquest-${region.id}`,
        type: "conquest",
        region,
        title: "Conquista",
        progress: conquestOperation ? getTerritoryOperationProgress(conquestOperation) : own.progress,
        eta: conquestOperation ? getTerritoryOperationEtaMs(conquestOperation) : 0,
        state: getTerritoryConflictState(region, playerName),
      });
    }
    [
      ["sabotage", region.sabotageOperation],
      ["spy", region.intelOperation],
      ["hack", region.hackOperation],
    ].forEach(([type, operation]) => {
      if (!operation) return;
      entries.push({
        id: `${type}-${region.id}`,
        type,
        region,
        title: getOperationLabel(type),
        progress: getTerritoryOperationProgress(operation),
        eta: getTerritoryOperationEtaMs(operation),
        state: getTerritoryConflictState(region, playerName),
      });
    });
    return entries;
  }).sort((a, b) => (b.progress || 0) - (a.progress || 0)).slice(0, 6);
  const hiddenDefenseAssetCount = regions
    .filter((region) => region.controller === playerName)
    .reduce((sum, region) => sum + (Array.isArray(region.defenseAssets) ? region.defenseAssets.length : 0), 0);
  const controlledStrategicProfiles = regions
    .filter((region) => region.controller === playerName && region.strategicProfile)
    .map((region) => ({ ...region.strategicProfile, regionName: region.regionName }));
  const recommendedTarget = [...regions]
    .filter((region) => region.controller !== playerName)
    .map((region) => ({ region, score: getStrategicTargetScore(region, playerName) }))
    .sort((a, b) => b.score - a.score)[0]?.region || null;
  const tacticalNextStep = (() => {
    if (!selectedRegion) return "Selecciona un sector conquistable para preparar una operacion.";
    if (isSelectedMine) {
      if (selectedDefenseResponse) return `${selectedDefenseResponse.label || "Defensa activa"} cubre este sector hasta ${formatEta(Number(selectedDefenseResponse.expiresAt ?? Date.now()) - Date.now())}.`;
      if (canBuildSelectedFort) return "Instala una defensa oculta para proteger este territorio contra sabotaje, hackers y espionaje.";
      if (canAffordReinforce) return "Refuerza el sector para bajar amenaza y ganar tiempo ante frentes rivales.";
      return `Necesitas ${REINFORCE_COST} creditos o recursos industriales para mejorar esta defensa.`;
    }
    if (!selectedRegion?.intelReport && canLaunchSpy) return "Primero puedes espiar el sector para revelar defensas ocultas antes de gastar en conquista.";
    if (selectedOperation && selectedOperationEta > 0) return `Operacion en preparacion. Vuelve en ${formatEta(selectedOperationEta)} para resolverla.`;
    if (selectedOperation) return "La operacion esta lista: resuelvela para avanzar la conquista.";
    if (selectedCampaign?.progress > 0) return "Este sector ya tiene presion acumulada: prepara la siguiente operacion para seguir empujando.";
    if (canLaunchAttack) return "Prepara una operacion de conquista. No captura al instante: inicia una ventana larga con ETA.";
    return selectedAttackBlockReason || "Necesitas energia y creditos para preparar una operacion.";
  })();
  const getRegionPreparedAttack = (region) => {
    const campaign = getCampaignState(region, playerName);
    return campaign.operation || region?.activeOperation || null;
  };
  const canAdvanceRegionOperation = (region) =>
    Boolean(getRegionPreparedAttack(region)) ||
    (Number(player?.energy ?? 0) >= ATTACK_ENERGY_COST && Number(playerCredits ?? 0) >= ATTACK_CREDIT_COST && canAffordConquestResources);
  const filteredRegions = regions
    .filter((region) => {
      if (mapFilter === "mine") return region.controller === playerName;
      if (mapFilter === "fronts") return Boolean(getEnemyCampaignState(region) || getCampaignState(region, playerName).progress > 0);
      if (mapFilter === "targets") return region.controller !== playerName;
      return region.controller === playerName && (region.threat >= 55 || region.stability <= 45 || Boolean(getEnemyCampaignState(region)));
    })
    .sort((a, b) => {
      const score = (region) => {
        const enemy = getEnemyCampaignState(region);
        return (enemy ? 100 + Number(enemy.progress ?? 0) : 0) +
          Number(region.threat ?? 0) +
          Math.max(0, 100 - Number(region.stability ?? 0)) * 0.55 +
          Math.max(0, 100 - Number(region.fortification ?? 0)) * 0.25;
      };
      return score(b) - score(a);
    });
  void onClaimRewardAd;

  return (
    <div style={styles.wrapper}>
      <div style={{ display: "grid", gap: 10, padding: 12, borderRadius: 10, background: "rgba(15,23,42,0.72)", border: "1px solid rgba(56,189,248,0.16)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: "#7dd3fc", fontWeight: 900, letterSpacing: 0.7 }}>MAPA TACTICO</div>
            <div style={{ color: "#f8fafc", fontSize: 18, fontWeight: 900 }}>{currentPlanetNote.title} · {mineCount} sectores · {enemyFrontCount} frentes rivales</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Estabilidad media {avgStability}% · {riskCount} en riesgo · {activeOperationCount} operaciones lentas</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" onClick={onReinforceAllWithAd} disabled={!canReinforceAllWithAd} style={{ ...styles.primaryAction, ...(!canReinforceAllWithAd ? styles.disabledButton : null) }}>
              Blindaje total
            </button>
            <button type="button" onClick={onDisruptAllEnemyCampaigns} disabled={enemyFrontCount <= 0} style={{ ...styles.secondaryAction, ...(enemyFrontCount <= 0 ? styles.disabledButton : null) }}>
              Cortar todos los frentes
            </button>
          </div>
        </div>
        <div style={styles.operationBanner}>
          <div>
            <div style={styles.operationBannerKicker}>Nuevo sistema territorial</div>
            <div style={styles.operationBannerTitle}>Conquista y sabotaje ahora son operaciones con preparacion, ETA y defensa oculta.</div>
          </div>
          <div style={styles.operationBannerFacts}>
            <span style={styles.operationBannerFact}>{activeOperationCount} operaciones</span>
            <span style={styles.operationBannerFact}>{hiddenDefenseAssetCount} activos ocultos</span>
            <span style={styles.operationBannerFact}>Espionaje imperfecto</span>
          </div>
        </div>
        <div style={styles.nextStepBox}>
          <strong>Siguiente accion</strong>
          <span>{tacticalNextStep}</span>
        </div>
        {recommendedTarget && (
          <button
            type="button"
            onClick={() => onSelect?.(recommendedTarget)}
            style={{ ...styles.nextStepBox, textAlign: "left", cursor: "pointer" }}
          >
            <strong>Objetivo sugerido</strong>
            <span>
              {recommendedTarget.regionName}: {recommendedTarget.strategicProfile?.label || "Distrito"} · {getStrategicEffectLine(recommendedTarget)}
            </span>
          </button>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
          <MiniPanel title="Sectores tuyos" value={`${mineCount}`} subtitle="Control directo" color={theme.colors.cyan} />
          <MiniPanel title="Frentes rivales" value={`${enemyFrontCount}`} subtitle="Ataques activos" color={enemyFrontCount ? "#f87171" : "#4ade80"} />
          <MiniPanel title="Operaciones" value={`${activeOperationCount}`} subtitle="Con ETA real" color={activeOperationCount ? "#fbbf24" : "#94a3b8"} />
          <MiniPanel title="Activos ocultos" value={`${hiddenDefenseAssetCount}`} subtitle="Defensa por capas" color={hiddenDefenseAssetCount ? "#4ade80" : "#fbbf24"} />
        </div>
        <div style={styles.operationResourceStrip}>
          <span>INT {formatResourceAmount(inventory?.intel_data)}</span>
          <span>HK {formatResourceAmount(inventory?.exploit_kits)}</span>
          <span>SEC {formatResourceAmount(inventory?.security_teams)}</span>
          <span>INF {formatResourceAmount(inventory?.influence_cells)}</span>
        </div>
        <div style={styles.operationResourceStrip}>
          {controlledStrategicProfiles.length > 0 ? (
            controlledStrategicProfiles.slice(0, 5).map((profile, index) => (
              <span key={`${profile.regionName}-${index}`} style={{ color: profile.color || "#cbd5e1" }}>
                {profile.regionName}: {profile.shortLabel} · {profile.effectsLabel}
              </span>
            ))
          ) : (
            <span>Conquista un sector para activar bonus estrategicos permanentes.</span>
          )}
        </div>
        {operationQueue.length > 0 && (
          <div style={styles.operationQueue}>
            <div style={styles.operationQueueHeader}>Operaciones en curso</div>
            <div style={styles.operationQueueGrid}>
              {operationQueue.map((operation) => (
                <button key={operation.id} type="button" onClick={() => onSelect?.(operation.region)} style={styles.operationQueueItem}>
                  <span style={{ ...styles.operationStateDot, background: operation.state.color }} />
                  <strong>{operation.title}</strong>
                  <span>{operation.region.regionName}</span>
                  <span>{operation.eta > 0 ? formatEta(operation.eta) : `${Math.round(operation.progress)}%`}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {[["risk", "Riesgo"], ["mine", "Mis sectores"], ["fronts", "Frentes"], ["targets", "Conquistables"]].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setMapFilter(id)} style={{ minHeight: 30, padding: "6px 10px", borderRadius: 8, border: mapFilter === id ? "1px solid rgba(34,211,238,0.48)" : "1px solid rgba(148,163,184,0.16)", background: mapFilter === id ? "rgba(34,211,238,0.16)" : "rgba(15,23,42,0.58)", color: mapFilter === id ? "#a5f3fc" : "#cbd5e1", fontWeight: 900, fontSize: 12 }}>
            {label}
          </button>
        ))}
      </div>

      {activeFronts.length > 0 && (
        <div style={{ display: "grid", gap: 8 }}>
          {activeFronts.slice(0, 4).map((front) => (
            <div key={front.id} style={{ display: "grid", gridTemplateColumns: "minmax(150px, 1fr) minmax(110px, 0.8fr) minmax(160px, 1fr) minmax(130px, auto)", gap: 8, alignItems: "center", padding: 10, borderRadius: 10, border: front.type === "enemy" ? "1px solid rgba(248,113,113,0.28)" : "1px solid rgba(34,211,238,0.24)", background: front.type === "enemy" ? "rgba(127,29,29,0.16)" : "rgba(8,47,73,0.18)", color: "#e2e8f0", textAlign: "left" }}>
              <button type="button" onClick={() => onSelect?.(front.region)} style={styles.frontSelectBtn}>
                <strong>{front.region.regionName}</strong><br /><span style={{ color: "#94a3b8", fontSize: 11 }}>{front.title} · {front.actor}</span>
              </button>
              <div style={{ fontSize: 12 }}>{front.stage.label}<br /><strong>{Math.round(front.progress)}%</strong></div>
              <MiniBar value={front.progress} mode={front.type === "enemy" ? "danger" : "good"} />
              {front.type === "own" ? (
                <button
                  type="button"
                  onClick={() => {
                    onSelect?.(front.region);
                    onBattle?.(front.region);
                  }}
                  disabled={!canAdvanceRegionOperation(front.region)}
                  style={{
                    ...styles.inlineFrontAction,
                    ...(!canAdvanceRegionOperation(front.region) ? styles.disabledButton : null),
                  }}
                >
                  {getRegionPreparedAttack(front.region) ? "Resolver fase" : "Preparar fase"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onSelect?.(front.region);
                    onDisruptEnemyCampaign?.(front.region.id);
                  }}
                  style={styles.inlineFrontAction}
                >
                  Cortar frente
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(280px, 0.8fr)", gap: 10, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 8 }}>
          {filteredRegions.map((region) => {
            const enemy = getEnemyCampaignState(region);
            const own = getCampaignState(region, playerName);
            const isMine = region.controller === playerName;
            const isSelected = selectedRegion && Number(selectedRegion.id) === Number(region.id);
            const state = getSectorVisualState(region, playerName);
            const conflict = getTerritoryConflictState(region, playerName);
            return (
              <button key={region.id} type="button" onClick={() => onSelect?.(region)} style={{ display: "grid", gridTemplateColumns: "minmax(140px,1fr) 92px 92px 92px minmax(110px,0.9fr)", gap: 8, alignItems: "center", padding: 10, borderRadius: 10, border: isSelected ? "1px solid rgba(34,211,238,0.48)" : "1px solid rgba(148,163,184,0.13)", background: isSelected ? "rgba(8,47,73,0.32)" : "rgba(15,23,42,0.66)", color: "#e2e8f0", textAlign: "left" }}>
                <div>
                  <div style={{ color: "#f8fafc", fontWeight: 900 }}>{region.regionName}</div>
                  <div style={{ color: region.strategicProfile?.color || "#a5f3fc", fontSize: 11, fontWeight: 900 }}>{region.strategicProfile?.label || "Distrito"} · {getShortMapBonusLabel(region)}</div>
                  <div style={{ color: conflict.color, fontSize: 11, fontWeight: 800 }}>{conflict.label} · {state.label}</div>
                </div>
                <div style={{ fontSize: 11, color: "#cbd5e1" }}>Amenaza<MiniBar value={region.threat} mode="danger" /></div>
                <div style={{ fontSize: 11, color: "#cbd5e1" }}>Estab.<MiniBar value={region.stability} /></div>
                <div style={{ fontSize: 11, color: "#cbd5e1" }}>Defensa<MiniBar value={region.fortification} /></div>
                <div style={{ fontSize: 11, color: "#cbd5e1" }}>{enemy ? `Rival ${Math.round(enemy.progress)}%` : own.progress > 0 && !isMine ? `Operacion ${Math.round(own.progress)}%` : isMine ? "Controlado" : "Objetivo"}</div>
              </button>
            );
          })}
          {filteredRegions.length === 0 && <div style={styles.tipBox}>No hay sectores en este filtro.</div>}
        </div>

        {selectedRegion && (
          <div style={{ display: "grid", gap: 10, position: "sticky", top: "calc(var(--pw-topbar-height, 150px) + 12px)" }}>
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(15,23,42,0.78)", border: "1px solid rgba(148,163,184,0.14)" }}>
              <div style={{ fontSize: 11, color: "#7dd3fc", fontWeight: 900 }}>SECTOR</div>
              <div style={{ color: "#f8fafc", fontSize: 17, fontWeight: 900 }}>{selectedRegion.regionName}</div>
              <div style={{ color: selectedRegion.strategicProfile?.color || "#a5f3fc", fontSize: 12, fontWeight: 900 }}>
                {selectedRegion.strategicProfile?.label || selectedRegion.regionKind} · {getStrategicEffectLine(selectedRegion)}
              </div>
              <div style={{ color: "#94a3b8", fontSize: 12 }}>{selectedSectorState?.detail || selectedRegion.regionBonusLabel}</div>
              <div style={styles.conflictStateBox}>
                <span style={{ ...styles.operationStateDot, background: getTerritoryConflictState(selectedRegion, playerName).color }} />
                <strong>{getTerritoryConflictState(selectedRegion, playerName).label}</strong>
                <span>{getTerritoryConflictState(selectedRegion, playerName).detail}</span>
              </div>
              <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
                <div>Amenaza <MiniBar value={selectedRegion.threat} mode="danger" /></div>
                <div>Estabilidad <MiniBar value={selectedRegion.stability} /></div>
                <div>Defensa <MiniBar value={selectedRegion.fortification} /></div>
              </div>
            </div>

            <div style={styles.selectedActionBox}>
              <div>
                <div style={styles.selectedActionKicker}>Accion disponible</div>
                <div style={styles.selectedActionText}>{tacticalNextStep}</div>
              </div>
              <div style={styles.selectedActionButtons}>
                {isSelectedMine ? (
                  <>
                    <button type="button" onClick={() => onBuildTerritoryFort?.(selectedRegion.id)} disabled={!canBuildSelectedFort} style={{ ...styles.primaryAction, ...(!canBuildSelectedFort ? styles.disabledButton : null) }}>Instalar defensa</button>
                    <button type="button" onClick={() => onReinforce?.(selectedRegion.id)} disabled={!canAffordReinforce} style={{ ...styles.secondaryAction, ...(!canAffordReinforce ? styles.disabledButton : null) }}>Reforzar</button>
                    <div style={styles.costHint}>Defensa reactiva: {DEFENSE_RESPONSE_COST} cr + {formatCost(OPERATION_RESOURCE_COSTS.defense)}</div>
                    <div style={styles.responseButtonGrid}>
                      {Object.entries(TERRITORY_DEFENSE_RESPONSE_TYPES).map(([type, def]) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => onActivateDefense?.(selectedRegion.id, type)}
                          disabled={!canAffordDefenseResponse}
                          style={{ ...styles.smallActionBtn, ...(!canAffordDefenseResponse ? styles.disabledButton : null) }}
                        >
                          {def.label}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={styles.costHint}>Conquista: {ATTACK_CREDIT_COST} cr + {formatCost(OPERATION_RESOURCE_COSTS.conquest)}</div>
                    <button type="button" onClick={() => onBattle?.(selectedRegion)} disabled={!canLaunchAttack} style={{ ...styles.primaryAction, ...(!canLaunchAttack ? styles.disabledButton : null) }}>
                      {selectedAttackActionLabel}
                    </button>
                    <div style={styles.responseButtonGrid}>
                      <button type="button" onClick={() => onSpy?.(selectedRegion.id)} disabled={!canLaunchSpy} style={{ ...styles.smallActionBtn, ...(!canLaunchSpy ? styles.disabledButton : null) }}>
                        {selectedSpyActionLabel}
                      </button>
                      <button type="button" onClick={() => onHack?.(selectedRegion.id)} disabled={!canLaunchHack} style={{ ...styles.smallActionBtn, ...(!canLaunchHack ? styles.disabledButton : null) }}>
                        {selectedHackActionLabel}
                      </button>
                    </div>
                    <div style={styles.costHint}>Espionaje: {formatCost(OPERATION_RESOURCE_COSTS.spy)} · Hackeo: {formatCost(OPERATION_RESOURCE_COSTS.hack)} · Sabotaje: {formatCost(OPERATION_RESOURCE_COSTS.sabotage)}</div>
                    <button type="button" onClick={() => onSabotage?.(selectedRegion.id)} disabled={!canLaunchSabotage} style={{ ...styles.secondaryAction, ...(!canLaunchSabotage ? styles.disabledButton : null) }}>
                      {selectedSabotageActionLabel}
                    </button>
                    {selectedAttackBlockReason && <div style={styles.actionBlockReason}>{selectedAttackBlockReason}</div>}
                  </>
                )}
              </div>
            </div>

            {selectedEnemyCampaign && (
              <div style={{ padding: 10, borderRadius: 10, background: "rgba(127,29,29,0.16)", border: "1px solid rgba(248,113,113,0.24)" }}>
                <strong style={{ color: "#fecaca" }}>Frente rival: {selectedEnemyCampaign.attackerName}</strong>
                <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 4 }}>{selectedEnemyCampaign.stage.label} · {Math.round(selectedEnemyCampaign.progress)}%</div>
                <MiniBar value={selectedEnemyCampaign.progress} mode="danger" />
              </div>
            )}

            {selectedCampaign?.progress > 0 && !isSelectedMine && (
              <div style={{ padding: 10, borderRadius: 10, background: "rgba(8,47,73,0.18)", border: "1px solid rgba(34,211,238,0.2)" }}>
                <strong style={{ color: "#a5f3fc" }}>Operacion propia</strong>
                <div style={{ color: "#cbd5e1", fontSize: 12, marginTop: 4 }}>{selectedCampaign.stage.label} · {Math.round(selectedCampaign.progress)}%</div>
                <MiniBar value={selectedCampaign.progress} />
              </div>
            )}

            {!isSelectedMine && selectedRegion.intelReport && (
              <div style={styles.intelBox}>
                <div style={styles.intelTop}>
                  <div>
                    <div style={styles.intelKicker}>Informe de inteligencia</div>
                    <div style={styles.intelTitle}>{selectedRegion.intelReport.summary || "Defensas estimadas"} · {Math.round(Number(selectedRegion.intelReport.confidence ?? 0))}%</div>
                  </div>
                  <strong>{formatEta(Number(selectedRegion.intelReport.expiresAt ?? Date.now()) - Date.now())}</strong>
                </div>
                <div style={styles.defenseGrid}>
                  {Object.entries(selectedRegion.intelReport.defense || {}).slice(0, 6).map(([key, value]) => (
                    <QuickFact key={key} label={key} value={`${value}%`} />
                  ))}
                </div>
                {Array.isArray(selectedRegion.intelReport.assets) && selectedRegion.intelReport.assets.length > 0 && (
                  <div style={styles.assetList}>
                    {selectedRegion.intelReport.assets.map((asset, index) => (
                      <span key={`${asset.type}-${index}`} style={styles.assetPill}>
                        {DEFENSE_ASSET_TYPES[asset.type]?.label || asset.type} {asset.level}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isSelectedMine && selectedDefenseResponse && (
              <div style={styles.responseActiveBox}>
                <strong>{selectedDefenseResponse.label}</strong>
                <span>Activo durante {formatEta(Number(selectedDefenseResponse.expiresAt ?? Date.now()) - Date.now())}</span>
              </div>
            )}

            <div style={{ display: "grid", gap: 8 }}>
              {isSelectedMine ? (
                <>
                  <button type="button" onClick={() => onReinforce?.(selectedRegion.id)} disabled={!canAffordReinforce} style={{ ...styles.primaryAction, ...(!canAffordReinforce ? styles.disabledButton : null) }}>Reforzar (-{REINFORCE_COST} cr)</button>
                  <button type="button" onClick={() => onDisruptEnemyCampaign?.(selectedRegion.id)} disabled={!selectedEnemyCampaign} style={{ ...styles.secondaryAction, ...(!selectedEnemyCampaign ? styles.disabledButton : null) }}>Cortar suministros (-6 cr)</button>
                  <button type="button" onClick={() => onBuildTerritoryFort?.(selectedRegion.id)} disabled={!canBuildSelectedFort} style={{ ...styles.secondaryAction, ...(!canBuildSelectedFort ? styles.disabledButton : null) }}>Instalar defensa</button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => onBattle?.(selectedRegion)} disabled={!canLaunchAttack} style={{ ...styles.primaryAction, ...(!canLaunchAttack ? styles.disabledButton : null) }}>{selectedAttackActionLabel}</button>
                  <button type="button" onClick={() => onSabotage?.(selectedRegion.id)} disabled={!canLaunchSabotage} style={{ ...styles.secondaryAction, ...(!canLaunchSabotage ? styles.disabledButton : null) }}>
                    {selectedSabotageActionLabel}
                  </button>
                </>
              )}
              <button type="button" onClick={() => onOpenPolitics?.(selectedRegion)} style={styles.secondaryAction}>Resolver por politica</button>
            </div>

            <details style={{ padding: 10, borderRadius: 10, background: "rgba(15,23,42,0.58)", border: "1px solid rgba(148,163,184,0.12)" }}>
              <summary style={{ cursor: "pointer", color: "#f8fafc", fontWeight: 900 }}>Memoria del sector</summary>
              <div style={{ display: "grid", gap: 5, marginTop: 8 }}>
                {(selectedMemoryLines.length ? selectedMemoryLines : ["Sin historial relevante todavia."]).slice(0, 5).map((line) => (
                  <div key={line} style={{ color: "#cbd5e1", fontSize: 12 }}>{line}</div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={styles.wrapper}>
      <div style={styles.intro}>
        <div style={styles.introBadge}>CARTOGRAFIA REGIONAL</div>
        <div style={styles.title}>{currentPlanetNote.title} - Mapa territorial</div>
        <div style={styles.text}>{currentPlanetNote.detail}</div>
        <div style={styles.planetFlavor}>{currentPlanetNote.favored}</div>
      </div>

      <div style={styles.tipBox}>
        <div style={styles.tipText}>
          Reforzar un sector cuesta <strong>{REINFORCE_COST} creditos</strong> y sabotear uno hostil cuesta{" "}
          <strong>{SABOTAGE_COST} creditos</strong>.
        </div>

        <button style={styles.workBtn} onClick={onGoWork}>
          Ir a trabajo
        </button>
      </div>

      <div style={styles.summaryGrid}>
        <MiniPanel
          title="Sectores tuyos"
          value={`${mineCount}`}
          subtitle="Cuantos mas controles, mas presion tendras que sostener."
          color={theme.colors.cyan}
        />
        <MiniPanel
          title="Estabilidad media"
          value={`${avgStability}%`}
          subtitle="Pulso general de tus regiones."
          color={pctStyle(avgStability)}
        />
        <MiniPanel
          title="Sectores en riesgo"
          value={`${riskCount}`}
          subtitle="Requieren refuerzo o podrias perderlos."
          color={riskCount > 0 ? theme.colors.amber : "#4ade80"}
        />
        <MiniPanel
          title="Frentes"
          value={`${activeFronts.length}`}
          subtitle={activeFronts.length ? "Operaciones abiertas ahora." : `${potentialFronts.length} sector(es) vigilados.`}
          color={activeFronts.length ? "#f87171" : theme.colors.cyan}
        />
        <MiniPanel
          title="Mejor bonus"
          value={bestBonusRegion?.regionName || "Sin bonus"}
          subtitle={bestBonusRegion ? getShortMapBonusLabel(bestBonusRegion) : "Controla sectores para activar bonus"}
          color={theme.colors.violet}
        />
      </div>

      <div style={styles.adReinforcePanel}>
        <div>
          <div style={styles.adReinforceKicker}>BLINDAJE PUBLICITARIO</div>
          <div style={styles.adReinforceTitle}>Reforzar todos tus sectores al maximo</div>
          <div style={styles.adReinforceText}>
            Pone estabilidad al 100%, amenaza a 0% y fortificacion al 100% en todos tus sectores.
            Consume una emision diaria de publicidad.
          </div>
        </div>
        <button
          style={{
            ...styles.adReinforceBtn,
            ...(!canReinforceAllWithAd ? styles.disabledBtn : {}),
          }}
          onClick={() => {
            onReinforceAllWithAd?.();
          }}
          disabled={!canReinforceAllWithAd}
          title={
            canReinforceAllWithAd
              ? `Reforzar ${ownedNeedingMax} sector(es)`
              : ownedNeedingMax <= 0
                ? "No hay sectores tuyos que reforzar"
                : `Espera ${adCooldownLabel}`
          }
        >
          {canReinforceAllWithAd
            ? `Ver anuncio y blindar ${ownedNeedingMax}`
            : ownedNeedingMax <= 0
              ? "Todo al maximo"
              : `Espera ${adCooldownLabel}`}
        </button>
      </div>

      {activeTerritorialEvent && eventRegion && (
        <div style={styles.weeklyEventPanel}>
          <div>
            <div style={styles.weeklyEventKicker}>FOCO SEMANAL TERRITORIAL</div>
            <div style={styles.weeklyEventTitle}>{activeTerritorialEvent.title}</div>
            <div style={styles.weeklyEventText}>{activeTerritorialEvent.desc}</div>
          </div>

          <div style={styles.weeklyEventMetaGrid}>
            <QuickFact label="Objetivo" value={eventIsControlled && eventStabilityReady ? "Listo para cerrar" : `Control + ${activeTerritorialEvent.targetStability}% estabilidad`} />
            <QuickFact label="Estado" value={eventIsControlled ? `${Math.round(eventRegion.stability)}% estabilidad` : `Lo controla ${eventRegion.controller || "nadie"}`} />
            <QuickFact label="Recompensa" value={`+${activeTerritorialEvent.reward?.credits ?? 0} cr + ${activeTerritorialEvent.reward?.xp ?? 0} XP + ${eventRewardText}`} />
            <QuickFact label="Cierra" value={`Dia ${activeTerritorialEvent.endsDay}`} />
          </div>

          <button style={styles.weeklyEventButton} onClick={() => onSelect?.(eventRegion)}>
            Ver territorio objetivo
          </button>
        </div>
      )}

      {activeSectorEvent && Number(activeSectorEvent.expiresAt ?? 0) > Date.now() && (
        <div style={styles.sectorEventPanel}>
          <div>
            <div style={styles.sectorEventKicker}>EVENTO DE SECTOR</div>
            <div style={styles.sectorEventTitle}>{activeSectorEvent.title}</div>
            <div style={styles.sectorEventText}>{activeSectorEvent.desc}</div>
          </div>
          <div style={styles.sectorEventActions}>
            <button type="button" style={styles.sectorEventButton} onClick={() => onSelect?.(regions.find((region) => Number(region.id) === Number(activeSectorEvent.territoryId)))}>
              Ver sector
            </button>
            <button type="button" style={styles.sectorEventButtonPrimary} onClick={() => onResolveSectorEvent?.()}>
              Enviar recursos
            </button>
            <button type="button" style={styles.sectorEventGhost} onClick={() => onCloseSectorEvent?.()}>
              Ignorar
            </button>
          </div>
        </div>
      )}

      <div style={styles.frontPanel}>
        <div style={styles.frontPanelHeader}>
          <div>
            <div style={styles.frontTitle}>Frentes activos</div>
            <div style={styles.frontSub}>Operaciones tuyas y movimientos rivales que conviene vigilar.</div>
          </div>
          <div style={styles.frontCount}>{activeFronts.length}</div>
        </div>
        <div style={styles.frontList}>
          {activeFronts.length === 0 ? (
            potentialFronts.length === 0 ? (
              <div style={styles.frontEmpty}>
                No hay operaciones abiertas ni sectores con riesgo alto ahora mismo.
              </div>
            ) : (
              potentialFronts.map((front) => (
                <button key={`potential-${front.region.id}`} style={styles.frontItem} onClick={() => onSelect?.(front.region)}>
                  <div>
                    <div style={styles.frontName}>{front.region.regionName}</div>
                    <div style={styles.frontMeta}>Vigilancia rival potencial</div>
                  </div>
                  <div style={styles.frontStats}>
                    <span>Riesgo</span>
                    <span>{front.risk}%</span>
                  </div>
                  <div style={styles.frontAction}>Vigilar</div>
                </button>
              ))
            )
          ) : activeFronts.map((front) => (
            <button key={front.id} style={styles.frontItem} onClick={() => onSelect?.(front.region)}>
              <div>
                <div style={styles.frontName}>{front.region.regionName}</div>
                <div style={styles.frontMeta}>{front.title} - {front.actor}</div>
              </div>
              <div style={styles.frontStats}>
                <span>{front.stage.label}</span>
                <span>{Math.round(front.progress)}%</span>
              </div>
              <div style={{
                ...styles.frontAction,
                ...(front.type === "enemy" ? styles.frontActionDanger : {}),
              }}>
                {front.type === "enemy" ? "Defender" : "Continuar"}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.mapShell}>
        <div style={styles.mapCard}>
          <div style={styles.mapCardHeader}>
            <div>
              <div style={styles.mapCardTitle}>Plano tactico del planeta</div>
              <div style={styles.mapCardSub}>
                El mapa reacciona al pasar el raton o al pulsar cada territorio.
              </div>
            </div>

            <div style={styles.legendRow}>
              <LegendChip label="Tuyo" color="#86efac" />
              <LegendChip label="Neutral" color="#cbd5e1" />
              <LegendChip label="Hostil" color="#fca5a5" />
              <LegendChip label="Frente rival" color="#f87171" />
              <LegendChip label="Operacion" color="#67e8f9" />
            </div>
          </div>

          <div style={styles.mapCanvas}>
            <svg
              viewBox="0 0 760 530"
              style={styles.mapSvg}
              role="img"
              aria-label={`Mapa de ${currentPlanetNote.title}`}
            >
              <defs>
                <linearGradient id="astraBg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06111d" />
                  <stop offset="55%" stopColor="#0a1224" />
                  <stop offset="100%" stopColor="#120c22" />
                </linearGradient>
                <radialGradient id="planetGlow" cx="50%" cy="45%" r="75%">
                  <stop offset="0%" stopColor="rgba(34,211,238,0.15)" />
                  <stop offset="65%" stopColor="rgba(168,85,247,0.07)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </radialGradient>
              </defs>

              <rect x="0" y="0" width="780" height="500" rx="28" fill="url(#astraBg)" />
              <circle cx="384" cy="248" r="208" fill="url(#planetGlow)" />
              <path
                d="M124 86 C228 30, 554 36, 672 130 C734 180, 734 330, 636 412 C536 490, 250 488, 130 420 C38 368, 24 184, 124 86 Z"
                fill="rgba(255,255,255,0.025)"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="2"
              />

              {regions.map((region) => {
                const isSelected = selectedRegion?.id === region.id;
                const isEventTarget = Number(activeTerritorialEvent?.territoryId) === Number(region.id);
                const state = getRegionState(region, playerName);
                const mapShape = region.mapShape || MAP_SHAPES[region.id];
                const enemyFront = getEnemyCampaignState(region);
                const ownFront = getCampaignState(region, playerName);
                const visualState = getSectorVisualState(region, playerName);

                if (!mapShape) return null;

                return (
                  <g
                    key={region.id}
                    onClick={() => onSelect?.(region)}
                    style={{ cursor: "pointer" }}
                  >
                    <path
                      d={createHexPath(mapShape.cx, mapShape.cy)}
                      fill={getFill(region, playerName)}
                      stroke={isEventTarget ? "#fde68a" : getStroke(region, isSelected, playerName)}
                      strokeWidth={isEventTarget ? 4.6 : isSelected ? 4 : 2.4}
                      opacity={state.risk ? 0.98 : 0.9}
                    />
                    <circle
                      cx={mapShape.cx}
                      cy={mapShape.cy}
                      r={state.risk ? 9 : 7}
                      fill={state.risk ? "#f87171" : region.controller === playerName ? "#4ade80" : !region.controller ? "#cbd5e1" : "#fbbf24"}
                      stroke="rgba(15,23,42,0.9)"
                      strokeWidth="3"
                    />
                    {(enemyFront || ownFront.progress > 0) && (
                      <circle
                        cx={mapShape.cx + 26}
                        cy={mapShape.cy - 28}
                        r="10"
                        fill={enemyFront ? "#ef4444" : "#22d3ee"}
                        stroke="rgba(15,23,42,0.9)"
                        strokeWidth="3"
                      />
                    )}
                    <text
                      x={mapShape.cx}
                      y={mapShape.cy - 18}
                      textAnchor="middle"
                      style={styles.mapLabel}
                    >
                      {MAP_LABELS[region.id] || region.regionName}
                    </text>
                    <text
                      x={mapShape.cx}
                      y={mapShape.cy + 22}
                      textAnchor="middle"
                      style={styles.mapSubLabel}
                    >
                      {getShortMapBonusLabel(region)}
                    </text>
                    <text
                      x={mapShape.cx}
                      y={mapShape.cy + 38}
                      textAnchor="middle"
                      style={{ ...styles.mapStateLabel, fill: visualState.color }}
                    >
                      {visualState.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {selectedRegion && (
          <div style={styles.detailCard}>
            <div style={styles.detailHeader}>
              <div>
                <div style={styles.detailTitle}>
                  {selectedRegion.regionIcon} {selectedRegion.regionName}
                </div>
                <div style={styles.detailSub}>
                  {selectedRegion.regionKind}
                  {selectedRegion.customName ? ` - nombre oficial: ${selectedRegion.officialName}` : ''}
                </div>
              </div>

              <div style={styles.detailBonusBadge}>{selectedRegion.regionBonusLabel}</div>
            </div>

            <div style={styles.statusLine}>
              <span>Dominio actual</span>
              <strong>{selectedRegion.controller || "Ninguno"}</strong>
            </div>

            {selectedSectorState && (
              <div style={styles.sectorStateBox}>
                <div>
                  <div style={styles.sectorStateKicker}>Estado del sector</div>
                  <div style={{ ...styles.sectorStateTitle, color: selectedSectorState.color }}>
                    {selectedSectorState.label}
                  </div>
                </div>
                <div style={styles.sectorStateText}>{selectedSectorState.detail}</div>
              </div>
            )}

            <div style={styles.detailText}>{selectedRegion.regionDescription}</div>

            {selectedMemoryLines.length > 0 && (
              <div style={styles.memoryBox}>
                <div style={styles.memoryTitle}>Memoria del sector</div>
                <div style={styles.memoryGrid}>
                  {selectedMemoryLines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </div>
              </div>
            )}

            {isSelectedMine && (
              <div style={styles.localInvestmentBox}>
                <div>
                  <div style={styles.localInvestmentTitle}>Inversion local</div>
                  <div style={styles.localInvestmentText}>
                    Mientras controles este sector, su recurso puede aportar bonus a tu red industrial.
                  </div>
                </div>
                <button
                  type="button"
                  style={styles.renameBtn}
                  onClick={() => {
                    const nextName = window.prompt("Nombre del sector", selectedRegion.customName || selectedRegion.officialName);
                    if (nextName === null) return;
                    onRenameTerritory?.(selectedRegion.id, nextName);
                  }}
                >
                  Renombrar
                </button>
              </div>
            )}

            {selectedRegion.lastPressureAttacker && (
              <div style={styles.pressureBox}>
                <div style={styles.pressureTitle}>Frente activo</div>
                <div style={styles.pressureText}>
                  {selectedRegion.lastPressureAttacker} presiono este sector recientemente:
                  +{formatResourceAmount(selectedRegion.lastPressureThreat)} amenaza
                  {Number(selectedRegion.lastPressureStabilityLoss || 0) > 0
                    ? ` - -${formatResourceAmount(selectedRegion.lastPressureStabilityLoss)} estabilidad`
                    : ''}.
                </div>
              </div>
            )}

            {isSelectedMine && (
              <div style={styles.controlBonusBox}>
                Control activo: las empresas de este recurso pueden recibir un bonus territorial de
                <strong> +{selectedTerritoryEconomyBonus}%</strong>.
              </div>
            )}

            {selectedEnemyCampaign && isSelectedMine && (
              <div style={styles.enemyCampaignBox}>
                <div style={styles.enemyCampaignTop}>
                  <div>
                    <div style={styles.enemyCampaignKicker}>Frente rival</div>
                    <div style={styles.enemyCampaignTitle}>{selectedEnemyCampaign.attackerName}</div>
                  </div>
                  <strong>{Math.round(selectedEnemyCampaign.progress)}%</strong>
                </div>
                <MiniBar value={selectedEnemyCampaign.progress} mode="danger" />
                <div style={styles.enemyCampaignText}>
                  Fase: {selectedEnemyCampaign.stage.label}. Si llega al 100%, el sector cae en manos rivales.
                </div>
                <button
                  style={styles.enemyCampaignBtn}
                  onClick={() => onDisruptEnemyCampaign?.(selectedRegion.id)}
                >
                  Cortar suministros (-6 cr)
                </button>
              </div>
            )}
            {isSelectedMine && (
              <div style={styles.fortBox}>
                <div style={styles.fortTitle}>Red defensiva oculta</div>
                <div style={styles.fortText}>
                  {selectedFortIsMaxed
                    ? "Fortificacion maxima alcanzada."
                    : `Coste: ${formatCost(selectedFortCost)}. Instala o mejora un activo oculto contra ataques fisicos, hackers, espias o presion legal.`}
                </div>
              </div>
            )}

            {isSelectedMine && selectedDefenseProfile && (
              <div style={styles.intelBox}>
                <div style={styles.intelTop}>
                  <div>
                    <div style={styles.intelKicker}>Defensas ocultas</div>
                    <div style={styles.intelTitle}>{selectedDefenseAssets.length || 0} activos instalados</div>
                  </div>
                  <strong>Caja negra</strong>
                </div>
                <div style={styles.defenseGrid}>
                  <QuickFact label="Fisica" value={`${selectedDefenseProfile.physical}%`} />
                  <QuickFact label="Hackers" value={`${selectedDefenseProfile.cyber}%`} />
                  <QuickFact label="Espias" value={`${selectedDefenseProfile.counterIntel}%`} />
                  <QuickFact label="Legal" value={`${selectedDefenseProfile.legal}%`} />
                  <QuickFact label="Social" value={`${selectedDefenseProfile.social}%`} />
                  <QuickFact label="Economica" value={`${selectedDefenseProfile.economic}%`} />
                </div>
                {selectedDefenseAssets.length > 0 && (
                  <div style={styles.assetList}>
                    {selectedDefenseAssets.slice(0, 6).map((asset) => (
                      <span key={`${asset.type}-${asset.level}`} style={styles.assetPill}>
                        {DEFENSE_ASSET_TYPES[asset.type]?.label || asset.type} {asset.level}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={styles.metricPanelGrid}>
              <MetricPanel
                title="Estabilidad"
                value={`${Math.round(selectedRegion.stability)}%`}
                helper="Si baja demasiado, el sector se vuelve fragil."
                progress={selectedRegion.stability}
                mode="good"
              />
              <MetricPanel
                title="Amenaza"
                value={`${Math.round(selectedRegion.threat)}%`}
                helper="Sube con el tiempo y puede forzar la perdida del control."
                progress={selectedRegion.threat}
                mode="danger"
              />
              <MetricPanel
                title="Fortificacion"
                value={`${Math.round(selectedRegion.fortification)}%`}
                helper="Reduce la presion futura y mejora el bonus territorial."
                progress={selectedRegion.fortification}
                mode="good"
              />
            </div>

            {selectedBattlePreview && (
              <div style={styles.tacticalBox}>
                <div style={styles.tacticalHeader}>
                  <span>Lectura tactica</span>
                  <strong>{selectedBattlePreview.outlook}</strong>
                </div>

                <div style={styles.tacticalGrid}>
                  <QuickFact label="Exito" value={`${selectedBattlePreview.successChance}%`} />
                  <QuickFact label="Ataque" value={`${selectedBattlePreview.attackPower}`} />
                  <QuickFact label="Defensa" value={`${selectedBattlePreview.defensePower}`} />
                </div>

                <div style={styles.tacticalText}>
                  La defensa depende de la estabilidad y la fortificacion reales. Si el sector es
                  hostil, puedes sabotearlo antes de lanzar la ofensiva.
                </div>
              </div>
            )}

            {selectedBattlePreview && selectedCampaign && (
              <div style={styles.campaignBox}>
                <div style={styles.campaignTop}>
                  <div>
                    <div style={styles.campaignKicker}>Operacion territorial</div>
                    <div style={styles.campaignTitle}>
                      {selectedOperation
                        ? selectedOperationEta > 0 ? "Preparacion en curso" : "Lista para resolver"
                        : selectedCampaign.stage.label}
                    </div>
                  </div>
                  <strong>{selectedOperation ? `${Math.round(selectedOperationProgress)}%` : `${Math.round(selectedCampaign.progress)}%`}</strong>
                </div>
                <MiniBar value={selectedOperation ? selectedOperationProgress : selectedCampaign.progress} />
                <div style={styles.campaignText}>
                  {selectedOperation
                    ? selectedOperationEta > 0
                      ? `Resolucion disponible en ${formatEta(selectedOperationEta)}. El rival no ve tu poder real salvo que tenga inteligencia previa.`
                      : "La operacion ya esta lista: pulsa resolver para intentar avanzar la conquista."
                    : `Siguiente fase: ${selectedCampaign.stage.next}. Cada fase se prepara durante horas antes de resolverse.`}
                </div>
              </div>
            )}

            {!isSelectedMine && selectedSabotageOperation && (
              <div style={styles.campaignBox}>
                <div style={styles.campaignTop}>
                  <div>
                    <div style={styles.campaignKicker}>Sabotaje encubierto</div>
                    <div style={styles.campaignTitle}>{selectedSabotageEta > 0 ? "Preparando celula" : "Listo para detonar"}</div>
                  </div>
                  <strong>{Math.round(selectedSabotageProgress)}%</strong>
                </div>
                <MiniBar value={selectedSabotageProgress} mode="danger" />
                <div style={styles.campaignText}>
                  {selectedSabotageEta > 0
                    ? `Faltan ${formatEta(selectedSabotageEta)}. Si la defensa rival tiene informantes o ciberseguridad, el efecto bajara.`
                    : "Pulsa sabotear para resolver la operacion y ver si abre una brecha real."}
                </div>
              </div>
            )}

            <div style={styles.quickFacts}>
              <QuickFact label="Economia" value={selectedRegion.regionBonusLabel} />
              <QuickFact
                label="Riesgo"
                value={
                  selectedRegion.threat >= 70 || selectedRegion.stability <= 30
                    ? "Critico"
                    : selectedRegion.threat >= 45 || selectedRegion.stability <= 50
                      ? "Tenso"
                      : "Controlado"
                }
              />
              <QuickFact
                label="Coste refuerzo"
                value={`${REINFORCE_COST} cr`}
              />
              <QuickFact
                label="Coste ofensiva"
                value={`${ATTACK_ENERGY_COST} EN - ${ATTACK_CREDIT_COST} cr`}
              />
            </div>

            <div style={styles.actions}>
              {isSelectedMine ? (
                <>
                  <button
                    style={{
                      ...styles.fortBtn,
                      ...(!canBuildSelectedFort ? styles.disabledBtn : {}),
                    }}
                    onClick={() => onBuildTerritoryFort?.(selectedRegion.id)}
                    disabled={!canBuildSelectedFort}
                    title={selectedFortIsMaxed ? "Fortificacion maxima" : formatCost(selectedFortCost)}
                  >
                    {selectedFortIsMaxed ? "Red maxima" : "Instalar defensa"}
                  </button>

                  <button
                    style={{
                      ...styles.secondaryBtn,
                      ...(!canAffordReinforce ? styles.disabledBtn : {}),
                    }}
                    onClick={() => onReinforce?.(selectedRegion.id)}
                    disabled={!canAffordReinforce}
                  >
                    Reforzar (-{REINFORCE_COST})
                  </button>
                </>
              ) : canAttackSelected ? (
                <button
                  style={{
                    ...styles.attackBtn,
                    ...(!canLaunchAttack ? styles.disabledBtn : {}),
                  }}
                  onClick={() => onBattle(selectedRegion)}
                  disabled={!canLaunchAttack}
                  title={
                    canLaunchAttack
                      ? "Lanzar ofensiva"
                      : !canAffordAttackEnergy
                        ? `Necesitas ${ATTACK_ENERGY_COST} de energia`
                        : `Necesitas ${ATTACK_CREDIT_COST} creditos`
                  }
                >
                  {canLaunchAttack
                    ? selectedOperation
                      ? selectedOperationEta > 0 ? "Operacion en curso" : "Resolver operacion"
                      : selectedCampaign?.progress > 0 ? "Preparar siguiente fase" : "Preparar conquista"
                    : !canAffordAttackEnergy
                      ? "Falta energia"
                      : "Falta credito"}
                </button>
              ) : (
                <button style={styles.neutralBtn} disabled>
                  Region neutral
                </button>
              )}

              {!isSelectedMine && selectedRegion.controller ? (
                <button
                  style={{
                    ...styles.secondaryBtn,
                    ...(!canLaunchSabotage ? styles.disabledBtn : {}),
                  }}
                  onClick={() => onSabotage?.(selectedRegion.id)}
                  disabled={!canLaunchSabotage}
                >
                  {selectedSabotageOperation
                    ? selectedSabotageEta > 0 ? "Sabotaje en curso" : "Resolver sabotaje"
                    : `Preparar sabotaje (-${SABOTAGE_COST})`}
                </button>
              ) : null}

              <button
                style={{
                  ...styles.voteBtn,
                  ...(!canStartElection ? styles.disabledBtn : {}),
                }}
                onClick={() => onStartElection(selectedRegion.id)}
                disabled={!canStartElection}
                title={
                  election?.active
                    ? "Ya hay un protocolo activo"
                    : !canAffordElectionLevel
                      ? `Necesitas nivel ${PROTOCOL_UNLOCK_LEVEL}`
                    : !canAffordElectionEnergy
                      ? `Necesitas ${PROTOCOL_ENERGY_COST} de energia`
                      : !canAffordElectionCredits
                        ? `Necesitas ${PROTOCOL_CREDIT_COST} creditos`
                        : "Convocar protocolo"
                }
              >
                {election?.active
                  ? "Protocolo en curso"
                  : !canAffordElectionLevel
                    ? `Nivel ${PROTOCOL_UNLOCK_LEVEL}`
                  : !canAffordElectionEnergy
                    ? "Falta energia"
                    : !canAffordElectionCredits
                      ? "Faltan creditos"
                      : "Iniciar protocolo"}
              </button>
            </div>

            <details style={styles.detailDisclosure}>
              <summary style={styles.detailDisclosureSummary}>Ayuda y reglas del sector</summary>
              <div style={styles.helperList}>
                <HelperItem text="Pulsa una zona del mapa para cambiar el foco." />
                <HelperItem text="Los sectores tuyos con amenaza alta o estabilidad baja entran en riesgo." />
                <HelperItem text="Defender bien una zona aumenta su valor economico." />
                <HelperItem text="Sabotear reduce estabilidad y fortificacion del enemigo antes del ataque." />
                {!canLaunchAttack && canAttackSelected ? (
                  <HelperItem
                    text={
                      !canAffordAttackEnergy
                        ? `Te faltan ${ATTACK_ENERGY_COST} de energia para iniciar la ofensiva.`
                        : `Necesitas al menos ${ATTACK_CREDIT_COST} creditos para lanzar la ofensiva.`
                    }
                  />
                ) : null}
                {!canStartElection && selectedRegion ? (
                  <HelperItem
                    text={
                      election?.active
                        ? "Ya hay un protocolo activo en otro sector."
                        : !canAffordElectionLevel
                          ? `Necesitas nivel ${PROTOCOL_UNLOCK_LEVEL} para abrir la via politica.`
                        : !canAffordElectionEnergy
                          ? `Te faltan ${PROTOCOL_ENERGY_COST} de energia para iniciar el protocolo.`
                          : `Necesitas ${PROTOCOL_CREDIT_COST} creditos para iniciar el protocolo.`
                    }
                  />
                ) : null}
                {canStartElection ? (
                  <HelperItem text="El protocolo sirve para disputar control politico sin lanzar una ofensiva directa." />
                ) : null}
              </div>
            </details>
          </div>
        )}
      </div>

      {battle && (
        <div style={styles.battle}>
          {battle.win ? (
            <div style={styles.win}>
              {battle.campaignCompleted
                ? `Victoria orbital - +${battle.rew} creditos`
                : `Operacion avanzada - ${Math.round(battle.progress || 0)}%`}
            </div>
          ) : (
            <div style={styles.lose}>Derrota tactica - inteligencia de operacion {Math.round(battle.progress || 0)}%</div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniPanel({ title, value, subtitle, color }) {
  return (
    <div style={styles.miniPanel}>
      <div style={styles.miniTitle}>{title}</div>
      <div style={{ ...styles.miniValue, color }}>{value}</div>
      <div style={styles.miniSubtitle}>{subtitle}</div>
    </div>
  );
}

function LegendChip({ label, color }) {
  return (
    <div style={styles.legendChip}>
      <span style={{ ...styles.legendDot, background: color }} />
      <span>{label}</span>
    </div>
  );
}

function MetricPanel({ title, value, helper, progress, mode }) {
  return (
    <div style={styles.metricPanel}>
      <div style={styles.metricPanelTop}>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
      <MiniBar value={progress} mode={mode} />
      <div style={styles.metricHelper}>{helper}</div>
    </div>
  );
}

function QuickFact({ label, value }) {
  return (
    <div style={styles.quickFact}>
      <div style={styles.quickFactLabel}>{label}</div>
      <div style={styles.quickFactValue}>{value}</div>
    </div>
  );
}

function HelperItem({ text }) {
  return <div style={styles.helperItem}>{text}</div>;
}

const styles = {
  wrapper: {
    display: "grid",
    gap: theme.spacing.lg,
  },
  intro: {
    display: "grid",
    gap: 8,
  },
  introBadge: {
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: theme.colors.cyan,
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  text: {
    color: theme.colors.textSoft,
    lineHeight: 1.7,
    maxWidth: 760,
  },
  planetFlavor: {
    marginTop: 8,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "7px 12px",
    borderRadius: 999,
    background: "rgba(34,211,238,0.1)",
    border: "1px solid rgba(34,211,238,0.18)",
    color: theme.colors.cyan,
    fontSize: 12,
    fontWeight: "bold",
  },
  tipBox: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    padding: 14,
    borderRadius: theme.radius.lg,
    background: theme.colors.panel,
    border: `1px solid ${theme.colors.border}`,
  },
  tipText: {
    color: theme.colors.textSoft,
    lineHeight: 1.6,
  },
  workBtn: {
    border: "none",
    background: theme.gradients.primary,
    color: theme.colors.bg,
    padding: "10px 14px",
    borderRadius: theme.radius.md,
    fontWeight: "bold",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  weeklyEventPanel: {
    display: "grid",
    gap: 12,
    padding: 14,
    borderRadius: theme.radius.lg,
    background: "rgba(245,158,11,0.09)",
    border: "1px solid rgba(251,191,36,0.2)",
  },
  weeklyEventKicker: {
    fontSize: 11,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: "#fde68a",
    fontWeight: "bold",
  },
  weeklyEventTitle: {
    marginTop: 4,
    fontSize: 17,
    color: theme.colors.text,
    fontWeight: "bold",
  },
  weeklyEventText: {
    marginTop: 5,
    fontSize: 13,
    color: "#fef3c7",
    lineHeight: 1.55,
  },
  weeklyEventMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: 8,
  },
  weeklyEventButton: {
    justifySelf: "start",
    border: "none",
    background: "rgba(245,158,11,0.2)",
    color: "#fde68a",
    padding: "9px 12px",
    borderRadius: theme.radius.md,
    fontWeight: "bold",
    cursor: "pointer",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 10,
  },
  miniPanel: {
    padding: 12,
    borderRadius: theme.radius.lg,
    background: theme.colors.panel,
    border: `1px solid ${theme.colors.border}`,
    display: "grid",
    gap: 4,
  },
  miniTitle: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: theme.colors.textMuted,
  },
  miniValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  miniSubtitle: {
    fontSize: 12,
    color: theme.colors.textSoft,
    lineHeight: 1.5,
  },
  operationBanner: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    background: "rgba(20,184,166,0.08)",
    border: "1px solid rgba(45,212,191,0.2)",
    flexWrap: "wrap",
  },
  operationBannerKicker: {
    fontSize: 10,
    color: "#5eead4",
    fontWeight: 900,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  operationBannerTitle: {
    marginTop: 3,
    color: "#f8fafc",
    fontSize: 13,
    fontWeight: 800,
    lineHeight: 1.4,
  },
  operationBannerFacts: {
    display: "flex",
    gap: 7,
    flexWrap: "wrap",
    color: "#ccfbf1",
    fontSize: 11,
    fontWeight: 900,
  },
  operationBannerFact: {
    padding: "5px 8px",
    borderRadius: 8,
    background: "rgba(15,23,42,0.45)",
    border: "1px solid rgba(94,234,212,0.16)",
  },
  nextStepBox: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(251,191,36,0.08)",
    border: "1px solid rgba(251,191,36,0.18)",
    color: "#fde68a",
    fontSize: 12,
    lineHeight: 1.4,
    flexWrap: "wrap",
  },
  operationQueue: {
    display: "grid",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    background: "rgba(15,23,42,0.55)",
    border: "1px solid rgba(148,163,184,0.14)",
  },
  operationResourceStrip: {
    display: "flex",
    gap: 7,
    flexWrap: "wrap",
    padding: "8px 10px",
    borderRadius: 10,
    background: "rgba(2,6,23,0.28)",
    border: "1px solid rgba(148,163,184,0.12)",
    color: "#cbd5e1",
    fontSize: 11,
    fontWeight: 900,
  },
  operationQueueHeader: {
    color: "#bae6fd",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  operationQueueGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 7,
  },
  operationQueueItem: {
    display: "grid",
    gridTemplateColumns: "10px minmax(0, auto) minmax(0, 1fr) auto",
    alignItems: "center",
    gap: 7,
    border: "1px solid rgba(34,211,238,0.16)",
    background: "rgba(8,47,73,0.16)",
    color: "#e0f2fe",
    borderRadius: 8,
    padding: "7px 8px",
    fontSize: 11,
    textAlign: "left",
    cursor: "pointer",
  },
  operationStateDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    display: "inline-block",
  },
  conflictStateBox: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    marginTop: 8,
    padding: "7px 8px",
    borderRadius: 8,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(148,163,184,0.12)",
    color: "#dbeafe",
    fontSize: 12,
    flexWrap: "wrap",
  },
  selectedActionBox: {
    display: "grid",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    background: "rgba(34,211,238,0.08)",
    border: "1px solid rgba(34,211,238,0.2)",
  },
  selectedActionKicker: {
    color: "#67e8f9",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  selectedActionText: {
    marginTop: 3,
    color: "#e0f2fe",
    fontSize: 12,
    lineHeight: 1.45,
  },
  selectedActionButtons: {
    display: "grid",
    gap: 8,
  },
  responseButtonGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 6,
  },
  smallActionBtn: {
    minHeight: 32,
    border: "1px solid rgba(148,163,184,0.18)",
    background: "rgba(15,23,42,0.5)",
    color: "#dbeafe",
    borderRadius: 8,
    padding: "6px 8px",
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
  },
  actionBlockReason: {
    color: "#fecaca",
    fontSize: 11,
    lineHeight: 1.35,
  },
  costHint: {
    color: "#94a3b8",
    fontSize: 11,
    lineHeight: 1.35,
  },
  responseActiveBox: {
    display: "flex",
    justifyContent: "space-between",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    background: "rgba(74,222,128,0.08)",
    border: "1px solid rgba(74,222,128,0.18)",
    color: "#dcfce7",
    fontSize: 12,
    flexWrap: "wrap",
  },
  frontSelectBtn: {
    appearance: "none",
    border: "none",
    background: "transparent",
    color: "inherit",
    padding: 0,
    textAlign: "left",
    cursor: "pointer",
    font: "inherit",
  },
  inlineFrontAction: {
    minHeight: 34,
    border: "1px solid rgba(34,211,238,0.28)",
    background: "rgba(34,211,238,0.14)",
    color: "#cffafe",
    borderRadius: 8,
    padding: "7px 10px",
    fontSize: 12,
    fontWeight: 900,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  frontPanel: {
    display: "grid",
    gap: 10,
    padding: 14,
    borderRadius: theme.radius.lg,
    background: "rgba(255,255,255,0.035)",
    border: `1px solid ${theme.colors.border}`,
  },
  frontPanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  frontTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  frontSub: {
    marginTop: 3,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  frontCount: {
    minWidth: 34,
    height: 28,
    borderRadius: 999,
    display: "grid",
    placeItems: "center",
    background: "rgba(248,113,113,0.14)",
    border: "1px solid rgba(248,113,113,0.2)",
    color: "#fecaca",
    fontWeight: "bold",
  },
  frontList: {
    display: "grid",
    gap: 8,
  },
  frontItem: {
    border: `1px solid ${theme.colors.border}`,
    background: "rgba(2,6,23,0.28)",
    color: theme.colors.text,
    borderRadius: 12,
    padding: 10,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto auto",
    gap: 10,
    alignItems: "center",
    textAlign: "left",
    cursor: "pointer",
  },
  frontName: {
    fontSize: 13,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  frontMeta: {
    marginTop: 3,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  frontStats: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
    justifyContent: "flex-end",
    fontSize: 10,
    color: "#cbd5e1",
    fontWeight: 700,
  },
  frontAction: {
    padding: "5px 8px",
    borderRadius: 999,
    background: "rgba(245,158,11,0.14)",
    border: "1px solid rgba(251,191,36,0.2)",
    color: "#fde68a",
    fontSize: 10,
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  frontActionDanger: {
    background: "rgba(248,113,113,0.14)",
    border: "1px solid rgba(248,113,113,0.22)",
    color: "#fecaca",
  },
  frontEmpty: {
    padding: 10,
    borderRadius: 12,
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.14)",
    color: "#bbf7d0",
    fontSize: 12,
  },
  adReinforcePanel: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: theme.radius.lg,
    background: "linear-gradient(90deg, rgba(245,158,11,0.13), rgba(34,211,238,0.09))",
    border: "1px solid rgba(251,191,36,0.22)",
    flexWrap: "wrap",
  },
  adReinforceKicker: {
    fontSize: 10,
    letterSpacing: 1.2,
    color: "#fde68a",
    fontWeight: 900,
  },
  adReinforceTitle: {
    marginTop: 3,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: 900,
  },
  adReinforceText: {
    marginTop: 3,
    color: theme.colors.textSoft,
    fontSize: 12,
    lineHeight: 1.45,
    maxWidth: 720,
  },
  adReinforceBtn: {
    border: "none",
    background: "linear-gradient(90deg,#f59e0b,#06b6d4)",
    color: "#031018",
    padding: "10px 14px",
    borderRadius: theme.radius.md,
    fontWeight: 900,
    cursor: "pointer",
    minWidth: 180,
    boxShadow: "0 10px 24px rgba(6,182,212,0.16)",
  },
  sectorEventPanel: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: 12,
    alignItems: "center",
    padding: 12,
    borderRadius: theme.radius.lg,
    background: "linear-gradient(90deg, rgba(34,197,94,0.12), rgba(56,189,248,0.08))",
    border: "1px solid rgba(74,222,128,0.2)",
  },
  sectorEventKicker: {
    fontSize: 10,
    color: "#86efac",
    fontWeight: 900,
    letterSpacing: 1,
  },
  sectorEventTitle: {
    marginTop: 3,
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: 900,
  },
  sectorEventText: {
    marginTop: 4,
    color: theme.colors.textSoft,
    fontSize: 12,
    lineHeight: 1.45,
  },
  sectorEventActions: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
  sectorEventButton: {
    border: "1px solid rgba(125,211,252,0.25)",
    background: "rgba(14,165,233,0.1)",
    color: "#bae6fd",
    padding: "8px 10px",
    borderRadius: 8,
    fontWeight: 800,
    cursor: "pointer",
  },
  sectorEventButtonPrimary: {
    border: "none",
    background: "linear-gradient(90deg,#22c55e,#06b6d4)",
    color: "#031018",
    padding: "8px 10px",
    borderRadius: 8,
    fontWeight: 900,
    cursor: "pointer",
  },
  sectorEventGhost: {
    border: "1px solid rgba(148,163,184,0.2)",
    background: "rgba(15,23,42,0.35)",
    color: "#cbd5e1",
    padding: "8px 10px",
    borderRadius: 8,
    fontWeight: 800,
    cursor: "pointer",
  },
  mapShell: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.45fr) minmax(300px, 0.95fr)",
    gap: 14,
    alignItems: "start",
  },
  mapCard: {
    display: "grid",
    gap: 12,
    padding: 14,
    borderRadius: theme.radius.lg,
    background: theme.colors.panel,
    border: `1px solid ${theme.colors.border}`,
  },
  mapCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  mapCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  mapCardSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 3,
  },
  legendRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  legendChip: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 9px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${theme.colors.border}`,
    color: theme.colors.textSoft,
    fontSize: 11,
    fontWeight: 700,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  mapCanvas: {
    borderRadius: 20,
    overflow: "hidden",
    border: `1px solid rgba(255,255,255,0.06)`,
    background: "rgba(2,6,23,0.55)",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.03), 0 20px 40px rgba(2,6,23,0.28)",
  },
  mapSvg: {
    width: "100%",
    height: "auto",
    display: "block",
  },
  mapLabel: {
    fill: "#e2e8f0",
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: 0,
    paintOrder: "stroke",
    stroke: "rgba(2,6,23,0.8)",
    strokeWidth: 3,
  },
  mapSubLabel: {
    fill: "#cbd5e1",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0,
    paintOrder: "stroke",
    stroke: "rgba(2,6,23,0.9)",
    strokeWidth: 3,
  },
  mapStateLabel: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 0,
    paintOrder: "stroke",
    stroke: "rgba(2,6,23,0.95)",
    strokeWidth: 3,
  },
  detailCard: {
    display: "grid",
    gap: 12,
    padding: 14,
    borderRadius: theme.radius.lg,
    background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(8,15,29,0.92))",
    border: `1px solid ${theme.colors.border}`,
    position: "sticky",
    top: 8,
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
    lineHeight: 1.12,
  },
  detailSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  detailBonusBadge: {
    padding: "6px 10px",
    borderRadius: 999,
    background: "rgba(34,211,238,0.12)",
    border: "1px solid rgba(34,211,238,0.2)",
    color: theme.colors.cyan,
    fontWeight: "bold",
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  statusLine: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    color: theme.colors.textSoft,
    fontSize: 13,
  },
  detailText: {
    fontSize: 13,
    lineHeight: 1.6,
    color: theme.colors.textSoft,
  },
  sectorStateBox: {
    display: "grid",
    gridTemplateColumns: "minmax(110px, 0.8fr) minmax(0, 1.2fr)",
    gap: 10,
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    background: "rgba(15,23,42,0.56)",
    border: "1px solid rgba(148,163,184,0.16)",
  },
  sectorStateKicker: {
    color: "#94a3b8",
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  sectorStateTitle: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: 900,
  },
  sectorStateText: {
    color: "#cbd5e1",
    fontSize: 12,
    lineHeight: 1.4,
  },
  memoryBox: {
    display: "grid",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    background: "rgba(34,211,238,0.07)",
    border: "1px solid rgba(34,211,238,0.14)",
  },
  memoryTitle: {
    color: "#67e8f9",
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  memoryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 6,
    color: "#d9f8ff",
    fontSize: 11,
    lineHeight: 1.3,
  },
  localInvestmentBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(74,222,128,0.16)",
  },
  localInvestmentTitle: {
    fontSize: 12,
    color: "#bbf7d0",
    fontWeight: 900,
  },
  localInvestmentText: {
    marginTop: 3,
    color: "#dcfce7",
    fontSize: 12,
    lineHeight: 1.45,
  },
  renameBtn: {
    border: "1px solid rgba(74,222,128,0.26)",
    background: "rgba(34,197,94,0.1)",
    color: "#bbf7d0",
    padding: "7px 9px",
    borderRadius: 8,
    fontWeight: 800,
    cursor: "pointer",
    flexShrink: 0,
  },
  pressureBox: {
    padding: 12,
    borderRadius: 12,
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.18)",
    display: "grid",
    gap: 4,
  },
  pressureTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#fecaca",
    fontWeight: "bold",
  },
  pressureText: {
    fontSize: 13,
    color: "#fee2e2",
    lineHeight: 1.5,
  },
  enemyCampaignBox: {
    display: "grid",
    gap: 9,
    padding: 12,
    borderRadius: 12,
    background: "rgba(248,113,113,0.09)",
    border: "1px solid rgba(248,113,113,0.2)",
  },
  enemyCampaignTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    color: "#fecaca",
  },
  enemyCampaignKicker: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: "#fca5a5",
    fontWeight: 900,
  },
  enemyCampaignTitle: {
    marginTop: 2,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: 900,
  },
  enemyCampaignText: {
    fontSize: 12,
    color: "#fee2e2",
    lineHeight: 1.5,
  },
  enemyCampaignBtn: {
    border: "none",
    background: "rgba(248,113,113,0.18)",
    color: "#fecaca",
    padding: "9px 12px",
    borderRadius: theme.radius.md,
    fontWeight: "bold",
    cursor: "pointer",
  },
  controlBonusBox: {
    padding: 12,
    borderRadius: 12,
    background: "rgba(34,197,94,0.08)",
    border: "1px solid rgba(34,197,94,0.16)",
    color: "#dcfce7",
    fontSize: 13,
    lineHeight: 1.55,
  },
  taxBox: {
    padding: 12,
    borderRadius: 12,
    background: "rgba(245,158,11,0.09)",
    border: "1px solid rgba(251,191,36,0.18)",
    display: "grid",
    gap: 4,
  },
  taxTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#fde68a",
    fontWeight: "bold",
  },
  taxText: {
    fontSize: 13,
    color: "#fef3c7",
    lineHeight: 1.5,
  },
  fortBox: {
    padding: 12,
    borderRadius: 12,
    background: "rgba(56,189,248,0.08)",
    border: "1px solid rgba(56,189,248,0.18)",
    display: "grid",
    gap: 4,
  },
  fortTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "#bae6fd",
    fontWeight: "bold",
  },
  fortText: {
    fontSize: 13,
    color: "#dbeafe",
    lineHeight: 1.5,
  },
  intelBox: {
    padding: 12,
    borderRadius: 12,
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(125,211,252,0.18)",
    display: "grid",
    gap: 10,
  },
  intelTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    color: "#bae6fd",
  },
  intelKicker: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: "#67e8f9",
    fontWeight: 900,
  },
  intelTitle: {
    marginTop: 2,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: 900,
  },
  defenseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 8,
  },
  assetList: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap",
  },
  assetPill: {
    padding: "5px 8px",
    borderRadius: 8,
    background: "rgba(34,211,238,0.09)",
    border: "1px solid rgba(34,211,238,0.16)",
    color: "#cffafe",
    fontSize: 11,
    fontWeight: 800,
  },
  metricPanelGrid: {
    display: "grid",
    gap: 10,
  },
  metricPanel: {
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${theme.colors.border}`,
    display: "grid",
    gap: 8,
  },
  metricPanelTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    fontSize: 12,
    color: theme.colors.textSoft,
  },
  metricHelper: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 1.5,
  },
  barTrack: {
    height: 8,
    borderRadius: 999,
    background: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.35s ease",
  },
  switchBox: {
    display: "grid",
    gap: 4,
    padding: 12,
    borderRadius: 12,
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${theme.colors.border}`,
  },
  switchTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: theme.colors.textMuted,
  },
  switchText: {
    fontSize: 13,
    color: theme.colors.textSoft,
    lineHeight: 1.55,
  },
  tacticalBox: {
    display: "grid",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    background: "rgba(248,113,113,0.08)",
    border: "1px solid rgba(248,113,113,0.18)",
  },
  tacticalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    fontSize: 12,
    color: "#fecaca",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  tacticalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
  },
  tacticalText: {
    fontSize: 12,
    color: "#fca5a5",
    lineHeight: 1.55,
  },
  campaignBox: {
    display: "grid",
    gap: 9,
    padding: 12,
    borderRadius: 12,
    background: "rgba(34,211,238,0.08)",
    border: "1px solid rgba(34,211,238,0.18)",
  },
  campaignTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    color: "#bae6fd",
  },
  campaignKicker: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: "#7dd3fc",
    fontWeight: 900,
  },
  campaignTitle: {
    marginTop: 2,
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: 900,
  },
  campaignText: {
    fontSize: 12,
    color: "#dbeafe",
    lineHeight: 1.5,
  },
  quickFacts: {
    display: "grid",
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
    gap: 8,
  },
  quickFact: {
    padding: 10,
    borderRadius: 10,
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${theme.colors.border}`,
  },
  quickFactLabel: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  quickFactValue: {
    fontSize: 12,
    color: theme.colors.text,
    fontWeight: 700,
    lineHeight: 1.4,
  },
  actions: {
    display: "grid",
    gap: 8,
  },
  primaryBtn: {
    border: "none",
    background: "rgba(124,58,237,0.22)",
    color: "#ddd6fe",
    padding: "10px 14px",
    borderRadius: theme.radius.md,
    fontWeight: "bold",
    cursor: "pointer",
  },
  secondaryBtn: {
    border: "none",
    background: "rgba(34,197,94,0.18)",
    color: "#86efac",
    padding: "10px 14px",
    borderRadius: theme.radius.md,
    fontWeight: "bold",
    cursor: "pointer",
  },
  attackBtn: {
    border: "none",
    background: "rgba(248,113,113,0.18)",
    color: "#fecaca",
    padding: "10px 14px",
    borderRadius: theme.radius.md,
    fontWeight: "bold",
    cursor: "pointer",
  },
  neutralBtn: {
    border: "none",
    background: "rgba(148,163,184,0.12)",
    color: "#94a3b8",
    padding: "10px 14px",
    borderRadius: theme.radius.md,
    fontWeight: "bold",
    cursor: "not-allowed",
  },
  fortBtn: {
    border: "none",
    background: "rgba(56,189,248,0.16)",
    color: "#bae6fd",
    padding: "10px 14px",
    borderRadius: theme.radius.md,
    fontWeight: "bold",
    cursor: "pointer",
  },  taxBtn: {
    border: "none",
    background: "rgba(245,158,11,0.18)",
    color: "#fde68a",
    padding: "10px 14px",
    borderRadius: theme.radius.md,
    fontWeight: "bold",
    cursor: "pointer",
  },
  voteBtn: {
    border: "none",
    background: "rgba(56,189,248,0.16)",
    color: "#bae6fd",
    padding: "10px 14px",
    borderRadius: theme.radius.md,
    fontWeight: "bold",
    cursor: "pointer",
  },
  disabledBtn: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  disabledButton: {
    opacity: 0.48,
    cursor: "not-allowed",
    filter: "grayscale(0.35)",
  },
  primaryAction: {
    minHeight: 34,
    padding: "8px 11px",
    borderRadius: 8,
    border: "none",
    background: "linear-gradient(90deg,#22c55e,#06b6d4)",
    color: "#fff",
    fontSize: 12,
    fontWeight: 900,
  },
  secondaryAction: {
    minHeight: 34,
    padding: "8px 11px",
    borderRadius: 8,
    border: "1px solid rgba(125,211,252,0.24)",
    background: "rgba(14,165,233,0.10)",
    color: "#bae6fd",
    fontSize: 12,
    fontWeight: 900,
  },
  helperList: {
    display: "grid",
    gap: 6,
  },
  helperItem: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 1.45,
    paddingLeft: 12,
    position: "relative",
  },
  detailDisclosure: {
    borderRadius: 10,
    background: "rgba(15,23,42,0.42)",
    border: "1px solid rgba(148,163,184,0.12)",
    overflow: "hidden",
  },
  detailDisclosureSummary: {
    padding: "8px 10px",
    color: "#94a3b8",
    fontSize: 11,
    fontWeight: 900,
    cursor: "pointer",
    listStyle: "none",
  },
  battle: {
    padding: 12,
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.panel,
  },
  win: {
    color: "#86efac",
    fontWeight: "bold",
  },
  lose: {
    color: "#fda4af",
    fontWeight: "bold",
  },
};

export default MapView;






