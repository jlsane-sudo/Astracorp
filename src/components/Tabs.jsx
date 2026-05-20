import React from 'react';

const styles = {
  wrap: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    minHeight: 34,
    border: '1px solid rgba(148,163,184,0.14)',
    background: 'rgba(15,23,42,0.72)',
    color: '#cbd5e1',
    padding: '7px 10px 7px 8px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 12,
    transition: 'all 0.18s ease',
    position: 'relative',
    letterSpacing: 0,
    boxShadow: '0 1px 0 rgba(255,255,255,0.03) inset',
  },
  icon: {
    width: 22,
    height: 22,
    borderRadius: 7,
    display: 'inline-grid',
    placeItems: 'center',
    background: 'rgba(103,232,249,0.08)',
    border: '1px solid rgba(103,232,249,0.12)',
    color: '#67e8f9',
    fontSize: 10,
    lineHeight: 1,
    fontWeight: 900,
    flex: '0 0 auto',
  },
  label: {
    whiteSpace: 'nowrap',
    lineHeight: 1,
  },
  active: {
    background: 'linear-gradient(135deg, rgba(20,184,166,0.94), rgba(34,211,238,0.92))',
    color: '#03111f',
    border: '1px solid rgba(165,243,252,0.42)',
    boxShadow: '0 8px 18px rgba(6,182,212,0.18)',
    transform: 'translateY(-1px)',
  },
  activeIcon: {
    background: 'rgba(3,17,31,0.16)',
    border: '1px solid rgba(3,17,31,0.18)',
    color: '#03111f',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 16,
    height: 16,
    padding: '0 4px',
    borderRadius: 999,
    background: '#ef4444',
    color: '#fff',
    fontSize: 10,
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    boxShadow: '0 4px 10px rgba(0,0,0,0.22)',
  },
};

function getPendingObjectivesCount(missions, contracts) {
  const pendingMissions = Array.isArray(missions) ? missions.filter((m) => !m?.done).length : 0;
  const pendingContracts = Array.isArray(contracts)
    ? contracts.filter((contract) => !contract?.completed).length
    : 0;
  return pendingMissions + pendingContracts;
}

const TABS = [
  { key: 'home', label: 'Inicio', icon: 'IN' },
  { key: 'work', label: 'Operar', icon: 'OP', children: [
    { key: 'work', label: 'Trabajos' },
    { key: 'business', label: 'Empresas' },
  ] },
  { key: 'missions', label: 'Contratos', icon: 'CT', showBadge: true, children: [
    { key: 'missions', label: 'Misiones' },
    { key: 'market', label: 'Mercado' },
  ] },
  { key: 'map', label: 'Territorio', icon: 'TE', children: [
    { key: 'map', label: 'Mapa' },
    { key: 'politics', label: 'Politica' },
  ] },
  { key: 'hq', label: 'Base', icon: 'BA', children: [
    { key: 'hq', label: 'Sede' },
    { key: 'research', label: 'Mejoras' },
    { key: 'projects', label: 'Proyectos' },
    { key: 'balance', label: 'Balance' },
  ] },
  { key: 'ads', label: 'Social', icon: 'SO', children: [
    { key: 'ads', label: 'Ads' },
    { key: 'players', label: 'Jugadores' },
    { key: 'chat', label: 'Chat' },
  ] },
];

function getVisibleTabs(unlockedTabs = null) {
  if (!Array.isArray(unlockedTabs) || unlockedTabs.length === 0) return TABS;
  const allowed = new Set(unlockedTabs);
  const visible = [];

  TABS.forEach((item) => {
    if (allowed.has(item.key)) {
      const visibleItem = item.key === 'hq'
        ? { ...item, label: item.children?.find((child) => child.key === 'hq')?.label || item.label }
        : item;
      visible.push({ ...visibleItem, children: null });
    }

    item.children?.forEach((child) => {
      if (child.key !== item.key && allowed.has(child.key)) {
        visible.push({ ...child, icon: child.icon || item.icon, children: null });
      }
    });
  });

  return visible;
}

function getActiveGroup(tab, tabs = TABS) {
  return tabs.find((item) => item.key === tab || item.children?.some((child) => child.key === tab)) || tabs[0] || TABS[0];
}

export function Tabs({ tab, onChange, missions, contracts, unlockedTabs = null }) {
  const pendingMissions = getPendingObjectivesCount(missions, contracts);
  const visibleTabs = getVisibleTabs(unlockedTabs);
  const activeGroup = getActiveGroup(tab, visibleTabs);
  const showChildRow = !Array.isArray(unlockedTabs) && activeGroup.children?.length;

  return (
    <div className="pw-tabs-inline">
      <div style={styles.wrap}>
        {visibleTabs.map((item) => {
          const isActive = activeGroup.key === item.key;
          const showBadge = item.showBadge && pendingMissions > 0;
          const target = item.children?.[0]?.key || item.key;

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key === 'home' ? 'home' : target)}
              style={{
                ...styles.button,
                ...(isActive ? styles.active : null),
              }}
            >
              <span style={{ ...styles.icon, ...(isActive ? styles.activeIcon : null) }}>
                {item.icon}
              </span>
              <span style={styles.label}>{item.label}</span>
              {showBadge && <span style={styles.badge}>{pendingMissions}</span>}
            </button>
          );
        })}
      </div>
      {showChildRow ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 7 }}>
          {activeGroup.children.map((child) => {
            const isActive = tab === child.key;
            return (
              <button
                key={child.key}
                type="button"
                onClick={() => onChange(child.key)}
                style={{
                  minHeight: 25,
                  padding: '4px 9px',
                  borderRadius: 999,
                  border: isActive ? '1px solid rgba(34,211,238,0.45)' : '1px solid rgba(148,163,184,0.12)',
                  background: isActive ? 'rgba(34,211,238,0.16)' : 'rgba(15,23,42,0.56)',
                  color: isActive ? '#a5f3fc' : '#94a3b8',
                  fontSize: 11,
                  fontWeight: 800,
                }}
              >
                {child.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default Tabs;


