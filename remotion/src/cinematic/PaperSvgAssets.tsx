import React from "react";
import { interpolate } from "remotion";

/* 
 * MINDSPARK SANJHI & PAPER-CRAFT ASSETS
 * Designed to match MapItem.tsx EXACTLY:
 * 1. Palette: Cream (#fbf5e6), Kraft Parchment (#efe3c6, #e3d3ab, #dcc9a0), Deep Ink (#1d1b1a), Terracotta Red (#d8452e), Antique Gold (#d4aa48).
 * 2. Physical paper drop shadow layer offset behind every piece (fill="#7a6a4a", opacity=0.55).
 * 3. Thick cream paper cut border (stroke="#fbf5e6" strokeWidth={3.5} strokeLinejoin="round").
 * 4. Genuine handcrafted layered paper look (like traditional Sanjhi paper-cut art).
 */

const PALETTE = ["#efe3c6", "#e3d3ab", "#f6eed8", "#dcc9a0", "#ead9b3"];
const CREAM = "#fbf5e6";
const INK = "#1d1b1a";
const SHADOW = "#7a6a4a";
const RED = "#d8452e";
const RED_DARK = "#9c2c1b";
const GOLD = "#c89b3c";

/* ------------------------------------------------------------------ 1. PAPER TEMPLE CUTOUT */
export const PaperTempleCutout: React.FC<{ progress: number; width?: number; height?: number }> = ({ progress, width = 680, height = 540 }) => {
  const p = Math.max(0, Math.min(1, progress));
  const s = interpolate(p, [0, 1], [0.88, 1]);

  return (
    <div style={{ width, height, margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "flex-end", transform: `scale(${s})`, opacity: p }}>
      <svg width={width} height={height} viewBox="0 0 680 540" style={{ overflow: "visible" }}>
        {/* Layer 0: Physical Paper Shadow Layer (Exact Map Style offset) */}
        <g transform="translate(9, 12)" fill={SHADOW} opacity={0.52}>
          {/* Base Steps */}
          <path d="M50,520 L630,520 L610,485 L70,485 Z" />
          <path d="M90,485 L590,485 L570,450 L110,450 Z" />
          <path d="M130,450 L550,450 L530,415 L150,415 Z" />
          {/* Main Vimana Tiers */}
          <path d="M190,415 L490,415 L470,330 L210,330 Z" />
          <path d="M210,330 L470,330 L445,245 L235,245 Z" />
          <path d="M235,245 L445,245 L415,160 L265,160 Z" />
          <path d="M265,160 L415,160 L385,85 L295,85 Z" />
          {/* Amlaka & Kalash */}
          <ellipse cx={340} cy={72} rx={52} ry={18} />
          <path d="M326,70 Q320,38 340,30 Q360,38 354,70 Z" />
          <polygon points="340,5 334,30 346,30" />
          {/* Saffron Flag */}
          <path d="M340,-45 Q385,-32 430,-42 L405,-18 Q375,-28 340,-16 Z" />
        </g>

        {/* Layer 1: The Handcrafted Paper Cutout Pieces */}
        {/* Step 1 */}
        <path d="M50,520 L630,520 L610,485 L70,485 Z" fill={PALETTE[3]} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
        {/* Step 2 */}
        <path d="M90,485 L590,485 L570,450 L110,450 Z" fill={PALETTE[1]} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
        {/* Step 3 */}
        <path d="M130,450 L550,450 L530,415 L150,415 Z" fill={PALETTE[0]} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />

        {/* Pillars / Mandapa Cutouts */}
        {[-150, -75, 75, 150].map((px, i) => (
          <g key={i} transform={`translate(${340 + px}, 415)`}>
            <rect x={-14} y={-100} width={28} height={100} rx={3} fill={PALETTE[4]} stroke={CREAM} strokeWidth={3} />
            <rect x={-20} y={-108} width={40} height={12} rx={3} fill={GOLD} stroke={CREAM} strokeWidth={2.5} />
          </g>
        ))}

        {/* Inner Sanctum / Garbhagriha Arch */}
        <path d="M275,415 L275,340 Q340,300 405,340 L405,415 Z" fill="#352618" stroke={CREAM} strokeWidth={4} />
        {/* Sacred Golden Jyoti flame */}
        <ellipse cx={340} cy={375} rx={16} ry={24} fill="#ffeaa7" stroke={GOLD} strokeWidth={2.5} />

        {/* Layered Pyramidal Stone Shikhar (4 Tiers of Cut Paper) */}
        <path d="M190,415 L490,415 L470,330 L210,330 Z" fill={PALETTE[0]} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
        <path d="M210,330 L470,330 L445,245 L235,245 Z" fill={PALETTE[1]} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
        <path d="M235,245 L445,245 L415,160 L265,160 Z" fill={PALETTE[2]} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
        <path d="M265,160 L415,160 L385,85 L295,85 Z" fill={PALETTE[4]} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />

        {/* Flanking Urushringa Miniature Shikhars */}
        <path d="M165,340 Q195,260 225,340 Z" fill={PALETTE[3]} stroke={CREAM} strokeWidth={3} strokeLinejoin="round" />
        <path d="M455,340 Q485,260 515,340 Z" fill={PALETTE[3]} stroke={CREAM} strokeWidth={3} strokeLinejoin="round" />

        {/* Traditional Amlaka Stone Disk */}
        <ellipse cx={340} cy={72} rx={52} ry={18} fill={GOLD} stroke={CREAM} strokeWidth={3.5} />
        <ellipse cx={340} cy={66} rx={38} ry={12} fill="#ffdd66" stroke={CREAM} strokeWidth={2.5} />

        {/* Golden Kalash & Stupi */}
        <path d="M326,70 Q320,38 340,30 Q360,38 354,70 Z" fill={GOLD} stroke={CREAM} strokeWidth={3} />
        <circle cx={340} cy={22} r={9} fill={CREAM} stroke={GOLD} strokeWidth={2.5} />
        <polygon points="340,5 334,30 346,30" fill={GOLD} stroke={CREAM} strokeWidth={2} />

        {/* Fluttering Sacred Saffron Dhwaja */}
        <g transform="translate(340, 5)">
          <line x1={0} y1={0} x2={0} y2={-55} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
          <path d="M0,-55 Q45,-42 90,-52 L65,-28 Q35,-38 0,-26 Z" fill={RED} stroke={RED_DARK} strokeWidth={2.5} strokeLinejoin="round" />
          {/* Sacred Sun Symbol on flag */}
          <circle cx={30} cy={-40} r={6} fill={CREAM} />
        </g>
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ 2. PAPER ANCIENT NAGARI / FORT CUTOUT */
export const PaperCityCutout: React.FC<{ progress: number; width?: number; height?: number }> = ({ progress, width = 720, height = 480 }) => {
  const p = Math.max(0, Math.min(1, progress));
  return (
    <div style={{ width, height, margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "flex-end", opacity: p, transform: `translateY(${(1 - p) * 24}px)` }}>
      <svg width={width} height={height} viewBox="0 0 720 480" style={{ overflow: "visible" }}>
        {/* Layer 0: Shadow Layer */}
        <g transform="translate(8, 11)" fill={SHADOW} opacity={0.5}>
          <path d="M0,480 Q90,445 180,480 T360,480 T540,480 T720,480 L720,420 Q540,390 360,420 T0,420 Z" />
          <path d="M40,410 L680,410 L680,280 L40,280 Z" />
          {/* Watchtower shadows */}
          <rect x={70} y={130} width={90} height={160} />
          <rect x={560} y={130} width={90} height={160} />
          <rect x={280} y={90} width={160} height={190} />
        </g>

        {/* Ocean Waves below city in Muted Paper Teal/Slate */}
        <path d="M0,480 Q90,445 180,480 T360,480 T540,480 T720,480 L720,420 Q540,390 360,420 T0,420 Z" fill="#9dbfc4" stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
        <path d="M0,445 Q90,415 180,445 T360,445 T540,445 T720,445 L720,390 Q540,360 360,390 T0,390 Z" fill="#b9d6d8" stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />

        {/* Walled Ramparts / Fort Battlement (Paper Cutout) */}
        <path d="M40,400 L680,400 L680,280 L40,280 Z" fill={PALETTE[0]} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
        {/* Fort Kanguras / Crenellations */}
        {[0, 64, 128, 192, 256, 320, 384, 448, 512, 576].map((kx, i) => (
          <rect key={i} x={58 + kx} y={260} width={42} height={24} rx={3} fill={PALETTE[1]} stroke={CREAM} strokeWidth={3} />
        ))}

        {/* Central Torana Gateway */}
        <path d="M310,400 L310,310 Q360,265 410,310 L410,400 Z" fill="#443224" stroke={CREAM} strokeWidth={3.5} />

        {/* Flanking Palace Towers in Paper Layers */}
        <g transform="translate(115, 140)">
          <rect x={-45} y={0} width={90} height={140} fill={PALETTE[2]} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M-60,0 Q0,-75 60,0 Z" fill={RED} stroke={RED_DARK} strokeWidth={3} strokeLinejoin="round" />
          <circle cx={0} cy={-80} r={8} fill={GOLD} stroke={CREAM} strokeWidth={2} />
        </g>
        <g transform="translate(605, 140)">
          <rect x={-45} y={0} width={90} height={140} fill={PALETTE[2]} stroke={CREAM} strokeWidth={3.5} strokeLinejoin="round" />
          <path d="M-60,0 Q0,-75 60,0 Z" fill={RED} stroke={RED_DARK} strokeWidth={3} strokeLinejoin="round" />
          <circle cx={0} cy={-80} r={8} fill={GOLD} stroke={CREAM} strokeWidth={2} />
        </g>

        {/* Central Royal Golden Palace Dome */}
        <g transform="translate(360, 90)">
          <rect x={-75} y={40} width={150} height={150} fill={PALETTE[3]} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
          <path d="M-95,40 Q0,-80 95,40 Z" fill={GOLD} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
          <circle cx={0} cy={-85} r={14} fill={CREAM} stroke={GOLD} strokeWidth={3} />
          <polygon points="0,-115 -8,-85 8,-85" fill={GOLD} stroke={CREAM} strokeWidth={2} />
          <path d="M0,-115 L50,-100 L0,-88 Z" fill={RED} stroke={RED_DARK} strokeWidth={2} />
        </g>
      </svg>
    </div>
  );
};

/* ------------------------------------------------------------------ 3. PAPER CHAR DHAM SHRINES (Map Craft Style) */
export const PaperCharDhamCutout: React.FC<{ progress: number; width?: number; height?: number }> = ({ progress, width = 760, height = 480 }) => {
  const p = Math.max(0, Math.min(1, progress));
  const dhams = [
    { name: "बद्रीनाथ", dir: "उत्तर", accent: RED },
    { name: "द्वारका", dir: "पश्चिम", accent: "#1f8a87" },
    { name: "जगन्नाथ पुरी", dir: "पूर्व", accent: GOLD },
    { name: "रामेश्वरम", dir: "दक्षिण", accent: "#8a4f2a" },
  ];

  return (
    <div style={{ width, height, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px", opacity: p, transform: `scale(${interpolate(p, [0, 1], [0.92, 1])})` }}>
      {dhams.map((d, i) => {
        const itemP = Math.max(0, Math.min(1, (p - i * 0.16) / 0.36));
        return (
          <div
            key={i}
            style={{
              background: PALETTE[i % PALETTE.length],
              border: `3px solid ${CREAM}`,
              borderRadius: 14,
              padding: "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: 18,
              transform: `translateY(${(1 - itemP) * 36}px) scale(${itemP})`,
              opacity: itemP,
              boxShadow: "0 10px 18px rgba(50,30,15,0.22), inset 0 0 0 2px rgba(255,255,255,0.6)",
              position: "relative",
            }}
          >
            {/* Handcut paper shrine silhouette inside card */}
            <svg width={76} height={84} viewBox="0 0 76 84" style={{ flexShrink: 0 }}>
              <g transform="translate(4, 5)" fill={SHADOW} opacity={0.45}>
                <path d="M12,78 L64,78 L56,52 L20,52 Z" />
                <path d="M20,52 L56,52 L48,26 L28,26 Z" />
                <path d="M28,26 Q38,8 48,26 Z" />
              </g>
              <path d="M12,78 L64,78 L56,52 L20,52 Z" fill={PALETTE[2]} stroke={CREAM} strokeWidth={2.5} strokeLinejoin="round" />
              <path d="M20,52 L56,52 L48,26 L28,26 Z" fill={d.accent} stroke={CREAM} strokeWidth={2.5} strokeLinejoin="round" />
              <path d="M28,26 Q38,8 48,26 Z" fill={GOLD} stroke={CREAM} strokeWidth={2.5} strokeLinejoin="round" />
              <circle cx={38} cy={8} r={4.5} fill={CREAM} stroke={GOLD} strokeWidth={2} />
              <path d="M38,8 L52,2 L38,14 Z" fill={RED} />
            </svg>
            <div>
              <div style={{ fontFamily: "'PF Display','Mukta',serif", fontSize: 42, fontWeight: 700, color: INK, lineHeight: 1.1 }}>{d.name}</div>
              <div style={{ fontFamily: "'PF Bold','Mukta',sans-serif", fontSize: 24, color: d.accent, marginTop: 4, letterSpacing: 1 }}>{d.dir} धाम</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------ 4. PAPER DWARKADHISH / SANJHI ART CUTOUT */
export const PaperDwarkadhishCutout: React.FC<{ progress: number; width?: number; height?: number }> = ({ progress, width = 640, height = 540 }) => {
  const p = Math.max(0, Math.min(1, progress));
  const s = interpolate(p, [0, 1], [0.9, 1]);

  return (
    <div style={{ width, height, margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "center", transform: `scale(${s})`, opacity: p }}>
      <svg width={width} height={height} viewBox="0 0 640 540" style={{ overflow: "visible" }}>
        {/* Layer 0: Shadow Layer (Same offset as MapItem) */}
        <g transform="translate(10, 14)" fill={SHADOW} opacity={0.52}>
          <circle cx={320} cy={185} r={120} />
          <ellipse cx={320} cy={480} rx={160} ry={35} />
          <path d="M255,290 L385,290 L410,450 L230,450 Z" />
          <path d="M255,130 L385,130 L375,290 L265,290 Z" />
          <ellipse cx={320} cy={85} rx={45} ry={52} />
          <path d="M275,45 L365,45 L355,-35 L320,-60 L285,-35 Z" />
        </g>

        {/* Divine Golden Cutout Halo (Sanjhi Layered Paper Cut) */}
        <g transform="translate(320, 185)">
          <circle cx={0} cy={0} r={125} fill={PALETTE[0]} stroke={CREAM} strokeWidth={5} />
          <circle cx={0} cy={0} r={105} fill={GOLD} stroke={CREAM} strokeWidth={4} />
          {Array.from({ length: 16 }).map((_, i) => (
            <line key={i} x1={0} y1={0} x2={Math.cos((i * 22.5 * Math.PI) / 180) * 125} y2={Math.sin((i * 22.5 * Math.PI) / 180) * 125} stroke={CREAM} strokeWidth={3} strokeLinecap="round" />
          ))}
        </g>

        {/* Lord Dwarkadhish Figure in Authentic Paper Craft */}
        <g transform="translate(320, 250)">
          {/* Lotus Pedestal (Hand-cut Paper Petals) */}
          <ellipse cx={0} cy={230} rx={160} ry={34} fill={PALETTE[3]} stroke={CREAM} strokeWidth={4} />
          {[-120, -70, -20, 30, 80, 130].map((lx, i) => (
            <ellipse key={i} cx={lx} cy={225} rx={22} ry={13} fill={PALETTE[1]} stroke={CREAM} strokeWidth={2.5} />
          ))}

          {/* Pitambar (Radiant Paper Golden Yellow Dhoti with Paper Pleats) */}
          <path d="M-65,40 L65,40 L90,200 L-90,200 Z" fill={GOLD} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
          <path d="M-15,40 L15,40 L8,185 L0,200 L-8,185 Z" fill={PALETTE[0]} stroke={CREAM} strokeWidth={2.5} strokeLinejoin="round" />
          <rect x={-65} y={30} width={130} height={16} rx={5} fill={PALETTE[1]} stroke={CREAM} strokeWidth={2.5} />

          {/* Torso in Muted Sanjhi Blue/Teal Paper */}
          <path d="M-65,-120 L65,-120 L55,40 L-55,40 Z" fill="#2d6a78" stroke={CREAM} strokeWidth={4.5} strokeLinejoin="round" />
          {/* Sacred White Janeu Thread */}
          <line x1={-45} y1={-120} x2={35} y2={40} stroke={CREAM} strokeWidth={3.5} />

          {/* Royal Kanthi Mala & Garland */}
          <path d="M-45,-110 Q0,0 45,-110" fill="none" stroke={CREAM} strokeWidth={5} />
          {[-30, -15, 0, 15, 30].map((mx, i) => (
            <circle key={i} cx={mx} cy={40 + (1 - Math.abs(mx) / 40) * 45} r={6} fill={i % 2 ? RED : GOLD} stroke={CREAM} strokeWidth={2} />
          ))}

          {/* Arms holding the Divine Paper Bansuri (Flute) */}
          <g transform="translate(0, -60)">
            <rect x={-140} y={-8} width={280} height={16} rx={6} fill={GOLD} stroke={CREAM} strokeWidth={3} transform="rotate(-16)" />
            {/* Hands holding flute */}
            <circle cx={-30} cy={10} r={16} fill="#2d6a78" stroke={CREAM} strokeWidth={3} />
            <circle cx={35} cy={-10} r={16} fill="#2d6a78" stroke={CREAM} strokeWidth={3} />
          </g>

          {/* Divine Face & Tilak */}
          <g transform="translate(0, -170)">
            <ellipse cx={0} cy={0} rx={44} ry={52} fill="#2d6a78" stroke={CREAM} strokeWidth={4} />
            {/* Sacred Urdhva Pundra Tilak */}
            <path d="M-8,-25 L-8,8 Q0,16 8,8 L8,-25" fill="none" stroke={CREAM} strokeWidth={3} />
            <line x1={0} y1={-20} x2={0} y2={10} stroke={RED} strokeWidth={3} />
            {/* Serene Smiling Eyes */}
            <path d="M-28,-2 Q-18,-8 -8,-2" fill="none" stroke={CREAM} strokeWidth={3} />
            <path d="M8,-2 Q18,-8 28,-2" fill="none" stroke={CREAM} strokeWidth={3} />

            {/* Handcrafted Golden Paper Mukut (Crown) */}
            <path d="M-45,-40 L45,-40 L35,-120 L0,-145 L-35,-120 Z" fill={GOLD} stroke={CREAM} strokeWidth={4} strokeLinejoin="round" />
            <circle cx={0} cy={-85} r={12} fill={RED} stroke={CREAM} strokeWidth={2.5} />

            {/* Peacock Feather (मोरपंख - Handcrafted Paper Craft) */}
            <g transform="translate(18, -140) rotate(22)">
              <ellipse cx={0} cy={-36} rx={22} ry={36} fill="#2d7a58" stroke={CREAM} strokeWidth={2.5} />
              <ellipse cx={0} cy={-36} rx={14} ry={24} fill="#1f8a87" />
              <ellipse cx={0} cy={-36} rx={7} ry={12} fill="#2d6a78" />
              <line x1={0} y1={0} x2={0} y2={-72} stroke={GOLD} strokeWidth={2} />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
};
