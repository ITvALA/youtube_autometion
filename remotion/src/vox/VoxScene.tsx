import React from "react";
import {AbsoluteFill, Easing, spring, useCurrentFrame, useVideoConfig} from "remotion";
import type {Plan, Scene} from "../Video";
import {CameraRig, Particles} from "./motion";
import {ICONS, Icon} from "./icons";
import {CountryMap} from "./geo";
import {SvgCharacter} from "./SvgCharacter";
import {PaperBG} from "./paper";
import {Label} from "./labels";
import {FAMILY} from "./fonts";
import {VOX_STYLES, getVoxStyle} from "./styleTable";
import {voxContent} from "./content";
import {CamKind, TransKind, VoxContent, VoxItem, VoxStyle, clamp, hashStr, rgba} from "./types";

const TRANS = 18; // Video.tsx ke TRANS ke barabar

export const hasStyle = (plan: Plan) => !!(plan as any).style?.id;

export const resolveVoxStyle = (plan: Plan): VoxStyle => {
  const id = String((plan as any).style?.id || "");
  return getVoxStyle(id) || VOX_STYLES[hashStr(id || plan.book?.title || "mindspark") % VOX_STYLES.length];
};

const pop = (f: number, fps: number, delay: number, damp = 11) =>
  clamp(spring({frame: Math.max(0, f - delay), fps, config: {damping: damp, mass: 0.7, stiffness: 130}}), 0, 1.12);

/* ---------------- one illustration + label ---------------- */
const Piece: React.FC<{item: VoxItem; st: VoxStyle; size: number; labelSize: number; delay: number; f: number; fps: number; phase: number; maxLabelW?: number}> = ({
  item, st, size, labelSize, delay, f, fps, phase, maxLabelW,
}) => {
  const s = pop(f, fps, delay);
  const lt = clamp((f - delay - 8) / 14);
  const bob = Math.sin(f * 0.06 + phase) * size * 0.015;
  const isMap = item.icon.startsWith("map:");
  const isChar = item.icon.startsWith("char:") || ["raja", "king", "krishna", "warrior", "yoddha", "senapati"].includes(item.icon);
  const ink = st.paper.ink;
  return (
    <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: labelSize * 0.55, width: maxLabelW}}>
      <div style={{width: size, height: size, transform: `translateY(${bob}px) scale(${s}) rotate(${(1 - clamp(s)) * -8}deg)`, filter: `drop-shadow(0 ${size * 0.03}px ${size * 0.04}px ${rgba(ink, 0.22)})`}}>
        {isChar ? (
          <SvgCharacter name={item.icon} p={st.pal} size={size} f={f} />
        ) : isMap ? (
          <CountryMap name={item.icon.slice(4)} p={st.pal} size={size} f={f} />
        ) : (
          <Icon name={ICONS[item.icon] ? item.icon : "question"} p={st.pal} f={f} size={size} />
        )}
      </div>
      {item.label ? (
        <div style={{maxWidth: maxLabelW ?? size * 1.5, textAlign: "center"}}>
          <Label text={item.label} kind={st.label} pal={st.pal} ink={ink} family={FAMILY[st.font.id]} weight={st.font.weight} size={labelSize} upper={st.font.upper && st.label !== "stamp"} t={lt} />
        </div>
      ) : null}
    </div>
  );
};

const fitSize = (len: number, max: number, min: number, chars: number) => Math.max(min, Math.min(max, (max * chars) / Math.max(chars, len)));

/* ---------------- layouts ---------------- */
type LP = {c: VoxContent; st: VoxStyle; f: number; fps: number; S: number; areaH: number};

const Single: React.FC<LP> = ({c, st, f, fps, S, areaH}) => {
  const size = Math.min(S * 0.64, areaH * 0.72);
  return <Piece item={c.items[0]} st={st} size={size} labelSize={S * 0.08 * st.font.scale} delay={3} f={f} fps={fps} phase={0} maxLabelW={S * 0.9} />;
};

const Compare: React.FC<LP> = ({c, st, f, fps, S, areaH}) => {
  const size = Math.min(S * 0.42, areaH * 0.66);
  return (
    <div style={{display: "flex", justifyContent: "center", alignItems: "flex-start", gap: S * 0.05}}>
      {c.items.slice(0, 2).map((it, i) => <Piece key={i} item={it} st={st} size={size} labelSize={S * 0.06 * st.font.scale} delay={3 + i * 9} f={f} fps={fps} phase={i * 2} maxLabelW={size * 1.15} />)}
    </div>
  );
};

const Trio: React.FC<LP> = ({c, st, f, fps, S, areaH}) => {
  const n = c.items.length;
  const per = n === 4 ? 2 : n;
  const size = Math.min(n === 2 ? S * 0.4 : n === 3 ? S * 0.285 : S * 0.32, areaH * (n === 4 ? 0.36 : 0.62));
  return (
    <div style={{display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `${S * 0.05}px ${S * 0.04}px`, width: per * (size * 1.2) + (per - 1) * S * 0.04}}>
      {c.items.map((it, i) => <Piece key={i} item={it} st={st} size={size} labelSize={S * 0.05 * st.font.scale} delay={3 + i * 8} f={f} fps={fps} phase={i * 1.7} maxLabelW={size * 1.2} />)}
    </div>
  );
};

const Flow: React.FC<LP> = ({c, st, f, fps, S, areaH}) => {
  const size = Math.min(S * 0.3, areaH * 0.5);
  const at = clamp((f - 14) / 12);
  return (
    <div style={{display: "flex", alignItems: "flex-start", justifyContent: "center", gap: S * 0.02}}>
      <Piece item={c.items[0]} st={st} size={size} labelSize={S * 0.05 * st.font.scale} delay={3} f={f} fps={fps} phase={0} maxLabelW={size * 1.2} />
      <div style={{width: S * 0.16, height: size, display: "flex", alignItems: "center", opacity: at, transform: `translateX(${(1 - at) * -20}px)`}}>
        <Icon name="arrow" p={st.pal} f={f} size={S * 0.16} />
      </div>
      <Piece item={c.items[1]} st={st} size={size} labelSize={S * 0.05 * st.font.scale} delay={18} f={f} fps={fps} phase={2} maxLabelW={size * 1.2} />
    </div>
  );
};

const Stat: React.FC<LP> = ({c, st, f, fps, S, areaH}) => {
  const s = c.stat!;
  const t = Easing.out(Easing.cubic)(clamp((f - 4) / 34));
  const v = s.value * t;
  const txt = `${s.prefix}${s.value >= 100 || s.value % 1 === 0 ? Math.round(v).toLocaleString("en-IN") : v.toFixed(1)}${s.suffix}`;
  const ps = pop(f, fps, 2);
  const iconSize = Math.min(S * 0.26, areaH * 0.3);
  const big = fitSize(txt.length, S * 0.3, S * 0.14, 5);
  return (
    <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: S * 0.02}}>
      <div style={{fontFamily: FAMILY[st.font.id], fontWeight: st.font.weight, fontSize: big, color: st.pal.c1, lineHeight: 1, transform: `scale(${ps})`, textShadow: `${S * 0.008}px ${S * 0.008}px 0 ${rgba(st.paper.ink, 0.18)}`}}>{txt}</div>
      <Piece item={c.items[0]} st={st} size={iconSize} labelSize={S * 0.06 * st.font.scale} delay={14} f={f} fps={fps} phase={1} maxLabelW={S * 0.9} />
    </div>
  );
};

const Quote: React.FC<LP> = ({c, st, f, fps, S}) => {
  const txt = c.title;
  const fs = fitSize(txt.length, S * 0.085, S * 0.05, 26) * st.font.scale;
  const words = txt.split(/\s+/);
  const ps = pop(f, fps, 2);
  return (
    <div style={{width: S * 0.88, textAlign: "center", transform: `scale(${0.9 + 0.1 * ps})`}}>
      <div style={{fontFamily: "Georgia, serif", fontSize: S * 0.28, lineHeight: 0.6, color: st.pal.c1, height: S * 0.14}}>“</div>
      <div style={{fontFamily: FAMILY[st.font.id], fontWeight: st.font.weight, fontSize: fs, lineHeight: 1.3, color: st.paper.ink}}>
        {words.map((w, i) => {
          const on = pop(f, fps, 6 + i * 2.2);
          return <span key={i} style={{display: "inline-block", marginRight: fs * 0.28, opacity: clamp(on * 2), transform: `translateY(${(1 - clamp(on)) * fs * 0.4}px)`}}>{w}</span>;
        })}
      </div>
      {c.sub ? <div style={{marginTop: S * 0.04, fontFamily: FAMILY[st.font.id], fontSize: S * 0.045, color: st.pal.c2, opacity: clamp((f - 24) / 10)}}>— {c.sub}</div> : null}
    </div>
  );
};

const Hook: React.FC<LP> = ({c, st, f, fps, S, areaH}) => {
  const words = c.title.split(/\s+/);
  const longest = Math.max(...words.map((w) => w.length));
  const fs = fitSize(Math.max(longest * 2.2, c.title.length * 0.55), S * 0.15, S * 0.075, 12) * st.font.scale;
  const iconSize = Math.min(S * 0.34, areaH * 0.34);
  const lt = clamp((f - 12) / 14);
  return (
    <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: S * 0.035, width: S * 0.92}}>
      <div style={{width: iconSize, height: iconSize, transform: `scale(${pop(f, fps, 1)}) translateY(${Math.sin(f * 0.06) * iconSize * 0.02}px)`}}>
        <Icon name={ICONS[c.items[0]?.icon] ? c.items[0].icon : "bulb"} p={st.pal} f={f} size={iconSize} />
      </div>
      <div style={{textAlign: "center", fontFamily: FAMILY[st.font.id], fontWeight: st.font.weight, fontSize: fs, lineHeight: 1.12, color: st.paper.ink, textTransform: st.font.upper ? "uppercase" : undefined}}>
        {words.map((w, i) => {
          const on = pop(f, fps, 4 + i * 3);
          return <span key={i} style={{display: "inline-block", marginRight: fs * 0.22, color: i % 2 ? st.pal.c1 : st.paper.ink, transform: `scale(${on}) translateY(${(1 - clamp(on)) * fs * 0.3}px)`, opacity: clamp(on * 2)}}>{w}</span>;
        })}
      </div>
      {c.sub ? <Label text={c.sub} kind={st.label === "plain" ? "marker" : st.label} pal={st.pal} ink={st.paper.ink} family={FAMILY[st.font.id]} weight={st.font.weight} size={S * 0.048 * st.font.scale} upper={false} t={lt} /> : null}
    </div>
  );
};

const LAYOUTS: Record<string, React.FC<LP>> = {single: Single, compare: Compare, trio: Trio, flow: Flow, stat: Stat, quote: Quote, hook: Hook, map: Single};

/* ---------------- captions (narration) ---------------- */
const Caption: React.FC<{scene: Scene; st: VoxStyle; f: number; fps: number; S: number; w: number; h: number}> = ({scene, st, f, fps, S, w, h}) => {
  const words = scene.words && scene.words.length ? scene.words : scene.narration.split(/\s+/).filter(Boolean).map((x, i, a) => ({w: x, s: (i / a.length) * scene.durationSec, e: ((i + 1) / a.length) * scene.durationSec}));
  const t = f / fps;
  let a = -1;
  words.forEach((x, i) => {if (t >= x.s) a = i;});
  const W = 5, n = words.length, sa = Math.max(0, a);
  const start = Math.max(0, Math.min(Math.max(0, n - W), sa - 2));
  const vis = (n <= W ? words.map((x, i) => ({...x, i})) : words.slice(start, start + W).map((x, i) => ({...x, i: start + i})));
  const fs = S * 0.058 * st.font.scale;
  const fam = FAMILY[st.font.id];
  const ink = st.paper.ink, pal = st.pal;
  const wrap: React.CSSProperties = {position: "absolute", left: w * 0.06, right: w * 0.06, bottom: h * 0.12, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: `${fs * 0.15}px ${fs * 0.28}px`, fontFamily: fam, fontWeight: st.font.weight, fontSize: fs, lineHeight: 1.2, zIndex: 20, textTransform: st.font.upper ? "uppercase" : undefined};
  const k = st.caption;
  return (
    <div style={{...wrap, ...(k === "bar" ? {background: rgba(ink, 0.82), padding: `${fs * 0.3}px ${fs * 0.5}px`, borderRadius: fs * 0.3, left: w * 0.08, right: w * 0.08} : {})}}>
      {vis.map((x) => {
        const on = x.i === a;
        const common: React.CSSProperties = {display: "inline-block", transform: `scale(${on ? 1.1 : 1})`};
        if (k === "box") return <span key={x.i} style={{...common, padding: `${fs * 0.08}px ${fs * 0.3}px`, borderRadius: fs * 0.25, background: on ? pal.c1 : rgba(pal.light, 0.9), color: on ? pal.light : ink, boxShadow: `0 ${fs * 0.06}px 0 ${rgba(ink, 0.2)}`}}>{x.w}</span>;
        if (k === "karaoke") return <span key={x.i} style={{...common, color: on ? pal.c1 : ink, opacity: on ? 1 : 0.62}}>{x.w}</span>;
        if (k === "outline") return <span key={x.i} style={{...common, color: on ? pal.c3 : "#fff", WebkitTextStroke: `${fs * 0.09}px ${ink}`, paintOrder: "stroke fill"} as React.CSSProperties}>{x.w}</span>;
        if (k === "bar") return <span key={x.i} style={{...common, color: on ? pal.c3 : pal.light}}>{x.w}</span>;
        return <span key={x.i} style={{...common, color: ink, borderBottom: on ? `${fs * 0.1}px solid ${pal.c1}` : `${fs * 0.1}px solid transparent`}}>{x.w}</span>;
      })}
    </div>
  );
};

/* ---------------- transitions (scene intro) ---------------- */
const introStyle = (kind: TransKind, e: number): React.CSSProperties => {
  switch (kind) {
    case "wipe": return {clipPath: `inset(0 ${(1 - e) * 100}% 0 0)`};
    case "page": return {transformOrigin: "0% 50%", transform: `perspective(1600px) rotateY(${(1 - e) * -75}deg)`, opacity: e > 0 ? 1 : 0, boxShadow: `${(1 - e) * 40}px 0 60px rgba(0,0,0,${(1 - e) * 0.35})`};
    case "zoom": return {transform: `scale(${1.35 - 0.35 * e})`, opacity: clamp(e * 1.6)};
    case "blur": return {opacity: clamp(e * 1.4), filter: `blur(${(1 - e) * 14}px)`};
    case "iris": return {clipPath: `circle(${e * 150}% at 50% 45%)`};
    default: {
      const y = e * 112;
      const pts = Array.from({length: 11}, (_, i) => `${i * 10}% ${y + (i % 2 ? 2.5 : -2.5)}%`).reverse();
      return {clipPath: `polygon(0 0, 100% 0, ${pts.join(", ")}, 0 ${y}%)`};
    }
  }
};

const camT = (kind: CamKind, f: number, d: number) => {
  const e = Easing.inOut(Easing.quad)(clamp(f / Math.max(1, d)));
  if (kind === "push") return `scale(${1 + 0.045 * e})`;
  if (kind === "pull") return `scale(${1.045 - 0.045 * e})`;
  if (kind === "drift") return `translate(${Math.sin(f * 0.017) * 0.9}%, ${Math.cos(f * 0.013) * 0.7}%)`;
  return `translateX(${(0.5 - e) * 3.2}%) scale(1.02)`;
};

/* ---------------- the scene renderer Video.tsx calls ---------------- */
export const StyleScene: React.FC<{plan: Plan; scene: Scene; index: number}> = ({plan, scene, index}) => {
  const f = useCurrentFrame();
  const {fps, width: w, height: h, durationInFrames: d} = useVideoConfig();
  const st = resolveVoxStyle(plan);
  const seed = (Number((plan as any).style?.seed) || 11) + (Number((plan as any).style?.variant) || 0) * 31;
  const isLast = index === plan.scenes.length - 1;
  const c = React.useMemo(() => voxContent(scene, seed, index), [scene, seed, index]);

  const S = Math.min(w * 0.99, h * 1.15);
  const areaH = h * 0.6;
  const u = Math.min(w, h * 0.7) / 100;
  const e = index === 0 ? 1 : Easing.bezier(0.7, 0, 0.2, 1)(clamp(f / TRANS));
  const ex = isLast ? 0 : Easing.in(Easing.cubic)(clamp((f - (d - TRANS)) / TRANS));
  const Lay = LAYOUTS[c.layout] || Single;
  const camKind = st.cam === "pan" ? "sway" : st.cam;

  return (
    <AbsoluteFill style={{transform: `scale(${1 - 0.035 * ex})`, filter: ex > 0 ? `brightness(${1 - 0.18 * ex})` : undefined}}>
      <AbsoluteFill style={{...introStyle(st.trans, e), background: st.paper.base}}>
        <CameraRig cam={camKind as any} amount={st.cam === "pan" ? 0.35 : 0.6}>
          <PaperBG paper={st.paper} seed={seed + index * 7} u={u} />
        </CameraRig>
        {st.dust && <Particles color={rgba(st.paper.ink, 0.5)} seed={seed + index} shape="dot" count={14} speed={0.4} />}
        <AbsoluteFill style={{justifyContent: "flex-start", alignItems: "center", transform: camT(st.cam, f, d)}}>
          <div style={{position: "absolute", top: h * 0.09, height: areaH, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center"}}>
            <Lay c={c} st={st} f={f} fps={fps} S={S} areaH={areaH} />
          </div>
        </AbsoluteFill>
        <Caption scene={scene} st={st} f={f} fps={fps} S={S} w={w} h={h} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
