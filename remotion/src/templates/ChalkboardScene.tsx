import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Scene, Plan} from "../Video";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const ChalkboardScene: React.FC<{s: Scene; plan: Plan; u: number}> = ({s, plan, u}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = s.data || {};

  const lesson = d.title || d.text || "RULE #1: 2-MINUTE DRILL";
  const points: string[] = d.items || d.lines || [
    "Scale down until effortless",
    "Master the art of showing up",
    "Standardize before optimizing"
  ];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 3.5 * u,
      width: "100%",
      maxWidth: 88 * u,
      border: "3px dashed rgba(255,255,255,0.45)",
      borderRadius: 4 * u,
      padding: 5 * u,
      background: "rgba(0,0,0,0.3)",
      color: "#F8FAFC",
      fontFamily: "monospace",
      boxSizing: "border-box"
    }}>
      {/* Chalk Title */}
      <div style={{
        fontSize: 6 * u,
        fontWeight: "bold",
        borderBottom: "2px solid rgba(255,255,255,0.4)",
        paddingBottom: 2 * u,
        color: "#FDE047"
      }}>
        ✎ {lesson}
      </div>

      <div style={{display: "flex", flexDirection: "column", gap: 2.5 * u, marginTop: u}}>
        {points.map((pt, i) => {
          const sp = clamp(spring({frame: Math.max(0, f - 8 - i * 8), fps, config: {damping: 12}}));
          return (
            <div
              key={i}
              style={{
                fontSize: 4.6 * u,
                lineHeight: 1.3,
                opacity: sp,
                transform: `translateX(${(1 - sp) * -8 * u}px)`,
                display: "flex",
                gap: 2 * u
              }}
            >
              <span style={{color: "#FDE047"}}>✓</span>
              <span>{pt}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
