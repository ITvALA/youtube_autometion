import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Scene, Plan} from "../Video";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const StickyNotesScene: React.FC<{s: Scene; plan: Plan; u: number}> = ({s, plan, u}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const d = s.data || {};

  const notes: Array<{text: string; color: string; rot: number}> = d.notes || [
    {text: d.text1 || d.text || "Focus on Tiny 1% Shifts", color: "#FEF08A", rot: -3},
    {text: d.text2 || "Identity drives habits", color: "#FBCFE8", rot: 2.5},
    {text: d.text3 || "Make bad habits invisible", color: "#BAE6FD", rot: -1.5}
  ];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 4 * u,
      width: "100%",
      maxWidth: 88 * u,
      alignItems: "center"
    }}>
      {notes.map((n, i) => {
        const sp = clamp(spring({frame: Math.max(0, f - 6 - i * 10), fps, config: {damping: 11}}));
        return (
          <div
            key={i}
            style={{
              width: "100%",
              background: n.color,
              color: "#1E293B",
              padding: `${3 * u}px ${4 * u}px`,
              borderRadius: 2 * u,
              fontSize: 5 * u,
              lineHeight: 1.25,
              fontWeight: "bold",
              boxShadow: "0 15px 30px rgba(0,0,0,0.22)",
              transform: `rotate(${n.rot}deg) scale(${sp})`,
              opacity: sp,
              position: "relative",
              boxSizing: "border-box"
            }}
          >
            {/* Pushpin at top center */}
            <div style={{
              position: "absolute",
              top: -1.2 * u,
              left: "50%",
              transform: "translateX(-50%)",
              width: 2.6 * u,
              height: 2.6 * u,
              borderRadius: 99,
              background: "#EF4444",
              boxShadow: "0 2px 6px rgba(0,0,0,0.4)"
            }} />
            {n.text}
          </div>
        );
      })}
    </div>
  );
};
