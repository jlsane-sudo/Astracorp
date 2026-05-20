import { Card, Button } from './ui';

const styles = {
  card: {
    padding: 12,
    background:
      'linear-gradient(180deg, rgba(103,232,249,0.08) 0%, rgba(255,255,255,0.03) 100%)',
    border: '1px solid rgba(103,232,249,0.14)',
    boxShadow: '0 8px 22px rgba(2,6,23,0.16)',
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: '#67e8f9',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 800,
    color: '#e2e8f0',
    marginBottom: 4,
    lineHeight: 1.2,
  },
  text: {
    fontSize: 12,
    lineHeight: 1.55,
    color: '#cbd5e1',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, rgba(34,211,238,0.95), rgba(34,197,94,0.95))',
    transition: 'width 0.25s ease',
  },
  section: {
    display: 'grid',
    gap: 8,
  },
  nowBox: {
    padding: 10,
    borderRadius: 12,
    background: 'rgba(15,23,42,0.45)',
    border: '1px solid rgba(103,232,249,0.14)',
    display: 'grid',
    gap: 6,
  },
  nowLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#67e8f9',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 8,
  },
  statBox: {
    padding: 8,
    borderRadius: 10,
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  statLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: '#94a3b8',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 800,
    color: '#f8fafc',
  },
  checklist: {
    display: 'grid',
    gap: 6,
  },
  checklistItem: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    gap: 8,
    alignItems: 'start',
    padding: '8px 10px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.025)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  checkDone: {
    color: '#22c55e',
    fontWeight: 800,
  },
  checkPending: {
    color: '#fbbf24',
    fontWeight: 800,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#e5e7eb',
    marginBottom: 2,
  },
  stepText: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 1.45,
  },
  helper: {
    padding: 10,
    borderRadius: 12,
    background: 'rgba(245,158,11,0.08)',
    border: '1px solid rgba(245,158,11,0.18)',
    fontSize: 12,
    lineHeight: 1.5,
    color: '#fde68a',
  },
  actions: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
};

function getStarterHint(player = {}) {
  const level = Number(player?.level ?? 1);
  if (level < 2) {
    return 'Prioridad inicial: trabajos y agua. Deja politica, industria avanzada y decisiones complejas para mas adelante.';
  }
  if (level < 4) {
    return 'Ya tienes base minima. Ahora conviene reforzar empresas y entender el mercado antes de entrar en politica.';
  }
  return 'Tu arranque ya esta encaminado. Puedes empezar a abrir mercado, contratos y politica con mas criterio.';
}

export default function TutorialPanel({
  save,
  tutorial,
  tutorialStep,
  tutorialSteps = [],
  onOpenStep,
  onDismiss,
  onReopen,
}) {
  const completed = tutorial?.completedStepIds?.length || 0;
  const total = tutorialSteps.length || 1;
  const finished = Boolean(tutorial?.finished);
  const dismissed = Boolean(tutorial?.dismissed);
  const player = save?.player || {};
  const stats = save?.stats || {};
  const companies = Array.isArray(save?.companies) ? save.companies : [];
  const progressPct = `${(completed / total) * 100}%`;

  if (dismissed && !finished) {
    return (
      <div>
        <Button color="#67e8f9" onClick={onReopen}>
          Reabrir guia inicial
        </Button>
      </div>
    );
  }

  if (dismissed && finished) return null;

  return (
    <Card style={styles.card}>
      <div style={styles.section}>
        <div>
          <div style={styles.kicker}>Guia inicial</div>
          <div style={styles.title}>
            {finished ? 'Base inicial completada' : tutorialStep?.title}
          </div>
          <div style={styles.text}>
            {finished
              ? 'Ya conoces el bucle principal. Desde aqui ya puedes optimizar tu economia y decidir cuando abrir sistemas mas complejos.'
              : tutorialStep?.desc}
          </div>
        </div>

        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: progressPct }} />
        </div>

        <div style={{ fontSize: 11, color: '#94a3b8' }}>{completed}/{total} pasos completados</div>

        {!finished && (
          <div style={styles.nowBox}>
            <div style={styles.nowLabel}>Ahora mismo</div>
            <div style={styles.text}>
              {tutorialStep?.ctaLabel
                ? `Haz este paso primero: ${tutorialStep.title}.`
                : 'Completa el siguiente objetivo de la guia.'}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>
              Cuando completes este paso, el juego te llevara al siguiente sistema en el orden recomendado.
            </div>
          </div>
        )}

        <div style={styles.statGrid}>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Nivel</div>
            <div style={styles.statValue}>{Number(player?.level ?? 1)}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Creditos</div>
            <div style={styles.statValue}>{Number(player?.credits ?? 0).toFixed(1)}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Trabajos</div>
            <div style={styles.statValue}>{Number(stats?.works ?? 0)}</div>
          </div>
          <div style={styles.statBox}>
            <div style={styles.statLabel}>Empresas</div>
            <div style={styles.statValue}>{companies.length}</div>
          </div>
        </div>

        <div style={styles.checklist}>
          {tutorialSteps.map((step, index) => {
            const done = tutorial?.completedStepIds?.includes(step.id);
            return (
              <div key={step.id} style={styles.checklistItem}>
                <div style={done ? styles.checkDone : styles.checkPending}>{done ? 'OK' : index + 1}</div>
                <div>
                  <div style={styles.stepTitle}>{step.title}</div>
                  <div style={styles.stepText}>{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={styles.helper}>{getStarterHint(player)}</div>

        <div style={styles.actions}>
          {!finished && tutorialStep?.ctaTab && (
            <Button color="#67e8f9" onClick={() => onOpenStep?.(tutorialStep.ctaTab)}>
              {tutorialStep.ctaLabel || 'Abrir paso'}
            </Button>
          )}

          {!finished && (
            <Button color="#94a3b8" onClick={onDismiss}>
              Ocultar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
