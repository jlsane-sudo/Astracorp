/**
 * ReturnScreen.jsx
 *
 * Pantalla de retorno que se muestra al jugador cuando vuelve al juego
 * después de al menos un día de ausencia.
 *
 * USO:
 *   En useGamePersistence.js, después de applyDailyLoginUpdate(), si
 *   normalized.loginRewards?.lastDailyReward existe (dayDiff > 0),
 *   guarda los datos de retorno en un estado separado y muéstrale
 *   este componente al jugador antes de entrar al juego.
 *
 *   Ejemplo en App.jsx:
 *     const [returnData, setReturnData] = useState(null);
 *
 *     // En useGamePersistence, exponer returnData y clearReturnData:
 *     // setReturnData({ ... }) cuando dayDiff > 0
 *
 *     {returnData && (
 *       <ReturnScreen
 *         data={returnData}
 *         onContinue={() => setReturnData(null)}
 *       />
 *     )}
 *
 * PROPS:
 *   data.streak          — racha actual (número)
 *   data.missedDays      — días de ausencia (0 si volvió al día siguiente)
 *   data.offlineHours    — horas fuera de la app
 *   data.recoveredEnergy — energía recuperada offline
 *   data.pctLost         — % de reparto perdido por ausencia (0 si ninguno)
 *   data.dailyReward     — { credits, energy, xp }
 *   data.returnReward    — { credits, energy, xp } | null
 *   data.researchDone    — { title } | null
 *   data.territoriesUnderPressure — [{ name, threat }]
 *   data.companiesReady  — número de empresas con almacenamiento lleno
 *   data.contractsExpiring — número de contratos próximos a expirar
 */

import { useEffect, useState } from 'react';

const ACCENT = '#e8a020';
const DANGER = '#e84040';
const TEAL   = '#20c8a0';
const DIM    = 'rgba(255,255,255,0.18)';

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;700&family=DM+Sans:wght@300;400;500&display=swap');

.rs-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(4,8,18,0.96);
  display: flex; align-items: center; justify-content: center;
  font-family: 'DM Sans', sans-serif;
  animation: rs-fade-in 0.4s ease;
}
@keyframes rs-fade-in { from { opacity: 0 } to { opacity: 1 } }

.rs-card {
  width: min(440px, 94vw);
  background: #080f1e;
  border: 1px solid rgba(232,160,32,0.22);
  border-radius: 16px;
  padding: 32px 28px 24px;
  position: relative;
  overflow: hidden;
}

.rs-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, ${ACCENT}, transparent);
}

.rs-grid-bg {
  position: absolute; inset: 0; pointer-events: none; opacity: 0.04;
  background-image:
    linear-gradient(rgba(232,160,32,0.6) 1px, transparent 1px),
    linear-gradient(90deg, rgba(232,160,32,0.6) 1px, transparent 1px);
  background-size: 32px 32px;
}

.rs-header {
  text-align: center;
  margin-bottom: 24px;
}

.rs-eyebrow {
  font-size: 10px;
  letter-spacing: 3px;
  color: ${ACCENT};
  text-transform: uppercase;
  font-weight: 500;
  margin-bottom: 6px;
}

.rs-title {
  font-family: 'Syne', sans-serif;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  line-height: 1.15;
  margin-bottom: 4px;
}

.rs-subtitle {
  font-size: 13px;
  color: rgba(255,255,255,0.45);
  font-weight: 300;
}

.rs-streak-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 0 0 24px;
  padding: 10px 0;
  border-top: 1px solid rgba(255,255,255,0.06);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.rs-streak-dot {
  width: 10px; height: 10px; border-radius: 50%;
  border: 1.5px solid rgba(255,255,255,0.15);
  transition: all 0.3s ease;
}
.rs-streak-dot.active {
  background: ${ACCENT};
  border-color: ${ACCENT};
  box-shadow: 0 0 8px ${ACCENT}88;
}
.rs-streak-dot.today {
  background: #fff;
  border-color: #fff;
  box-shadow: 0 0 12px #ffffff88;
  transform: scale(1.3);
}

.rs-streak-label {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  margin-left: 10px;
}
.rs-streak-label strong {
  color: ${ACCENT};
  font-weight: 500;
}

.rs-rewards {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 20px;
}

.rs-reward-item {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 10px;
  padding: 10px 8px;
  text-align: center;
  animation: rs-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
}
.rs-reward-item:nth-child(1) { animation-delay: 0.1s }
.rs-reward-item:nth-child(2) { animation-delay: 0.2s }
.rs-reward-item:nth-child(3) { animation-delay: 0.3s }
@keyframes rs-pop {
  from { opacity: 0; transform: scale(0.7) translateY(12px) }
  to   { opacity: 1; transform: scale(1) translateY(0) }
}

.rs-reward-icon {
  font-size: 18px;
  margin-bottom: 3px;
}

.rs-reward-value {
  font-family: 'Syne', sans-serif;
  font-size: 17px;
  font-weight: 700;
  color: ${ACCENT};
}
.rs-reward-value.teal { color: ${TEAL}; }

.rs-reward-label {
  font-size: 10px;
  color: rgba(255,255,255,0.35);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 2px;
}

.rs-alerts {
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 20px;
}

.rs-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 400;
  animation: rs-slide-in 0.35s ease both;
}
.rs-alert:nth-child(1) { animation-delay: 0.25s }
.rs-alert:nth-child(2) { animation-delay: 0.35s }
.rs-alert:nth-child(3) { animation-delay: 0.45s }
.rs-alert:nth-child(4) { animation-delay: 0.55s }
@keyframes rs-slide-in {
  from { opacity: 0; transform: translateX(-10px) }
  to   { opacity: 1; transform: translateX(0) }
}

.rs-alert.danger {
  background: rgba(232,64,64,0.1);
  border: 1px solid rgba(232,64,64,0.25);
  color: #ff9090;
}
.rs-alert.warn {
  background: rgba(232,160,32,0.08);
  border: 1px solid rgba(232,160,32,0.2);
  color: #f0c060;
}
.rs-alert.success {
  background: rgba(32,200,160,0.08);
  border: 1px solid rgba(32,200,160,0.2);
  color: #60dfc0;
}
.rs-alert.info {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,0.55);
}

.rs-alert-icon {
  font-size: 15px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}

.rs-pct-lost {
  margin-bottom: 16px;
  padding: 10px 14px;
  background: rgba(232,64,64,0.07);
  border: 1px solid rgba(232,64,64,0.18);
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  color: #ff9090;
  animation: rs-slide-in 0.4s ease 0.1s both;
}
.rs-pct-lost-icon { font-size: 18px; }
.rs-pct-lost-text strong { color: #ffb0b0; font-weight: 500; }

.rs-cta {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: ${ACCENT};
  color: #0a0a0a;
  font-family: 'Syne', sans-serif;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.18s ease;
  position: relative;
  overflow: hidden;
}
.rs-cta:hover { background: #f0b030; transform: translateY(-1px); }
.rs-cta:active { transform: translateY(0); }
.rs-cta::after {
  content: '';
  position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  transform: translateX(-100%);
  animation: rs-shimmer 1.4s ease 0.6s infinite;
}
@keyframes rs-shimmer {
  from { transform: translateX(-100%) }
  to   { transform: translateX(100%) }
}

.rs-offline-time {
  text-align: center;
  font-size: 11px;
  color: rgba(255,255,255,0.2);
  margin-bottom: 16px;
  font-weight: 300;
}

.rs-divider {
  height: 1px;
  background: rgba(255,255,255,0.06);
  margin: 16px 0;
}
`;

function StreakDots({ streak, maxShow = 7 }) {
  const total = Math.min(streak + 1, maxShow);
  const dots = [];
  for (let i = 0; i < total; i++) {
    const isToday = i === total - 1;
    const isActive = i < total - 1;
    dots.push(
      <div
        key={i}
        className={`rs-streak-dot ${isToday ? 'today' : isActive ? 'active' : ''}`}
      />
    );
  }
  return (
    <div className="rs-streak-row">
      {dots}
      <span className="rs-streak-label">
        Racha <strong>{streak}</strong>
      </span>
    </div>
  );
}

function RewardItem({ icon, value, label, colorClass = '' }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (!value) return;
    let start = 0;
    const target = Number(value);
    const step = Math.ceil(target / 24);
    const t = setInterval(() => {
      start = Math.min(start + step, target);
      setDisplayed(start);
      if (start >= target) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [value]);

  return (
    <div className="rs-reward-item">
      <div className="rs-reward-icon">{icon}</div>
      <div className={`rs-reward-value ${colorClass}`}>+{displayed}</div>
      <div className="rs-reward-label">{label}</div>
    </div>
  );
}

export default function ReturnScreen({ data, onContinue }) {
  const {
    streak = 1,
    missedDays = 0,
    offlineHours = 0,
    recoveredEnergy = 0,
    pctLost = 0,
    dailyReward = {},
    returnReward = null,
    researchDone = null,
    territoriesUnderPressure = [],
    companiesReady = 0,
    contractsExpiring = 0,
  } = data || {};

  const totalCredits = (Number(dailyReward?.credits ?? 0) + Number(returnReward?.credits ?? 0));
  const totalEnergy  = (Number(dailyReward?.energy ?? 0) + Number(returnReward?.energy ?? 0) + recoveredEnergy);
  const totalXp      = (Number(dailyReward?.xp ?? 0) + Number(returnReward?.xp ?? 0));

  const hoursText = offlineHours >= 24
    ? `${Math.floor(offlineHours / 24)}d ${offlineHours % 24}h fuera`
    : `${offlineHours}h fuera`;

  const titleText = missedDays === 0
    ? 'Bienvenido de vuelta'
    : missedDays === 1
    ? 'Llevas un día fuera'
    : `${missedDays} días fuera`;

  const subtitleText = missedDays === 0
    ? 'Tu imperio siguió trabajando'
    : 'Tus sectores te necesitaban';

  const alerts = [];

  if (researchDone) {
    alerts.push({ type: 'success', icon: '🔬', text: `Investigación completada: ${researchDone.title}` });
  }
  if (companiesReady > 0) {
    alerts.push({
      type: 'warn',
      icon: '🏭',
      text: `${companiesReady} empresa${companiesReady > 1 ? 's' : ''} con almacenamiento lleno — cobra antes de que se detenga la producción`,
    });
  }
  if (contractsExpiring > 0) {
    alerts.push({
      type: 'warn',
      icon: '📋',
      text: `${contractsExpiring} contrato${contractsExpiring > 1 ? 's' : ''} próximo${contractsExpiring > 1 ? 's' : ''} a expirar`,
    });
  }
  territoriesUnderPressure.slice(0, 2).forEach(t => {
    const level = t.threat >= 82 ? 'danger' : 'warn';
    alerts.push({
      type: level,
      icon: '⚔️',
      text: `${t.name} bajo presión crítica (${t.threat}%) — refuerza ahora`,
    });
  });
  if (alerts.length === 0) {
    alerts.push({ type: 'info', icon: '✓', text: 'Todos los sectores estables mientras estuviste fuera' });
  }

  return (
    <>
      <style>{css}</style>
      <div className="rs-overlay">
        <div className="rs-card">
          <div className="rs-grid-bg" />

          <div className="rs-header">
            <div className="rs-eyebrow">AstraCorp · Informe de ausencia</div>
            <div className="rs-title">{titleText}</div>
            <div className="rs-subtitle">{subtitleText}</div>
          </div>

          {offlineHours > 0 && (
            <div className="rs-offline-time">{hoursText}</div>
          )}

          <StreakDots streak={streak} />

          {pctLost > 0 && (
            <div className="rs-pct-lost">
              <span className="rs-pct-lost-icon">📉</span>
              <span className="rs-pct-lost-text">
                Ausencia de {missedDays} día{missedDays > 1 ? 's' : ''}:{' '}
                <strong>-{pctLost}% de reparto publicitario</strong>. Vuelve mañana para recuperarlo.
              </span>
            </div>
          )}

          <div className="rs-rewards">
            <RewardItem icon="💳" value={totalCredits} label="Créditos" />
            <RewardItem icon="⚡" value={totalEnergy}  label="Energía" colorClass="teal" />
            <RewardItem icon="⬆️" value={totalXp}      label="XP" />
          </div>

          <div className="rs-divider" />

          <div className="rs-alerts">
            {alerts.map((a, i) => (
              <div key={i} className={`rs-alert ${a.type}`}>
                <span className="rs-alert-icon">{a.icon}</span>
                <span>{a.text}</span>
              </div>
            ))}
          </div>

          <button className="rs-cta" onClick={onContinue}>
            Entrar al imperio
          </button>
        </div>
      </div>
    </>
  );
}
