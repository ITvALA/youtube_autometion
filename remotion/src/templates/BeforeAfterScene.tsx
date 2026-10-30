import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Scene, Plan} from "../Video";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const BeforeAfterScene: React.FC<{s: Scene; plan: Plan; u: number}> = ({s, plan, u}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = plan.theme.colors;
  const d = s.data || {};

  const beforeText = d.before || d.left || "Distracted Multitasking";
  const afterText = d.after || d.right || "Deep 90-Min Focus Blocks";

  const spBefore = clamp(spring({frame: Math.max(0, f - 6), fps, config: {damping: 12}}));
  const spAfter = clamp(spring({frame: Math.max(0, f - 20), fps, config: {damping: 12}}));

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 3.5 * u,
      width: "100%",
      maxWidth: 90 * u,
      alignItems: "center"
    }}>
      {/* Before Box */}
      <div style={{
        width: "100%",
        background: "rgba(239, 68, 68, 0.2)",
        border: "2px solid #EF4444",
        borderRadius: 3 * u,
        padding: 4 * u,
        opacity: spBefore,
        transform: `translateY(${(1 - spBefore) * -10 * u}px)`,
        boxSizing: "border-box"
      }}>
        <div style={{color: "#EF4444", fontWeight: "900", fontSize: 3.4 * u, letterSpacing: 1.5}}>
          ✕ OLD WAY (TRAP)
        </div>
        <div style={{fontSize: 5.5 * u, fontWeight: "bold", marginTop: u}}>
          {beforeText}
        </div>
      </div>

      {/* Divider */}
      <div style={{
        width: "80%",
        height: 2,
        background: `linear-gradient(90deg, transparent, ${c.ac}, transparent)`,
        opacity: 0.6
      }} />

      {/* After Box */}
      <div style={{
        width: "100%",
        background: "rgba(16, 185, 129, 0.2)",
        border: "2px solid #10B981",
        borderRadius: 3 * u,
        padding: 4 * u,
        opacity: spAfter,
        transform: `translateY(${(1 - spAfter) * 10 * u}px)`,
        boxSizing: "border-box"
      }}>
        <div style={{color: "#10B981", fontWeight: "900", fontSize: 3.4 * u, letterSpacing: 1.5}}>
          ✓ NEW WAY (SHIFT)
        </div>
        <div style={{fontSize: 5.5 * u, fontWeight: "bold", marginTop: u}}>
          {afterText}
        </div>
      </div>
    </div>
  );
};
