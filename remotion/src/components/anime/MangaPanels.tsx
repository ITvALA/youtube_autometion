import React from "react";
import {useCurrentFrame, useVideoConfig, spring, interpolate, AbsoluteFill} from "remotion";

export interface MangaPanelsProps {
  panel1Title: string;
  panel1Subtitle: string;
  panel2Title: string;
  panel2Subtitle: string;
  badgeText?: string;
  accentColor?: string;
  u: number;
}

export const MangaPanels: React.FC<MangaPanelsProps> = ({
  panel1Title,
  panel1Subtitle,
  panel2Title,
  panel2Subtitle,
  badgeText = "CRITICAL LESSON",
  accentColor = "#FF6B6B",
  u,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Entrance springs
  const popBadge = spring({frame: Math.max(0, frame - 5), fps, config: {damping: 9, mass: 0.5}});
  const slideLeft = spring({frame: Math.max(0, frame - 8), fps, config: {damping: 14}});
  const slideRight = spring({frame: Math.max(0, frame - 18), fps, config: {damping: 14}});

  // Camera subtle shift
  const camPan = interpolate(frame, [0, 90], [0, 8], {extrapolateRight: "clamp"});

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 3 * u,
        transform: `translateY(${-camPan}px)`,
      }}
    >
      {/* 💥 COMIC IMPACT BADGE */}
      {badgeText && (
        <div style={{alignSelf: "center", transform: `scale(${popBadge})`}}>
          <span
            style={{
              background: accentColor,
              color: "#000",
              fontWeight: 900,
              fontSize: 3.8 * u,
              padding: `${0.8 * u}px ${2.4 * u}px`,
              borderRadius: 6,
              letterSpacing: 2,
              textTransform: "uppercase",
              boxShadow: `0 0 16px ${accentColor}`,
              border: "2px solid #000",
              display: "inline-block",
              transform: "rotate(-2deg)",
            }}
          >
            ⚡ {badgeText}
          </span>
        </div>
      )}

      {/* 📖 PANEL 1: THE TRAP / PROBLEM */}
      <div
        style={{
          background: "rgba(20, 20, 25, 0.85)",
          border: "3px solid #27272A",
          borderLeft: `8px solid ${accentColor}`,
          borderRadius: 16,
          padding: `${2.8 * u}px ${4 * u}px`,
          transform: `translateX(${(1 - slideLeft) * -40}px)`,
          opacity: slideLeft,
          backdropFilter: "blur(12px)",
          boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
        }}
      >
        <div style={{fontSize: 3.4 * u, color: "#A1A1AA", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1}}>
          01 • STATUS QUO
        </div>
        <div style={{fontSize: 6.2 * u, fontWeight: 900, color: "#FFF", lineHeight: 1.15, marginTop: u}}>
          {panel1Title}
        </div>
        <div style={{fontSize: 4.2 * u, color: accentColor, fontWeight: 700, marginTop: 0.8 * u}}>
          {panel1Subtitle}
        </div>
      </div>

      {/* 📖 PANEL 2: THE ANIME PROTOCOL / SOLUTION */}
      <div
        style={{
          background: "rgba(10, 25, 20, 0.9)",
          border: "3px solid #064E3B",
          borderRight: `8px solid #10B981`,
          borderRadius: 16,
          padding: `${2.8 * u}px ${4 * u}px`,
          transform: `translateX(${(1 - slideRight) * 40}px)`,
          opacity: slideRight,
          backdropFilter: "blur(12px)",
          boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{fontSize: 3.4 * u, color: "#6EE7B7", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1}}>
          02 • THE PROTOCOL
        </div>
        <div style={{fontSize: 6.2 * u, fontWeight: 900, color: "#FFF", lineHeight: 1.15, marginTop: u}}>
          {panel2Title}
        </div>
        <div style={{fontSize: 4.2 * u, color: "#10B981", fontWeight: 700, marginTop: 0.8 * u}}>
          {panel2Subtitle}
        </div>
      </div>
    </div>
  );
};
