import { COMPANY_TYPES, getCompanyBuildCost } from '../../data/companyTypes';
import { PLANETS, STARTER_PLANET_ID, getPlanetUnlockStatus } from '../../data/planets';

const styles = {
  wrap: { display: 'grid', gap: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 },
  card: {
    padding: 14,
    borderRadius: 12,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  insightGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginTop: 10 },
  actionRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 },
  actionButton: {
    minHeight: 32,
    padding: '8px 11px',
    borderRadius: 8,
    border: '1px solid rgba(125,211,252,0.25)',
    background: 'rgba(14,165,233,0.10)',
    color: '#bae6fd',
    fontWeight: 800,
    fontSize: 11,
    cursor: 'pointer',
  },
  insightItem: {
    padding: 10,
    borderRadius: 8,
    background: 'rgba(15,23,42,0.62)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  label: { fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { marginTop: 5, fontSize: 20, fontWeight: 900, color: '#f8fafc' },
  sub: { marginTop: 4, fontSize: 12, color: '#cbd5e1', lineHeight: 1.4 },
  table: { display: 'grid', gap: 8 },
  sectionTitle: { color: '#f8fafc', fontSize: 15, fontWeight: 900 },
  row: {
    display: 'grid',
    gridTemplateColumns: 'minmax(120px, 1.4fr) repeat(4, minmax(80px, 1fr))',
    gap: 8,
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    background: 'rgba(15,23,42,0.72)',
    border: '1px solid rgba(255,255,255,0.06)',
    fontSize: 12,
    color: '#dbeafe',
  },
  head: { color: '#7dd3fc', fontWeight: 900 },
};

const fmt = (value, digits = 2) => Number(value || 0).toLocaleString('es-ES', { maximumFractionDigits: digits });
const safeArray = (value) => Array.isArray(value) ? value : [];
const safeDateLabel = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '--:--'
    : date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

function getBalance(save) {
  const companies = safeArray(save?.companies);
  const rows = Object.values(COMPANY_TYPES).map((meta) => {
    const list = companies.filter((company) => (company.companyType || company.type) === meta.key);
    const production = list.reduce((sum, company) => sum + Number(company.effectiveRatePerHour || 0), 0);
    const maintenance = list.reduce((sum, company) => sum + Number(company.maintenanceCreditsPerHour || 0), 0);
    const stored = list.reduce((sum, company) => sum + Number(company.storage || 0), 0);
    const paused = list.filter((company) => company.maintenancePaused).length;
    return { meta, count: list.length, production, maintenance, stored, paused };
  }).filter((row) => row.count > 0 || row.meta.unlockLevel <= Number(save?.player?.level ?? 1));

  const totalProduction = rows.reduce((sum, row) => sum + row.production, 0);
  const totalMaintenance = rows.reduce((sum, row) => sum + row.maintenance, 0);
  const inventory = save?.inventory && typeof save.inventory === 'object' ? save.inventory : {};
  const readyContracts = safeArray(save?.contracts).filter((contract) =>
    Number(inventory?.[contract?.itemKey] || 0) >= Number(contract?.qty || 0)
  ).length;
  const expiringContracts = safeArray(save?.contracts).filter((contract) =>
    Number(contract?.expiresAt || 0) > Date.now() && Number(contract?.expiresAt || 0) - Date.now() < 8 * 60 * 1000
  ).length;

  return { rows, totalProduction, totalMaintenance, readyContracts, expiringContracts };
}

function getResourceFlow(rows) {
  const flow = {};
  rows.forEach((row) => {
    if (!row.meta?.resourceKey || row.meta.key === 'research_lab') return;
    const current = flow[row.meta.resourceKey] || { produced: 0, consumed: 0, name: row.meta.resourceLabel || row.meta.resourceKey };
    current.produced += row.production;
    flow[row.meta.resourceKey] = current;
    (row.meta.inputs || []).forEach((input) => {
      const inputFlow = flow[input.key] || { produced: 0, consumed: 0, name: input.label || input.key };
      inputFlow.consumed += row.production * Number(input.amount || 0);
      flow[input.key] = inputFlow;
    });
  });
  return flow;
}

function simulate(save, balance, hours) {
  const flow = getResourceFlow(balance.rows);
  const inventory = save?.inventory && typeof save.inventory === 'object' ? save.inventory : {};
  const resources = Object.entries(flow).map(([key, item]) => {
    const net = Number(item.produced || 0) - Number(item.consumed || 0);
    return {
      key,
      name: item.name,
      net,
      projected: Number(inventory[key] || 0) + net * hours,
    };
  }).sort((a, b) => a.projected - b.projected);
  const maintenance = balance.totalMaintenance * hours;
  const readyAfter = safeArray(save?.contracts).filter((contract) => {
    const resource = resources.find((item) => item.key === contract?.itemKey);
    const projected = resource ? resource.projected : Number(inventory[contract?.itemKey] || 0);
    return projected >= Number(contract?.qty || 0);
  }).length;
  return { hours, maintenance, resources, readyAfter };
}

function formatHours(value) {
  if (!Number.isFinite(value)) return 'estable';
  if (value <= 0) return 'ahora';
  if (value < 1) return `${Math.round(value * 60)}min`;
  if (value < 24) return `${Math.floor(value)}h ${Math.round((value % 1) * 60)}m`;
  return `${Math.floor(value / 24)}d ${Math.round(value % 24)}h`;
}

function getStrategicInsight(save, balance) {
  const inventory = save?.inventory && typeof save.inventory === 'object' ? save.inventory : {};
  const level = Number(save?.player?.level ?? 1);
  const credits = Number(save?.player?.credits ?? 0);
  const flow = getResourceFlow(balance.rows);
  const resources = Object.entries(flow).map(([key, item]) => {
    const stored = Number(inventory[key] || 0);
    const net = Number(item.produced || 0) - Number(item.consumed || 0);
    const timeToEmpty = net < 0 ? stored / Math.abs(net) : Infinity;
    return {
      key,
      name: item.name,
      stored,
      net,
      timeToEmpty,
      score: stored + Math.min(24, timeToEmpty) * 2 + net * 3,
    };
  }).sort((a, b) => a.score - b.score);

  const bottleneck = resources[0] || null;
  const ownedByType = {};
  safeArray(save?.companies).forEach((company) => {
    const typeKey = company?.companyType || company?.type;
    ownedByType[typeKey] = Number(ownedByType[typeKey] || 0) + 1;
  });

  const producer = bottleneck
    ? Object.values(COMPANY_TYPES).find((meta) => meta.resourceKey === bottleneck.key && meta.key !== 'research_lab')
    : null;
  const producerCost = producer ? getCompanyBuildCost(producer.key, ownedByType[producer.key] || 0) : 0;
  const producerStatus = !producer
    ? 'Sin empresa directa'
    : level < Number(producer.unlockLevel ?? 1)
      ? `Sube a nivel ${producer.unlockLevel}`
      : credits < producerCost
        ? `Faltan ${fmt(producerCost - credits, 0)} cr`
        : `Construir ${producer.name}`;

  const negativeCount = resources.filter((item) => item.net < 0).length;
  const action = bottleneck?.net < 0
    ? `Compensa ${bottleneck.name}: pierdes ${fmt(Math.abs(bottleneck.net))}/h.`
    : producer
      ? `Refuerza ${producer.name} antes de ampliar cadenas avanzadas.`
      : 'La red esta estable; mira contratos o expansion territorial.';

  return { bottleneck, producer, producerCost, producerStatus, negativeCount, action };
}

function getNextPlanet(save) {
  const currentId = save?.player?.currentPlanet || save?.player?.planet || STARTER_PLANET_ID;
  return PLANETS.find((planet) => planet.id !== currentId && !getPlanetUnlockStatus(planet, save).unlocked) || null;
}

export function BalanceView({ save, onOpenTab }) {
  const balance = getBalance(save);
  const credits = Number(save?.player?.credits || 0);
  const runwayHours = balance.totalMaintenance > 0 ? credits / balance.totalMaintenance : 0;
  const simulations = [1, 6, 24].map((hours) => simulate(save, balance, hours));
  const nextPlanet = getNextPlanet(save);
  const nextPlanetStatus = nextPlanet ? getPlanetUnlockStatus(nextPlanet, save) : null;
  const history = safeArray(save?.economicHistory).slice(0, 8);
  const insight = getStrategicInsight(save, balance);

  return (
    <div style={styles.wrap}>
      <div style={{ ...styles.card, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div className="pw-section-kicker">BALANCE</div>
            <div style={{ color: '#f8fafc', fontSize: 18, fontWeight: 900 }}>
              Autonomia {balance.totalMaintenance > 0 ? formatHours(runwayHours) : 'estable'}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              {fmt(balance.totalProduction)} produccion/h · {fmt(balance.totalMaintenance)} cr mantenimiento/h · {balance.readyContracts} contratos listos
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => onOpenTab?.('business')} style={styles.actionButton}>Empresas</button>
            <button type="button" onClick={() => onOpenTab?.('missions')} style={styles.actionButton}>Contratos</button>
            <button type="button" onClick={() => onOpenTab?.('market')} style={styles.actionButton}>Mercado</button>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        <Stat label="Produccion/h" value={fmt(balance.totalProduction)} sub="Todas las empresas" />
        <Stat label="Mantenimiento/h" value={`${fmt(balance.totalMaintenance)} cr`} sub={`Deuda ${fmt(save?.maintenanceDebt || 0)} cr`} />
        <Stat label="Contratos listos" value={balance.readyContracts} sub={`${balance.expiringContracts} urgentes`} />
        <Stat label="Creditos" value={fmt(credits)} sub="Caja actual" />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(150px, 1fr) minmax(110px, 0.8fr) minmax(150px, 1fr) minmax(180px, 1.4fr)',
          gap: 8,
          alignItems: 'center',
          padding: 10,
          borderRadius: 10,
          background: 'rgba(15,23,42,0.76)',
          border: '1px solid rgba(148,163,184,0.12)',
        }}
      >
        <div>
          <div style={styles.label}>Recurso bloqueante</div>
          <div style={{ color: '#f8fafc', fontWeight: 900 }}>{insight.bottleneck?.name || 'Sin datos'}</div>
        </div>
        <div>
          <div style={styles.label}>Atasco</div>
          <div style={{ color: '#f8fafc', fontWeight: 900 }}>{insight.bottleneck ? formatHours(insight.bottleneck.timeToEmpty) : '--'}</div>
        </div>
        <div>
          <div style={styles.label}>Siguiente empresa</div>
          <div style={{ color: '#bae6fd', fontWeight: 900 }}>{insight.producer?.name || 'Ninguna'}</div>
        </div>
        <div style={{ color: '#cbd5e1', fontSize: 12 }}>{insight.action}</div>
      </div>

      <div style={styles.table}>
        {balance.rows.map((row) => (
          <div key={row.meta.key} style={styles.row}>
            <div>
              <div style={{ color: '#f8fafc', fontWeight: 900 }}>{row.meta.name}</div>
              <div style={{ color: '#94a3b8', fontSize: 11 }}>{row.count} activas · {row.paused} pausadas</div>
            </div>
            <div><span style={styles.head}>Prod</span> {fmt(row.production)}/h</div>
            <div><span style={styles.head}>Coste</span> {fmt(row.maintenance)} cr/h</div>
            <div><span style={styles.head}>Stock</span> {fmt(row.stored)}</div>
            <div><span style={styles.head}>Nivel</span> {row.meta.unlockLevel}</div>
          </div>
        ))}
      </div>

      <details style={styles.card}>
        <summary style={{ cursor: 'pointer', color: '#f8fafc', fontWeight: 900 }}>Ver simulacion, planetas e historial</summary>
        <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
          <div style={styles.grid}>
            {simulations.map((simulation) => (
              <Stat
                key={simulation.hours}
                label={`En ${simulation.hours}h`}
                value={`${fmt(simulation.maintenance)} cr`}
                sub={`${simulation.readyAfter} contratos listos; peor stock ${simulation.resources[0]?.name || '--'} ${fmt(simulation.resources[0]?.projected || 0)}`}
              />
            ))}
            <Stat
              label="Siguiente planeta"
              value={nextPlanet?.name || 'Completo'}
              sub={nextPlanet ? `${fmt((nextPlanetStatus?.overallProgress || 0) * 100, 0)}% de requisitos` : 'Sin ruta pendiente'}
            />
          </div>
          <div style={styles.table}>
            {history.map((item, index) => (
              <div key={`${item.at}-${index}`} style={styles.row}>
                <div>{safeDateLabel(item.at)}</div>
                <div>Prod {fmt(item.production)}</div>
                <div>Coste {fmt(item.maintenance)}</div>
                <div>Cr {fmt(item.credits)}</div>
                <div>{item.note || 'registro'}</div>
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}


function AutonomyStat({ runwayHours, hasMaintenance }) {
  const hours = Math.floor(runwayHours);
  const mins  = Math.round((runwayHours - hours) * 60);
  const label = !hasMaintenance
    ? 'Sin costes operativos'
    : runwayHours >= 48
    ? `${Math.floor(runwayHours / 24)}d ${hours % 24}h`
    : runwayHours >= 1
    ? `${hours}h ${mins}m`
    : `${Math.round(runwayHours * 60)}min`;

  const color = !hasMaintenance ? '#20c8a0'
    : runwayHours < 1  ? '#e84040'
    : runwayHours < 4  ? '#e8a020'
    : '#20c8a0';

  const urgency = !hasMaintenance ? null
    : runwayHours < 1  ? 'Critico — empresas a punto de parar'
    : runwayHours < 4  ? 'Bajo — recarga creditos pronto'
    : runwayHours < 24 ? 'Estable por ahora'
    : 'Colonia autosuficiente';

  return (
    <div style={{
      background: `${color}11`,
      border: `1.5px solid ${color}44`,
      borderRadius: 12,
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginBottom: 4,
    }}>
      <div>
        <div style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: `${color}cc`, fontWeight: 600, marginBottom: 2 }}>
          Autonomia de colonia
        </div>
        {urgency && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{urgency}</div>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 900, color, fontFamily: 'inherit', letterSpacing: -1, flexShrink: 0 }}>
        {label}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return <div style={styles.card}><div style={styles.label}>{label}</div><div style={styles.value}>{value}</div><div style={styles.sub}>{sub}</div></div>;
}

function InsightItem({ label, value, sub }) {
  return <div style={styles.insightItem}><div style={styles.label}>{label}</div><div style={styles.value}>{value}</div><div style={styles.sub}>{sub}</div></div>;
}

export default BalanceView;
