export function Notification({ note }) {
  if (!note) return null;
  const bg = note.type === 'success' ? 'rgba(16,185,129,0.95)' : note.type === 'warn' ? 'rgba(245,158,11,0.95)' : 'rgba(239,68,68,0.95)';
  return <div className="pw-toast" style={{ background: bg }}>{note.msg}</div>;
}

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

function getVisibleEventKeys(level = 1) {
  const safeLevel = Number(level ?? 1);
  if (safeLevel <= 1) return new Set(['water']);
  if (safeLevel === 2) return new Set(['water', 'energy_cells']);
  if (safeLevel <= 10) return new Set(['water', 'energy_cells', 'mineral']);
  return new Set(Object.keys(RESOURCE_LABELS));
}

function getEventTimeLeft(event) {
  const expiresAt = Number(event?.expiresAt ?? 0);
  if (!expiresAt) return null;
  const ms = Math.max(0, expiresAt - Date.now());
  const min = Math.ceil(ms / 60000);
  return min > 0 ? `${min} min` : 'terminando';
}

function getEventActions(event, playerLevel = 1) {
  const safeLevel = Number(playerLevel ?? 1);
  const actions = [];
  if (safeLevel >= 4) actions.push({ tab: 'missions', label: 'Ver contratos' });
  if (event?.effect === 'adBoom') actions.unshift({ tab: 'ads', label: 'Ver Ads' });
  actions.push({ tab: 'market', label: 'Ver mercado' });
  return actions;
}

export function EventBanner({ event, contracts = [], onClose, onOpenTab, playerLevel = 1 }) {
  if (!event) return null;
  const visibleKeys = getVisibleEventKeys(playerLevel);
  const affectedKeys = (event.affectedKeys || []).filter((key) => visibleKeys.has(key));
  if (!affectedKeys.length) return null;
  const impacted = affectedKeys
    .map((key) => RESOURCE_LABELS[key] || key)
    .slice(0, 3)
    .join(', ');
  const timeLeft = getEventTimeLeft(event);
  const boostedContracts = (contracts || []).filter((contract) => contract?.eventBoost && affectedKeys.includes(contract?.itemKey));
  const totalBonus = boostedContracts.reduce((sum, contract) => sum + Number(contract.eventBonusCredits ?? 0), 0);

  return (
    <div className="pw-event-banner" style={{ borderColor: event.color, background: `${event.color}20` }}>
      <div className="pw-event-banner-icon" style={{ color: event.color }}>{event.icon}</div>
      <div className="pw-event-banner-body">
        <div className="pw-event-banner-title" style={{ color: event.color }}>
          {event.title}
          {timeLeft ? <span className="pw-event-banner-time">{timeLeft}</span> : null}
        </div>
        <div className="pw-event-banner-text">{event.desc}</div>
        {impacted ? (
          <div className="pw-event-banner-meta">Afecta: {impacted}</div>
        ) : null}
        <div className="pw-event-banner-metrics">
          <span>{boostedContracts.length} contrato(s) afectados</span>
          <span>+{totalBonus.toFixed(2)} cr potenciales</span>
        </div>
        {event.actionHint ? (
          <div className="pw-event-banner-hint">{event.actionHint}</div>
        ) : null}
        <div className="pw-event-banner-actions">
          {getEventActions(event, playerLevel).map((action) => (
            <button
              key={action.tab}
              type="button"
              className="pw-event-banner-action"
              style={{ borderColor: event.color, color: event.color }}
              onClick={() => onOpenTab?.(action.tab)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="pw-event-banner-close"
        style={{ borderColor: event.color, color: event.color }}
      >
        Cerrar
      </button>
    </div>
  );
}

export function Confetti({ show }) {
  if (!show) return null;
  return (
    <div className="pw-confetti-layer">
      {Array.from({ length: 20 }).map((_, i) => (
        <span key={i} className="pw-confetti" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 0.5}s` }} />
      ))}
    </div>
  );
}
