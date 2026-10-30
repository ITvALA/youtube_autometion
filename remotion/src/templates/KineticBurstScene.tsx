import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Scene, Plan} from "../Video";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const KineticBurstScene: React.FC<{s: Scene; plan: Plan; u: number}> = ({s, plan, u}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = plan.theme.colors;
  const d = s.data || {};

  const headline = d.text || d.title || "STOP PROCRASTINATING NOW";
  const words = String(headline).split(" ");
  const highlightWord = d.hl || words[Math.floor(words.length / 2)] || "";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      textAlign: "center",
      gap: 3 * u
    }}>
      {d.tag && (
        <div style={{
          fontSize: 4 * u,
          letterSpacing: 3,
          textTransform: "uppercase",
          padding: `${u}px ${3 * u}px`,
          background: c.ac,
          color: c.bg1,
          borderRadius: 99,
          fontWeight: "900"
        }}>
          {d.tag}
        </div>
      )}

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: `${2 * u}px ${3.5 * u}px`,
        maxWidth: 92 * u
      }}>
        {words.map((w, i) => {
          const sp = clamp(spring({frame: Math.max(0, f - i * 5), fps, config: {damping: 8, mass: 0.5}}), 0, 1.25);
          const isHl = w.toLowerCase() === highlightWord.toLowerCase();
          return (
            <span
              key={i}
              style={{
                fontSize: (isHl ? 12 : 9) * u,
                lineHeight: 1,
                fontWeight: "900",
                display: "inline-block",
                color: isHl ? c.ac : c.tx,
                textTransform: "uppercase",
                opacity: clamp(sp * 2),
                transform: `scale(${0.3 + 0.7 * sp}) translateY(${(1 - sp) * 8 * u}px)`,
                textShadow: isHl ? `0 0 30px ${c.ac}88` : undefined
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
};
