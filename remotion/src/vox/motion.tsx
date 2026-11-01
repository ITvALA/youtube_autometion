import React from "react";
import {AbsoluteFill, Easing, random, useCurrentFrame, useVideoConfig} from "remotion";

/*
 * VOX MOTION: do shared effects jo sab 212 styles me use hote hain.
 *   CameraRig : paper par slow push / pull / drift / sway (parallax: paper alag, illustration alag)
 *   Particles : paper par halki dhool (sirf kuch styles me, st.dust)
 */
export type Cam = "push" | "pull" | "drift" | "sway" | "tilt";
export type Shape = "dot" | "square" | "ring" | "plus" | "line" | "glyph";
const cl = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/* ---------------- camera ---------------- */
export const CameraRig: React.FC<{cam: Cam; amount?: number; children: React.ReactNode}> = ({cam, amount = 1, children}) => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const t = cl(f / Math.max(1, d));
  const e = Easing.inOut(Easing.quad)(t);
  const k = amount;
  let tf: string;
  if (cam === "push") tf = `scale(${1 + 0.09 * k * e})`;
  else if (cam === "pull") tf = `scale(${1 + 0.1 * k * (1 - e)})`;
  else if (cam === "drift") tf = `translate(${Math.sin(f * 0.018) * 1.6 * k}%, ${Math.cos(f * 0.014) * 1.2 * k}%) scale(${1.07 + 0.02 * k})`;
  else if (cam === "sway") tf = `translate(${Math.sin(f * 0.03) * 1.4 * k}%, ${Math.sin(f * 0.021) * 0.8 * k}%) rotate(${Math.sin(f * 0.025) * 1.1 * k}deg) scale(${1.1 + 0.02 * k})`;
  else tf = `perspective(1700px) rotateY(${Math.sin(f * 0.02) * 2.4 * k}deg) rotateX(${Math.cos(f * 0.017) * 1.6 * k}deg) scale(${1.1 + 0.02 * k})`;
  return <AbsoluteFill style={{transform: tf, transformOrigin: "50% 50%"}}>{children}</AbsoluteFill>;
};

/* ---------------- particles ---------------- */
export const Particles: React.FC<{color: string; seed: number; shape: Shape; count: number; speed: number; glyphs?: string}> = ({
  color, seed, shape, count, speed, glyphs = "01<>/{}$#",
}) => {
  const f = useCurrentFrame();
  const {width: w} = useVideoConfig();
  const sc = w / 1080;
  const items = [];
  for (let i = 0; i < count; i++) {
    const r = (n: number) => random(`mp-${seed}-${i}-${n}`);
    const size = (6 + r(2) * 16) * sc * (shape === "glyph" ? 1.6 : 1);
    const spd = (0.25 + r(3)) * speed;
    const phase = r(4) * Math.PI * 2;
    const rise = (r(5) * 100 + f * spd * 0.12) % 100; // 0..100
    const y = 100 - rise;
    const x = r(1) * 100 + Math.sin(f * 0.02 + phase) * 2.5;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(f * 0.05 + phase));
    const op = tw * Math.sin(Math.PI * cl(y / 100)) * 0.55;
    const base: React.CSSProperties = {position: "absolute", left: `${x}%`, top: `${y}%`, opacity: op, color, pointerEvents: "none"};
    let node: React.ReactNode;
    if (shape === "dot") node = <div style={{...base, width: size, height: size, borderRadius: "50%", background: color, boxShadow: `0 0 ${size * 1.6}px ${color}`}} />;
    else if (shape === "square") node = <div style={{...base, width: size, height: size, background: color, transform: `rotate(${f * spd * 0.8 + phase * 40}deg)`}} />;
    else if (shape === "ring") node = <div style={{...base, width: size * 1.6, height: size * 1.6, borderRadius: "50%", border: `${Math.max(2, size * 0.18)}px solid ${color}`}} />;
    else if (shape === "plus") node = <div style={{...base, fontSize: size * 2, lineHeight: 1, fontWeight: 300, transform: `rotate(${f * spd * 0.4}deg)`}}>+</div>;
    else if (shape === "line") node = <div style={{...base, width: Math.max(2, size * 0.18), height: size * 7, borderRadius: 99, background: `linear-gradient(to bottom, transparent, ${color})`}} />;
    else node = <div style={{...base, fontSize: size, fontFamily: "monospace", fontWeight: 700}}>{glyphs[Math.floor(r(6) * glyphs.length)]}</div>;
    items.push(<React.Fragment key={i}>{node}</React.Fragment>);
  }
  return <AbsoluteFill style={{overflow: "hidden", pointerEvents: "none"}}>{items}</AbsoluteFill>;
};
