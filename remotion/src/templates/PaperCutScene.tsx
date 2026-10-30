import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Scene, Plan} from "../Video";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const PaperCutScene: React.FC<{s: Scene; plan: Plan; u: number}> = ({s, plan, u}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = plan.theme.colors;
  const d = s.data || {};

  const title = d.title || d.text || "Depth Over Distraction";
  const desc = d.desc || d.sub || "Carve out protected spaces for your most meaningful work.";

  const sp = clamp(spring({frame: f, fps, config: {damping: 12}}));

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      maxWidth: 90 * u,
      textAlign: "center",
      position: "relative"
    }}>
      {/* Layer 1 shadow card */}
      <div style={{
        position: "absolute",
        inset: -2 * u,
        borderRadius: 5 * u,
        background: c.bg2,
        opacity: 0.5,
        filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.35))",
        transform: `translateY(${(1 - sp) * 15 * u}px) scale(0.96)`
      }} />

      {/* Main Paper Cut Plate */}
      <div style={{
        position: "relative",
        background: c.cd,
        border: "1.5px solid rgba(255,255,255,0.4)",
        borderRadius: 4 * u,
        padding: 5 * u,
        width: "100%",
        boxSizing: "border-box",
        transform: `translateY(${(1 - sp) * 8 * u}px) scale(${0.94 + 0.06 * sp})`,
        opacity: sp
      }}>
        <div style={{
          fontSize: 7 * u,
          fontWeight: "900",
          lineHeight: 1.2,
          color: c.tx,
          marginBottom: 2 * u
        }}>
          {title}
        </div>
        <div style={{
          fontSize: 4.6 * u,
          lineHeight: 1.4,
          opacity: 0.9,
          color: c.tx
        }}>
          {desc}
        </div>
      </div>
    </div>
  );
};
