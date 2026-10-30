import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Scene, Plan} from "../Video";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const HabitTrackerScene: React.FC<{s: Scene; plan: Plan; u: number}> = ({s, plan, u}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = plan.theme.colors;
  const d = s.data || {};

  const streak = d.streak || "21 DAY STREAK";
  const habits: string[] = d.habits || d.items || [
    "Read 10 Pages Daily",
    "45 Mins Deep Work",
    "Zero Phone First Hour"
  ];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 3.5 * u,
      width: "100%",
      maxWidth: 90 * u,
      background: c.cd,
      borderRadius: 4 * u,
      padding: 5 * u,
      border: "1.5px solid rgba(255,255,255,0.2)",
      boxSizing: "border-box"
    }}>
      {/* Streak Badge */}
      <div style={{
        alignSelf: "center",
        background: "#F59E0B",
        color: "#000",
        padding: `${0.8 * u}px ${3 * u}px`,
        borderRadius: 99,
        fontWeight: "900",
        fontSize: 3.8 * u,
        letterSpacing: 1.5,
        boxShadow: "0 4px 15px rgba(245, 158, 11, 0.4)"
      }}>
        🔥 {streak}
      </div>

      <div style={{display: "flex", flexDirection: "column", gap: 2.8 * u, marginTop: u}}>
        {habits.map((h, i) => {
          const sp = clamp(spring({frame: Math.max(0, f - 10 - i * 10), fps, config: {damping: 12}}));
          const checked = f >= 20 + i * 12;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3 * u,
                background: "rgba(255,255,255,0.08)",
                padding: `${2 * u}px ${3 * u}px`,
                borderRadius: 2.5 * u,
                opacity: sp,
                transform: `translateX(${(1 - sp) * -8 * u}px)`
              }}
            >
              <div style={{
                width: 4.8 * u,
                height: 4.8 * u,
                borderRadius: 1.2 * u,
                border: `2px solid ${checked ? "#10B981" : "rgba(255,255,255,0.4)"}`,
                background: checked ? "#10B981" : "transparent",
                color: "#FFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "900",
                fontSize: 3.2 * u,
                transition: "all 0.3s ease"
              }}>
                {checked ? "✓" : ""}
              </div>
              <span style={{fontSize: 4.8 * u, fontWeight: "bold"}}>{h}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
