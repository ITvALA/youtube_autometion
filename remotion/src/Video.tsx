import React from "react";
import {AbsoluteFill, Easing, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {loadFont as archivo} from "@remotion/google-fonts/ArchivoBlack";
import {loadFont as space} from "@remotion/google-fonts/SpaceGrotesk";
import {loadFont as anton} from "@remotion/google-fonts/Anton";

import {StyleScene, hasStyle} from "./styles/StyleEngine";

const FONT: Record<string, string> = {
  ArchivoBlack: archivo("normal", {weights: ["400"], subsets: ["latin"]}).fontFamily,
  SpaceGrotesk: space("normal", {weights: ["700"], subsets: ["latin"]}).fontFamily,
  Anton: anton("normal", {weights: ["400"], subsets: ["latin"]}).fontFamily,
};

export type Word = {w: string; s: number; e: number};
export type Scene = {type: string; narration: string; durationSec: number; words: Word[]; data: any};
export type TemplateConfig = {
  id: string;
  name?: string;
  backdrop?: string;
  caption_style?: string;
  transition?: string;
  mascot?: boolean;
};
export type Plan = {
  book: {title: string; author: string};
  theme: {
    colors: {bg1: string; bg2: string; ac: string; tx: string; cd: string};
    font: string;
    layout: string;
    pattern: string;
    transition: string;
    chart: string;
    format: {name: string; width: number; height: number};
  };
  template?: TemplateConfig;
  style?: {id: string; variant: number; seed: number};
  scenes: Scene[];
};
type SP = {s: Scene; plan: Plan; u: number};

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const useU = () => {const {width, height} = useVideoConfig(); return Math.min(width, height * 0.7) / 100;};
const TRANS = 18;

const Pattern: React.FC<{p: string; color: string; u: number}> = ({p, color, u}) => {
  const bg: Record<string, string> = {
    grid: `linear-gradient(${color} 1px,transparent 1px),linear-gradient(90deg,${color} 1px,transparent 1px)`,
    dots: `radial-gradient(${color} ${0.25 * u}px,transparent ${0.35 * u}px)`,
    rays: `repeating-conic-gradient(${color} 0 4deg,transparent 4deg 14deg)`,
    diagonal: `repeating-linear-gradient(45deg,${color} 0 ${0.4 * u}px,transparent ${0.4 * u}px ${4 * u}px)`,
  };
  const size = p === "grid" ? `${9 * u}px ${9 * u}px` : p === "dots" ? `${6 * u}px ${6 * u}px` : undefined;
  return <AbsoluteFill style={{backgroundImage: bg[p] || bg.grid, backgroundSize: size, opacity: 0.12}} />;
};

const Hook: React.FC<SP> = ({s, u}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const words = String(s.data.title).split(" ");
  return (<>
    <div style={{fontSize: 15 * u, lineHeight: 1}}>
      {words.map((w, i) => {
        const sp = clamp(spring({frame: Math.max(0, f - 8 - i * 4), fps, config: {damping: 9, mass: 0.6}}), 0, 1.2);
        return <span key={i} style={{display: "inline-block", marginRight: 3 * u, opacity: clamp(sp * 2), transform: `translateY(${(1 - sp) * 6 * u}px) scale(${0.4 + 0.6 * sp})`}}>{w}</span>;
      })}
    </div>
    <div style={{fontSize: 4.4 * u, opacity: 0.8}}>{s.data.sub}</div>
  </>);
};

const Curve: React.FC<SP> = ({s, plan, u}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig();
  const c = plan.theme.colors; const d = s.data || {};
  const up = Number(d.up) || 1.01, down = Number(d.down) || 0.99, N = 50;
  const vmax = Math.max(1.5, Math.pow(up, 365));
  const pts = (r: number) => Array.from({length: N + 1}, (_, i) => {const x = i * 2; const v = Math.pow(r, x * 3.65); return [x, 80 - ((v - 1) / (vmax - 1)) * 70] as [number, number];});
  const U = pts(up), D = pts(down);
  const path = (a: [number, number][]) => a.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1].toFixed(1)}`).join(" ");
  const prog = interpolate(f, [10, 75], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.6, 0, 0.3, 1)});
  const pop = clamp(spring({frame: Math.max(0, f - 78), fps, config: {damping: 8}}), 0, 1.3);
  const st = plan.theme.chart;
  const line: React.CSSProperties = {fill: "none", stroke: c.tx, opacity: 0.55, strokeWidth: 1.8, strokeLinecap: "round", strokeDasharray: 1, strokeDashoffset: 1 - prog};
  const bars = U.filter((_, i) => i % 2 === 0);
  return (
    <svg viewBox="0 0 100 90" style={{width: 84 * u, overflow: "visible"}}>
      <line x1="0" y1="80" x2="100" y2="80" stroke={c.tx} opacity={0.35} strokeWidth={0.6} />
      <path d={path(D)} pathLength={1} style={line} />
      {st === "bars" ? bars.map((p, i) => {const h = (80 - p[1]) * clamp(prog * bars.length - i); return <rect key={i} x={p[0] - 1.5} y={80 - h} width={3} height={h} fill={c.ac} />;}) : (<>
        {st === "area" && <path d={`${path(U)} L100,80 L0,80 Z`} fill={c.ac} opacity={0.25 * prog} />}
        <path d={path(U)} pathLength={1} style={{...line, stroke: c.ac, opacity: 1}} />
      </>)}
      <text x={2} y={12} fontSize={11 * pop} fill={c.ac} opacity={clamp(pop)}>{d.label}</text>
      {d.labelDown && <text x={98} y={76} fontSize={5 * pop} fill={c.tx} textAnchor="end" opacity={clamp(pop)}>{d.labelDown}</text>}
    </svg>
  );
};

const Dial: React.FC<SP> = ({s, plan, u}) => {
  const f = useCurrentFrame(); const c = plan.theme.colors; const d = s.data || {};
  const items: string[] = (d.items || []).slice(0, 6); const n = Math.max(2, items.length); const seg = 1 / n;
  const center = String(d.center || ""); const fs = 14 * Math.min(1, 9 / Math.max(1, center.length));
  return (<>
    <svg viewBox="0 0 100 100" style={{width: 64 * u}}>
      {Array.from({length: n}, (_, i) => (
        <circle key={i} cx={50} cy={50} r={40} fill="none" stroke={c.ac} strokeWidth={7} pathLength={1}
          strokeDasharray={`${seg - 0.02} ${1 - seg + 0.02}`} transform={`rotate(${(i * 360) / n - 90} 50 50)`} opacity={clamp((f - 8 - i * 10) / 10)} />
      ))}
      <text x={50} y={50 + fs / 3} textAnchor="middle" fontSize={fs} fill={c.tx}>{center}</text>
    </svg>
    <div style={{display: "flex", flexWrap: "wrap", gap: 2 * u, justifyContent: plan.theme.layout === "left" ? "flex-start" : "center"}}>
      {items.map((t, i) => {const o = clamp((f - 14 - i * 10) / 10); return <span key={i} style={{fontSize: 4.6 * u, padding: `${u}px ${2.4 * u}px`, borderRadius: 99, background: c.cd, opacity: o, transform: `translateY(${(1 - o) * 2 * u}px)`}}>{t}</span>;})}
    </div>
  </>);
};

const Card: React.FC<SP> = ({s, plan, u}) => {
  const f = useCurrentFrame(); const {fps} = useVideoConfig(); const lines: string[] = ((s.data || {}).lines || []).slice(0, 4);
  return (
    <div style={{background: plan.theme.colors.cd, border: "1px solid rgba(255,255,255,0.35)", borderRadius: 6 * u, padding: 5 * u, width: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 4 * u}}>
      {lines.map((t, i) => {const sp = clamp(spring({frame: Math.max(0, f - 8 - i * 12), fps, config: {damping: 14}})); return <div key={i} style={{fontSize: 6.2 * u, lineHeight: 1.15, opacity: sp, transform: `translateX(${(1 - sp) * -8 * u}px)`}}>{t}</div>;})}
    </div>
  );
};

const Quote: React.FC<SP> = ({s, u}) => {
  const f = useCurrentFrame(); const d = s.data || {}; const words = String(d.quote).split(" ");
  return (<>
    <div style={{fontSize: 7.5 * u, lineHeight: 1.12}}>
      {words.map((w, i) => {const o = clamp((f - 6 - i * 4) / 6); return <span key={i} style={{display: "inline-block", marginRight: 2 * u, opacity: o, transform: `translateY(${(1 - o) * 3 * u}px)`}}>{w}</span>;})}
    </div>
    <div style={{fontSize: 4.6 * u, opacity: clamp((f - 6 - words.length * 4) / 10) * 0.8}}>{d.by}</div>
  </>);
};

import {AnimeParallaxScene} from "./components/scenes/AnimeParallaxScene";
import {MotionComicScene} from "./components/scenes/MotionComicScene";
import {StoryScene, CharacterScene} from "./Story";
import {QuizScene} from "./templates/QuizScene";
import {KineticBurstScene} from "./templates/KineticBurstScene";
import {PaperScene} from "./templates/PaperScene";
import {TerminalScene} from "./templates/TerminalScene";
import {StickyNotesScene} from "./templates/StickyNotesScene";
import {ComicPanelsScene} from "./templates/ComicPanelsScene";
import {ChalkboardScene} from "./templates/ChalkboardScene";
import {TimelineScene} from "./templates/TimelineScene";
import {CountdownScene} from "./templates/CountdownScene";
import {BeforeAfterScene} from "./templates/BeforeAfterScene";
import {QuotePosterScene} from "./templates/QuotePosterScene";
import {HabitTrackerScene} from "./templates/HabitTrackerScene";
import {CyberGlitchScene} from "./templates/CyberGlitchScene";
import {PaperCutScene} from "./templates/PaperCutScene";
import {GradientFlowScene} from "./templates/GradientFlowScene";
import {TemplateBackdrop} from "./templates/Backdrops";

const SCENES: Record<string, React.FC<SP>> = {
  hook: Hook,
  curve: Curve,
  dial: Dial,
  card: Card,
  quote: Quote,
  story: StoryScene,
  character: CharacterScene,
  animeParallax: AnimeParallaxScene,
  motionComic: MotionComicScene,
  quiz: QuizScene,
  kineticBurst: KineticBurstScene,
  paper: PaperScene,
  terminal: TerminalScene,
  stickyNotes: StickyNotesScene,
  comicPanels: ComicPanelsScene,
  chalkboard: ChalkboardScene,
  timeline: TimelineScene,
  countdown: CountdownScene,
  beforeAfter: BeforeAfterScene,
  quotePoster: QuotePosterScene,
  habitTracker: HabitTrackerScene,
  cyberGlitch: CyberGlitchScene,
  paperCut: PaperCutScene,
  gradientFlow: GradientFlowScene,
};

const Captions: React.FC<{scene: Scene; plan: Plan; u: number}> = ({scene, plan, u}) => {
  const f = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const c = plan.theme.colors;
  const t = f / fps;
  let active = -1;
  scene.words.forEach((w, i) => {if (t >= w.s) active = i;});

  // Strict 9:16 safe area: bottom 14%
  const bottom = height * 0.14;
  const capStyle = plan.template?.caption_style || "pill";

  // Modern dynamic 4-5 word sliding window (prevents caption clutter)
  const windowSize = 5;
  const safeActive = active < 0 ? 0 : active;
  const startIdx = Math.max(0, Math.min(Math.max(0, scene.words.length - windowSize), safeActive - 2));
  const visibleWords = scene.words.length <= windowSize 
    ? scene.words.map((w, i) => ({...w, origIdx: i}))
    : scene.words.slice(startIdx, startIdx + windowSize).map((w, i) => ({...w, origIdx: startIdx + i}));

  return (
    <div style={{
      position: "absolute",
      left: 8 * u,
      right: 8 * u,
      bottom,
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      alignItems: "center",
      gap: `${1.2 * u}px ${1.8 * u}px`,
      fontSize: 5.2 * u,
      zIndex: 20
    }}>
      {visibleWords.map((w) => {
        const isActive = w.origIdx === active;
        let badgeStyle: React.CSSProperties = {
          padding: `${0.6 * u}px ${2.2 * u}px`,
          borderRadius: 99,
          opacity: isActive ? 1 : 0.6,
          background: isActive ? c.ac : "rgba(0,0,0,0.4)",
          color: isActive ? c.bg1 : "#F8FAFC",
          transform: isActive ? "scale(1.14)" : "none",
          fontWeight: isActive ? 800 : 600,
          boxShadow: isActive ? `0 4px 20px ${c.ac}44` : "none",
          transition: "all 0.12s ease"
        };

        if (capStyle === "bold") {
          badgeStyle = {
            ...badgeStyle,
            fontWeight: "900",
            textTransform: "uppercase",
            background: isActive ? c.ac : "rgba(0,0,0,0.6)",
            color: isActive ? "#000" : "#FFF"
          };
        } else if (capStyle === "cyber") {
          badgeStyle = {
            ...badgeStyle,
            fontFamily: "'JetBrains Mono', monospace",
            borderRadius: 6,
            border: isActive ? `2px solid ${c.ac}` : "1px solid rgba(255,255,255,0.15)",
            color: isActive ? c.ac : "#E2E8F0",
            background: isActive ? "rgba(0,0,0,0.85)" : "rgba(0,0,0,0.4)"
          };
        } else if (capStyle === "chalk") {
          badgeStyle = {
            ...badgeStyle,
            fontFamily: "monospace",
            border: isActive ? "2px dashed #FDE047" : "none",
            color: isActive ? "#FDE047" : "#FFF"
          };
        } else if (capStyle === "minimal") {
          badgeStyle = {
            ...badgeStyle,
            background: "transparent",
            color: isActive ? c.ac : "#E2E8F0",
            textDecoration: isActive ? "underline" : "none"
          };
        }

        return <span key={w.origIdx} style={badgeStyle}>{w.w}</span>;
      })}
    </div>
  );
};

const SceneWrap: React.FC<{plan: Plan; scene: Scene; index: number}> = ({plan, scene, index}) => {
  const f = useCurrentFrame();
  const u = useU();

  // StyleEngine: completely different art direction per style
  if (hasStyle(plan)) return <StyleScene plan={plan} scene={scene} index={index} />;

  const t = plan.theme;
  const c = t.colors;
  const p = index === 0 ? 1 : interpolate(f, [0, TRANS], [0, 1], {extrapolateRight: "clamp", easing: Easing.bezier(0.7, 0, 0.2, 1)});
  
  let tr: React.CSSProperties;
  const transitionType = plan.template?.transition || t.transition;
  if (transitionType === "wipe") tr = {clipPath: `circle(${p * 150}% at 50% 60%)`};
  else if (transitionType === "slide") tr = {transform: `translateX(${(1 - p) * 100}%)`};
  else if (transitionType === "zoom") tr = {transform: `scale(${1.5 - 0.5 * p})`, opacity: p};
  else tr = {transform: `perspective(${120 * u}px) rotateY(${(1 - p) * -90}deg)`, opacity: p > 0 ? 1 : 0};

  const Comp = SCENES[scene.type] || Hook;
  const left = t.layout === "left";

  return (
    <AbsoluteFill style={{background: `linear-gradient(150deg,${c.bg1},${c.bg2})`, ...tr}}>
      <Pattern p={t.pattern} color={c.tx} u={u} />
      <TemplateBackdrop type={plan.template?.backdrop} colors={c} u={u} />
      <AbsoluteFill style={{
        justifyContent: "center",
        alignItems: left ? "flex-start" : "center",
        textAlign: left ? "left" : "center",
        padding: `8% ${8 * u}px 14% ${8 * u}px`,
        gap: 5 * u,
        color: c.tx,
        fontFamily: FONT[t.font] || FONT.ArchivoBlack,
        boxSizing: "border-box"
      }}>
        <Comp s={scene} plan={plan} u={u} />
      </AbsoluteFill>
      <Captions scene={scene} plan={plan} u={u} />
    </AbsoluteFill>
  );
};

export const Main: React.FC<Plan> = (plan) => {
  const {fps} = useVideoConfig();
  let from = 0;
  const last = plan.scenes.length - 1;
  return (
    <AbsoluteFill style={{background: plan.theme.colors.bg1}}>
      {plan.scenes.map((s, i) => {
        const d = Math.round(s.durationSec * fps);
        const el = <Sequence key={i} from={from} durationInFrames={d + (i < last ? TRANS : 0)}><SceneWrap plan={plan} scene={s} index={i} /></Sequence>;
        from += d;
        return el;
      })}
    </AbsoluteFill>
  );
};
