import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Scene, Plan} from "../Video";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const CountdownScene: React.FC<{s: Scene; plan: Plan; u: number}> = ({s, plan, u}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = plan.theme.colors;
  const d = s.data || {};

  const num = d.rank || d.number || d.index || "01";
  const title = d.title || d.text || "DECISION FATIGUE";
  const sub = d.sub || d.desc || "Eliminate trivial choices before noon";

  const numSp = clamp(spring({frame: f, fps, config: {damping: 8, mass: 0.6}}), 0, 1.2);
  const cardSp = clamp(spring({frame: Math.max(0, f - 10), fps, config: {damping: 12}}));

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "100%",
      maxWidth: 90 * u,
      gap: 2 * u,
      textAlign: "center"
    }}>
      {/* Huge Ranking Number */}
      <div style={{
        fontSize: 22 * u,
        fontWeight: "900",
        lineHeight: 0.9,
        color: c.ac,
        opacity: clamp(numSp),
        transform: `scale(${numSp})`,
        textShadow: `0 0 35px ${c.ac}66`
      }}>
        {num}
      </div>

      {/* Main Content Card */}
      <div style={{
        background: c.cd,
        border: `1.5px solid rgba(255,255,255,0.25)`,
        borderRadius: 4 * u,
        padding: 4.5 * u,
        width: "100%",
        opacity: cardSp,
        transform: `translateY(${(1 - cardSp) * 12 * u}px)`,
        boxSizing: "border-box"
      }}>
        <div style={{fontSize: 7 * u, fontWeight: "900", lineHeight: 1.15, textTransform: "uppercase"}}>
          {title}
        </div>
        <div style={{fontSize: 4.4 * u, opacity: 0.85, marginTop: 1.5 * u}}>
          {sub}
        </div>
      </div>
    </div>
  );
};
