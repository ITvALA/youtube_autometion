import React from "react";
import {AbsoluteFill, Easing, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {loadFont as bebas} from "@remotion/google-fonts/BebasNeue";
import {loadFont as poppins} from "@remotion/google-fonts/Poppins";
import {loadFont as marker} from "@remotion/google-fonts/PermanentMarker";
import {loadFont as mono} from "@remotion/google-fonts/ShareTechMono";
import {loadFont as inter} from "@remotion/google-fonts/Inter";
import {loadFont as rubik} from "@remotion/google-fonts/Rubik";
import type {Plan, Scene} from "../Video";
import {
  SHORT_STYLES,
  THINKING_STYLES,
  type ShortStyle,
  getStyleById as getShortStyleById,
  pickStyle as pickShortStyle,
  StyledCaption,
  StyledScene as NewStyledScene,
} from "./mindspark-styles-200";

/*
 * MINDSPARK STYLE ENGINE
 * 6 FULL art directions. Each one owns: background world, palette, font, camera/motion, text layout,
 * caption look and scene transition. When plan.style.id is set, Video.tsx hands the whole scene to
 * <StyleScene/> so NOTHING of the old theme (gradient, pattern, backdrop, captions) is reused.
 *
 * plan.style = {id: "motion_graphics"|"perspective_3d"|"cutout_collage"|"blueprint"|"swiss_poster"|"isometric",
 *               variant: 0|1|2 (palette), seed: number}
 */

type Pal = {bg: string; bg2: string; fg: string; a: string; b: string; c: string};
type Def = {id: string; name: string; font: string; pals: Pal[]};
type C = {title: string; sub: string; lines: string[]; role: "hook" | "list" | "quote"};
type P = {c: C; pal: Pal; u: number; f: number; fps: number; seed: number; idx: number; total: number; w: number; h: number};
type R = {align: string; bg: (p: P) => React.ReactNode; body: (p: P) => React.ReactNode};

const TRANS = 18;
const F = {
  bebas: bebas("normal", {weights: ["400"], subsets: ["latin"]}).fontFamily,
  poppins: poppins("normal", {weights: ["800"], subsets: ["latin"]}).fontFamily,
  marker: marker("normal", {weights: ["400"], subsets: ["latin"]}).fontFamily,
  mono: mono("normal", {weights: ["400"], subsets: ["latin"]}).fontFamily,
  inter: inter("normal", {weights: ["900"], subsets: ["latin"]}).fontFamily,
  rubik: rubik("normal", {weights: ["900"], subsets: ["latin"]}).fontFamily,
};

export const STYLES: Def[] = [
  {id: "motion_graphics", name: "Motion Graphics", font: F.bebas, pals: [
    {bg: "#FFD93D", bg2: "#FFB800", fg: "#14110F", a: "#FF3D68", b: "#2E5BFF", c: "#12B886"},
    {bg: "#2E5BFF", bg2: "#1B3FD1", fg: "#FFFFFF", a: "#FFD93D", b: "#FF3D68", c: "#7CFFC4"},
    {bg: "#FF5A36", bg2: "#E03E1A", fg: "#FFF6E5", a: "#14110F", b: "#FFD93D", c: "#3DDBD9"}]},
  {id: "perspective_3d", name: "Perspective 3D", font: F.poppins, pals: [
    {bg: "#080818", bg2: "#1C0B40", fg: "#FFFFFF", a: "#FF2E93", b: "#00E5FF", c: "#FFD60A"},
    {bg: "#04120F", bg2: "#073B34", fg: "#F0FFF8", a: "#3DFFB0", b: "#FFB703", c: "#8ECAE6"},
    {bg: "#14060A", bg2: "#3B0A1A", fg: "#FFF1F2", a: "#FF4D6D", b: "#FFC857", c: "#4CC9F0"}]},
  {id: "cutout_collage", name: "Cutout Collage", font: F.marker, pals: [
    {bg: "#E9DDC4", bg2: "#D8C8A2", fg: "#2A2018", a: "#E63946", b: "#1D6FA5", c: "#F4A100"},
    {bg: "#F6E3D3", bg2: "#EBC9AE", fg: "#2B1B14", a: "#2A9D8F", b: "#E76F51", c: "#264653"},
    {bg: "#DDE5D0", bg2: "#C5D1B2", fg: "#1F2A1A", a: "#D62828", b: "#F77F00", c: "#003049"}]},
  {id: "blueprint", name: "Blueprint Draw", font: F.mono, pals: [
    {bg: "#0B3A6B", bg2: "#07284C", fg: "#E8F4FF", a: "#7FD1FF", b: "#FFD166", c: "#9BF6C5"},
    {bg: "#111111", bg2: "#1E1E1E", fg: "#F5F5F5", a: "#39FF88", b: "#FFD166", c: "#7FD1FF"},
    {bg: "#3A0B2E", bg2: "#260720", fg: "#FFE8F7", a: "#FF7AD9", b: "#FFD166", c: "#7FF0FF"}]},
  {id: "swiss_poster", name: "Swiss Poster", font: F.inter, pals: [
    {bg: "#F2F0EA", bg2: "#E3DFD3", fg: "#111111", a: "#E10600", b: "#111111", c: "#FFB400"},
    {bg: "#111111", bg2: "#1B1B1B", fg: "#F2F0EA", a: "#FF4A1C", b: "#F2F0EA", c: "#3DA5FF"},
    {bg: "#1A3CFF", bg2: "#1230CC", fg: "#FFFFFF", a: "#FFE600", b: "#FFFFFF", c: "#FF5E8A"}]},
  {id: "isometric", name: "Isometric Blocks", font: F.rubik, pals: [
    {bg: "#17233B", bg2: "#0D1627", fg: "#FFFFFF", a: "#FFB703", b: "#4CC9F0", c: "#F72585"},
    {bg: "#2B1747", bg2: "#170B2B", fg: "#FFFFFF", a: "#00F5D4", b: "#FEE440", c: "#F15BB5"},
    {bg: "#0F2F2A", bg2: "#071A17", fg: "#F3FFF8", a: "#FF9F1C", b: "#2EC4B6", c: "#E71D36"}]},
  {id: "tech_glow", name: "Tech Glow", font: F.poppins, pals: [
    {bg: "#060B19", bg2: "#0D1B2A", fg: "#FFFFFF", a: "#00F0FF", b: "#7928CA", c: "#FF0080"},
    {bg: "#04120D", bg2: "#08231A", fg: "#FFFFFF", a: "#00FF88", b: "#00F5D4", c: "#FFD60A"},
    {bg: "#120B04", bg2: "#261408", fg: "#FFFFFF", a: "#FF6B00", b: "#FF0055", c: "#FFCC00"}]},
  {id: "cyber_terminal", name: "Cyber Terminal", font: F.mono, pals: [
    {bg: "#0A1208", bg2: "#040803", fg: "#39FF14", a: "#00FF66", b: "#70FF00", c: "#FFFFFF"},
    {bg: "#140D04", bg2: "#0A0602", fg: "#FFB000", a: "#FF8000", b: "#FFD000", c: "#FFFFFF"},
    {bg: "#050F14", bg2: "#02070A", fg: "#00E5FF", a: "#00A3FF", b: "#7DF9FF", c: "#FFFFFF"}]},
  {id: "flat_vector", name: "Flat Vector", font: F.rubik, pals: [
    {bg: "#0F172A", bg2: "#1E293B", fg: "#F8FAFC", a: "#6366F1", b: "#EC4899", c: "#14B8A6"},
    {bg: "#F8FAFC", bg2: "#E2E8F0", fg: "#0F172A", a: "#2563EB", b: "#7C3AED", c: "#F59E0B"},
    {bg: "#1E1035", bg2: "#2D1854", fg: "#FFFFFF", a: "#A855F7", b: "#06B6D4", c: "#F43F5E"}]},
  {id: "cinematic_noir", name: "Cinematic Noir", font: F.bebas, pals: [
    {bg: "#0A0A0A", bg2: "#141414", fg: "#F7F2E7", a: "#D4AF37", b: "#F3E5AB", c: "#AA7A1E"},
    {bg: "#060F0C", bg2: "#0E1F1A", fg: "#F2F9F6", a: "#52B788", b: "#D8F3DC", c: "#D4AF37"},
    {bg: "#14060A", bg2: "#240B10", fg: "#FFF0F2", a: "#E63946", b: "#FFB4A2", c: "#D4AF37"}]},
];
export const STYLE_IDS = STYLES.map((s) => s.id);
export const NEW_STYLE_IDS = SHORT_STYLES.map((s) => s.id);
export const ALL_STYLE_IDS = [...STYLE_IDS, ...NEW_STYLE_IDS];
export { SHORT_STYLES, THINKING_STYLES, type ShortStyle, getShortStyleById, pickShortStyle, StyledCaption, NewStyledScene };

/* ---------- helpers ---------- */
const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const hash = (s: string) => {let h = 2166136261; for (let i = 0; i < s.length; i++) {h ^= s.charCodeAt(i); h = Math.imul(h, 16777619);} return h >>> 0;};
const rng = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const S = (f: number, fps: number, d = 0, damp = 12) => cl(spring({frame: Math.max(0, f - d), fps, config: {damping: damp, mass: 0.6}}), 0, 1.2);
const ink = (hex: string) => {const n = parseInt(hex.slice(1), 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.6 ? "#111" : "#fff";};
const dark = (hex: string, k = 0.6) => {const n = parseInt(hex.slice(1), 16); return `rgb(${Math.round((n >> 16) * k)},${Math.round(((n >> 8) & 255) * k)},${Math.round((n & 255) * k)})`;};
const fit = (n: number, max: number, min: number, chars: number) => Math.max(min, Math.min(max, (max * chars) / Math.max(chars, n)));
const chunk = (ws: string[], n: number) => {const k = Math.max(1, Math.ceil(ws.length / n)); const o: string[] = []; for (let i = 0; i < ws.length; i += k) o.push(ws.slice(i, i + k).join(" ")); return o;};
const ext = (col: string, n: number, st: number) => Array.from({length: n}, (_, i) => `${(i + 1) * st}px ${(i + 1) * st}px 0 ${col}`).join(",");
const torn = (seed: number, n = 18, a = 1.8) => {
  const r = rng(seed);
  const top = Array.from({length: n + 1}, (_, i) => `${((i / n) * 100).toFixed(1)}% ${(r() * a).toFixed(1)}%`);
  const bot = Array.from({length: n + 1}, (_, i) => `${(100 - (i / n) * 100).toFixed(1)}% ${(100 - r() * a).toFixed(1)}%`);
  return `polygon(${[...top, ...bot].join(",")})`;
};

export const hasStyle = (plan: Plan) => !!(plan as any).style?.id;
const resolve = (plan: Plan) => {
  const st = (plan as any).style || {}; const base = hash(plan.book?.title || "mindspark");
  const def = STYLES.find((x) => x.id === st.id) || STYLES[base % STYLES.length];
  const pal = def.pals[Number.isInteger(st.variant) ? st.variant % def.pals.length : base % def.pals.length];
  return {def, pal, seed: Number(st.seed) || base};
};

/* any scene type -> {title, sub, lines, role}; so every style can draw every scene type */
const extract = (s: Scene): C => {
  const d = s.data || {}; let lines: string[] = [];
  if (Array.isArray(d.notes)) lines = d.notes.map((n: any) => String(n.text));
  else for (const k of ["lines", "points", "items", "milestones", "habits", "options"]) if (Array.isArray(d[k])) {lines = d[k].map(String); break;}
  if (d.before && d.after) lines = ["✕ " + d.before, "✓ " + d.after];
  if (d.panel1Title && d.panel2Title) lines = [String(d.panel1Title), String(d.panel2Title)];
  const title = String(d.title || d.text || d.quote || d.question || d.center || d.label || (d.before ? "BEFORE → AFTER" : "") || d.panel2Title || s.narration);
  const sub = String(d.sub || d.desc || d.subtitle || d.by || "");
  const role = s.type === "quote" || s.type === "quotePoster" ? "quote" : s.type === "hook" || !lines.length ? "hook" : "list";
  return {title, sub, lines: lines.slice(0, 4), role};
};

/* =============== 1. MOTION GRAPHICS: flat colour blocks, kinetic shapes =============== */
const MG: R = {align: "center",
  bg: ({pal, f, w, h, u, seed}) => {
    const r = rng(seed); const cols = [pal.a, pal.b, pal.c];
    return (<AbsoluteFill style={{background: `linear-gradient(160deg,${pal.bg},${pal.bg2})`, overflow: "hidden"}}>
      {Array.from({length: 9}, (_, i) => {
        const x = r() * w, y = r() * h, s = (10 + r() * 22) * u, k = i % 3, sp = (r() - 0.5) * 2, col = cols[i % 3];
        const shape: React.CSSProperties = k === 0 ? {borderRadius: "50%"} : k === 1 ? {borderRadius: s * 0.18} : {clipPath: "polygon(50% 0,100% 100%,0 100%)"};
        return <div key={i} style={{position: "absolute", left: x + Math.sin(f * 0.03 + i) * 4 * u, top: y + Math.cos(f * 0.025 + i * 2) * 5 * u, width: s, height: s, background: col, opacity: 0.55,
          transform: `rotate(${f * sp * 1.4 + r() * 90}deg) scale(${0.85 + 0.15 * Math.sin(f * 0.08 + i)})`, ...shape}} />;
      })}
      <div style={{position: "absolute", left: -w * 0.2, width: w * 1.4, height: h * 0.09, top: ((f * 9) % (h * 1.4)) - h * 0.2, background: pal.fg, opacity: 0.08, transform: "rotate(-12deg)"}} />
    </AbsoluteFill>);
  },
  body: ({c, pal, u, f, fps}) => {
    const cols = [pal.a, pal.b, pal.c];
    if (c.role === "list") {
      const s0 = S(f, fps, 2, 14);
      return (<>
        <div style={{background: pal.fg, color: pal.bg, fontSize: fit(c.title.length, 10 * u, 5.5 * u, 14), lineHeight: 1.05, padding: `${0.8 * u}px ${2.4 * u}px`, transform: `scaleX(${s0})`, transformOrigin: "left", textTransform: "uppercase"}}>{c.title}</div>
        {c.lines.map((l, i) => {
          const s = S(f, fps, 12 + i * 8, 11); const col = cols[i % 3];
          return (<div key={i} style={{display: "flex", alignItems: "center", gap: 2.4 * u, width: "100%", background: pal.fg, color: pal.bg, borderRadius: 2 * u, padding: `${1.2 * u}px ${2 * u}px`, fontSize: fit(l.length, 6.2 * u, 4.2 * u, 22), transform: `translateX(${(1 - s) * (i % 2 ? 1 : -1) * 100 * u}px)`}}>
            <span style={{width: 8 * u, height: 8 * u, flex: "none", borderRadius: "50%", background: col, color: ink(col), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 6 * u}}>{i + 1}</span><span>{l}</span>
          </div>);
        })}
      </>);
    }
    const q = c.role === "quote"; const lines = chunk(c.title.toUpperCase().split(" "), q ? 6 : 3);
    const fsz = fit(Math.max(...lines.map((l) => l.length)), 19 * u, 6 * u, 10);
    return (<>
      {q && <div style={{fontSize: 30 * u, lineHeight: 0.6, color: pal.a, height: 10 * u}}>“</div>}
      {lines.map((l, i) => {
        const s = S(f, fps, 4 + i * 5, 10); const dir = i % 2 ? 1 : -1; const col = cols[i % 3];
        return <div key={i} style={{background: col, color: ink(col), fontSize: fsz, lineHeight: 1.05, padding: `${0.6 * u}px ${2.2 * u}px`, borderRadius: 0.8 * u, boxShadow: `${0.8 * u}px ${0.8 * u}px 0 ${pal.fg}`, transform: `translateX(${(1 - s) * dir * 110 * u}px) rotate(${dir * 1.4}deg)`}}>{l}</div>;
      })}
      {c.sub && <div style={{fontSize: 5 * u, color: pal.fg, opacity: cl((f - 30) / 10), marginTop: u}}>{c.sub}</div>}
    </>);
  }};

/* =============== 2. PERSPECTIVE 3D: receding grid floor, flying 3D planes =============== */
const P3: R = {align: "center",
  bg: ({pal, f, u}) => (
    <AbsoluteFill style={{background: `linear-gradient(180deg,${pal.bg},${pal.bg2})`, overflow: "hidden"}}>
      <div style={{position: "absolute", left: "50%", top: "34%", width: 46 * u, height: 46 * u, marginLeft: -23 * u, borderRadius: "50%", background: `linear-gradient(180deg,${pal.c},${pal.a})`, opacity: 0.9, boxShadow: `0 0 ${12 * u}px ${pal.a}`}} />
      <div style={{position: "absolute", left: 0, right: 0, top: "46%", bottom: 0, perspective: `${90 * u}px`, perspectiveOrigin: "50% 0%", overflow: "hidden", background: pal.bg}}>
        <div style={{position: "absolute", left: "-50%", width: "200%", top: 0, height: "200%", transformOrigin: "50% 0%", transform: "rotateX(72deg)", opacity: 0.6,
          backgroundImage: `linear-gradient(${pal.b} 2px,transparent 2px),linear-gradient(90deg,${pal.b} 2px,transparent 2px)`, backgroundSize: `${10 * u}px ${10 * u}px`, backgroundPosition: `0 ${(f * 0.5 * u) % (10 * u)}px`}} />
        <div style={{position: "absolute", inset: 0, background: `linear-gradient(180deg,${pal.bg} 0%,transparent 45%)`}} />
      </div>
      {[0, 1, 2].map((i) => <div key={i} style={{position: "absolute", left: `${12 + i * 30}%`, top: `${8 + (i % 2) * 9}%`, width: 14 * u, height: 14 * u, border: `${0.8 * u}px solid ${[pal.a, pal.b, pal.c][i]}`, borderRadius: "50%", transform: `rotateX(${f * 2 + i * 60}deg) rotateY(${f * 1.5}deg)`, opacity: 0.7}} />)}
    </AbsoluteFill>),
  body: ({c, pal, u, f, fps}) => {
    const q = c.role === "quote"; const l = c.role === "list"; const s0 = S(f, fps, 2, 12);
    const sz = l ? fit(c.title.length, 10 * u, 6 * u, 16) : fit(c.title.length, q ? 8.5 * u : 15 * u, 5.5 * u, q ? 22 : 11);
    return (
      <div style={{perspective: `${110 * u}px`, width: "100%"}}>
        <div style={{transformStyle: "preserve-3d", transform: `rotateX(${Math.sin(f * 0.035) * 5}deg) rotateY(${Math.cos(f * 0.03) * 7}deg)`, display: "flex", flexDirection: "column", gap: 2.6 * u, alignItems: "center"}}>
          <div style={{fontSize: sz, lineHeight: 1.05, textAlign: "center", color: pal.fg, textShadow: `${ext(pal.a, 10, 0.12 * u)}, 0 0 ${4 * u}px ${pal.a}`, transform: `translateZ(${-(1 - s0) * 60 * u}px) rotateX(${(1 - s0) * 50}deg)`, opacity: cl(s0 * 2)}}>{q ? `“${c.title}”` : c.title}</div>
          {c.lines.map((t, i) => {
            const s = S(f, fps, 14 + i * 9, 11); const col = [pal.b, pal.c, pal.a][i % 3];
            return (<div key={i} style={{display: "flex", gap: 2.4 * u, alignItems: "center", width: "100%", padding: `${1.6 * u}px ${2.6 * u}px`, borderRadius: 2 * u, background: "rgba(255,255,255,0.09)", border: `${0.25 * u}px solid ${col}`, boxShadow: `0 0 ${3 * u}px ${col}66`, fontSize: fit(t.length, 5.4 * u, 3.8 * u, 26), transform: `translateZ(${-(1 - s) * 90 * u}px) rotateY(${(1 - s) * (i % 2 ? -45 : 45)}deg)`, opacity: cl(s * 2)}}>
              <b style={{color: col, fontSize: 7 * u}}>{i + 1}</b><span>{t}</span></div>);
          })}
          {c.sub && <div style={{fontSize: 4.4 * u, color: pal.b, opacity: cl((f - 24) / 10)}}>{c.sub}</div>}
        </div>
      </div>);
  }};

/* =============== 3. CUTOUT COLLAGE: paper scraps, tape, 10fps stop-motion jitter =============== */
const Scrap: React.FC<{u: number; seed: number; bg: string; fg: string; rot: number; s: number; dx?: number; tape?: boolean; children: React.ReactNode}> = ({u, seed, bg, fg, rot, s, dx = 0, tape, children}) => (
  <div style={{position: "relative", filter: `drop-shadow(${0.5 * u}px ${0.9 * u}px 0 rgba(0,0,0,0.28))`, transform: `translateX(${dx}px) rotate(${rot}deg) scale(${s})`}}>
    <div style={{background: bg, color: fg, clipPath: torn(seed), padding: `${2 * u}px ${3 * u}px`}}>{children}</div>
    {tape && <div style={{position: "absolute", top: -1.6 * u, left: "42%", width: 12 * u, height: 3.4 * u, background: "rgba(255,230,140,0.85)", transform: "rotate(-4deg)"}} />}
  </div>);
const CO: R = {align: "center",
  bg: ({pal, f, w, h, u, seed}) => {
    const j = Math.floor(f / 3); const r = rng(seed);
    const clips = ["circle(50%)", "polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)", "inset(0)"];
    return (<AbsoluteFill style={{background: `radial-gradient(circle at 30% 20%,${pal.bg},${pal.bg2})`, overflow: "hidden"}}>
      <AbsoluteFill style={{backgroundImage: "radial-gradient(rgba(0,0,0,0.07) 1px,transparent 1.5px)", backgroundSize: `${1.2 * u}px ${1.2 * u}px`}} />
      {Array.from({length: 8}, (_, i) => {
        const jr = rng(seed + i * 131 + j * 7); const s = (9 + r() * 14) * u; const col = [pal.a, pal.b, pal.c][i % 3]; const x = r() * w, y = r() * h, rot = r() * 60;
        return <div key={i} style={{position: "absolute", left: x + (jr() - 0.5) * u, top: y + (jr() - 0.5) * u, width: s, height: s, filter: "drop-shadow(0 0.7vw 0 rgba(0,0,0,0.22))", transform: `rotate(${rot + (jr() - 0.5) * 6}deg)`}}>
          <div style={{width: "100%", height: "100%", background: col, clipPath: clips[i % 3], opacity: 0.95}} /></div>;
      })}
    </AbsoluteFill>);
  },
  body: ({c, pal, u, f, fps, seed}) => {
    const j = Math.floor(f / 3); const J = (k: number) => rng(seed + k * 131 + j * 7)() - 0.5;
    const cols = ["#FFFFFF", pal.a, pal.b, pal.c]; const st = (s: number) => Math.round(s * 4) / 4;
    if (c.role === "list") {
      return (<>
        <Scrap u={u} seed={seed} bg={pal.fg} fg={pal.bg} rot={-2 + J(1)} s={st(S(f, fps, 2, 14))} tape><span style={{fontSize: fit(c.title.length, 8.4 * u, 5 * u, 16)}}>{c.title}</span></Scrap>
        {c.lines.map((l, i) => (
          <Scrap key={i} u={u} seed={seed + i * 31} bg="#FFFFFF" fg={pal.fg} rot={(i % 2 ? 1.8 : -1.8) + J(i + 3) * 1.4} s={st(S(f, fps, 10 + i * 7, 14))} dx={(i % 2 ? 2 : -2) * u + J(i + 9) * u} tape={i % 2 === 1}>
            <span style={{display: "flex", gap: 2 * u, alignItems: "center", fontSize: fit(l.length, 5.6 * u, 3.8 * u, 24)}}><span style={{background: cols[(i % 3) + 1], color: ink(cols[(i % 3) + 1]), borderRadius: "50%", width: 6.4 * u, height: 6.4 * u, flex: "none", display: "flex", alignItems: "center", justifyContent: "center"}}>{i + 1}</span>{l}</span>
          </Scrap>))}
      </>);
    }
    if (c.role === "quote") {
      return (<>
        <Scrap u={u} seed={seed} bg="#FFFFFF" fg={pal.fg} rot={-1.5 + J(2)} s={st(S(f, fps, 3, 14))} tape><span style={{fontSize: fit(c.title.length, 7.6 * u, 4.4 * u, 32), lineHeight: 1.2, display: "block"}}><span style={{color: pal.a, fontSize: 12 * u}}>“</span>{c.title}</span></Scrap>
        {c.sub && <Scrap u={u} seed={seed + 5} bg={pal.a} fg={ink(pal.a)} rot={3 + J(4)} s={st(S(f, fps, 18, 14))}><span style={{fontSize: 4.6 * u}}>— {c.sub}</span></Scrap>}
      </>);
    }
    const lines = chunk(c.title.split(" "), 3); const fsz = fit(Math.max(...lines.map((l) => l.length)), 12 * u, 5.5 * u, 12);
    return (<>
      {lines.map((l, i) => <Scrap key={i} u={u} seed={seed + i * 17} bg={cols[i % 4]} fg={ink(cols[i % 4])} rot={(i % 2 ? 2.2 : -2.2) + J(i) * 1.6} s={st(S(f, fps, 3 + i * 5, 14))} dx={J(i + 9) * u} tape={i % 2 === 0}><span style={{fontSize: fsz}}>{l}</span></Scrap>)}
      {c.sub && <div style={{fontSize: 4.6 * u, color: pal.fg, opacity: cl((f - 26) / 8), transform: `rotate(${-1.5 + J(7)}deg)`}}>{c.sub}</div>}
    </>);
  }};

/* =============== 4. BLUEPRINT: technical drawing that draws itself, typed text =============== */
const BP: R = {align: "stretch",
  bg: ({pal, f, u}) => {
    const pr = cl(f / 45); const g = (a: number) => `linear-gradient(rgba(255,255,255,${a}) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,${a}) 1px,transparent 1px)`;
    const d: React.CSSProperties = {};
    return (<AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%,${pal.bg},${pal.bg2})`, overflow: "hidden"}}>
      <AbsoluteFill style={{backgroundImage: `${g(0.06)},${g(0.14)}`, backgroundSize: `${2.5 * u}px ${2.5 * u}px,${2.5 * u}px ${2.5 * u}px,${12.5 * u}px ${12.5 * u}px,${12.5 * u}px ${12.5 * u}px`, ...d}} />
      <svg viewBox="0 0 1080 1920" style={{position: "absolute", inset: 0, width: "100%", height: "100%"}} fill="none" stroke={pal.a} strokeWidth={2} strokeLinecap="round">
        <circle cx={820} cy={330} r={210} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pr} opacity={0.7} />
        <circle cx={820} cy={330} r={120} pathLength={1} strokeDasharray="0.02 0.02" opacity={0.5} transform={`rotate(${f * 0.8} 820 330)`} />
        <path d="M80 300 L420 120 M820 120 V540 M610 330 H1030" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pr} opacity={0.5} />
        <path d="M120 1560 H960 M120 1540 V1580 M960 1540 V1580" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - pr} stroke={pal.b} />
        <text x={540} y={1530} textAnchor="middle" fill={pal.b} stroke="none" fontSize={28} fontFamily="inherit">W = 1080 PX</text>
        <rect x={0} y={(f * 14) % 1920} width={1080} height={3} fill={pal.a} stroke="none" opacity={0.25} />
      </svg>
    </AbsoluteFill>);
  },
  body: ({c, pal, u, f, idx}) => {
    const type = (t: string, from: number, sp = 1.7) => t.slice(0, Math.max(0, Math.floor((f - from) * sp)));
    const pr = cl((f - 2) / 18); const cur = Math.floor(f / 8) % 2 === 0 ? "▌" : " ";
    const q = c.role === "quote"; const sz = c.role === "list" ? fit(c.title.length, 8 * u, 4.6 * u, 22) : fit(c.title.length, q ? 6.4 * u : 9.5 * u, 4.2 * u, q ? 30 : 17);
    const full = type(c.title, 6);
    return (<>
      <div style={{fontSize: 2.8 * u, color: pal.b, letterSpacing: 0.3 * u}}>FIG.{String(idx + 1).padStart(2, "0")} // {c.role.toUpperCase()}</div>
      <div style={{position: "relative", border: `${0.3 * u}px solid ${pal.a}`, padding: `${3.2 * u}px ${3.4 * u}px`, clipPath: `inset(0 ${(1 - pr) * 100}% 0 0)`, background: "rgba(255,255,255,0.04)"}}>
        {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y], i) => <div key={i} style={{position: "absolute", left: x ? "auto" : -0.9 * u, right: x ? -0.9 * u : "auto", top: y ? "auto" : -0.9 * u, bottom: y ? -0.9 * u : "auto", width: 1.8 * u, height: 1.8 * u, background: pal.b}} />)}
        <div style={{fontSize: sz, lineHeight: 1.25, color: pal.fg}}>{q ? "“" : ""}{full}<span style={{color: pal.b}}>{full.length < c.title.length ? cur : ""}</span></div>
      </div>
      {c.lines.map((l, i) => (
        <div key={i} style={{opacity: cl((f - 14 - i * 10) / 4)}}>
          <div style={{display: "flex", gap: 2.4 * u, alignItems: "center", fontSize: fit(l.length, 5 * u, 3.6 * u, 28), color: pal.fg}}>
            <span style={{border: `${0.2 * u}px solid ${pal.b}`, color: pal.b, padding: `0 ${1.2 * u}px`}}>{`0${i + 1}`}</span><span>{type(l, 16 + i * 10)}</span></div>
          <div style={{marginTop: 0.8 * u, borderBottom: `${0.2 * u}px dashed ${pal.a}`, width: `${cl((f - 14 - i * 10) / 12) * 100}%`}} />
        </div>))}
      {c.sub && <div style={{fontSize: 3.8 * u, color: pal.b, opacity: cl((f - 30) / 8)}}>NOTE: {c.sub}</div>}
    </>);
  }};

/* =============== 5. SWISS POSTER: huge heavy type, strict grid, masked reveals =============== */
const Rv: React.FC<{s: number; children: React.ReactNode}> = ({s, children}) => <div style={{overflow: "hidden"}}><div style={{transform: `translateY(${(1 - cl(s)) * 110}%)`}}>{children}</div></div>;
const SW: R = {align: "flex-start",
  bg: ({pal, u, f, w, h, idx, total}) => {
    const cx = w * (0.62 + 0.08 * Math.sin(f * 0.025)); const d = w * 0.62;
    return (<AbsoluteFill style={{background: pal.bg, overflow: "hidden"}}>
      <div style={{position: "absolute", left: cx - d / 2, top: h * (idx % 2 ? 0.52 : 0.1), width: d, height: d, borderRadius: "50%", background: pal.a}} />
      <div style={{position: "absolute", left: 0, top: 0, bottom: 0, width: 2.2 * u, background: pal.fg}} />
      <div style={{position: "absolute", left: 7 * u, right: 7 * u, top: h * 0.075, height: 0.5 * u, background: pal.fg}} />
      <div style={{position: "absolute", right: 7 * u, top: h * 0.085, fontSize: 3.2 * u, color: pal.fg}}>{String(idx + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}</div>
    </AbsoluteFill>);
  },
  body: ({c, pal, u, f, fps}) => {
    const tight: React.CSSProperties = {letterSpacing: "-0.045em", lineHeight: 0.92, textTransform: "uppercase", color: pal.fg};
    if (c.role === "list") {
      return (<>
        <Rv s={S(f, fps, 2)}><div style={{...tight, fontSize: fit(c.title.length, 10 * u, 5.5 * u, 12)}}>{c.title}</div></Rv>
        {c.lines.map((l, i) => (
          <div key={i} style={{display: "flex", gap: 3 * u, alignItems: "baseline", borderTop: `${0.5 * u}px solid ${pal.fg}`, paddingTop: 1.2 * u, width: "100%", opacity: cl((f - 8 - i * 8) / 3)}}>
            <span style={{fontSize: 8 * u, color: pal.fg, lineHeight: 1}}>{i + 1}</span>
            <Rv s={S(f, fps, 10 + i * 8)}><div style={{...tight, textTransform: "none", letterSpacing: "-0.03em", fontSize: fit(l.length, 5.8 * u, 3.8 * u, 22), lineHeight: 1.05}}>{l}</div></Rv>
          </div>))}
      </>);
    }
    const q = c.role === "quote"; const lines = chunk(c.title.toUpperCase().split(" "), q ? 6 : 4);
    const fsz = fit(Math.max(...lines.map((l) => l.length)), q ? 10 * u : 17 * u, 5.4 * u, q ? 14 : 8);
    return (<>
      {q && <div style={{fontSize: 34 * u, lineHeight: 0.7, height: 11 * u, color: pal.fg}}>“</div>}
      {lines.map((l, i) => <Rv key={i} s={S(f, fps, 3 + i * 5)}><div style={{...tight, fontSize: fsz}}>{l}</div></Rv>)}
      <div style={{height: u, background: pal.fg, width: `${cl((f - 20) / 15) * 100}%`, marginTop: 2 * u}} />
      {c.sub && <div style={{fontSize: 4.6 * u, color: pal.fg, opacity: cl((f - 30) / 8)}}>{c.sub}</div>}
    </>);
  }};

/* =============== 6. ISOMETRIC BLOCKS: breathing cube city, thick 3D slabs dropping in =============== */
const Slab: React.FC<{col: string; u: number; depth?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({col, u, depth = 7, style, children}) => (
  <div style={{background: col, color: ink(col), borderRadius: 1.4 * u, padding: `${1.4 * u}px ${2.6 * u}px`, boxShadow: Array.from({length: depth}, (_, i) => `${(i + 1) * 0.45 * u}px ${(i + 1) * 0.45 * u}px 0 ${dark(col, 0.62)}`).join(","), ...style}}>{children}</div>);
const ISO: R = {align: "flex-start",
  bg: ({pal, f}) => {
    const N = 7, tw = 130, ox = 540, oy = 1020; const cols = [pal.a, pal.b, pal.c]; const cells: {i: number; j: number}[] = [];
    for (let s = 0; s < 2 * N - 1; s++) for (let i = 0; i < N; i++) {const j = s - i; if (j >= 0 && j < N) cells.push({i, j});}
    return (<AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 70%,${pal.bg},${pal.bg2})`, overflow: "hidden"}}>
      <svg viewBox="0 0 1080 1920" style={{position: "absolute", inset: 0, width: "100%", height: "100%"}}>
        {cells.map(({i, j}) => {
          const x = ox + ((i - j) * tw) / 2, y = oy + ((i + j) * tw) / 4, yt = y - (20 + 90 * (0.5 + 0.5 * Math.sin(f * 0.07 + i * 0.8 + j * 0.6))), col = cols[(i + j) % 3];
          const L = `${x - tw / 2},${yt} ${x},${yt + tw / 4} ${x},${y + tw / 4} ${x - tw / 2},${y}`;
          const Rr = `${x + tw / 2},${yt} ${x},${yt + tw / 4} ${x},${y + tw / 4} ${x + tw / 2},${y}`;
          const T = `${x},${yt - tw / 4} ${x + tw / 2},${yt} ${x},${yt + tw / 4} ${x - tw / 2},${yt}`;
          return <g key={`${i}-${j}`}><polygon points={L} fill={dark(col, 0.55)} /><polygon points={Rr} fill={dark(col, 0.75)} /><polygon points={T} fill={col} /></g>;
        })}
      </svg>
    </AbsoluteFill>);
  },
  body: ({c, pal, u, f, fps}) => {
    const cols = [pal.a, pal.b, pal.c]; const drop = (i: number, d: number) => {const s = S(f, fps, d + i * 6, 8); return {transform: `translateY(${-(1 - s) * 90 * u}px)`, opacity: cl(s * 3)};};
    if (c.role === "list") {
      return (<>
        <Slab col={pal.fg} u={u} style={{...drop(0, 2), fontSize: fit(c.title.length, 8.4 * u, 5 * u, 16)}}>{c.title}</Slab>
        {c.lines.map((l, i) => (
          <Slab key={i} col={cols[i % 3]} u={u} style={{...drop(i + 1, 4), marginLeft: (i + 1) * 3.2 * u, display: "flex", gap: 2 * u, alignItems: "center", fontSize: fit(l.length, 5.4 * u, 3.8 * u, 22)}}>
            <b style={{fontSize: 7 * u}}>{i + 1}</b><span>{l}</span></Slab>))}
      </>);
    }
    if (c.role === "quote") {
      return (<>
        <Slab col={pal.fg} u={u} depth={9} style={{...drop(0, 2), fontSize: fit(c.title.length, 7.4 * u, 4.2 * u, 26), lineHeight: 1.15}}>“{c.title}”</Slab>
        {c.sub && <Slab col={pal.a} u={u} style={{...drop(1, 4), fontSize: 4.4 * u, marginLeft: 8 * u}}>— {c.sub}</Slab>}
      </>);
    }
    const lines = chunk(c.title.split(" "), 3); const fsz = fit(Math.max(...lines.map((l) => l.length)), 12.5 * u, 5.5 * u, 11);
    return (<>
      {lines.map((l, i) => <Slab key={i} col={cols[i % 3]} u={u} style={{...drop(i, 2), marginLeft: i * 5 * u, fontSize: fsz, lineHeight: 1.05}}>{l}</Slab>)}
      {c.sub && <div style={{fontSize: 4.6 * u, opacity: cl((f - 28) / 8), marginLeft: 3 * u}}>{c.sub}</div>}
    </>);
  }};

/* =============== 7. TECH GLOW: Glassmorphism, neon outlines, floating glow orbs =============== */
const TG: R = {align: "center",
  bg: ({pal, f, u, seed}) => {
    return (
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 30%, ${pal.bg2}, ${pal.bg})`, overflow: "hidden"}}>
        <div style={{position: "absolute", inset: 0, opacity: 0.12, backgroundImage: `linear-gradient(${pal.a} 1px, transparent 1px), linear-gradient(90deg, ${pal.a} 1px, transparent 1px)`, backgroundSize: `${8 * u}px ${8 * u}px`, transform: "perspective(300px) rotateX(45deg) translateY(20%)"}} />
        <div style={{position: "absolute", width: 60 * u, height: 60 * u, borderRadius: "50%", background: pal.a, filter: "blur(90px)", opacity: 0.22, left: -10 * u, top: 15 * u + Math.sin(f * 0.04) * 5 * u}} />
        <div style={{position: "absolute", width: 55 * u, height: 55 * u, borderRadius: "50%", background: pal.b, filter: "blur(80px)", opacity: 0.18, right: -5 * u, bottom: 25 * u + Math.cos(f * 0.035) * 6 * u}} />
      </AbsoluteFill>
    );
  },
  body: ({c, pal, u, f, fps}) => {
    const s0 = S(f, fps, 2, 10);
    const glassCard: React.CSSProperties = {
      background: "rgba(255, 255, 255, 0.06)",
      backdropFilter: "blur(20px)",
      border: `1.5px solid rgba(255, 255, 255, 0.15)`,
      borderRadius: 3 * u,
      boxShadow: `0 10px 40px rgba(0,0,0,0.6), 0 0 30px ${pal.a}33`,
      padding: `${2.2 * u}px ${3 * u}px`,
      width: "100%",
      boxSizing: "border-box",
    };
    if (c.role === "list") {
      return (
        <>
          <div style={{...glassCard, transform: `scale(${s0})`, borderColor: `${pal.a}88`, textAlign: "center", marginBottom: 1.5 * u}}>
            <div style={{fontSize: fit(c.title.length, 7.8 * u, 4.8 * u, 16), fontWeight: 900, textTransform: "uppercase", background: `linear-gradient(90deg, #fff, ${pal.a})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>
              {c.title}
            </div>
          </div>
          {c.lines.map((l, i) => {
            const si = S(f, fps, 10 + i * 7, 10);
            return (
              <div key={i} style={{...glassCard, display: "flex", alignItems: "center", gap: 2.5 * u, transform: `translateY(${(1 - si) * 50 * u}px)`, opacity: cl(si * 2)}}>
                <span style={{width: 7 * u, height: 7 * u, flex: "none", borderRadius: "50%", background: `linear-gradient(135deg, ${pal.a}, ${pal.b})`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 4.8 * u, fontWeight: 900, boxShadow: `0 0 15px ${pal.a}`}}>
                  {i + 1}
                </span>
                <span style={{fontSize: fit(l.length, 5.6 * u, 3.8 * u, 24), color: "#fff", fontWeight: 700}}>{l}</span>
              </div>
            );
          })}
        </>
      );
    }
    const lines = chunk(c.title.split(" "), c.role === "quote" ? 5 : 3);
    const fsz = fit(Math.max(...lines.map((l) => l.length)), 13 * u, 5.8 * u, 12);
    return (
      <div style={{...glassCard, transform: `scale(${s0})`, textAlign: "center", padding: `${4 * u}px ${3 * u}px`, borderColor: `${pal.a}66`}}>
        {lines.map((l, i) => (
          <div key={i} style={{fontSize: fsz, lineHeight: 1.15, fontWeight: 900, textTransform: "uppercase", background: i % 2 ? `linear-gradient(90deg, ${pal.a}, ${pal.b})` : "#FFFFFF", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"}}>
            {l}
          </div>
        ))}
        {c.sub && <div style={{fontSize: 4.5 * u, color: pal.a, marginTop: 3 * u, opacity: cl((f - 22) / 8), fontWeight: 700}}>✦ {c.sub}</div>}
      </div>
    );
  }
};

/* =============== 8. CYBER TERMINAL: Retro hacker monospace, scanlines, blinking cursor =============== */
const CT: R = {align: "flex-start",
  bg: ({pal}) => {
    return (
      <AbsoluteFill style={{background: pal.bg, overflow: "hidden"}}>
        <div style={{position: "absolute", inset: 0, opacity: 0.18, backgroundImage: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.7) 50%)", backgroundSize: "100% 4px"}} />
        <div style={{position: "absolute", top: 40, left: 60, right: 60, borderBottom: `1px solid ${pal.fg}44`, paddingBottom: 8, fontSize: 18, color: pal.fg, opacity: 0.6, letterSpacing: 2}}>
          SYSTEM_LOG://MINDSPARK_CORE [STATUS_OK]
        </div>
      </AbsoluteFill>
    );
  },
  body: ({c, pal, u, f, fps}) => {
    const blink = Math.floor(f / 8) % 2 === 0 ? "_" : " ";
    if (c.role === "list") {
      return (
        <div style={{width: "100%", fontFamily: F.mono}}>
          <div style={{fontSize: fit(c.title.length, 7 * u, 4.5 * u, 18), color: pal.a, textTransform: "uppercase", border: `1px solid ${pal.a}`, padding: `${1 * u}px ${2 * u}px`, marginBottom: 3 * u}}>
            &gt; {c.title}
          </div>
          {c.lines.map((l, i) => {
            const si = S(f, fps, 8 + i * 7, 12);
            return (
              <div key={i} style={{margin: `${2 * u}px 0`, padding: `${1.2 * u}px ${2 * u}px`, background: `${pal.fg}10`, borderLeft: `3px solid ${pal.fg}`, fontSize: fit(l.length, 5.2 * u, 3.8 * u, 24), color: pal.fg, transform: `translateX(${(1 - si) * -30 * u}px)`, opacity: cl(si * 2)}}>
                <span style={{color: pal.b, marginRight: 1.5 * u}}>[0{i + 1}]</span>{l}
              </div>
            );
          })}
        </div>
      );
    }
    const lines = chunk(c.title.toUpperCase().split(" "), 3);
    const fsz = fit(Math.max(...lines.map((l) => l.length)), 12 * u, 5.5 * u, 12);
    return (
      <div style={{width: "100%", fontFamily: F.mono, border: `2px solid ${pal.fg}`, padding: `${4 * u}px ${3 * u}px`, background: `${pal.bg2}dd`, boxShadow: `0 0 25px ${pal.fg}33`}}>
        <div style={{fontSize: 3.5 * u, color: pal.a, marginBottom: 2 * u}}>&gt;&gt; EXECUTE_PROTOCOL:</div>
        {lines.map((l, i) => (
          <div key={i} style={{fontSize: fsz, color: pal.fg, lineHeight: 1.1, textShadow: `0 0 10px ${pal.fg}`}}>
            {l}
          </div>
        ))}
        <div style={{fontSize: 5 * u, color: pal.a, marginTop: 2 * u}}>{blink}</div>
        {c.sub && <div style={{fontSize: 4 * u, color: pal.b, marginTop: 2 * u, opacity: cl((f - 20) / 8)}}>[INFO]: {c.sub}</div>}
      </div>
    );
  }
};

/* =============== 9. FLAT VECTOR: Modern clean geometric cards & nodes =============== */
const FV: R = {align: "center",
  bg: ({pal, f}) => {
    return (
      <AbsoluteFill style={{background: `linear-gradient(145deg, ${pal.bg}, ${pal.bg2})`, overflow: "hidden"}}>
        <svg viewBox="0 0 1080 1920" style={{position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.22}}>
          <circle cx="200" cy="400" r={160 + Math.sin(f * 0.03) * 20} fill={pal.a} />
          <circle cx="880" cy="1400" r={220 + Math.cos(f * 0.025) * 25} fill={pal.b} />
          <line x1="200" y1="400" x2="880" y2="1400" stroke={pal.fg} strokeWidth="3" strokeDasharray="8 8" />
        </svg>
      </AbsoluteFill>
    );
  },
  body: ({c, pal, u, f, fps}) => {
    const s0 = S(f, fps, 2, 10);
    if (c.role === "list") {
      return (
        <div style={{width: "100%"}}>
          <div style={{background: pal.a, color: ink(pal.a), padding: `${1.4 * u}px ${2.5 * u}px`, borderRadius: 2 * u, fontSize: fit(c.title.length, 7.5 * u, 4.6 * u, 16), fontWeight: 900, textAlign: "center", marginBottom: 2 * u, transform: `scale(${s0})`}}>
            {c.title}
          </div>
          {c.lines.map((l, i) => {
            const si = S(f, fps, 10 + i * 7, 10);
            return (
              <div key={i} style={{display: "flex", alignItems: "center", gap: 2.2 * u, background: pal.fg, color: pal.bg, borderRadius: 2 * u, padding: `${1.4 * u}px ${2.4 * u}px`, margin: `${1.6 * u}px 0`, transform: `translateY(${(1 - si) * 40 * u}px)`, opacity: cl(si * 2), boxShadow: "0 8px 24px rgba(0,0,0,0.18)"}}>
                <span style={{width: 6.5 * u, height: 6.5 * u, flex: "none", borderRadius: "50%", background: pal.b, color: ink(pal.b), display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 4.5 * u}}>{i + 1}</span>
                <span style={{fontSize: fit(l.length, 5.2 * u, 3.8 * u, 24), fontWeight: 800}}>{l}</span>
              </div>
            );
          })}
        </div>
      );
    }
    const lines = chunk(c.title.split(" "), 3);
    const fsz = fit(Math.max(...lines.map((l) => l.length)), 13 * u, 5.8 * u, 11);
    return (
      <div style={{background: pal.fg, color: pal.bg, borderRadius: 3.5 * u, padding: `${4.5 * u}px ${3.5 * u}px`, width: "100%", textAlign: "center", transform: `scale(${s0})`, boxShadow: "0 14px 45px rgba(0,0,0,0.25)"}}>
        {lines.map((l, i) => (
          <div key={i} style={{fontSize: fsz, fontWeight: 900, lineHeight: 1.15, textTransform: "uppercase", color: i % 2 ? pal.a : pal.bg}}>
            {l}
          </div>
        ))}
        {c.sub && <div style={{fontSize: 4.4 * u, color: pal.b, marginTop: 2.5 * u, fontWeight: 800}}>● {c.sub}</div>}
      </div>
    );
  }
};

/* =============== 10. CINEMATIC NOIR: Luxury Gold & Deep Charcoal Editorial =============== */
const CN: R = {align: "center",
  bg: ({pal}) => {
    return (
      <AbsoluteFill style={{background: `radial-gradient(circle at 50% 50%, ${pal.bg2}, ${pal.bg})`, overflow: "hidden"}}>
        <div style={{position: "absolute", inset: 0, opacity: 0.08, backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)", backgroundSize: "24px 24px"}} />
        <div style={{position: "absolute", inset: "28px", border: `1px solid ${pal.a}44`, pointerEvents: "none"}} />
        <div style={{position: "absolute", inset: "34px", border: `1px solid ${pal.a}22`, pointerEvents: "none"}} />
      </AbsoluteFill>
    );
  },
  body: ({c, pal, u, f, fps}) => {
    const s0 = S(f, fps, 2, 12);
    if (c.role === "list") {
      const romans = ["I", "II", "III", "IV"];
      return (
        <div style={{width: "100%", textAlign: "center"}}>
          <div style={{color: pal.a, fontSize: fit(c.title.length, 7.8 * u, 4.6 * u, 16), letterSpacing: 4, textTransform: "uppercase", marginBottom: 3 * u, borderBottom: `1px solid ${pal.a}66`, paddingBottom: 1.5 * u}}>
            ✦ {c.title} ✦
          </div>
          {c.lines.map((l, i) => {
            const si = S(f, fps, 10 + i * 7, 12);
            return (
              <div key={i} style={{display: "flex", alignItems: "center", gap: 2.5 * u, margin: `${2 * u}px 0`, padding: `${1.4 * u}px ${2 * u}px`, border: `1px solid ${pal.a}33`, background: "rgba(0,0,0,0.4)", transform: `translateY(${(1 - si) * 35 * u}px)`, opacity: cl(si * 2)}}>
                <span style={{color: pal.a, fontSize: 5.5 * u, fontWeight: 900, minWidth: 6 * u}}>{romans[i] || i + 1}</span>
                <span style={{fontSize: fit(l.length, 5.4 * u, 3.8 * u, 24), color: pal.fg, textAlign: "left"}}>{l}</span>
              </div>
            );
          })}
        </div>
      );
    }
    const lines = chunk(c.title.toUpperCase().split(" "), 3);
    const fsz = fit(Math.max(...lines.map((l) => l.length)), 13 * u, 6 * u, 11);
    return (
      <div style={{textAlign: "center", width: "100%", transform: `scale(${s0})`}}>
        <div style={{fontSize: 5 * u, color: pal.a, marginBottom: 2 * u}}>— ✦ —</div>
        {lines.map((l, i) => (
          <div key={i} style={{fontSize: fsz, color: i % 2 ? pal.a : pal.fg, lineHeight: 1.15, letterSpacing: 2, textShadow: i % 2 ? `0 0 20px ${pal.a}55` : "none"}}>
            {l}
          </div>
        ))}
        {c.sub && <div style={{fontSize: 4.5 * u, color: pal.b, marginTop: 3 * u, letterSpacing: 3, opacity: cl((f - 20) / 8)}}>— {c.sub} —</div>}
      </div>
    );
  }
};

const RENDER: Record<string, R> = {motion_graphics: MG, perspective_3d: P3, cutout_collage: CO, blueprint: BP, swiss_poster: SW, isometric: ISO, tech_glow: TG, cyber_terminal: CT, flat_vector: FV, cinematic_noir: CN};

/* ---------- captions: each style has its own look ---------- */
const Caps: React.FC<{scene: Scene; id: string; pal: Pal; u: number; f: number; fps: number; h: number}> = ({scene, id, pal, u, f, fps, h}) => {
  const t = f / fps; let a = -1; scene.words.forEach((w, i) => {if (t >= w.s) a = i;});
  const W = 5, n = scene.words.length, sa = Math.max(0, a); const st = Math.max(0, Math.min(Math.max(0, n - W), sa - 2));
  const vis = (n <= W ? scene.words.map((w, i) => ({...w, i})) : scene.words.slice(st, st + W).map((w, i) => ({...w, i: st + i})));
  const cfg: Record<string, any> = {
    motion_graphics: {bg: pal.fg, fg: pal.bg, ac: pal.a, r: 0.8 * u, up: 1, rot: -1.5, z: 6.6},
    perspective_3d: {bg: "rgba(0,0,0,0.55)", fg: "#fff", ac: pal.b, r: 99, up: 0, rot: 0, z: 5},
    cutout_collage: {bg: "#fff", fg: pal.fg, ac: pal.a, r: 0.3 * u, up: 0, rot: 0, z: 5.2, jit: 1},
    blueprint: {bg: "rgba(0,0,0,0.5)", fg: pal.fg, ac: pal.b, r: 0, up: 1, rot: 0, z: 4.6, bd: `1px dashed ${pal.a}`},
    swiss_poster: {bg: pal.fg, fg: pal.bg, ac: pal.a, r: 0, up: 1, rot: 0, z: 5},
    isometric: {bg: "rgba(0,0,0,0.45)", fg: "#fff", ac: pal.a, r: 1.2 * u, up: 0, rot: 0, z: 5},
    tech_glow: {bg: "rgba(0,0,0,0.6)", fg: "#fff", ac: pal.a, r: 99, up: 0, rot: 0, z: 5.2, bd: `1px solid ${pal.a}88`},
    cyber_terminal: {bg: pal.bg2, fg: pal.fg, ac: pal.a, r: 0, up: 1, rot: 0, z: 4.8, bd: `1px solid ${pal.fg}`},
    flat_vector: {bg: pal.fg, fg: pal.bg, ac: pal.a, r: 2 * u, up: 0, rot: 0, z: 5.2},
    cinematic_noir: {bg: "rgba(0,0,0,0.7)", fg: pal.fg, ac: pal.a, r: 0, up: 1, rot: 0, z: 4.8, bd: `1px solid ${pal.a}66`},
  };
  const k = cfg[id] || cfg.swiss_poster; const j = Math.floor(f / 3);
  return (
    <div style={{position: "absolute", left: 8 * u, right: 8 * u, bottom: h * 0.14, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `${1.2 * u}px ${1.6 * u}px`, fontSize: k.z * u, zIndex: 20, transform: `rotate(${k.rot}deg)`}}>
      {vis.map((w) => {
        const on = w.i === a; const jr = k.jit ? (rng(w.i * 31 + j)() - 0.5) * 3 : 0;
        return <span key={w.i} style={{padding: `${0.5 * u}px ${2 * u}px`, borderRadius: k.r, border: k.bd, textTransform: k.up ? "uppercase" : "none", background: on ? k.ac : k.bg, color: on ? ink(k.ac) : k.fg, opacity: on ? 1 : 0.75, transform: `scale(${on ? 1.12 : 1}) rotate(${jr}deg)`}}>{w.w}</span>;
      })}
    </div>);
};

/* ---------- the scene renderer Video.tsx calls ---------- */
export const StyleScene: React.FC<{plan: Plan; scene: Scene; index: number}> = ({plan, scene, index}) => {
  const shortStyle = getShortStyleById(plan.style?.id || "");
  if (shortStyle) {
    const text = scene.narration || (scene.data && (scene.data.title || scene.data.label)) || "";
    const effectiveStyle = typeof plan.style?.variant === "number" ? { ...shortStyle, variant: Math.abs(plan.style.variant) % 5 } : shortStyle;
    return (
      <AbsoluteFill style={{background: effectiveStyle.palette.bg}}>
        <effectiveStyle.Background p={effectiveStyle.palette} />
        <StyledCaption text={text} style={effectiveStyle} />
      </AbsoluteFill>
    );
  }
  const f = useCurrentFrame(); const {fps, width: w, height: h} = useVideoConfig();
  const u = Math.min(w, h * 0.7) / 100; const {def, pal, seed} = resolve(plan);
  const R_ = RENDER[def.id] || SW; const c = extract(scene);
  const p: P = {c, pal, u, f, fps, seed: seed + index * 97, idx: index, total: plan.scenes.length, w, h};
  const e = index === 0 ? 1 : Easing.bezier(0.7, 0, 0.2, 1)(cl(f / TRANS));
  const tr: React.CSSProperties =
    def.id === "motion_graphics" ? {clipPath: `inset(0 ${(1 - e) * 100}% 0 0)`} :
    def.id === "perspective_3d" ? {transform: `perspective(${90 * u}px) rotateX(${(1 - e) * -80}deg)`, transformOrigin: "50% 100%", opacity: e > 0 ? 1 : 0} :
    def.id === "cutout_collage" ? {transform: `translateY(${(1 - e) * -30}%) rotate(${(1 - e) * -6}deg)`} :
    def.id === "blueprint" ? {opacity: e, filter: `blur(${(1 - e) * 8}px)`} :
    def.id === "swiss_poster" ? {clipPath: `inset(0 0 ${(1 - e) * 100}% 0)`} :
    def.id === "tech_glow" ? {transform: `scale(${0.9 + 0.1 * e})`, opacity: e} :
    def.id === "cyber_terminal" ? {clipPath: `inset(${(1 - e) * 50}% 0 ${(1 - e) * 50}% 0)`} :
    def.id === "flat_vector" ? {transform: `translateX(${(1 - e) * 100}%)`} :
    def.id === "cinematic_noir" ? {opacity: e, filter: `contrast(${1 + (1 - e) * 0.5})`} :
    {transform: `translateY(${(1 - e) * 100}%)`};
  return (
    <AbsoluteFill style={{...tr, fontFamily: def.font, color: pal.fg, background: pal.bg}}>
      {R_.bg(p)}
      <div style={{position: "absolute", inset: 0, padding: `${h * 0.09}px ${7 * u}px ${h * 0.2}px`, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: R_.align, gap: 3 * u, boxSizing: "border-box"}}>
        {R_.body(p)}
      </div>
      <Caps scene={scene} id={def.id} pal={pal} u={u} f={f} fps={fps} h={h} />
    </AbsoluteFill>
  );
};
