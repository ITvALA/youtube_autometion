import React from "react";
import { BackgroundType, TimeOfDay, TimeOfDayPalette } from "../types";
import { getPalette } from "../palettes";
import { stopMotionTwos } from "../filters";

const CREAM = "#fbf5e6";
const INK = "#1c1815";

interface BackgroundProps {
  type: BackgroundType;
  variant?: number;
  timeOfDay?: TimeOfDay;
  frame: number;
  seed?: number;
  width?: number;
  height?: number;
}

// -------------------------------------------------------------------
// 1. VILLAGE (Huts, trees, well, fields, path, chulha smoke)
// -------------------------------------------------------------------
const VillageBackground: React.FC<{
  variant: number;
  palette: TimeOfDayPalette;
  frame: number;
  seed: number;
}> = ({ variant, palette, frame, seed }) => {
  const f = stopMotionTwos(frame, true);
  const smokeWobble = Math.sin(f * 0.12) * 8;
  const treeSway = Math.sin(f * 0.08) * 3;

  return (
    <g>
      {/* Distant Rolling Fields */}
      <path
        d="M-50,1180 Q250,1100 550,1160 Q850,1220 1150,1140 L1150,1920 L-50,1920 Z"
        fill={palette.sand}
        stroke={CREAM}
        strokeWidth="4"
      />
      <path
        d="M-50,1260 Q350,1210 650,1270 Q950,1220 1150,1290 L1150,1920 L-50,1920 Z"
        fill={palette.foliageDark}
        opacity={0.4}
      />

      {/* Winding Village Dirt Path */}
      <path
        d={
          variant === 1
            ? "M200,1920 Q480,1500 420,1320 Q400,1250 480,1200 L530,1200 Q480,1260 520,1350 Q600,1550 420,1920 Z"
            : "M480,1920 Q560,1580 500,1380 Q460,1280 520,1200 L580,1200 Q540,1290 600,1400 Q720,1650 780,1920 Z"
        }
        fill={palette.sand}
        stroke={CREAM}
        strokeWidth="3.5"
      />

      {/* Thatched Mud Huts */}
      {/* Hut 1 */}
      <g transform="translate(180, 1180)">
        {/* Shadow */}
        <polygon points="-8,70 168,70 148,150 -28,150" fill={palette.shadowColor} opacity={0.3} />
        {/* Wall */}
        <rect x="0" y="50" width="160" height="95" rx="4" fill={palette.terracottaLight} stroke={CREAM} strokeWidth="4" />
        {/* Door */}
        <path d="M55,145 L55,85 Q80,72 105,85 L105,145 Z" fill="#2d1b14" stroke={CREAM} strokeWidth="3" />
        {/* Thatched Roof */}
        <polygon points="-25,55 80,-25 185,55" fill="#c49a45" stroke={CREAM} strokeWidth="4.5" />
        {/* Chulha Smoke Rising */}
        <path
          d={`M130,-15 Q${140 + smokeWobble},${-60} 135,${-110} Q${150 - smokeWobble},${-160} 140,${-220}`}
          fill="none"
          stroke={CREAM}
          strokeWidth="6"
          strokeLinecap="round"
          opacity={0.65}
        />
      </g>

      {/* Hut 2 (Variant layout) */}
      <g transform={variant === 0 ? "translate(720, 1220)" : "translate(680, 1150) scale(0.85)"}>
        <rect x="0" y="45" width="140" height="85" rx="4" fill={palette.terracotta} stroke={CREAM} strokeWidth="4" />
        <path d="M50,130 L50,75 Q70,65 90,75 L90,130 Z" fill="#2d1b14" stroke={CREAM} strokeWidth="3" />
        <polygon points="-20,50 70,-18 160,50" fill="#a67c32" stroke={CREAM} strokeWidth="4" />
      </g>

      {/* Village Well */}
      <g transform="translate(460, 1380)">
        <ellipse cx="60" cy="80" rx="70" ry="22" fill={palette.shadowColor} opacity={0.3} />
        {/* Stone Rim */}
        <path d="M0,40 Q60,65 120,40 L120,80 Q60,105 0,80 Z" fill="#718096" stroke={CREAM} strokeWidth="4" />
        <ellipse cx="60" cy="40" rx="60" ry="18" fill="#1a202c" stroke={CREAM} strokeWidth="3.5" />
        <ellipse cx="60" cy="40" rx="45" ry="12" fill={palette.water} />
        {/* Wooden Pulley Structure */}
        <rect x="10" y="-30" width="10" height="75" rx="2" fill="#5c4033" stroke={CREAM} strokeWidth="2.5" />
        <rect x="100" y="-30" width="10" height="75" rx="2" fill="#5c4033" stroke={CREAM} strokeWidth="2.5" />
        <line x1="15" y1="-25" x2="105" y2="-25" stroke="#5c4033" strokeWidth="6" strokeLinecap="round" />
        <circle cx="60" cy="-25" r="9" fill="#c49a45" stroke={INK} strokeWidth="2" />
      </g>

      {/* Swaying Banyan / Foliage in foreground */}
      <g transform={`translate(-60, 1050) rotate(${treeSway})`}>
        <rect x="100" y="120" width="40" height="400" rx="8" fill="#4a2e18" stroke={CREAM} strokeWidth="4" />
        <circle cx="120" cy="100" r="140" fill={palette.foliage} stroke={CREAM} strokeWidth="5" />
        <circle cx="210" cy="60" r="110" fill={palette.foliageDark} stroke={CREAM} strokeWidth="4" />
      </g>
    </g>
  );
};

// -------------------------------------------------------------------
// 2. FOREST (Dense trees, sunbeams, vines, swaying grass)
// -------------------------------------------------------------------
const ForestBackground: React.FC<{
  variant: number;
  palette: TimeOfDayPalette;
  frame: number;
}> = ({ variant, palette, frame }) => {
  const f = stopMotionTwos(frame, true);
  const vineSway = Math.sin(f * 0.09) * 6;

  return (
    <g>
      {/* Sunbeams filtering through canopy */}
      <g opacity={0.22}>
        <polygon points="120,0 260,0 480,1920 180,1920" fill={palette.sunMoonGlow} />
        <polygon points="520,0 680,0 950,1920 720,1920" fill={palette.sunMoonGlow} />
      </g>

      {/* Far Tree Silhouettes */}
      <g opacity={0.65}>
        <polygon points="60,600 160,1100 260,1500 -40,1500" fill={palette.foliageDark} />
        <polygon points="400,550 520,1050 640,1500 280,1500" fill={palette.foliageDark} />
        <polygon points="760,580 880,1120 1020,1500 680,1500" fill={palette.foliageDark} />
      </g>

      {/* Layered Trunks and Overhanging Foliage */}
      {/* Trunk 1 */}
      <path
        d="M120,0 Q160,500 140,1000 Q110,1400 60,1920 L-40,1920 L0,0 Z"
        fill="#3d2817"
        stroke={CREAM}
        strokeWidth="5"
      />
      {/* Hanging Vines */}
      <path
        d={`M130,280 Q${170 + vineSway},420 145,600 Q${180 - vineSway},780 155,950`}
        fill="none"
        stroke={palette.foliage}
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Trunk 2 (Right) */}
      <path
        d="M920,0 Q880,600 910,1100 Q950,1500 1040,1920 L1140,1920 L1080,0 Z"
        fill="#4a321d"
        stroke={CREAM}
        strokeWidth="5"
      />
      <path
        d={`M910,340 Q${870 - vineSway},520 895,700 Q${860 + vineSway},880 885,1060`}
        fill="none"
        stroke={palette.foliage}
        strokeWidth="5.5"
        strokeLinecap="round"
      />

      {/* Dense Canopy Arches */}
      <path
        d="M-50,0 Q540,320 1130,0 L1130,-100 L-50,-100 Z"
        fill={palette.foliageDark}
        stroke={CREAM}
        strokeWidth="6"
      />
      <circle cx="280" cy="180" r="180" fill={palette.foliage} stroke={CREAM} strokeWidth="5" />
      <circle cx="800" cy="220" r="210" fill={palette.foliage} stroke={CREAM} strokeWidth="5" />

      {/* Forest Ground with Moss and Grass Tufts */}
      <path
        d="M-40,1550 Q280,1480 600,1520 Q920,1560 1120,1490 L1120,1920 L-40,1920 Z"
        fill={palette.foliageDark}
        stroke={CREAM}
        strokeWidth="5"
      />
    </g>
  );
};

// -------------------------------------------------------------------
// 3. RIVER GHAT (Stone steps, rippling water, floating diyas)
// -------------------------------------------------------------------
const RiverGhatBackground: React.FC<{
  variant: number;
  palette: TimeOfDayPalette;
  frame: number;
}> = ({ variant, palette, frame }) => {
  const f = stopMotionTwos(frame, true);
  const waterFlow = (f * 1.5) % 80;
  const diyaFlicker = Math.sin(f * 0.35) * 3;

  return (
    <g>
      {/* Stone Chhatris / Temple Pavilions on top terrace */}
      <g transform="translate(140, 780)">
        {/* Base */}
        <rect x="0" y="100" width="180" height="40" fill={palette.terracotta} stroke={CREAM} strokeWidth="3" />
        {/* Pillars */}
        <rect x="20" y="20" width="20" height="80" fill={palette.terracottaLight} stroke={CREAM} strokeWidth="2.5" />
        <rect x="140" y="20" width="20" height="80" fill={palette.terracottaLight} stroke={CREAM} strokeWidth="2.5" />
        {/* Dome */}
        <path d="M10,20 Q90,-60 170,20 Z" fill={palette.terracotta} stroke={CREAM} strokeWidth="3.5" />
        <circle cx="90" cy="-60" r="8" fill="#d4af37" />
      </g>

      {/* Ghat Stepped Stone Terraces */}
      {Array.from({ length: 6 }).map((_, i) => {
        const y = 940 + i * 55;
        const width = 1080;
        return (
          <g key={i}>
            <rect
              x="-20"
              y={y}
              width={width + 40}
              height="35"
              fill={i % 2 === 0 ? palette.sand : palette.terracottaLight}
              stroke={CREAM}
              strokeWidth="3.5"
            />
            {/* Step edge shading */}
            <line x1="-20" y1={y + 35} x2={width + 20} y2={y + 35} stroke={INK} strokeWidth="2" opacity={0.3} />
          </g>
        );
      })}

      {/* Sacred River Water Body */}
      <rect x="-20" y="1270" width="1120" height="670" fill={palette.water} stroke={CREAM} strokeWidth="5" />

      {/* Animated Water Ripples */}
      {Array.from({ length: 9 }).map((_, idx) => {
        const rippleY = 1310 + idx * 60;
        const rippleX = ((idx * 160 + waterFlow * 4) % 1180) - 100;
        return (
          <path
            key={idx}
            d={`M${rippleX},${rippleY} Q${rippleX + 70},${rippleY - 10} ${rippleX + 140},${rippleY} Q${rippleX + 210},${rippleY + 10} ${rippleX + 280},${rippleY}`}
            fill="none"
            stroke={palette.waterHighlight}
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity={0.7}
          />
        );
      })}

      {/* Floating Paper Diyas on River */}
      {[
        { x: 320, y: 1400, speed: 0.8 },
        { x: 620, y: 1520, speed: 1.1 },
        { x: 450, y: 1650, speed: 0.9 },
        { x: 780, y: 1480, speed: 1.3 },
      ].map((diya, i) => {
        const curX = diya.x + Math.sin(f * 0.05 + i) * 15;
        const curY = diya.y + Math.cos(f * 0.04 + i) * 6;
        return (
          <g key={i} transform={`translate(${curX}, ${curY})`}>
            {/* Water leaf boat */}
            <path d="M-22,0 Q0,14 22,0 Q0,4 -22,0 Z" fill="#2d5016" stroke={CREAM} strokeWidth="2" />
            {/* Golden glowing flame */}
            <circle cx="0" cy="-6" r={8 + diyaFlicker} fill={palette.sunMoonGlow} opacity={0.6} />
            <path d="M-5,-4 Q0,-22 5,-4 Q0,-2 -5,-4 Z" fill="#f59e0b" stroke="#ef4444" strokeWidth="1.5" />
          </g>
        );
      })}
    </g>
  );
};

// -------------------------------------------------------------------
// 4. MOUNTAINS + TEMPLE (Peaks, shikhar mandir, waving dhwaja)
// -------------------------------------------------------------------
const MountainsTempleBackground: React.FC<{
  variant: number;
  palette: TimeOfDayPalette;
  frame: number;
}> = ({ variant, palette, frame }) => {
  const f = stopMotionTwos(frame, true);
  const flagWave = Math.sin(f * 0.22) * 8;

  return (
    <g>
      {/* Distant Mountain Peaks */}
      <polygon points="-80,1450 180,720 440,1450" fill={palette.sand} stroke={CREAM} strokeWidth="5" />
      <polygon points="620,1450 880,700 1160,1450" fill={palette.sand} stroke={CREAM} strokeWidth="5" />

      {/* Main Midground Peaks */}
      <polygon points="220,1450 540,630 860,1450" fill={palette.terracottaLight} stroke={CREAM} strokeWidth="6" />
      <line x1="540" y1="630" x2="520" y2="1450" stroke={CREAM} strokeWidth="4" strokeDasharray="14 10" opacity={0.8} />

      {/* Classical Paper Mandir */}
      <g transform="translate(0, 50)">
        {/* Base Steps */}
        <rect x="220" y="1270" width="640" height="45" rx="4" fill={palette.terracottaDark} stroke={CREAM} strokeWidth="5" />
        <rect x="260" y="1225" width="560" height="45" rx="4" fill={palette.terracotta} stroke={CREAM} strokeWidth="5" />
        {/* Sanctum Gate */}
        <path d="M440,1225 L440,1010 Q540,920 640,1010 L640,1225 Z" fill="#201512" stroke={CREAM} strokeWidth="5" />
        <circle cx="540" cy="1110" r="28" fill="#fde047" stroke="#c89b3c" strokeWidth="4" />
        {/* Pillars */}
        <rect x="310" y="850" width="70" height="375" rx="4" fill={palette.terracotta} stroke={CREAM} strokeWidth="5" />
        <rect x="700" y="850" width="70" height="375" rx="4" fill={palette.terracotta} stroke={CREAM} strokeWidth="5" />
        {/* Lintel Beam */}
        <rect x="270" y="810" width="540" height="55" rx="4" fill={palette.terracottaLight} stroke={CREAM} strokeWidth="5" />
        {/* Semicircular Dome */}
        <path d="M290,810 Q540,540 790,810 Z" fill={palette.terracotta} stroke={CREAM} strokeWidth="5.5" />

        {/* Kalash & Dhwaja Flag */}
        <g transform="translate(540, 550)">
          <rect x="-14" y="0" width="28" height="55" rx="3" fill="#d4af37" stroke={CREAM} strokeWidth="3" />
          <line x1="0" y1="0" x2="0" y2="-80" stroke={INK} strokeWidth="4" />
          <path
            d={`M0,-80 Q35,${-65 + flagWave} 75,-80 L55,-50 Q25,${-58 + flagWave} 0,-52 Z`}
            fill="#d8452e"
            stroke="#9c2c1b"
            strokeWidth="3"
          />
        </g>
      </g>
    </g>
  );
};

// -------------------------------------------------------------------
// 5. PALACE COURTYARD (Pillars, jharokha arches, paver stones)
// -------------------------------------------------------------------
const PalaceCourtyardBackground: React.FC<{
  variant: number;
  palette: TimeOfDayPalette;
  frame: number;
}> = ({ variant, palette, frame }) => {
  return (
    <g>
      {/* Distant palace walls & jharokhas */}
      <rect x="0" y="600" width="1080" height="600" fill={palette.sand} stroke={CREAM} strokeWidth="4" />

      {/* Royal Archways */}
      {[-40, 280, 600, 920].map((archX, i) => (
        <g key={i} transform={`translate(${archX}, 720)`}>
          <path
            d="M0,480 L0,200 Q40,160 80,190 Q120,130 140,70 Q160,130 200,190 Q240,160 280,200 L280,480 Z"
            fill={palette.terracottaLight}
            stroke={CREAM}
            strokeWidth="5"
          />
          {/* Inner royal chamber dark cutout */}
          <path
            d="M30,480 L30,220 Q70,180 140,120 Q210,180 250,220 L250,480 Z"
            fill="#1f1815"
            stroke={CREAM}
            strokeWidth="3"
          />
        </g>
      ))}

      {/* Grand Foreground Carved Pillars */}
      {/* Left Pillar */}
      <g transform="translate(60, 480)">
        <rect x="0" y="0" width="110" height="1100" fill={palette.terracotta} stroke={CREAM} strokeWidth="6" />
        <rect x="-15" y="0" width="140" height="40" rx="3" fill="#d4af37" stroke={CREAM} strokeWidth="3" />
        <rect x="-15" y="1060" width="140" height="40" rx="3" fill="#d4af37" stroke={CREAM} strokeWidth="3" />
      </g>

      {/* Right Pillar */}
      <g transform="translate(910, 480)">
        <rect x="0" y="0" width="110" height="1100" fill={palette.terracotta} stroke={CREAM} strokeWidth="6" />
        <rect x="-15" y="0" width="140" height="40" rx="3" fill="#d4af37" stroke={CREAM} strokeWidth="3" />
        <rect x="-15" y="1060" width="140" height="40" rx="3" fill="#d4af37" stroke={CREAM} strokeWidth="3" />
      </g>

      {/* Courtyard Flagstone Pavers */}
      <rect x="-20" y="1450" width="1120" height="500" fill={palette.terracottaDark} stroke={CREAM} strokeWidth="5" />
      {Array.from({ length: 6 }).map((_, r) => (
        <line
          key={r}
          x1="-20"
          y1={1450 + r * 75}
          x2="1100"
          y2={1450 + r * 75}
          stroke={CREAM}
          strokeWidth="3"
          strokeDasharray="40 18"
          opacity={0.7}
        />
      ))}
    </g>
  );
};

// -------------------------------------------------------------------
// 6. DESERT (Undulating sand dunes, date palms, heat shimmer)
// -------------------------------------------------------------------
const DesertBackground: React.FC<{
  variant: number;
  palette: TimeOfDayPalette;
  frame: number;
}> = ({ variant, palette, frame }) => {
  const f = stopMotionTwos(frame, true);
  const heatShimmer = Math.sin(f * 0.15) * 4;

  return (
    <g>
      {/* Sun/Moon heat aura */}
      <ellipse
        cx="540"
        cy="750"
        rx={380 + heatShimmer}
        ry={180 + heatShimmer}
        fill={palette.sunMoonGlow}
        opacity={0.35}
      />

      {/* Layer 1: Distant Dune Ridge */}
      <path
        d="M-40,1180 Q220,1060 520,1140 Q840,1220 1140,1100 L1140,1920 L-40,1920 Z"
        fill="#e6a756"
        stroke={CREAM}
        strokeWidth="4"
      />

      {/* Layer 2: Midground Rolling Dunes */}
      <path
        d="M-40,1320 Q320,1200 680,1310 Q980,1400 1140,1260 L1140,1920 L-40,1920 Z"
        fill="#d99136"
        stroke={CREAM}
        strokeWidth="4.5"
      />

      {/* Layer 3: Foreground Dune */}
      <path
        d="M-40,1500 Q400,1380 750,1520 Q1000,1620 1140,1480 L1140,1920 L-40,1920 Z"
        fill="#c27822"
        stroke={CREAM}
        strokeWidth="5"
      />

      {/* Silhouette of Camel Caravan or Date Palm */}
      <g transform="translate(760, 1150) scale(0.9)">
        <path d="M0,200 Q20,120 40,0 Q60,120 80,200 Z" fill="#4d2f16" stroke={CREAM} strokeWidth="3" />
        <circle cx="40" cy="0" r="55" fill="#385e26" stroke={CREAM} strokeWidth="3" />
        <circle cx="90" cy="-20" r="45" fill="#385e26" stroke={CREAM} strokeWidth="3" />
        <circle cx="-10" cy="-20" r="45" fill="#385e26" stroke={CREAM} strokeWidth="3" />
      </g>
    </g>
  );
};

// -------------------------------------------------------------------
// 7. OCEAN + BOAT (Rolling paper waves, spray, horizon boat)
// -------------------------------------------------------------------
const OceanBoatBackground: React.FC<{
  variant: number;
  palette: TimeOfDayPalette;
  frame: number;
}> = ({ variant, palette, frame }) => {
  const f = stopMotionTwos(frame, true);
  const wave1 = Math.sin(f * 0.12) * 20;
  const wave2 = Math.cos(f * 0.14) * 25;
  const boatPitch = Math.sin(f * 0.1) * 8;

  return (
    <g>
      {/* Distant Horizon */}
      <rect x="-20" y="1120" width="1120" height="820" fill={palette.water} />

      {/* Far Waves */}
      <path
        d={`M-40,${1200 + wave1} Q250,${1160 - wave1} 540,${1200 + wave1} Q830,${1240 - wave1} 1120,${1200 + wave1} L1120,1920 L-40,1920 Z`}
        fill="#1e4e79"
        stroke={CREAM}
        strokeWidth="4"
      />

      {/* Bobbing Sailboat */}
      <g transform={`translate(540, ${1190 + wave1}) rotate(${boatPitch})`}>
        {/* Hull */}
        <polygon points="-60,15 60,15 45,45 -45,45" fill="#5c381e" stroke={CREAM} strokeWidth="3" />
        {/* Mast */}
        <line x1="0" y1="15" x2="0" y2="-90" stroke={CREAM} strokeWidth="3.5" />
        {/* Paper Sail */}
        <polygon points="5,-85 65,-15 5,-15" fill={CREAM} stroke={INK} strokeWidth="2.5" />
      </g>

      {/* Mid Waves */}
      <path
        d={`M-40,${1360 - wave2} Q280,${1420 + wave2} 600,${1350 - wave2} Q920,${1300 + wave2} 1120,${1370 - wave2} L1120,1920 L-40,1920 Z`}
        fill="#25659e"
        stroke={CREAM}
        strokeWidth="5"
      />

      {/* Foreground Cresting Waves */}
      <path
        d={`M-40,${1560 + wave1} Q300,${1500 - wave1} 620,${1580 + wave1} Q940,${1650 - wave1} 1120,${1550 + wave1} L1120,1920 L-40,1920 Z`}
        fill="#2f78b8"
        stroke={CREAM}
        strokeWidth="6"
      />
    </g>
  );
};

// -------------------------------------------------------------------
// 8. NIGHT SKY (Twinkling stars, paper moon, drifting clouds)
// -------------------------------------------------------------------
const NightSkyBackground: React.FC<{
  variant: number;
  palette: TimeOfDayPalette;
  frame: number;
}> = ({ variant, palette, frame }) => {
  const f = stopMotionTwos(frame, true);
  const cloudDrift = (f * 0.8) % 1200;

  return (
    <g>
      {/* Star Field */}
      {Array.from({ length: 24 }).map((_, idx) => {
        const starX = (idx * 47) % 1080;
        const starY = (idx * 39 + 120) % 950;
        const twinkle = Math.sin(f * 0.2 + idx) * 0.5 + 0.5;
        return (
          <circle
            key={idx}
            cx={starX}
            cy={starY}
            r={2 + twinkle * 2.5}
            fill={CREAM}
            opacity={0.4 + twinkle * 0.6}
          />
        );
      })}

      {/* Crescent Paper Moon */}
      <g transform="translate(760, 420)">
        <circle cx="0" cy="0" r="95" fill={CREAM} stroke={palette.sunMoonGlow} strokeWidth="8" />
        {/* Moon shadow cut creating crescent */}
        <circle cx="38" cy="-15" r="82" fill={palette.skyMid} />
      </g>

      {/* Drifting Translucent Paper Clouds */}
      <g transform={`translate(${cloudDrift - 200}, 560)`} opacity={0.65}>
        <path
          d="M0,0 Q60,-40 120,0 Q180,-50 240,0 Q300,-30 350,15 L-20,15 Z"
          fill={CREAM}
          stroke={INK}
          strokeWidth="2.5"
        />
      </g>

      {/* Silhouette of Mountains / Horizon below */}
      <polygon points="-50,1650 320,1350 720,1620 1150,1390 1150,1920 -50,1920" fill="#0d1117" stroke={CREAM} strokeWidth="4" />
    </g>
  );
};

// -------------------------------------------------------------------
// 9. CAVE (Stalactites, rock arch, flickering torches)
// -------------------------------------------------------------------
const CaveBackground: React.FC<{
  variant: number;
  palette: TimeOfDayPalette;
  frame: number;
}> = ({ variant, palette, frame }) => {
  const f = stopMotionTwos(frame, true);
  const torchFlicker = Math.sin(f * 0.3) * 6;

  return (
    <g>
      {/* Warm Ambient Torch Glow in Cave Center */}
      <circle cx="540" cy="1150" r={320 + torchFlicker * 3} fill="#f59e0b" opacity={0.25} />

      {/* Cavern Roof Stalactites */}
      <path
        d="M-40,0 L1120,0 L1120,380 L1020,180 L920,440 L840,220 L740,480 L620,190 L500,420 L400,210 L300,460 L180,180 L80,410 L-40,240 Z"
        fill="#261b17"
        stroke={CREAM}
        strokeWidth="5"
      />

      {/* Cavern Floor Stalagmites & Rock Formations */}
      <path
        d="M-40,1920 L1120,1920 L1120,1450 L1000,1620 L880,1380 L760,1660 L620,1410 L480,1680 L360,1390 L220,1650 L100,1400 L-40,1600 Z"
        fill="#261b17"
        stroke={CREAM}
        strokeWidth="5"
      />

      {/* Wall Torches with Flickering Fire */}
      {/* Left Torch */}
      <g transform="translate(180, 1100)">
        <rect x="-6" y="0" width="12" height="65" fill="#4a301e" stroke={CREAM} strokeWidth="2.5" />
        <circle cx="0" cy="-12" r={22 + torchFlicker} fill="#f59e0b" opacity={0.5} />
        <polygon points="-12,0 12,0 0,-36" fill="#ef4444" stroke={CREAM} strokeWidth="2.5" />
        <polygon points="-6,-5 6,-5 0,-26" fill="#fde047" />
      </g>

      {/* Right Torch */}
      <g transform="translate(900, 1100)">
        <rect x="-6" y="0" width="12" height="65" fill="#4a301e" stroke={CREAM} strokeWidth="2.5" />
        <circle cx="0" cy="-12" r={22 + torchFlicker} fill="#f59e0b" opacity={0.5} />
        <polygon points="-12,0 12,0 0,-36" fill="#ef4444" stroke={CREAM} strokeWidth="2.5" />
        <polygon points="-6,-5 6,-5 0,-26" fill="#fde047" />
      </g>
    </g>
  );
};

// -------------------------------------------------------------------
// 10. BATTLEFIELD (Cracked earth, war flags, broken shields/spears, smoke)
// -------------------------------------------------------------------
const BattlefieldBackground: React.FC<{
  variant: number;
  palette: TimeOfDayPalette;
  frame: number;
}> = ({ variant, palette, frame }) => {
  const f = stopMotionTwos(frame, true);
  const smokeSway = Math.sin(f * 0.1) * 15;
  const flagWave = Math.sin(f * 0.28) * 12;

  return (
    <g>
      {/* Billowing Battlefield Smoke & Ember Plumes */}
      <g opacity={0.45}>
        <path
          d={`M180,1400 Q${220 + smokeSway},1050 ${160 - smokeSway},750 Q${240 + smokeSway},450 180,200`}
          fill="none"
          stroke="#4a3a30"
          strokeWidth="50"
          strokeLinecap="round"
        />
        <path
          d={`M840,1400 Q${800 - smokeSway},1080 ${860 + smokeSway},780 Q${810 - smokeSway},480 850,200`}
          fill="none"
          stroke="#4a3a30"
          strokeWidth="45"
          strokeLinecap="round"
        />
      </g>

      {/* Rugged Mountain Pass / Ridge */}
      <polygon points="-50,1320 280,950 640,1280 1150,910 1150,1920 -50,1920" fill="#442a1e" stroke={CREAM} strokeWidth="5" />

      {/* Broken War Wagons & Shields */}
      {/* Wagon Wheel Half-Buried */}
      <g transform="translate(240, 1420) rotate(-22)">
        <circle cx="0" cy="0" r="65" fill="none" stroke="#684226" strokeWidth="12" />
        <circle cx="0" cy="0" r="65" fill="none" stroke={CREAM} strokeWidth="3" />
        <line x1="-65" y1="0" x2="65" y2="0" stroke="#684226" strokeWidth="8" />
        <line x1="0" y1="-65" x2="0" y2="65" stroke="#684226" strokeWidth="8" />
      </g>

      {/* Maratha Saffron & Crimson War Banners Sticking in Ground */}
      <g transform="translate(760, 1260) rotate(14)">
        <line x1="0" y1="0" x2="0" y2="-280" stroke="#221814" strokeWidth="6" strokeLinecap="round" />
        {/* Double Triangular Bhagwa Dhwaja / War Banner */}
        <polygon
          points={`0,-280 ${95 + flagWave},-230 0,-180 ${95 + flagWave},-130 0,-80`}
          fill="#d8452e"
          stroke={CREAM}
          strokeWidth="3.5"
        />
      </g>

      {/* Fallen Spear */}
      <g transform="translate(420, 1500) rotate(58)">
        <line x1="-120" y1="0" x2="120" y2="0" stroke="#4a301e" strokeWidth="6" />
        <polygon points="120,-12 165,0 120,12" fill="#cbd5e1" stroke={CREAM} strokeWidth="2.5" />
      </g>

      {/* Cracked Earth Foreground */}
      <rect x="-20" y="1520" width="1120" height="420" fill="#2b1a13" stroke={CREAM} strokeWidth="5" />
      <path d="M120,1520 L180,1640 L150,1740 L220,1880" fill="none" stroke={CREAM} strokeWidth="3" opacity={0.6} />
      <path d="M820,1520 L780,1650 L840,1780 L800,1920" fill="none" stroke={CREAM} strokeWidth="3" opacity={0.6} />
    </g>
  );
};

// -------------------------------------------------------------------
// Background Dispatcher Component
// -------------------------------------------------------------------
export const PaperBackground: React.FC<BackgroundProps> = ({
  type,
  variant = 0,
  timeOfDay = "day",
  frame,
  seed = 42,
  width = 1080,
  height = 1920,
}) => {
  const palette = getPalette(timeOfDay);
  const gradId = `bg-sky-${timeOfDay}-${type}`;

  return (
    <svg
      viewBox="0 0 1080 1920"
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <defs>
        {/* Sky Gradient */}
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.skyTop} />
          <stop offset="55%" stopColor={palette.skyMid} />
          <stop offset="100%" stopColor={palette.skyBottom} />
        </linearGradient>
      </defs>

      {/* Base Sky Layer */}
      <rect x="0" y="0" width="1080" height="1920" fill={`url(#${gradId})`} />

      {/* Sun / Moon Celestial Body with Concentric Paper Glow Rings */}
      {type !== "cave" && (
        <g transform="translate(540, 520)">
          <circle cx="0" cy="0" r="320" fill={palette.sunMoonGlow} opacity={0.15} />
          <circle cx="0" cy="0" r="240" fill={palette.sunMoonGlow} opacity={0.25} />
          <circle cx="0" cy="0" r="160" fill={palette.sunMoonGlow} opacity={0.4} />
          <circle cx="0" cy="0" r="95" fill={palette.sunMoonColor} stroke={CREAM} strokeWidth="5" />
        </g>
      )}

      {/* Layered Animated Depth Scene Elements */}
      {type === "village" && <VillageBackground variant={variant} palette={palette} frame={frame} seed={seed} />}
      {type === "forest" && <ForestBackground variant={variant} palette={palette} frame={frame} />}
      {type === "river_ghat" && <RiverGhatBackground variant={variant} palette={palette} frame={frame} />}
      {type === "mountains_temple" && <MountainsTempleBackground variant={variant} palette={palette} frame={frame} />}
      {type === "palace_courtyard" && <PalaceCourtyardBackground variant={variant} palette={palette} frame={frame} />}
      {type === "desert" && <DesertBackground variant={variant} palette={palette} frame={frame} />}
      {type === "ocean_boat" && <OceanBoatBackground variant={variant} palette={palette} frame={frame} />}
      {type === "night_sky" && <NightSkyBackground variant={variant} palette={palette} frame={frame} />}
      {type === "cave" && <CaveBackground variant={variant} palette={palette} frame={frame} />}
      {type === "battlefield" && <BattlefieldBackground variant={variant} palette={palette} frame={frame} />}
    </svg>
  );
};
