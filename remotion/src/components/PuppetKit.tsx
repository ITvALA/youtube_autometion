import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/* =====================================================================
   PUPPET KIT  -  flat vector "cutout / marionette" story look
   Canvas: 1080 x 1920 (vertical Reels/Shorts), 30 fps
   Everything is code-drawn SVG: no image API needed.
   ===================================================================== */

/* ---------------------------- PALETTE ------------------------------ */
export const C = {
  night: "#0c0603",
  umber: "#26130a",
  brown: "#4a2410",
  gold: "#f0b429",
  goldLight: "#ffd45e",
  goldDark: "#b07a14",
  amber: "#e8892b",
  orange: "#d9541c",
  red: "#b83a14",
  rust: "#8a2c10",
  ink: "#2a1206",
  cream: "#f6e6c3",
  skinGold: "#e8a83c",
  skinTeal: "#3f8f86",
  mane: "#8a4b1a",
  tealText: "#8fe3d2",
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = Easing.inOut(Easing.cubic);

const star = (cx: number, cy: number, r1: number, r2: number, n: number, rot = 0) => {
  let d = "";
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = rot + (Math.PI * i) / n - Math.PI / 2;
    d += `${i === 0 ? "M" : "L"}${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)} `;
  }
  return d + "Z";
};

// pointed-arch path (temple doorway)
const arch = (cx: number, base: number, w: number, top: number, close = true) => {
  const l = cx - w / 2;
  const r = cx + w / 2;
  const s = top + w * 0.85;
  const k = top + w * 0.35;
  return `M ${l} ${base} L ${l} ${s} Q ${l} ${k} ${cx} ${top} Q ${r} ${k} ${r} ${s} L ${r} ${base}${close ? " Z" : ""}`;
};

/* ============================ POSES ================================
   Each limb = [angle1, angle2]
   angle1: shoulder/hip angle   (0 = hanging straight down, 90 = sideways, 180 = straight up)
   angle2: elbow/knee bend      (+ = curls forearm up/in, - = other way)
   Both sides use the same numbers (mirroring is automatic).
   A = screen-left limb, B = screen-right limb.
   ==================================================================== */
export type Limb = [number, number];
export type Pose = {armA: Limb; armB: Limb; legA: Limb; legB: Limb; head: number; lean: number};

export const POSES: Record<string, Pose> = {
  idle: {armA: [10, 8], armB: [10, 8], legA: [4, 0], legB: [4, 0], head: 0, lean: 0},
  mace: {armA: [10, 8], armB: [16, -12], legA: [5, 0], legB: [5, 0], head: 0, lean: 0},
  raiseA: {armA: [168, -26], armB: [16, -12], legA: [6, 0], legB: [6, 0], head: -3, lean: -1},
  guard: {armA: [40, 70], armB: [40, 70], legA: [12, 0], legB: [12, 0], head: 0, lean: 0},
  point: {armA: [92, -4], armB: [10, 8], legA: [5, 0], legB: [5, 0], head: 4, lean: 2},
  bow: {armA: [14, 10], armB: [14, 10], legA: [4, 0], legB: [4, 0], head: 14, lean: 7},
  angry: {armA: [30, 95], armB: [30, 95], legA: [14, 0], legB: [14, 0], head: -4, lean: -3},
  sad: {armA: [6, 4], armB: [6, 4], legA: [3, 0], legB: [3, 0], head: 16, lean: 4},
  // --- Battle & Action Poses ---
  charge: {armA: [80, -20], armB: [140, 40], legA: [35, 20], legB: [-25, 40], head: -8, lean: 18},
  slashHigh: {armA: [30, 20], armB: [165, 35], legA: [15, 0], legB: [-15, 20], head: -5, lean: -6},
  slashStrike: {armA: [30, 40], armB: [35, -20], legA: [35, 10], legB: [-25, 30], head: 8, lean: 22},
  clashLock: {armA: [65, 80], armB: [75, 70], legA: [28, 10], legB: [-20, 20], head: -4, lean: 12},
  recoilHit: {armA: [110, -30], armB: [120, -20], legA: [-30, 40], legB: [10, 10], head: -18, lean: -24},
  marchA: {armA: [-35, 15], armB: [40, 20], legA: [30, 10], legB: [-25, 35], head: 0, lean: 5},
  marchB: {armA: [40, 20], armB: [-35, 15], legA: [-25, 35], legB: [30, 10], head: 0, lean: 5},
};

export function calcWalkPose(frame: number, speed: number = 0.25, isRun: boolean = false): {pose: Pose; bobY: number} {
  const amp = isRun ? 42 : 28;
  const legAmp = isRun ? 48 : 32;
  const cycle = frame * speed;

  const sin = Math.sin(cycle);
  const cos = Math.cos(cycle);

  const legA_rot = sin * legAmp;
  const legB_rot = -sin * legAmp;

  const kneeA = Math.max(0, -sin) * (isRun ? 55 : 35);
  const kneeB = Math.max(0, sin) * (isRun ? 55 : 35);

  const armA_rot = -sin * amp;
  const armB_rot = sin * amp;
  const armA_bend = 15 + Math.abs(cos) * (isRun ? 40 : 20);
  const armB_bend = 15 + Math.abs(cos) * (isRun ? 40 : 20);

  const bobY = Math.abs(Math.sin(cycle)) * (isRun ? 18 : 10);
  const lean = isRun ? 16 : 4;

  return {
    pose: {
      armA: [armA_rot, armA_bend],
      armB: [armB_rot, armB_bend],
      legA: [legA_rot, kneeA],
      legB: [legB_rot, kneeB],
      head: Math.sin(cycle) * 2,
      lean,
    },
    bobY,
  };
}

export type PoseKey = {f: number; pose: Pose | string};

const resolve = (p: Pose | string): Pose => (typeof p === "string" ? POSES[p] ?? POSES.idle : p);
const lerpLimb = (a: Limb, b: Limb, t: number): Limb => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

export function blendPose(keys: PoseKey[], frame: number): Pose {
  if (!keys.length) return POSES.idle;
  const ks = [...keys].sort((a, b) => a.f - b.f);
  if (frame <= ks[0].f) return resolve(ks[0].pose);
  const last = ks[ks.length - 1];
  if (frame >= last.f) return resolve(last.pose);
  for (let i = 0; i < ks.length - 1; i++) {
    const a = ks[i];
    const b = ks[i + 1];
    if (frame >= a.f && frame <= b.f) {
      const t = ease((frame - a.f) / Math.max(1, b.f - a.f));
      const pa = resolve(a.pose);
      const pb = resolve(b.pose);
      return {
        armA: lerpLimb(pa.armA, pb.armA, t),
        armB: lerpLimb(pa.armB, pb.armB, t),
        legA: lerpLimb(pa.legA, pb.legA, t),
        legB: lerpLimb(pa.legB, pb.legB, t),
        head: lerp(pa.head, pb.head, t),
        lean: lerp(pa.lean, pb.lean, t),
      };
    }
  }
  return resolve(last.pose);
}

/* ============================ LOOKS ================================ */
export type Look = {
  face: "vanara" | "human";
  skin: string;
  dhoti?: string;
  halo?: boolean;
  prop?: "mace" | "sword" | "bow" | "spear" | "shield" | "none";
  propHand?: "A" | "B";
  secondaryProp?: "shield" | "none";
  secondaryPropHand?: "A" | "B";
};

export const LOOKS: Record<string, Look> = {
  warrior: {face: "vanara", skin: C.skinGold, dhoti: C.red, prop: "mace", propHand: "B"},
  king: {face: "human", skin: C.skinTeal, dhoti: C.rust, halo: true, prop: "none"},
  rajaWarrior: {face: "human", skin: "#f1c27d", dhoti: "#c2185b", halo: false, prop: "sword", propHand: "B", secondaryProp: "shield", secondaryPropHand: "A"},
  enemySoldier: {face: "human", skin: "#d29054", dhoti: "#1e293b", halo: false, prop: "spear", propHand: "B"},
};

/* ========================= PUPPET PARTS ============================ */
const Joint: React.FC<{r: number}> = ({r}) => (
  <g>
    <circle r={r} fill={C.goldDark} stroke={C.ink} strokeWidth={4} />
    <circle r={r * 0.32} fill={C.ink} opacity={0.65} />
  </g>
);

const Segment: React.FC<{len: number; w: number; fill: string; band?: string}> = ({len, w, fill, band}) => (
  <g>
    <rect x={-w / 2} y={-w / 2} width={w} height={len + w} rx={w / 2} fill={fill} stroke={C.ink} strokeWidth={5} />
    <rect x={-w / 2 + 6} y={4} width={w / 5} height={len * 0.8} rx={w / 10} fill="#fff" opacity={0.18} />
    {band ? <rect x={-w / 2 - 1} y={len * 0.66} width={w + 2} height={len * 0.1} rx={3} fill={band} stroke={C.ink} strokeWidth={3} /> : null}
    <circle cx={0} cy={len * 0.3} r={3.2} fill={C.ink} opacity={0.5} />
    <circle cx={0} cy={len * 0.5} r={3.2} fill={C.ink} opacity={0.5} />
  </g>
);

export const Mace: React.FC = () => (
  <g>
    <rect x={-6} y={-150} width={12} height={196} rx={6} fill={C.gold} stroke={C.ink} strokeWidth={4} />
    <rect x={-13} y={-24} width={26} height={14} rx={4} fill={C.goldDark} stroke={C.ink} strokeWidth={3} />
    <g transform="translate(0 -205)">
      <circle r={52} fill={C.gold} stroke={C.ink} strokeWidth={5} />
      <ellipse rx={24} ry={52} fill="none" stroke={C.ink} strokeWidth={3} opacity={0.55} />
      <ellipse rx={44} ry={52} fill="none" stroke={C.ink} strokeWidth={3} opacity={0.4} />
      <line x1={-52} y1={0} x2={52} y2={0} stroke={C.ink} strokeWidth={3} opacity={0.55} />
      <ellipse rx={52} ry={22} fill="none" stroke={C.ink} strokeWidth={3} opacity={0.4} />
      <path d="M -9 -50 L 0 -80 L 9 -50 Z" fill={C.gold} stroke={C.ink} strokeWidth={4} />
    </g>
    <circle cx={0} cy={52} r={8} fill={C.red} stroke={C.ink} strokeWidth={3} />
  </g>
);

export const Sword: React.FC = () => (
  <g transform="translate(0 -140) rotate(-10)">
    {/* Blade */}
    <path
      d="M -9 40 L -7 -155 Q 0 -185 7 -155 L 9 40 Z"
      fill="#e2e8f0"
      stroke={C.ink}
      strokeWidth={3.5}
    />
    <line x1={0} y1={30} x2={0} y2={-150} stroke="#94a3b8" strokeWidth={2} />
    <path d="M -5 30 L -4 -145 L 0 -145 L 0 30 Z" fill="#ffffff" opacity={0.65} />
    {/* Crossguard */}
    <rect x={-32} y={38} width={64} height={12} rx={5} fill={C.gold} stroke={C.ink} strokeWidth={3} />
    <circle cx={-30} cy={44} r={5} fill={C.goldLight} stroke={C.ink} strokeWidth={2} />
    <circle cx={30} cy={44} r={5} fill={C.goldLight} stroke={C.ink} strokeWidth={2} />
    {/* Grip */}
    <rect x={-6} y={50} width={12} height={36} rx={3} fill="#4a2410" stroke={C.ink} strokeWidth={2.5} />
    <line x1={-6} y1={58} x2={6} y2={62} stroke={C.gold} strokeWidth={2} />
    <line x1={-6} y1={68} x2={6} y2={72} stroke={C.gold} strokeWidth={2} />
    {/* Pommel with gem */}
    <circle cx={0} cy={92} r={12} fill={C.gold} stroke={C.ink} strokeWidth={3} />
    <circle cx={0} cy={92} r={5} fill={C.red} stroke={C.ink} strokeWidth={2} />
  </g>
);

export const Shield: React.FC = () => (
  <g transform="translate(0 20)">
    <circle r={58} fill="#78350f" stroke={C.ink} strokeWidth={5} />
    <circle r={52} fill="#b45309" stroke={C.gold} strokeWidth={3} />
    <circle r={42} fill="#d97706" />
    <circle r={28} fill="#f59e0b" stroke={C.ink} strokeWidth={2.5} />
    <circle r={14} fill={C.goldLight} stroke={C.ink} strokeWidth={3} />
    {[-32, 32].map((ox) =>
      [-32, 32].map((oy) => (
        <circle key={`${ox}-${oy}`} cx={ox} cy={oy} r={4.5} fill={C.goldLight} stroke={C.ink} strokeWidth={1.5} />
      ))
    )}
  </g>
);

export const Bow: React.FC = () => (
  <g transform="translate(0 -20)">
    <path
      d="M -25 -140 Q 45 0 -25 140"
      fill="none"
      stroke="#78350f"
      strokeWidth={7}
      strokeLinecap="round"
    />
    <path
      d="M -25 -140 Q 45 0 -25 140"
      fill="none"
      stroke={C.gold}
      strokeWidth={3}
      strokeDasharray="14 14"
    />
    <line x1={-25} y1={-140} x2={-25} y2={140} stroke="#ffffff" strokeWidth={2.5} opacity={0.8} />
  </g>
);

export const Spear: React.FC = () => (
  <g transform="translate(0 -160) rotate(-10)">
    <line x1={0} y1={280} x2={0} y2={-160} stroke="#451a03" strokeWidth={8} strokeLinecap="round" />
    <line x1={-2} y1={260} x2={-2} y2={-150} stroke={C.gold} strokeWidth={2} opacity={0.6} />
    <polygon points="-16,-160 0,-240 16,-160 0,-140" fill="#e2e8f0" stroke={C.ink} strokeWidth={3.5} />
    <line x1={0} y1={-150} x2={0} y2={-230} stroke="#94a3b8" strokeWidth={2} />
    <path d="M -12 -140 L 0 -110 L 12 -140 Z" fill="#dc2626" />
  </g>
);

/* ========================= ACTION & COMBAT FX ======================= */
export const ClashSparks: React.FC<{x: number; y: number; triggerFrame: number; frame: number}> = ({
  x,
  y,
  triggerFrame,
  frame,
}) => {
  const dt = frame - triggerFrame;
  if (dt < 0 || dt > 16) return null;
  const progress = dt / 16;
  const radius = progress * 160;
  const opacity = 1 - progress;

  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      <circle r={radius * 0.4} fill="#fffae0" opacity={0.8} />
      <circle r={radius * 0.7} fill="#f59e0b" opacity={0.4} />
      {Array.from({length: 8}).map((_, i) => {
        const ang = (i * Math.PI) / 4 + progress * 0.5;
        const dist = radius * (0.8 + 0.4 * (i % 2));
        const px = Math.cos(ang) * dist;
        const py = Math.sin(ang) * dist;
        return (
          <line
            key={i}
            x1={px * 0.3}
            y1={py * 0.3}
            x2={px}
            y2={py}
            stroke={i % 2 === 0 ? "#ffffff" : "#f59e0b"}
            strokeWidth={4 * (1 - progress)}
            strokeLinecap="round"
          />
        );
      })}
    </g>
  );
};

export const SlashTrail: React.FC<{
  cx: number;
  cy: number;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  frame: number;
  startFrame: number;
  duration?: number;
}> = ({cx, cy, radius = 200, startAngle = -45, endAngle = 75, frame, startFrame, duration = 8}) => {
  const dt = frame - startFrame;
  if (dt < 0 || dt > duration) return null;
  const t = dt / duration;
  const op = (1 - t) * 0.85;

  const a1 = (startAngle * Math.PI) / 180;
  const a2 = ((startAngle + (endAngle - startAngle) * Math.min(1, t * 1.5)) * Math.PI) / 180;
  const x1 = cx + Math.cos(a1) * radius;
  const y1 = cy + Math.sin(a1) * radius;
  const x2 = cx + Math.cos(a2) * radius;
  const y2 = cy + Math.sin(a2) * radius;

  return (
    <g opacity={op} style={{mixBlendMode: "screen"}}>
      <path
        d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
        fill="none"
        stroke="#ffffff"
        strokeWidth={14 * (1 - t)}
        strokeLinecap="round"
      />
      <path
        d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
        fill="none"
        stroke="#ffd54f"
        strokeWidth={28 * (1 - t)}
        strokeLinecap="round"
        opacity={0.6}
      />
    </g>
  );
};

export const FlyingArrows: React.FC<{frame: number; count?: number}> = ({frame, count = 6}) => {
  return (
    <g>
      {Array.from({length: count}).map((_, i) => {
        const offset = i * 22;
        const progress = ((frame + offset) % 60) / 60;
        const x = -100 + progress * 1300;
        const y = 350 + i * 110 + Math.sin(progress * Math.PI) * -80;
        const rot = -15 + progress * 35;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${rot})`}>
            <line x1={-90} y1={0} x2={0} y2={0} stroke="#ffd54f" strokeWidth={3} opacity={0.5} strokeDasharray="6 6" />
            <line x1={-60} y1={0} x2={0} y2={0} stroke="#451a03" strokeWidth={4} />
            <polygon points="0,-6 16,0 0,6" fill="#e2e8f0" stroke="#000" strokeWidth={1.5} />
            <polygon points="-60,-8 -46,0 -60,8 -54,0" fill="#dc2626" />
          </g>
        );
      })}
    </g>
  );
};

export const ArmyMarch: React.FC<{frame: number; direction?: 1 | -1}> = ({frame, direction = 1}) => {
  return (
    <g opacity={0.65} transform={`scale(${direction} 1)`}>
      {Array.from({length: 12}).map((_, i) => {
        const baseX = (i * 120 + frame * 1.5 * direction) % 1500 - 200;
        const step = Math.sin((frame + i * 7) * 0.25) * 8;
        const y = 1380 + (i % 2) * 40;
        return (
          <g key={i} transform={`translate(${baseX} ${y})`}>
            <line x1={0} y1={-180} x2={0} y2={20} stroke="#1f2937" strokeWidth={4} />
            <polygon points="-6,-180 0,-215 6,-180" fill="#cbd5e1" stroke="#1f2937" strokeWidth={2} />
            {i % 3 === 0 ? (
              <path
                d={`M 0 -195 Q 25 ${-205 + Math.sin(frame * 0.15 + i) * 6} 45 -195 L 35 -175 Q 18 -180 0 -175 Z`}
                fill="#dc2626"
                stroke="#1f2937"
                strokeWidth={1.5}
              />
            ) : null}
            <circle cx={-10} cy={-60} r={18} fill="#27272a" />
            <polygon points="-16,-68 -10,-88 -4,-68" fill="#d97706" />
            <rect x={-22} y={-42} width={24} height={42} rx={6} fill="#18181b" />
            <line x1={-16} y1={0} x2={-16 + step} y2={45} stroke="#18181b" strokeWidth={8} strokeLinecap="round" />
            <line x1={-6} y1={0} x2={-6 - step} y2={45} stroke="#18181b" strokeWidth={8} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};

const Arm: React.FC<{x: number; y: number; a1: number; a2: number; sign: 1 | -1; skin: string; prop?: React.ReactNode}> = ({
  x,
  y,
  a1,
  a2,
  sign,
  skin,
  prop,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${sign * a1})`}>
    <Segment len={108} w={40} fill={skin} band={C.gold} />
    <g transform={`translate(0 108) rotate(${sign * a2})`}>
      <Segment len={102} w={34} fill={skin} band={C.gold} />
      <Joint r={19} />
      <g transform="translate(0 102)">
        <circle r={21} fill={skin} stroke={C.ink} strokeWidth={5} />
        {prop}
      </g>
    </g>
    <Joint r={24} />
  </g>
);

const Leg: React.FC<{x: number; y: number; a1: number; a2: number; sign: 1 | -1; skin: string}> = ({x, y, a1, a2, sign, skin}) => (
  <g transform={`translate(${x} ${y}) rotate(${sign * a1})`}>
    <Segment len={118} w={50} fill={skin} band={C.gold} />
    <g transform={`translate(0 118) rotate(${-sign * a2})`}>
      <Segment len={120} w={42} fill={skin} band={C.gold} />
      <Joint r={22} />
      <g transform="translate(0 124)">
        <ellipse cx={0} cy={6} rx={32} ry={15} fill={skin} stroke={C.ink} strokeWidth={5} />
        <path d="M -14 8 L 14 8" stroke={C.ink} strokeWidth={3} opacity={0.5} />
      </g>
    </g>
    <Joint r={27} />
  </g>
);

const Head: React.FC<{look: Look; frame: number; speaking: boolean; seed: number}> = ({look, frame, speaking, seed}) => {
  const t = (frame + seed * 13) % 96;
  const blink = t < 5 ? 1 - Math.abs(t - 2.5) / 2.5 : 0;
  const eyeY = 1 - blink * 0.9;
  const open = speaking ? 0.5 + 0.5 * Math.sin(frame * 0.9) : 0;
  const vanara = look.face === "vanara";
  const skin = look.skin;
  const mouthY = vanara ? 38 : 32;

  return (
    <g>
      {look.halo ? (
        <g>
          <path d={star(0, -14, 158, 122, 22, frame * 0.004)} fill={C.rust} stroke={C.ink} strokeWidth={4} />
          <circle cx={0} cy={-14} r={108} fill="#1b0c06" />
          <circle cx={0} cy={-14} r={96} fill="none" stroke={C.goldLight} strokeWidth={4} strokeDasharray="0 14" strokeLinecap="round" />
        </g>
      ) : null}

      {vanara ? (
        <g>
          <path d="M -46 -40 L -80 -30 L -60 -12 L -90 4 L -62 16 L -84 38 L -50 38 Z" fill={C.mane} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
          <path d="M 46 -40 L 80 -30 L 60 -12 L 90 4 L 62 16 L 84 38 L 50 38 Z" fill={C.mane} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
        </g>
      ) : null}

      {/* ears + earrings */}
      <circle cx={-54} cy={2} r={13} fill={skin} stroke={C.ink} strokeWidth={4} />
      <circle cx={54} cy={2} r={13} fill={skin} stroke={C.ink} strokeWidth={4} />
      <circle cx={-56} cy={24} r={7} fill={C.gold} stroke={C.ink} strokeWidth={3} />
      <circle cx={56} cy={24} r={7} fill={C.gold} stroke={C.ink} strokeWidth={3} />

      {/* face */}
      <ellipse cx={0} cy={0} rx={52} ry={58} fill={skin} stroke={C.ink} strokeWidth={5} />
      {vanara ? <ellipse cx={0} cy={24} rx={36} ry={26} fill={C.cream} stroke={C.ink} strokeWidth={4} /> : null}

      {/* brows */}
      <path d="M -36 -26 L -8 -20" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
      <path d="M 36 -26 L 8 -20" stroke={C.ink} strokeWidth={8} strokeLinecap="round" />

      {/* eyes: gold-ringed, blink */}
      {[-21, 21].map((ex) => (
        <g key={ex} transform={`translate(${ex} -6) scale(1 ${eyeY})`}>
          <circle r={12} fill="#fff7e0" stroke={C.gold} strokeWidth={4} />
          <circle r={5} fill={C.ink} />
        </g>
      ))}

      {/* nose + mustache / nostrils */}
      {vanara ? (
        <g>
          <circle cx={-6} cy={20} r={2.6} fill={C.ink} />
          <circle cx={6} cy={20} r={2.6} fill={C.ink} />
        </g>
      ) : (
        <g>
          <path d="M 0 -4 L -7 18 L 7 18" fill="none" stroke={C.ink} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
          <path d="M -24 24 Q -12 14 0 24 Q 12 14 24 24" fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
          <path d="M -5 -42 L 5 -42 L 0 -28 Z" fill={C.red} />
        </g>
      )}

      {/* mouth */}
      {speaking ? (
        <ellipse cx={0} cy={mouthY + 4} rx={10 + open * 3} ry={2 + open * 9} fill={C.ink} />
      ) : (
        <path d={`M -11 ${mouthY + 2} Q 0 ${mouthY + 8} 11 ${mouthY + 2}`} fill="none" stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      )}

      {/* crown */}
      <g stroke={C.ink} strokeWidth={4} strokeLinejoin="round">
        <path d="M -32 -50 L 32 -50 L 25 -80 L -25 -80 Z" fill={C.gold} />
        <path d="M -23 -80 L 23 -80 L 18 -106 L -18 -106 Z" fill={C.goldLight} />
        <path d="M -15 -106 L 15 -106 L 10 -128 L -10 -128 Z" fill={C.gold} />
        <path d="M -5 -128 L 5 -128 L 0 -154 Z" fill={C.goldLight} />
        <path d="M -24 -112 Q -56 -132 -48 -96 Q -42 -108 -30 -100 Z" fill={C.red} />
      </g>
      <circle cx={0} cy={-66} r={4} fill={C.red} />
    </g>
  );
};

/* ========================= PUPPET CHARACTER ======================== */
export type CharSpec = {
  x: number; // pelvis x (px)
  y?: number; // pelvis y (px)
  scale?: number;
  flip?: boolean;
  look: Look | keyof typeof LOOKS;
  keys?: PoseKey[]; // pose animation keyframes (frame is local to the scene)
  speaking?: boolean;
  enterAt?: number;
  seed?: number;
  walk?: boolean | {speed?: number; run?: boolean};
};

export const PuppetCharacter: React.FC<CharSpec> = ({
  x,
  y = 1165,
  scale = 1.6,
  flip = false,
  look: lookIn,
  keys = [{f: 0, pose: "idle"}],
  speaking = false,
  enterAt = 0,
  seed = 0,
  walk = false,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const look: Look = typeof lookIn === "string" ? LOOKS[lookIn] ?? LOOKS.warrior : lookIn;
  const f = frame + seed * 23;

  const isWalking = Boolean(walk);
  const walkSpeed = typeof walk === "object" && walk.speed ? walk.speed : typeof walk === "object" && walk.run ? 0.38 : 0.22;
  const isRun = typeof walk === "object" ? Boolean(walk.run) : false;

  const basePose = blendPose(keys, frame);
  const walkData = isWalking ? calcWalkPose(frame, walkSpeed, isRun) : null;
  const pose: Pose = walkData
    ? {
        armA: walkData.pose.armA,
        armB: walkData.pose.armB,
        legA: walkData.pose.legA,
        legB: walkData.pose.legB,
        head: basePose.head + walkData.pose.head,
        lean: basePose.lean + walkData.pose.lean,
      }
    : basePose;
  const walkBob = walkData ? -walkData.bobY : 0;

  const pop = spring({frame: frame - enterAt, fps, config: {damping: 15, stiffness: 80}});
  const opacity = interpolate(frame, [enterAt, enterAt + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const breath = 1 + Math.sin(f / 16) * 0.008;
  const sway = isWalking ? 0 : Math.sin(f / 21) * 1.6;
  const bob = speaking ? Math.sin(frame * 0.45) * 2.5 : 0;

  const swayA = isWalking ? 0 : Math.sin(f / 19) * 2;
  const swayB = isWalking ? 0 : Math.cos(f / 17) * 2;
  const armA: Limb = [pose.armA[0] + swayA, pose.armA[1] + swayB];
  const armB: Limb = [pose.armB[0] + swayB, pose.armB[1] + swayA];

  const skin = look.skin;
  const dhoti = look.dhoti ?? C.red;

  const renderProp = (hand: "A" | "B") => {
    const isPrimaryHand = look.propHand ? look.propHand === hand : hand === "B";
    const isSecondaryHand = look.secondaryPropHand ? look.secondaryPropHand === hand : hand === "A";

    if (isSecondaryHand && look.secondaryProp === "shield") {
      return <Shield />;
    }
    if (isPrimaryHand) {
      if (look.prop === "mace") return <Mace />;
      if (look.prop === "sword") return <Sword />;
      if (look.prop === "shield") return <Shield />;
      if (look.prop === "bow") return <Bow />;
      if (look.prop === "spear") return <Spear />;
    }
    return null;
  };

  return (
    <g
      opacity={opacity}
      transform={`translate(${x} ${y + (1 - pop) * 140 + walkBob}) scale(${flip ? -scale : scale} ${scale})`}
    >
      {/* ground shadow */}
      <ellipse cx={0} cy={292} rx={130} ry={16} fill="#000" opacity={0.35} />

      {/* legs */}
      <Leg x={-40} y={18} a1={pose.legA[0]} a2={pose.legA[1]} sign={1} skin={skin} />
      <Leg x={40} y={18} a1={pose.legB[0]} a2={pose.legB[1]} sign={-1} skin={skin} />

      {/* dhoti */}
      <path d="M -82 -14 L 82 -14 L 98 138 L 0 162 L -98 138 Z" fill={dhoti} stroke={C.ink} strokeWidth={5} strokeLinejoin="round" />
      <path d="M -70 20 Q -36 40 -2 20 M 2 20 Q 36 40 70 20" fill="none" stroke={C.goldLight} strokeWidth={4} strokeDasharray="0 12" strokeLinecap="round" />
      <path d="M -13 -10 L 13 -10 L 0 128 Z" fill={C.gold} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />

      {/* upper body (leans around the pelvis) */}
      <g transform={`rotate(${pose.lean + sway * 0.4}) scale(1 ${breath})`}>
        {/* torso */}
        <path
          d="M -98 -196 Q -98 -228 -62 -228 L 62 -228 Q 98 -228 98 -196 L 72 -28 Q 0 -6 -72 -28 Z"
          fill={skin}
          stroke={C.ink}
          strokeWidth={5}
          strokeLinejoin="round"
        />
        <path d="M -62 -170 Q -34 -150 -6 -170 M 6 -170 Q 34 -150 62 -170" fill="none" stroke={C.ink} strokeWidth={3.5} opacity={0.5} strokeLinecap="round" />
        <path d="M -78 -214 L 64 -34" stroke={C.cream} strokeWidth={6} opacity={0.85} strokeLinecap="round" />
        <rect x={-76} y={-44} width={152} height={26} rx={8} fill={C.gold} stroke={C.ink} strokeWidth={4} />
        <circle cx={0} cy={-31} r={6} fill={C.red} stroke={C.ink} strokeWidth={2} />

        {/* arms */}
        <Arm x={-96} y={-196} a1={armA[0]} a2={armA[1]} sign={1} skin={skin} prop={renderProp("A")} />
        <Arm x={96} y={-196} a1={armB[0]} a2={armB[1]} sign={-1} skin={skin} prop={renderProp("B")} />

        {/* neck + head */}
        <rect x={-14} y={-246} width={28} height={30} rx={8} fill={skin} stroke={C.ink} strokeWidth={4} />
        <g transform={`translate(0 ${-266 + bob}) rotate(${pose.head + Math.sin(f / 33) * 1.5})`}>
          <Head look={look} frame={frame} speaking={speaking} seed={seed} />
        </g>
      </g>
    </g>
  );
};

/* ============================ BACKGROUND =========================== */
const Diya: React.FC<{x: number; y: number; frame: number; seed?: number}> = ({x, y, frame, seed = 0}) => {
  const f = frame + seed * 11;
  const flick = 1 + Math.sin(f * 0.7 + 1.3) * 0.08 + Math.sin(f * 1.9) * 0.05;
  const skew = Math.sin(f * 0.5) * 4;
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse cx={0} cy={-300} rx={60} ry={80} fill={C.amber} opacity={0.18} filter="url(#blur30)" />
      {/* stand */}
      <path d="M -70 0 L 70 0 L 50 -22 L -50 -22 Z" fill={C.gold} stroke={C.ink} strokeWidth={4} />
      <rect x={-12} y={-250} width={24} height={230} fill={C.gold} stroke={C.ink} strokeWidth={4} />
      {[-70, -130, -190].map((yy) => (
        <ellipse key={yy} cx={0} cy={yy} rx={26} ry={10} fill={C.goldLight} stroke={C.ink} strokeWidth={4} />
      ))}
      <path d="M -62 -262 Q 0 -230 62 -262 L 40 -250 L -40 -250 Z" fill={C.gold} stroke={C.ink} strokeWidth={4} />
      {/* flame */}
      <g transform={`translate(0 -262) skewX(${skew}) scale(1 ${flick})`}>
        <path d="M 0 0 C 16 -18 13 -44 0 -70 C -13 -44 -16 -18 0 0 Z" fill={C.orange} stroke={C.ink} strokeWidth={3} />
        <path d="M 0 -4 C 8 -14 6 -28 0 -42 C -6 -28 -8 -14 0 -4 Z" fill={C.goldLight} />
      </g>
    </g>
  );
};

export const TempleBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 0.55 + Math.sin(frame / 22) * 0.08;
  const rays = frame * 0.12;
  const cx = 540;
  const base = 1560;

  return (
    <g>
      <defs>
        <radialGradient id="warm" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f0a540" stopOpacity="0.75" />
          <stop offset="60%" stopColor="#a8501a" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="door" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f2b55a" />
          <stop offset="100%" stopColor="#7a3f18" />
        </linearGradient>
        <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a1d0c" />
          <stop offset="100%" stopColor="#0c0603" />
        </linearGradient>
        <filter id="blur30" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="30" />
        </filter>
        <filter id="blur8" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      {/* base wall */}
      <rect x={-500} y={-500} width={2080} height={2920} fill={C.night} />
      <rect x={-500} y={-500} width={2080} height={2920} fill={C.umber} opacity={0.55} />

      {/* side panels + medallions + pillars */}
      {[0, 1].map((side) => {
        const m = side === 0 ? 1 : -1;
        const ox = side === 0 ? 0 : 1080;
        const px = (v: number) => ox + m * v;
        return (
          <g key={side}>
            <rect x={side === 0 ? -40 : 1080 - 200} y={620} width={240} height={940} rx={24} fill="#1a0d05" stroke={C.goldDark} strokeWidth={3} opacity={0.75} />
            {[760, 1150, 1500].map((cy) => (
              <g key={cy}>
                <circle cx={px(95)} cy={cy} r={54} fill={C.rust} opacity={0.5} />
                <circle cx={px(95)} cy={cy} r={42} fill="none" stroke={C.gold} strokeWidth={6} />
              </g>
            ))}
            <rect x={side === 0 ? 205 : 1080 - 205 - 62} y={700} width={62} height={860} fill="#2a1409" />
            {[820, 1210].map((by) => (
              <rect key={by} x={side === 0 ? 190 : 1080 - 190 - 92} y={by} width={92} height={22} fill={C.gold} stroke={C.ink} strokeWidth={3} />
            ))}
          </g>
        );
      })}

      {/* big warm glow */}
      <ellipse cx={cx} cy={1100} rx={760} ry={980} fill="url(#warm)" opacity={pulse} />

      {/* arch bands */}
      <path d={arch(cx, base, 560, 640)} fill={C.red} stroke={C.ink} strokeWidth={4} />
      <path d={arch(cx, base, 520, 668)} fill={C.gold} stroke={C.ink} strokeWidth={3} />
      <path d={arch(cx, base, 470, 704)} fill={C.orange} stroke={C.ink} strokeWidth={3} />
      <path d={arch(cx, base, 430, 728)} fill={C.gold} stroke={C.ink} strokeWidth={3} />
      <path d={arch(cx, base, 380, 764)} fill="url(#door)" stroke={C.ink} strokeWidth={4} />
      <path d={arch(cx, base, 495, 686, false)} fill="none" stroke={C.goldLight} strokeWidth={6} strokeDasharray="0 17" strokeLinecap="round" />
      <path d={arch(cx, base, 405, 746, false)} fill="none" stroke={C.goldLight} strokeWidth={6} strokeDasharray="0 17" strokeLinecap="round" />

      {/* sun emblem */}
      <circle cx={cx} cy={585} r={110} fill={C.amber} opacity={0.25} filter="url(#blur30)" />
      <g transform={`rotate(${rays} ${cx} 585)`}>
        <path d={star(cx, 585, 84, 56, 16)} fill={C.gold} stroke={C.ink} strokeWidth={4} strokeLinejoin="round" />
      </g>
      <circle cx={cx} cy={585} r={46} fill={C.amber} stroke={C.goldLight} strokeWidth={5} />
      <circle cx={cx} cy={585} r={32} fill="none" stroke={C.goldLight} strokeWidth={4} strokeDasharray="0 9" strokeLinecap="round" />

      {/* floor */}
      <rect x={-500} y={base} width={2080} height={500} fill="url(#floor)" />
      <rect x={-500} y={base} width={2080} height={5} fill={C.goldDark} opacity={0.7} />

      {/* diyas */}
      <Diya x={105} y={base} frame={frame} seed={0} />
      <Diya x={975} y={base} frame={frame} seed={4} />
    </g>
  );
};

/* ========================= LIGHT / DUST / GRAIN ==================== */
export const GoldDust: React.FC<{count?: number}> = ({count = 38}) => {
  const frame = useCurrentFrame();
  const dots = Array.from({length: count}, (_, i) => {
    const speed = 0.5 + random(`ds${i}`) * 1.4;
    const yRaw = random(`dy${i}`) * 1920 - frame * speed;
    const y = ((yRaw % 1920) + 1920) % 1920;
    const x = random(`dx${i}`) * 1080 + Math.sin(frame / 40 + i) * 18;
    const r = 1.5 + random(`dr${i}`) * 3.5;
    const tw = 0.25 + 0.75 * (0.5 + 0.5 * Math.sin(frame / 9 + i * 1.7));
    return <circle key={i} cx={x} cy={y} r={r} fill={C.goldLight} opacity={tw * 0.8} />;
  });
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1920">
        {dots}
      </svg>
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background: "radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)",
    }}
  />
);

export const Grain: React.FC<{opacity?: number}> = ({opacity = 0.07}) => (
  <AbsoluteFill style={{pointerEvents: "none", opacity, mixBlendMode: "overlay"}}>
    <svg width="100%" height="100%">
      <filter id="grainF">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grainF)" />
    </svg>
  </AbsoluteFill>
);

/* ============================= CAMERA ============================== */
export type CameraSpec = {
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  z0?: number;
  z1?: number;
  shake?: number;
};

export const Camera: React.FC<CameraSpec & {duration: number; children: React.ReactNode}> = ({
  x0 = 0,
  x1 = 0,
  y0 = 0,
  y1 = 0,
  z0 = 1.08,
  z1 = 1.08,
  shake = 0,
  duration,
  children,
}) => {
  const frame = useCurrentFrame();
  const t = ease(clamp(frame / Math.max(1, duration), 0, 1));
  const sx = shake ? Math.sin(frame * 1.7) * shake + Math.sin(frame * 3.1) * shake * 0.5 : 0;
  const sy = shake ? Math.cos(frame * 2.3) * shake : 0;
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${lerp(x0, x1, t) + sx}px, ${lerp(y0, y1, t) + sy}px) scale(${lerp(z0, z1, t)})`,
        transformOrigin: "50% 55%",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/* ============================ SUBTITLE ============================= */
// Tip: for Hindi (Devanagari) add a font, e.g. @remotion/google-fonts/NotoSerifDevanagari,
// and put its family first in `fontFamily` below.
export const Subtitle: React.FC<{text: string; start?: number; stagger?: number; top?: number; fontFamily?: string}> = ({
  text,
  start = 4,
  stagger = 5,
  top = 340,
  fontFamily = '"Cinzel","Trajan Pro","Cormorant SC",Georgia,serif',
}) => {
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      <div
        style={{
          position: "absolute",
          top,
          left: 60,
          right: 60,
          textAlign: "center",
          fontFamily,
          fontVariant: "small-caps",
          fontWeight: 700,
          fontSize: 84,
          lineHeight: 1.15,
          letterSpacing: "0.04em",
          filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.75))",
        }}
      >
        {words.map((w, i) => {
          const s = start + i * stagger;
          const op = interpolate(frame, [s, s + 8], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
          const dy = interpolate(frame, [s, s + 10], [16, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                marginRight: "0.28em",
                opacity: op,
                transform: `translateY(${dy}px)`,
                background: `linear-gradient(180deg, #ffffff 25%, ${C.tealText} 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                color: "transparent",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ============================ SCENES =============================== */
export type SceneSpec = {
  text: string;
  duration: number; // frames
  characters?: CharSpec[];
  camera?: CameraSpec;
  subtitleStart?: number;
};

export const StoryScene: React.FC<{scene: SceneSpec}> = ({scene}) => (
  <AbsoluteFill style={{backgroundColor: C.night}}>
    <Camera {...scene.camera} duration={scene.duration}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{overflow: "visible"}}>
        <TempleBackground />
        {(scene.characters ?? []).map((c, i) => (
          <PuppetCharacter key={i} {...c} />
        ))}
      </svg>
    </Camera>
    <GoldDust />
    <Vignette />
    <Grain />
    <Subtitle text={scene.text} start={scene.subtitleStart} />
  </AbsoluteFill>
);

export const PuppetKitScene: React.FC<{s: any; plan?: any; index?: number}> = ({s, plan, index = 0}) => {
  const {fps} = useVideoConfig();
  const dur = Math.max(30, Math.round((s.durationSec || 4) * fps));
  const text = s.narration || s.tts_text || "";

  let characters: CharSpec[] = [];
  let camera: CameraSpec = {z0: 1.08, z1: 1.08};

  if (index === 0) {
    camera = {x0: -60, x1: 50, z0: 1.14, z1: 1.08};
    characters = [
      {
        x: 540,
        look: "warrior",
        scale: 1.55,
        enterAt: 4,
        speaking: true,
        keys: [
          {f: 0, pose: "mace"},
          {f: Math.round(dur * 0.4), pose: "mace"},
          {f: Math.round(dur * 0.7), pose: "raiseA"},
          {f: dur, pose: "raiseA"},
        ],
      },
    ];
  } else if (index === 1) {
    camera = {z0: 1.0, z1: 1.12, y0: 0, y1: 30};
    characters = [
      {
        x: 320,
        look: "warrior",
        scale: 1.35,
        speaking: true,
        keys: [
          {f: 0, pose: "mace"},
          {f: Math.round(dur * 0.5), pose: "point"},
          {f: dur, pose: "point"},
        ],
      },
      {
        x: 780,
        look: "king",
        scale: 1.35,
        flip: true,
        enterAt: 6,
        keys: [
          {f: 0, pose: "idle"},
          {f: Math.round(dur * 0.5), pose: "guard"},
          {f: dur, pose: "guard"},
        ],
      },
    ];
  } else if (index === 2) {
    camera = {x0: 40, x1: -40, z0: 1.1, z1: 1.1};
    characters = [
      {
        x: 310,
        look: "warrior",
        scale: 1.35,
        speaking: true,
        keys: [
          {f: 0, pose: "point"},
          {f: Math.round(dur * 0.4), pose: "angry"},
          {f: dur, pose: "angry"},
        ],
      },
      {
        x: 770,
        look: "king",
        scale: 1.35,
        flip: true,
        keys: [
          {f: 0, pose: "guard"},
          {f: Math.round(dur * 0.5), pose: "bow"},
          {f: dur, pose: "bow"},
        ],
      },
    ];
  } else if (index === 3) {
    camera = {z0: 1.08, z1: 1.15, shake: 5};
    characters = [
      {
        x: 330,
        look: "warrior",
        scale: 1.4,
        speaking: true,
        keys: [
          {f: 0, pose: "mace"},
          {f: Math.round(dur * 0.3), pose: "angry"},
          {f: Math.round(dur * 0.7), pose: "raiseA"},
          {f: dur, pose: "raiseA"},
        ],
      },
      {
        x: 760,
        look: "king",
        scale: 1.35,
        flip: true,
        keys: [
          {f: 0, pose: "guard"},
          {f: Math.round(dur * 0.6), pose: "guard"},
          {f: dur, pose: "idle"},
        ],
      },
    ];
  } else {
    camera = {x0: 0, x1: 0, z0: 1.05, z1: 1.12};
    characters = [
      {
        x: 350,
        look: "warrior",
        scale: 1.4,
        speaking: true,
        keys: [
          {f: 0, pose: "mace"},
          {f: Math.round(dur * 0.5), pose: "raiseA"},
          {f: dur, pose: "raiseA"},
        ],
      },
      {
        x: 750,
        look: "king",
        scale: 1.4,
        flip: true,
        keys: [
          {f: 0, pose: "idle"},
          {f: Math.round(dur * 0.5), pose: "bow"},
          {f: dur, pose: "bow"},
        ],
      },
    ];
  }

  const spec: SceneSpec = {
    text,
    duration: dur,
    characters,
    camera,
    subtitleStart: 4,
  };

  return <StoryScene scene={spec} />;
};

export const totalFrames = (scenes: SceneSpec[]) => scenes.reduce((a, s) => a + s.duration, 0);

export const PuppetStory: React.FC<{scenes?: SceneSpec[]}> = ({scenes = DEMO_SCENES}) => {
  let from = 0;
  return (
    <AbsoluteFill style={{backgroundColor: C.night}}>
      {scenes.map((s, i) => {
        const el = (
          <Sequence key={i} from={from} durationInFrames={s.duration}>
            <StoryScene scene={s} />
          </Sequence>
        );
        from += s.duration;
        return el;
      })}
    </AbsoluteFill>
  );
};

/* ============================= DEMO ================================ */
// Replace these with scenes generated by your LLM plan (same shape).
export const DEMO_SCENES: SceneSpec[] = [
  {
    text: "In the temple of dawn,",
    duration: 105,
    camera: {x0: -70, x1: 60, z0: 1.14, z1: 1.08},
  },
  {
    text: "stood a lone guardian.",
    duration: 150,
    camera: {z0: 1.0, z1: 1.14, y0: 0, y1: 40},
    characters: [
      {
        x: 540,
        look: "warrior",
        scale: 1.55,
        enterAt: 6,
        keys: [
          {f: 0, pose: "mace"},
          {f: 40, pose: "mace"},
          {f: 80, pose: "raiseA"},
          {f: 150, pose: "raiseA"},
        ],
      },
    ],
  },
  {
    text: "And he never backed down.",
    duration: 180,
    camera: {x0: 50, x1: -50, z0: 1.1, z1: 1.1},
    characters: [
      {
        x: 300,
        look: "warrior",
        scale: 1.35,
        seed: 1,
        speaking: true,
        keys: [
          {f: 0, pose: "mace"},
          {f: 60, pose: "point"},
          {f: 120, pose: "angry"},
        ],
      },
      {
        x: 790,
        look: "king",
        scale: 1.35,
        flip: true,
        seed: 3,
        enterAt: 10,
        keys: [
          {f: 0, pose: "idle"},
          {f: 70, pose: "guard"},
          {f: 130, pose: "bow"},
        ],
      },
    ],
  },
];

