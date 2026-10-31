import React from "react";
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/**
 * MINDSPARK style engine, 200 engine styles + 12 "Thinking loader" styles = 212, ek hi file (1080x1920 vertical).
 *
 * 14 backgrounds x 24 palettes x 12 caption animations x 10 fonts x 5 text looks
 * ko deterministic tareeke se mix karke 200 named styles bante hain
 * (har (background, palette) pair unique hai, koi repeat nahi).
 *
 * Usage:
 *   const style = pickStyle(videoId, recentStyleIds);   // recentStyleIds: string[]
 *   <Sequence from={s} durationInFrames={d}>
 *     <StyledScene style={style} text="Ye line caption me aayegi" />
 *   </Sequence>
 *
 * Ek video ke saare scenes me SAME style object use karna.
 * Fonts system fonts hain; chaho to @remotion/google-fonts se replace kar lo.
 */

const W = 1080;
const H = 1920;

/* ----------------------------- helpers ----------------------------- */
const cl = (n: number) => Math.max(0, Math.min(1, n));
const rgb = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const alpha = (h: string, a: number) => {
  const [r, g, b] = rgb(h);
  return `rgba(${r},${g},${b},${a})`;
};
const lum = (h: string) => {
  const [r, g, b] = rgb(h);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};
const isDark = (h: string) => lum(h) < 0.5;
const textOn = (h: string) => (lum(h) > 0.6 ? "#111111" : "#ffffff");
const ease = (f: number, from: number, len: number) =>
  interpolate(f, [from, from + len], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

/* ----------------------------- palettes ---------------------------- */
export interface Palette {
  name: string;
  bg: string;
  a: string;
  b: string;
  c: string;
  ink: string;
}

const PALETTES: Palette[] = [
  { name: "Midnight", bg: "#0b1020", a: "#5b8cff", b: "#ff5d8f", c: "#ffd166", ink: "#f4f6ff" },
  { name: "Sunset", bg: "#2b0f3a", a: "#ff6b35", b: "#ffb703", c: "#e63d8a", ink: "#fff4e6" },
  { name: "Mint", bg: "#e9fbf3", a: "#1fb980", b: "#0a7c66", c: "#ffb347", ink: "#0b2e26" },
  { name: "Candy", bg: "#fff0f6", a: "#ff4d94", b: "#7a5cff", c: "#2ec4ff", ink: "#2a1233" },
  { name: "Ocean", bg: "#04202e", a: "#00b4d8", b: "#48cae4", c: "#ffd60a", ink: "#eaf9ff" },
  { name: "Forest", bg: "#10261a", a: "#4caf50", b: "#a3d977", c: "#f4a259", ink: "#effbe9" },
  { name: "Ember", bg: "#1b0a08", a: "#ff4500", b: "#ff9f1c", c: "#ffd23f", ink: "#fff1e0" },
  { name: "Lavender", bg: "#f1ecff", a: "#8a6cff", b: "#ff8fb8", c: "#4cc9f0", ink: "#231942" },
  { name: "Mono", bg: "#f2f2f2", a: "#111111", b: "#666666", c: "#ff2a2a", ink: "#111111" },
  { name: "Citrus", bg: "#fffbe6", a: "#ff9f1c", b: "#2ec27e", c: "#ff4d6d", ink: "#2b2200" },
  { name: "Rose", bg: "#3a0d1f", a: "#ff5c8a", b: "#ffb3c6", c: "#ffd6a5", ink: "#fff0f4" },
  { name: "Slate", bg: "#1f2933", a: "#7b8794", b: "#3ebd93", c: "#f9c74f", ink: "#f5f7fa" },
  { name: "Neon", bg: "#07070d", a: "#39ff14", b: "#ff00e5", c: "#00f0ff", ink: "#ffffff" },
  { name: "Sand", bg: "#f3e7d3", a: "#c8553d", b: "#588b8b", c: "#ffd5a5", ink: "#2b2118" },
  { name: "Arctic", bg: "#eaf6ff", a: "#1d8fe1", b: "#7ad7f0", c: "#1b3a57", ink: "#0b2239" },
  { name: "Berry", bg: "#2a0a33", a: "#b5179e", b: "#f72585", c: "#4cc9f0", ink: "#fbeaff" },
  { name: "Coffee", bg: "#2b1d16", a: "#c69c6d", b: "#8c5a3c", c: "#f2d3a3", ink: "#fbeedd" },
  { name: "Volt", bg: "#101406", a: "#d4ff00", b: "#00ffa3", c: "#ff3d71", ink: "#f7ffd6" },
  { name: "Peach", bg: "#fff1e8", a: "#ff8a65", b: "#ffcc80", c: "#80cbc4", ink: "#3e2a24" },
  { name: "Ink", bg: "#0e0f13", a: "#ffffff", b: "#8b8d98", c: "#ff4d4d", ink: "#ffffff" },
  { name: "Jade", bg: "#062c2b", a: "#12c2a5", b: "#7be0c3", c: "#f2c94c", ink: "#e9fffa" },
  { name: "Cobalt", bg: "#0033a0", a: "#ffd100", b: "#ff6b6b", c: "#ffffff", ink: "#ffffff" },
  { name: "Plum", bg: "#3b1f4a", a: "#e0aaff", b: "#c77dff", c: "#ffd6ff", ink: "#fdf0ff" },
  { name: "Lemon", bg: "#fffde1", a: "#ffd400", b: "#ff6f61", c: "#3a86ff", ink: "#1c1c1c" },
];

/* --------------------------- backgrounds --------------------------- */
type BgC = React.FC<{ p: Palette }>;

/* 1 Marker: whiteboard doodles */
const MarkerBG: BgC = ({ p }) => {
  const f = useCurrentFrame();
  const d = (from: number, len: number) => 1 - ease(f, from, len);
  const common = { fill: "none", strokeLinecap: "round" as const, pathLength: 1, strokeDasharray: 1 };
  return (
    <AbsoluteFill style={{ background: `repeating-linear-gradient(0deg, transparent 0 79px, ${alpha(p.ink, 0.1)} 79px 81px), ${p.bg}` }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <path d="M110 1420 C 320 1370, 560 1480, 970 1400" stroke={p.a} strokeWidth={14} strokeDashoffset={d(5, 35)} {...common} />
        <circle cx={170} cy={330} r={95} stroke={p.b} strokeWidth={10} strokeDashoffset={d(15, 40)} transform="rotate(-80 170 330)" {...common} />
        <path d="M850 280 l60 70 l-60 70 M930 280 l60 70 l-60 70" stroke={p.c} strokeWidth={12} strokeLinejoin="round" strokeDashoffset={d(25, 30)} {...common} />
        <path d="M200 1650 q40 -60 80 0 t80 0 t80 0 t80 0" stroke={p.ink} strokeWidth={9} strokeDashoffset={d(35, 40)} {...common} />
      </svg>
    </AbsoluteFill>
  );
};

/* 2 Blueprint grid */
const BlueprintBG: BgC = ({ p }) => {
  const f = useCurrentFrame();
  const o = (f * 0.6) % 60;
  const g = alpha(p.ink, 0.14);
  return (
    <AbsoluteFill
      style={{
        backgroundColor: p.bg,
        backgroundImage: `linear-gradient(${g} 2px, transparent 2px), linear-gradient(90deg, ${g} 2px, transparent 2px)`,
        backgroundSize: "60px 60px",
        backgroundPosition: `${o}px ${o}px`,
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <g fill="none" strokeWidth={3} opacity={0.9}>
          <circle cx={540} cy={420} r={230} stroke={p.a} strokeDasharray="22 14" transform={`rotate(${f * 0.8} 540 420)`} />
          <circle cx={540} cy={420} r={150} stroke={p.b} />
          <path d="M540 150 V690 M270 420 H810" stroke={p.ink} />
          <path d="M60 1740 H1020 M60 1720 V1760 M1020 1720 V1760 M540 1730 V1750" stroke={p.c} />
          <path d="M60 60 h80 M60 60 v80 M1020 60 h-80 M1020 60 v80 M60 1860 h80 M60 1860 v-80 M1020 1860 h-80 M1020 1860 v-80" stroke={p.ink} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

/* 3 Horizon: synthwave sun + perspective floor */
const HorizonBG: BgC = ({ p }) => {
  const f = useCurrentFrame();
  const y = (f * 5) % 90;
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${p.bg} 0%, ${alpha(p.c, 0.85)} 61.9%, ${p.bg} 62%)` }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="hz-sun" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.a} />
            <stop offset="1" stopColor={p.b} />
          </linearGradient>
          <clipPath id="hz-clip"><circle cx={540} cy={860} r={300} /></clipPath>
        </defs>
        <circle cx={540} cy={860} r={300} fill="url(#hz-sun)" />
        <g clipPath="url(#hz-clip)" fill={p.bg}>
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={200} y={900 + i * 50} width={680} height={8 + i * 5} />)}
        </g>
      </svg>
      <div
        style={{
          position: "absolute", left: "-60%", width: "220%", top: "62%", height: "60%",
          transformOrigin: "50% 0%", transform: "perspective(500px) rotateX(62deg)",
          backgroundImage: `linear-gradient(${p.b} 3px, transparent 3px), linear-gradient(90deg, ${p.b} 3px, transparent 3px)`,
          backgroundSize: "90px 90px", backgroundPosition: `0 ${y}px`, opacity: 0.85,
        }}
      />
    </AbsoluteFill>
  );
};

/* 4 Wash: watercolor blobs */
const WashBG: BgC = ({ p }) => {
  const f = useCurrentFrame();
  const cols = [p.a, p.b, p.c, p.a];
  const pos = [[220, 380, 380], [820, 700, 340], [300, 1250, 360], [800, 1600, 330]];
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      {pos.map(([x, y, r], i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x + Math.sin(f / 40 + i * 1.7) * 50 - r / 2,
            top: y + Math.cos(f / 47 + i) * 60 - r / 2,
            width: r, height: r, borderRadius: "46% 54% 52% 48%",
            background: cols[i], filter: "blur(70px)", opacity: 0.6,
            mixBlendMode: isDark(p.bg) ? "screen" : "multiply",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/* 5 Clay: stop-motion blobs */
const ClayBG: BgC = ({ p }) => {
  const f = useCurrentFrame();
  const sf = Math.floor(f / 4) * 4;
  const blobs = [
    { c: p.a, x: 200, y: 330, s: 280 },
    { c: p.b, x: 850, y: 520, s: 220 },
    { c: p.c, x: 160, y: 1500, s: 240 },
    { c: p.a, x: 860, y: 1640, s: 300 },
  ];
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      {blobs.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: b.x - b.s / 2 + Math.sin(sf / 9 + i) * 10,
            top: b.y - b.s / 2 + Math.sin(sf / 6 + i * 2) * 26,
            width: b.s, height: b.s * (1 + Math.sin(sf / 6 + i * 2) * 0.05),
            borderRadius: "48% 52% 45% 55%", background: b.c,
            boxShadow: "inset -18px -22px 30px rgba(0,0,0,0.2), inset 14px 14px 26px rgba(255,255,255,0.45), 0 24px 34px rgba(0,0,0,0.3)",
            transform: `rotate(${Math.sin(sf / 12 + i) * 6}deg)`,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/* 6 Orbit: flat science */
const OrbitBG: BgC = ({ p }) => {
  const f = useCurrentFrame();
  const orbit = (rot: number, speed: number, color: string) => {
    const a = (f * speed * Math.PI) / 180;
    return (
      <g transform={`rotate(${rot} 540 560)`}>
        <ellipse cx={540} cy={560} rx={380} ry={130} stroke={alpha(p.ink, 0.4)} strokeWidth={4} fill="none" />
        <circle cx={540 + Math.cos(a) * 380} cy={560 + Math.sin(a) * 130} r={22} fill={color} />
      </g>
    );
  };
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={540} cy={560} r={70} fill={p.a} />
        {orbit(0, 3, p.b)}
        {orbit(60, 2.2, p.c)}
        {orbit(120, 2.6, p.ink)}
        <circle cx={120} cy={1500} r={60} fill={p.a} opacity={0.9} />
        <circle cx={960} cy={1700} r={90} fill={p.b} opacity={0.5} />
        <circle cx={900} cy={1380} r={24} fill={p.c} />
      </svg>
    </AbsoluteFill>
  );
};

/* 7 Spiral: psychedelic rings */
const SpiralBG: BgC = ({ p }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: `conic-gradient(from ${f * 1.5}deg at 50% 38%, ${p.a}, ${p.b}, ${p.c}, ${p.a})` }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <circle key={i} cx={540} cy={730} r={90 + i * 85 + Math.sin(f / 10 + i) * 14}
            fill="none" stroke={i % 2 ? p.bg : p.ink} strokeWidth={14} opacity={0.9} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/* 8 Graph: Manim-style curve */
const GraphBG: BgC = ({ p }) => {
  const f = useCurrentFrame();
  const n = Math.floor(interpolate(f, [0, 90], [0, 160], { extrapolateRight: "clamp" }));
  const pt = (i: number) => [60 + (i / 160) * 960, 520 - Math.sin((i / 160) * Math.PI * 4) * 200];
  let d = "";
  for (let i = 0; i <= n; i++) {
    const [x, y] = pt(i);
    d += `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  const [dx, dy] = pt(n);
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <g stroke={alpha(p.ink, 0.14)} strokeWidth={2}>
          {Array.from({ length: 12 }).map((_, i) => <path key={i} d={`M${60 + i * 87} 240 V800`} />)}
          {Array.from({ length: 7 }).map((_, i) => <path key={i} d={`M60 ${240 + i * 93} H1020`} />)}
        </g>
        <path d="M60 520 H1020 M60 240 V800" stroke={p.ink} strokeWidth={4} fill="none" />
        <path d={d} stroke={p.a} strokeWidth={8} fill="none" strokeLinecap="round" />
        <circle cx={dx} cy={dy} r={14} fill={p.b} />
      </svg>
    </AbsoluteFill>
  );
};

/* 9 Halftone: pulsing dot field */
const HalftoneBG: BgC = ({ p }) => {
  const f = useCurrentFrame();
  const cx = 540 + Math.sin(f / 40) * 320;
  const cy = 700 + Math.cos(f / 50) * 320;
  const dots: React.ReactNode[] = [];
  for (let r = 0; r < 25; r++) {
    for (let c = 0; c < 14; c++) {
      const x = 40 + c * 80;
      const y = 40 + r * 80;
      const dist = Math.hypot(x - cx, y - cy);
      const rad = Math.max(3, 36 - dist / 20);
      dots.push(<circle key={`${r}-${c}`} cx={x} cy={y} r={rad} fill={dist < 380 ? p.b : p.a} opacity={0.85} />);
    }
  }
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>{dots}</svg>
    </AbsoluteFill>
  );
};

/* 10 Glitch: jumping colour bars */
const GlitchBG: BgC = ({ p }) => {
  const f = useCurrentFrame();
  const t = Math.floor(f / 3);
  const cols = [p.a, p.b, p.c];
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {Array.from({ length: 20 }).map((_, i) => {
          const show = random(`v${i}-${t}`) > 0.45;
          if (!show) return null;
          return (
            <rect key={i}
              x={(random(`x${i}-${t}`) - 0.5) * 160}
              y={random(`y${i}`) * H}
              width={W + 200}
              height={10 + random(`h${i}`) * 70}
              fill={cols[i % 3]} opacity={0.55} />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* 11 Cutout: layered paper shapes */
const CutoutBG: BgC = ({ p }) => {
  const f = useCurrentFrame();
  const t = Math.floor(f / 6);
  const pts = (cx: number, cy: number, r: number, seed: string) =>
    Array.from({ length: 9 }, (_, j) => {
      const a = (j / 9) * Math.PI * 2;
      const rr = r * (0.78 + random(`${seed}-${j}-${t}`) * 0.4);
      return `${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
    }).join(" ");
  const shapes: [number, number, number, string, string][] = [
    [250, 380, 330, "a", p.a], [850, 620, 300, "b", p.b], [300, 1300, 340, "c", p.c], [820, 1560, 320, "d", p.a],
  ];
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ filter: "drop-shadow(0 14px 0 rgba(0,0,0,0.28))" }}>
        {shapes.map(([x, y, r, s, c], i) => <polygon key={i} points={pts(x, y, r, s)} fill={c} />)}
      </svg>
    </AbsoluteFill>
  );
};

/* 12 Tiles: isometric diamonds */
const TilesBG: BgC = ({ p }) => {
  const f = useCurrentFrame();
  const cols = [p.a, p.b, p.c];
  const tiles: React.ReactNode[] = [];
  for (let r = 0; r < 56; r++) {
    for (let c = 0; c < 10; c++) {
      const x = c * 120 + (r % 2) * 60;
      const y = r * 35 - 35;
      const o = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(f / 12 - (r + c) * 0.5));
      tiles.push(
        <polygon key={`${r}-${c}`} points={`${x},${y} ${x + 60},${y + 35} ${x},${y + 70} ${x - 60},${y + 35}`}
          fill={cols[(r + c) % 3]} opacity={o} stroke={p.bg} strokeWidth={3} />
      );
    }
  }
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>{tiles}</svg>
    </AbsoluteFill>
  );
};

/* 13 Waves: layered sine fills */
const WavesBG: BgC = ({ p }) => {
  const f = useCurrentFrame();
  const wave = (base: number, amp: number, ph: number) => {
    let d = `M0 ${H} L0 ${base}`;
    for (let x = 0; x <= W; x += 30) d += ` L${x} ${(base + Math.sin(x / 160 + ph) * amp).toFixed(1)}`;
    return d + ` L${W} ${H} Z`;
  };
  const cols = [p.a, p.b, p.c, p.a, p.b];
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {cols.map((c, i) => (
          <path key={i} d={wave(820 + i * 220, 50 + i * 8, f / 20 + i * 1.3)} fill={c} opacity={0.8} />
        ))}
        <circle cx={880} cy={300} r={110} fill={p.c} opacity={0.9} />
      </svg>
    </AbsoluteFill>
  );
};

/* 14 Stripes: moving diagonal bands */
const StripesBG: BgC = ({ p }) => {
  const f = useCurrentFrame();
  const x = (f * 2) % 169.7;
  return (
    <AbsoluteFill style={{ background: p.bg, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute", inset: -400,
          background: `repeating-linear-gradient(45deg, ${alpha(p.a, 0.9)} 0 60px, ${alpha(p.b, 0.9)} 60px 120px)`,
          transform: `translateX(${x}px)`,
        }}
      />
      <div style={{ position: "absolute", left: -120, top: 1350, width: 520, height: 520, borderRadius: "50%", background: p.c, opacity: 0.9 }} />
      <div style={{ position: "absolute", right: -100, top: 140, width: 360, height: 360, borderRadius: "50%", background: p.bg, opacity: 0.9 }} />
    </AbsoluteFill>
  );
};

/* 15 Thinking: "AI soch raha hai" loader (pulsing spark + shimmering label) */
const THINK_WORDS = ["Thinking", "Soch raha hu", "Reading", "Samajh raha hu", "Connecting ideas", "Almost there"];
const ThinkingBG: BgC = ({ p }) => {
  const f = useCurrentFrame();
  const pulse = 0.92 + 0.08 * Math.sin(f / 8);
  const word = THINK_WORDS[Math.floor(f / 45) % THINK_WORDS.length];
  const dots = ".".repeat(1 + (Math.floor(f / 10) % 3));
  const shimmer = (f * 4) % 300;
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <g transform={`translate(540 440) rotate(${f * 1.6}) scale(${pulse * 1.6})`}>
          {Array.from({ length: 10 }).map((_, i) => (
            <ellipse
              key={i}
              cx={0}
              cy={-70}
              rx={13}
              ry={58 + 14 * Math.sin(f / 9 + i)}
              fill={i % 2 ? p.b : p.a}
              opacity={0.5 + 0.5 * Math.sin(f / 10 + i * 0.7) ** 2}
              transform={`rotate(${i * 36})`}
            />
          ))}
          <circle r={16} fill={p.c} />
        </g>
      </svg>
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: 1560, textAlign: "center",
          fontFamily: "'Helvetica Neue',Arial,sans-serif", fontWeight: 600, fontSize: 52,
          backgroundImage: `linear-gradient(90deg, ${alpha(p.ink, 0.3)} 0%, ${p.ink} 50%, ${alpha(p.ink, 0.3)} 100%)`,
          backgroundSize: "300px 100%", backgroundPosition: `${shimmer}px 0`, backgroundRepeat: "repeat-x",
          WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
        }}
      >
        {word}{dots}
      </div>
    </AbsoluteFill>
  );
};

const BGS: { name: string; C: BgC }[] = [
  { name: "Marker", C: MarkerBG },
  { name: "Blueprint", C: BlueprintBG },
  { name: "Horizon", C: HorizonBG },
  { name: "Wash", C: WashBG },
  { name: "Clay", C: ClayBG },
  { name: "Orbit", C: OrbitBG },
  { name: "Spiral", C: SpiralBG },
  { name: "Graph", C: GraphBG },
  { name: "Halftone", C: HalftoneBG },
  { name: "Glitch", C: GlitchBG },
  { name: "Cutout", C: CutoutBG },
  { name: "Tiles", C: TilesBG },
  { name: "Waves", C: WavesBG },
  { name: "Stripes", C: StripesBG },
];

/* ------------------------- caption animations ---------------------- */
interface AnimDef {
  name: string;
  spring?: { damping?: number; stiffness?: number; mass?: number };
  fn: (p: number, i: number, f: number) => React.CSSProperties;
}

const ANIMS: AnimDef[] = [
  { name: "pop", spring: { damping: 10 }, fn: (p) => ({ opacity: cl(p * 3), transform: `scale(${0.5 + 0.5 * p})` }) },
  { name: "slideLeft", fn: (p) => ({ opacity: cl(p * 2), transform: `translateX(${(1 - cl(p)) * -140}px)` }) },
  { name: "slideUp", fn: (p) => ({ opacity: cl(p * 2), transform: `translateY(${(1 - p) * 80}px)` }) },
  { name: "blurIn", spring: { damping: 200 }, fn: (p) => ({ opacity: cl(p), filter: `blur(${(1 - cl(p)) * 16}px)` }) },
  { name: "wipe", spring: { damping: 200 }, fn: (p) => ({ opacity: cl(p * 2), clipPath: `inset(0 ${(1 - cl(p)) * 100}% 0 0)` }) },
  { name: "rotateIn", spring: { damping: 12 }, fn: (p, i) => ({ opacity: cl(p * 3), transform: `rotate(${(1 - cl(p)) * (i % 2 ? 20 : -20)}deg) scale(${0.6 + 0.4 * p})` }) },
  { name: "drop", spring: { damping: 8, stiffness: 140 }, fn: (p) => ({ opacity: cl(p * 4), transform: `translateY(${(1 - p) * -220}px)` }) },
  { name: "flipX", spring: { damping: 14 }, fn: (p) => ({ opacity: cl(p * 3), transform: `perspective(600px) rotateX(${(1 - cl(p)) * 90}deg)` }) },
  { name: "zoomOut", spring: { damping: 20 }, fn: (p) => ({ opacity: cl(p * 2), transform: `scale(${2.2 - 1.2 * cl(p)})` }) },
  { name: "skew", fn: (p) => ({ opacity: cl(p * 2), transform: `translateX(${(1 - cl(p)) * 160}px) skewX(${(1 - cl(p)) * -20}deg)` }) },
  { name: "wobble", spring: { damping: 12 }, fn: (p, i, f) => ({ opacity: cl(p * 3), transform: `rotate(${Math.sin(f / 6 + i) * 3 * cl(p)}deg) scale(${0.7 + 0.3 * cl(p)})` }) },
  { name: "track", spring: { damping: 200 }, fn: (p) => ({ opacity: cl(p), letterSpacing: `${(1 - cl(p)) * 20}px` }) },
];

/* ----------------------------- fonts ------------------------------- */
interface FontDef {
  family: string;
  weight: number;
  scale: number;
  upper?: boolean;
  italic?: boolean;
}
const FONTS: FontDef[] = [
  { family: "Impact,'Arial Black',sans-serif", weight: 400, scale: 1.2, upper: true },
  { family: "Georgia,'Times New Roman',serif", weight: 700, scale: 1, italic: true },
  { family: "'Courier New',monospace", weight: 700, scale: 0.9 },
  { family: "'Trebuchet MS',sans-serif", weight: 800, scale: 1 },
  { family: "Verdana,Geneva,sans-serif", weight: 800, scale: 0.88 },
  { family: "Palatino,'Palatino Linotype',serif", weight: 700, scale: 1 },
  { family: "'Comic Sans MS','Chalkboard SE',cursive", weight: 700, scale: 1 },
  { family: "'Helvetica Neue',Arial,sans-serif", weight: 900, scale: 1 },
  { family: "'Arial Black','Arial Bold',sans-serif", weight: 900, scale: 0.95, upper: true },
  { family: "Tahoma,Geneva,sans-serif", weight: 800, scale: 0.95 },
];

/* --------------------------- text looks ---------------------------- */
const VARIANTS: ((p: Palette) => { box?: React.CSSProperties; word?: React.CSSProperties })[] = [
  () => ({}),
  (p) => ({ box: { textShadow: `0 8px 0 ${p.a}` } }),
  (p) => ({ box: { WebkitTextStroke: `7px ${p.bg}`, paintOrder: "stroke fill" } }),
  (p) => ({ word: { background: p.a, color: textOn(p.a), padding: "0 22px", borderRadius: 18 } }),
  (p) => ({ box: { textShadow: `0 0 24px ${p.a}, 0 0 54px ${p.b}` } }),
];

/* ----------------------------- registry ---------------------------- */
export interface ShortStyle {
  id: string;
  name: string;
  bgName: string;
  palette: Palette;
  font: FontDef;
  anim: AnimDef;
  variant: number;
  Background: BgC;
}

const ENGINE_STYLES: ShortStyle[] = Array.from({ length: 200 }, (_, n) => {
  const bg = BGS[n % BGS.length];
  const k = Math.floor(n / BGS.length);
  const palette = PALETTES[(n * 7 + k * 5) % PALETTES.length]; // (bg, palette) pair hamesha unique
  return {
    id: `s${String(n + 1).padStart(3, "0")}`,
    name: `${palette.name} ${bg.name}`,
    bgName: bg.name,
    palette,
    font: FONTS[(n * 7 + 2) % FONTS.length],
    anim: ANIMS[(n * 5 + 3) % ANIMS.length],
    variant: (n * 3 + 1) % VARIANTS.length,
    Background: bg.C,
  };
});

/** 12 "Thinking loader" styles (AI soch raha hai wali animation), alag palettes me. */
const THINK_PALETTES = ["Midnight", "Ink", "Neon", "Ocean", "Lavender", "Mono", "Berry", "Jade", "Plum", "Cobalt", "Volt", "Sunset"];
export const THINKING_STYLES: ShortStyle[] = THINK_PALETTES.map((pn, i) => ({
  id: `t${String(i + 1).padStart(2, "0")}`,
  name: `${pn} Thinking`,
  bgName: "Thinking",
  palette: PALETTES.find((x) => x.name === pn)!,
  font: FONTS[i % 2 ? 3 : 7],
  anim: ANIMS[i % 2 ? 11 : 3],
  variant: isDark(PALETTES.find((x) => x.name === pn)!.bg) ? 4 : 0,
  Background: ThinkingBG,
}));

export const SHORT_STYLES: ShortStyle[] = [...ENGINE_STYLES, ...THINKING_STYLES];

export const STYLE_COUNT = SHORT_STYLES.length;
export const getStyleById = (id: string) => SHORT_STYLES.find((s) => s.id === id);

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/**
 * Same videoId -> same style. recentIds (pichle video ki ids, latest last) wale
 * styles skip hote hain, aur latest style ka background/palette bhi repeat nahi hota.
 * Backward compatible: string bhi chalega.
 */
export const pickStyle = (videoId: string, recent: string | string[] = []): ShortStyle => {
  const ids = Array.isArray(recent) ? recent : [recent];
  const last = getStyleById(ids[ids.length - 1] ?? "");
  const h = hash(videoId);
  for (let step = 0; step < SHORT_STYLES.length; step++) {
    const s = SHORT_STYLES[(h + step * 37) % SHORT_STYLES.length];
    if (ids.includes(s.id)) continue;
    if (last && (s.bgName === last.bgName || s.palette.name === last.palette.name)) continue;
    return s;
  }
  return SHORT_STYLES[h % SHORT_STYLES.length];
};

/* --------------------------- components ---------------------------- */
export const StyledCaption: React.FC<{ text: string; style: ShortStyle }> = ({ text, style: s }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = VARIANTS[s.variant](s.palette);
  const size = 84 * s.font.scale * (text.length > 100 ? 0.65 : text.length > 60 ? 0.8 : 1);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 80px" }}>
      <div
        style={{
          display: "flex", flexWrap: "wrap", justifyContent: "center",
          gap: v.word ? "14px 14px" : "0 24px",
          fontFamily: s.font.family, fontWeight: s.font.weight, fontSize: size, lineHeight: 1.25,
          textAlign: "center", color: s.palette.ink,
          textTransform: s.font.upper ? "uppercase" : undefined,
          fontStyle: s.font.italic ? "italic" : undefined,
          ...v.box,
        }}
      >
        {text.split(/\s+/).filter(Boolean).map((w, i) => (
          <span
            key={i}
            style={{
              display: "inline-block",
              ...v.word,
              ...s.anim.fn(spring({ frame: f - i * 4, fps, config: s.anim.spring }), i, f),
            }}
          >
            {w}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};

export const StyledScene: React.FC<{ text: string; style: ShortStyle }> = ({ text, style }) => (
  <AbsoluteFill style={{ background: style.palette.bg }}>
    <style.Background p={style.palette} />
    <StyledCaption text={text} style={style} />
  </AbsoluteFill>
);
