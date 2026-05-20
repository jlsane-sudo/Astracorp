import { useEffect, useMemo, useRef, useState } from "react";
import {
  PLANETS,
  STARTER_PLANET_ID,
  getPlanetUnlockStatus,
} from "../data/planets";
import { planetAssets } from "../assets/generated/assets";

const RESOURCE_LABELS = {
  water: "Agua",
  energy_cells: "Electricidad",
  mineral: "Mineral",
  purified_water: "Agua purificada",
  metal_components: "Componentes metalicos",
  oxygen_tanks: "Tanques de oxigeno",
  alloy_frames: "Estructuras de aleacion",
  habitat_modules: "Modulos de habitat",
};

export default function PlanetSelectionScreen({
  onSelect,
  onCancel = null,
  save = null,
  currentPlanetId = STARTER_PLANET_ID,
}) {
  const [selectedId, setSelectedId] = useState(currentPlanetId || STARTER_PLANET_ID);
  const [hoveredId, setHoveredId] = useState(null);

  const selectedPlanet = useMemo(
    () => PLANETS.find((planet) => planet.id === selectedId) || PLANETS[0],
    [selectedId]
  );

  const selectedStatus = useMemo(
    () => getPlanetUnlockStatus(selectedPlanet, save),
    [selectedPlanet, save]
  );

  const currentProgress = selectedStatus?.progress || {};
  const requirements = selectedPlanet?.unlock || {};
  const isCurrentPlanet = currentPlanetId === selectedPlanet?.id;
  const canTravel = Boolean(selectedStatus?.unlocked) && !isCurrentPlanet;
  const travelCost = Number(selectedPlanet?.travelCost ?? 0);
  const credits = Number(save?.player?.credits ?? 0);
  const travelResources = Array.isArray(selectedPlanet?.travelResources) ? selectedPlanet.travelResources : [];
  const canAffordResources = travelResources.every((item) => Number(save?.inventory?.[item.key] ?? 0) >= Number(item.amount ?? 0));
  const canAffordTravel = credits >= travelCost && canAffordResources;
  const confirmDisabled = !selectedPlanet || isCurrentPlanet || !canTravel || !canAffordTravel;
  const visibleRequirements = [
    { label: "Nivel", current: currentProgress.level, required: requirements.level },
    { label: "Creditos", current: currentProgress.credits, required: requirements.credits },
    { label: "Empresas", current: currentProgress.companies, required: requirements.companies },
    { label: "Contratos", current: currentProgress.contracts, required: requirements.contracts },
    {
      label: "Contratos territoriales",
      current: currentProgress.territoryContracts,
      required: requirements.territoryContracts,
    },
    { label: "Territorios", current: currentProgress.territories, required: requirements.territories },
    { label: "Sede", current: currentProgress.hqLevel, required: requirements.hqLevel },
    {
      label: "Investigacion",
      current: currentProgress.researchTotal,
      required: requirements.researchTotal,
    },
  ].filter((item) => Number(item.required ?? 0) > 0);

  const formatProgress = (label, current, required) =>
    `${label}: ${Number(current ?? 0).toLocaleString("es-ES")} / ${Number(
      required ?? 0
    ).toLocaleString("es-ES")}`;

  const formatTravelResources = (resources = []) => {
    if (!resources.length) return "Sin productos";
    return resources.map((item) => {
      const owned = Number(save?.inventory?.[item.key] ?? 0);
      const label = RESOURCE_LABELS[item.key] || item.key;
      return `${Number(item.amount ?? 0).toLocaleString("es-ES")} ${label} (${owned.toLocaleString("es-ES")})`;
    }).join(" + ");
  };

  const getPlanetVisual = (planet) => {
    switch (planet.id) {
      case "nexus-prime":
        return {
          background: `
            radial-gradient(circle at 28% 26%, rgba(255,255,255,0.34), transparent 14%),
            radial-gradient(circle at 35% 30%, ${planet.colorA}, ${planet.colorB} 76%)
          `,
          texture: `
            repeating-linear-gradient(
              18deg,
              rgba(255,255,255,0.08) 0px,
              rgba(255,255,255,0.08) 7px,
              transparent 7px,
              transparent 16px
            ),
            radial-gradient(circle at 68% 58%, rgba(0,0,0,0.18) 0 14%, transparent 15%),
            radial-gradient(circle at 42% 72%, rgba(255,255,255,0.07) 0 9%, transparent 10%)
          `,
          clouds: `
            radial-gradient(circle at 28% 42%, rgba(255,255,255,0.12) 0 7%, transparent 8%),
            radial-gradient(circle at 60% 28%, rgba(255,255,255,0.08) 0 9%, transparent 10%)
          `,
          shadow:
            "linear-gradient(120deg, transparent 0%, transparent 40%, rgba(0,0,0,0.34) 100%)",
        };
      case "veyron":
        return {
          background: `
            radial-gradient(circle at 26% 24%, rgba(255,255,255,0.28), transparent 14%),
            radial-gradient(circle at 35% 30%, ${planet.colorA}, ${planet.colorB} 76%)
          `,
          texture: `
            repeating-linear-gradient(
              0deg,
              rgba(255,255,255,0.12) 0px,
              rgba(255,255,255,0.12) 6px,
              rgba(0,0,0,0.08) 6px,
              rgba(0,0,0,0.08) 13px
            ),
            radial-gradient(circle at 62% 36%, rgba(255,255,255,0.10) 0 12%, transparent 13%)
          `,
          clouds: `
            radial-gradient(circle at 26% 48%, rgba(255,255,255,0.10) 0 7%, transparent 8%),
            radial-gradient(circle at 72% 44%, rgba(255,255,255,0.09) 0 8%, transparent 9%)
          `,
          shadow:
            "linear-gradient(115deg, transparent 0%, transparent 46%, rgba(0,0,0,0.28) 100%)",
        };
      case "kryos":
        return {
          background: `
            radial-gradient(circle at 30% 24%, rgba(255,255,255,0.40), transparent 13%),
            linear-gradient(145deg, #d9ecff 0%, ${planet.colorA} 38%, ${planet.colorB} 100%)
          `,
          texture: `
            radial-gradient(circle at 24% 40%, rgba(255,255,255,0.16) 0 8%, transparent 9%),
            radial-gradient(circle at 72% 30%, rgba(255,255,255,0.10) 0 11%, transparent 12%),
            linear-gradient(
              135deg,
              transparent 0%,
              rgba(255,255,255,0.10) 22%,
              transparent 40%,
              rgba(0,0,0,0.08) 58%,
              transparent 80%
            )
          `,
          clouds: `
            radial-gradient(circle at 34% 55%, rgba(255,255,255,0.16) 0 7%, transparent 8%),
            radial-gradient(circle at 64% 62%, rgba(255,255,255,0.10) 0 8%, transparent 9%)
          `,
          shadow:
            "linear-gradient(128deg, transparent 0%, transparent 44%, rgba(0,0,0,0.30) 100%)",
        };
      default:
        return {
          background: `
            radial-gradient(circle at 28% 24%, rgba(255,255,255,0.30), transparent 14%),
            radial-gradient(circle at 35% 30%, ${planet.colorA}, ${planet.colorB} 76%)
          `,
          texture: `
            radial-gradient(circle at 22% 35%, rgba(255,255,255,0.10) 0 9%, transparent 10%),
            radial-gradient(circle at 68% 55%, rgba(0,0,0,0.15) 0 14%, transparent 15%),
            radial-gradient(circle at 48% 72%, rgba(255,255,255,0.08) 0 8%, transparent 9%)
          `,
          clouds: `
            radial-gradient(circle at 28% 44%, rgba(255,255,255,0.14) 0 7%, transparent 8%),
            radial-gradient(circle at 60% 28%, rgba(255,255,255,0.10) 0 9%, transparent 10%)
          `,
          shadow:
            "linear-gradient(120deg, transparent 0%, transparent 42%, rgba(0,0,0,0.34) 100%)",
        };
    }
  };

  return (
    <div style={{ ...styles.page, ...(onCancel ? styles.pageModal : null) }}>
      <div style={styles.starsA} />
      <div style={styles.starsB} />
      <div style={styles.astraLeft} />
      <div style={styles.astraRight} />
      <div style={styles.glowTop} />

      <div style={{ ...styles.content, ...(onCancel ? styles.contentModal : null) }}>
        {onCancel && (
          <button type="button" style={styles.closeButton} onClick={onCancel}>
            Cerrar
          </button>
        )}

        <div style={styles.header}>
          <h1 style={styles.title}>
            {onCancel ? "Rutas interplanetarias" : "Trayectoria planetaria"}
          </h1>
          <p style={styles.subtitle}>
            Empiezas en Nexus Prime y el resto del sistema se abre al escalar.
            Cada salto mejora algo, pero cuesta mucho mas que el anterior.
          </p>
        </div>

        <div style={styles.grid}>
          {PLANETS.map((planet, index) => {
            const unlockStatus = getPlanetUnlockStatus(planet, save);
            const unlocked = unlockStatus.unlocked;
            const isCurrent = currentPlanetId === planet.id;
            const active = selectedId === planet.id;
            const hovered = hoveredId === planet.id;
            const visual = getPlanetVisual(planet);
            const planetImage = planetAssets[planet.id];

            return (
              <button
                key={planet.id}
                type="button"
                onClick={() => setSelectedId(planet.id)}
                onMouseEnter={() => setHoveredId(planet.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  ...styles.card,
                  ...(active ? styles.cardActive : {}),
                  ...(!unlocked && !isCurrent ? styles.cardLocked : {}),
                  transform: hovered
                    ? "translateY(-8px) scale(1.03)"
                    : active
                    ? "translateY(-4px) scale(1.01)"
                    : "translateY(0) scale(1)",
                  animationDelay: `${index * 0.08}s`,
                }}
              >
                {!unlocked && !isCurrent && (
                  <div style={styles.lockOverlay}>BLOQUEADO</div>
                )}

                <div
                  style={{
                    ...styles.planetWrap,
                    filter:
                      hovered || active
                        ? "drop-shadow(0 0 18px rgba(255,255,255,0.10))"
                        : "none",
                  }}
                >
                  {!planetImage && <div style={styles.ringBack} />}
                  <div
                    style={{
                      ...styles.planet,
                      background: planetImage ? "transparent" : visual.background,
                      animation: planetImage ? "none" : styles.planet.animation,
                      boxShadow: `
                        inset -18px -18px 30px rgba(0,0,0,0.34),
                        inset 10px 10px 18px rgba(255,255,255,0.06),
                        0 0 28px ${planet.colorA}55
                      `,
                      overflow: planetImage ? "visible" : "hidden",
                    }}
                  >
                    {planetImage ? (
                      <PlanetOrb planet={planet} />
                    ) : (
                      <>
                        <div style={{ ...styles.planetTexture, background: visual.texture }} />
                        <div style={{ ...styles.planetClouds, background: visual.clouds }} />
                        <div style={{ ...styles.planetShadow, background: visual.shadow }} />
                        <div style={styles.planetAtmosphere} />
                        <div style={styles.planetGlow} />
                        <div style={styles.planetShine} />
                      </>
                    )}
                  </div>
                  {!planetImage && <div style={styles.ring} />}
                </div>

                <div style={styles.name}>{planet.name}</div>
                <div style={styles.type}>{planet.subtitle}</div>
                <div style={styles.desc}>{planet.description}</div>

                <div style={styles.perkList}>
                  {(planet.perks || []).map((perk) => (
                    <div key={`${planet.id}-${perk}`} style={styles.perkItem}>
                      {perk}
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    ...styles.statusPill,
                    ...(isCurrent
                      ? styles.statusCurrent
                      : unlocked
                      ? styles.statusUnlocked
                      : styles.statusLocked),
                  }}
                >
                  {isCurrent ? "Actual" : unlocked ? "Desbloqueado" : "Bloqueado"}
                </div>

                <div style={styles.travelCost}>
                  Viaje: {Number(planet.travelCost ?? 0).toLocaleString("es-ES")} creditos
                </div>
              </button>
            );
          })}
        </div>

        <div style={styles.bottom}>
          <div style={styles.selectionBox}>
            <div style={styles.selectionTitle}>
              Planeta seleccionado: <strong>{selectedPlanet.name}</strong>
            </div>

            <div style={styles.selectionDesc}>{selectedPlanet.description}</div>

            <div style={styles.metrics}>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Estado</div>
                <div style={styles.metricValue}>
                  {isCurrentPlanet
                    ? "Base actual"
                    : selectedStatus.unlocked
                    ? "Listo para viajar"
                    : "Aun bloqueado"}
                </div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Coste de viaje</div>
                <div style={styles.metricValue}>
                  {travelCost.toLocaleString("es-ES")} creditos
                </div>
              </div>
              <div style={styles.metricCard}>
                <div style={styles.metricLabel}>Tus creditos</div>
                <div style={styles.metricValue}>
                  {credits.toLocaleString("es-ES")}
                </div>
              </div>
            </div>

            <div style={styles.requirementsBox}>
              <div style={styles.requirementsTitle}>Progreso hacia este planeta</div>
              <div style={styles.requirementsGrid}>
                {visibleRequirements.length > 0 ? (
                  visibleRequirements.map((item) => (
                    <div key={item.label} style={styles.requirementItem}>
                      {formatProgress(item.label, item.current, item.required)}
                    </div>
                  ))
                ) : (
                  <div style={styles.requirementItem}>Sin requisitos adicionales</div>
                )}
              </div>
              <div style={styles.requirementItem}>Productos de viaje: {formatTravelResources(travelResources)}</div>
            </div>

            {!selectedStatus.unlocked && selectedStatus.missing.length > 0 && (
              <div style={styles.missingBox}>
                Te falta: {selectedStatus.missing.join(" - ")}
              </div>
            )}

            {selectedStatus.unlocked && !canAffordTravel && !isCurrentPlanet && (
              <div style={styles.missingBox}>
                Tienes el acceso desbloqueado, pero aun no llegas al coste del viaje o sus productos.
              </div>
            )}

            <div style={styles.actions}>
              <button
                type="button"
                style={{
                  ...styles.confirm,
                  ...(confirmDisabled ? styles.confirmDisabled : null),
                }}
                onClick={() => onSelect(selectedPlanet)}
                disabled={confirmDisabled}
              >
                {isCurrentPlanet
                  ? "Planeta actual"
                  : !selectedStatus.unlocked
                  ? "Bloqueado"
                  : !canAffordTravel
                  ? "Creditos insuficientes"
                  : `Comprar billete y viajar a ${selectedPlanet.name}`}
              </button>

              {onCancel && (
                <button type="button" style={styles.cancel} onClick={onCancel}>
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanetOrb({ planet }) {
  const canvasRef = useRef(null);
  const visual = useMemo(() => getDetailedPlanetVisual(planet), [planet]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const size = 128;
    const radius = 62;
    const center = size / 2;
    const ctx = canvas.getContext("2d", { alpha: true });
    let frameId = 0;

    canvas.width = size;
    canvas.height = size;

    const render = (time) => {
      const image = ctx.createImageData(size, size);
      const rotation = (time / 1000) * visual.speed;
      const cloudRotation = rotation * 1.28;
      const light = normalize3([-0.48, -0.58, 0.66]);

      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const dx = (x - center) / radius;
          const dy = (y - center) / radius;
          const dist2 = dx * dx + dy * dy;
          const offset = (y * size + x) * 4;

          if (dist2 > 1) {
            image.data[offset + 3] = 0;
            continue;
          }

          const z = Math.sqrt(1 - dist2);
          const normal = normalize3([dx, dy, z]);
          const longitude = Math.atan2(normal[2], normal[0]) + rotation;
          const latitude = Math.asin(clamp(-normal[1], -1, 1));
          const color = samplePlanetColor(visual, longitude, latitude, cloudRotation);
          const lightAmount = clamp(dot3(normal, light), 0, 1);
          const shade = 0.18 + lightAmount * 0.98;
          const limb = Math.pow(1 - z, 1.55);
          const atmosphere = Math.pow(1 - dist2, 0.24);

          image.data[offset] = clamp255(color[0] * shade + visual.rimRgb[0] * limb * 0.28 + 7 * atmosphere);
          image.data[offset + 1] = clamp255(color[1] * shade + visual.rimRgb[1] * limb * 0.28 + 8 * atmosphere);
          image.data[offset + 2] = clamp255(color[2] * shade + visual.rimRgb[2] * limb * 0.28 + 10 * atmosphere);
          image.data[offset + 3] = clamp255(232 + z * 23);
        }
      }

      ctx.clearRect(0, 0, size, size);
      ctx.putImageData(image, 0, 0);
      frameId = requestAnimationFrame(render);
    };

    frameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frameId);
  }, [planet.id, visual]);

  return (
    <>
      <canvas ref={canvasRef} style={styles.generatedPlanetCanvas} aria-hidden="true" />
      <div style={{ ...styles.generatedPlanetAura, boxShadow: `0 0 24px ${visual.rim}44` }} />
    </>
  );
}

function getDetailedPlanetVisual(planet) {
  const commonShapes = [
    { d: "M-18 82 C34 52 72 58 112 86 C154 116 196 112 248 82 L248 128 C196 154 152 150 108 124 C64 98 24 100 -18 130 Z", fill: planet.colorB, opacity: 0.44 },
    { d: "M-26 136 C34 116 76 126 116 150 C156 174 196 170 246 140 L246 186 C190 205 146 194 102 170 C58 146 18 150 -26 178 Z", fill: "#020617", opacity: 0.24 },
  ];
  const commonClouds = [
    { d: "M-20 72 C34 54 72 58 122 74 C166 88 204 86 248 68 L248 84 C202 102 158 102 112 86 C68 70 32 68 -20 88 Z", fill: "#ffffff", opacity: 0.22 },
    { d: "M-22 128 C30 112 82 116 134 132 C174 144 206 142 246 126 L246 142 C202 160 164 160 124 146 C78 130 32 130 -22 146 Z", fill: "#ffffff", opacity: 0.16 },
  ];
  const commonBands = [
    { d: "M12 91 C62 82 154 82 208 92", stroke: "#ffffff", width: 2, opacity: 0.09 },
    { d: "M10 116 C60 126 160 126 210 116", stroke: "#020617", width: 3, opacity: 0.12 },
    { d: "M28 142 C78 154 146 154 192 142", stroke: "#ffffff", width: 1.5, opacity: 0.08 },
  ];
  const visuals = {
    "nexus-prime": {
      light: "#ecfeff", rim: "#67e8f9", noise: "0.018 0.055", seed: 7, duration: 34,
      matrix: "0 0 0 0 0.20 0 0 0 0 0.82 0 0 0 0 0.95 0 0 0 .46 0",
      landOpacity: 0.86, cloudOpacity: 0.86, bandOpacity: 0.72, bands: commonBands,
      shapes: [
        ...commonShapes,
        { d: "M54 72 C82 58 120 64 148 82 C118 92 88 94 54 72 Z", fill: "#dff9ff", opacity: 0.38 },
        { d: "M118 142 C144 130 176 134 206 152 C176 164 144 162 118 142 Z", fill: "#67e8f9", opacity: 0.26 },
      ],
      clouds: commonClouds,
    },
    veyron: {
      light: "#fff7bc", rim: "#fde68a", noise: "0.026 0.08", seed: 12, duration: 42,
      matrix: "0 0 0 0 0.75 0 0 0 0 0.42 0 0 0 0 0.08 0 0 0 .52 0",
      landOpacity: 0.92, cloudOpacity: 0.32, bandOpacity: 0.92,
      bands: [
        { d: "M6 80 C58 66 162 66 214 82", stroke: "#fde68a", width: 3, opacity: 0.18 },
        { d: "M4 107 C58 122 164 122 216 108", stroke: "#451a03", width: 4, opacity: 0.18 },
        { d: "M18 139 C70 150 154 150 204 140", stroke: "#fef3c7", width: 2, opacity: 0.12 },
      ],
      shapes: [
        { d: "M-20 92 C34 54 84 54 130 82 C174 108 206 104 248 78 L248 126 C196 150 154 146 112 120 C70 94 28 100 -20 136 Z", fill: "#5c3409", opacity: 0.58 },
        { d: "M-26 152 C36 124 92 136 144 158 C184 176 216 170 248 154 L248 194 C198 210 154 202 108 180 C58 156 12 164 -26 188 Z", fill: "#facc15", opacity: 0.2 },
        { d: "M56 82 C84 70 112 74 138 90 C104 104 78 102 56 82 Z", fill: "#fff3b0", opacity: 0.26 },
      ],
      clouds: [{ d: "M-20 118 C40 104 92 108 144 120 C188 130 216 128 248 116 L248 128 C208 144 166 146 122 134 C74 122 28 122 -20 134 Z", fill: "#fff7ed", opacity: 0.18 }],
    },
    solara: {
      light: "#f0fff4", rim: "#bbf7d0", noise: "0.022 0.06", seed: 19, duration: 28,
      matrix: "0 0 0 0 0.14 0 0 0 0 0.78 0 0 0 0 0.26 0 0 0 .48 0",
      landOpacity: 0.88, cloudOpacity: 0.52, bandOpacity: 0.7, bands: commonBands,
      shapes: [
        ...commonShapes.map((shape) => ({ ...shape, fill: shape.fill === "#020617" ? "#052e16" : "#166534", opacity: shape.opacity })),
        { d: "M38 96 C74 70 112 76 150 106 C118 132 78 128 38 96 Z", fill: "#fef08a", opacity: 0.28 },
      ],
      clouds: commonClouds.map((shape) => ({ ...shape, fill: "#fef9c3", opacity: shape.opacity * 0.75 })),
    },
    kryos: {
      light: "#f8f7ff", rim: "#c4b5fd", noise: "0.032 0.09", seed: 27, duration: 48,
      matrix: "0 0 0 0 0.55 0 0 0 0 0.42 0 0 0 0 0.95 0 0 0 .54 0",
      landOpacity: 0.9, cloudOpacity: 0.46, bandOpacity: 0.86,
      bands: [
        { d: "M18 86 C70 76 152 76 204 86", stroke: "#ede9fe", width: 2, opacity: 0.18 },
        { d: "M10 126 C62 138 158 138 210 126", stroke: "#2e1065", width: 4, opacity: 0.18 },
      ],
      shapes: [
        { d: "M-18 92 C34 60 72 64 116 88 C154 108 196 104 248 78 L248 128 C188 146 150 136 106 112 C64 88 24 96 -18 130 Z", fill: "#2e1065", opacity: 0.58 },
        { d: "M70 58 L98 138 L44 110 Z M138 78 L178 170 L102 136 Z M190 126 L218 196 L162 170 Z", fill: "#ede9fe", opacity: 0.42 },
      ],
      clouds: commonClouds.map((shape) => ({ ...shape, fill: "#ede9fe", opacity: shape.opacity * 0.78 })),
    },
    aethon: {
      light: "#ffedd5", rim: "#fdba74", noise: "0.026 0.075", seed: 33, duration: 31,
      matrix: "0 0 0 0 0.72 0 0 0 0 0.24 0 0 0 0 0.04 0 0 0 .55 0",
      landOpacity: 0.92, cloudOpacity: 0.28, bandOpacity: 0.78,
      bands: [
        { d: "M8 88 C64 76 158 76 212 88", stroke: "#fed7aa", width: 2, opacity: 0.18 },
        { d: "M6 118 C66 132 154 132 214 118", stroke: "#7f1d1d", width: 4, opacity: 0.18 },
      ],
      shapes: [
        { d: "M-20 94 C40 50 88 60 140 92 C178 116 212 108 248 82 L248 134 C198 158 154 146 108 116 C66 90 26 104 -20 146 Z", fill: "#451a03", opacity: 0.66 },
        { d: "M50 122 C88 108 126 122 160 152 C120 168 82 154 50 122 Z", fill: "#7f1d1d", opacity: 0.58 },
        { d: "M124 58 L154 136 L92 108 Z M178 142 L218 206 L138 184 Z", fill: "#fed7aa", opacity: 0.26 },
      ],
      clouds: [{ d: "M-18 130 C38 108 78 112 126 136 C166 156 206 152 248 128 L248 142 C204 166 160 170 116 148 C70 126 28 130 -18 148 Z", fill: "#fed7aa", opacity: 0.16 }],
    },
    noctis: {
      light: "#eff6ff", rim: "#bae6fd", noise: "0.02 0.055", seed: 41, duration: 38,
      matrix: "0 0 0 0 0.18 0 0 0 0 0.38 0 0 0 0 0.82 0 0 0 .50 0",
      landOpacity: 0.86, cloudOpacity: 0.6, bandOpacity: 0.74, bands: commonBands,
      shapes: [
        { d: "M-20 98 C36 70 78 76 126 104 C172 132 210 124 248 96 L248 142 C200 162 158 156 112 128 C70 102 28 108 -20 140 Z", fill: "#020617", opacity: 0.58 },
        { d: "M-20 132 C42 118 92 120 144 136 C188 150 216 146 248 132 L248 146 C206 164 162 166 118 150 C72 134 28 134 -20 148 Z", fill: "#bfdbfe", opacity: 0.24 },
      ],
      clouds: commonClouds.map((shape) => ({ ...shape, fill: "#dbeafe", opacity: shape.opacity })),
    },
    thalassa: {
      light: "#ecfeff", rim: "#a5f3fc", noise: "0.018 0.05", seed: 52, duration: 36,
      matrix: "0 0 0 0 0.05 0 0 0 0 0.72 0 0 0 0 0.86 0 0 0 .50 0",
      landOpacity: 0.74, cloudOpacity: 0.92, bandOpacity: 0.72, bands: commonBands,
      shapes: [
        { d: "M-20 108 C38 76 84 84 130 110 C172 134 208 128 248 98 L248 146 C198 168 156 158 112 132 C70 108 30 112 -20 150 Z", fill: "#083344", opacity: 0.48 },
        { d: "M52 132 C86 118 128 126 162 154 C120 174 84 162 52 132 Z", fill: "#ecfeff", opacity: 0.22 },
      ],
      clouds: [
        { d: "M-20 86 C34 58 78 62 128 84 C172 104 210 98 248 76 L248 94 C206 118 160 124 112 102 C70 84 30 84 -20 106 Z", fill: "#ecfeff", opacity: 0.36 },
        { d: "M-22 144 C38 124 90 126 142 146 C184 162 214 158 248 142 L248 160 C204 180 164 182 120 164 C74 146 30 146 -22 164 Z", fill: "#a5f3fc", opacity: 0.24 },
      ],
    },
    duskara: {
      light: "#ffe4e6", rim: "#fda4af", noise: "0.03 0.085", seed: 63, duration: 30,
      matrix: "0 0 0 0 0.72 0 0 0 0 0.08 0 0 0 0 0.15 0 0 0 .58 0",
      landOpacity: 0.94, cloudOpacity: 0.24, bandOpacity: 0.86,
      bands: [
        { d: "M10 88 C62 74 158 74 210 88", stroke: "#fecdd3", width: 2, opacity: 0.12 },
        { d: "M6 122 C62 136 158 136 214 122", stroke: "#020617", width: 4, opacity: 0.2 },
      ],
      shapes: [
        { d: "M-22 96 C34 54 82 64 134 94 C174 118 210 108 248 80 L248 132 C198 156 154 146 108 116 C66 88 24 104 -22 148 Z", fill: "#020617", opacity: 0.64 },
        { d: "M68 64 L102 140 L38 110 Z M156 118 L210 194 L104 168 Z", fill: "#881337", opacity: 0.58 },
        { d: "M-18 154 C50 118 100 136 154 164 C194 184 220 174 248 156 L248 192 C196 210 150 198 102 172 C56 146 18 158 -18 184 Z", fill: "#4c1111", opacity: 0.54 },
      ],
      clouds: [{ d: "M-20 122 C40 104 86 108 134 126 C176 140 210 138 248 118 L248 130 C206 150 160 154 116 138 C70 122 30 124 -20 140 Z", fill: "#fecdd3", opacity: 0.14 }],
    },
  };
  const selected = visuals[planet.id] || visuals["nexus-prime"];
  return {
    ...selected,
    id: planet.id,
    colorARgb: hexToRgb(planet.colorA),
    colorBRgb: hexToRgb(planet.colorB),
    rimRgb: hexToRgb(selected.rim),
    speed: (Math.PI * 2) / Number(selected.duration || 36),
  };
}

function samplePlanetColor(visual, longitude, latitude, cloudRotation) {
  const u = longitude / (Math.PI * 2);
  const v = latitude / Math.PI + 0.5;
  const sphereX = Math.cos(latitude) * Math.cos(longitude);
  const sphereY = Math.sin(latitude);
  const sphereZ = Math.cos(latitude) * Math.sin(longitude);
  const base = visual.colorBRgb;
  const bright = visual.colorARgb;
  const dark = mixRgb(base, [3, 7, 18], 0.62);
  const ice = mixRgb(bright, [245, 250, 255], 0.72);
  const cloud = [234, 242, 246];

  if (visual.id === "veyron") {
    const wave = fbm3(sphereX * 1.8, sphereY * 4.8, sphereZ * 1.8, visual.seed);
    const band = 0.5 + 0.5 * Math.sin(latitude * 20 + wave * 3.8);
    const stormCore = distanceOnSphere(longitude, latitude, -1.1 + cloudRotation * 0.18, 0.18);
    const storm = smoothstep(0.52, 0.08, stormCore);
    const belt = mixRgb(dark, bright, band * 0.42 + 0.28);
    return mixRgb(belt, [255, 240, 168], storm * 0.42);
  }

  if (visual.id === "kryos") {
    const largeIce = fbm3(sphereX * 2.6, sphereY * 2.2, sphereZ * 2.6, visual.seed + 3);
    const cracks = Math.pow(fbm3(sphereX * 11, sphereY * 9, sphereZ * 11, visual.seed + 24), 4);
    const iceSheet = smoothstep(0.38, 0.74, largeIce + Math.abs(latitude) * 0.45);
    return mixRgb(mixRgb(base, dark, cracks * 0.45), ice, iceSheet);
  }

  if (visual.id === "aethon" || visual.id === "duskara") {
    const ridges = fbm3(sphereX * 5.2, sphereY * 3.6, sphereZ * 5.2, visual.seed + 4);
    const veins = fbm3(sphereX * 15.5, sphereY * 8.5, sphereZ * 15.5, visual.seed + 14);
    const lava = smoothstep(0.76, 0.94, veins + ridges * 0.08);
    const desert = mixRgb(base, bright, ridges * 0.46);
    return mixRgb(desert, visual.id === "aethon" ? [255, 134, 49] : [248, 80, 95], lava * 0.48);
  }

  const warp = fbm3(sphereX * 1.5, sphereY * 1.5, sphereZ * 1.5, visual.seed + 44) - 0.5;
  const elevation = fbm3(
    sphereX * 2.45 + warp * 0.6,
    sphereY * 2.35 + warp * 0.45,
    sphereZ * 2.45 - warp * 0.6,
    visual.seed
  );
  const ridged = 1 - Math.abs(fbm3(sphereX * 4.8, sphereY * 4.6, sphereZ * 4.8, visual.seed + 8) * 2 - 1);
  const detail = fbm3(sphereX * 10.5, sphereY * 7.5, sphereZ * 10.5, visual.seed + 17);
  const polar = smoothstep(0.92, 1.28, Math.abs(latitude) * 1.45 + detail * 0.18);
  const landSource = elevation + ridged * 0.12 - Math.abs(latitude) * 0.04;
  const landMask = smoothstep(0.54, 0.64, landSource);
  const coast = smoothstep(0.5, 0.58, landSource);
  const ocean = mixRgb(dark, base, 0.66 + detail * 0.16);
  const shelf = mixRgb(ocean, bright, 0.28);
  const continentBase = visual.id === "solara" ? [36, 111, 64] : mixRgb(base, bright, 0.32);
  const highlands = mixRgb(continentBase, ice, smoothstep(0.72, 0.94, ridged + detail * 0.22) * 0.42);
  let color = mixRgb(mixRgb(ocean, shelf, coast * (1 - landMask)), highlands, landMask);

  if (visual.id === "thalassa") {
    color = mixRgb(color, ice, polar * 0.5);
  } else {
    color = mixRgb(color, ice, polar);
  }

  const cloudLon = longitude + cloudRotation * 0.2;
  const cloudX = Math.cos(latitude) * Math.cos(cloudLon);
  const cloudZ = Math.cos(latitude) * Math.sin(cloudLon);
  const cloudNoise = fbm3(cloudX * 6.4, sphereY * 6.1, cloudZ * 6.4, visual.seed + 31);
  const streaks = Math.sin(latitude * 5 + cloudNoise * 2.1) * 0.035;
  const wisps = smoothstep(0.66, 0.86, cloudNoise + streaks);
  return mixRgb(color, cloud, wisps * visual.cloudOpacity * 0.38);
}

function fbm3(x, y, z, seed) {
  let value = 0;
  let amplitude = 0.52;
  let frequency = 1;
  let total = 0;
  for (let i = 0; i < 5; i += 1) {
    value += noise3(x * frequency, y * frequency, z * frequency, seed + i * 23) * amplitude;
    total += amplitude;
    frequency *= 2.08;
    amplitude *= 0.5;
  }
  return value / total;
}

function noise3(x, y, z, seed) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);
  const c00 = lerp(hash3(ix, iy, iz, seed), hash3(ix + 1, iy, iz, seed), ux);
  const c10 = lerp(hash3(ix, iy + 1, iz, seed), hash3(ix + 1, iy + 1, iz, seed), ux);
  const c01 = lerp(hash3(ix, iy, iz + 1, seed), hash3(ix + 1, iy, iz + 1, seed), ux);
  const c11 = lerp(hash3(ix, iy + 1, iz + 1, seed), hash3(ix + 1, iy + 1, iz + 1, seed), ux);
  return lerp(lerp(c00, c10, uy), lerp(c01, c11, uy), uz);
}

function hash3(x, y, z, seed) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 53.9) * 43758.5453;
  return n - Math.floor(n);
}

function distanceOnSphere(lonA, latA, lonB, latB) {
  return Math.acos(clamp(
    Math.sin(latA) * Math.sin(latB) +
      Math.cos(latA) * Math.cos(latB) * Math.cos(lonA - lonB),
    -1,
    1
  ));
}

function fbm(x, y, seed) {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < 5; i += 1) {
    value += noise2(x * frequency, y * frequency, seed + i * 19) * amplitude;
    frequency *= 2.03;
    amplitude *= 0.52;
  }
  return value;
}

function noise2(x, y, seed) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed);
  const b = hash2(ix + 1, iy, seed);
  const c = hash2(ix, iy + 1, seed);
  const d = hash2(ix + 1, iy + 1, seed);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uy);
}

function hash2(x, y, seed) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((part) => part + part).join("") : value;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function mixRgb(a, b, amount) {
  const t = clamp(amount, 0, 1);
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function normalize3(vector) {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function lerp(a, b, amount) {
  return a + (b - a) * amount;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clamp255(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

const css = `
@keyframes orbitSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes orbitSpinSlow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes planetSurfaceScroll {
  from { background-position: 0 0, 0 0, 0 0, 0 0; }
  to { background-position: -240px 0, -240px 0, -240px 0, -240px 0; }
}
@keyframes appearUp {
  from {
    opacity: 0;
    transform: translateY(16px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes pulseStars {
  0% { opacity: 0.10; }
  50% { opacity: 0.18; }
  100% { opacity: 0.10; }
}
@keyframes floatGlow {
  0% { transform: translateY(0px); opacity: 0.7; }
  50% { transform: translateY(-6px); opacity: 1; }
  100% { transform: translateY(0px); opacity: 0.7; }
}
`;

if (
  typeof document !== "undefined" &&
  !document.getElementById("planet-screen-styles")
) {
  const style = document.createElement("style");
  style.id = "planet-screen-styles";
  style.innerHTML = css;
  document.head.appendChild(style);
}

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top, #18263d 0%, #0b1220 50%, #05080f 100%)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    padding: "32px 20px",
  },
  pageModal: {
    position: "fixed",
    inset: 0,
    zIndex: 1200,
    minHeight: "100dvh",
    overflowY: "auto",
    background: "rgba(3,7,18,0.94)",
    backdropFilter: "blur(8px)",
    alignItems: "flex-start",
  },
  starsA: {
    position: "absolute",
    inset: 0,
    opacity: 0.14,
    animation: "pulseStars 6s ease-in-out infinite",
    backgroundImage:
      "radial-gradient(circle, rgba(255,255,255,0.85) 1px, transparent 1px)",
    backgroundSize: "44px 44px",
  },
  starsB: {
    position: "absolute",
    inset: 0,
    opacity: 0.08,
    animation: "pulseStars 8s ease-in-out infinite",
    backgroundImage:
      "radial-gradient(circle, rgba(99,230,255,0.9) 1px, transparent 1px)",
    backgroundSize: "110px 110px",
  },
  astraLeft: {
    position: "absolute",
    left: -120,
    top: "20%",
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "rgba(138,125,255,0.08)",
    filter: "blur(55px)",
  },
  astraRight: {
    position: "absolute",
    right: -100,
    bottom: "12%",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "rgba(79,209,255,0.08)",
    filter: "blur(55px)",
  },
  glowTop: {
    position: "absolute",
    top: -120,
    left: "50%",
    transform: "translateX(-50%)",
    width: 700,
    height: 240,
    borderRadius: "50%",
    background: "rgba(79,209,255,0.08)",
    filter: "blur(40px)",
  },
  content: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "1180px",
  },
  contentModal: {
    margin: "0 auto",
    paddingTop: 18,
  },
  closeButton: {
    position: "sticky",
    top: 0,
    marginLeft: "auto",
    display: "block",
    zIndex: 3,
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 999,
    padding: "10px 14px",
    fontWeight: 700,
    cursor: "pointer",
    background: "rgba(15,23,42,0.82)",
    color: "#e2e8f0",
    marginBottom: 10,
  },
  header: {
    textAlign: "center",
    marginBottom: 28,
  },
  title: {
    margin: 0,
    fontSize: "clamp(2rem, 4vw, 3rem)",
    fontWeight: 800,
    letterSpacing: "0.01em",
  },
  subtitle: {
    textAlign: "center",
    color: "rgba(255,255,255,0.75)",
    marginTop: 10,
    marginBottom: 0,
    lineHeight: 1.6,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
    gap: 18,
  },
  card: {
    position: "relative",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 22,
    background: "rgba(255,255,255,0.06)",
    padding: 18,
    cursor: "pointer",
    color: "#fff",
    transition: "0.25s ease",
    animation: "appearUp 0.35s ease forwards",
    opacity: 0,
    backdropFilter: "blur(6px)",
    overflow: "hidden",
  },
  cardActive: {
    border: "1px solid rgba(99,230,255,0.72)",
    boxShadow:
      "0 0 0 1px rgba(99,230,255,0.12), 0 12px 30px rgba(0,0,0,0.35)",
    background: "rgba(255,255,255,0.09)",
  },
  cardLocked: {
    opacity: 0.76,
  },
  lockOverlay: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 3,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.6,
    color: "#e2e8f0",
    background: "rgba(15,23,42,0.72)",
    border: "1px solid rgba(255,255,255,0.14)",
  },
  planetWrap: {
    width: 150,
    height: 130,
    margin: "0 auto 10px",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  planet: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    position: "relative",
    animation: "orbitSpin 16s linear infinite",
    overflow: "hidden",
  },
  planetImage: {
    width: "132%",
    height: "132%",
    display: "block",
    objectFit: "contain",
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    transformOrigin: "50% 50%",
    filter: "drop-shadow(0 0 16px rgba(103,232,249,0.12))",
  },
  generatedPlanetSvg: {
    position: "absolute",
    inset: "-9%",
    width: "118%",
    height: "118%",
    display: "block",
    filter: "drop-shadow(0 0 16px rgba(103,232,249,0.14))",
  },
  generatedPlanetCanvas: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    display: "block",
    imageRendering: "auto",
    filter: "drop-shadow(0 0 14px rgba(103,232,249,0.14))",
  },
  generatedPlanetAura: {
    position: "absolute",
    inset: -2,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.10)",
    pointerEvents: "none",
  },
  generatedPlanet: {
    position: "absolute",
    inset: "-9%",
    borderRadius: "50%",
    overflow: "hidden",
    boxShadow:
      "inset -22px -18px 34px rgba(2,6,23,0.42), inset 12px 10px 18px rgba(255,255,255,0.08)",
  },
  generatedSurface: {
    position: "absolute",
    inset: 0,
    opacity: 0.92,
    backgroundRepeat: "repeat",
    backgroundSize: "240px 160px, 240px 160px, 240px 160px, 240px 160px",
    animation: "planetSurfaceScroll 36s linear infinite",
    transform: "scaleY(0.86)",
    transformOrigin: "50% 50%",
    mixBlendMode: "screen",
  },
  generatedAtmosphere: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.10)",
    boxShadow: "0 0 18px rgba(103,232,249,0.10)",
    pointerEvents: "none",
  },
  generatedTerminator: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    background:
      "linear-gradient(112deg, rgba(255,255,255,0) 0 42%, rgba(2,6,23,0.28) 66%, rgba(2,6,23,0.74) 100%)",
    pointerEvents: "none",
  },
  generatedHighlight: {
    position: "absolute",
    top: "13%",
    left: "18%",
    width: "30%",
    height: "28%",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.18)",
    filter: "blur(6px)",
    pointerEvents: "none",
  },
  planetTexture: {
    position: "absolute",
    inset: "7%",
    borderRadius: "50%",
    mixBlendMode: "overlay",
    opacity: 0.95,
    animation: "orbitSpinSlow 26s linear infinite reverse",
  },
  planetClouds: {
    position: "absolute",
    inset: "6%",
    borderRadius: "50%",
    filter: "blur(2px)",
    opacity: 0.85,
    animation: "orbitSpinSlow 18s linear infinite",
  },
  planetShadow: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
  },
  planetAtmosphere: {
    position: "absolute",
    inset: -4,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.08)",
    boxShadow: "0 0 14px rgba(255,255,255,0.10)",
    pointerEvents: "none",
  },
  planetGlow: {
    position: "absolute",
    inset: -10,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,255,255,0.06), transparent 72%)",
    animation: "floatGlow 4s ease-in-out infinite",
    pointerEvents: "none",
  },
  planetShine: {
    position: "absolute",
    top: "14%",
    left: "19%",
    width: "28%",
    height: "28%",
    borderRadius: "50%",
    background: "rgba(255,255,255,0.20)",
    filter: "blur(5px)",
  },
  ringBack: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 164,
    height: 42,
    borderRadius: "50%",
    border: "1px solid rgba(255,255,255,0.08)",
    transform: "translate(-50%, -50%) rotate(-15deg)",
    filter: "blur(1px)",
    pointerEvents: "none",
  },
  ring: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 150,
    height: 36,
    borderRadius: "50%",
    border: "2px solid rgba(255,255,255,0.22)",
    transform: "translate(-50%, -50%) rotate(-15deg)",
    boxShadow:
      "0 0 12px rgba(255,255,255,0.08), inset 0 0 6px rgba(255,255,255,0.05)",
    pointerEvents: "none",
  },
  name: {
    textAlign: "center",
    fontWeight: 800,
    fontSize: "1.08rem",
    marginBottom: 6,
  },
  type: {
    textAlign: "center",
    color: "#63e6ff",
    fontWeight: 700,
    marginBottom: 8,
  },
  desc: {
    textAlign: "center",
    color: "rgba(255,255,255,0.72)",
    lineHeight: 1.45,
    fontSize: "0.92rem",
    minHeight: 58,
  },
  perkList: {
    display: "grid",
    gap: 6,
    marginTop: 10,
  },
  perkItem: {
    textAlign: "center",
    color: "#dbeafe",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 999,
    padding: "5px 8px",
    fontSize: 11,
    fontWeight: 600,
  },
  statusPill: {
    marginTop: 12,
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.4,
  },
  statusUnlocked: {
    color: "#67e8f9",
    background: "rgba(34,211,238,0.08)",
    border: "1px solid rgba(34,211,238,0.18)",
  },
  statusLocked: {
    color: "#cbd5e1",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.10)",
  },
  statusCurrent: {
    color: "#86efac",
    background: "rgba(74,222,128,0.10)",
    border: "1px solid rgba(74,222,128,0.24)",
  },
  travelCost: {
    marginTop: 10,
    color: "rgba(255,255,255,0.62)",
    fontSize: 12,
    textAlign: "center",
  },
  bottom: {
    marginTop: 26,
    display: "flex",
    justifyContent: "center",
  },
  selectionBox: {
    display: "grid",
    gap: 14,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 18,
    padding: "18px 22px",
    maxWidth: 860,
    width: "100%",
    textAlign: "center",
  },
  selectionTitle: {
    width: "100%",
    fontSize: "1rem",
  },
  selectionDesc: {
    width: "100%",
    color: "rgba(255,255,255,0.72)",
    fontSize: "0.94rem",
  },
  metrics: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 10,
  },
  metricCard: {
    borderRadius: 14,
    padding: "12px 14px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    textAlign: "left",
  },
  metricLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    color: "rgba(255,255,255,0.54)",
    marginBottom: 6,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: 700,
  },
  requirementsBox: {
    borderRadius: 16,
    padding: 14,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  requirementsTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#94a3b8",
    marginBottom: 10,
  },
  requirementsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 8,
  },
  requirementItem: {
    borderRadius: 12,
    padding: "10px 12px",
    background: "rgba(255,255,255,0.03)",
    color: "#e2e8f0",
    fontSize: 13,
    textAlign: "left",
  },
  missingBox: {
    borderRadius: 14,
    padding: "12px 14px",
    background: "rgba(248,113,113,0.09)",
    border: "1px solid rgba(248,113,113,0.18)",
    color: "#fecaca",
    textAlign: "left",
    lineHeight: 1.5,
  },
  actions: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  confirm: {
    border: "none",
    borderRadius: 999,
    padding: "12px 22px",
    fontWeight: 800,
    cursor: "pointer",
    background: "linear-gradient(90deg, #4fd1ff, #8a7dff)",
    color: "#07111d",
  },
  confirmDisabled: {
    cursor: "not-allowed",
    opacity: 0.55,
  },
  cancel: {
    border: "1px solid rgba(255,255,255,0.14)",
    borderRadius: 999,
    padding: "12px 18px",
    fontWeight: 700,
    cursor: "pointer",
    background: "rgba(255,255,255,0.06)",
    color: "#e2e8f0",
  },
};


