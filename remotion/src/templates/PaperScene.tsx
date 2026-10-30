import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Scene, Plan} from "../Video";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const PaperScene: React.FC<{s: Scene; plan: Plan; u: number}> = ({s, plan, u}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = plan.theme.colors;
  const d = s.data || {};

  const title = d.title || d.text || "Daily Principle";
  const points: string[] = d.points || d.lines || [
    "Focus on system over outcome",
    "Reduce friction for good habits",
    "Track consistency everyday"
  ];

  const sp = clamp(spring({frame: f, fps, config: {damping: 14}}));

  return (
    <div style={{
      width: "100%",
      maxWidth: 88 * u,
      background: "rgba(255,255,255,0.85)",
      color: "#1B2430",
      padding: 6 * u,
      borderRadius: 4 * u,
      boxShadow: "0 25px 45px rgba(0,0,0,0.18)",
      border: "1px solid rgba(0,0,0,0.08)",
      transform: `scale(${0.9 + 0.1 * sp}) translateY(${(1 - sp) * 8 * u}px)`,
      opacity: sp,
      boxSizing: "border-box"
    }}>
      {/* Paper header */}
      <div style={{
        borderBottom: `2px solid ${c.ac}`,
        paddingBottom: 2 * u,
        marginBottom: 4 * u,
        fontSize: 6 * u,
        fontWeight: "bold",
        color: c.ac
      }}>
        {title}
      </div>

      <div style={{display: "flex", flexDirection: "column", gap: 3.5 * u}}>
        {points.map((pt, i) => {
          const itemSp = clamp(spring({frame: Math.max(0, f - 10 - i * 8), fps, config: {damping: 12}}));
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 2.5 * u,
                fontSize: 4.6 * u,
                lineHeight: 1.3,
                opacity: itemSp,
                transform: `translateX(${(1 - itemSp) * -6 * u}px)`
              }}
            >
              <span style={{color: c.ac, fontWeight: "bold", fontSize: 5 * u}}>—</span>
              <span>{pt}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
