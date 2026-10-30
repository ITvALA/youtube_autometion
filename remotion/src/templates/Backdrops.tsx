import React from "react";
import {AbsoluteFill, useCurrentFrame, interpolate} from "remotion";

export const TemplateBackdrop: React.FC<{
  type?: string;
  colors: {bg1: string; bg2: string; ac: string; tx: string; cd: string};
  u: number;
}> = ({type, colors: c, u}) => {
  const f = useCurrentFrame();
  if (!type || type === "none") return null;

  if (type === "landscape" || type === "mountains") {
    return (
      <AbsoluteFill style={{overflow: "hidden", pointerEvents: "none"}}>
        <svg viewBox="0 0 1080 1920" style={{width: "100%", height: "100%", position: "absolute"}}>
          <circle cx="540" cy="1150" r="180" fill={c.ac} opacity="0.35" />
          <path d="M-50,1450 L300,1100 L750,1550 L1150,1200 L1150,1920 L-50,1920 Z" fill={c.bg2} opacity="0.6" />
          <path d="M-50,1600 L450,1300 L950,1700 L1150,1550 L1150,1920 L-50,1920 Z" fill={c.bg1} opacity="0.8" />
        </svg>
      </AbsoluteFill>
    );
  }

  if (type === "city") {
    return (
      <AbsoluteFill style={{overflow: "hidden", pointerEvents: "none"}}>
        <svg viewBox="0 0 1080 1920" style={{width: "100%", height: "100%", position: "absolute"}}>
          <rect x="120" y="1100" width="160" height="820" fill={c.bg2} opacity="0.5" />
          <rect x="320" y="980" width="180" height="940" fill={c.bg2} opacity="0.7" />
          <polygon points="410,880 370,980 450,980" fill={c.ac} opacity="0.8" />
          <rect x="540" y="1050" width="220" height="870" fill={c.bg2} opacity="0.5" />
          <rect x="800" y="1180" width="160" height="740" fill={c.bg2} opacity="0.6" />
          {/* Lit windows */}
          {[1120, 1180, 1260, 1340, 1420].map((y, i) => (
            <React.Fragment key={i}>
              <rect x="350" y={y} width="16" height="24" fill={c.ac} opacity={((f + i * 8) % 30 > 10) ? 0.8 : 0.2} />
              <rect x="420" y={y} width="16" height="24" fill={c.ac} opacity={((f + i * 12) % 40 > 15) ? 0.8 : 0.2} />
            </React.Fragment>
          ))}
        </svg>
      </AbsoluteFill>
    );
  }

  if (type === "forest") {
    return (
      <AbsoluteFill style={{overflow: "hidden", pointerEvents: "none"}}>
        <svg viewBox="0 0 1080 1920" style={{width: "100%", height: "100%", position: "absolute"}}>
          <path d="M100,1500 L180,1350 L140,1350 L220,1200 L300,1350 L260,1350 L340,1500 Z" fill={c.bg2} opacity="0.5" />
          <path d="M700,1450 L780,1300 L740,1300 L820,1150 L900,1300 L860,1300 L940,1450 Z" fill={c.bg2} opacity="0.5" />
          {/* Fireflies floating */}
          {[1, 2, 3, 4, 5].map((idx) => {
            const dy = Math.sin((f + idx * 25) * 0.05) * 40;
            const dx = Math.cos((f + idx * 30) * 0.04) * 30;
            return (
              <circle
                key={idx}
                cx={200 + idx * 140 + dx}
                cy={1000 + idx * 100 + dy}
                r={4 * (0.8 + 0.4 * Math.sin((f + idx * 15) * 0.1))}
                fill={c.ac}
                opacity={0.6 + 0.3 * Math.sin(f * 0.1 + idx)}
              />
            );
          })}
        </svg>
      </AbsoluteFill>
    );
  }

  if (type === "ocean") {
    const waveShift = Math.sin(f * 0.05) * 30;
    return (
      <AbsoluteFill style={{overflow: "hidden", pointerEvents: "none"}}>
        <svg viewBox="0 0 1080 1920" style={{width: "100%", height: "100%", position: "absolute"}}>
          <path d={`M-50,1350 Q270,${1300 + waveShift} 540,1350 T1130,1350 L1130,1920 L-50,1920 Z`} fill={c.bg2} opacity="0.4" />
          <path d={`M-50,1450 Q270,${1490 - waveShift} 540,1450 T1130,1450 L1130,1920 L-50,1920 Z`} fill={c.ac} opacity="0.2" />
          <path d={`M-50,1550 Q270,${1520 + waveShift} 540,1550 T1130,1550 L1130,1920 L-50,1920 Z`} fill={c.bg1} opacity="0.7" />
        </svg>
      </AbsoluteFill>
    );
  }

  if (type === "stars") {
    return (
      <AbsoluteFill style={{overflow: "hidden", pointerEvents: "none"}}>
        <svg viewBox="0 0 1080 1920" style={{width: "100%", height: "100%", position: "absolute"}}>
          <circle cx="850" cy="350" r="100" fill={c.ac} opacity="0.25" />
          <circle cx="820" cy="320" r="80" fill={c.bg1} />
          {/* Constellation stars */}
          {[
            [150, 200], [250, 400], [450, 250], [650, 500], [800, 200],
            [180, 800], [900, 950], [350, 1100], [700, 1300], [200, 1400]
          ].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={3.5 + 2 * Math.sin(f * 0.12 + i)}
              fill={c.tx}
              opacity={0.4 + 0.5 * Math.sin(f * 0.1 + i * 2)}
            />
          ))}
        </svg>
      </AbsoluteFill>
    );
  }

  if (type === "terminal") {
    return (
      <AbsoluteFill style={{overflow: "hidden", pointerEvents: "none"}}>
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 2px, transparent 2px, transparent 4px)",
          opacity: 0.6
        }} />
        <div style={{
          position: "absolute",
          top: "4%",
          left: "6%",
          right: "6%",
          bottom: "10%",
          border: `2px solid ${c.ac}`,
          borderRadius: 16,
          opacity: 0.25,
          pointerEvents: "none"
        }} />
      </AbsoluteFill>
    );
  }

  if (type === "chalkboard") {
    return (
      <AbsoluteFill style={{overflow: "hidden", pointerEvents: "none"}}>
        <div style={{
          position: "absolute",
          inset: 16 * u,
          border: `3px dashed ${c.tx}`,
          borderRadius: 24,
          opacity: 0.2
        }} />
      </AbsoluteFill>
    );
  }

  if (type === "poster") {
    return (
      <AbsoluteFill style={{overflow: "hidden", pointerEvents: "none"}}>
        <div style={{
          position: "absolute",
          top: 8 * u,
          left: 6 * u,
          right: 6 * u,
          bottom: 12 * u,
          border: `2px solid ${c.ac}`,
          boxSizing: "border-box",
          opacity: 0.4
        }} />
        <div style={{
          position: "absolute",
          top: 9.5 * u,
          left: 7.5 * u,
          right: 7.5 * u,
          bottom: 13.5 * u,
          border: `1px solid ${c.tx}`,
          boxSizing: "border-box",
          opacity: 0.25
        }} />
      </AbsoluteFill>
    );
  }

  if (type === "cyber") {
    return (
      <AbsoluteFill style={{overflow: "hidden", pointerEvents: "none"}}>
        <svg viewBox="0 0 1080 1920" style={{width: "100%", height: "100%", position: "absolute"}}>
          <defs>
            <linearGradient id="cyberGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.ac} stopOpacity="0" />
              <stop offset="100%" stopColor={c.ac} stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <line x1="0" y1="1200" x2="1080" y2="1200" stroke={c.ac} strokeWidth="2" opacity="0.6" />
          {/* Perspective grid lines */}
          {[-400, -100, 200, 540, 880, 1180, 1480].map((x, i) => (
            <line key={i} x1="540" y1="1200" x2={x} y2="1920" stroke={c.ac} strokeWidth="1.5" opacity="0.3" />
          ))}
          {[1260, 1360, 1500, 1700].map((y, i) => (
            <line key={i} x1="0" y1={y} x2="1080" y2={y} stroke={c.ac} strokeWidth="1" opacity="0.2" />
          ))}
        </svg>
      </AbsoluteFill>
    );
  }

  if (type === "gradient_blobs") {
    const shift1 = Math.sin(f * 0.04) * 80;
    const shift2 = Math.cos(f * 0.03) * 60;
    return (
      <AbsoluteFill style={{overflow: "hidden", pointerEvents: "none"}}>
        <div style={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: 999,
          background: `radial-gradient(circle, ${c.ac} 0%, transparent 70%)`,
          top: `20%`,
          left: `10%`,
          transform: `translate(${shift1}px, ${shift2}px)`,
          filter: "blur(70px)",
          opacity: 0.35
        }} />
        <div style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: 999,
          background: `radial-gradient(circle, ${c.bg2} 0%, transparent 70%)`,
          bottom: `20%`,
          right: `5%`,
          transform: `translate(${-shift2}px, ${-shift1}px)`,
          filter: "blur(80px)",
          opacity: 0.45
        }} />
      </AbsoluteFill>
    );
  }

  if (type === "paper_layers") {
    return (
      <AbsoluteFill style={{overflow: "hidden", pointerEvents: "none"}}>
        <svg viewBox="0 0 1080 1920" style={{width: "100%", height: "100%", position: "absolute"}}>
          <path d="M-50,300 C300,200 700,450 1150,280 L1150,-50 L-50,-50 Z" fill={c.bg2} opacity="0.4" filter="drop-shadow(0 15px 25px rgba(0,0,0,0.3))" />
          <path d="M-50,1550 C400,1650 800,1450 1150,1600 L1150,1950 L-50,1950 Z" fill={c.bg2} opacity="0.4" filter="drop-shadow(0 -15px 25px rgba(0,0,0,0.3))" />
        </svg>
      </AbsoluteFill>
    );
  }

  return null;
};
