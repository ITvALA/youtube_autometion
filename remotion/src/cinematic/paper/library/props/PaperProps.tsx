import React from "react";
import { PropType, TimeOfDayPalette } from "../types";
import { getPalette } from "../palettes";

const CREAM = "#fbf5e6";
const INK = "#1d1b1a";
const GOLD = "#c89b3c";

/* ------------------------------------------------------------- 1. HUT */
export const PropHut: React.FC<{ seed?: number; palette?: TimeOfDayPalette; lf?: number }> = ({
  seed = 1,
  palette = getPalette("day"),
}) => {
  const s = seed % 3;
  const wallCol = s === 0 ? palette.sand : s === 1 ? palette.terracottaLight : palette.terracotta;
  const roofCol = s === 0 ? "#b88a44" : s === 1 ? "#9c6a32" : "#c99a52";

  return (
    <svg width="220" height="180" viewBox="0 0 220 180" style={{ overflow: "visible" }}>
      {/* Shadow */}
      <g transform={`translate(${palette.shadowOffsetX * 0.7}, ${palette.shadowOffsetY * 0.7})`} fill={palette.shadowColor} opacity={palette.shadowOpacity}>
        <rect x="25" y="80" width="170" height="90" rx="3" />
        <polygon points="10,85 110,15 210,85" />
      </g>
      {/* Mud Wall */}
      <rect x="25" y="80" width="170" height="90" rx="3" fill={wallCol} stroke={CREAM} strokeWidth={3.5} />
      {/* Wooden Beam / Post Door */}
      <rect x="85" y="105" width="50" height="65" rx="3" fill="#3a2518" stroke={CREAM} strokeWidth={2.5} />
      <circle cx="125" cy="138" r="3.5" fill={GOLD} />
      {/* Small Window */}
      <rect x="42" y="102" width="26" height="26" rx="2" fill="#2d1c12" stroke={CREAM} strokeWidth={2} />
      <line x1="55" y1="102" x2="55" y2="128" stroke={CREAM} strokeWidth={2} />
      {/* Thatched Straw Roof */}
      <polygon points="10,85 110,15 210,85" fill={roofCol} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
      <polygon points="25,85 110,25 195,85" fill={roofCol} opacity={0.6} />
      {/* Ridge lines */}
      <line x1="110" y1="15" x2="110" y2="85" stroke={CREAM} strokeWidth={2.5} />
    </svg>
  );
};

/* ------------------------------------------------------------- 2. TREES */
export const PropTree: React.FC<{ type: "tree_banyan" | "tree_pine" | "tree_palm"; seed?: number; palette?: TimeOfDayPalette; lf?: number }> = ({
  type,
  seed = 1,
  palette = getPalette("day"),
  lf = 0,
}) => {
  const sway = Math.sin((lf + seed * 10) * 0.08) * 3;

  if (type === "tree_pine") {
    return (
      <svg width="180" height="320" viewBox="0 0 180 320" style={{ overflow: "visible" }}>
        <g transform={`translate(${palette.shadowOffsetX * 0.6}, ${palette.shadowOffsetY * 0.6})`} fill={palette.shadowColor} opacity={palette.shadowOpacity}>
          <rect x="80" y="220" width="20" height="90" rx="2" />
          <polygon points="90,40 160,130 20,130" />
          <polygon points="90,100 170,190 10,190" />
          <polygon points="90,160 180,250 0,250" />
        </g>
        {/* Trunk */}
        <rect x="80" y="220" width="20" height="90" rx="2" fill="#4a3020" stroke={CREAM} strokeWidth={3} />
        {/* Pine Foliage Layers */}
        <polygon points="90,160 180,250 0,250" fill={palette.foliageDark} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
        <polygon points="90,100 170,190 10,190" fill={palette.foliage} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
        <polygon points="90,40 160,130 20,130" fill={palette.foliage} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "tree_palm") {
    return (
      <svg width="220" height="340" viewBox="0 0 220 340" style={{ overflow: "visible" }}>
        {/* Curved Trunk */}
        <path d="M100,320 Q120,200 90,80" fill="none" stroke="#5c3a22" strokeWidth={18} strokeLinecap="round" />
        <path d="M100,320 Q120,200 90,80" fill="none" stroke={CREAM} strokeWidth={24} strokeLinecap="round" style={{ opacity: 0.3 }} />
        {/* Palm Fronds */}
        <g transform={`translate(90, 80) rotate(${sway})`}>
          {[-70, -35, 0, 35, 70].map((deg, i) => (
            <path
              key={i}
              d={`M0,0 Q${deg * 1.4},-50 ${deg * 1.8},10 Q${deg},-10 0,0 Z`}
              fill={i % 2 === 0 ? palette.foliage : palette.foliageDark}
              stroke={CREAM}
              strokeWidth={3}
              strokeLinejoin="round"
            />
          ))}
          <circle cx="0" cy="0" r="10" fill="#3d2211" stroke={CREAM} strokeWidth={2} />
        </g>
      </svg>
    );
  }

  // Banyan (Default)
  return (
    <svg width="320" height="340" viewBox="0 0 320 340" style={{ overflow: "visible" }}>
      <g transform={`translate(${palette.shadowOffsetX * 0.7}, ${palette.shadowOffsetY * 0.7})`} fill={palette.shadowColor} opacity={palette.shadowOpacity}>
        <rect x="135" y="160" width="50" height="160" rx="6" />
        <ellipse cx="160" cy="120" rx="140" ry="90" />
      </g>
      {/* Massive Sacred Trunk */}
      <rect x="135" y="160" width="50" height="160" rx="6" fill="#4a2e1b" stroke={CREAM} strokeWidth={4} />
      {/* Hanging Roots (Jataen) */}
      <line x1="110" y1="140" x2="110" y2="280" stroke="#3d2414" strokeWidth={3} strokeLinecap="round" />
      <line x1="210" y1="140" x2="210" y2="290" stroke="#3d2414" strokeWidth={3} strokeLinecap="round" />
      {/* Spreading Foliage Puffs */}
      <g transform={`rotate(${sway} 160 120)`}>
        <ellipse cx="160" cy="120" rx="140" ry="90" fill={palette.foliageDark} stroke={CREAM} strokeWidth={4.5} />
        <circle cx="95" cy="100" r="60" fill={palette.foliage} stroke={CREAM} strokeWidth={4} />
        <circle cx="225" cy="100" r="60" fill={palette.foliage} stroke={CREAM} strokeWidth={4} />
        <circle cx="160" cy="70" r="65" fill={palette.foliage} stroke={CREAM} strokeWidth={4} />
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------- 3. COW (GAUMATA) */
export const PropCow: React.FC<{ seed?: number; palette?: TimeOfDayPalette; lf?: number }> = ({
  palette = getPalette("day"),
  lf = 0,
}) => {
  const tail = Math.sin(lf * 0.25) * 8;
  const chew = Math.abs(Math.sin(lf * 0.18)) * 3;

  return (
    <svg width="220" height="160" viewBox="0 0 220 160" style={{ overflow: "visible" }}>
      <g transform={`translate(${palette.shadowOffsetX * 0.5}, ${palette.shadowOffsetY * 0.5})`} fill={palette.shadowColor} opacity={palette.shadowOpacity}>
        <ellipse cx="100" cy="90" rx="60" ry="36" />
        <circle cx="170" cy="70" r="24" />
      </g>
      {/* Tail with swish */}
      <path d={`M40,75 Q25,100 ${22 + tail},125`} fill="none" stroke="#2a1f18" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={22 + tail} cy="128" r="4.5" fill="#2a1f18" />
      {/* Legs */}
      <rect x="60" y="105" width="12" height="45" rx="3" fill={CREAM} stroke={INK} strokeWidth={2.5} />
      <rect x="80" y="105" width="12" height="45" rx="3" fill={CREAM} stroke={INK} strokeWidth={2.5} />
      <rect x="130" y="105" width="12" height="45" rx="3" fill={CREAM} stroke={INK} strokeWidth={2.5} />
      <rect x="150" y="105" width="12" height="45" rx="3" fill={CREAM} stroke={INK} strokeWidth={2.5} />
      {/* Torso & Sacred Hump (Kakud) */}
      <ellipse cx="100" cy="90" rx="60" ry="36" fill={CREAM} stroke={INK} strokeWidth={3.5} />
      <ellipse cx="140" cy="62" rx="16" ry="14" fill={CREAM} stroke={INK} strokeWidth={3} />
      {/* Neck & Head */}
      <circle cx="170" cy={68 + chew} r="24" fill={CREAM} stroke={INK} strokeWidth={3.5} />
      <circle cx="176" cy={65 + chew} r="3" fill={INK} />
      {/* Curved Horns */}
      <path d="M165,50 Q160,32 152,36" fill="none" stroke="#33251c" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M175,50 Q178,32 186,36" fill="none" stroke="#33251c" strokeWidth={3.5} strokeLinecap="round" />
      {/* Bell necklace */}
      <path d="M154,76 Q165,92 178,76" fill="none" stroke="#c2410c" strokeWidth={3} />
      <circle cx="166" cy="88" r="4" fill={GOLD} stroke={INK} strokeWidth={1.5} />
    </svg>
  );
};

/* ------------------------------------------------------------- 4. BOAT */
export const PropBoat: React.FC<{ palette?: TimeOfDayPalette; lf?: number }> = ({ palette = getPalette("day"), lf = 0 }) => {
  const rock = Math.sin(lf * 0.12) * 3;

  return (
    <svg width="240" height="140" viewBox="0 0 240 140" style={{ overflow: "visible" }}>
      <g transform={`rotate(${rock} 120 100)`}>
        {/* Hull */}
        <path d="M20,70 Q120,125 220,70 L195,105 Q120,135 45,105 Z" fill="#663e20" stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
        {/* Ribs */}
        <line x1="80" y1="80" x2="85" y2="114" stroke="#422511" strokeWidth={2.5} />
        <line x1="120" y1="84" x2="120" y2="120" stroke="#422511" strokeWidth={2.5} />
        <line x1="160" y1="80" x2="155" y2="114" stroke="#422511" strokeWidth={2.5} />
        {/* Mast & Small Triangular Sail */}
        <line x1="110" y1="84" x2="110" y2="15" stroke="#3d2412" strokeWidth={4} strokeLinecap="round" />
        <polygon points="112,20 185,55 112,65" fill={CREAM} stroke="#a89a82" strokeWidth={2.5} />
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------- 5. WELL (KUAN) */
export const PropWell: React.FC<{ palette?: TimeOfDayPalette }> = ({ palette = getPalette("day") }) => {
  return (
    <svg width="180" height="200" viewBox="0 0 180 200" style={{ overflow: "visible" }}>
      {/* Stone Base Ring */}
      <ellipse cx="90" cy="160" rx="65" ry="24" fill={palette.sand} stroke={CREAM} strokeWidth={4} />
      <ellipse cx="90" cy="154" rx="55" ry="18" fill="#201a14" stroke={CREAM} strokeWidth={3} />
      {/* Wooden Frame Posts */}
      <rect x="42" y="60" width="12" height="100" rx="2" fill="#52341d" stroke={CREAM} strokeWidth={2.5} />
      <rect x="126" y="60" width="12" height="100" rx="2" fill="#52341d" stroke={CREAM} strokeWidth={2.5} />
      <rect x="36" y="52" width="108" height="12" rx="2" fill="#694326" stroke={CREAM} strokeWidth={2.5} />
      {/* Pulley & Rope & Bucket */}
      <circle cx="90" cy="68" r="10" fill={GOLD} stroke={CREAM} strokeWidth={2} />
      <line x1="90" y1="78" x2="90" y2="120" stroke="#d6c7ab" strokeWidth={2} />
      <polygon points="82,120 98,120 95,140 85,140" fill={palette.terracotta} stroke={CREAM} strokeWidth={2} />
    </svg>
  );
};

/* ------------------------------------------------------------- 6. DIYA & FIRE */
export const PropDiya: React.FC<{ lf?: number }> = ({ lf = 0 }) => {
  const flicker = Math.sin(lf * 0.4) * 3;
  const pulse = 1 + Math.sin(lf * 0.3) * 0.08;

  return (
    <svg width="100" height="90" viewBox="0 0 100 90" style={{ overflow: "visible" }}>
      {/* Earthen Base */}
      <ellipse cx="50" cy="72" rx="36" ry="12" fill="#9c4524" stroke={CREAM} strokeWidth={3} />
      <path d="M14,72 Q50,90 86,72 Q80,56 50,56 Q20,56 14,72 Z" fill="#b3542f" stroke={CREAM} strokeWidth={3} />
      {/* Glowing Aura */}
      <circle cx="50" cy={36 + flicker} r="26" fill="rgba(255, 220, 80, 0.45)" style={{ transform: `scale(${pulse})`, transformOrigin: "50px 36px" }} />
      {/* Flame */}
      <path
        d={`M50,14 Q${60 + flicker},34 50,50 Q${40 + flicker},34 50,14 Z`}
        fill="#fde047"
        stroke="#ea580c"
        strokeWidth={2.5}
      />
      <circle cx="50" cy={38 + flicker} r="5" fill="#fff" />
    </svg>
  );
};

export const PropFire: React.FC<{ lf?: number }> = ({ lf = 0 }) => {
  const f1 = Math.sin(lf * 0.4) * 6;
  const f2 = Math.cos(lf * 0.35) * 8;

  return (
    <svg width="140" height="150" viewBox="0 0 140 150" style={{ overflow: "visible" }}>
      {/* Logs */}
      <polygon points="20,135 120,115 125,128 25,148" fill="#422512" stroke={CREAM} strokeWidth={2.5} />
      <polygon points="120,135 20,115 15,128 115,148" fill="#543018" stroke={CREAM} strokeWidth={2.5} />
      {/* Outer Fire */}
      <path
        d={`M70,18 Q${105 + f1},70 100,120 Q70,135 40,120 Q${35 + f2},70 70,18 Z`}
        fill="#ea580c"
        stroke={CREAM}
        strokeWidth={3}
      />
      {/* Inner Radiant Flame */}
      <path
        d={`M70,42 Q${88 + f2},80 85,115 Q70,125 55,115 Q${52 + f1},80 70,42 Z`}
        fill="#fde047"
        stroke="#f97316"
        strokeWidth={2}
      />
      <ellipse cx="70" cy="100" rx="10" ry="18" fill="#fff" />
    </svg>
  );
};

/* ------------------------------------------------------------- 7. BANNER & FLAG */
export const PropBanner: React.FC<{ seed?: number; lf?: number }> = ({ lf = 0 }) => {
  const wave = Math.sin(lf * 0.22) * 12;

  return (
    <svg width="120" height="240" viewBox="0 0 120 240" style={{ overflow: "visible" }}>
      {/* Staff */}
      <line x1="20" y1="230" x2="20" y2="20" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      <circle cx="20" cy="15" r="7" fill={GOLD} stroke={CREAM} strokeWidth={2} />
      {/* Fluttering Saffron Pennant */}
      <path
        d={`M20,25 Q65,${20 + wave} 110,35 L80,75 Q50,${60 + wave} 20,80 Z`}
        fill="#dc2626"
        stroke={CREAM}
        strokeWidth={3.5}
        strokeLinejoin="round"
      />
    </svg>
  );
};

/* ------------------------------------------------------------- 8. CLOUD & BIRD */
export const PropCloud: React.FC<{ lf?: number; speed?: number }> = ({ lf = 0, speed = 0.6 }) => {
  const drift = (lf * speed) % 1200;

  return (
    <svg width="220" height="110" viewBox="0 0 220 110" style={{ overflow: "visible", transform: `translateX(${drift}px)` }}>
      <g fill={CREAM} stroke="#e0d6c0" strokeWidth={3} opacity={0.88}>
        <circle cx="60" cy="70" r="35" />
        <circle cx="105" cy="50" r="45" />
        <circle cx="155" cy="65" r="38" />
        <rect x="40" y="65" width="135" height="35" rx="10" />
      </g>
    </svg>
  );
};

export const PropBird: React.FC<{ lf?: number }> = ({ lf = 0 }) => {
  const flap = Math.sin(lf * 0.35) * 12;

  return (
    <svg width="60" height="40" viewBox="0 0 60 40" style={{ overflow: "visible" }}>
      <path
        d={`M0,20 Q15,${8 + flap} 30,20 Q45,${8 + flap} 60,20 Q45,24 30,22 Q15,24 0,20 Z`}
        fill="#262320"
        stroke={CREAM}
        strokeWidth={2.5}
      />
    </svg>
  );
};

/* ------------------------------------------------------------- 9. TEMPLE BELL */
export const PropBell: React.FC<{ lf?: number }> = ({ lf = 0 }) => {
  const sway = Math.sin(lf * 0.16) * 8;

  return (
    <svg width="100" height="140" viewBox="0 0 100 140" style={{ overflow: "visible" }}>
      <g transform={`rotate(${sway} 50 10)`}>
        {/* Chain */}
        <line x1="50" y1="0" x2="50" y2="40" stroke="#78592a" strokeWidth={4} strokeDasharray="6 4" />
        {/* Bell Body */}
        <path d="M30,40 Q50,30 70,40 L82,100 Q50,112 18,100 Z" fill={GOLD} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
        <ellipse cx="50" cy="100" rx="32" ry="10" fill="#a17522" stroke={CREAM} strokeWidth={2.5} />
        {/* Clapper */}
        <circle cx="50" cy="115" r="7" fill="#523812" stroke={CREAM} strokeWidth={2} />
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------- 10. CHARIOT (RATH) */
export const PropChariot: React.FC<{ palette?: TimeOfDayPalette; lf?: number }> = ({ palette = getPalette("day"), lf = 0 }) => {
  const wheelRot = (lf * 6) % 360;

  return (
    <svg width="280" height="220" viewBox="0 0 280 220" style={{ overflow: "visible" }}>
      {/* Body / Carriage */}
      <path d="M40,130 L190,130 L180,60 Q120,40 60,70 Z" fill={palette.terracotta} stroke={CREAM} strokeWidth={4.5} strokeLinejoin="round" />
      <rect x="50" y="70" width="120" height="14" rx="3" fill={GOLD} stroke={CREAM} strokeWidth={2.5} />
      {/* Chariot Shaft / Pole */}
      <line x1="190" y1="130" x2="270" y2="130" stroke="#422a18" strokeWidth={5} />
      {/* Grand Spoked Wheel */}
      <g transform={`translate(115, 140) rotate(${wheelRot})`}>
        <circle cx="0" cy="0" r="45" fill={GOLD} stroke={CREAM} strokeWidth={4.5} />
        <circle cx="0" cy="0" r="35" fill="none" stroke="#694318" strokeWidth={3} />
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={i}
            x1="0"
            y1="0"
            x2={Math.cos((i * 45 * Math.PI) / 180) * 45}
            y2={Math.sin((i * 45 * Math.PI) / 180) * 45}
            stroke={CREAM}
            strokeWidth={3}
          />
        ))}
        <circle cx="0" cy="0" r="10" fill="#2d1b0d" stroke={CREAM} strokeWidth={2.5} />
      </g>
    </svg>
  );
};

/* ------------------------------------------------------------- 11. WEAPONS: BOW & MACE */
export const PropBow: React.FC = () => {
  return (
    <svg width="80" height="180" viewBox="0 0 80 180" style={{ overflow: "visible" }}>
      {/* Recurve Bow Body */}
      <path d="M30,10 Q65,45 50,90 Q65,135 30,170" fill="none" stroke={GOLD} strokeWidth={6} strokeLinecap="round" />
      <path d="M30,10 Q65,45 50,90 Q65,135 30,170" fill="none" stroke={CREAM} strokeWidth={2} strokeLinecap="round" />
      {/* Bowstring */}
      <line x1="30" y1="10" x2="30" y2="170" stroke={CREAM} strokeWidth={2.5} />
      {/* Arrow */}
      <line x1="15" y1="90" x2="70" y2="90" stroke="#33241b" strokeWidth={3} />
      <polygon points="70,90 60,84 60,96" fill={GOLD} stroke={CREAM} strokeWidth={1.5} />
    </svg>
  );
};

export const PropMace: React.FC = () => {
  return (
    <svg width="70" height="200" viewBox="0 0 70 200" style={{ overflow: "visible" }}>
      {/* Handle */}
      <rect x="31" y="55" width="8" height="135" rx="3" fill="#4a2e1b" stroke={CREAM} strokeWidth={2} />
      <circle cx="35" cy="192" r="7" fill={GOLD} stroke={CREAM} strokeWidth={2} />
      {/* Fluted Faceted Head */}
      <circle cx="35" cy="40" r="28" fill={GOLD} stroke={CREAM} strokeWidth={3.5} />
      <ellipse cx="35" cy="40" rx="14" ry="28" fill="#f5c242" stroke={CREAM} strokeWidth={2} />
      <circle cx="35" cy="12" r="6" fill={CREAM} stroke={GOLD} strokeWidth={2} />
    </svg>
  );
};

/* ------------------------------------------------------------- 12. CROWN & POT */
export const PropCrown: React.FC = () => {
  return (
    <svg width="100" height="70" viewBox="0 0 100 70" style={{ overflow: "visible" }}>
      <path d="M10,60 L90,60 L80,20 L60,35 L50,8 L40,35 L20,20 Z" fill={GOLD} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
      <circle cx="50" cy="28" r="6" fill="#dc2626" stroke={CREAM} strokeWidth={2} />
      <rect x="15" y="52" width="70" height="8" rx="2" fill="#dc2626" />
    </svg>
  );
};

export const PropPot: React.FC<{ palette?: TimeOfDayPalette }> = ({ palette = getPalette("day") }) => {
  return (
    <svg width="90" height="110" viewBox="0 0 90 110" style={{ overflow: "visible" }}>
      {/* Earthen Kalash / Matka */}
      <circle cx="45" cy="65" r="32" fill={palette.terracotta} stroke={CREAM} strokeWidth={3.5} />
      <rect x="30" y="26" width="30" height="12" rx="3" fill={GOLD} stroke={CREAM} strokeWidth={2.5} />
      <ellipse cx="45" cy="26" rx="18" ry="6" fill={palette.sand} stroke={CREAM} strokeWidth={2} />
      {/* Sacred Coconut on Top */}
      <circle cx="45" cy="16" r="12" fill="#523821" stroke={CREAM} strokeWidth={2} />
    </svg>
  );
};

/* ------------------------------------------------------------- DISPATCHER */
export interface PropComponentProps {
  type: PropType;
  x?: number;
  y?: number;
  scale?: number;
  flip?: boolean;
  seed?: number;
  palette?: TimeOfDayPalette;
  frame?: number;
  lf?: number;
}

export const PropComponent: React.FC<PropComponentProps> = ({
  type,
  x = 0,
  y = 0,
  scale = 1,
  flip = false,
  seed = 1,
  palette,
  frame = 0,
  lf = 0,
}) => {
  const pal = palette || getPalette("day");
  const currentLf = frame || lf || 0;
  const flipScale = flip ? -1 : 1;

  const renderInner = () => {
    switch (type) {
      case "hut": return <PropHut seed={seed} palette={pal} lf={currentLf} />;
      case "tree_banyan": return <PropTree type="tree_banyan" seed={seed} palette={pal} lf={currentLf} />;
      case "tree_pine": return <PropTree type="tree_pine" seed={seed} palette={pal} lf={currentLf} />;
      case "tree_palm": return <PropTree type="tree_palm" seed={seed} palette={pal} lf={currentLf} />;
      case "cow": return <PropCow seed={seed} palette={pal} lf={currentLf} />;
      case "boat": return <PropBoat palette={pal} lf={currentLf} />;
      case "well": return <PropWell palette={pal} />;
      case "diya": return <PropDiya lf={currentLf} />;
      case "fire": return <PropFire lf={currentLf} />;
      case "banner": return <PropBanner seed={seed} lf={currentLf} />;
      case "cloud": return <PropCloud lf={currentLf} />;
      case "bird": return <PropBird lf={currentLf} />;
      case "bell": return <PropBell lf={currentLf} />;
      case "chariot": return <PropChariot palette={pal} lf={currentLf} />;
      case "bow": return <PropBow />;
      case "mace": return <PropMace />;
      case "crown": return <PropCrown />;
      case "pot": return <PropPot palette={pal} />;
      default: return <PropHut seed={seed} palette={pal} lf={currentLf} />;
    }
  };

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale * flipScale}, ${scale})`}>
      {renderInner()}
    </g>
  );
};
