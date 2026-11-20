import React, {useMemo} from "react";
import {Easing, interpolate, spring} from "remotion";
import {geoMercator, geoPath} from "d3-geo";
import states from "./data/india-states.json";
import districts from "./data/india-districts.json";
import type {PFScene} from "./types";

/** Bharat -> rajya -> khaas jagah: ek paper-cut map jo teen stage me zoom hota hai.
 *  stage 0: poora Bharat, stage 1 (words[hit]): rajya par zoom, stage 2 (words[hit2]): jagah par zoom + pin. */

type Feat = {n: string; s?: string; t: string; c: any};
const ST = states as unknown as Feat[];
const DT = districts as unknown as Feat[];
const toFeature = (f: Feat) => ({type: "Feature" as const, properties: {n: f.n, s: f.s}, geometry: {type: f.t, coordinates: f.c} as any});

// Hindi / Hinglish naam -> st_nm
const ALIAS: Record<string, string[]> = {
  "Gujarat": ["gujarat", "गुजरात"], "Rajasthan": ["rajasthan", "राजस्थान"], "Maharashtra": ["maharashtra", "महाराष्ट्र"],
  "Uttar Pradesh": ["uttar pradesh", "up", "उत्तर प्रदेश"], "Madhya Pradesh": ["madhya pradesh", "mp", "मध्य प्रदेश"],
  "Bihar": ["bihar", "बिहार"], "West Bengal": ["west bengal", "bengal", "पश्चिम बंगाल"], "Odisha": ["odisha", "orissa", "ओडिशा"],
  "Tamil Nadu": ["tamil nadu", "तमिलनाडु"], "Kerala": ["kerala", "केरल"], "Karnataka": ["karnataka", "कर्नाटक"],
  "Andhra Pradesh": ["andhra pradesh", "आंध्र प्रदेश"], "Telangana": ["telangana", "तेलंगाना"], "Assam": ["assam", "असम"],
  "Punjab": ["punjab", "पंजाब"], "Haryana": ["haryana", "हरियाणा"], "Himachal Pradesh": ["himachal pradesh", "himachal", "हिमाचल प्रदेश"],
  "Uttarakhand": ["uttarakhand", "उत्तराखंड"], "Jharkhand": ["jharkhand", "झारखंड"], "Chhattisgarh": ["chhattisgarh", "छत्तीसगढ़"],
  "Delhi": ["delhi", "दिल्ली"], "Goa": ["goa", "गोवा"], "Jammu and Kashmir": ["jammu and kashmir", "kashmir", "जम्मू और कश्मीर", "कश्मीर"],
  "Ladakh": ["ladakh", "लद्दाख"], "Sikkim": ["sikkim", "सिक्किम"], "Arunachal Pradesh": ["arunachal pradesh", "अरुणाचल प्रदेश"],
  "Nagaland": ["nagaland", "नागालैंड"], "Manipur": ["manipur", "मणिपुर"], "Meghalaya": ["meghalaya", "मेघालय"],
  "Mizoram": ["mizoram", "मिज़ोरम", "मिजोरम"], "Tripura": ["tripura", "त्रिपुरा"],
};
const HI: Record<string, string> = {
  "Gujarat": "गुजरात", "Rajasthan": "राजस्थान", "Maharashtra": "महाराष्ट्र", "Uttar Pradesh": "उत्तर प्रदेश", "Madhya Pradesh": "मध्य प्रदेश",
  "Bihar": "बिहार", "West Bengal": "पश्चिम बंगाल", "Odisha": "ओडिशा", "Tamil Nadu": "तमिलनाडु", "Kerala": "केरल", "Karnataka": "कर्नाटक",
  "Andhra Pradesh": "आंध्र प्रदेश", "Telangana": "तेलंगाना", "Assam": "असम", "Punjab": "पंजाब", "Haryana": "हरियाणा",
  "Himachal Pradesh": "हिमाचल प्रदेश", "Uttarakhand": "उत्तराखंड", "Jharkhand": "झारखंड", "Chhattisgarh": "छत्तीसगढ़", "Delhi": "दिल्ली",
  "Goa": "गोवा", "Jammu and Kashmir": "जम्मू और कश्मीर", "Ladakh": "लद्दाख", "Sikkim": "सिक्किम", "Arunachal Pradesh": "अरुणाचल प्रदेश",
  "Nagaland": "नागालैंड", "Manipur": "मणिपुर", "Meghalaya": "मेघालय", "Mizoram": "मिज़ोरम", "Tripura": "त्रिपुरा",
};
export const findState = (q?: string): string | undefined => {
  if (!q) return undefined;
  const t = q.trim().toLowerCase();
  const exact = ST.find((s) => s.n.toLowerCase() === t);
  if (exact) return exact.n;
  for (const [k, al] of Object.entries(ALIAS)) if (al.some((a) => a.toLowerCase() === t)) return k;
  return undefined;
};

const DW = 772, DH = 860;           // default map window (px) inside the paper sheet (card mode)
const PALETTE = ["#efe3c6", "#e3d3ab", "#f3ead2", "#dcc9a0", "#ead9b3"];
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = Easing.bezier(0.65, 0, 0.25, 1);

type View = {k: number; tx: number; ty: number};
type Win = {w: number; h: number; top: number; bottom: number};
const fit = (b: [[number, number], [number, number]], pad: number, W: Win): View => {
  const bw = b[1][0] - b[0][0], bh = b[1][1] - b[0][1];
  const availH = W.h - W.top - W.bottom;
  const k = Math.min((W.w - pad * 2) / bw, (availH - pad * 2) / bh);
  const sy = W.top + availH / 2;
  return {k, tx: W.w / 2 - k * (b[0][0] + bw / 2), ty: sy - k * (b[0][1] + bh / 2)};
};

/** frames at which the map zooms to the state / the place (shared with the caption line under the map) */
export const mapTimes = (s: PFScene, fps: number) => ({
  t1: Math.round((s.words[s.hit ?? Math.floor(s.words.length * 0.3)]?.s ?? 0.8) * fps),
  t2: Math.round((s.words[s.hit2 ?? Math.floor(s.words.length * 0.62)]?.s ?? 2) * fps),
  Z: 22,
});

export const MapItem: React.FC<{s: PFScene; lf: number; fps: number; accent: string; accentDark: string; full?: boolean; w?: number; h?: number}> = ({s, lf, fps, accent, accentDark, full = false, w, h}) => {
  const MW = w ?? DW, MH = h ?? DH;
  const WIN: Win = full ? {w: MW, h: MH, top: 330, bottom: 560} : {w: MW, h: MH, top: 0, bottom: 0};
  const SY = WIN.top + (MH - WIN.top - WIN.bottom) / 2;
  const stName = findState(s.state);
  const pl = s.place;

  const m = useMemo(() => {
    const all = {type: "FeatureCollection" as const, features: ST.map(toFeature)};
    const proj = geoMercator().fitSize([MW, MH], all as any);
    const path = geoPath(proj);
    const stPaths = ST.map((f, i) => ({n: f.n, d: path(toFeature(f) as any) || "", c: PALETTE[i % PALETTE.length]}));
    const stFeat = ST.find((f) => f.n === stName);
    const dSel = stFeat ? DT.filter((f) => f.s === stName) : [];
    const dPaths = dSel.map((f) => ({n: f.n, d: path(toFeature(f) as any) || ""}));
    const v0 = fit(path.bounds(all as any) as any, full ? 30 : 20, WIN);
    const v1 = stFeat ? fit(path.bounds(toFeature(stFeat) as any) as any, full ? 40 : 70, WIN) : v0;
    let v2 = v1, pt: [number, number] | null = null;
    if (pl) {
      const p = proj([pl.lon, pl.lat]) as [number, number];
      pt = p;
      const span = s.span ?? 1.1;
      const a = proj([pl.lon - span + span * 0.4, pl.lat + span * 1.1]) as [number, number], b = proj([pl.lon + span + span * 0.4, pl.lat - span * 1.1]) as [number, number];
      v2 = fit([[a[0], a[1]], [b[0], b[1]]], 10, WIN);
    }
    const sel = pl ? dSel.find((f) => f.n === s.district) : undefined;
    const selD = sel ? path(toFeature(sel) as any) : null;
    const stSel = stFeat ? path(toFeature(stFeat) as any) : null;
    return {stPaths, dPaths, v0, v1, v2, pt, selD, stSel};
  }, [stName, pl?.lat, pl?.lon, s.district, s.span, full, MW, MH]);

  const t1 = Math.round((s.words[s.hit ?? Math.floor(s.words.length * 0.3)]?.s ?? 0.8) * fps);
  const t2 = Math.round((s.words[s.hit2 ?? Math.floor(s.words.length * 0.62)]?.s ?? 2) * fps);
  const Z = 22; // zoom travel frames
  const p1 = ease(clamp((lf - t1) / Z)), p2 = ease(clamp((lf - t2) / Z));
  const lerpV = (a: View, b: View, p: number): View => ({k: a.k * Math.pow(b.k / a.k, p), tx: a.tx + (b.tx - a.tx) * p, ty: a.ty + (b.ty - a.ty) * p});
  // translate is not linear in log-zoom; blend the *center* instead so the zoom feels like a camera, not a slide
  const cen = (v: View) => ({x: (MW / 2 - v.tx) / v.k, y: (SY - v.ty) / v.k});
  const blend = (a: View, b: View, p: number): View => {
    const k = a.k * Math.pow(b.k / a.k, p), ca = cen(a), cb = cen(b);
    const cx = ca.x + (cb.x - ca.x) * p, cy = ca.y + (cb.y - ca.y) * p;
    return {k, tx: MW / 2 - k * cx, ty: SY - k * cy};
  };
  const v = blend(blend(m.v0, m.v1, p1), m.v2, p2);

  const stageOneOn = p1 > 0, hasDist = m.dPaths.length > 0;
  const distOp = clamp(p1 * 1.4 - 0.2) * (1 - 0 * p2);
  const line = (px: number) => px / v.k;
  const pinS = pl && m.pt ? spring({frame: Math.max(0, lf - t2 - Z * 0.6), fps, config: {damping: 9, stiffness: 160}}) : 0;
  const lab0 = 1 - clamp(p1 * 2), lab1 = clamp(p1 * 2 - 0.4) * (1 - clamp(p2 * 2)), lab2 = clamp(p2 * 2 - 0.5);

  const stLabel = stName ? HI[stName] || stName : "";
  const chip = (text: string, op: number, bg: string, color: string, y: number) => (
    <div style={{position: "absolute", left: 0, right: 0, top: y, display: "flex", justifyContent: "center", opacity: op, transform: `translateY(${(1 - op) * -16}px)`}}>
      <div style={{background: bg, color, fontFamily: "'PF Display','Mukta',serif", fontSize: 64, padding: "6px 36px", borderRadius: 8, boxShadow: "0 6px 12px rgba(40,25,10,.3)", transform: "rotate(-1.5deg)"}}>{text}</div>
    </div>
  );

  return (
    <div style={{position: "relative", width: MW, height: MH, overflow: "hidden", borderRadius: full ? 0 : 8, background: "#bcd3cf", boxShadow: full ? "none" : "inset 0 0 0 6px #fbf5e6, inset 0 0 40px rgba(20,60,60,.25)"}}>
      <svg width={MW} height={MH} viewBox={`0 0 ${MW} ${MH}`} style={{position: "absolute", left: 0, top: 0}}>
        <g transform={`translate(${v.tx} ${v.ty}) scale(${v.k})`}>
          {/* paper shadow layer, then the pieces */}
          <g transform={`translate(${line(7)} ${line(9)})`} fill="#7a6a4a" opacity={0.55}>{m.stPaths.map((p) => <path key={"sh" + p.n} d={p.d} />)}</g>
          {m.stPaths.map((p) => (
            <path key={p.n} d={p.d} fill={p.n === stName ? (hasDist && stageOneOn ? "#f6eed8" : "#f6eed8") : p.c} stroke="#fbf5e6" strokeWidth={line(3)} strokeLinejoin="round" opacity={stName && p.n !== stName ? 1 - 0.35 * p1 : 1} />
          ))}
          {stName && m.stSel && <path d={m.stSel} fill="none" stroke={accent} strokeWidth={line(6)} strokeLinejoin="round" opacity={clamp(p1 * 3)} />}
          {hasDist && <g opacity={distOp}>{m.dPaths.map((p) => <path key={p.n} d={p.d} fill="none" stroke="#b8a273" strokeWidth={line(1.4)} />)}</g>}
          {m.selD && <path d={m.selD} fill={accent} fillOpacity={0.45 * clamp(p2 * 2)} stroke={accentDark} strokeWidth={line(3)} strokeOpacity={clamp(p2 * 2)} />}
          {pl && m.pt && pinS > 0 && (
            <g transform={`translate(${m.pt[0]} ${m.pt[1]}) scale(${line(1)})`}>
              <ellipse cx={0} cy={2} rx={20 * pinS} ry={7 * pinS} fill="rgba(0,0,0,.28)" />
              <g transform={`translate(0 ${-(1 - clamp(pinS, 0, 1)) * 120})`}>
                <path d="M0,0 C-26,-40 -34,-62 -34,-76 A34,34 0 1 1 34,-76 C34,-62 26,-40 0,0Z" fill="#d8452e" stroke="#9c2c1b" strokeWidth={4} />
                <circle cx={0} cy={-76} r={13} fill="#fbf5e6" />
              </g>
            </g>
          )}
        </g>
      </svg>
      {full && <div style={{position: "absolute", inset: 0, background: "linear-gradient(rgba(10,6,2,.55) 0%, rgba(10,6,2,0) 26%, rgba(10,6,2,0) 52%, rgba(10,6,2,.7) 100%), radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 45%, rgba(10,6,2,.55) 100%)"}} />}
      {!full && chip("भारत", lab0, "#fbf5e6", "#1d1b1a", 26)}
      {!full && stName && chip(stLabel, lab1, accent, "#fbf5e6", 26)}
      {!full && pl && chip(pl.name, lab2, "#fbf5e6", "#1d1b1a", 26)}
    </div>
  );
};
