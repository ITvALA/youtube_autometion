import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Scene, Plan} from "../Video";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const QuotePosterScene: React.FC<{s: Scene; plan: Plan; u: number}> = ({s, plan, u}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = plan.theme.colors;
  const d = s.data || {};

  const quote = d.quote || d.text || "You do not rise to the level of your goals. You fall to the level of your systems.";
  const author = d.by || d.author || plan.book?.author || "Author";

  const sp = clamp(spring({frame: f, fps, config: {damping: 14}}));

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      maxWidth: 90 * u,
      padding: 6 * u,
      border: `2px solid ${c.ac}`,
      background: c.cd,
      boxShadow: `0 0 40px ${c.ac}33`,
      borderRadius: 4 * u,
      textAlign: "center",
      opacity: sp,
      transform: `scale(${0.92 + 0.08 * sp})`,
      boxSizing: "border-box",
      position: "relative"
    }}>
      {/* Quotation Marks */}
      <div style={{
        fontSize: 16 * u,
        lineHeight: 0.5,
        color: c.ac,
        opacity: 0.4,
        marginBottom: 2 * u
      }}>
        “
      </div>

      {/* Quote Text */}
      <div style={{
        fontSize: 6.8 * u,
        lineHeight: 1.25,
        fontWeight: "900",
        fontStyle: "italic",
        color: c.tx
      }}>
        {quote}
      </div>

      {/* Author Badge */}
      <div style={{
        marginTop: 4 * u,
        fontSize: 4.2 * u,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: c.ac,
        fontWeight: "bold"
      }}>
        — {author}
      </div>
    </div>
  );
};
