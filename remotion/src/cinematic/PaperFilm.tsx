import React, {useMemo, useState, useEffect} from "react";
import {AbsoluteFill, Audio, Easing, Img, Sequence, delayRender, continueRender, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import type {PFAccent, PFProps, PFScene} from "./types";
import {MapItem, mapTimes} from "./MapItem";
import {PaperTempleCutout, PaperCityCutout, PaperCharDhamCutout, PaperDwarkadhishCutout} from "./PaperSvgAssets";

/* ------------------------------------------------------------------ fonts */
const FONTS: [string, string, string][] = [
  ["PF Display", "RozhaOne-Regular.ttf", "400"],
  ["PF Hand", "YatraOne-Regular.ttf", "400"],
  ["PF Bold", "Mukta-ExtraBold.ttf", "800"],
  ["PF Body", "Mukta-Medium.ttf", "500"],
];
const DISPLAY = "'PF Display','Mukta',serif";
const HAND = "'PF Hand','Mukta',serif";
const BOLD = "'PF Bold','Mukta',sans-serif";
const BODY = "'PF Body','Mukta',sans-serif";

const useFonts = () => {
  const [h] = useState(() => delayRender("paperfilm-fonts"));
  useEffect(() => {
    Promise.all(FONTS.map(async ([name, file, weight]) => {
      const ff = new FontFace(name, `url(${staticFile("fonts/" + file)})`, {weight});
      await ff.load();
      document.fonts.add(ff);
    })).catch(() => undefined).finally(() => continueRender(h));
  }, [h]);
};

/* ---------------------------------------------------------------- palette */
const INK = "#1d1b1a", CREAM = "#fbf5e6", KRAFT = "#e4d8be";
const ACC: Record<PFAccent, {main: string; dark: string}> = {
  red: {main: "#d8452e", dark: "#9c2c1b"},
  teal: {main: "#1f8a87", dark: "#14605e"},
  mustard: {main: "#e8a92b", dark: "#b47d12"},
  ink: {main: "#34302d", dark: "#171514"},
};
const ACCENT_CYCLE: PFAccent[] = ["red", "teal", "mustard", "ink"];

/* ---------------------------------------------------------------- helpers */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeIO = Easing.bezier(0.65, 0, 0.25, 1);
const rng = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** torn / scissor-cut outline: a rectangle whose edges wobble a little */
const jagged = (w: number, h: number, seed: number, amp = 7, step = 44) => {
  const r = rng(seed);
  const pts: string[] = [];
  const edge = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(2, Math.round(len / step));
    for (let i = 0; i < n; i++) {
      const t = i / n, o = (r() - 0.5) * 2 * amp;
      pts.push(`${(lerp(x0, x1, t) + nx * o).toFixed(1)},${(lerp(y0, y1, t) + ny * o).toFixed(1)}`);
    }
  };
  edge(0, 0, w, 0, 0, 1); edge(w, 0, w, h, 1, 0); edge(w, h, 0, h, 0, 1); edge(0, h, 0, 0, 1, 0);
  return "M" + pts.join("L") + "Z";
};

/* ------------------------------------------------------ paper sheet layers */
const Sheet: React.FC<{w: number; h: number; seed: number; fill?: string; accent: PFAccent; tilt?: number; children?: React.ReactNode}> = ({w, h, seed, fill = CREAM, accent, tilt = 0, children}) => {
  const paths = useMemo(() => [jagged(w, h, seed + 1, 9), jagged(w, h, seed + 2, 8), jagged(w, h, seed + 3, 5, 60)], [w, h, seed]);
  const a = ACC[accent];
  const layer = (d: string, color: string, dx: number, dy: number, rot: number, shadow: string) => (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{position: "absolute", left: dx, top: dy, overflow: "visible", transform: `rotate(${rot}deg)`, filter: shadow}}>
      <path d={d} fill={color} />
    </svg>
  );
  return (
    <div style={{position: "relative", width: w, height: h, transform: `rotate(${tilt}deg)`}}>
      {layer(paths[0], a.dark, 16, 20, 1.6, "drop-shadow(0 14px 18px rgba(40,25,10,.35))")}
      {layer(paths[1], a.main, -8, 9, -1.2, "drop-shadow(0 8px 10px rgba(40,25,10,.25))")}
      {layer(paths[2], fill, 0, 0, 0, "drop-shadow(0 4px 5px rgba(40,25,10,.25))")}
      <div style={{position: "absolute", inset: 0, padding: 64, boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", color: INK}}>{children}</div>
    </div>
  );
};

const Tape: React.FC<{rot?: number}> = ({rot = -4}) => (
  <div style={{position: "absolute", top: -26, left: "50%", marginLeft: -90, width: 180, height: 56, background: "rgba(240,225,170,.82)", transform: `rotate(${rot}deg)`, boxShadow: "0 3px 6px rgba(0,0,0,.18)"}} />
);

/* ------------------------------------------------------------ effects */
const Highlighter: React.FC<{start: number; f: number; color: string; children: React.ReactNode; style?: React.CSSProperties}> = ({start, f, color, children, style}) => {
  const p = easeIO(clamp((f - start) / 11));
  return (
    <span style={{position: "relative", display: "inline-block", ...style}}>
      <span style={{position: "absolute", left: -10, right: -10, bottom: "6%", height: "42%", background: color, opacity: 0.62, transformOrigin: "left center", transform: `scaleX(${p}) skewX(-8deg)`, borderRadius: 6}} />
      <span style={{position: "relative"}}>{children}</span>
    </span>
  );
};

const Stamp: React.FC<{text: string; start: number; f: number; fps: number; solid?: boolean}> = ({text, start, f, fps, solid}) => {
  if (f < start) return null;
  const s = spring({frame: f - start, fps, config: {damping: 11, stiffness: 240, mass: 0.7}});
  return (
    <div style={{position: "absolute", right: -30, top: -50, transform: `rotate(-12deg) scale(${lerp(2.6, 1, clamp(s, 0, 1.15))})`, opacity: clamp((f - start) / 3), border: `10px solid ${ACC.red.main}`, color: ACC.red.main, padding: "6px 30px", borderRadius: 14, fontFamily: DISPLAY, fontSize: 96, lineHeight: 1.1, background: solid ? CREAM : "rgba(251,245,230,.9)", mixBlendMode: (solid ? "normal" : "multiply") as "normal" | "multiply"}}>
      {text}
    </div>
  );
};

/* "भारत → गुजरात → द्वारका": har naam tabhi aata hai jab map us par zoom karta hai */
const MapRoute: React.FC<{s: PFScene; lf: number; fps: number; text: React.CSSProperties; body: React.CSSProperties; strip?: boolean}> = ({s, lf, fps, text, body, strip}) => {
  const {t1, t2, Z} = mapTimes(s, fps);
  const parts = s.text.split("→").map((x) => x.trim()).filter(Boolean);
  const at = [Math.round((s.words[0]?.s ?? 0.3) * fps), t1 + Math.round(Z * 0.6), t2 + Math.round(Z * 0.6)];
  const show = (k: number) => easeIO(clamp((lf - at[Math.min(k, 2)]) / 9));
  return (
    <div style={{marginTop: strip ? 0 : 22, textAlign: "center", minHeight: strip ? 0 : 150}}>
      <div style={{...text, display: "flex", justifyContent: "center", alignItems: "center", gap: 18, ...(strip ? {background: CREAM, padding: "10px 34px", borderRadius: 10, boxShadow: "0 8px 18px rgba(0,0,0,.45)", transform: "rotate(-1deg)", width: "fit-content", margin: "0 auto"} : {})}}>
        {parts.map((pt, k) => show(k) <= 0 ? null : (
          <React.Fragment key={k}>
            {k > 0 && <span style={{opacity: show(k), fontSize: 44}}>→</span>}
            <span style={{opacity: show(k), display: "inline-block", transform: `translateY(${(1 - show(k)) * 14}px)`}}>{pt}</span>
          </React.Fragment>
        ))}
      </div>
      {s.sub && <div style={{...body, marginTop: strip ? 16 : 6, opacity: (strip ? 1 : 0.75) * show(2), ...(strip ? {color: CREAM, textShadow: "0 3px 10px rgba(0,0,0,.8)"} : {})}}>{s.sub}</div>}
    </div>
  );
};

/* ---------------------------------------- full-screen scenes: map / photo cover the whole 9:16 frame */
export const isFull = (s: PFScene) => s.kind === "map" || (s.kind === "photo" && !!s.image);

const FullScene: React.FC<{s: PFScene; i: number; lf: number; fps: number; width: number; height: number}> = ({s, i, lf, fps, width, height}) => {
  const accent = s.accent || ACCENT_CYCLE[i % 4];
  const a = ACC[accent];
  const t = (size: number, font = BOLD) => ({fontFamily: font, fontSize: size, lineHeight: 1.18, color: INK} as React.CSSProperties);
  if (s.kind === "map") {
    return (
      <AbsoluteFill>
        <MapItem s={s} lf={lf} fps={fps} accent={a.main} accentDark={a.dark} full w={width} h={height} />
        <div style={{position: "absolute", left: 40, right: 40, top: 150}}>
          <MapRoute s={s} lf={lf} fps={fps} text={t(74, DISPLAY)} body={t(46, BODY)} strip />
        </div>
      </AbsoluteFill>
    );
  }
  const z = 1 + 0.12 * clamp(lf / Math.max(1, Math.round(s.durationSec * fps)));
  return (
    <AbsoluteFill style={{background: "#111"}}>
      <Img src={staticFile(s.image as string)} style={{width: "100%", height: "100%", objectFit: "cover", transform: `scale(${z})`, filter: "sepia(.22) contrast(1.06) saturate(.95)"}} />
      <AbsoluteFill style={{background: "linear-gradient(rgba(10,6,2,.6) 0%, rgba(10,6,2,0) 28%, rgba(10,6,2,0) 50%, rgba(10,6,2,.72) 100%), radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 45%, rgba(10,6,2,.5) 100%)"}} />
      <div style={{position: "absolute", left: 40, right: 40, top: 150, display: "flex", justifyContent: "center"}}>
        <div style={{...t(74, DISPLAY), background: CREAM, padding: "10px 34px", borderRadius: 10, boxShadow: "0 8px 18px rgba(0,0,0,.45)", transform: "rotate(-1deg)", textAlign: "center"}}>
          <Highlighter start={Math.round((s.words[s.hit ?? 0]?.s ?? 0.4) * fps)} f={lf} color={a.main}>{s.text}</Highlighter>
        </div>
      </div>
      {s.stamp && <div style={{position: "absolute", right: 60, top: 330}}><Stamp solid text={s.stamp} start={Math.round((s.words[s.hit ?? 0]?.s ?? 0.4) * fps)} f={lf} fps={fps} /></div>}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------- scene item */
const W = 900;
const Item: React.FC<{s: PFScene; i: number; lf: number; fps: number; hitF: number; seed: number}> = ({s, i, lf, fps, hitF, seed}) => {
  const accent = s.accent || ACCENT_CYCLE[i % 4];
  const a = ACC[accent];
  const tilt = ((i % 2) ? 1 : -1) * (1.2 + (i % 3) * 0.5);
  const sd = seed * 31 + i * 97;
  const text = (size: number, font = BOLD) => ({fontFamily: font, fontSize: size, lineHeight: 1.18} as React.CSSProperties);

  const shownItems = s.items || [];
  const itemStart = (k: number) => Math.round((s.words[Math.floor((k * s.words.length) / Math.max(1, shownItems.length))]?.s ?? 0) * fps);

  const hay = `${s.text} ${s.sub || ""} ${s.narration || ""}`.toLowerCase();
  const isDeity = hay.includes("द्वारकाधीश") || hay.includes("dwarkadhish") || hay.includes("कृष्ण") || hay.includes("krishna") || hay.includes("शिव") || hay.includes("shiva") || hay.includes("महादेव") || hay.includes("राम") || hay.includes("rama") || hay.includes("हनुमान") || hay.includes("hanuman") || hay.includes("भगवान");
  const isCharDham = !isDeity && (hay.includes("धाम") || hay.includes("dham") || hay.includes("सप्त") || hay.includes("मान्यता") || hay.includes("चार धाम") || hay.includes("तीर्थ") || hay.includes("ज्योतिर्लिंग"));
  const isCity = !isDeity && !isCharDham && (hay.includes("नगरी") || hay.includes("नगर") || hay.includes("समुद्र") || hay.includes("किला") || hay.includes("साम्राज्य") || hay.includes("राजधानी"));
  const isTemple = !isDeity && !isCharDham && !isCity && (hay.includes("द्वारका") || hay.includes("सोमनाथ") || hay.includes("काशी") || hay.includes("उज्जैन") || hay.includes("मंदिर") || hay.includes("temple") || hay.includes("शिखर"));

  if (s.kind === "map") {
    return (
      <Sheet w={W} h={1180} seed={sd} accent={accent} tilt={tilt * 0.6}>
        <MapItem s={s} lf={lf} fps={fps} accent={a.main} accentDark={a.dark} />
        <MapRoute s={s} lf={lf} fps={fps} text={text(60)} body={text(40, BODY)} />
        {s.stamp && <Stamp text={s.stamp} start={hitF} f={lf} fps={fps} />}
      </Sheet>
    );
  }
  if (isDeity) {
    return (
      <Sheet w={W} h={1200} seed={sd} accent={accent} tilt={tilt}>
        <Tape rot={-3} />
        <div style={{...text(104, DISPLAY), lineHeight: 1.15, textAlign: "center", marginBottom: 20}}>
          <Highlighter start={hitF} f={lf} color={a.main}>{s.text}</Highlighter>
        </div>
        <PaperDwarkadhishCutout progress={easeIO(clamp(lf / 14))} width={680} height={560} />
        {s.sub && <div style={{...text(46, BODY), marginTop: 22, textAlign: "center", opacity: 0.85}}>{s.sub}</div>}
        {s.stamp && <Stamp text={s.stamp} start={hitF} f={lf} fps={fps} />}
      </Sheet>
    );
  }
  if (isCharDham) {
    return (
      <Sheet w={W} h={1160} seed={sd} accent={accent} tilt={tilt}>
        <Tape rot={3} />
        <div style={{...text(86, DISPLAY), lineHeight: 1.18, textAlign: "center", marginBottom: 26, color: a.main}}>
          <Highlighter start={hitF} f={lf} color={ACC.mustard.main}>{s.text}</Highlighter>
        </div>
        <PaperCharDhamCutout progress={easeIO(clamp(lf / 14))} width={760} height={500} />
        {s.sub && <div style={{...text(44, BODY), marginTop: 24, textAlign: "center", opacity: 0.8}}>{s.sub}</div>}
        {s.stamp && <Stamp text={s.stamp} start={hitF} f={lf} fps={fps} />}
      </Sheet>
    );
  }
  if (isCity) {
    return (
      <Sheet w={W} h={1180} seed={sd} accent={accent} tilt={tilt}>
        <Tape rot={-2} />
        <div style={{...text(98, DISPLAY), lineHeight: 1.18, textAlign: "center", marginBottom: 22}}>
          <Highlighter start={hitF} f={lf} color={a.main}>{s.text}</Highlighter>
        </div>
        <PaperCityCutout progress={easeIO(clamp(lf / 14))} width={720} height={500} />
        {s.sub && <div style={{...text(46, BODY), marginTop: 20, textAlign: "center", opacity: 0.8}}>{s.sub}</div>}
        {s.stamp && <Stamp text={s.stamp} start={hitF} f={lf} fps={fps} />}
      </Sheet>
    );
  }
  if (isTemple) {
    return (
      <Sheet w={W} h={1180} seed={sd} accent={accent} tilt={tilt}>
        <Tape rot={2} />
        <div style={{...text(104, DISPLAY), lineHeight: 1.18, textAlign: "center", marginBottom: 20}}>
          <Highlighter start={hitF} f={lf} color={a.main}>{s.text}</Highlighter>
        </div>
        <PaperTempleCutout progress={easeIO(clamp(lf / 14))} width={660} height={530} />
        {s.sub && <div style={{...text(48, BODY), marginTop: 20, textAlign: "center", opacity: 0.8}}>{s.sub}</div>}
        {s.stamp && <Stamp text={s.stamp} start={hitF} f={lf} fps={fps} />}
      </Sheet>
    );
  }
  if (s.kind === "number") {
    const v = (s.number ?? 0) * easeIO(clamp((lf - hitF) / (fps * 1.0)));
    const dec = Number.isInteger(s.number ?? 0) ? 0 : 1;
    return (
      <Sheet w={W} h={820} seed={sd} accent={accent} tilt={tilt}>
        <div style={{textAlign: "center"}}>
          <div style={{...text(260, DISPLAY), lineHeight: 1, color: a.main}}>{v.toLocaleString("en-IN", {minimumFractionDigits: dec, maximumFractionDigits: dec})}<span style={{fontSize: 130}}>{s.unit}</span></div>
          <div style={{...text(78), marginTop: 20}}><Highlighter start={hitF} f={lf} color={ACC.mustard.main}>{s.text}</Highlighter></div>
          {s.sub && <div style={{...text(46, BODY), marginTop: 18, opacity: 0.75}}>{s.sub}</div>}
        </div>
        {s.stamp && <Stamp text={s.stamp} start={hitF} f={lf} fps={fps} />}
      </Sheet>
    );
  }
  if (s.kind === "photo" && s.image) {
    return (
      <div style={{position: "relative"}}>
        <Sheet w={W} h={1060} seed={sd} accent={accent} tilt={tilt}>
          <Tape />
          <Img src={staticFile(s.image)} style={{width: "100%", height: 700, objectFit: "cover", borderRadius: 6, filter: "sepia(.25) contrast(1.05)"}} />
          <div style={{...text(66), marginTop: 28, textAlign: "center"}}><Highlighter start={hitF} f={lf} color={ACC.mustard.main}>{s.text}</Highlighter></div>
        </Sheet>
        {s.stamp && <Stamp text={s.stamp} start={hitF} f={lf} fps={fps} />}
      </div>
    );
  }
  if (s.kind === "list") {
    return (
      <Sheet w={W} h={Math.max(760, 330 + shownItems.length * 150)} seed={sd} accent={accent} tilt={tilt}>
        <div style={{...text(80, DISPLAY), marginBottom: 30, color: a.main}}>{s.text}</div>
        {shownItems.map((it, k) => {
          const p = easeIO(clamp((lf - itemStart(k)) / 10));
          return (
            <div key={k} style={{display: "flex", alignItems: "center", gap: 24, margin: "12px 0", opacity: p, transform: `translateX(${(1 - p) * -80}px)`}}>
              <div style={{minWidth: 62, height: 62, borderRadius: 31, background: a.main, color: CREAM, fontFamily: DISPLAY, fontSize: 40, display: "flex", alignItems: "center", justifyContent: "center"}}>{k + 1}</div>
              <div style={text(58)}>{it}</div>
            </div>
          );
        })}
        {s.stamp && <Stamp text={s.stamp} start={hitF} f={lf} fps={fps} />}
      </Sheet>
    );
  }
  if (s.kind === "quote") {
    return (
      <Sheet w={W} h={880} seed={sd} accent={accent} tilt={tilt}>
        <div style={{...text(260, DISPLAY), color: a.main, lineHeight: 0.6, height: 120}}>“</div>
        <div style={{...text(80, HAND), lineHeight: 1.3}}><Highlighter start={hitF} f={lf} color={ACC.mustard.main}>{s.text}</Highlighter></div>
        {s.sub && <div style={{...text(46, BODY), marginTop: 30, opacity: 0.75}}>— {s.sub}</div>}
        {s.stamp && <Stamp text={s.stamp} start={hitF} f={lf} fps={fps} />}
      </Sheet>
    );
  }
  if (s.kind === "title") {
    return (
      <Sheet w={W} h={860} seed={sd} accent={accent} tilt={tilt}>
        <div style={{...text(128, DISPLAY), lineHeight: 1.22, textAlign: "center"}}><Highlighter start={hitF} f={lf} color={a.main}>{s.text}</Highlighter></div>
        {s.sub && <div style={{...text(52, BODY), marginTop: 34, textAlign: "center", opacity: 0.8}}>{s.sub}</div>}
        {s.stamp && <Stamp text={s.stamp} start={hitF} f={lf} fps={fps} />}
      </Sheet>
    );
  }
  // card
  return (
    <Sheet w={W} h={800} seed={sd} accent={accent} tilt={tilt}>
      <div style={{alignSelf: "flex-start", background: a.main, color: CREAM, fontFamily: BOLD, fontSize: 40, padding: "6px 28px", borderRadius: 8, marginBottom: 30, transform: "rotate(-2deg)"}}>{String(i + 1).padStart(2, "0")}</div>
      <div style={{...text(94), lineHeight: 1.22}}><Highlighter start={hitF} f={lf} color={ACC.mustard.main}>{s.text}</Highlighter></div>
      {s.sub && <div style={{...text(50, BODY), marginTop: 30, opacity: 0.8}}>{s.sub}</div>}
      {s.stamp && <Stamp text={s.stamp} start={hitF} f={lf} fps={fps} />}
    </Sheet>
  );
};

/* --------------------------------------------------------------- captions */
const Captions: React.FC<{s: PFScene; lf: number; fps: number}> = ({s, lf, fps}) => {
  const t = lf / fps;
  let idx = s.words.findIndex((w) => t >= w.s && t < w.e);
  if (idx < 0) idx = s.words.reduce((acc, w, k) => (t >= w.s ? k : acc), 0);
  const chunk = Math.floor(idx / 4);
  const ws = s.words.slice(chunk * 4, chunk * 4 + 4);
  if (!ws.length) return null;
  return (
    <div style={{position: "absolute", left: 40, right: 40, bottom: 250, display: "flex", justifyContent: "center"}}>
      <div style={{background: CREAM, padding: "14px 34px", borderRadius: 12, boxShadow: "0 8px 16px rgba(40,25,10,.3)", transform: "rotate(-.8deg)", display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center"}}>
        {ws.map((w, k) => {
          const on = chunk * 4 + k === idx;
          return <span key={k} style={{fontFamily: BOLD, fontSize: 60, color: on ? CREAM : INK, background: on ? ACC.red.main : "transparent", padding: "0 12px", borderRadius: 8}}>{w.w}</span>;
        })}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- the film */
export const sceneFramesPF = (s: PFScene, fps = 30) => Math.max(15, Math.round(s.durationSec * fps));
export const totalFramesPF = (scenes: PFScene[], fps = 30) => scenes.reduce((a, s) => a + sceneFramesPF(s, fps), 0);

const MOVE = 24; // frames the camera takes to travel between two scenes

export const PaperFilm: React.FC<PFProps> = ({scenes, seed = 7, captions = true, sfx = true}) => {
  useFonts();
  const f = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const layout = useMemo(() => {
    const r = rng(seed);
    const starts: number[] = []; let acc = 0;
    scenes.forEach((s) => { starts.push(acc); acc += sceneFramesPF(s, fps); });
    const centers = scenes.map((_, i) => {
      const row = Math.floor(i / 2), c = i % 2, col = row % 2 === 0 ? c : 1 - c;
      return {x: (col ? 640 : -640) + (r() - 0.5) * 140, y: row * 1500 + (r() - 0.5) * 120, rot: (r() - 0.5) * 5};
    });
    const xs = centers.map((c) => c.x), ys = centers.map((c) => c.y);
    const bb = {cx: (Math.min(...xs) + Math.max(...xs)) / 2, cy: (Math.min(...ys) + Math.max(...ys)) / 2, w: Math.max(...xs) - Math.min(...xs) + W + 420, h: Math.max(...ys) - Math.min(...ys) + 1250};
    return {starts, centers, total: acc, bb};
  }, [scenes, seed, fps]);

  const cur = Math.max(0, layout.starts.reduce((a, st, k) => (f >= st ? k : a), 0));
  const lf = f - layout.starts[cur];
  const sc = scenes[cur];

  // camera ---------------------------------------------------------------
  const here = layout.centers[cur];
  const prev = layout.centers[Math.max(0, cur - 1)];
  const p = cur === 0 ? 1 : easeIO(clamp(lf / MOVE));
  let cx = lerp(prev.x, here.x, p), cy = lerp(prev.y, here.y, p);
  let rot = lerp(prev.rot, here.rot, p);
  const len = sceneFramesPF(sc, fps);
  let zoom = lerp(0.97, 1.0 + 0.07 * clamp(lf / len), p) - (cur === 0 ? 0 : 0.13 * Math.sin(Math.PI * clamp(lf / MOVE)));
  if (cur === 0) zoom = lerp(0.86, 1.0, easeIO(clamp(lf / 20))) + 0.06 * clamp(lf / len);

  // final pull-back to show the whole board
  const overview = Math.min(width / layout.bb.w, height / layout.bb.h);
  const lastSpan = Math.min(fps * 2.2, len * 0.45);
  let capOp = 1;
  if (scenes.length >= 3 && cur === scenes.length - 1) {
    const q = easeIO(clamp((lf - (len - lastSpan)) / lastSpan));
    cx = lerp(cx, layout.bb.cx, q); cy = lerp(cy, layout.bb.cy, q); zoom = lerp(zoom, overview, q); rot = lerp(rot, 0, q); capOp = 1 - clamp(q * 3);
  }

  // stamp shake ------------------------------------------------------------
  let shx = 0, shy = 0;
  scenes.forEach((s, k) => {
    if (!s.stamp) return;
    const hf = layout.starts[k] + Math.round((s.words[s.hit ?? 0]?.s ?? 0) * fps);
    const d = f - hf;
    if (d >= 0 && d < 12) { const a = 16 * Math.exp(-d / 3); shx += Math.sin(d * 2.9) * a; shy += Math.cos(d * 3.7) * a; }
  });

  const hitOf = (s: PFScene) => Math.round((s.words[s.hit ?? Math.floor(s.words.length * 0.35)]?.s ?? 0.4) * fps);
  const tx = width / 2 + shx, ty = height * 0.46 + shy;
  const fullOp = isFull(sc) ? clamp(lf / 8) * clamp((len - lf) / 8) : 0;

  return (
    <AbsoluteFill style={{background: KRAFT, overflow: "hidden"}}>
      {/* parallax dotted kraft board */}
      <AbsoluteFill style={{backgroundImage: "radial-gradient(rgba(120,95,55,.28) 3px, transparent 4px)", backgroundSize: "84px 84px", backgroundPosition: `${-cx * 0.3}px ${-cy * 0.3}px`}} />
      {/* dark background effect: only behind the paper, cards stay bright */}
      <AbsoluteFill style={{background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,.05) 25%, rgba(12,8,4,.72) 100%), linear-gradient(rgba(0,0,0,.16), rgba(0,0,0,.16))", pointerEvents: "none"}} />
      {/* the world */}
      <div style={{position: "absolute", left: 0, top: 0, width: 0, height: 0, opacity: 1 - fullOp, transform: `translate(${tx}px,${ty}px) scale(${zoom}) rotate(${rot}deg) translate(${-cx}px,${-cy}px)`}}>
        {scenes.map((s, i) => {
          const st = layout.starts[i];
          if (f < st - 4 || isFull(s)) return null;
          const c = layout.centers[i];
          const lfi = f - st;
          const sp = clamp(spring({frame: Math.max(0, lfi + 4), fps, config: {damping: 13, stiffness: 120}}), 0, 1.1);
          const next = layout.starts[i + 1];
          const dim = next === undefined ? 0 : clamp((f - next) / 14);
          return (
            <div key={i} style={{position: "absolute", left: c.x, top: c.y, transform: `translate(-50%,-50%) translateY(${(1 - sp) * 160}px) scale(${lerp(0.82, 1, sp)})`, opacity: clamp(sp * 1.6), filter: `brightness(${1 - dim * 0.28}) saturate(${1 - dim * 0.3})`}}>
              <Item s={s} i={i} lf={lfi} fps={fps} hitF={hitOf(s)} seed={seed} />
            </div>
          );
        })}
      </div>
      {/* vignette + paper grain */}
      <AbsoluteFill style={{background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 60%, rgba(40,25,10,.22) 100%)", pointerEvents: "none"}} />
      <AbsoluteFill style={{mixBlendMode: "multiply", opacity: 0.22, pointerEvents: "none"}}>
        <svg width="100%" height="100%"><filter id="pfgrain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={seed} /><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .28  0 0 0 0 .18  0 0 0 .9 0" /></filter><rect width="100%" height="100%" filter="url(#pfgrain)" /></svg>
      </AbsoluteFill>
      {isFull(sc) && fullOp > 0 && <AbsoluteFill style={{opacity: fullOp}}><FullScene s={sc} i={cur} lf={lf} fps={fps} width={width} height={height} /></AbsoluteFill>}
      {captions && capOp > 0 && <div style={{opacity: capOp}}><Captions s={sc} lf={lf} fps={fps} /></div>}
      {sfx && scenes.map((s, k) => {
        const st = layout.starts[k];
        return (
          <React.Fragment key={k}>
            {k > 0 && <Sequence from={st} durationInFrames={30}><Audio src={staticFile("myth-audio/whoosh.wav")} volume={0.45} /></Sequence>}
            {s.stamp && <Sequence from={st + hitOf(s)} durationInFrames={30}><Audio src={staticFile("myth-audio/thump.wav")} volume={0.7} /></Sequence>}
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
