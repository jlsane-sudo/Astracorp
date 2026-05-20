import { getPlanetById } from '../data/planets';
import { planetAssets } from '../assets/generated/assets';

const PHASES = [
  'Carga de suministros',
  'Ignicion orbital',
  'Vector de salto',
  'Entrada atmosferica',
];

export default function PlanetTransitOverlay({ transit, onSkip }) {
  if (!transit?.toId) return null;

  const origin = getPlanetById(transit.fromId);
  const destination = getPlanetById(transit.toId);
  const asset = planetAssets[destination.id];

  return (
    <div
      className="pw-transit"
      role="dialog"
      aria-modal="true"
      aria-label={`Viaje orbital hacia ${destination.name}`}
      style={{ '--transit-a': destination.colorA, '--transit-b': destination.colorB }}
    >
      <div className="pw-transit__stars" />
      <div className="pw-transit__system" aria-hidden="true">
        <div className="pw-transit__origin">{origin?.name || 'Origen'}</div>
        <div className="pw-transit__route">
          <span />
          <i />
        </div>
        <div className="pw-transit__destination">
          {asset ? <img src={asset} alt="" /> : null}
          <strong>{destination.name}</strong>
        </div>
      </div>

      <div className="pw-transit__panel">
        <div className="pw-transit__kicker">Salto orbital en curso</div>
        <h2>{origin?.name || 'Origen'} {'->'} {destination.name}</h2>
        <div className="pw-transit__phases">
          {PHASES.map((phase, index) => (
            <div key={phase} className="pw-transit__phase" style={{ '--phase-delay': `${index * 0.72}s` }}>
              <span>{index + 1}</span>
              <strong>{phase}</strong>
            </div>
          ))}
        </div>
        <div className="pw-transit__progress">
          <span />
        </div>
        <button type="button" onClick={onSkip}>
          Saltar secuencia
        </button>
      </div>
    </div>
  );
}
