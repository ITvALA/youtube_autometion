import React from "react";
import {LabelKind, VoxPal, clamp, rgba} from "./types";

/* Illustration ke neeche label: 6 hand-drawn types. t = reveal progress (0..1). */
export const Label: React.FC<{text: string; kind: LabelKind; pal: VoxPal; ink: string; family: string; weight: number; size: number; upper: boolean; t: number}> = ({
  text, kind, pal, ink, family, weight, size, upper, t,
}) => {
  const tt = clamp(t);
  const base: React.CSSProperties = {position: "relative", display: "inline-block", fontFamily: family, fontWeight: weight, fontSize: size, lineHeight: 1.15, color: ink, textTransform: upper ? "uppercase" : undefined, textAlign: "center", opacity: clamp(tt * 3)};
  const draw = (d: string, vb: string, sw: number, color: string, style: React.CSSProperties) => (
    <svg viewBox={vb} preserveAspectRatio="none" style={{position: "absolute", overflow: "visible", pointerEvents: "none", ...style}}>
      <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" strokeDasharray={1} strokeDashoffset={1 - tt} />
    </svg>
  );
  if (kind === "underline")
    return <span style={base}>{text}{draw("M2 8 Q25 2 50 7 T98 6", "0 0 100 12", Math.max(4, size * 0.09), pal.c1, {left: 0, right: 0, bottom: -size * 0.22, width: "100%", height: size * 0.3})}</span>;
  if (kind === "marker")
    return <span style={{...base, padding: `0 ${size * 0.3}px`, zIndex: 0}}>
      <span style={{position: "absolute", left: 0, top: "12%", bottom: "4%", width: `${tt * 100}%`, background: rgba(pal.c3, 0.92), transform: "skewX(-6deg)", borderRadius: size * 0.1, zIndex: -1}} />{text}</span>;
  if (kind === "tag")
    return <span style={{...base, background: pal.c1, color: pal.light, padding: `${size * 0.14}px ${size * 0.5}px`, borderRadius: size * 0.5, transform: `scale(${0.7 + 0.3 * tt}) rotate(-1.5deg)`, boxShadow: `0 ${size * 0.12}px 0 ${rgba(pal.ink, 0.25)}`}}>{text}</span>;
  if (kind === "circle")
    return <span style={{...base, padding: `${size * 0.2}px ${size * 0.55}px`}}>{text}{draw("M50 4 C86 2 98 14 96 22 C94 34 66 38 40 37 C12 36 2 28 5 18 C8 8 30 3 62 5", "0 0 100 40", Math.max(4, size * 0.08), pal.c1, {left: 0, top: 0, width: "100%", height: "100%"})}</span>;
  if (kind === "stamp")
    return <span style={{...base, border: `${Math.max(4, size * 0.07)}px double ${pal.c1}`, color: pal.c1, padding: `${size * 0.12}px ${size * 0.4}px`, transform: `rotate(-3deg) scale(${1.25 - 0.25 * tt})`, textTransform: "uppercase", letterSpacing: size * 0.04}}>{text}</span>;
  return <span style={base}>{text}</span>;
};
