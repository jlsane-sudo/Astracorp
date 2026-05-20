import { Card, Button } from "./ui";
import { getDailyStreakReward } from "../data/loginRewards";

export default function RhythmPanel({ save, onOpenTab }) {
  const loginRewards = save?.loginRewards || {};
  const streak = Number(loginRewards?.streak ?? 0);
  const bestStreak = Number(loginRewards?.bestStreak ?? 0);
  const todayReward = loginRewards?.lastDailyReward || null;
  const returnReward = loginRewards?.lastReturnReward || null;
  const tomorrowReward = getDailyStreakReward(Math.max(1, streak + 1));

  return (
    <Card
      style={{
        padding: 10,
        background:
          "linear-gradient(180deg, rgba(52,211,153,0.08) 0%, rgba(255,255,255,0.03) 100%)",
        border: "1px solid rgba(74,222,128,0.16)",
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
              color: "#86efac",
              marginBottom: 4,
            }}
          >
            Ritmo de regreso
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
            Racha actual: {streak} dia{streak === 1 ? "" : "s"}
          </div>

          <div style={{ fontSize: 12, lineHeight: 1.5, color: "#cbd5e1" }}>
            Mejor racha: {bestStreak} · El juego premia volver sin castigar demasiado una pausa.
          </div>
        </div>

        {todayReward && (
          <div
            style={{
              display: "grid",
              gap: 4,
              padding: "10px 11px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "#86efac" }}>
              Recompensa de hoy
            </div>
            <div style={{ fontSize: 12, color: "#e2e8f0" }}>
              +{Number(todayReward.credits ?? 0)} creditos · +{Number(todayReward.energy ?? 0)} energia · +
              {Number(todayReward.xp ?? 0)} XP
            </div>
          </div>
        )}

        {returnReward && (
          <div
            style={{
              display: "grid",
              gap: 4,
              padding: "10px 11px",
              borderRadius: 12,
              border: "1px solid rgba(250,204,21,0.16)",
              background: "rgba(250,204,21,0.06)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "#fde68a" }}>
              Bonus de regreso
            </div>
            <div style={{ fontSize: 12, color: "#e2e8f0" }}>
              Tras {Number(returnReward.missedDays ?? 0)} dia(s): +{Number(returnReward.credits ?? 0)} creditos · +
              {Number(returnReward.energy ?? 0)} energia · +{Number(returnReward.xp ?? 0)} XP
            </div>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gap: 4,
            padding: "10px 11px",
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: "#67e8f9" }}>
            Si vuelves manana
          </div>
          <div style={{ fontSize: 12, color: "#e2e8f0" }}>
            +{Number(tomorrowReward.credits ?? 0)} creditos · +{Number(tomorrowReward.energy ?? 0)} energia · +
            {Number(tomorrowReward.xp ?? 0)} XP
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Button color="#86efac" onClick={() => onOpenTab?.("ads")}>
            Mantener ritmo
          </Button>
        </div>
      </div>
    </Card>
  );
}
