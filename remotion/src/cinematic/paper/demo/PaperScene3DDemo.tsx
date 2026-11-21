import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring, Audio, staticFile } from "remotion";
import { PaperFiltersDefs, stopMotionTwos } from "../library/filters";
import { PaperBackground } from "../library/backgrounds/PaperBackgrounds";
import { PropComponent } from "../library/props/PaperProps";
import { PaperPuppet } from "../library/character/PaperPuppet";
import { getPalette } from "../library/palettes";

const CREAM = "#fbf5e6";
const INK = "#1c1815";
const GOLD = "#d4af37";
const RED = "#d8452e";

export const PaperScene3DDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width = 1080, height = 1920 } = useVideoConfig();
  const f = stopMotionTwos(frame, true);
  const palette = getPalette("dusk");

  // STAGGERED 3D POP-UP ENTRANCE
  const bgPop = Math.min(1, Math.max(0, spring({ frame: f, fps, config: { damping: 14, stiffness: 80 } })));
  const structPop = Math.min(1, Math.max(0, spring({ frame: Math.max(0, f - 6), fps, config: { damping: 13, stiffness: 90 } })));
  const charPop = Math.min(1, Math.max(0, spring({ frame: Math.max(0, f - 12), fps, config: { damping: 12, stiffness: 105 } })));
  const fgPop = Math.min(1, Math.max(0, spring({ frame: Math.max(0, f - 15), fps, config: { damping: 14, stiffness: 110 } })));
  const bannerPop = Math.min(1, Math.max(0, spring({ frame: Math.max(0, f - 18), fps, config: { damping: 14, stiffness: 120 } })));

  // CONTINUOUS 3D CINEMATIC DOLLY CAMERA (Real Perspective & Parallax)
  const progress = frame / 150;
  const camDollyZ = interpolate(progress, [0, 1], [-100, 180]);
  const camPanX = interpolate(progress, [0, 1], [40, -40]);
  const camCraneY = interpolate(progress, [0, 1], [30, -35]);
  const camTiltX = interpolate(progress, [0, 1], [-3.0, 3.5]);
  const camTiltY = interpolate(progress, [0, 1], [-3.5, 3.0]);
  const camRoll = interpolate(progress, [0, 1], [-0.8, 0.8]);

  // Speaking animation for Nayak
  const speechVolume = Math.max(0, Math.sin(f * 0.35) * 0.8 + 0.2);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#14100d",
        perspective: 1200, // 3D Perspective Eye
      }}
    >
      <PaperFiltersDefs palette={palette} />

      {/* Atmospheric Audio FX */}
      <Audio src={staticFile("myth-audio/whoosh.wav")} volume={0.4} />
      {frame >= 14 && <Audio src={staticFile("myth-audio/thump.wav")} volume={0.6} startFrom={0} />}

      {/* 3D GIMBAL RIG */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          transformStyle: "preserve-3d",
          transform: `translate3d(${camPanX}px, ${camCraneY}px, ${camDollyZ}px) rotateX(${camTiltX}deg) rotateY(${camTiltY}deg) rotateZ(${camRoll}deg)`,
          transformOrigin: "540px 1150px",
        }}
      >
        {/* ============================================================== */}
        {/* 3D LAYER 1: SKY & GLOWING SUN at Z = -280px (Far Parallax)     */}
        {/* ============================================================== */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: `translateZ(-280px) scale(1.24)`,
            transformOrigin: "540px 960px",
          }}
        >
          <svg viewBox="0 0 1080 1920" style={{ width: "100%", height: "100%" }}>
            <defs>
              <linearGradient id="demo-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7a2b1f" />
                <stop offset="45%" stopColor="#c25228" />
                <stop offset="85%" stopColor="#e89146" />
                <stop offset="100%" stopColor="#f5be76" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="1080" height="1920" fill="url(#demo-sky)" />

            {/* Radiant Concentric Sun Rings with Paper Glow */}
            <g transform="translate(540, 520)">
              <circle cx="0" cy="0" r="340" fill="rgba(255, 215, 120, 0.16)" />
              <circle cx="0" cy="0" r="260" fill="rgba(255, 215, 120, 0.28)" />
              <circle cx="0" cy="0" r="180" fill="rgba(255, 225, 140, 0.45)" />
              <circle cx="0" cy="0" r="110" fill="#fff4cf" stroke={CREAM} strokeWidth={6} />
            </g>

            {/* Flying Paper Birds Gliding in Parallax */}
            {[
              { startX: 740, startY: 340, speed: 1.6, scale: 0.9, delay: 0 },
              { startX: 860, startY: 260, speed: 2.0, scale: 1.1, delay: 5 },
              { startX: 620, startY: 380, speed: 1.4, scale: 0.75, delay: 10 },
            ].map((b, i) => {
              const t = f + b.delay;
              const bx = b.startX - (t * b.speed * 0.9) % 400;
              const by = b.startY + Math.cos(t * 0.06) * 12;
              const flap = Math.sin(t * 0.38) * 12;
              return (
                <g key={i} transform={`translate(${bx}, ${by}) scale(${b.scale})`}>
                  <path
                    d={`M0,0 Q18,${-14 + flap} 36,0 Q54,${-14 + flap} 72,0 Q54,6 36,3 Q18,6 0,0 Z`}
                    fill="#261b14"
                    stroke={CREAM}
                    strokeWidth={3}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* ============================================================== */}
        {/* 3D LAYER 2: MOUNTAIN PEAKS & SMOKE at Z = -130px               */}
        {/* ============================================================== */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: `translateZ(-130px) scale(1.1) translateY(${(1 - bgPop) * 180}px) rotateX(${(1 - bgPop) * 45}deg)`,
            transformOrigin: "540px 1450px",
          }}
        >
          <svg viewBox="0 0 1080 1920" style={{ width: "100%", height: "100%" }}>
            {/* Mountain Drop Shadows */}
            <g transform="translate(12, 18)" fill="rgba(30, 16, 8, 0.45)">
              <polygon points="-80,1450 180,720 440,1450" />
              <polygon points="260,1450 540,640 820,1450" />
              <polygon points="620,1450 880,700 1160,1450" />
            </g>
            {/* Distant Ridge */}
            <polygon points="-80,1450 180,720 440,1450" fill="#8c3e20" stroke={CREAM} strokeWidth={5} />
            <polygon points="620,1450 880,700 1160,1450" fill="#8c3e20" stroke={CREAM} strokeWidth={5} />

            {/* Midground Mountain Crest with White Torn Edges */}
            <polygon points="220,1450 540,630 860,1450" fill="#a84924" stroke={CREAM} strokeWidth={6.5} />
            {/* Contour Ridge Dashes */}
            <line x1="540" y1="630" x2="520" y2="1450" stroke={CREAM} strokeWidth={4.5} strokeDasharray="16 10" opacity={0.8} />

            {/* Billowing Battlefield Smoke Plumes */}
            <path
              d={`M240,1450 Q${280 + Math.sin(f * 0.1) * 20},1100 ${220 - Math.sin(f * 0.1) * 20},800 Q${290 + Math.sin(f * 0.1) * 20},500 240,250`}
              fill="none"
              stroke="#3d2a1e"
              strokeWidth="48"
              strokeLinecap="round"
              opacity={0.35}
            />
          </svg>
        </div>

        {/* ============================================================== */}
        {/* 3D LAYER 3: MANDIR / FORT ARCHITECTURE at Z = 0px              */}
        {/* ============================================================== */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: `translateZ(0px) scale(${structPop}) translateY(${(1 - structPop) * 140}px)`,
            transformOrigin: "540px 1450px",
          }}
        >
          <svg viewBox="0 0 1080 1920" style={{ width: "100%", height: "100%" }}>
            {/* Architectural Shadow */}
            <g transform="translate(14, 18)" fill="rgba(24, 12, 6, 0.48)">
              <rect x="220" y="1320" width="640" height="45" rx="4" />
              <rect x="260" y="1275" width="560" height="45" rx="4" />
              <rect x="310" y="870" width="70" height="405" rx="4" />
              <rect x="700" y="870" width="70" height="405" rx="4" />
              <rect x="270" y="830" width="540" height="55" rx="4" />
              <path d="M290,830 Q540,550 790,830 Z" />
            </g>

            {/* Platform Steps */}
            <rect x="220" y="1320" width="640" height="45" rx="4" fill="#6d2511" stroke={CREAM} strokeWidth={5} />
            <rect x="260" y="1275" width="560" height="45" rx="4" fill="#883318" stroke={CREAM} strokeWidth={5} />

            {/* Sanctum Archway */}
            <path d="M440,1275 L440,1030 Q540,940 640,1030 L640,1275 Z" fill="#1c120e" stroke={CREAM} strokeWidth={5} />
            {/* Glowing Golden Diya in Sanctum */}
            <circle cx="540" cy="1160" r="34" fill="#fde047" stroke={GOLD} strokeWidth={4} />
            <circle cx="540" cy="1160" r="18" fill="#fff" />

            {/* Carved Terracotta Pillars */}
            <rect x="310" y="870" width="70" height="405" rx="4" fill="#9e3a1b" stroke={CREAM} strokeWidth={5} />
            <rect x="295" y="870" width="100" height="20" rx="3" fill={GOLD} stroke={CREAM} strokeWidth={3.5} />
            <rect x="295" y="1255" width="100" height="20" rx="3" fill={GOLD} stroke={CREAM} strokeWidth={3.5} />

            <rect x="700" y="870" width="70" height="405" rx="4" fill="#9e3a1b" stroke={CREAM} strokeWidth={5} />
            <rect x="685" y="870" width="100" height="20" rx="3" fill={GOLD} stroke={CREAM} strokeWidth={3.5} />
            <rect x="685" y="1255" width="100" height="20" rx="3" fill={GOLD} stroke={CREAM} strokeWidth={3.5} />

            {/* Lintel Beam & Semicircular Dome */}
            <rect x="270" y="830" width="540" height="55" rx="4" fill="#b04423" stroke={CREAM} strokeWidth={5} />
            <path d="M290,830 Q540,550 790,830 Z" fill="#9e3a1b" stroke={CREAM} strokeWidth={5.5} strokeLinejoin="round" />

            {/* Kalash & Fluttering Saffron War Dhwaja */}
            <g transform="translate(540, 560)">
              <rect x="-16" y="0" width="32" height="60" rx="3" fill={GOLD} stroke={CREAM} strokeWidth={3.5} />
              <line x1="0" y1="0" x2="0" y2="-90" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
              <path
                d={`M0,-90 Q40,${-75 + Math.sin(f * 0.25) * 10} 85,-90 L60,-55 Q30,${-65 + Math.sin(f * 0.25) * 10} 0,-60 Z`}
                fill={RED}
                stroke="#9c2c1b"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            </g>
          </svg>
        </div>

        {/* ============================================================== */}
        {/* 3D LAYER 4: POP-UP WARRIOR & KING PUPPETS at Z = +140px        */}
        {/* ============================================================== */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: `translateZ(140px) scale(0.92) rotateX(${interpolate(charPop, [0, 1], [60, 0])}deg) translateY(${interpolate(charPop, [0, 1], [140, 0])}px)`,
            transformOrigin: "540px 1450px",
          }}
        >
          <svg viewBox="0 0 1080 1920" style={{ width: "100%", height: "100%", pointerEvents: "none" }}>
            {/* Warrior Baji Prabhu (Fierce Pointing Pose with Staff/Sword) */}
            <PaperPuppet
              frame={f}
              type="warrior"
              pose="point"
              build="muscular"
              emotion="fierce"
              x={330}
              y={1280}
              scale={1.22}
              audioLevel={speechVolume}
            />

            {/* Loyal Companion / King (Joyful / Resolute Talking Pose) */}
            <PaperPuppet
              frame={f}
              type="king"
              pose="talk"
              build="normal"
              emotion="joy"
              x={680}
              y={1280}
              scale={1.22}
              flip={true}
              audioLevel={speechVolume * 0.8}
            />
          </svg>
        </div>

        {/* ============================================================== */}
        {/* 3D LAYER 5: FOREGROUND PROPS & PAPER SPIKES at Z = +260px      */}
        {/* ============================================================== */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: `translateZ(260px) scale(0.8) translateY(${(1 - fgPop) * 120}px)`,
            transformOrigin: "540px 1800px",
            pointerEvents: "none",
          }}
        >
          <svg viewBox="0 0 1080 1920" style={{ width: "100%", height: "100%" }}>
            {/* Left Fluttering War Banner */}
            <PropComponent type="banner" x={150} y={1380} scale={1.25} frame={f} />

            {/* Right Camp Fire with Flickering Flames */}
            <PropComponent type="fire" x={860} y={1420} scale={1.15} frame={f} />

            {/* Sacred Golden Diya on Stone Step */}
            <PropComponent type="diya" x={540} y={1450} scale={1.0} frame={f} />

            {/* Foreground Paper Spikes & Framing Rock Silhouettes */}
            <g transform="translate(0, 1580)">
              {/* Drop Shadow */}
              <g transform="translate(6, 12)" fill="rgba(15, 8, 4, 0.55)">
                <rect x="0" y="80" width="1080" height="40" />
                {Array.from({ length: 16 }).map((_, i) => (
                  <polygon key={i} points={`${i * 70},80 ${i * 70 + 25},0 ${i * 70 + 50},80`} />
                ))}
                <polygon points="-40,180 140,50 300,180" />
                <polygon points="780,180 940,50 1120,180" />
              </g>

              {/* Wooden Fence Rails */}
              <rect x="0" y="80" width="1080" height="40" fill="#422513" stroke={CREAM} strokeWidth={4.5} />
              {Array.from({ length: 16 }).map((_, i) => (
                <polygon
                  key={i}
                  points={`${i * 70},80 ${i * 70 + 25},0 ${i * 70 + 50},80`}
                  fill="#5c351c"
                  stroke={CREAM}
                  strokeWidth={3.5}
                  strokeLinejoin="round"
                />
              ))}

              {/* Framing Rocks */}
              <polygon points="-40,180 140,50 300,180" fill="#24140c" stroke={CREAM} strokeWidth={5} strokeLinejoin="round" />
              <polygon points="780,180 940,50 1120,180" fill="#24140c" stroke={CREAM} strokeWidth={5} strokeLinejoin="round" />
            </g>
          </svg>

          {/* Deep Cinematic Corner Shadow Vignette */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              boxShadow: "inset 0 0 160px rgba(15, 8, 4, 0.7)",
              mixBlendMode: "multiply",
            }}
          />
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2D SCREEN OVERLAY: ROYAL TITLE CARD & HINGLISH SUBTITLES       */}
      {/* ============================================================== */}
      <div
        style={{
          position: "absolute",
          top: 100,
          left: 50,
          right: 50,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: bannerPop,
          transform: `scale(${bannerPop}) translateY(${(1 - bannerPop) * -40}px)`,
          zIndex: 100,
        }}
      >
        <div
          style={{
            background: CREAM,
            padding: "16px 36px",
            borderRadius: 14,
            border: "4px solid #fbf5e6",
            boxShadow: "0 14px 28px rgba(25, 12, 6, 0.45)",
            transform: "rotate(-1deg)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Rozha One', 'Mukta', serif",
              fontSize: 62,
              fontWeight: 800,
              color: INK,
              letterSpacing: 1,
              lineHeight: 1.15,
            }}
          >
            वीर बाजीप्रभु देशपांडे
          </div>
          <div
            style={{
              fontFamily: "'Mukta', sans-serif",
              fontSize: 34,
              fontWeight: 700,
              color: RED,
              marginTop: 6,
            }}
          >
            3D Pop-Up Paper Stage • पावनखिंड रणसंग्राम
          </div>
        </div>

        {/* Live Hinglish Dialogue Captions */}
        <div
          style={{
            marginTop: 22,
            background: "rgba(22, 14, 10, 0.85)",
            border: "2px solid #d4af37",
            padding: "8px 24px",
            borderRadius: 8,
            color: CREAM,
            fontFamily: "sans-serif",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          {frame < 60
            ? "Jab tak tope nahi daagi jaati..."
            : "Tab tak Baji Prabhu piche nahi hatega!"}
        </div>
      </div>
    </div>
  );
};
