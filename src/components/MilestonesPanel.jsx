import { Card, Button } from "./ui";
import { getNextMilestones, getUnlockedMilestones } from "../data/milestones";

export default function MilestonesPanel({ save, onOpenTab }) {
  const unlocked = getUnlockedMilestones(save);
  const nextMilestones = getNextMilestones(save, 3);
  const latest = unlocked[unlocked.length - 1] || null;

  return (
    <Card
      style={{
        padding: 10,
        background:
          "linear-gradient(180deg, rgba(250,204,21,0.07) 0%, rgba(255,255,255,0.03) 100%)",
        border: "1px solid rgba(250,204,21,0.16)",
        boxShadow: "0 8px 22px rgba(2,6,23,0.16)",
      }}
    >
      <div style={{ display: "grid", gap: 10 }}>
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 0.9,
              textTransform: "uppercase",
              color: "#fcd34d",
              marginBottom: 4,
            }}
          >
            Hitos de colonia
          </div>

          <div
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "#f8fafc",
              marginBottom: 4,
              lineHeight: 1.2,
            }}
          >
            {unlocked.length} desbloqueados
          </div>

          <div style={{ fontSize: 12, lineHeight: 1.5, color: "#cbd5e1" }}>
            {latest
              ? `${latest.icon} Ultimo logro: ${latest.title}`
              : "Todavia no has desbloqueado hitos. El primero cae en cuanto completes un trabajo."}
          </div>
        </div>

        {nextMilestones.length > 0 && (
          <div style={{ display: "grid", gap: 8 }}>
            {nextMilestones.map((milestone) => (
              <button
                key={milestone.id}
                type="button"
                onClick={() => milestone.tab && onOpenTab?.(milestone.tab)}
                style={{
                  display: "grid",
                  gap: 4,
                  padding: "10px 11px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: "#e2e8f0",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: "#fde68a" }}>
                  {milestone.icon} Proximo hito
                </div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{milestone.title}</div>
                <div style={{ fontSize: 11, lineHeight: 1.45, color: "#94a3b8" }}>
                  {milestone.detail}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#fef08a" }}>
                  Recompensa: +{Number(milestone.reward?.credits ?? 0)} creditos · +
                  {Number(milestone.reward?.xp ?? 0)} XP
                </div>
              </button>
            ))}
          </div>
        )}

        {latest?.tab && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Button color="#fcd34d" onClick={() => onOpenTab?.(latest.tab)}>
              Volver a ese frente
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
