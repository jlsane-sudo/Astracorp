import { getPlanetById } from '../data/planets';
import { planetAssets } from '../assets/generated/assets';

const RESOURCE_LABELS = {
  water: 'Agua',
  energy_cells: 'Electricidad',
  mineral: 'Mineral',
  purified_water: 'Agua purificada',
  metal_components: 'Componentes metalicos',
  oxygen_tanks: 'Tanques de oxigeno',
  alloy_frames: 'Estructuras de aleacion',
  habitat_modules: 'Modulos de habitat',
};

const PLANET_BRIEFINGS = {
  'nexus-prime': {
    headline: 'Centro de exportacion reactivado',
    event: 'La colonia vuelve a operar con cadenas basicas estables.',
    callout: 'Buen punto para recomponer inventario y preparar la siguiente ruta.',
  },
  veyron: {
    headline: 'Mercado seco detectado',
    event: 'La demanda de agua se dispara en las rutas comerciales de Veyron.',
    callout: 'Prioriza agua, electricidad y contratos de importacion.',
  },
  solara: {
    headline: 'Red electrica saturada',
    event: 'Solara paga mejor por energia y premia cadenas con buen almacenamiento.',
    callout: 'Las baterias y los tanques de oxigeno ganan valor operativo.',
  },
  kryos: {
    headline: 'Laboratorios criogenicos online',
    event: 'Kryos necesita mineral de precision para mantener sus complejos tecnicos.',
    callout: 'Aprovecha el impulso de XP e investigacion.',
  },
  aethon: {
    headline: 'Frontera militar abierta',
    event: 'Aethon convierte cada sector en una posicion tactica de alto valor.',
    callout: 'Expandir territorio aqui tiene mas impacto que producir en automatico.',
  },
  noctis: {
    headline: 'Corredor logistico sincronizado',
    event: 'Noctis acelera operaciones y estira la capacidad de almacenamiento.',
    callout: 'Reordena empresas para explotar rutas frias y contratos largos.',
  },
  thalassa: {
    headline: 'Condensadores oceanicos activos',
    event: 'Thalassa favorece soporte vital, refinado y contratos especializados.',
    callout: 'Agua purificada, oxigeno y modulos sostienen la nueva economia.',
  },
  duskara: {
    headline: 'Zona gris corporativa',
    event: 'Duskara abre beneficios altos, con una presion territorial mucho mayor.',
    callout: 'Vende con margen, pero refuerza antes de crecer demasiado rapido.',
  },
};

function formatPct(value) {
  const pct = Math.round((Number(value ?? 1) - 1) * 100);
  if (pct === 0) return 'Sin cambio';
  return `${pct > 0 ? '+' : ''}${pct}%`;
}

function getResourceImpact(planet) {
  const entries = Object.entries(planet?.effects?.resourceRateMult || {});
  if (!entries.length) return null;
  const lowest = [...entries].sort((a, b) => Number(a[1]) - Number(b[1]))[0];
  if (!lowest) return null;
  return `${RESOURCE_LABELS[lowest[0]] || lowest[0]} ${formatPct(lowest[1])}`;
}

function getArrivalHighlights(planet) {
  const effects = planet?.effects || {};
  return [
    { label: 'Produccion critica', value: getResourceImpact(planet) || 'Estable' },
    { label: 'Mercado', value: formatPct(effects.marketSellMult) },
    { label: 'Contratos', value: formatPct(effects.contractRewardMult) },
    { label: 'Investigacion', value: formatPct(effects.researchTimeMult) },
  ];
}

export default function PlanetArrivalModal({
  arrival,
  onClose,
  onOpenMap,
  onOpenMissions,
}) {
  if (!arrival?.toId) return null;

  const planet = getPlanetById(arrival.toId);
  const origin = getPlanetById(arrival.fromId);
  const briefing = PLANET_BRIEFINGS[planet.id] || PLANET_BRIEFINGS['nexus-prime'];
  const highlights = getArrivalHighlights(planet);
  const asset = planetAssets[planet.id];

  return (
    <div className="pw-arrival" role="dialog" aria-modal="true" aria-labelledby="arrival-title">
      <div className="pw-arrival__stars" />
      <div className="pw-arrival__panel" style={{ '--arrival-a': planet.colorA, '--arrival-b': planet.colorB }}>
        <div className="pw-arrival__visual" aria-hidden="true">
          <div className="pw-arrival__route-line" />
          {asset ? <img src={asset} alt="" className="pw-arrival__planet" /> : null}
          <div className="pw-arrival__ship">ASTRA-7</div>
        </div>

        <div className="pw-arrival__content">
          <div className="pw-arrival__kicker">Llegada orbital completada</div>
          <h2 id="arrival-title">{planet.name}</h2>
          <p className="pw-arrival__subtitle">
            {origin?.id === planet.id ? planet.subtitle : `${origin?.name || 'Origen'} -> ${planet.name}`}
          </p>

          <div className="pw-arrival__briefing">
            <strong>{briefing.headline}</strong>
            <span>{briefing.event}</span>
          </div>

          <div className="pw-arrival__grid">
            {highlights.map((item) => (
              <div key={item.label} className="pw-arrival__metric">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <div className="pw-arrival__callout">{briefing.callout}</div>

          <div className="pw-arrival__actions">
            <button type="button" className="pw-arrival__primary" onClick={onOpenMap}>
              Ver mapa planetario
            </button>
            <button type="button" className="pw-arrival__secondary" onClick={onOpenMissions}>
              Revisar contratos
            </button>
            <button type="button" className="pw-arrival__ghost" onClick={onClose}>
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
