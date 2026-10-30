import React from "react";
import {AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import type {Plan, Scene} from "./Video";

/*
 * Two automatic scene types for MINDSPARK:
 *   "story"     -> parallax motion-comic scene (layered landscape + big animated text)
 *   "character" -> "Spark" mascot talking in front of a parallax backdrop (mouth follows narration words)
 * Everything is drawn in code (SVG) from the theme colors, so no images/APIs are needed and
 * every video automatically gets a different look.
 */

type SP = {s: Scene; plan: Plan; u: number};

export const STORY_SETTINGS = ["mountains", "city", "forest", "ocean", "night_sky"];
export const MOODS = ["happy", "thinking", "surprised", "determined"];
export const PROPS = ["none", "book", "bulb", "coin"];

const TRANS = 18; // keep in sync with Video.tsx
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const alpha = (hex: string, a: number) => (/^#[0-9a-f]{6}$/i.test(hex) ? hex + Math.round(a * 255).toString(16).padStart(2, "0") : hex);

const bright = (hex: string) => {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return "#FFE9A8";
  const n = parseInt(hex.slice(1), 16); const l = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return l > 0.45 ? hex : "#FFE9A8";
};

const hashStr = (str: string) => {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {h ^= str.charCodeAt(i); h = Math.imul(h, 16777619);}
  return h >>> 0;
};
const rng = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* ---------- shape generators (viewBox height is always 100, width vw) ---------- */
const smoothRidge = (vw: number, r: () => number, base: number, amp: number, step: number) => {
  const pts: [number, number][] = [];
  for (let x = 0; x <= vw + step; x += step) pts.push([x, base - r() * amp]);
  let d = `M0,100 L0,${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1]; const [x, y] = pts[i];
    d += ` Q${((px + x) / 2).toFixed(1)},${(Math.min(py, y) - amp * 0.12).toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return `${d} L${pts[pts.length - 1][0].toFixed(1)},100 Z`;
};
const jaggedRidge = (vw: number, r: () => number, base: number, amp: number, step: number) => {
  let d = `M0,100 L0,${base.toFixed(1)}`;
  for (let x = 0; x <= vw + step; x += step) {
    d += ` L${(x + step * 0.5).toFixed(1)},${(base - amp * (0.45 + 0.55 * r())).toFixed(1)} L${(x + step).toFixed(1)},${(base - amp * 0.12 * r()).toFixed(1)}`;
  }
  return `${d} L${(vw + step * 2).toFixed(1)},100 Z`;
};

type DrawFn = (vw: number, r: () => number, f: number) => React.ReactNode;

const Layer: React.FC<{draw: DrawFn; seed: number; h: number; b: number; sp: number; frames: number; fill: string; op: number; dir?: 1 | -1}> =
  ({draw, seed, h, b, sp, frames, fill, op, dir = 1}) => {
    const f = useCurrentFrame(); const {width, height} = useVideoConfig();
    const u = Math.min(width, height * 0.7) / 100;
    const lh = height * h; const pan = sp * u * frames; const lw = width + pan + 2 * u; const vw = (100 * lw) / lh;
    const off = sp * u * f; const x = dir === 1 ? -off : -(pan - off);
    return (
      <svg width={lw} height={lh} viewBox={`0 0 ${vw.toFixed(1)} 100`} preserveAspectRatio="none"
        style={{position: "absolute", left: 0, bottom: height * b, transform: `translateX(${x.toFixed(1)}px)`, overflow: "visible"}}>
        <g fill={fill} opacity={op}>{draw(vw, rng(seed), f)}</g>
      </svg>
    );
  };

const drawMountains: DrawFn = (vw, r) => <path d={jaggedRidge(vw, r, 80, 70, 14)} />;
const drawHills: DrawFn = (vw, r) => <path d={smoothRidge(vw, r, 70, 40, 18)} />;
const drawFlat: DrawFn = (vw, r) => <path d={smoothRidge(vw, r, 62, 22, 26)} />;

const buildings = (lit: boolean, accent: string): DrawFn => (vw, r, f) => {
  const out: React.ReactNode[] = []; let x = 0; let i = 0;
  while (x < vw + 10) {
    const w = 7 + r() * 8; const hh = 35 + r() * 62; const top = 100 - hh;
    out.push(<rect key={`b${i}`} x={x} y={top} width={w - 0.6} height={hh + 2} />);
    if (lit) {
      for (let wy = top + 4; wy < 94; wy += 6) for (let wx = x + 1.4; wx < x + w - 2.4; wx += 3.2) {
        const on = (Math.floor(wx * 7 + wy * 3 + Math.floor(f / 24)) % 5) < 2;
        if (on) out.push(<rect key={`w${i}-${wx.toFixed(1)}-${wy}`} x={wx} y={wy} width={1.6} height={2.6} fill={accent} opacity={0.9} />);
      }
    }
    x += w; i++;
  }
  return out;
};

const pines = (tall: number): DrawFn => (vw, r) => {
  const out: React.ReactNode[] = []; let x = -4; let i = 0;
  while (x < vw + 8) {
    const w = 7 + r() * 7; const hh = tall * (0.5 + 0.5 * r()); const top = 100 - hh;
    out.push(<path key={i} d={`M${x},100 L${x + w * 0.5},${top} L${x + w},100 Z`} />);
    out.push(<path key={`t${i}`} d={`M${x + w * 0.1},${top + hh * 0.45} L${x + w * 0.5},${top + hh * 0.05} L${x + w * 0.9},${top + hh * 0.45} Z`} />);
    x += w * (0.55 + 0.3 * r()); i++;
  }
  out.push(<rect key="g" x={0} y={92} width={vw + 10} height={10} />);
  return out;
};

const waves = (base: number, amp: number, k: number, speed: number, boat = false): DrawFn => (vw, r, f) => {
  let d = `M0,100 L0,${base}`; const ph = f * speed; const r0 = r() * 6;
  for (let x = 0; x <= vw + 2; x += 2) d += ` L${x},${(base + Math.sin((x + ph + r0) * k) * amp).toFixed(2)}`;
  d += ` L${vw + 2},100 Z`;
  const bx = vw * 0.42; const by = base + Math.sin((bx + ph + r0) * k) * amp;
  return (<>
    <path d={d} />
    {boat && <g transform={`translate(${bx.toFixed(1)} ${(by - 2).toFixed(1)}) rotate(${(Math.sin(f * 0.07) * 4).toFixed(2)})`}>
      <path d="M-7,0 L7,0 L5,4 L-5,4 Z" /><path d="M0,-12 L0,-1 L6,-1 Z" /><path d="M-1,-11 L-1,-1 L-6,-1 Z" opacity={0.7} />
    </g>}
  </>);
};

const clouds: DrawFn = (vw, r) => {
  const out: React.ReactNode[] = []; let x = 0; let i = 0;
  while (x < vw + 20) {
    const cy = 40 + r() * 30; const s = 0.8 + r() * 1.1;
    out.push(<g key={i}><ellipse cx={x} cy={cy} rx={10 * s} ry={5 * s} /><ellipse cx={x + 7 * s} cy={cy - 3 * s} rx={7 * s} ry={5 * s} /><ellipse cx={x - 7 * s} cy={cy - 1.5 * s} rx={6 * s} ry={4 * s} /></g>);
    x += 38 + r() * 40; i++;
  }
  return out;
};

/* ---------- sky, stars, particles ---------- */
const Stars: React.FC<{seed: number; n: number; u: number; top: number}> = ({seed, n, u, top}) => {
  const f = useCurrentFrame(); const {width, height} = useVideoConfig(); const r = rng(seed ^ 0x5bd1e995);
  return (
    <svg width={width} height={height} style={{position: "absolute", inset: 0}}>
      {Array.from({length: n}, (_, i) => {
        const x = r() * width; const y = r() * height * top; const rad = (0.2 + r() * 0.4) * u; const ph = r() * 6;
        return <circle key={i} cx={x} cy={y} r={rad} fill="#fff" opacity={0.25 + 0.7 * Math.abs(Math.sin(f * 0.06 + ph))} />;
      })}
    </svg>
  );
};

const Dust: React.FC<{seed: number; n: number; u: number; color: string; fire?: boolean}> = ({seed, n, u, color, fire}) => {
  const f = useCurrentFrame(); const {width, height} = useVideoConfig(); const r = rng(seed ^ 0x2545f491);
  return (
    <svg width={width} height={height} style={{position: "absolute", inset: 0}}>
      {Array.from({length: n}, (_, i) => {
        const x0 = r() * width; const y0 = r() * height; const sp = 0.15 + r() * 0.4; const ph = r() * 6; const rad = (0.3 + r() * 0.5) * u;
        const y = fire ? height * (0.5 + 0.4 * ((y0 / height + Math.sin(f * 0.02 + ph) * 0.04) % 1)) : ((y0 - f * sp * u * 0.6) % height + height) % height;
        const x = x0 + Math.sin(f * 0.03 + ph) * 3 * u;
        const o = fire ? 0.2 + 0.8 * Math.abs(Math.sin(f * 0.07 + ph)) : 0.35;
        return <circle key={i} cx={x} cy={y} r={rad} fill={color} opacity={o} />;
      })}
    </svg>
  );
};

const Celestial: React.FC<{kind: "sun" | "moon"; x: number; y0: number; y1: number; size: number; frames: number; color: string; u: number}> = ({kind, x, y0, y1, size, frames, color, u}) => {
  const f = useCurrentFrame(); const {width, height} = useVideoConfig();
  const y = interpolate(f, [0, frames], [y0, y1], {extrapolateRight: "clamp"}) * height; const d = size * u;
  return (
    <div style={{position: "absolute", left: x * width - d / 2, top: y - d / 2, width: d, height: d, borderRadius: "50%", background: color,
      boxShadow: `0 0 ${d * 0.5}px ${d * 0.18}px ${alpha(color, 0.55)}, 0 0 ${d * 1.4}px ${d * 0.4}px ${alpha(color, 0.2)}`}}>
      {kind === "moon" && (<>
        <div style={{position: "absolute", left: "22%", top: "30%", width: "18%", height: "18%", borderRadius: "50%", background: "rgba(0,0,0,0.10)"}} />
        <div style={{position: "absolute", left: "55%", top: "55%", width: "24%", height: "24%", borderRadius: "50%", background: "rgba(0,0,0,0.08)"}} />
      </>)}
    </div>
  );
};

const ShootingStar: React.FC<{start: number; color: string; u: number}> = ({start, color, u}) => {
  const f = useCurrentFrame(); const {width, height} = useVideoConfig();
  const p = clamp((f - start) / 26); if (p <= 0 || p >= 1) return null;
  const x = interpolate(p, [0, 1], [width * 1.0, width * 0.15]); const y = interpolate(p, [0, 1], [height * 0.08, height * 0.34]);
  return <div style={{position: "absolute", left: x, top: y, width: 22 * u, height: 0.5 * u, transformOrigin: "0 50%", transform: "rotate(-34deg) translateX(0)",
    background: `linear-gradient(90deg, ${color}, transparent)`, opacity: Math.sin(p * Math.PI), boxShadow: `0 0 ${2 * u}px ${color}`}} />;
};

/* ---------- full backdrop ---------- */
const Backdrop: React.FC<{setting: string; seed: number; frames: number; plan: Plan; u: number; dim?: number}> = ({setting, seed, frames, plan, u, dim = 0}) => {
  const f = useCurrentFrame(); const {width, height} = useVideoConfig(); const c = plan.theme.colors;
  const tx = c.tx; const L = (p: {k: string; draw: DrawFn; h: number; b: number; sp: number; op: number; dir?: 1 | -1; fill?: string}) =>
    <Layer key={p.k} draw={p.draw} seed={seed + p.k.length * 977 + Math.round(p.sp * 100)} h={p.h} b={p.b} sp={p.sp} frames={frames} fill={p.fill || tx} op={p.op} dir={p.dir} />;
  const prog = Easing.inOut(Easing.quad)(clamp(f / Math.max(1, frames)));
  let sky: React.ReactNode = null; let layers: React.ReactNode = null; let extra: React.ReactNode = null;

  if (setting === "city") {
    sky = (<><Stars seed={seed} n={36} u={u} top={0.45} /><Celestial kind="moon" x={0.74} y0={0.24} y1={0.2} size={17} frames={frames} color="#FFF6D6" u={u} /></>);
    layers = (<>{L({k: "far", draw: buildings(false, c.ac), h: 0.36, b: 0.24, sp: 0.1, op: 0.16})}{L({k: "mid", draw: buildings(true, c.ac), h: 0.32, b: 0.15, sp: 0.24, op: 0.3, dir: -1})}{L({k: "near", draw: buildings(true, c.ac), h: 0.27, b: 0.04, sp: 0.5, op: 0.55})}</>);
  } else if (setting === "forest") {
    sky = (<><Stars seed={seed} n={22} u={u} top={0.35} /><Celestial kind="moon" x={0.78} y0={0.2} y1={0.17} size={13} frames={frames} color="#FFF0C2" u={u} /></>);
    layers = (<>{L({k: "far", draw: pines(55), h: 0.3, b: 0.27, sp: 0.1, op: 0.16})}{L({k: "mid", draw: pines(70), h: 0.34, b: 0.16, sp: 0.25, op: 0.3, dir: -1})}{L({k: "near", draw: pines(90), h: 0.4, b: 0.0, sp: 0.55, op: 0.6})}</>);
    extra = <Dust seed={seed} n={16} u={u} color={c.ac} fire />;
  } else if (setting === "ocean") {
    sky = <Celestial kind="sun" x={0.5} y0={0.4} y1={0.45} size={26} frames={frames} color={bright(c.ac)} u={u} />;
    layers = (<>{L({k: "w1", draw: waves(55, 3, 0.35, 0.5), h: 0.14, b: 0.34, sp: 0.12, op: 0.16})}{L({k: "w2", draw: waves(50, 4, 0.28, 0.8, true), h: 0.16, b: 0.25, sp: 0.22, op: 0.26, dir: -1})}{L({k: "w3", draw: waves(48, 5, 0.22, 1.1), h: 0.18, b: 0.12, sp: 0.38, op: 0.4})}{L({k: "w4", draw: waves(46, 6, 0.18, 1.5), h: 0.2, b: 0.0, sp: 0.6, op: 0.58, dir: -1})}</>);
  } else if (setting === "night_sky") {
    sky = (<><Stars seed={seed} n={70} u={u} top={0.7} /><Celestial kind="moon" x={0.3} y0={0.3} y1={0.26} size={30} frames={frames} color="#FFF6D6" u={u} /><ShootingStar start={Math.round(frames * 0.35)} color={c.ac} u={u} /></>);
    layers = (<>{L({k: "c1", draw: clouds, h: 0.12, b: 0.52, sp: 0.18, op: 0.1})}{L({k: "c2", draw: clouds, h: 0.14, b: 0.38, sp: 0.32, op: 0.08, dir: -1})}{L({k: "h1", draw: drawHills, h: 0.2, b: 0.08, sp: 0.25, op: 0.3})}{L({k: "h2", draw: drawFlat, h: 0.18, b: 0.0, sp: 0.5, op: 0.55})}</>);
  } else {
    sky = <Celestial kind="sun" x={0.66} y0={0.46} y1={0.36} size={22} frames={frames} color={bright(c.ac)} u={u} />;
    layers = (<>{L({k: "far", draw: drawMountains, h: 0.32, b: 0.27, sp: 0.1, op: 0.15})}{L({k: "mid", draw: drawMountains, h: 0.3, b: 0.18, sp: 0.24, op: 0.28, dir: -1})}{L({k: "hill", draw: drawHills, h: 0.26, b: 0.08, sp: 0.42, op: 0.42})}{L({k: "near", draw: drawFlat, h: 0.22, b: 0.0, sp: 0.62, op: 0.6, dir: -1})}</>);
    extra = <Birds seed={seed} u={u} frames={frames} />;
  }

  return (
    <AbsoluteFill style={{background: `linear-gradient(180deg,${c.bg1},${c.bg2})`}}>
      <AbsoluteFill style={{transform: `scale(${1 + 0.09 * prog}) translateY(${-prog * 1.2 * u}px)`, transformOrigin: "50% 70%"}}>
        {sky}{layers}{extra}
        {setting !== "forest" && <Dust seed={seed + 3} n={14} u={u} color={tx} />}
      </AbsoluteFill>
      {dim > 0 && <AbsoluteFill style={{background: alpha(c.bg1, dim)}} />}
      <AbsoluteFill style={{background: "radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.32) 100%)"}} />
    </AbsoluteFill>
  );
};

const Birds: React.FC<{seed: number; u: number; frames: number}> = ({seed, u, frames}) => {
  const f = useCurrentFrame(); const {width, height} = useVideoConfig(); const c = "#1B1B3A"; const r = rng(seed ^ 77);
  return (
    <svg width={width} height={height} style={{position: "absolute", inset: 0}}>
      {Array.from({length: 4}, (_, i) => {
        const y0 = (0.14 + r() * 0.16) * height; const delay = i * 14; const p = ((f + delay * 3) / (frames + 60));
        const x = width * 1.1 - p * width * 1.3; const y = y0 + Math.sin(f * 0.08 + i) * 1.5 * u; const flap = Math.sin(f * 0.35 + i * 2) * 1.1 * u; const s = (0.8 + r() * 0.5) * u;
        return <path key={i} d={`M${x - 3 * s},${y - flap} Q${x - 1.5 * s},${y - 1.8 * s} ${x},${y} Q${x + 1.5 * s},${y - 1.8 * s} ${x + 3 * s},${y - flap}`} stroke={c} strokeWidth={0.35 * u} fill="none" opacity={0.55} strokeLinecap="round" />;
      })}
    </svg>
  );
};

/* ---------- "story" scene ---------- */
export const StoryScene: React.FC<SP> = ({s, plan, u}) => {
  const f = useCurrentFrame(); const {fps, height} = useVideoConfig(); const c = plan.theme.colors; const d = s.data || {};
  const setting = STORY_SETTINGS.includes(d.setting) ? d.setting : "mountains";
  const text = String(d.text || ""); const words = text.split(" ").filter(Boolean);
  const frames = Math.round(s.durationSec * fps) + TRANS; const seed = hashStr(text + setting);
  const hl = String(d.hl || "").toLowerCase(); let hi = words.findIndex((w) => hl && w.toLowerCase().replace(/[^a-z0-9%]/g, "") === hl.replace(/[^a-z0-9%]/g, ""));
  if (hi < 0) hi = words.length - 1;
  const left = plan.theme.layout === "left"; const fs = (words.length > 7 ? 8.2 : 9.8) * u;
  const tag = d.tag ? String(d.tag) : "";
  return (
    <AbsoluteFill>
      <Backdrop setting={setting} seed={seed} frames={frames} plan={plan} u={u} />
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${alpha(c.bg1, 0.62)} 0%, ${alpha(c.bg1, 0)} 48%)`}} />
      <div style={{position: "absolute", left: 7 * u, right: 7 * u, top: height * 0.1, display: "flex", flexDirection: "column", alignItems: left ? "flex-start" : "center", textAlign: left ? "left" : "center", gap: 3 * u}}>
        {tag && <span style={{fontSize: 3.6 * u, letterSpacing: 0.5 * u, padding: `${0.8 * u}px ${2.4 * u}px`, borderRadius: 99, background: c.ac, color: c.bg1, opacity: clamp(f / 8), transform: `translateY(${(1 - clamp(f / 8)) * -2 * u}px)`}}>{tag}</span>}
        <div style={{fontSize: fs, lineHeight: 1.08, color: c.tx, textShadow: `0 ${0.4 * u}px ${1.4 * u}px rgba(0,0,0,0.28)`}}>
          {words.map((w, i) => {
            const sp = clamp(spring({frame: Math.max(0, f - 6 - i * 4), fps, config: {damping: 11, mass: 0.6}}), 0, 1.15);
            return <span key={i} style={{display: "inline-block", marginRight: 2.2 * u, opacity: clamp(sp * 2), color: i === hi ? c.ac : c.tx, transform: `translateY(${(1 - sp) * 5 * u}px) scale(${0.6 + 0.4 * sp})`}}>{w}</span>;
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- "Spark" mascot ---------- */
const OUT = "#1B1B3A"; const BODY = "#FFD23F"; const SPARK = "#FF7A00";

const Arm: React.FC<{side: "l" | "r"; angle: number}> = ({side, angle}) => {
  const sx = side === "l" ? 34 : 66; const d = side === "l" ? `M${sx},86 Q${sx - 10},96 ${sx - 12},108` : `M${sx},86 Q${sx + 10},96 ${sx + 12},108`;
  const hx = side === "l" ? sx - 12 : sx + 12;
  return (
    <g transform={`rotate(${angle.toFixed(1)} ${sx} 86)`}>
      <path d={d} stroke={OUT} strokeWidth={9} strokeLinecap="round" fill="none" />
      <path d={d} stroke={BODY} strokeWidth={5.2} strokeLinecap="round" fill="none" />
      <circle cx={hx} cy={108} r={5.2} fill={BODY} stroke={OUT} strokeWidth={1.8} />
    </g>
  );
};

const Prop: React.FC<{kind: string; f: number}> = ({kind, f}) => {
  const bob = Math.sin(f * 0.1) * 2;
  if (kind === "book") return (
    <g transform={`translate(88 ${50 + bob}) rotate(${Math.sin(f * 0.07) * 6})`}>
      <rect x={-10} y={-8} width={20} height={16} rx={2} fill="#4C6EF5" stroke={OUT} strokeWidth={1.6} />
      <rect x={-8} y={-6} width={14} height={12} rx={1} fill="#fff" />
      <path d="M-6,-2 H4 M-6,1 H4 M-6,4 H1" stroke="#9AA5B1" strokeWidth={1} />
      <rect x={-10} y={-8} width={3.4} height={16} fill="#364FC7" stroke={OUT} strokeWidth={1.2} />
    </g>);
  if (kind === "bulb") return (
    <g transform={`translate(88 ${48 + bob})`}>
      <circle r={15 + Math.sin(f * 0.15) * 2} fill="#FFE066" opacity={0.28} />
      <circle r={8} fill="#FFE066" stroke={OUT} strokeWidth={1.6} />
      <rect x={-4} y={7} width={8} height={5} rx={1.5} fill="#ADB5BD" stroke={OUT} strokeWidth={1.2} />
      <path d="M-2.5,2 Q0,-3 2.5,2" stroke={SPARK} strokeWidth={1.2} fill="none" />
    </g>);
  if (kind === "coin") return (
    <g transform={`translate(88 ${50 + bob})`}>
      <ellipse rx={Math.max(1.5, 9 * Math.abs(Math.cos(f * 0.1)))} ry={9} fill="#F5C518" stroke={OUT} strokeWidth={1.6} />
      <ellipse rx={Math.max(1, 5.5 * Math.abs(Math.cos(f * 0.1)))} ry={5.5} fill="none" stroke="#C99700" strokeWidth={1.2} />
    </g>);
  return null;
};

const Mascot: React.FC<{mood: string; prop: string; f: number; fps: number; words: Scene["words"]; size: number}> = ({mood, prop, f, fps, words, size}) => {
  const t = f / fps; let idx = -1; words.forEach((w, i) => {if (t >= w.s && t <= w.e + 0.04) idx = i;});
  const talk = idx >= 0 ? 0.3 + 0.7 * Math.abs(Math.sin(f * 0.85 + idx * 1.7)) : 0;
  const blinkPhase = (f + 23) % 96; const blink = blinkPhase < 5 ? 1 - Math.sin((blinkPhase / 5) * Math.PI) * 0.92 : 1;
  const bob = Math.sin(f * 0.14) * 1.6; const squash = 1 + Math.sin(f * 0.14 + 1) * 0.012;
  const surprised = mood === "surprised"; const eyeRy = surprised ? 12 : 10; const pr = surprised ? 3.2 : 4.2;
  const look = mood === "thinking" ? [-3.2, -3] : [Math.sin(f * 0.04) * 1.6, Math.sin(f * 0.03) * 0.8];
  let aL = 8; let aR = -8;
  if (mood === "happy") {aL = 112 + Math.sin(f * 0.3) * 20; aR = -(8 + Math.sin(f * 0.12) * 5);}
  else if (mood === "thinking") {aL = 6 + Math.sin(f * 0.1) * 3; aR = -(158 + Math.sin(f * 0.08) * 3);}
  else if (mood === "determined") {aL = 38 + Math.sin(f * 0.2) * 4; aR = -(38 + Math.sin(f * 0.2 + 1) * 4);}
  else if (mood === "surprised") {aL = 128 + Math.sin(f * 0.5) * 7; aR = -(128 + Math.sin(f * 0.5 + 1) * 7);}
  const spark = 1 + Math.sin(f * 0.2) * 0.18;
  const brow = (x: number, side: 1 | -1) => {
    if (mood === "determined") return `M${x - 8 * side},${side === 1 ? 33 : 33} L${x + 8 * side},${40}`;
    if (mood === "surprised") return `M${x - 8},31 Q${x},25 ${x + 8},31`;
    if (mood === "thinking") return side === 1 ? `M${x - 8},35 Q${x},30 ${x + 8},34` : `M${x - 8},38 L${x + 8},37`;
    return `M${x - 8},35 Q${x},31 ${x + 8},35`;
  };
  const mouth = () => {
    if (talk > 0) return (<g><ellipse cx={50} cy={67} rx={6 + talk * 1.5} ry={1.6 + talk * 5.2} fill="#7A1F3D" stroke={OUT} strokeWidth={1.6} />{talk > 0.5 && <ellipse cx={50} cy={69.5} rx={3.4} ry={1.5} fill="#FF8FA3" />}</g>);
    if (surprised) return <ellipse cx={50} cy={68} rx={3.6} ry={4.6} fill="#7A1F3D" stroke={OUT} strokeWidth={1.6} />;
    if (mood === "thinking") return <path d="M44,68 Q50,65 57,68" stroke={OUT} strokeWidth={2} fill="none" strokeLinecap="round" />;
    if (mood === "determined") return <path d="M43,67 Q50,71 58,64" stroke={OUT} strokeWidth={2} fill="none" strokeLinecap="round" />;
    return <path d="M41,64 Q50,75 59,64" stroke={OUT} strokeWidth={2.2} fill="none" strokeLinecap="round" />;
  };
  const Eye: React.FC<{cx: number}> = ({cx}) => (
    <g transform={`translate(${cx} 50) scale(1 ${blink.toFixed(2)}) translate(${-cx} -50)`}>
      <ellipse cx={cx} cy={50} rx={8.6} ry={eyeRy} fill="#fff" stroke={OUT} strokeWidth={1.8} />
      <circle cx={cx + look[0]} cy={50 + look[1]} r={pr} fill={OUT} />
      <circle cx={cx + look[0] + 1.4} cy={50 + look[1] - 1.5} r={1.3} fill="#fff" />
    </g>
  );
  return (
    <svg viewBox="0 0 100 130" width={size} height={size * 1.3} style={{overflow: "visible"}}>
      <ellipse cx={50} cy={124} rx={26 - bob} ry={4.5} fill="#000" opacity={0.2} />
      <g transform={`translate(0 ${bob.toFixed(2)}) translate(50 124) scale(1 ${squash.toFixed(3)}) translate(-50 -124)`}>
        <ellipse cx={39} cy={120} rx={8} ry={4} fill={OUT} /><ellipse cx={61} cy={120} rx={8} ry={4} fill={OUT} />
        <rect x={32} y={76} width={36} height={42} rx={17} fill={BODY} stroke={OUT} strokeWidth={2.2} />
        <path d="M50,86 L53,92 L59,92 L54,96 L56,102 L50,98 L44,102 L46,96 L41,92 L47,92 Z" fill={SPARK} opacity={0.9} />
        <Arm side="l" angle={aL} /><Arm side="r" angle={aR} />
        <line x1={50} y1={22} x2={50} y2={11} stroke={OUT} strokeWidth={2.4} strokeLinecap="round" />
        <g transform={`translate(50 7) scale(${spark.toFixed(3)})`}>
          <circle r={9} fill={SPARK} opacity={0.25} />
          <path d="M0,-7 L2,-2 L7,0 L2,2 L0,7 L-2,2 L-7,0 L-2,-2 Z" fill={SPARK} stroke={OUT} strokeWidth={1.4} strokeLinejoin="round" />
        </g>
        <ellipse cx={50} cy={50} rx={33} ry={30} fill={BODY} stroke={OUT} strokeWidth={2.2} />
        <ellipse cx={30} cy={61} rx={5} ry={3.2} fill="#FF8FA3" opacity={0.6} /><ellipse cx={70} cy={61} rx={5} ry={3.2} fill="#FF8FA3" opacity={0.6} />
        <Eye cx={37} /><Eye cx={63} />
        <path d={brow(37, 1)} stroke={OUT} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        <path d={brow(63, -1)} stroke={OUT} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        {mouth()}
        <Prop kind={prop} f={f} />
      </g>
    </svg>
  );
};

/* ---------- "character" scene ---------- */
export const CharacterScene: React.FC<SP> = ({s, plan, u}) => {
  const f = useCurrentFrame(); const {fps, width, height} = useVideoConfig(); const c = plan.theme.colors; const d = s.data || {};
  const mood = MOODS.includes(d.mood) ? d.mood : "happy"; const prop = PROPS.includes(d.prop) ? d.prop : "none";
  const text = String(d.text || ""); const words = text.split(" ").filter(Boolean);
  const frames = Math.round(s.durationSec * fps) + TRANS; const seed = hashStr(text + mood);
  const setting = STORY_SETTINGS.includes(d.setting) ? d.setting : STORY_SETTINGS[seed % STORY_SETTINGS.length];
  const enter = clamp(spring({frame: Math.max(0, f - 2), fps, config: {damping: 11, mass: 0.8}}), 0, 1.15);
  const pop = clamp(spring({frame: Math.max(0, f - 12), fps, config: {damping: 10, mass: 0.6}}), 0, 1.15);
  const size = Math.min(58 * u, height * 0.3); const left = plan.theme.layout === "left";
  return (
    <AbsoluteFill>
      <Backdrop setting={setting} seed={seed} frames={frames} plan={plan} u={u} dim={0.22} />
      <div style={{position: "absolute", left: 0, right: 0, top: height * 0.1, display: "flex", justifyContent: "center", padding: `0 ${7 * u}px`, boxSizing: "border-box"}}>
        <div style={{position: "relative", maxWidth: width * 0.86, background: c.tx, color: c.bg1, borderRadius: 5 * u, padding: `${3.2 * u}px ${4.4 * u}px`, fontSize: (words.length > 8 ? 6 : 7) * u, lineHeight: 1.14, textAlign: "center",
          boxShadow: `0 ${1 * u}px ${3 * u}px rgba(0,0,0,0.3)`, opacity: clamp(pop * 1.5), transform: `scale(${0.6 + 0.4 * pop})`, transformOrigin: "50% 100%"}}>
          {words.map((w, i) => {const o = clamp((f - 14 - i * 3) / 5); return <span key={i} style={{display: "inline-block", marginRight: 1.6 * u, opacity: o, color: i === words.length - 1 ? c.ac === c.tx ? c.bg1 : c.ac : c.bg1}}>{w}</span>;})}
          <div style={{position: "absolute", left: "50%", bottom: -2.2 * u, width: 4.4 * u, height: 4.4 * u, background: c.tx, transform: "translateX(-50%) rotate(45deg)", borderRadius: 0.6 * u}} />
        </div>
      </div>
      <div style={{position: "absolute", left: 0, right: 0, bottom: height * 0.2, display: "flex", justifyContent: left ? "flex-start" : "center", paddingLeft: left ? 12 * u : 0,
        transform: `translateY(${(1 - enter) * 22 * u}px) scale(${0.7 + 0.3 * enter})`, transformOrigin: "50% 100%"}}>
        <Mascot mood={mood} prop={prop} f={f} fps={fps} words={s.words || []} size={size} />
      </div>
    </AbsoluteFill>
  );
};
