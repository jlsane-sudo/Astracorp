import React, { useEffect, useMemo, useState } from "react";
import { theme } from "../theme";
import { getXpNeededForLevel } from "../utils/xp";

export default function DailySummary({ save, myAdShare = 0 }) {
  const player = save?.player || {};
  const inventory = save?.inventory || {};
  const companies = Array.isArray(save?.companies) ? save.companies : [];
  const activeJob = save?.activeJob || null;

  const credits = Number(player?.credits ?? 0);
  const energy = Number(player?.energy ?? 0);
  const maxEnergy = Number(player?.maxEnergy ?? 100);
  const xp = Number(player?.xp ?? 0);
  const level = Number(player?.level ?? 1);
  const pct = Number(player?.pct ?? 1);

  const resources = {
    water: Number(inventory?.water ?? 0),
    energyCells: Number(inventory?.energy_cells ?? 0),
    mineral: Number(inventory?.mineral ?? 0),
    purifiedWater: Number(inventory?.purified_water ?? 0),
    metalComponents: Number(inventory?.metal_components ?? 0),
    oxygenTanks: Number(inventory?.oxygen_tanks ?? 0),
    alloyFrames: Number(inventory?.alloy_frames ?? 0),
    habitatModules: Number(inventory?.habitat_modules ?? 0),
  };

  const storedProduction = companies.reduce((acc, company) => acc + Number(company?.storage ?? 0), 0);
  const totalStorage = companies.reduce((acc, company) => acc + Number(company?.maxStorage ?? 0), 0);
  const storagePct = totalStorage > 0 ? Math.min(100, (storedProduction / totalStorage) * 100) : 0;

  const fullCompanies = companies.filter((company) => {
    const storage = Number(company?.storage ?? 0);
    const maxStorage = Number(company?.maxStorage ?? 0);
    return maxStorage > 0 && storage >= maxStorage * 0.95;
  }).length;

  const nearFullCompanies = companies.filter((company) => {
    const storage = Number(company?.storage ?? 0);
    const maxStorage = Number(company?.maxStorage ?? 0);
    return maxStorage > 0 && storage >= maxStorage * 0.75 && storage < maxStorage * 0.95;
  }).length;

  const tier1Count = companies.filter((company) => {
    const type = company?.companyType || company?.type || "";
    return ["dew_collector", "solar_panel", "surface_mine"].includes(type);
  }).length;

  const tier2Count = companies.filter((company) => {
    const type = company?.companyType || company?.type || "";
    return ["water_purifier", "smelter"].includes(type);
  }).length;

  const tier3Count = companies.filter((company) => {
    const type = company?.companyType || company?.type || "";
    return ["electrolysis_plant", "industrial_forge", "habitat_factory"].includes(type);
  }).length;

  const energyPct = maxEnergy > 0 ? Math.min(100, (energy / maxEnergy) * 100) : 0;
  const xpNeeded = getXpNeededForLevel(level);
  const xpPct = Math.min(100, (xp / xpNeeded) * 100);

  const nextGoal = getNextGoal({
    level,
    companiesCount: companies.length,
    tier1Count,
    tier2Count,
    tier3Count,
    credits,
    ...resources,
  });

  const unlockInfo = getUnlockInfo(level, tier3Count);
  const recommendation = getRecommendation({
    level,
    credits,
    companiesCount: companies.length,
    tier1Count,
    tier2Count,
    tier3Count,
    fullCompanies,
    ...resources,
  });
  const priorityMessage = getPriorityMessage(level, tier1Count, tier2Count, tier3Count);
  const alerts = getAlerts({
    activeJob,
    companiesCount: companies.length,
    fullCompanies,
    nearFullCompanies,
    energy,
    maxEnergy,
    tier2Count,
    tier3Count,
    ...resources,
  });

  const quickStats = [
    { title: "Creditos", value: formatCompact(credits), sub: "Liquidez", color: theme.colors.cyan, icon: "$" },
    {
      title: "Energia",
      value: `${formatAmount(energy)}/${formatAmount(maxEnergy)}`,
      sub: `${energyPct.toFixed(0)}%`,
      color: theme.colors.violet,
      icon: "EN",
      progress: energyPct,
    },
    {
      title: "Nivel",
      value: `${level}`,
      sub: `${xp}/${xpNeeded} XP`,
      color: theme.colors.amber,
      icon: "XP",
      progress: xpPct,
    },
    {
      title: "Empresas",
      value: `${companies.length}`,
      sub: `L1 ${tier1Count} · L2 ${tier2Count} · L3 ${tier3Count}`,
      color: theme.colors.pink,
      icon: "HQ",
    },
  ];

  const resourceCards = [
    { icon: "H2O", title: "Agua", value: resources.water, color: theme.colors.cyan, tone: resources.water < 3 ? "warn" : "ok" },
    { icon: "ELE", title: "Electricidad", value: resources.energyCells, color: theme.colors.violet, tone: resources.energyCells < 3 ? "warn" : "ok" },
    { icon: "MIN", title: "Mineral", value: resources.mineral, color: theme.colors.amber, tone: resources.mineral < 3 ? "warn" : "ok" },
    { icon: "PWA", title: "Purificada", value: resources.purifiedWater, color: "#67e8f9", tone: resources.purifiedWater < 2 ? "warn" : "ok" },
    { icon: "CMP", title: "Componentes", value: resources.metalComponents, color: "#c4b5fd", tone: resources.metalComponents < 2 ? "warn" : "ok" },
    { icon: "HAB", title: "Habitats", value: resources.habitatModules, color: "#86efac", tone: resources.habitatModules < 1 ? "warn" : "ok" },
  ];

  return (
    <section style={styles.wrapper}>
      <div style={styles.heroCard}>
        <div style={styles.heroTop}>
          <div>
            <div style={styles.heroBadge}>CENTRO DE MANDO</div>
            <div style={styles.heroTitle}>Estado de la colonia</div>
            <div style={styles.heroText}>
              Vista rapida de produccion, progreso y prioridades operativas.
            </div>
          </div>

          <div style={styles.heroMiniGrid}>
            <HeroMiniCard
              label="Produccion guardada"
              value={formatAmount(storedProduction)}
              sub={totalStorage > 0 ? `${storagePct.toFixed(0)}% del total` : "Sin capacidad"}
              color={theme.colors.cyan}
            />
            <HeroMiniCard
              label="Empresas llenas"
              value={`${fullCompanies}`}
              sub={fullCompanies > 0 ? "Recoge ya" : "Bajo control"}
              color={fullCompanies > 0 ? theme.colors.rose : theme.colors.text}
            />
            <HeroMiniCard
              label="Reparto ads"
              value={`${Number(myAdShare ?? 0).toFixed(4)} EUR`}
              sub={`${pct.toFixed(1)}% de control`}
              color={theme.colors.violet}
            />
          </div>
        </div>
      </div>

      <ActiveJobSummary activeJob={activeJob} />

      {alerts.length > 0 && (
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>Alertas rapidas</div>
          <div style={styles.alertGrid}>
            {alerts.map((alert, index) => (
              <AlertCard key={`${alert.title}-${index}`} {...alert} />
            ))}
          </div>
        </div>
      )}

      <div style={styles.kpiGrid}>
        {quickStats.map((item) => (
          <KpiCard key={item.title} {...item} />
        ))}
      </div>

      <div style={styles.grid2}>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>Recursos clave</div>
          <div style={styles.resourceGrid}>
            {resourceCards.map((resource) => (
              <CompactResourceCard key={resource.title} {...resource} />
            ))}
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionTitle}>Estado industrial</div>
          <div style={styles.metricCard}>
            <MiniLine label="Carga total" value={`${formatAmount(storedProduction)} / ${formatAmount(totalStorage)}`} />
            <ProgressBar value={storagePct} color="cyan" />
            <MiniLine label="Infraestructura basica" value={tier1Count} />
            <MiniLine label="Industria procesada" value={tier2Count} />
            <MiniLine label="Industria avanzada" value={tier3Count} />
            <MiniLine label="Stock premium" value={formatAmount(resources.oxygenTanks + resources.alloyFrames + resources.habitatModules)} />
          </div>
        </div>
      </div>

      <div style={styles.grid2}>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>Siguiente objetivo</div>
          <FocusCard title={nextGoal.title} text={nextGoal.text} />
          <div style={styles.infoList}>
            <MiniLine label="Produccion pendiente" value={formatAmount(storedProduction)} />
            <MiniLine label="Empresas casi llenas" value={nearFullCompanies} />
            <MiniLine label="Empresas llenas" value={fullCompanies} highlight={fullCompanies > 0} />
            <MiniLine label="Ciclo actual" value={Number(save?.day ?? 1)} />
          </div>
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionTitle}>Proximo desbloqueo</div>
          <FocusCard title={unlockInfo.title} text={unlockInfo.text} alt />
          <div style={styles.statusStrip}>
            <div style={styles.statusStripLabel}>Estado actual</div>
            <div style={styles.statusStripValue}>{unlockInfo.progress}</div>
          </div>
        </div>
      </div>

      <div style={styles.grid2}>
        <div style={styles.panel}>
          <div style={styles.sectionTitle}>Recomendacion inmediata</div>
          <div style={styles.textCard}>{recommendation}</div>
        </div>

        <div style={styles.panel}>
          <div style={styles.sectionTitle}>Prioridad estrategica</div>
          <div style={styles.textCard}>{priorityMessage}</div>
        </div>
      </div>
    </section>
  );
}

function ActiveJobSummary({ activeJob }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!activeJob?.endAt) return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [activeJob?.endAt]);

  const progress = useMemo(() => {
    if (!activeJob?.startedAt || !activeJob?.endAt) {
      return { remainingMs: 0, progressPct: 0 };
    }

    const startedAt = Number(activeJob.startedAt ?? 0);
    const endAt = Number(activeJob.endAt ?? 0);
    const totalMs = Math.max(1, endAt - startedAt);
    const remainingMs = Math.max(0, endAt - now);
    const doneMs = Math.max(0, totalMs - remainingMs);

    return {
      remainingMs,
      progressPct: Math.min(100, Math.max(0, (doneMs / totalMs) * 100)),
    };
  }, [activeJob, now]);

  if (!activeJob) {
    return (
      <div style={styles.panel}>
        <div style={styles.emptyTitle}>Sin trabajo activo</div>
        <div style={styles.emptyText}>No hay ninguna operacion en curso.</div>
      </div>
    );
  }

  return (
    <div style={styles.panel}>
      <div style={styles.activeJobTop}>
        <div>
          <div style={styles.activeJobTitle}>{activeJob.label}</div>
          <div style={styles.activeJobSubtitle}>Trabajo activo · Nivel {activeJob.unlockLevel}</div>
        </div>
        <div style={styles.badge}>EN MARCHA</div>
      </div>

      <div style={styles.jobGrid}>
        <JobMiniStat label="Tiempo" value={formatRemaining(progress.remainingMs)} color={theme.colors.cyan} />
        <JobMiniStat label="Avance" value={`${progress.progressPct.toFixed(0)}%`} color={theme.colors.violet} />
        <JobMiniStat label="Creditos" value={`+${Number(activeJob.credits ?? 0).toFixed(2)}`} color={theme.colors.amber} />
        <JobMiniStat label="Recurso" value={getActiveJobResourceLabel(activeJob.item)} color={theme.colors.pink} />
      </div>

      <div style={styles.progressWrap}>
        <div style={styles.progressTop}>
          <span style={styles.progressLabel}>Avance de operacion</span>
          <span style={styles.progressValue}>{progress.progressPct.toFixed(0)}%</span>
        </div>
        <ProgressBar value={progress.progressPct} color="cyan" />
      </div>
    </div>
  );
}

function HeroMiniCard({ label, value, sub, color }) {
  return (
    <div style={styles.heroMiniCard}>
      <div style={styles.heroMiniLabel}>{label}</div>
      <div style={{ ...styles.heroMiniValue, color }}>{value}</div>
      <div style={styles.heroMiniSub}>{sub}</div>
    </div>
  );
}

function AlertCard({ icon, title, text, tone }) {
  const palette = {
    danger: { bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.18)", color: "#fda4af" },
    warn: { bg: "rgba(250,204,21,0.08)", border: "rgba(250,204,21,0.18)", color: "#fde68a" },
    info: { bg: "rgba(34,211,238,0.08)", border: "rgba(34,211,238,0.18)", color: "#67e8f9" },
  };
  const current = palette[tone] || palette.info;

  return (
    <div style={{ ...styles.alertCard, background: current.bg, border: `1px solid ${current.border}` }}>
      <div style={styles.alertTop}>
        <div style={styles.alertIcon}>{icon}</div>
        <div style={{ ...styles.alertTitle, color: current.color }}>{title}</div>
      </div>
      <div style={styles.alertText}>{text}</div>
    </div>
  );
}

function KpiCard({ title, value, sub, color, icon, progress }) {
  return (
    <div style={styles.kpiCard}>
      <div style={styles.kpiTop}>
        <div style={styles.kpiIcon}>{icon}</div>
        <div style={styles.kpiTitle}>{title}</div>
      </div>
      <div style={{ ...styles.kpiValue, color }}>{value}</div>
      <div style={styles.kpiSub}>{sub}</div>
      {typeof progress === "number" && <ProgressBar value={progress} color="violet" compact />}
    </div>
  );
}

function CompactResourceCard({ icon, title, value, color, tone }) {
  return (
    <div style={{ ...styles.resourceCard, ...(tone === "warn" ? styles.resourceCardWarn : null) }}>
      <div style={styles.resourceTop}>
        <div style={styles.resourceIcon}>{icon}</div>
        <div style={styles.resourceTitle}>{title}</div>
      </div>
      <div style={{ ...styles.resourceValue, color }}>{formatAmount(value)}</div>
    </div>
  );
}

function JobMiniStat({ label, value, color }) {
  return (
    <div style={styles.jobMiniStat}>
      <div style={styles.jobMiniLabel}>{label}</div>
      <div style={{ ...styles.jobMiniValue, color }}>{value}</div>
    </div>
  );
}

function FocusCard({ title, text, alt = false }) {
  return (
    <div style={alt ? styles.focusCardAlt : styles.focusCard}>
      <div style={styles.focusTitle}>{title}</div>
      <div style={styles.focusText}>{text}</div>
    </div>
  );
}

function MiniLine({ label, value, highlight = false }) {
  return (
    <div style={styles.miniLine}>
      <span style={styles.miniLineLabel}>{label}</span>
      <strong style={{ ...styles.miniLineValue, color: highlight ? "#fda4af" : theme.colors.text }}>
        {value}
      </strong>
    </div>
  );
}

function ProgressBar({ value, color = "cyan", compact = false }) {
  const safeValue = Math.max(0, Math.min(100, Number(value ?? 0)));
  const palette = {
    cyan: "linear-gradient(90deg, rgba(34,211,238,0.95), rgba(6,182,212,0.95))",
    violet: "linear-gradient(90deg, rgba(168,85,247,0.95), rgba(34,211,238,0.95))",
  };

  return (
    <div style={{ ...styles.progressBarBg, height: compact ? 8 : 12 }}>
      <div style={{ ...styles.progressBarFill, width: `${safeValue}%`, background: palette[color] || palette.cyan }} />
    </div>
  );
}

function getAlerts({
  activeJob,
  companiesCount,
  fullCompanies,
  nearFullCompanies,
  energy,
  maxEnergy,
  water,
  energyCells,
  mineral,
  purifiedWater,
  metalComponents,
  tier2Count,
  tier3Count,
}) {
  const alerts = [];
  const energyPct = maxEnergy > 0 ? (energy / maxEnergy) * 100 : 0;

  if (companiesCount === 0) {
    alerts.push({ icon: "HQ", title: "Sin empresas", text: "Tu colonia todavia no produce por si sola. Construye la primera cuanto antes.", tone: "danger" });
  }
  if (fullCompanies > 0) {
    alerts.push({ icon: "BOX", title: `${fullCompanies} almacen(es) llenos`, text: "Recoge produccion ya para no frenar la cadena.", tone: "danger" });
  } else if (nearFullCompanies > 0) {
    alerts.push({ icon: "ETA", title: `${nearFullCompanies} casi llenas`, text: "Pronto tendras que recoger produccion.", tone: "warn" });
  }
  if (energyPct <= 25) {
    alerts.push({ icon: "EN", title: "Energia baja", text: "Tu margen operativo es corto para trabajos y acciones rapidas.", tone: "warn" });
  }
  if (!activeJob) {
    alerts.push({ icon: "JOB", title: "Sin trabajo activo", text: "Puedes iniciar una operacion para ganar creditos y XP.", tone: "info" });
  }
  if (tier2Count > 0 && (water <= 0 || energyCells <= 0 || mineral <= 0)) {
    alerts.push({ icon: "IN", title: "Faltan inputs base", text: "La industria procesada puede frenarse por falta de recursos basicos.", tone: "warn" });
  }
  if (tier3Count > 0 && (purifiedWater <= 0 || metalComponents <= 0)) {
    alerts.push({ icon: "T3", title: "Cadena avanzada frenada", text: "Revisa purificacion y componentes para sostener el nivel 3.", tone: "warn" });
  }

  return alerts.slice(0, 4);
}

function getUnlockInfo(level, tier3Count) {
  if (level < 2) {
    return {
      title: "Trabajos industriales de nivel 2",
      text: "Al llegar a nivel 2 desbloquearas operaciones con mejor paga y recursos procesados.",
      progress: "Te falta llegar a nivel 2",
    };
  }
  if (level < 3) {
    return {
      title: "Industria avanzada de nivel 3",
      text: "Al llegar a nivel 3 desbloquearas electrolisis, forja industrial y fabrica de habitats.",
      progress: "Te falta llegar a nivel 3",
    };
  }
  if (tier3Count <= 0) {
    return {
      title: "Primera empresa de nivel 3",
      text: "Ya has desbloqueado la fase avanzada. El siguiente salto real es construirla.",
      progress: "Nivel 3 activo · pendiente de construir",
    };
  }
  return {
    title: "Optimizacion de cadena completa",
    text: "Ya tienes activa la progresion principal. Ahora toca optimizar entradas, tiempos y reinversion.",
    progress: "Cadena basica, procesada y avanzada activa",
  };
}

function getNextGoal({ level, companiesCount, tier1Count, tier2Count, tier3Count, water, energyCells, mineral, purifiedWater, metalComponents, oxygenTanks, alloyFrames, habitatModules, credits }) {
  if (companiesCount === 0) {
    return { title: "Construir tu primera empresa", text: "Levanta una infraestructura basica de nivel 1 para empezar a producir sin depender solo del trabajo activo." };
  }
  if (level < 2) {
    return { title: "Subir a nivel 2", text: "Haz mas trabajos y gana experiencia. El siguiente desbloqueo importante son las operaciones industriales." };
  }
  if (tier1Count < 2) {
    return { title: "Asegurar materias primas", text: "Refuerza agua, electricidad y mineral antes de comprar el pasaje orbital." };
  }
  if (level < 3) {
    return { title: "Subir a nivel 3", text: "Ya puedes entrar en industria procesada, pero el salto fuerte llega al nivel 3." };
  }
  if (tier2Count === 0) {
    return { title: "Entrar en empresas de nivel 2", text: "Construye una planta de purificacion o una fundicion para abrir la fase procesada." };
  }
  if (water <= 0 || energyCells <= 0 || mineral <= 0) {
    return { title: "Reforzar inputs basicos", text: "Tus empresas necesitan agua, electricidad y mineral disponibles para vender al mercado." };
  }
  if (tier3Count === 0) {
    return { title: "Activar industria avanzada", text: "Ya estas preparado para electrolisis, forja industrial o fabrica de habitats." };
  }
  if (purifiedWater <= 0 || metalComponents <= 0) {
    return { title: "Asegurar inputs procesados", text: "La industria avanzada depende de productos refinados estables." };
  }
  if (oxygenTanks + alloyFrames < 4) {
    return { title: "Acumular stock avanzado", text: "Crea una reserva de oxigeno y aleaciones antes de vender demasiado." };
  }
  if (habitatModules < 2) {
    return { title: "Consolidar producto final", text: "Tu siguiente objetivo es generar mas modulos de habitat y cerrar la cadena premium." };
  }
  if (credits < 40) {
    return { title: "Monetizar produccion premium", text: "Vender parte del stock avanzado puede darte liquidez para seguir ampliando." };
  }
  return { title: "Expandir industria regional", text: "Tu colonia ya produce, transforma y ensambla. Ahora toca especializar y optimizar margenes." };
}

function getRecommendation({ level, credits, companiesCount, tier1Count, tier2Count, tier3Count, water, energyCells, mineral, purifiedWater, metalComponents, oxygenTanks, alloyFrames, habitatModules, fullCompanies }) {
  if (companiesCount === 0) return "Empieza por Empresas y construye una base productiva inicial.";
  if (fullCompanies > 0) return "Recoge primero la produccion acumulada. Ahora mismo es la accion mas rentable.";
  if (level < 2) return "Tu prioridad real es subir a nivel 2 con trabajos para desbloquear mejores operaciones.";
  if (tier1Count < 2) return "Refuerza todavia la base de materias primas antes de sofisticar la colonia.";
  if (level < 3) return "Sigue empujando experiencia. El nivel 3 es el gran salto de la economia.";
  if (tier2Count === 0) return "Construye ya tu primera empresa de nivel 2 para abrir la fase procesada.";
  if (water < 3) return "Tu agua esta baja. Reforzarla evitara frenos en la cadena.";
  if (energyCells < 3) return "Tu electricidad industrial esta justa. Un refuerzo ahora evita cuellos de botella.";
  if (mineral < 3) return "Tu mineral esta bajo para sostener expansion y fundicion.";
  if (tier3Count === 0) return "Ya estas listo para abrir una empresa de nivel 3 y entrar en recursos premium.";
  if (purifiedWater < 2) return "Refuerza agua purificada antes de escalar mas la industria avanzada.";
  if (metalComponents < 2) return "Los componentes metalicos se te pueden quedar cortos para mantener ritmo.";
  if (oxygenTanks + alloyFrames < 3) return "Consolida primero una pequena reserva avanzada antes de vender mucho.";
  if (habitatModules < 1) return "Tu siguiente hito claro es sacar al menos un modulo de habitat.";
  if (credits < 15) return "Necesitas algo mas de liquidez. Vender parte del stock premium puede ser buena idea.";
  return "Tu colonia esta en una fase solida. Ahora conviene optimizar que reinviertes y que vendes.";
}

function getPriorityMessage(level, tier1Count, tier2Count, tier3Count) {
  if (level < 2) return "Subir de nivel con trabajos basicos. Aun no compensa complicar la estrategia.";
  if (level < 3) return "Combina trabajos e industria basica para acelerar el salto al nivel 3.";
  if (tier2Count === 0) return "Construir tu primera empresa de nivel 2.";
  if (tier3Count === 0) return "Construir tu primera empresa de nivel 3.";
  if (tier1Count < tier2Count) return "Refuerza un poco mas la base de inputs. La transformacion sin base se frena.";
  return "Optimiza la cadena completa: producir, refinar, ensamblar y vender con criterio.";
}

function getActiveJobResourceLabel(item) {
  if (item === "water") return "Agua";
  if (item === "energy_cells") return "Electricidad";
  if (item === "mineral") return "Mineral";
  if (item === "purified_water") return "Purificada";
  if (item === "metal_components") return "Componentes";
  if (item === "oxygen_tanks") return "Oxigeno";
  if (item === "alloy_frames") return "Aleaciones";
  if (item === "habitat_modules") return "Habitats";
  return "Recurso";
}

function formatRemaining(ms) {
  const totalSec = Math.ceil(Math.max(0, Number(ms ?? 0)) / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function formatAmount(value) {
  const n = Number(value ?? 0);
  return Number.isInteger(n) ? `${n}` : n.toFixed(2);
}

function formatCompact(value) {
  return Number(value ?? 0).toLocaleString("es-ES", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

const styles = {
  wrapper: {
    display: "grid",
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  heroCard: {
    background: theme.colors.panel,
    border: `1px solid ${theme.colors.borderStrong}`,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
  },
  heroTop: {
    display: "grid",
    gridTemplateColumns: "1.15fr 0.85fr",
    gap: theme.spacing.lg,
    alignItems: "start",
  },
  heroBadge: {
    display: "inline-block",
    marginBottom: 10,
    padding: "5px 10px",
    borderRadius: theme.radius.pill,
    fontSize: theme.font.tiny,
    letterSpacing: 1.2,
    color: theme.colors.cyan,
    border: "1px solid rgba(34,211,238,0.20)",
    background: "rgba(34,211,238,0.08)",
  },
  heroTitle: {
    fontSize: theme.font.title,
    fontWeight: "bold",
    marginBottom: 8,
    background: theme.gradients.title,
    WebkitBackgroundClip: "text",
    color: "transparent",
    letterSpacing: 1,
  },
  heroText: {
    fontSize: theme.font.subtitle,
    color: theme.colors.textSoft,
    lineHeight: 1.65,
  },
  heroMiniGrid: {
    display: "grid",
    gap: 10,
  },
  heroMiniCard: {
    background: theme.colors.panelSoft,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  heroMiniLabel: {
    fontSize: theme.font.small,
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  heroMiniValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  heroMiniSub: {
    marginTop: 6,
    fontSize: theme.font.small,
    color: theme.colors.textSoft,
  },
  panel: {
    background: theme.colors.panel,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    display: "grid",
    gap: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.font.subtitle,
    fontWeight: "bold",
    color: theme.colors.cyan,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  alertGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: theme.spacing.md,
  },
  alertCard: {
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    display: "grid",
    gap: 8,
  },
  alertTop: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  alertIcon: {
    fontSize: 14,
    fontWeight: "bold",
  },
  alertTitle: {
    fontWeight: "bold",
    fontSize: theme.font.body,
  },
  alertText: {
    color: theme.colors.textSoft,
    lineHeight: 1.6,
    fontSize: theme.font.small,
  },
  kpiGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: theme.spacing.md,
  },
  kpiCard: {
    background: theme.colors.panel,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    display: "grid",
    gap: 8,
  },
  kpiTop: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  kpiIcon: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.md,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${theme.colors.border}`,
    fontSize: 12,
    fontWeight: "bold",
  },
  kpiTitle: {
    fontSize: theme.font.small,
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: "bold",
  },
  kpiSub: {
    fontSize: theme.font.small,
    color: theme.colors.textSoft,
    lineHeight: 1.5,
  },
  grid2: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: theme.spacing.md,
  },
  resourceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: theme.spacing.md,
  },
  resourceCard: {
    background: theme.colors.panelSoft,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    display: "grid",
    gap: 8,
  },
  resourceCardWarn: {
    boxShadow: "0 0 0 1px rgba(250,204,21,0.14)",
  },
  resourceTop: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  resourceIcon: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.md,
    display: "grid",
    placeItems: "center",
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${theme.colors.border}`,
    fontSize: 11,
    fontWeight: "bold",
  },
  resourceTitle: {
    fontSize: theme.font.body,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  resourceValue: {
    fontSize: 22,
    fontWeight: "bold",
  },
  metricCard: {
    background: theme.colors.panelSoft,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    display: "grid",
    gap: 10,
  },
  focusCard: {
    background: theme.colors.panelSoft,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  focusCardAlt: {
    background: "rgba(34,211,238,0.04)",
    border: "1px solid rgba(34,211,238,0.12)",
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: 8,
  },
  focusText: {
    fontSize: theme.font.body,
    color: theme.colors.textSoft,
    lineHeight: 1.7,
  },
  infoList: {
    display: "grid",
    gap: 10,
  },
  statusStrip: {
    background: "rgba(34,211,238,0.04)",
    border: "1px solid rgba(34,211,238,0.10)",
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  statusStripLabel: {
    fontSize: theme.font.small,
    color: theme.colors.textMuted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  statusStripValue: {
    fontSize: theme.font.body,
    fontWeight: "bold",
    color: theme.colors.cyan,
  },
  textCard: {
    background: theme.colors.panelSoft,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    color: theme.colors.textSoft,
    lineHeight: 1.8,
    fontSize: theme.font.body,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  emptyText: {
    color: theme.colors.textSoft,
    lineHeight: 1.6,
  },
  activeJobTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    alignItems: "flex-start",
  },
  activeJobTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.text,
  },
  activeJobSubtitle: {
    marginTop: 4,
    fontSize: theme.font.small,
    color: theme.colors.textMuted,
  },
  badge: {
    padding: "6px 10px",
    borderRadius: theme.radius.pill,
    fontSize: theme.font.tiny,
    fontWeight: "bold",
    color: theme.colors.cyan,
    border: "1px solid rgba(34,211,238,0.18)",
    background: "rgba(34,211,238,0.08)",
    whiteSpace: "nowrap",
  },
  jobGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    gap: theme.spacing.md,
  },
  jobMiniStat: {
    background: theme.colors.panelSoft,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  jobMiniLabel: {
    fontSize: theme.font.small,
    color: theme.colors.textMuted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  jobMiniValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  progressWrap: {
    display: "grid",
    gap: 8,
  },
  progressTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  progressLabel: {
    fontSize: theme.font.small,
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  progressValue: {
    fontSize: theme.font.small,
    fontWeight: "bold",
    color: theme.colors.cyan,
  },
  progressBarBg: {
    height: 12,
    borderRadius: 999,
    background: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    border: `1px solid ${theme.colors.border}`,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
    transition: "width 0.35s ease",
  },
  miniLine: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 8,
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  miniLineLabel: {
    fontSize: theme.font.body,
    color: theme.colors.textMuted,
  },
  miniLineValue: {
    fontSize: theme.font.body,
  },
};
