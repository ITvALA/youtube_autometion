import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Scene, Plan} from "../Video";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const TimelineScene: React.FC<{s: Scene; plan: Plan; u: number}> = ({s, plan, u}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = plan.theme.colors;
  const d = s.data || {};

  const milestones: string[] = d.milestones || d.items || [
    "Step 1: Cue Trigger",
    "Step 2: Craving Response",
    "Step 3: Immediate Reward"
  ];

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 4 * u,
      width: "100%",
      maxWidth: 88 * u,
      position: "relative",
      paddingLeft: 8 * u,
      boxSizing: "border-box"
    }}>
      {/* Vertical Path Line */}
      <div style={{
        position: "absolute",
        left: 2.8 * u,
        top: 2 * u,
        bottom: 2 * u,
        width: 0.8 * u,
        background: `linear-gradient(to bottom, ${c.ac}, ${c.tx})`,
        opacity: 0.5
      }} />

      {milestones.map((ms, i) => {
        const sp = clamp(spring({frame: Math.max(0, f - 8 - i * 12), fps, config: {damping: 12}}));
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3.5 * u,
              opacity: sp,
              transform: `translateX(${(1 - sp) * 10 * u}px)`
            }}
          >
            {/* Marker Node */}
            <div style={{
              width: 5 * u,
              height: 5 * u,
              borderRadius: 99,
              background: c.ac,
              color: c.bg1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "900",
              fontSize: 3 * u,
              flexShrink: 0,
              boxShadow: `0 0 15px ${c.ac}`
            }}>
              {i + 1}
            </div>

            {/* Content Card */}
            <div style={{
              background: c.cd,
              padding: `${2 * u}px ${3.5 * u}px`,
              borderRadius: 3 * u,
              fontSize: 4.8 * u,
              fontWeight: "bold",
              border: "1px solid rgba(255,255,255,0.2)",
              width: "100%"
            }}>
              {ms}
            </div>
          </div>
        );
      })}
    </div>
  );
};
