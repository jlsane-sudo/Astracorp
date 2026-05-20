import { Card, pctColor } from "../ui";

const formatCredits = (value) => Number(value ?? 0).toLocaleString('es-ES', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatCompact = (value) => Number(value ?? 0).toLocaleString('es-ES', {
  maximumFractionDigits: 0,
});

const getActivityLabel = (player) => {
  if (player.online) return 'Activo ahora';
  if (!player.lastSeenAt) return 'Sin actividad reciente';

  const diffMs = Date.now() - Number(player.lastSeenAt);
  if (diffMs < 0) return 'Activo ahora';
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 60) return `Hace ${Math.max(1, minutes)} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${Math.floor(hours / 24)} d`;
};

export function PlayersView({ players }) {
  const sorted = [...(players || [])].sort(
    (a, b) => Number(b.score ?? 0) - Number(a.score ?? 0) || Number(b.level ?? 0) - Number(a.level ?? 0) || Number(b.credits ?? 0) - Number(a.credits ?? 0)
  );
  const hasOnlineData = sorted.some((player) => player.source === 'online' || player.lastSeenAt);

  return (
    <div>
      <div className="pw-section-kicker">{hasOnlineData ? 'RANKING ONLINE' : 'JUGADORES Y NPCS'}</div>
      {sorted.map((p, index) => {
        const color = pctColor(p.pct || 0);
        const territoryCount = Number(p.territory ?? p.territories ?? 0);
        const companyCount = Number(p.companies ?? 0);
        const score = Number(p.score ?? (Number(p.credits ?? 0) + Number(p.level ?? 1) * 10));
        const activityLabel = getActivityLabel(p);

        return (
          <Card key={p.id || p.name} style={{ marginBottom: 10 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: 14,
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>
                  #{index + 1} {p.avatar || 'ME'} {p.name || 'Jugador'}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  Nivel {Number(p.level ?? 1)} · {territoryCount} {territoryCount === 1 ? 'sector' : 'sectores'} · {companyCount} {companyCount === 1 ? 'empresa' : 'empresas'}
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Valor estimado: {formatCompact(score)} puntos
                </div>
                {p.strategy && (
                  <div style={{ fontSize: 12, color: '#cbd5e1', marginTop: 6, lineHeight: 1.45 }}>
                    Estrategia: <strong style={{ color: '#7dd3fc' }}>{p.strategy}</strong>
                    {p.motive ? ` - ${p.motive}` : ''}
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                  {formatCredits(p.credits)} creditos
                </div>
                <div style={{ fontSize: 12, color }}>
                  {Number(p.pct || 0).toFixed(1)}% reparto
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: p.online ? '#10b981' : '#94a3b8',
                    marginTop: 3,
                  }}
                >
                  {activityLabel}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
