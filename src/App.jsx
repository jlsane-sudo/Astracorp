import './styles/global.css';
import { Component, lazy, Suspense, startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Confetti, EventBanner, Notification } from './components/Overlays';
import { Tabs } from './components/Tabs';
import { useAstraCorpGame } from './hooks/useAstraCorpGame';
import { supabase } from './lib/supabase';
import ToastStack from './components/ToastStack';
import TutorialPanel from './components/TutorialPanel';
import StrategyPanel from './components/StrategyPanel';
import MilestonesPanel from './components/MilestonesPanel';
import RhythmPanel from './components/RhythmPanel';
import ReturnScreen from './components/ReturnScreen';
import { sectorAssets } from './assets/generated/assets';
import { getCompanyBuildCost } from './data/companyTypes';
import { getPlanetById } from './data/planets';
import {
  getCurrentPlanetIdFromSave,
  getEnergyCost,
  getLevelUnlocks,
  getNextLevelPreview,
  getTerritoryBattlePreview,
} from './hooks/engine/gamePureLogic';
import {
  TERRITORY_ATTACK_CREDIT_COST,
  TERRITORY_REINFORCE_COST,
} from './hooks/engine/gameConstants';

const SHOW_SIDEBAR_GUIDANCE_PANELS = false;
const SHOW_SIDEBAR_PROGRESS_PANELS = false;
const SHOW_OPERATIONAL_QUEUE = false;
const SHOW_DETAIL_PANELS = false;
const SHOW_SIDEBAR = SHOW_SIDEBAR_GUIDANCE_PANELS || SHOW_SIDEBAR_PROGRESS_PANELS;
const SHOW_LOG_RAIL = false;

const lazyNamed = (loader, exportName) =>
  lazy(() => loader().then((module) => ({ default: module[exportName] })));

const withTimeout = async (promise, ms, label = 'Operacion') => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} agoto el tiempo de espera`)), ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

const WELCOME_SEEN_KEY = 'astracorp-welcome-seen-v1';

const AuthScreen = lazy(() => import('./components/AuthScreen'));
const StartScreen = lazy(() => import('./components/StartScreen'));
const PlanetSelectionScreen = lazy(() => import('./components/PlanetSelectionScreen'));
const PlanetArrivalModal = lazy(() => import('./components/PlanetArrivalModal'));
const PlanetTransitOverlay = lazy(() => import('./components/PlanetTransitOverlay'));
const AdsView = lazyNamed(() => import('./components/views/AdsView'), 'AdsView');
const BusinessView = lazy(() => import('./components/views/BusinessView'));
const HeadquartersView = lazyNamed(() => import('./components/views/HeadquartersView'), 'HeadquartersView');
const ChatView = lazyNamed(() => import('./components/views/ChatView'), 'ChatView');
const LogView = lazyNamed(() => import('./components/views/LogView'), 'LogView');
const MapView = lazyNamed(() => import('./components/views/MapView'), 'MapView');
const MarketView = lazyNamed(() => import('./components/views/MarketView'), 'MarketView');
const MissionsView = lazyNamed(() => import('./components/views/MissionsView'), 'MissionsView');
const BalanceView = lazyNamed(() => import('./components/views/BalanceView'), 'BalanceView');
const PlayersView = lazyNamed(() => import('./components/views/PlayersView'), 'PlayersView');
const PoliticsView = lazyNamed(() => import('./components/views/PoliticsView'), 'PoliticsView');
const ProjectsView = lazyNamed(() => import('./components/views/ProjectsView'), 'ProjectsView');
const ResearchView = lazy(() => import('./components/views/ResearchView'));
const WorkView = lazyNamed(() => import('./components/views/WorkView'), 'WorkView');

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('AstraCorp render error:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        minHeight: '100vh',
        padding: 24,
        background: '#030712',
        color: '#e5e7eb',
        display: 'grid',
        alignContent: 'center',
        gap: 12,
      }}>
        <div style={{ maxWidth: 760, padding: 18, borderRadius: 14, border: '1px solid rgba(248,113,113,0.35)', background: 'rgba(127,29,29,0.18)' }}>
          <div style={{ color: '#fecaca', fontSize: 18, fontWeight: 900 }}>AstraCorp ha encontrado un dato incompatible.</div>
          <div style={{ marginTop: 8, color: '#cbd5e1', fontSize: 13, lineHeight: 1.5 }}>
            La partida no se ha borrado. Recarga la pagina; si vuelve a pasar, abre el tab Mapa o Balance y pasame este mensaje.
          </div>
          <pre style={{ marginTop: 12, whiteSpace: 'pre-wrap', color: '#fca5a5', fontSize: 12 }}>
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: 12, border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 800, background: '#38bdf8', color: '#06111f' }}
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }
}

function ScreenLoader({ message = 'Cargando modulo...' }) {
  return (
    <div
      style={{
        padding: 30,
        color: 'white',
        background: '#0b0f17',
        minHeight: '100vh',
      }}
    >
      {message}
    </div>
  );
}

function EarlyGuideBanner({
  save,
  tutorialStep,
  onOpenStep,
  onShowSidebar,
  sidebarCollapsed,
}) {
  const level = Number(save?.player?.level ?? 1);
  const credits = Number(save?.player?.credits ?? 0);
  const works = Number(save?.stats?.works ?? 0);
  const companies = Array.isArray(save?.companies) ? save.companies.length : 0;
  const tutorialFinished = Boolean(save?.tutorial?.finished);

  if (tutorialFinished || level > 2) return null;

  return (
    <div
      className="pw-early-guide"
      style={{
        marginBottom: 12,
        padding: 14,
        borderRadius: 14,
        border: '1px solid rgba(103,232,249,0.18)',
        background:
          'linear-gradient(135deg, rgba(103,232,249,0.10), rgba(34,197,94,0.06))',
        boxShadow: '0 12px 28px rgba(2,6,23,0.18)',
        display: 'grid',
        gap: 10,
      }}
    >
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#67e8f9',
            textTransform: 'uppercase',
            letterSpacing: 0.7,
            marginBottom: 4,
          }}
        >
          Arranque guiado
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#f8fafc', marginBottom: 4 }}>
          {tutorialStep?.title || 'Empieza por la base'}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: '#dbe7f5', maxWidth: 880 }}>
          {tutorialStep?.desc ||
            'Tu prioridad ahora es entender el bucle basico: trabajar, construir una primera empresa y subir al nivel 2 antes de abrir mas sistemas.'}
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: 8,
        }}
      >
        <div style={guideStatStyle}>
          <div style={guideStatLabelStyle}>Nivel</div>
          <div style={guideStatValueStyle}>{level}</div>
        </div>
        <div style={guideStatStyle}>
          <div style={guideStatLabelStyle}>Creditos</div>
          <div style={guideStatValueStyle}>{credits.toFixed(1)}</div>
        </div>
        <div style={guideStatStyle}>
          <div style={guideStatLabelStyle}>Trabajos</div>
          <div style={guideStatValueStyle}>{works}</div>
        </div>
        <div style={guideStatStyle}>
          <div style={guideStatLabelStyle}>Empresas</div>
          <div style={guideStatValueStyle}>{companies}</div>
        </div>
      </div>

      <div
        style={{
          padding: '10px 12px',
          borderRadius: 12,
          background: 'rgba(15,23,42,0.4)',
          border: '1px solid rgba(255,255,255,0.06)',
          fontSize: 12,
          color: '#cbd5e1',
          lineHeight: 1.5,
        }}
      >
        Orden recomendado: <strong>Trabajos</strong> {'->'} <strong>Mercado</strong> {'->'}{' '}
        <strong>Primera empresa</strong> {'->'} <strong>Nivel 2</strong>. Politica y sistemas avanzados pueden esperar.
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tutorialStep?.ctaTab && (
          <button
            type="button"
            onClick={() => onOpenStep?.(tutorialStep.ctaTab)}
            style={{
              border: 'none',
              borderRadius: 12,
              padding: '10px 14px',
              fontWeight: 800,
              fontSize: 13,
              color: '#06212c',
              background: 'linear-gradient(135deg, #67e8f9, #34d399)',
            }}
          >
            {tutorialStep?.ctaLabel || 'Abrir siguiente paso'}
          </button>
        )}

        {sidebarCollapsed && (
          <button
            type="button"
            onClick={onShowSidebar}
            style={{
              borderRadius: 12,
              padding: '10px 14px',
              fontWeight: 700,
              fontSize: 13,
              color: '#d9f8ff',
              border: '1px solid rgba(103,232,249,0.18)',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            Mostrar panel de ayuda
          </button>
        )}
      </div>
    </div>
  );
}

const getEarlyUnlockedTabs = (save = {}) => {
  const works = Number(save?.stats?.works ?? 0);
  const companies = Array.isArray(save?.companies) ? save.companies.length : 0;
  const level = Number(save?.player?.level ?? 1);
  const tabs = ['home', 'work', 'market'];

  if (works > 0 || companies > 0 || level >= 2) tabs.push('business');
  if (level >= 4) tabs.push('missions');

  return tabs;
};

const getProgressiveUnlockedTabs = (save = {}) => {
  const level = Number(save?.player?.level ?? 1);
  const tabs = getEarlyUnlockedTabs(save);

  if (level >= 10) tabs.push('hq');
  if (level >= 11) tabs.push('research');
  if (level >= 12) tabs.push('projects');
  if (level >= 13) tabs.push('balance');
  if (level >= 14) tabs.push('map');
  if (level >= 15) tabs.push('politics');
  if (level >= 16) tabs.push('ads', 'players', 'chat');

  return [...new Set(tabs)];
};

function StarterFocus({ save, jobs = [], actions }) {
  const [now, setNow] = useState(Date.now());
  const player = save?.player || {};
  const level = Number(player?.level ?? 1);
  const works = Number(save?.stats?.works ?? 0);
  const companies = Array.isArray(save?.companies) ? save.companies.length : 0;
  const activeJob = save?.activeJob || null;
  const firstJob = jobs.find((job) => Number(job?.unlockLevel ?? 1) <= level) || jobs[0];
  const credits = Number(player?.credits ?? 0);
  const water = Number(save?.inventory?.water ?? 0);
  const electricity = Number(save?.inventory?.energy_cells ?? 0);
  const mineral = Number(save?.inventory?.mineral ?? 0);
  const sellableWater = Math.floor(water);
  const sellableElectricity = Math.floor(electricity);
  const sellableMineral = Math.floor(mineral);
  const basicStock = sellableWater + sellableElectricity + sellableMineral;
  const firstCompanyCost = getCompanyBuildCost('dew_collector', 0);
  const activeStartedAt = Number(activeJob?.startedAt ?? 0);
  const activeEndAt = Number(activeJob?.endAt ?? 0);
  const activeTotalMs = Math.max(1, activeEndAt - activeStartedAt);
  const activeRemainingMs = activeJob ? Math.max(0, activeEndAt - now) : 0;
  const activeProgressPct = activeJob
    ? Math.max(0, Math.min(100, ((activeTotalMs - activeRemainingMs) / activeTotalMs) * 100))
    : 0;

  useEffect(() => {
    if (!activeJob?.endAt) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [activeJob?.endAt]);

  let step = {
    kicker: 'Primer paso',
    title: 'Haz tu primer trabajo',
    text: 'Empieza con un turno simple. Ganaras agua, creditos y XP sin tener que entender todavia el resto del juego.',
    button: 'Iniciar trabajo',
    action: () => firstJob && actions.doWork?.(firstJob),
    secondary: 'Despues construiremos tu primera empresa.',
  };

  if (activeJob) {
    step = {
      kicker: 'Trabajo en curso',
      title: activeJob.label,
      text: 'Ya esta funcionando. Puedes dejarlo terminar y el juego te avisara cuando toque el siguiente paso.',
      button: activeJob.adBoostUsed ? 'Impulso usado' : 'Acelerar trabajo',
      action: () => {
        if (activeJob.adBoostUsed) return;
        actions.triggerWorkAdBoost?.();
      },
      secondary: activeJob.adBoostUsed
        ? 'El trabajo ya recibio su impulso. Ahora solo queda esperar el cierre.'
        : 'Veras publicidad y despues el trabajo terminara antes.',
    };
  } else if (works > 0 && companies === 0 && basicStock > 0 && credits < firstCompanyCost) {
    step = {
      kicker: 'Segundo paso',
      title: 'Vende tus primeros productos',
      text: 'Ya tienes producto real. Entra al mercado, vende agua y convierte ese trabajo en creditos para construir tu primera empresa.',
      button: 'Abrir mercado',
      action: () => actions.setTab?.('market'),
      secondary: `Tienes ${basicStock.toFixed(0)} producto(s) listos para vender.`,
    };
  } else if (works > 0 && companies === 0) {
    const canBuildFirstCompany = credits >= firstCompanyCost;
    step = {
      kicker: 'Segundo paso',
      title: canBuildFirstCompany ? 'Construye tu primera empresa' : 'Reune creditos para tu primera empresa',
      text: canBuildFirstCompany
        ? 'Ya puedes automatizar produccion. Empieza con agua: es simple, estable y se vende bien.'
        : `Necesitas ${firstCompanyCost.toFixed(0)} creditos para construir el captador de rocio. Sigue haciendo trabajos hasta poder pagarlo.`,
      button: canBuildFirstCompany ? 'Construir captador' : 'Seguir trabajando',
      action: () => {
        if (canBuildFirstCompany) {
          actions.buildCompany?.('dew_collector');
          return;
        }
        firstJob && actions.doWork?.(firstJob);
      },
      secondary: canBuildFirstCompany
        ? 'La empresa producira agua mientras haces otras cosas.'
        : `Ahora tienes ${credits.toFixed(1)} creditos.`,
    };
  } else if (companies > 0 && basicStock <= 0) {
    step = {
      kicker: 'Tercer paso',
      title: 'Sigue produciendo agua',
      text: 'Ahora no tienes producto para vender. Haz otro trabajo o espera a que tu captador tenga agua lista.',
      button: 'Trabajar agua',
      action: () => firstJob && actions.doWork?.(firstJob),
      secondary: 'Cuando tengas agua, podras venderla en el mercado.',
    };
  } else if (companies > 0 && level < 2) {
    step = {
      kicker: 'Tercer paso',
      title: 'Vende agua o sube al nivel 2',
      text: 'Ya tienes produccion. Puedes vender el agua disponible o hacer otro trabajo para avanzar.',
      button: 'Abrir mercado',
      action: () => actions.setTab?.('market'),
      secondary: 'Nivel 2 abre electricidad; por ahora seguimos con agua.',
    };
  } else if (companies > 0) {
    step = {
      kicker: 'Ruta inicial',
      title: 'Vende producto y prepara el pasaje',
      text: 'El bucle ya esta claro: producir agua, electricidad y mineral, vender al mercado y ahorrar para viajar.',
      button: 'Abrir mercado',
      action: () => actions.setTab?.('market'),
      secondary: 'Objetivo de Nexus Prime: comprar el pasaje a Veyron.',
    };
  }

  return (
    <section className="pw-starter-focus">
      <div className="pw-starter-main">
        <div className="pw-starter-kicker">{step.kicker}</div>
        <h1>{step.title}</h1>
        <p>{step.text}</p>
        {activeJob && (
          <div className="pw-starter-job">
            <div className="pw-starter-job-top">
              <span>{activeProgressPct.toFixed(0)}% completado</span>
              <strong>{formatStarterRemaining(activeRemainingMs)}</strong>
            </div>
            <div className="pw-starter-job-track">
              <div style={{ width: `${activeProgressPct}%` }} />
            </div>
            <div className="pw-starter-job-reward">
              +{Number(activeJob.credits ?? 0).toFixed(1)} cr · +{Number(activeJob.xp ?? 0)} XP · +1 producto
            </div>
          </div>
        )}
        <div className="pw-starter-actions">
          {activeJob && !activeJob.adBoostUsed ? (
            <button
              type="button"
              className="pw-starter-action-link"
              onClick={step.action}
            >
              Ver anuncio y acelerar
            </button>
          ) : (
            <button
              type="button"
              onClick={step.action}
              disabled={activeJob ? Boolean(activeJob.adBoostUsed) : !firstJob}
            >
              {step.button}
            </button>
          )}
          <span>{step.secondary}</span>
        </div>
      </div>

      <div className="pw-starter-side" aria-label="Ruta inicial">
        <div className="pw-starter-side-title">Ruta inicial</div>
        <div className={`pw-starter-step ${works > 0 ? 'is-done' : 'is-current'}`}>
          <strong>1</strong>
          <span>Trabajar</span>
        </div>
        <div className={`pw-starter-step ${basicStock <= 0 && works > 0 ? 'is-done' : basicStock > 0 ? 'is-current' : ''}`}>
          <strong>2</strong>
          <span>Vender al mercado</span>
        </div>
        <div className={`pw-starter-step ${companies > 0 ? 'is-done' : works > 0 ? 'is-current' : ''}`}>
          <strong>3</strong>
          <span>Construir empresa</span>
        </div>
        <div className="pw-starter-inventory">
          <div><span>Creditos</span><b>{credits.toFixed(1)}</b></div>
          <div><span>Agua</span><b>{sellableWater}</b></div>
          <div><span>Electricidad</span><b>{sellableElectricity}</b></div>
          <div><span>Mineral</span><b>{sellableMineral}</b></div>
        </div>
      </div>
    </section>
  );
}

function formatStarterRemaining(ms = 0) {
  const totalSec = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min <= 0) return `${sec}s`;
  return `${min}m ${String(sec).padStart(2, '0')}s`;
}

function AlertCenter({ save, onOpenTab }) {
  const now = Date.now();
  const companies = Array.isArray(save?.companies) ? save.companies : [];
  const contracts = Array.isArray(save?.contracts) ? save.contracts : [];
  const territories = Array.isArray(save?.territories) ? save.territories : [];
  const inventory = save?.inventory || {};
  const playerName = save?.player?.name;
  const credits = Number(save?.player?.credits || 0);
  const maintenancePerHour = companies.reduce((sum, company) => sum + Number(company.maintenanceCreditsPerHour || 0), 0);
  const paused = companies.filter((company) => company.maintenancePaused).length;
  const blockedInputs = companies.filter((company) => company.status === 'maintenance_paused').length;
  const urgentContracts = contracts.filter((contract) =>
    !contract?.completed && Number(contract.expiresAt || 0) > now && Number(contract.expiresAt || 0) - now < 8 * 60 * 1000
  ).length;
  const readyContracts = contracts.filter((contract) =>
    !contract?.completed && Number(inventory?.[contract?.itemKey] || 0) >= Number(contract?.qty || 0)
  ).length;
  const boostedContracts = contracts.filter((contract) => contract?.eventBoost && !contract?.completed).length;
  const fullCompanies = companies.filter((company) => {
    const maxStorage = Number(company?.maxStorage || 0);
    return maxStorage > 0 && Number(company?.storage || 0) >= maxStorage * 0.95;
  }).length;
  const nearlyFullCompanies = companies.filter((company) => {
    const maxStorage = Number(company?.maxStorage || 0);
    const storage = Number(company?.storage || 0);
    return maxStorage > 0 && storage >= maxStorage * 0.75 && storage < maxStorage * 0.95;
  }).length;
  const enemyFronts = territories.filter((territory) => territory.controller === playerName && territory.enemyCampaign).length;
  const riskySectors = territories.filter((territory) =>
    territory.controller === playerName &&
    (Number(territory?.threat || 0) >= 70 || Number(territory?.stability || 0) <= 30)
  ).length;
  const activeSectorEvent = save?.activeSectorEvent;
  const maintenanceDebt = Number(save?.maintenanceDebt || 0);
  const activeEvent = save?.activeEvent;
  const alerts = [];
  const addAlert = (alert) => alerts.push({ tone: 'warn', ...alert });

  if (activeEvent) {
    const boostedText = boostedContracts ? ` - ${boostedContracts} contrato(s) mejorados` : '';
    addAlert({
      tab: boostedContracts ? 'missions' : 'market',
      tone: 'info',
      title: 'Evento activo',
      text: `${activeEvent.title || 'Evento de sesion'}${boostedText}.`,
      reason: 'Aprovecha el evento antes de que termine.',
    });
  }
  if (activeSectorEvent && Number(activeSectorEvent.expiresAt || 0) > now) {
    addAlert({
      tab: 'map',
      tone: 'warn',
      title: 'Peticion de sector',
      text: activeSectorEvent.desc || `${activeSectorEvent.territoryName || 'Un sector'} pide ${activeSectorEvent.qty} ${activeSectorEvent.itemName}.`,
      reason: 'Resolver una peticion sube estabilidad y hace que el sector importe mas.',
    });
  }
  if (enemyFronts > 0) addAlert({ tab: 'map', tone: 'danger', title: 'Frentes rivales', text: `${enemyFronts} sector(es) bajo presion rival.`, reason: 'Refuerza o corta suministros para no perderlos.' });
  if (riskySectors > 0) addAlert({ tab: 'map', tone: 'danger', title: 'Sectores inestables', text: `${riskySectors} sector(es) con amenaza alta o baja estabilidad.`, reason: 'La inestabilidad aumenta el riesgo de perdida.' });
  if (urgentContracts > 0) addAlert({ tab: 'missions', tone: 'danger', title: 'Contratos urgentes', text: `${urgentContracts} pedido(s) cerca de expirar.`, reason: 'Estos contratos desaparecen si se acaba el tiempo.' });
  if (readyContracts > 0) addAlert({ tab: 'missions', tone: 'success', title: 'Recompensas listas', text: `${readyContracts} contrato(s) ya se pueden entregar.`, reason: 'Convierte stock en creditos y XP sin esperar mas.' });
  if (fullCompanies > 0) addAlert({ tab: 'business', tone: 'warn', title: 'Almacen lleno', text: `${fullCompanies} empresa(s) casi al limite.`, reason: 'Recoge produccion para no perder ritmo.' });
  else if (nearlyFullCompanies > 0) addAlert({ tab: 'business', tone: 'info', title: 'Produccion acumulada', text: `${nearlyFullCompanies} empresa(s) con bastante stock.`, reason: 'Todavia no es critico, pero puedes recoger pronto.' });
  if (paused || blockedInputs) addAlert({ tab: 'business', tone: 'danger', title: 'Empresas pausadas', text: `${paused || blockedInputs} empresa(s) sin producir por mantenimiento.`, reason: 'Paga o revisa mantenimiento para reactivar la cadena.' });
  if (maintenanceDebt > 0) addAlert({ tab: 'balance', tone: 'warn', title: 'Deuda operativa', text: `${maintenanceDebt.toFixed(2)} creditos pendientes.`, reason: 'La deuda bloquea parte del crecimiento si se acumula.' });
  else if (maintenancePerHour > 0 && credits / maintenancePerHour < 1) addAlert({ tab: 'balance', tone: 'warn', title: 'Mantenimiento alto', text: 'Tienes menos de 1h de margen de creditos.', reason: 'Revisa costes antes de comprar mas empresas.' });
  if (Number(save?.player?.energy || 0) < 10) addAlert({ tab: 'ads', tone: 'warn', title: 'Energia baja', text: 'Te queda poco margen para acciones.', reason: 'Puedes recuperar energia con publicidad o esperar regeneracion.' });
  if (!companies.length && credits >= 8) addAlert({ tab: 'business', tone: 'info', title: 'Primera empresa', text: 'Tienes creditos para empezar produccion estable.', reason: 'Las empresas convierten la partida en progreso automatico.' });

  if (!alerts.length) return null;

  return (
    <div className="pw-alert-center">
      <div className="pw-alert-center-head">
        <span>Centro de alertas</span>
        <strong>{alerts.length}</strong>
      </div>
      <div className="pw-alert-center-grid">
        {alerts.slice(0, 5).map((alert) => (
          <button
            key={`${alert.title}-${alert.tab}`}
            type="button"
            onClick={() => onOpenTab?.(alert.tab)}
            className={`pw-alert-card is-${alert.tone}`}
            title={alert.reason || alert.text}
          >
            <strong>{alert.title}</strong>
            <span>{alert.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function getDailyPriority(save) {
  const now = Date.now();
  const companies = Array.isArray(save?.companies) ? save.companies : [];
  const contracts = Array.isArray(save?.contracts) ? save.contracts : [];
  const territories = Array.isArray(save?.territories) ? save.territories : [];
  const playerName = save?.player?.name;
  const inventory = save?.inventory || {};
  const enemyFronts = territories.filter((territory) => territory.controller === playerName && territory.enemyCampaign).length;
  const riskySectors = territories.filter((territory) =>
    territory.controller === playerName &&
    (Number(territory?.threat || 0) >= 70 || Number(territory?.stability || 0) <= 30)
  ).length;
  const urgentContracts = contracts.filter((contract) => {
    const left = Number(contract?.expiresAt || 0) - now;
    return !contract?.completed && left > 0 && left < 10 * 60 * 1000;
  }).length;
  const readyContracts = contracts.filter((contract) =>
    !contract?.completed && Number(inventory?.[contract?.itemKey] || 0) >= Number(contract?.qty || 0)
  ).length;
  const collectableCompanies = companies.filter((company) => Number(company?.storage || 0) > 0).length;

  if (enemyFronts) return { tab: 'map', title: 'Defender frontera', text: `${enemyFronts} frente(s) rival(es) activos.` };
  if (riskySectors) return { tab: 'map', title: 'Estabilizar sectores', text: `${riskySectors} sector(es) en zona roja.` };
  if (urgentContracts) return { tab: 'missions', title: 'Cerrar urgencias', text: `${urgentContracts} contrato(s) cerca de expirar.` };
  if (readyContracts) return { tab: 'missions', title: 'Cobrar progreso', text: `${readyContracts} contrato(s) listos.` };
  if (collectableCompanies) return { tab: 'business', title: 'Recoger produccion', text: `${collectableCompanies} empresa(s) con stock.` };
  if (!companies.length) return { tab: 'business', title: 'Crear base industrial', text: 'Compra la primera empresa estable.' };
  if (Number(save?.player?.level ?? 1) >= 3) return { tab: 'projects', title: 'Empujar megaproyecto', text: 'Convierte stock, creditos y anuncios en una meta grande.' };
  return { tab: 'work', title: 'Subir nivel', text: 'Haz trabajo o prepara recursos para el siguiente desbloqueo.' };
}

function ImpactPanel({ save, onOpenTab }) {
  const now = Date.now();
  const tab = save?.tab || 'work';
  const playerName = save?.player?.name;
  const selectedId = save?.selTer?.id;
  const selectedTerritory = (save?.territories || []).find((territory) => Number(territory.id) === Number(selectedId)) || save?.selTer;
  const priority = getDailyPriority(save);
  const impacts = [];
  const addImpact = (impact) => impacts.push(impact);

  if (tab === 'missions') {
    const readyContract = (save?.contracts || []).find((contract) =>
      !contract?.completed &&
      Number(contract?.expiresAt || 0) > now &&
      Number(save?.inventory?.[contract?.itemKey] || 0) >= Number(contract?.qty || 0)
    );
    if (readyContract) {
      addImpact({
        title: 'Entregar contrato',
        cost: `-${getEnergyCost('deliverContract', save.research, save.hq)} energia · -${readyContract.qty} ${readyContract.itemName}`,
        result: `+${Number(readyContract.reward?.credits || 0).toFixed(2)} cr · +${Number(readyContract.reward?.xp || 0)} XP`,
        risk: readyContract.territoryExclusive ? 'Si pierdes el sector, este contrato desaparece.' : 'Riesgo bajo.',
      });
    } else {
      addImpact({ title: 'Preparar contrato', cost: 'Sin coste directo', result: 'Compra, produce o espera stock suficiente.', risk: 'Revisa los pedidos con menos tiempo.' });
    }
  }

  if (tab === 'business') {
    const collectable = (save?.companies || []).filter((company) => Number(company?.storage || 0) > 0);
    const totalStock = collectable.reduce((sum, company) => sum + Number(company?.storage || 0), 0);
    addImpact({
      title: collectable.length ? 'Recoger produccion' : 'Produccion pendiente',
      cost: collectable.length ? `-${getEnergyCost('collectCompanyGroup', save.research, save.hq)} energia por grupo` : 'Sin accion inmediata',
      result: collectable.length ? `+${Math.round(totalStock)} recursos acumulados` : 'Espera produccion o construye otra empresa.',
      risk: collectable.length ? 'Evita almacenes llenos.' : 'Riesgo bajo.',
    });
  }

  if (tab === 'map' && selectedTerritory?.id !== undefined) {
    if (selectedTerritory.controller === playerName) {
      addImpact({
        title: `Reforzar ${selectedTerritory.customName || selectedTerritory.name}`,
        cost: `-${TERRITORY_REINFORCE_COST} cr · -${getEnergyCost('reinforceTerritory', save.research, save.hq)} energia`,
        result: '+fortificacion · -amenaza · frena frentes rivales',
        risk: Number(selectedTerritory.threat || 0) >= 70 ? 'Prioridad alta.' : 'Riesgo controlado.',
      });
    } else {
      const preview = getTerritoryBattlePreview({
        territory: selectedTerritory,
        player: save.player,
        inventory: save.inventory,
        territories: save.territories,
        playerName,
        planetId: getCurrentPlanetIdFromSave(save),
        research: save.research,
        hq: save.hq,
      });
      addImpact({
        title: `Campana en ${selectedTerritory.customName || selectedTerritory.name}`,
        cost: `-${TERRITORY_ATTACK_CREDIT_COST} cr · -${getEnergyCost('doBattle', save.research, save.hq)} energia`,
        result: preview ? `${preview.successChance}% exito · +${preview.progressOnWin}% campana si ganas` : 'Selecciona un sector rival.',
        risk: preview ? `Progreso actual ${preview.campaignProgress}%.` : 'Riesgo desconocido.',
      });
    }
  }

  if (tab === 'ads') {
    addImpact({
      title: 'Publicidad',
      cost: `-${getEnergyCost('claimRewardAd', save.research, save.hq)} energia`,
      result: '+creditos · +energia · mejora el ritmo de sesion',
      risk: 'No reemplaza produccion estable.',
    });
  }

  if (tab === 'work') {
    addImpact({
      title: save?.activeJob ? 'Trabajo en curso' : 'Iniciar trabajo',
      cost: save?.activeJob ? 'Sin coste adicional' : 'Coste de energia segun trabajo',
      result: save?.activeJob ? `${save.activeJob.label} terminara pronto.` : '+creditos · +XP · posible recurso',
      risk: Number(save?.player?.energy || 0) < 10 ? 'Energia baja.' : 'Riesgo bajo.',
    });
  }

  const recent = (save?.log || []).slice(0, 3).map((entry) => entry?.msg || String(entry));
  if (!impacts.length && !recent.length) return null;

  return (
    <div className="pw-impact-panel">
      <button type="button" className="pw-impact-priority" onClick={() => onOpenTab?.(priority.tab)} title="Ir a la prioridad recomendada">
        <span>Prioridad diaria</span>
        <strong>{priority.title}</strong>
        <em>{priority.text}</em>
      </button>
      {impacts.length ? (
        <div className="pw-impact-grid">
          {impacts.slice(0, 2).map((impact) => (
            <div className="pw-impact-card" key={`${impact.title}-${impact.cost}`}>
              <strong>{impact.title}</strong>
              <span>{impact.cost}</span>
              <span>{impact.result}</span>
              <em>{impact.risk}</em>
            </div>
          ))}
        </div>
      ) : null}
      {recent.length ? (
        <div className="pw-impact-history">
          <span>Consecuencias recientes</span>
          {recent.map((entry, index) => (
            <p key={`${index}-${entry}`}>{entry}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const TAB_LABELS = {
  home: 'Inicio',
  map: 'Mapa',
  work: 'Trabajos',
  business: 'Empresas',
  hq: 'Sede',
  research: 'Mejoras',
  market: 'Mercado',
  ads: 'Ads',
  projects: 'Proyectos',
  missions: 'Misiones',
  balance: 'Balance',
  politics: 'Politica',
  players: 'Jugadores',
  chat: 'Chat',
};

function HomeView({ save, currentRegion, onOpenTab }) {
  const priority = getDailyPriority(save);
  const companies = Array.isArray(save?.companies) ? save.companies : [];
  const contracts = Array.isArray(save?.contracts) ? save.contracts : [];
  const territories = Array.isArray(save?.territories) ? save.territories : [];
  const inventory = save?.inventory || {};
  const playerName = save?.player?.name;
  const readyContracts = contracts.filter((contract) =>
    !contract?.completed && Number(inventory?.[contract?.itemKey] || 0) >= Number(contract?.qty || 0)
  ).length;
  const collectableCompanies = companies.filter((company) => Number(company?.storage || 0) > 0).length;
  const enemyFronts = territories.filter((territory) => territory.controller === playerName && territory.enemyCampaign).length;
  const riskySectors = territories.filter((territory) =>
    territory.controller === playerName &&
    (Number(territory?.threat || 0) >= 70 || Number(territory?.stability || 0) <= 30)
  ).length;
  const nextUnlock = getNextLevelPreview(save?.player);
  const actions = getAvailableActions(save).slice(0, 3);
  const maintenanceDebt = Number(save?.maintenanceDebt ?? 0);
  const energy = Number(save?.player?.energy ?? 0);
  const maxEnergy = Number(save?.player?.maxEnergy ?? 100);
  const recent = (save?.log || []).slice(0, 4).map((entry) => entry?.msg || String(entry));
  const cards = [
    { tab: 'business', label: 'Empresas', value: `${collectableCompanies}`, text: 'listas para recoger' },
    { tab: 'missions', label: 'Contratos', value: `${readyContracts}`, text: 'entregables ahora' },
    { tab: 'map', label: 'Mapa', value: `${enemyFronts + riskySectors}`, text: 'alertas territoriales' },
    { tab: 'hq', label: 'Base', value: currentRegion?.name || 'Sin region', text: currentRegion?.bonusLabel || 'sin bonus activo' },
  ];

  return (
    <div className="pw-home">
      <button type="button" className="pw-home-hero" onClick={() => onOpenTab?.(priority.tab)}>
        <img className="pw-home-hero-art" src={sectorAssets.nexusPrime} alt="" aria-hidden="true" />
        <span>Ahora</span>
        <strong>{priority.title}</strong>
        <em>{priority.text}</em>
      </button>

      <div className="pw-home-grid">
        {cards.map((card) => (
          <button key={card.label} type="button" className="pw-home-card" onClick={() => onOpenTab?.(card.tab)}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <em>{card.text}</em>
          </button>
        ))}
      </div>

      <div className="pw-home-actions">
        {actions.map((item) => (
          <button key={`${item.tab}-${item.title}`} type="button" onClick={() => onOpenTab?.(item.tab)}>
            {item.title}
          </button>
        ))}
        <button type="button" onClick={() => onOpenTab?.('work')}>Trabajar</button>
      </div>

      <div className="pw-home-strip">
        <button type="button" onClick={() => onOpenTab?.('work')}>
          <span>Nivel {nextUnlock.nextLevel}</span>
          <strong>{Math.floor(nextUnlock.xp)}/{nextUnlock.needed} XP</strong>
          <em>{nextUnlock.unlocks[0] || 'Siguiente desbloqueo'}</em>
        </button>
        <button type="button" onClick={() => onOpenTab?.('ads')}>
          <span>Energia</span>
          <strong>{Math.round(energy)}/{Math.round(maxEnergy)}</strong>
          <em>{energy < maxEnergy * 0.2 ? 'Recuperar pronto' : 'Ritmo correcto'}</em>
        </button>
        <button type="button" onClick={() => onOpenTab?.('balance')}>
          <span>Deuda</span>
          <strong>{maintenanceDebt.toFixed(0)} cr</strong>
          <em>{maintenanceDebt > 0 ? 'Prioriza liquidez' : 'Sin deuda activa'}</em>
        </button>
      </div>

      {recent.length ? (
        <div className="pw-home-recent">
          <span>Ultimo movimiento</span>
          {recent.map((entry, index) => <p key={`${index}-${entry}`}>{entry}</p>)}
        </div>
      ) : null}
    </div>
  );
}

function getDirectorPlan(save, currentRegion) {
  const level = Number(save?.player?.level ?? 1);
  const credits = Number(save?.player?.credits ?? 0);
  const energy = Number(save?.player?.energy ?? 0);
  const maxEnergy = Number(save?.player?.maxEnergy ?? 100);
  const companies = Array.isArray(save?.companies) ? save.companies : [];
  const maintenanceDebt = Number(save?.maintenanceDebt ?? 0);
  const territories = Array.isArray(save?.territories) ? save.territories : [];
  const playerName = save?.player?.name;
  const readyCompanies = companies.filter((company) => {
    const storage = Number(company?.storage ?? 0);
    const maxStorage = Number(company?.maxStorage ?? 0);
    return maxStorage > 0 && storage >= maxStorage * 0.75;
  }).length;
  const now = Date.now();
  const contracts = Array.isArray(save?.contracts) ? save.contracts : [];
  const readyContracts = contracts.filter((contract) =>
    !contract?.completed && Number(save?.inventory?.[contract?.itemKey] ?? 0) >= Number(contract?.qty ?? 0)
  ).length;
  const urgentContracts = contracts.filter((contract) => {
    const left = Number(contract?.expiresAt || 0) - now;
    return !contract?.completed && left > 0 && left < 10 * 60 * 1000;
  }).length;
  const enemyFronts = territories.filter((territory) => territory.controller === playerName && territory.enemyCampaign).length;
  const dangerousTerritories = territories.filter((territory) =>
    territory.controller === playerName &&
    (Number(territory.threat ?? 0) >= 70 || Number(territory.stability ?? 0) <= 30)
  ).length;
  const ownCampaigns = territories.filter((territory) =>
    territory.controller !== playerName &&
    territory.campaign?.ownerName === playerName &&
    Number(territory.campaign?.progress ?? 0) > 0
  ).length;
  const fullStores = companies.filter((company) => {
    const maxStorage = Number(company?.maxStorage ?? 0);
    return maxStorage > 0 && Number(company?.storage ?? 0) >= maxStorage * 0.95;
  }).length;
  const maintenancePerHour = companies.reduce((sum, company) => sum + Number(company.maintenanceCreditsPerHour || 0), 0);
  const creditRunwayHours = maintenancePerHour > 0 ? credits / maintenancePerHour : Infinity;
  const energyPressure = maxEnergy > 0 ? energy / maxEnergy : 1;

  const candidates = [
    {
      score: enemyFronts ? 120 : 0,
      tab: 'map',
      title: 'Defiende la frontera',
      text: `${enemyFronts} frente(s) rival(es) estan probando tus sectores. Corta suministros o refuerza antes de que escalen.`,
      avoid: 'No abras nuevas conquistas hasta limpiar el frente activo.',
      tone: 'alta',
      reason: 'Perder un sector duele mas que retrasar una expansion.',
    },
    {
      score: dangerousTerritories ? 112 : 0,
      tab: 'map',
      title: 'Estabiliza sectores',
      text: `${dangerousTerritories} sector(es) estan en riesgo por amenaza o baja estabilidad.`,
      avoid: 'Evita gastar energia en ataques si tu mapa interior esta temblando.',
      tone: 'alta',
      reason: 'Defender ahora reduce ansiedad futura.',
    },
    {
      score: urgentContracts ? 104 : 0,
      tab: 'missions',
      title: 'Cierra contratos urgentes',
      text: `${urgentContracts} pedido(s) estan cerca de expirar. Mira si puedes entregar o producir lo que falta.`,
      avoid: 'No vendas recursos clave antes de revisar estos contratos.',
      tone: 'alta',
      reason: 'Los temporizadores crean perdida real si los ignoras.',
    },
    {
      score: readyContracts ? 98 : 0,
      tab: 'missions',
      title: 'Cobra pedidos listos',
      text: `${readyContracts} contrato(s) ya se pueden entregar. Es la conversion mas limpia de stock en progreso.`,
      avoid: 'No acumules stock parado si ya tiene comprador.',
      tone: 'media',
      reason: 'Recompensa inmediata y sin riesgo.',
    },
    {
      score: energyPressure < 0.15 ? 92 : 0,
      tab: 'ads',
      title: 'Recupera energia',
      text: 'Estas bajo de energia. Haz una pausa operativa o usa el centro publicitario antes de encadenar acciones.',
      avoid: 'No gastes la energia restante en acciones de bajo impacto.',
      tone: 'media',
      reason: 'Sin energia, cada plan se queda a medias.',
    },
    {
      score: maintenanceDebt > 0 ? 94 : creditRunwayHours < 1 ? 90 : 0,
      tab: 'balance',
      title: 'Protege liquidez',
      text: maintenanceDebt > 0
        ? 'Tienes deuda de mantenimiento. Recupera liquidez para que la industria no se pare.'
        : 'Tu margen de creditos frente al mantenimiento es bajo. Revisa Balance antes de construir mas.',
      avoid: 'No amplíes empresas si no puedes pagar su mantenimiento.',
      tone: 'media',
      reason: 'La deuda hace que la produccion se pare y frustra el ritmo.',
    },
    {
      score: readyCompanies ? 82 : 0,
      tab: 'business',
      title: 'Recoge produccion',
      text: `${readyCompanies} empresa(s) tienen stock alto. Recoger libera almacenamiento y alimenta contratos.`,
      avoid: 'No dejes almacenes llenos mientras produces recursos que necesitas.',
      tone: 'baja',
      reason: 'Pequena accion, mucho orden.',
    },
    {
      score: fullStores ? 76 : 0,
      tab: 'business',
      title: 'Desatasca almacenes',
      text: `${fullStores} empresa(s) estan casi al limite. Recoge o vende para que no se congele el flujo.`,
      avoid: 'No construyas mas de lo mismo si ya no puedes guardar la produccion.',
      tone: 'baja',
      reason: 'El progreso invisible tambien cuenta.',
    },
    {
      score: ownCampaigns ? 70 : 0,
      tab: 'map',
      title: 'Continua una campaña',
      text: `${ownCampaigns} campaña(s) propias ya tienen progreso. Rematar una linea abierta da sensacion de cierre.`,
      avoid: 'No abras tres frentes nuevos si ya tienes uno empezado.',
      tone: 'baja',
      reason: 'Cerrar ciclos se siente mejor que dispersarse.',
    },
    {
      score: companies.length === 0 && credits >= 8 ? 68 : 0,
      tab: 'business',
      title: 'Automatiza la base',
      text: 'Construye tu primera empresa para que la colonia produzca incluso cuando no estas haciendo trabajos.',
      avoid: 'No saltes a mercado o politica antes de tener produccion propia.',
      tone: 'baja',
      reason: 'La primera automatizacion cambia el ritmo mental del juego.',
    },
    {
      score: level >= 4 ? 54 : 42,
      tab: level >= 4 ? 'balance' : 'work',
      title: level >= 4 ? 'Ordena el siguiente salto' : 'Haz un turno simple',
      text: level >= 4
        ? 'La partida esta estable. Mira Balance y decide una cadena prioritaria antes de gastar.'
        : 'Haz trabajos, sube nivel y junta creditos. La base todavia manda.',
      avoid: level >= 4
        ? 'No cambies de objetivo cada minuto; elige una cadena y empujala.'
        : 'No abras demasiados sistemas de golpe.',
      tone: 'estable',
      reason: 'Cuando no hay incendio, la claridad vale mas que la prisa.',
    },
  ];

  const focus = candidates.sort((a, b) => b.score - a.score)[0];
  const activePressureCount = [
    enemyFronts > 0,
    dangerousTerritories > 0,
    urgentContracts > 0,
    energyPressure < 0.15,
    creditRunwayHours < 1,
  ].filter(Boolean).length;
  const risk = activePressureCount >= 2
    ? 'Tension alta'
    : activePressureCount === 1
      ? 'Atencion'
      : 'Operativa estable';

  return {
    ...focus,
    risk,
    activePressureCount,
    regionName: currentRegion?.name || 'Alpha District',
  };
}

function OperationalFocus({ save, currentRegion, onOpenTab }) {
  const focus = getDirectorPlan(save, currentRegion);
  const toneColor = focus.tone === 'alta'
    ? '#f87171'
    : focus.tone === 'media'
      ? '#fbbf24'
      : focus.tone === 'baja'
        ? '#67e8f9'
        : '#4ade80';

  return (
    <div className="pw-focus-strip">
      <div className="pw-focus-main">
        <div className="pw-focus-kicker">Director operativo</div>
        <div className="pw-focus-title">{focus.title}</div>
        <div className="pw-focus-text">{focus.text}</div>
        <div className="pw-focus-avoid">{focus.avoid}</div>
      </div>
      <div className="pw-focus-metrics">
        <div className="pw-focus-chip">
          <span>Tension</span>
          <strong style={{ color: toneColor }}>{focus.risk}</strong>
        </div>
        <div className="pw-focus-chip">
          <span>Region</span>
          <strong>{focus.regionName}</strong>
        </div>
        <div className="pw-focus-chip">
          <span>Motivo</span>
          <strong>{focus.reason}</strong>
        </div>
        <button type="button" className="pw-focus-action" onClick={() => onOpenTab?.(focus.tab)}>
          Abrir {TAB_LABELS[focus.tab] || 'Vista'}
        </button>
      </div>
    </div>
  );
}

function getAvailableActions(save) {
  const inventory = save?.inventory || {};
  const contracts = Array.isArray(save?.contracts) ? save.contracts : [];
  const companies = Array.isArray(save?.companies) ? save.companies : [];
  const territories = Array.isArray(save?.territories) ? save.territories : [];
  const playerName = save?.player?.name;
  const energy = Number(save?.player?.energy ?? 0);
  const credits = Number(save?.player?.credits ?? 0);
  const actions = [];

  const enemyFronts = territories.filter((territory) => territory.controller === playerName && territory.enemyCampaign).length;
  const readyContracts = contracts.filter((contract) =>
    !contract?.completed && Number(inventory?.[contract?.itemKey] ?? 0) >= Number(contract?.qty ?? 0)
  ).length;
  const urgentContracts = contracts.filter((contract) => {
    const left = Number(contract?.expiresAt || 0) - Date.now();
    return !contract?.completed && left > 0 && left < 10 * 60 * 1000;
  }).length;
  const collectableCompanies = companies.filter((company) => Number(company?.storage ?? 0) > 0).length;
  const fullCompanies = companies.filter((company) => {
    const maxStorage = Number(company?.maxStorage ?? 0);
    return maxStorage > 0 && Number(company?.storage ?? 0) >= maxStorage * 0.9;
  }).length;

  if (enemyFronts > 0) actions.push({ tab: 'map', tone: 'danger', title: 'Defender frentes', text: `${enemyFronts} frente(s) rival(es)`, cta: 'Abrir mapa' });
  if (readyContracts > 0) actions.push({ tab: 'missions', tone: 'success', title: 'Entregar pedidos', text: `${readyContracts} listo(s)`, cta: 'Entregar' });
  if (urgentContracts > 0) actions.push({ tab: 'missions', tone: 'danger', title: 'Revisar urgentes', text: `${urgentContracts} por expirar`, cta: 'Ver contratos' });
  if (fullCompanies > 0) actions.push({ tab: 'business', tone: 'warn', title: 'Vaciar almacenes', text: `${fullCompanies} casi lleno(s)`, cta: 'Recoger' });
  if (collectableCompanies > 0) actions.push({ tab: 'business', tone: 'success', title: 'Recoger produccion', text: `${collectableCompanies} con stock`, cta: 'Ir a empresas' });
  if (energy < 12) actions.push({ tab: 'ads', tone: 'warn', title: 'Recuperar energia', text: `${Math.round(energy)} EN`, cta: 'Abrir Ads' });
  if (Number(save?.player?.level ?? 1) >= 3) actions.push({ tab: 'projects', tone: 'success', title: 'Megaproyecto', text: 'stock y anuncios', cta: 'Abrir' });
  if (companies.length === 0 && credits >= 8) actions.push({ tab: 'business', tone: 'success', title: 'Primera empresa', text: 'automatiza ingresos', cta: 'Construir' });
  if (actions.length < 2) actions.push({ tab: 'balance', tone: 'neutral', title: 'Leer balance', text: 'siguiente cuello', cta: 'Abrir' });
  if (actions.length < 3) actions.push({ tab: 'work', tone: 'neutral', title: 'Trabajo simple', text: 'creditos y XP', cta: 'Trabajar' });

  return actions.slice(0, 5);
}

function OperationalQueue({ save, actions, onOpenTab }) {
  const items = getAvailableActions(save);
  const readyContracts = (save?.contracts || []).filter((contract) =>
    !contract?.completed && Number(save?.inventory?.[contract?.itemKey] ?? 0) >= Number(contract?.qty ?? 0)
  ).length;
  const collectableCompanies = (save?.companies || []).filter((company) => Number(company?.storage ?? 0) > 0).length;

  const runItem = (item) => {
    if (item.title === 'Entregar pedidos' && readyContracts > 0) {
      actions.deliverAllContractsWithAd?.();
      return;
    }
    if ((item.title === 'Vaciar almacenes' || item.title === 'Recoger produccion') && collectableCompanies > 0) {
      actions.collectAllCompaniesWithAd?.();
      return;
    }
    onOpenTab?.(item.tab);
  };

  return (
    <div className="pw-operational-queue">
      <div className="pw-operational-queue-head">
        <span>Cola operativa</span>
        <strong>{items.length}</strong>
      </div>
      <div className="pw-operational-queue-list">
        {items.map((item) => (
          <button
            key={`${item.tab}-${item.title}`}
            type="button"
            className={`pw-operational-item is-${item.tone}`}
            onClick={() => runItem(item)}
          >
            <span>{item.title}</span>
            <small>{item.text}</small>
            <strong>{item.cta}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

function NextUnlockPanel({ player, onOpenTab }) {
  const preview = getNextLevelPreview(player);

  return (
    <div className="pw-next-unlock">
      <div className="pw-next-unlock-kicker">Proximo desbloqueo</div>
      <div className="pw-next-unlock-title">Nivel {preview.nextLevel}</div>
      <div className="pw-next-unlock-bar">
        <span style={{ width: `${preview.pct}%` }} />
      </div>
      <div className="pw-next-unlock-meta">
        {Math.floor(preview.xp)}/{preview.needed} XP
      </div>
      <div className="pw-next-unlock-list">
        {preview.unlocks.slice(0, 3).map((unlock) => (
          <div key={unlock}>{unlock}</div>
        ))}
      </div>
      <button type="button" className="pw-next-unlock-btn" onClick={() => onOpenTab?.('work')}>
        Ganar XP
      </button>
    </div>
  );
}

function EventHistoryPanel({ history = [] }) {
  const events = Array.isArray(history) ? history.slice(0, 4) : [];
  if (!events.length) return null;

  return (
    <div className="pw-event-history">
      <div className="pw-event-history-kicker">Eventos recientes</div>
      {events.map((event, index) => (
        <div key={`${event.id || event.title}-${index}`} className="pw-event-history-item">
          <strong>{event.title}</strong>
          <span>
            {Number(event.contractsDelivered ?? 0)} contratos · {Number(event.sales ?? 0)} ventas · +{Number(event.bonusCredits ?? 0).toFixed(2)} cr
          </span>
        </div>
      ))}
    </div>
  );
}

function LevelUpModal({ moment, onClose }) {
  if (!moment) return null;

  return (
    <div className="pw-level-modal-layer" role="dialog" aria-modal="true">
      <div className="pw-level-modal">
        <div className="pw-level-modal-kicker">Nivel alcanzado</div>
        <div className="pw-level-modal-title">Nivel {moment.level}</div>
        <div className="pw-level-modal-text">Nuevas opciones disponibles en la colonia.</div>
        <div className="pw-level-modal-list">
          {moment.unlocks.map((unlock) => (
            <div key={unlock}>{unlock}</div>
          ))}
        </div>
        <button type="button" className="pw-level-modal-btn" onClick={onClose}>
          Continuar
        </button>
      </div>
    </div>
  );
}

const guideStatStyle = {
  padding: 10,
  borderRadius: 12,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.06)',
};

const guideStatLabelStyle = {
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: 0.45,
  color: '#94a3b8',
  marginBottom: 4,
};

const guideStatValueStyle = {
  fontSize: 16,
  fontWeight: 800,
  color: '#f8fafc',
};

export default function App() {
  const game = useAstraCorpGame();

  const {
    save,
    allUsers,
    equalShare,
    myAdShare,
    actions,
    jobs,
    currentRegion,
    isRemoteLoaded,
    authReady,
    tutorialStep,
    tutorialSteps,
    returnData,
    clearReturnData,
  } = game;

  const [session, setSession] = useState(null);
  // Defer importConflict detection to avoid Suspense collision
  const [conflictReady, setConflictReady] = useState(false);
  useEffect(() => {
    startTransition(() => setConflictReady(true));
  }, []);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlanetPicker, setShowPlanetPicker] = useState(false);
  const [planetTransit, setPlanetTransit] = useState(null);
  const [planetArrival, setPlanetArrival] = useState(null);
  const [authModalMode, setAuthModalMode] = useState(null);
  const [showWelcome, setShowWelcome] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(WELCOME_SEEN_KEY) !== 'true';
  });
  const [levelMoment, setLevelMoment] = useState(null);
  const previousLevelRef = useRef(Number(save?.player?.level ?? 1));
  const transitTimerRef = useRef(null);
  const topbarRef = useRef(null);
  const playerLevel = Number(save?.player?.level ?? 1);
  const currentPlanetId = save?.player?.currentPlanet || save?.player?.planet;
  const currentVisualPlanet = useMemo(
    () => getPlanetById(currentPlanetId),
    [currentPlanetId]
  );
  const isEarlyFocusMode = playerLevel < 10;
  const unlockedTabs = useMemo(
    () => (playerLevel < 16 ? getProgressiveUnlockedTabs(save) : null),
    [playerLevel, save?.stats?.works, save?.companies?.length]
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = window.localStorage.getItem('pw-sidebar-collapsed');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(max-height: 760px), (max-width: 1320px)').matches;
  });

  useEffect(() => {
    const handleBlockedAction = (event) => {
      actions.notifyBlockedAction?.(event.detail?.reason);
    };
    window.addEventListener('astracorp:blocked-action', handleBlockedAction);
    return () => window.removeEventListener('astracorp:blocked-action', handleBlockedAction);
  }, [actions]);

  useEffect(() => () => {
    if (transitTimerRef.current) clearTimeout(transitTimerRef.current);
  }, []);

  const finishPlanetTransit = (transit) => {
    if (transitTimerRef.current) clearTimeout(transitTimerRef.current);
    transitTimerRef.current = null;
    setPlanetTransit(null);
    setPlanetArrival({ ...transit, arrivedAt: Date.now() });
  };

  const loadProfile = async (userId) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      setProfile(data ?? null);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    let active = true;

    const init = async () => {
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), 5000, 'Sesion de app');

        if (!active) return;

        const currentSession = data?.session ?? null;
        setSession(currentSession);
        setLoading(false);

        if (currentSession?.user) {
          loadProfile(currentSession.user.id);
        }
      } catch (error) {
        console.warn('La sesion no respondio a tiempo, continuando sin bloqueo:', error);
        if (active) {
          setLoading(false);
          setSession(null);
          setProfile(null);
        }
      }
    };

    init();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        if (!active) return;

        setSession(newSession ?? null);
        setLoading(false);

        if (newSession?.user) {
          loadProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      active = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('pw-sidebar-collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!Array.isArray(unlockedTabs)) return;
    if (unlockedTabs.includes(save.tab)) return;
    actions.setTab?.('work');
  }, [actions, save.tab, unlockedTabs]);

  useEffect(() => {
    const currentLevel = Number(save?.player?.level ?? 1);
    const previousLevel = Number(previousLevelRef.current ?? currentLevel);
    if (currentLevel > previousLevel) {
      const moment = {
        level: currentLevel,
        unlocks: getLevelUnlocks(currentLevel),
      };
      setLevelMoment(moment);
      const timer = window.setTimeout(() => setLevelMoment(null), 4200);
      previousLevelRef.current = currentLevel;
      return () => window.clearTimeout(timer);
    }
    previousLevelRef.current = currentLevel;
    return undefined;
  }, [save?.player?.level]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [save.tab]);

  useEffect(() => {
    if (typeof window === 'undefined' || !topbarRef.current) return undefined;

    const syncTopbarHeight = () => {
      const height = topbarRef.current?.offsetHeight || 0;
      document.documentElement.style.setProperty('--pw-topbar-height', `${height}px`);
    };

    syncTopbarHeight();

    const observer =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncTopbarHeight) : null;

    observer?.observe(topbarRef.current);
    window.addEventListener('resize', syncTopbarHeight);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', syncTopbarHeight);
    };
  }, [authReady, isRemoteLoaded, session, sidebarCollapsed]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  const handleOpenLogin = () => startTransition(() => setAuthModalMode('login'));
  const handleOpenSaveProgress = () => startTransition(() => setAuthModalMode('register'));
  const handleCloseAuthModal = () => setAuthModalMode(null);
  const rememberWelcome = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(WELCOME_SEEN_KEY, 'true');
    }
    setShowWelcome(false);
  };
  const handleWelcomeGuest = () => {
    const currentName = save?.player?.name;
    if (!currentName || currentName === 'Invitado') {
      actions.startGame?.('Colono');
    }
    rememberWelcome();
  };
  const handleWelcomeAuth = (mode) => {
    rememberWelcome();
    startTransition(() => setAuthModalMode(mode));
  };
  const handleResetGame = async () => {
    const confirmed = window.confirm(
      'Se reiniciara esta partida desde cero. Quieres empezar de nuevo?'
    );

    if (!confirmed) return;
    await actions.resetGame?.();
  };

  const handleAuthSuccess = ({ mode } = {}) => {
    if (typeof window !== 'undefined' && authModalMode === 'register') {
      window.sessionStorage.setItem(
        'astracorp-pending-account-save-v1',
        JSON.stringify({
          mode: 'save',
          source: mode || 'register',
          save,
        })
      );
    }

    setAuthModalMode(null);
    rememberWelcome();
  };

  const handleResolveImportConflict = async (choice) => {
    await actions.resolveImportConflict?.(choice);
  };

  const handlePlanetSelect = async (planet) => {
    try {
      if (actions.selectPlanet) {
        return await actions.selectPlanet(planet);
      }

      console.error('Falta actions.selectPlanet en useAstraCorpGame');
      return false;
    } catch (error) {
      console.error('Error guardando planeta:', error);
      return false;
    }
  };

  if (loading || !authReady) {
    return <ScreenLoader message="Sincronizando datos orbitales..." />;
  }

  if (!isRemoteLoaded) {
    return <ScreenLoader message="Recuperando capsula de guardado..." />;
  }

  if (conflictReady && save.importConflict) {
    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 140,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
          background: 'rgba(2,6,23,0.97)',
        }}
      >
        <div
          style={{
            width: '100%', maxWidth: 720,
            background: 'rgba(10,15,25,0.98)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18, padding: 22,
            display: 'grid', gap: 14,
            boxShadow: '0 24px 60px rgba(0,0,0,0.38)',
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: '#67e8f9', fontWeight: 800, letterSpacing: 0.8 }}>
              CONFLICTO DE PROGRESO
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
              Esta cuenta ya tiene una partida guardada
            </div>
            <div style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.6, marginTop: 8 }}>
              Elige si quieres conservar tu partida local de invitado o cargar la partida que ya
              existe en la cuenta.
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(103,232,249,0.18)', background: 'rgba(103,232,249,0.06)', display: 'grid', gap: 6 }}>
              <div style={{ fontSize: 11, color: '#67e8f9', fontWeight: 800 }}>Partida local</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{save.importConflict.localSummary?.name}</div>
              <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                Nivel {save.importConflict.localSummary?.level} &mdash; {Number(save.importConflict.localSummary?.credits ?? 0).toFixed(2)} creditos
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {save.importConflict.localSummary?.companies} empresas &mdash; {save.importConflict.localSummary?.contracts} contratos &mdash; {save.importConflict.localSummary?.currentPlanet}
              </div>
            </div>
            <div style={{ padding: 14, borderRadius: 14, border: '1px solid rgba(250,204,21,0.18)', background: 'rgba(250,204,21,0.06)', display: 'grid', gap: 6 }}>
              <div style={{ fontSize: 11, color: '#fde68a', fontWeight: 800 }}>Partida de la cuenta</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{save.importConflict.remoteSummary?.name}</div>
              <div style={{ fontSize: 12, color: '#cbd5e1' }}>
                Nivel {save.importConflict.remoteSummary?.level} &mdash; {Number(save.importConflict.remoteSummary?.credits ?? 0).toFixed(2)} creditos
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                {save.importConflict.remoteSummary?.companies} empresas &mdash; {save.importConflict.remoteSummary?.contracts} contratos &mdash; {save.importConflict.remoteSummary?.currentPlanet}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => handleResolveImportConflict('remote')}
              style={{ padding: '10px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontWeight: 700 }}
            >
              Cargar progreso de la cuenta
            </button>
            <button
              type="button"
              onClick={() => handleResolveImportConflict('local')}
              style={{ padding: '10px 14px', borderRadius: 12, border: 'none', background: 'linear-gradient(90deg, #22d3ee, #a855f7)', color: '#03111f', fontWeight: 800 }}
            >
              Usar progreso local
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showWelcome && !session) {
    return (
      <AppErrorBoundary>
        <Suspense fallback={<ScreenLoader message="Abriendo AstraCorp..." />}>
          <StartScreen
            onStartGuest={handleWelcomeGuest}
            onOpenLogin={() => handleWelcomeAuth('login')}
            onOpenRegister={() => handleWelcomeAuth('register')}
          />
        </Suspense>

        {authModalMode && (
          <Suspense fallback={<ScreenLoader message="Abriendo acceso orbital..." />}>
            <AuthScreen
              key={authModalMode}
              initialMode={authModalMode}
              onClose={handleCloseAuthModal}
              onAuthSuccess={handleAuthSuccess}
            />
          </Suspense>
        )}
      </AppErrorBoundary>
    );
  }

  if (returnData) {
    return <ReturnScreen data={returnData} onContinue={clearReturnData} />;
  }

  return (
    <AppErrorBoundary>
    <div
      className={`pw-app pw-app--planet-${currentVisualPlanet?.id || 'nexus-prime'}`}
      style={{
        '--planet-a': currentVisualPlanet?.colorA || '#55d8ff',
        '--planet-b': currentVisualPlanet?.colorB || '#153b67',
      }}
    >
      <ToastStack toasts={save.toasts} />
      <Notification note={save.note} />
      <Confetti show={save.confetti} />
      <EventBanner
        event={save.activeEvent}
        contracts={save.contracts}
        onClose={actions.closeEventBanner}
        onOpenTab={actions.setTab}
        playerLevel={save.player?.level}
      />
      <LevelUpModal moment={levelMoment} onClose={() => setLevelMoment(null)} />

      <div className="pw-topbar" ref={topbarRef}>
        <Header
          player={save.player}
          inventory={save.inventory}
          username={profile?.username || save.player?.name || 'Invitado'}
          coins={save.player?.credits ?? 0}
          onLogout={handleLogout}
          onOpenLogin={handleOpenLogin}
          onSaveProgress={handleOpenSaveProgress}
          onResetGame={handleResetGame}
          onFillEnergyForTest={actions.fillEnergyForTest}
          onChangePlanet={() => startTransition(() => setShowPlanetPicker(true))}
          onOpenAds={() => actions.setTab('ads')}
          currentRegion={currentRegion}
          isAuthenticated={Boolean(session)}
          rewardAdsToday={save.rewardAdsToday}
          adsViewedToday={save.stats?.adsViewedToday}
          totalAdsViewed={save.stats?.adsViewed}
          adIncomeSummary={save.adIncomeSummary}
        />

        <div className="pw-tabs-bar">
          <Tabs
            tab={save.tab}
            onChange={actions.setTab}
            missions={save.missions}
            contracts={save.contracts}
            unlockedTabs={unlockedTabs}
          />
        </div>
      </div>

      <main className="pw-shell">
        <div className={`pw-dashboard${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}${isEarlyFocusMode ? ' is-starter-mode' : ''}${!SHOW_SIDEBAR && !SHOW_LOG_RAIL ? ' is-clean-layout' : ''}`}>
          {!isEarlyFocusMode && SHOW_SIDEBAR && (
          <aside className="pw-sidebar">
            <div className="pw-sidebar-inner">
              <button
                type="button"
                className="pw-sidebar-toggle"
                onClick={() => setSidebarCollapsed((current) => !current)}
                aria-expanded={!sidebarCollapsed}
                aria-label={sidebarCollapsed ? 'Mostrar panel lateral' : 'Ocultar panel lateral'}
                title={sidebarCollapsed ? 'Mostrar panel lateral' : 'Ocultar panel lateral'}
              >
                <span className="pw-sidebar-toggle-icon">
                  {sidebarCollapsed ? '>' : '<'}
                </span>
                <span className="pw-sidebar-toggle-text">
                  {sidebarCollapsed ? 'Mostrar panel' : 'Ocultar panel'}
                </span>
              </button>

              {!sidebarCollapsed && (
                <>
                  {SHOW_SIDEBAR_PROGRESS_PANELS && (
                    <>
                      <NextUnlockPanel player={save.player} onOpenTab={actions.setTab} />

                      <EventHistoryPanel history={save.eventHistory} />

                      <TutorialPanel
                        save={save}
                        tutorial={save.tutorial}
                        tutorialStep={tutorialStep}
                        tutorialSteps={tutorialSteps}
                        onOpenStep={actions.setTab}
                        onDismiss={actions.dismissTutorial}
                        onReopen={actions.reopenTutorial}
                      />
                    </>
                  )}

                  {SHOW_SIDEBAR_GUIDANCE_PANELS && (
                    <>
                      <StrategyPanel
                        save={save}
                        currentRegion={currentRegion}
                        onOpenTab={actions.setTab}
                      />

                      <MilestonesPanel save={save} onOpenTab={actions.setTab} />

                      <RhythmPanel save={save} onOpenTab={actions.setTab} />
                    </>
                  )}
                </>
              )}
            </div>
          </aside>
          )}

          <section className="pw-content">
            {isEarlyFocusMode && save.tab === 'home' ? (
              <StarterFocus save={save} jobs={jobs} actions={actions} />
            ) : !isEarlyFocusMode ? (
              <EarlyGuideBanner
                save={save}
                tutorialStep={tutorialStep}
                onOpenStep={actions.setTab}
                onShowSidebar={() => setSidebarCollapsed(false)}
                sidebarCollapsed={sidebarCollapsed}
              />
            ) : null}

            {!isEarlyFocusMode && SHOW_OPERATIONAL_QUEUE && (
              <OperationalQueue save={save} actions={actions} onOpenTab={actions.setTab} />
            )}
            {!isEarlyFocusMode && SHOW_DETAIL_PANELS && <AlertCenter save={save} onOpenTab={actions.setTab} />}
            {!isEarlyFocusMode && SHOW_DETAIL_PANELS && save.tab !== 'home' && <ImpactPanel save={save} onOpenTab={actions.setTab} />}

            {!isEarlyFocusMode && SHOW_DETAIL_PANELS && save.tab !== 'home' && <OperationalFocus save={save} currentRegion={currentRegion} onOpenTab={actions.setTab} />}

            {(!isEarlyFocusMode || save.tab !== 'home') && (
            <Suspense fallback={<ScreenLoader message="Cargando panel..." />}>
              <div key={save.tab} className="pw-view-frame">
              {save.tab === 'home' && !isEarlyFocusMode && (
                <HomeView save={save} currentRegion={currentRegion} onOpenTab={actions.setTab} />
              )}

              {save.tab === 'map' && (
                <>
                  <MapView
                    territories={save.territories}
                    selected={save.selTer}
                    playerName={save.player?.name || profile?.username || 'Jugador'}
                    player={save.player}
                    inventory={save.inventory}
                    companies={save.companies}
                    territorialWeeklyEvent={save.territorialWeeklyEvent}
                    research={save.research}
                    battle={save.battle}
                    election={save.election}
                    playerCredits={save.player?.credits ?? 0}
                    rewardAdsToday={save.rewardAdsToday}
                    lastRewardAdAt={save.lastRewardAdAt}
                    activeSectorEvent={save.activeSectorEvent}
                    onClaimRewardAd={actions.claimRewardAd}
                    onSelect={actions.setSelTer}
                    onRenameTerritory={actions.renameTerritory}
                    onResolveSectorEvent={actions.resolveSectorEvent}
                    onCloseSectorEvent={actions.closeSectorEvent}
                    onBattle={actions.doBattle}
                    onSabotage={actions.sabotageTerritory}
                    onSpy={actions.spyTerritory}
                    onHack={actions.hackTerritory}
                    onActivateDefense={actions.activateTerritoryDefense}
                    onReinforce={actions.reinforceTerritory}
                    onReinforceAllWithAd={actions.reinforceAllTerritoriesWithAd}
                    onDisruptEnemyCampaign={actions.disruptEnemyCampaign}
                    onDisruptAllEnemyCampaigns={actions.disruptAllEnemyCampaigns}
                    onBuildTerritoryFort={actions.buildTerritoryFort}
                    onStartElection={actions.startElection}
                    onOpenPolitics={(territory) => {
                      actions.setSelTer(territory);
                      actions.setTab('politics');
                    }}
                    onGoWork={() => actions.setTab('work')}
                  />
                </>
              )}

              {save.tab === 'work' && (
                <WorkView
                  player={save.player}
                  inventory={save.inventory}
                  jobs={jobs}
                  stats={save.stats}
                  activeJob={save.activeJob}
                  onWork={actions.doWork}
                  onTriggerWorkAdBoost={actions.triggerWorkAdBoost}
                />
              )}

              {save.tab === 'business' && (
                <BusinessView
                  save={save}
                  actions={actions}
                  companies={save.companies}
                  player={save.player}
                  currentRegion={currentRegion}
                  onBuildCompany={actions.buildCompany}
                  onCollectCompany={actions.collectCompany}
                  adBoosts={save.adBoosts}
                  onTriggerCompanyAdBoost={actions.triggerCompanyAdBoost}
                />
              )}

              {save.tab === 'research' && (
                <ResearchView
                  player={save.player}
                  research={save.research}
                  researchProjects={save.researchProjects}
                  companies={save.companies}
                  inventory={save.inventory}
                  onUpgrade={actions.buyResearchUpgrade}
                  onTriggerResearchAdBoost={actions.triggerResearchAdBoost}
                  onOpenTab={actions.setTab}
                />
              )}

              {save.tab === 'hq' && (
                <HeadquartersView
                  hq={save.hq}
                  player={save.player}
                  inventory={save.inventory}
                  hqProjects={save.hqProjects}
                  save={save}
                  onUpgrade={actions.buyHqUpgrade}
                  onTriggerHqAdBoost={actions.triggerHqAdBoost}
                  onRepairIntegrity={actions.repairIntegrity}
                  onOpenPlanetProject={() => startTransition(() => setShowPlanetPicker(true))}
                />
              )}


              {save.tab === 'market' && (
                <MarketView
                  market={save.market}
                  inventory={save.inventory}
                  companies={save.companies}
                  onBuy={actions.buyItem}
                  onSell={actions.sellItem}
                  player={save.player}
                  activeEvent={save.activeEvent}
                />
              )}

              {save.tab === 'ads' && (
                <AdsView
                  player={save.player}
                  onClaimRewardAd={actions.claimRewardAd}
                  rewardAdsToday={save.rewardAdsToday}
                  adsViewedToday={save.stats?.adsViewedToday}
                  lastRewardAdAt={save.lastRewardAdAt}
                  adIncomeSummary={save.adIncomeSummary}
                  adIncomeHistory={save.adIncomeHistory}
                  onRefreshAdIncomeSummary={actions.refreshAdIncomeSummary}
                  onBuyAdControlUpgrade={actions.buyAdControlUpgrade}
                  onOpenTab={actions.setTab}
                />
              )}

              {save.tab === 'projects' && (
                <ProjectsView
                  player={save.player}
                  inventory={save.inventory}
                  megaprojects={save.megaprojects}
                  sponsorships={save.sponsorships}
                  onSetActiveMegaproject={actions.setActiveMegaproject}
                  onContributeMegaproject={actions.contributeMegaprojectPhase}
                  onClaimSponsorshipAd={actions.claimSponsorshipAd}
                />
              )}

              {save.tab === 'missions' && (
                <MissionsView
                  missions={save.missions}
                  player={save.player}
                  contracts={save.contracts}
                  inventory={save.inventory}
                  companies={save.companies}
                  market={save.market}
                  activeEvent={save.activeEvent}
                  onDeliverContract={actions.deliverContract}
                  onDeliverAllContractsWithAd={actions.deliverAllContractsWithAd}
                  onRerollContract={actions.rerollContract}
                  onClaimMissionReward={actions.claimMissionReward}
                  onOpenTab={actions.setTab}
                />
              )}

              {save.tab === 'balance' && (
                <BalanceView save={save} onOpenTab={actions.setTab} />
              )}

              {save.tab === 'politics' && (
                <PoliticsView
                  player={save.player}
                  election={save.election}
                  activeElections={game.activeElections}
                  activeElectionsLoading={game.activeElectionsLoading}
                  territories={save.territories}
                  onStartElection={actions.startElection}
                  onVote={actions.voteElection}
                  onClearResult={actions.clearElectionResult}
                  onRefreshActiveElections={game.refreshActiveElections}
                  onOpenTab={actions.setTab}
                  onSelectTerritory={actions.setSelTer}
                />
              )}

              {save.tab === 'players' && (
                <PlayersView
                  players={allUsers}
                />
              )}

              {save.tab === 'chat' && (
                <ChatView
                  chat={save.chat}
                  input={save.chatInput}
                  onInput={actions.setChatInput}
                  onSend={actions.sendChat}
                />
              )}
              </div>

            </Suspense>
            )}
          </section>

          {!isEarlyFocusMode && SHOW_LOG_RAIL && (
          <aside className="pw-log-rail">
            <Suspense fallback={null}>
              <LogView log={save.log} compact />
            </Suspense>
          </aside>
          )}
        </div>
      </main>

      {authModalMode && (
        <Suspense fallback={<ScreenLoader message="Abriendo acceso orbital..." />}>
          <AuthScreen
            key={authModalMode}
            initialMode={authModalMode}
            onClose={handleCloseAuthModal}
            onAuthSuccess={handleAuthSuccess}
            title={authModalMode === 'register' ? 'Guardar progreso actual' : 'Conectar tu cuenta'}
            subtitle={
              authModalMode === 'register'
                ? 'Crea tu cuenta o entra para vincular esta partida'
                : 'Entra para recuperar tu progreso guardado'
            }
            description={
              authModalMode === 'register'
                ? 'Si aun no tienes cuenta, crea una y esta partida de invitado pasara a quedar vinculada a tu perfil.'
                : 'Puedes seguir jugando como invitado, pero al iniciar sesion recuperaras tu progreso guardado en la nube.'
            }
          />
        </Suspense>
      )}



      {showPlanetPicker && (
          <Suspense fallback={<ScreenLoader message="Abriendo selector planetario..." />}>
            <PlanetSelectionScreen
              save={save}
              currentPlanetId={save.player?.currentPlanet || save.player?.planet}
              onSelect={async (planet) => {
                const fromId = save.player?.currentPlanet || save.player?.planet;
                const ok = await handlePlanetSelect(planet);
                if (ok !== false) {
                  setShowPlanetPicker(false);
                  const transit = { fromId, toId: planet.id, createdAt: Date.now() };
                  setPlanetArrival(null);
                  setPlanetTransit(transit);
                  if (transitTimerRef.current) clearTimeout(transitTimerRef.current);
                  transitTimerRef.current = setTimeout(() => finishPlanetTransit(transit), 4200);
                }
              }}
            onCancel={() => setShowPlanetPicker(false)}
          />
        </Suspense>
      )}
      {planetTransit && (
        <Suspense fallback={null}>
          <PlanetTransitOverlay
            transit={planetTransit}
            onSkip={() => finishPlanetTransit(planetTransit)}
          />
        </Suspense>
      )}
      {planetArrival && (
        <Suspense fallback={null}>
          <PlanetArrivalModal
            arrival={planetArrival}
            onClose={() => setPlanetArrival(null)}
            onOpenMap={() => {
              setPlanetArrival(null);
              actions.setTab('map');
            }}
            onOpenMissions={() => {
              setPlanetArrival(null);
              actions.setTab('missions');
            }}
          />
        </Suspense>
      )}
    </div>
    </AppErrorBoundary>
  );
}
