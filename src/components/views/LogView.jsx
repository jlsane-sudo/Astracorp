import { Card } from '../ui';

function classifyEntry(message = '') {
  const text = String(message).toLowerCase();

  if (text.includes('perdiste') || text.includes('frente rival') || text.includes('deuda') || text.includes('amenaza')) {
    return { label: 'Riesgo', color: '#f87171' };
  }
  if (text.includes('contrato') || text.includes('pedido') || text.includes('mision')) {
    return { label: 'Mision', color: '#fbbf24' };
  }
  if (text.includes('sector') || text.includes('campana') || text.includes('territorio')) {
    return { label: 'Mapa', color: '#67e8f9' };
  }
  if (text.includes('empresa') || text.includes('produccion') || text.includes('mercado') || text.includes('vend')) {
    return { label: 'Economia', color: '#4ade80' };
  }
  if (text.includes('publicidad') || text.includes('anuncio') || text.includes('energia')) {
    return { label: 'Ads', color: '#a78bfa' };
  }

  return { label: 'Sistema', color: '#94a3b8' };
}

function LogEntry({ entry, compact = false }) {
  const type = classifyEntry(entry?.msg);

  return (
    <div className={compact ? 'pw-log-panel-entry' : 'pw-log-entry'}>
      <span
        className="pw-log-tag"
        style={{
          color: type.color,
          borderColor: `${type.color}55`,
          background: `${type.color}14`,
        }}
      >
        {type.label}
      </span>
      <span>{entry?.msg}</span>
    </div>
  );
}

export function LogView({ log = [], compact = false }) {
  const entries = Array.isArray(log) ? log : [];

  if (compact) {
    return (
      <div className="pw-log-panel">
        <div className="pw-log-panel-kicker">REGISTRO</div>
        <div className="pw-log-panel-title">Actividad</div>
        <div className="pw-log-panel-list">
          {entries.length ? entries.slice(0, 32).map((entry, i) => (
            <LogEntry key={`${entry.t || 'log'}-${i}`} entry={entry} compact />
          )) : (
            <div className="pw-log-panel-empty">Sin eventos todavia.</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="pw-section-kicker">REGISTRO DEL MUNDO</div>
      <Card>
        {entries.map((entry, i) => (
          <LogEntry key={`${entry.t || 'log'}-${i}`} entry={entry} />
        ))}
      </Card>
    </div>
  );
}
