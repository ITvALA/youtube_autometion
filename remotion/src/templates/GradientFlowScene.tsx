import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Scene, Plan} from "../Video";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const GradientFlowScene: React.FC<{s: Scene; plan: Plan; u: number}> = ({s, plan, u}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = plan.theme.colors;
  const d = s.data || {};

  const headline = d.text || d.title || "The Flow State Formula";
  const sub = d.sub || d.desc || "High challenge matched with deliberate high skill";

  const sp = clamp(spring({frame: f, fps, config: {damping: 14}}));
  const glowPulse = 0.8 + 0.2 * Math.sin(f * 0.08);

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
      {/* Radiant Gradient Pill */}
      <div style={{
        padding: `${0.8 * u}px ${3 * u}px`,
        background: `linear-gradient(90deg, ${c.ac}, ${c.tx})`,
        color: c.bg1,
        borderRadius: 99,
        fontWeight: "900",
        fontSize: 3.6 * u,
        letterSpacing: 2,
        marginBottom: 3 * u,
        boxShadow: `0 0 25px ${c.ac}`
      }}>
        ✨ MOMENTUM
      </div>

      {/* Main Gradient Typography Card */}
      <div style={{
        background: c.cd,
        backdropFilter: "blur(20px)",
        border: "1.5px solid rgba(255,255,255,0.25)",
        borderRadius: 4 * u,
        padding: 5 * u,
        width: "100%",
        boxSizing: "border-box",
        opacity: sp,
        transform: `scale(${0.92 + 0.08 * sp})`,
        boxShadow: `0 20px 50px rgba(0,0,0,0.3)`
      }}>
        <div style={{
          fontSize: 7.5 * u,
          fontWeight: "900",
          lineHeight: 1.18,
          marginBottom: 2 * u,
          color: c.tx
        }}>
          {headline}
        </div>
        <div style={{
          fontSize: 4.6 * u,
          lineHeight: 1.35,
          opacity: 0.88,
          color: c.tx
        }}>
          {sub}
        </div>
      </div>
    </div>
  );
};
