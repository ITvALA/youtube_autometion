import React from "react";
import { interpolate, spring } from "remotion";
import { PFScene } from "./types";

/* 
 * MINDSPARK 2D LAYERED PAPER-CUTOUT STAGE (Handcrafted Pop-Up Diorama)
 * Faithfully matches the user's reference image:
 * 1. Palette: Sunset amber, terracotta, warm parchment, cream (#fbf5e6), antique gold, deep ink.
 * 2. Layer 1: Sun & Sky with concentric paper ripple rings.
 * 3. Layer 2: Flying paper birds (pakshi) gliding across the sky.
 * 4. Layer 3: Sharp mountain peaks (pahar) popping up from the ground with white paper borders.
 * 5. Layer 4: Traditional paper Mandir / Fort architecture with pillars, dome, glowing diya & waving flag.
 * 6. Layer 5: Paper cutout character (King/Warrior/Nayak) with crown, dhoti, sword/staff, bobbing & talking.
 * 7. Layer 6: Foreground paper spikes/fence.
 * 8. Staggered Pop-Up Spring Animation: Mountains pop up first, then structure, then character drops in!
 */

const CREAM = "#fbf5e6";
const INK = "#1d1b1a";
const SHADOW = "#7a6a4a";
const RED = "#d8452e";
const RED_DARK = "#9c2c1b";
const GOLD = "#c89b3c";
const TERRACOTTA = "#b34724";
const TERRACOTTA_LIGHT = "#c26038";
const TERRACOTTA_DARK = "#7c2810";
const SKIN = "#e5b083";

/* ------------------------------------------------------------- 1. BIRDS */
const PaperBirds: React.FC<{ lf: number; w: number; h: number }> = ({ lf, w, h }) => {
  const birds = [
    { startX: 720, startY: 340, speed: 1.8, scale: 0.85, delay: 0 },
    { startX: 840, startY: 260, speed: 2.2, scale: 1.0, delay: 4 },
    { startX: 620, startY: 380, speed: 1.6, scale: 0.65, delay: 8 },
  ];

  return (
    <g>
      {birds.map((b, i) => {
        const t = lf + b.delay;
        const x = b.startX + Math.sin(t * 0.04) * 40 - (t * b.speed * 0.7) % 350;
        const y = b.startY + Math.cos(t * 0.05) * 15;
        const flap = Math.sin(t * 0.35) * 12;

        return (
          <g key={i} transform={`translate(${x}, ${y}) scale(${b.scale})`}>
            {/* Drop shadow */}
            <path
              d={`M0,0 Q18,${-14 + flap} 36,0 Q54,${-14 + flap} 72,0 Q54,6 36,3 Q18,6 0,0 Z`}
              fill={SHADOW}
              opacity={0.4}
              transform="translate(4, 6)"
            />
            {/* Paper Bird with White Border */}
            <path
              d={`M0,0 Q18,${-14 + flap} 36,0 Q54,${-14 + flap} 72,0 Q54,6 36,3 Q18,6 0,0 Z`}
              fill="#2c2824"
              stroke={CREAM}
              strokeWidth={3}
              strokeLinejoin="round"
            />
          </g>
        );
      })}
    </g>
  );
};

/* ------------------------------------------------------------- 2. MOUNTAINS */
const PaperMountains: React.FC<{ progress: number }> = ({ progress }) => {
  const p = Math.max(0, Math.min(1, progress));
  const scaleY = interpolate(p, [0, 1], [0.1, 1]);
  const translateY = interpolate(p, [0, 1], [250, 0]);

  return (
    <g transform={`translate(0, ${translateY}) scale(1, ${scaleY})`} style={{ transformOrigin: "540px 1450px" }}>
      {/* Background Shadow Layer */}
      <g transform="translate(10, 14)" fill={SHADOW} opacity={0.45}>
        <polygon points="-80,1450 180,720 440,1450" />
        <polygon points="260,1450 540,640 820,1450" />
        <polygon points="620,1450 880,700 1160,1450" />
      </g>

      {/* Layer 1: Distant Mountains (Dark Sand) */}
      <polygon
        points="-80,1450 180,720 440,1450"
        fill="#a04d2c"
        stroke={CREAM}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <polygon
        points="620,1450 880,700 1160,1450"
        fill="#a04d2c"
        stroke={CREAM}
        strokeWidth={5}
        strokeLinejoin="round"
      />

      {/* Layer 2: Midground Main Peaks (Terracotta with White Paper Borders) */}
      <polygon
        points="220,1450 540,630 860,1450"
        fill={TERRACOTTA_LIGHT}
        stroke={CREAM}
        strokeWidth={6}
        strokeLinejoin="round"
      />
      {/* Mountain Ridge Accent Lines */}
      <line x1="540" y1="630" x2="520" y2="1450" stroke={CREAM} strokeWidth={4} strokeDasharray="14 10" opacity={0.8} />
      <line x1="180" y1="720" x2="200" y2="1450" stroke={CREAM} strokeWidth={3.5} strokeDasharray="12 8" opacity={0.7} />
      <line x1="880" y1="700" x2="850" y2="1450" stroke={CREAM} strokeWidth={3.5} strokeDasharray="12 8" opacity={0.7} />
    </g>
  );
};

/* ------------------------------------------------------------- 3. TEMPLE ARCHITECTURE */
const PaperTemple: React.FC<{ progress: number; lf: number }> = ({ progress, lf }) => {
  const p = Math.max(0, Math.min(1, progress));
  const scale = interpolate(p, [0, 1], [0.75, 1]);
  const translateY = interpolate(p, [0, 1], [200, 0]);
  const flagWave = Math.sin(lf * 0.22) * 10;

  return (
    <g transform={`translate(0, ${translateY}) scale(${scale})`} style={{ transformOrigin: "540px 1450px" }}>
      {/* Physical Drop Shadow */}
      <g transform="translate(12, 16)" fill={SHADOW} opacity={0.48}>
        {/* Base steps */}
        <rect x="220" y="1320" width="640" height="45" rx="4" />
        <rect x="260" y="1275" width="560" height="45" rx="4" />
        {/* Pillars */}
        <rect x="310" y="870" width="70" height="405" rx="4" />
        <rect x="700" y="870" width="70" height="405" rx="4" />
        {/* Lintel Beam */}
        <rect x="270" y="830" width="540" height="55" rx="4" />
        {/* Dome */}
        <path d="M290,830 Q540,550 790,830 Z" />
        <circle cx="540" cy="620" r="30" />
      </g>

      {/* Layer 1: Stone Platform Steps */}
      <rect x="220" y="1320" width="640" height="45" rx="4" fill="#8c361c" stroke={CREAM} strokeWidth={5} />
      <rect x="260" y="1275" width="560" height="45" rx="4" fill="#a04424" stroke={CREAM} strokeWidth={5} />

      {/* Layer 2: Inner Sanctum Arched Gate */}
      <path
        d="M440,1275 L440,1030 Q540,940 640,1030 L640,1275 Z"
        fill="#261b18"
        stroke={CREAM}
        strokeWidth={5}
      />
      {/* Sacred Golden Glowing Diya / Lingam in Sanctum */}
      <circle cx="540" cy="1160" r="32" fill="#fde047" stroke={GOLD} strokeWidth={4} />
      <circle cx="540" cy="1160" r="16" fill="#fff" />

      {/* Layer 3: Solid Classical Paper Pillars */}
      <g>
        {/* Left Pillar */}
        <rect x="310" y="870" width="70" height="405" rx="4" fill={TERRACOTTA} stroke={CREAM} strokeWidth={5} />
        <rect x="295" y="870" width="100" height="20" rx="3" fill={GOLD} stroke={CREAM} strokeWidth={3.5} />
        <rect x="295" y="1255" width="100" height="20" rx="3" fill={GOLD} stroke={CREAM} strokeWidth={3.5} />

        {/* Right Pillar */}
        <rect x="700" y="870" width="70" height="405" rx="4" fill={TERRACOTTA} stroke={CREAM} strokeWidth={5} />
        <rect x="685" y="870" width="100" height="20" rx="3" fill={GOLD} stroke={CREAM} strokeWidth={3.5} />
        <rect x="685" y="1255" width="100" height="20" rx="3" fill={GOLD} stroke={CREAM} strokeWidth={3.5} />
      </g>

      {/* Layer 4: Grand Lintel Beam */}
      <rect x="270" y="830" width="540" height="55" rx="4" fill={TERRACOTTA_LIGHT} stroke={CREAM} strokeWidth={5} />

      {/* Layer 5: Semicircular Terracotta Dome */}
      <path
        d="M290,830 Q540,550 790,830 Z"
        fill={TERRACOTTA}
        stroke={CREAM}
        strokeWidth={5.5}
        strokeLinejoin="round"
      />

      {/* Layer 6: Golden Kalash Finial & Fluttering Saffron Flag (Dhwaja) */}
      <g transform="translate(540, 560)">
        <rect x="-16" y="0" width="32" height="60" rx="3" fill={GOLD} stroke={CREAM} strokeWidth={3.5} />
        <line x1="0" y1="0" x2="0" y2="-90" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
        {/* Saffron Flag with Sine Wave Breeze */}
        <path
          d={`M0,-90 Q40,${-75 + flagWave} 85,-90 L60,-55 Q30,${-65 + flagWave} 0,-60 Z`}
          fill={RED}
          stroke={RED_DARK}
          strokeWidth={3}
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
};

/* ------------------------------------------------------------- 4. CHARACTER (NAYAK / KING / WARRIOR) */
const PaperCharacter: React.FC<{ progress: number; lf: number }> = ({ progress, lf }) => {
  const p = Math.max(0, Math.min(1, progress));
  const scale = interpolate(p, [0, 1], [0.6, 1]);
  const translateY = interpolate(p, [0, 1], [-180, 0]);

  // Subtle breathing / speaking gestures
  const bob = Math.sin(lf * 0.2) * 5;
  const headTilt = Math.sin(lf * 0.15) * 3;
  const swordSway = Math.sin(lf * 0.18) * 4;

  return (
    <g
      transform={`translate(160, ${820 + translateY + bob}) scale(${scale})`}
      style={{ transformOrigin: "100px 500px" }}
    >
      {/* Physical Paper Drop Shadow Layer */}
      <g transform="translate(10, 14)" fill={SHADOW} opacity={0.5}>
        <circle cx="95" cy="110" r="48" />
        <rect x="55" y="165" width="80" height="120" rx="6" />
        <polygon points="50,285 140,285 160,375 30,375" />
        <rect x="62" y="375" width="26" height="140" rx="4" />
        <rect x="102" y="375" width="26" height="140" rx="4" />
        <rect x="125" y="180" width="24" height="260" rx="4" transform="rotate(-18 125 180)" />
      </g>

      {/* Sword / Royal Staff */}
      <g transform={`translate(130, 210) rotate(${-16 + swordSway})`}>
        <rect x="-8" y="0" width="16" height="260" rx="5" fill={GOLD} stroke={CREAM} strokeWidth={3.5} />
        {/* Sword Pommel & Crossguard */}
        <rect x="-24" y="40" width="48" height="14" rx="4" fill={CREAM} stroke={GOLD} strokeWidth={2.5} />
        <circle cx="0" cy="20" r="14" fill={GOLD} stroke={CREAM} strokeWidth={3} />
      </g>

      {/* Paper Legs & Traditional Footwear */}
      <rect x="62" y="370" width="26" height="145" rx="5" fill={CREAM} stroke={INK} strokeWidth={3.5} />
      <rect x="102" y="370" width="26" height="145" rx="5" fill={CREAM} stroke={INK} strokeWidth={3.5} />
      {/* Shoes / Mojari */}
      <path d="M52,500 L95,500 L95,518 L46,518 Q46,500 52,500 Z" fill="#3a2518" stroke={CREAM} strokeWidth={3} />
      <path d="M92,500 L135,500 L135,518 L86,518 Q86,500 92,500 Z" fill="#3a2518" stroke={CREAM} strokeWidth={3} />

      {/* Layered Saffron Dhoti / Robe */}
      <polygon points="45,285 145,285 170,380 20,380" fill={CREAM} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <polygon points="65,285 125,285 145,375 45,375" fill={GOLD} stroke={CREAM} strokeWidth={3} />

      {/* Torso / Saffron Angarkha Tunic */}
      <rect x="52" y="165" width="86" height="125" rx="6" fill={TERRACOTTA_LIGHT} stroke={CREAM} strokeWidth={4.5} />
      {/* Royal Sash / Patka */}
      <path d="M52,165 L138,290" stroke={CREAM} strokeWidth={5} />
      <rect x="52" y="270" width="86" height="18" rx="4" fill={GOLD} stroke={CREAM} strokeWidth={3} />

      {/* Head with Tilt Animation */}
      <g transform={`translate(95, 110) rotate(${headTilt})`}>
        {/* Face */}
        <circle cx="0" cy="0" r="48" fill={SKIN} stroke={CREAM} strokeWidth={4.5} />
        {/* Smiling Happy Eyes */}
        <circle cx="-16" cy="-4" r="5" fill={INK} />
        <circle cx="16" cy="-4" r="5" fill={INK} />
        {/* Tilak on Forehead */}
        <line x1="0" y1="-28" x2="0" y2="-12" stroke={RED} strokeWidth={4} strokeLinecap="round" />
        <circle cx="0" cy="-6" r="3" fill={GOLD} />
        {/* Gentle Traditional Smile */}
        <path d="M-14,14 Q0,26 14,14" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />

        {/* Traditional Golden Paper Crown (Mukut) */}
        <g transform="translate(0, -42)">
          <path
            d="M-42,0 L42,0 L34,-38 L16,-20 L0,-48 L-16,-20 L-34,-38 Z"
            fill={GOLD}
            stroke={CREAM}
            strokeWidth={4}
            strokeLinejoin="round"
          />
          <circle cx="0" cy="-24" r="6" fill={RED} stroke={CREAM} strokeWidth={2} />
        </g>
      </g>
    </g>
  );
};

/* ------------------------------------------------------------- 5. FOREGROUND PAPER FENCE */
const PaperForeground: React.FC = () => {
  return (
    <g transform="translate(0, 1380)">
      {/* Drop Shadow */}
      <g transform="translate(6, 10)" fill={SHADOW} opacity={0.45}>
        <rect x="0" y="80" width="1080" height="40" />
        {Array.from({ length: 16 }).map((_, i) => (
          <polygon key={i} points={`${i * 70},80 ${i * 70 + 25},0 ${i * 70 + 50},80`} />
        ))}
        {/* Big framing rock silhouettes */}
        <polygon points="-40,160 120,40 240,160" />
        <polygon points="840,160 960,40 1120,160" />
      </g>

      {/* Wooden / Paper Spikes Fence */}
      <rect x="0" y="80" width="1080" height="40" fill="#6e2d18" stroke={CREAM} strokeWidth={4} />
      {Array.from({ length: 16 }).map((_, i) => (
        <polygon
          key={i}
          points={`${i * 70},80 ${i * 70 + 25},0 ${i * 70 + 50},80`}
          fill="#8c3b20"
          stroke={CREAM}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      ))}

      {/* Flanking Foreground Paper Cutout Rocks (Frame Depth) */}
      <polygon points="-40,160 120,30 250,160" fill="#4a2216" stroke={CREAM} strokeWidth={5} strokeLinejoin="round" />
      <polygon points="830,160 960,30 1120,160" fill="#4a2216" stroke={CREAM} strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};

/* ------------------------------------------------------------- 6. FULL-SCREEN COMPOSITOR */
export const PaperStage: React.FC<{
  s: PFScene;
  lf: number;
  fps: number;
  w?: number;
  h?: number;
}> = ({ s, lf, fps, w = 1080, h = 1920 }) => {
  // Staggered Pop-Up Physics (Mountains -> Temple -> Character)
  const mtnSpring = spring({ frame: lf, fps, config: { damping: 13, stiffness: 110 } });
  const templeSpring = spring({ frame: Math.max(0, lf - 6), fps, config: { damping: 13, stiffness: 110 } });
  const charSpring = spring({ frame: Math.max(0, lf - 12), fps, config: { damping: 12, stiffness: 115 } });

  // Concentric Sun Rings expansion
  const sunPulse = 1 + Math.sin(lf * 0.08) * 0.025;

  return (
    <div style={{ position: "relative", width: w, height: h, overflow: "hidden", background: "#f2a868" }}>
      {/* Layer 0: Warm Sunset Paper Sky Gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, #e87a42 0%, #f4a261 40%, #e98a50 70%, #d46838 100%)",
        }}
      />

      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", inset: 0 }}>
        {/* Layer 1: Concentric Glowing Paper Sun Rings */}
        <g transform={`translate(540, 500) scale(${sunPulse})`}>
          <circle cx="0" cy="0" r="280" fill="#fce4b8" opacity={0.35} />
          <circle cx="0" cy="0" r="230" fill="#fdecc8" opacity={0.55} />
          <circle cx="0" cy="0" r="175" fill="#fff5dc" opacity={0.8} />
          <circle cx="0" cy="0" r="120" fill="#fffdf5" />
        </g>

        {/* Layer 2: Flying Paper Birds (Pakshi) */}
        <PaperBirds lf={lf} w={w} h={h} />

        {/* Layer 3: Layered Mountain Peaks (Pahar) */}
        <PaperMountains progress={mtnSpring} />

        {/* Layer 4: Traditional Paper Temple Architecture */}
        <PaperTemple progress={templeSpring} lf={lf} />

        {/* Layer 5: 2D Paper Character (Warrior / Nayak / King) */}
        <PaperCharacter progress={charSpring} lf={lf} />

        {/* Layer 6: Foreground Jagged Paper Spikes / Fence */}
        <PaperForeground />
      </svg>

      {/* Layer 7: Top Banner for Scene Headline / Dialogue */}
      {s.text && (
        <div
          style={{
            position: "absolute",
            left: 50,
            right: 50,
            top: 130,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: CREAM,
              padding: "16px 36px",
              borderRadius: 14,
              boxShadow: "0 12px 24px rgba(45, 20, 8, 0.35)",
              border: `3.5px solid ${CREAM}`,
              transform: "rotate(-0.8deg)",
              textAlign: "center",
              maxWidth: "92%",
            }}
          >
            <div
              style={{
                fontFamily: "'PF Display','Mukta',serif",
                fontSize: 68,
                fontWeight: 700,
                color: INK,
                lineHeight: 1.18,
              }}
            >
              {s.text}
            </div>
            {s.sub && (
              <div
                style={{
                  fontFamily: "'PF Body','Mukta',sans-serif",
                  fontSize: 38,
                  color: RED,
                  marginTop: 8,
                  fontWeight: 600,
                }}
              >
                {s.sub}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
