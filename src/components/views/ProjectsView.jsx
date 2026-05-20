import React from 'react';
import {
  MEGAPROJECTS,
  SPONSORSHIPS,
  getMegaprojectById,
  getMegaprojectPhase,
  getMegaprojectProgress,
} from '../../data/megaprojects';

const fmt = (value, digits = 0) =>
  Number(value || 0).toLocaleString('es-ES', { maximumFractionDigits: digits });

export function ProjectsView({
  player,
  inventory,
  megaprojects,
  sponsorships,
  onSetActiveMegaproject,
  onContributeMegaproject,
  onClaimSponsorshipAd,
}) {
  const activeProject = getMegaprojectById(megaprojects?.activeId);
  const activeState = megaprojects?.projects?.[activeProject.id] || {};
  const activePhase = getMegaprojectPhase(activeProject, activeState);
  const activeProgress = getMegaprojectProgress(activeProject, activeState);
  const completedIds = Array.isArray(megaprojects?.completedIds) ? megaprojects.completedIds : [];

  const handleSponsor = (sponsorId) => {
    onClaimSponsorshipAd?.(sponsorId);
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.hero}>
        <div>
          <div style={styles.kicker}>PROYECTOS</div>
          <div style={styles.title}>{activeProject.title}</div>
          <div style={styles.text}>
            {activeProject.short} Esto convierte creditos, recursos y anuncios en metas largas.
          </div>
        </div>
        <div style={styles.heroStats}>
          <Stat label="Fase" value={activePhase ? `${Number(activeState.phase ?? 0) + 1}/${activeProject.phases.length}` : 'Completo'} />
          <Stat label="Progreso" value={`${fmt(activeProgress.pct)}%`} />
          <Stat label="Completados" value={completedIds.length} />
        </div>
      </div>

      {activePhase ? (
        <div style={styles.phaseCard}>
          <div style={styles.phaseTop}>
            <div>
              <div style={styles.kicker}>Fase actual</div>
              <div style={styles.phaseTitle}>{activePhase.title}</div>
            </div>
            <button type="button" onClick={() => onContributeMegaproject?.(activeProject.id)} style={styles.primary}>
              Aportar maximo
            </button>
          </div>
          <div style={styles.bar}><span style={{ ...styles.barFill, width: `${activeProgress.pct}%` }} /></div>
          <div style={styles.reqGrid}>
            <Requirement label="Creditos" current={activeState.credits} target={activePhase.credits} suffix="cr" />
            <Requirement label="Anuncios" current={activeState.ads} target={activePhase.ads} />
            {(activePhase.resources || []).map((resource) => (
              <Requirement
                key={resource.key}
                label={resource.key}
                current={activeState.resources?.[resource.key] || 0}
                target={resource.amount}
                owned={inventory?.[resource.key] || 0}
              />
            ))}
          </div>
        </div>
      ) : (
        <div style={styles.phaseCard}>
          <div style={styles.phaseTitle}>Megaproyecto completado</div>
          <div style={styles.text}>Selecciona otro objetivo para seguir dando sentido a la produccion.</div>
        </div>
      )}

      <div style={styles.sectionTitle}>Patrocinios publicitarios</div>
      <div style={styles.sponsorGrid}>
        {SPONSORSHIPS.map((sponsor) => {
          const progress = Number(sponsorships?.progress?.[sponsor.id] ?? 0);
          const done = sponsorships?.claimedIds?.includes(sponsor.id);
          return (
            <div key={sponsor.id} style={styles.sponsorCard}>
              <div>
                <div style={styles.sponsorTitle}>{sponsor.title}</div>
                <div style={styles.text}>{sponsor.rewardText}</div>
              </div>
              <div style={styles.bar}><span style={{ ...styles.barFill, width: `${Math.min(100, (progress / sponsor.adsRequired) * 100)}%` }} /></div>
              <div style={styles.sponsorBottom}>
                <strong>{progress}/{sponsor.adsRequired}</strong>
                <button type="button" onClick={() => handleSponsor(sponsor.id)} disabled={done} style={{ ...styles.secondary, ...(done ? styles.disabled : null) }}>
                  {done ? 'Cerrado hoy' : 'Ver anuncio'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={styles.sectionTitle}>Elegir objetivo</div>
      <div style={styles.projectRows}>
        {MEGAPROJECTS.map((project) => {
          const state = megaprojects?.projects?.[project.id] || {};
          const phase = getMegaprojectPhase(project, state);
          const progress = getMegaprojectProgress(project, state);
          const active = project.id === activeProject.id;
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => onSetActiveMegaproject?.(project.id)}
              style={{ ...styles.projectRow, ...(active ? styles.projectRowActive : null) }}
            >
              <span>
                <strong>{project.title}</strong>
                <em>{project.short}</em>
              </span>
              <span>{phase ? phase.title : 'Completado'}</span>
              <span>{fmt(progress.pct)}%</span>
            </button>
          );
        })}
      </div>

      <div style={styles.footerNote}>
        Caja: {fmt(player?.credits, 0)} cr. Los patrocinios se reinician cada dia.
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={styles.stat}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Requirement({ label, current, target, suffix = '', owned = null }) {
  const pct = Math.min(100, (Number(current || 0) / Math.max(1, Number(target || 0))) * 100);
  return (
    <div style={styles.req}>
      <div style={styles.reqTop}>
        <span>{label}</span>
        <strong>{fmt(current)}/{fmt(target)} {suffix}</strong>
      </div>
      <div style={styles.bar}><span style={{ ...styles.barFill, width: `${pct}%` }} /></div>
      {owned !== null && <em>Disponible: {fmt(owned)}</em>}
    </div>
  );
}

const styles = {
  wrap: { display: 'grid', gap: 10 },
  hero: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 0.65fr)',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    background: 'rgba(15,23,42,0.74)',
    border: '1px solid rgba(34,211,238,0.16)',
  },
  kicker: { color: '#67e8f9', fontSize: 11, fontWeight: 900, letterSpacing: 0.7 },
  title: { color: '#f8fafc', fontSize: 20, fontWeight: 900 },
  text: { color: '#94a3b8', fontSize: 12, lineHeight: 1.45 },
  heroStats: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 },
  stat: { padding: 9, borderRadius: 8, background: 'rgba(2,6,23,0.35)', border: '1px solid rgba(148,163,184,0.12)' },
  phaseCard: { display: 'grid', gap: 10, padding: 12, borderRadius: 10, background: 'rgba(15,23,42,0.66)', border: '1px solid rgba(148,163,184,0.12)' },
  phaseTop: { display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  phaseTitle: { color: '#f8fafc', fontSize: 16, fontWeight: 900 },
  primary: { minHeight: 34, padding: '8px 12px', border: 'none', borderRadius: 8, background: 'linear-gradient(90deg,#22c55e,#06b6d4)', color: '#fff', fontWeight: 900 },
  secondary: { minHeight: 32, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(125,211,252,0.24)', background: 'rgba(14,165,233,0.10)', color: '#bae6fd', fontWeight: 900 },
  disabled: { opacity: 0.48, cursor: 'not-allowed' },
  bar: { height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  barFill: { display: 'block', height: '100%', borderRadius: 999, background: 'linear-gradient(90deg,#22c55e,#06b6d4)' },
  reqGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 },
  req: { display: 'grid', gap: 6, padding: 9, borderRadius: 8, background: 'rgba(2,6,23,0.28)' },
  reqTop: { display: 'flex', justifyContent: 'space-between', gap: 8, color: '#cbd5e1', fontSize: 12 },
  sectionTitle: { color: '#f8fafc', fontSize: 14, fontWeight: 900 },
  sponsorGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 },
  sponsorCard: { display: 'grid', gap: 8, padding: 10, borderRadius: 10, background: 'rgba(15,23,42,0.66)', border: '1px solid rgba(250,204,21,0.15)' },
  sponsorTitle: { color: '#fde68a', fontWeight: 900 },
  sponsorBottom: { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  projectRows: { display: 'grid', gap: 8 },
  projectRow: { display: 'grid', gridTemplateColumns: 'minmax(180px,1fr) minmax(140px,0.8fr) 70px', gap: 8, padding: 10, borderRadius: 10, border: '1px solid rgba(148,163,184,0.12)', background: 'rgba(15,23,42,0.56)', color: '#cbd5e1', textAlign: 'left' },
  projectRowActive: { border: '1px solid rgba(34,211,238,0.36)', background: 'rgba(8,47,73,0.25)' },
  footerNote: { color: '#94a3b8', fontSize: 12 },
};

export default ProjectsView;
