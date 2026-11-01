import React from "react";
import {AbsoluteFill} from "remotion";
import {PaperDef, rgba} from "./types";

/* Paper-texture background: grain (SVG noise tile), halki pattern (grid/dots/lines), edge shading. */
const noise = (freq: number, octaves: number, seed: number) =>
  `url("data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='${freq}' numOctaves='${octaves}' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.25  0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 0.9 -0.25'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`
  )}")`;

export const PaperBG: React.FC<{paper: PaperDef; seed: number; u: number}> = ({paper, seed, u}) => {
  const k = paper.kind;
  const line = rgba(paper.ink, 0.07);
  const pattern: React.CSSProperties =
    k === "grid" ? {backgroundImage: `linear-gradient(${line} 1px,transparent 1px),linear-gradient(90deg,${line} 1px,transparent 1px)`, backgroundSize: `${5 * u}px ${5 * u}px`} :
    k === "dots" ? {backgroundImage: `radial-gradient(${rgba(paper.ink, 0.13)} ${0.28 * u}px,transparent ${0.32 * u}px)`, backgroundSize: `${3.4 * u}px ${3.4 * u}px`} :
    k === "lines" ? {backgroundImage: `repeating-linear-gradient(0deg,${line} 0 1px,transparent 1px ${3.2 * u}px)`} : {};
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 42%, ${paper.base} 38%, ${paper.edge} 118%)`}}>
      <AbsoluteFill style={pattern} />
      <AbsoluteFill style={{backgroundImage: noise(k === "kraft" ? 0.45 : 0.85, k === "kraft" ? 2 : 3, (seed % 90) + 1), backgroundSize: "320px 320px", opacity: 0.18 + paper.grain * 0.3, mixBlendMode: "multiply"}} />
      {k === "kraft" && <AbsoluteFill style={{backgroundImage: noise("0.02 0.4" as any, 2, 7), backgroundSize: "640px 640px", opacity: 0.22, mixBlendMode: "multiply"}} />}
      <AbsoluteFill style={{background: `linear-gradient(115deg, rgba(255,255,255,0.0) 40%, rgba(255,255,255,0.16) 50%, rgba(255,255,255,0.0) 60%)`}} />
      <AbsoluteFill style={{boxShadow: `inset 0 0 ${10 * u}px ${rgba(paper.ink, 0.1)}`}} />
    </AbsoluteFill>
  );
};
