import React, {useMemo, useState, useEffect} from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  delayRender,
  continueRender,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type {PFAccent, PFProps, PFScene, PFWord} from "./types";
import {
  PaperTempleCutout,
  PaperCityCutout,
  PaperCharDhamCutout,
  PaperDwarkadhishCutout,
} from "./PaperSvgAssets";
import {MapItem} from "./MapItem";

/* ------------------------------------------------------------------ fonts */
const FONTS: [string, string, string][] = [
  ["PM Display", "RozhaOne-Regular.ttf", "400"],
  ["PM Hand", "YatraOne-Regular.ttf", "400"],
  ["PM Bold", "Mukta-ExtraBold.ttf", "800"],
  ["PM Body", "Mukta-Medium.ttf", "500"],
];
const DISPLAY = "'PM Display','Mukta',serif";
const HAND = "'PM Hand','Mukta',serif";
const BOLD = "'PM Bold','Mukta',sans-serif";
const BODY = "'PM Body','Mukta',sans-serif";

const useFonts = () => {
  const [h] = useState(() => delayRender("papermotion-fonts"));
  useEffect(() => {
    Promise.all(
      FONTS.map(async ([name, file, weight]) => {
        const ff = new FontFace(name, `url(${staticFile("fonts/" + file)})`, {weight});
        await ff.load();
        document.fonts.add(ff);
      })
    )
      .catch(() => undefined)
      .finally(() => continueRender(h));
  }, [h]);
};

/* ---------------------------------------------------------------- palette (Ground Paper) */
const INK = "#1d1b1a";
const CREAM = "#fbf5e6";
const KRAFT = "#efe3c6";
const SHADOW_COLOR = "rgba(40, 25, 12, 0.45)";

const ACC: Record<PFAccent, {main: string; dark: string; light: string}> = {
  red: {main: "#d8452e", dark: "#9c2c1b", light: "#f8d5cf"},
  teal: {main: "#1f8a87", dark: "#14605e", light: "#d0ecea"},
  mustard: {main: "#e8a92b", dark: "#b47d12", light: "#fdf0d5"},
  ink: {main: "#34302d", dark: "#171514", light: "#e6e3df"},
};
const ACCENT_CYCLE: PFAccent[] = ["red", "teal", "mustard", "ink"];

/* ---------------------------------------------------------------- helpers */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeIO = Easing.bezier(0.65, 0, 0.25, 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const rng = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Hand-torn paper card jagged edge generator */
const jaggedPath = (w: number, h: number, seed: number, amp = 7, step = 42) => {
  const r = rng(seed);
  const pts: string[] = [];
  const edge = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(2, Math.round(len / step));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const o = (r() - 0.5) * 2 * amp;
      pts.push(`${(lerp(x0, x1, t) + nx * o).toFixed(1)},${(lerp(y0, y1, t) + ny * o).toFixed(1)}`);
    }
  };
  edge(0, 0, w, 0, 0, 1);
  edge(w, 0, w, h, 1, 0);
  edge(w, h, 0, h, 0, 1);
  edge(0, h, 0, 0, 1, 0);
  return "M" + pts.join("L") + "Z";
};

/* ---------------------------------------------------------------- Paper Sheet Card */
const PaperSheet: React.FC<{
  w: number;
  h: number;
  seed: number;
  accent: PFAccent;
  tilt?: number;
  children: React.ReactNode;
}> = ({w, h, seed, accent, tilt = 0, children}) => {
  const paths = useMemo(
    () => [
      jaggedPath(w, h, seed + 1, 9),
      jaggedPath(w, h, seed + 2, 7),
      jaggedPath(w, h, seed + 3, 5, 56),
    ],
    [w, h, seed]
  );
  const a = ACC[accent];

  return (
    <div
      style={{
        position: "relative",
        width: w,
        height: h,
        transform: `rotate(${tilt}deg)`,
      }}
    >
      {/* Layer 1: Dark accent back layer with deep paper drop shadow */}
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{
          position: "absolute",
          left: 18,
          top: 22,
          overflow: "visible",
          transform: "rotate(1.5deg)",
          filter: "drop-shadow(0 18px 24px rgba(50, 30, 15, 0.42))",
        }}
      >
        <path d={paths[0]} fill={a.dark} />
      </svg>

      {/* Layer 2: Colored craft layer */}
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{
          position: "absolute",
          left: -8,
          top: 10,
          overflow: "visible",
          transform: "rotate(-1.2deg)",
          filter: "drop-shadow(0 10px 14px rgba(50, 30, 15, 0.3))",
        }}
      >
        <path d={paths[1]} fill={a.main} />
      </svg>

      {/* Layer 3: Warm Cream parchment face layer */}
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          overflow: "visible",
          filter: "drop-shadow(0 6px 8px rgba(50, 30, 15, 0.28))",
        }}
      >
        <path d={paths[2]} fill={CREAM} stroke="#ede0c4" strokeWidth={1.5} />
      </svg>

      {/* Card Content Container */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "54px 48px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: INK,
          zIndex: 5,
        }}
      >
        {children}
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- Masking Tape */
const MaskingTape: React.FC<{rot?: number; width?: number}> = ({rot = -3, width = 200}) => (
  <div
    style={{
      position: "absolute",
      top: -24,
      left: "50%",
      marginLeft: -width / 2,
      width,
      height: 54,
      background: "rgba(240, 225, 172, 0.88)",
      borderLeft: "2px dashed rgba(210, 195, 140, 0.6)",
      borderRight: "2px dashed rgba(210, 195, 140, 0.6)",
      transform: `rotate(${rot}deg)`,
      boxShadow: "0 4px 8px rgba(0, 0, 0, 0.22)",
      zIndex: 20,
    }}
  />
);

/* ---------------------------------------------------------------- Paper Ink Stamp */
const PaperStamp: React.FC<{
  text: string;
  startFrame: number;
  currentFrame: number;
  fps: number;
  color?: string;
}> = ({text, startFrame, currentFrame, fps, color = "#d8452e"}) => {
  if (currentFrame < startFrame) return null;
  const p = spring({
    frame: currentFrame - startFrame,
    fps,
    config: {damping: 10, mass: 0.4, stiffness: 220},
  });
  const scale = interpolate(p, [0, 1], [2.4, 1.0]);
  const opacity = interpolate(p, [0, 0.3], [0, 1]);

  return (
    <div
      style={{
        position: "absolute",
        right: 42,
        bottom: 50,
        padding: "8px 24px",
        border: `4px solid ${color}`,
        borderRadius: 10,
        fontFamily: DISPLAY,
        fontSize: 36,
        fontWeight: 800,
        color,
        letterSpacing: "3px",
        textTransform: "uppercase",
        opacity,
        transform: `scale(${scale}) rotate(-8deg)`,
        boxShadow: `0 4px 12px rgba(216, 69, 46, 0.35)`,
        zIndex: 30,
      }}
    >
      {text}
    </div>
  );
};

/* ---------------------------------------------------------------- Highlighter Marker */
const PaperHighlighter: React.FC<{
  start: number;
  f: number;
  color: string;
  children: React.ReactNode;
}> = ({start, f, color, children}) => {
  const p = easeIO(clamp((f - start) / 12));
  return (
    <span style={{position: "relative", display: "inline-block"}}>
      <span
        style={{
          position: "absolute",
          left: -8,
          right: -8,
          bottom: "8%",
          height: "44%",
          backgroundColor: color,
          opacity: 0.58,
          transformOrigin: "left center",
          transform: `scaleX(${p}) skewX(-7deg)`,
          borderRadius: 6,
        }}
      />
      <span style={{position: "relative", zIndex: 2}}>{children}</span>
    </span>
  );
};

/* ---------------------------------------------------------------- Kinetic Paper Subtitles */
const PaperCaptions: React.FC<{
  words: PFWord[];
  currentSec: number;
  accentColor: string;
}> = ({words, currentSec, accentColor}) => {
  if (!words || words.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 180,
        left: 50,
        right: 50,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px 14px",
        padding: "16px 24px",
        borderRadius: 18,
        background: "rgba(251, 245, 230, 0.94)",
        border: "2px solid #e3d3ab",
        boxShadow: "0 8px 24px rgba(40, 25, 12, 0.32)",
        zIndex: 40,
      }}
    >
      {words.map((w, idx) => {
        const isActive = currentSec >= w.s && currentSec <= w.e + 0.12;
        const isPast = currentSec > w.e + 0.12;

        return (
          <span
            key={idx}
            style={{
              fontFamily: BOLD,
              fontSize: isActive ? 42 : 36,
              fontWeight: 800,
              color: isActive ? "#ffffff" : isPast ? "#1d1b1a" : "#7a6a4a",
              backgroundColor: isActive ? accentColor : "transparent",
              padding: isActive ? "3px 12px" : "0px",
              borderRadius: 8,
              transform: isActive ? "scale(1.08)" : "scale(1.0)",
              transition: "transform 0.08s ease",
              display: "inline-block",
            }}
          >
            {w.w}
          </span>
        );
      })}
    </div>
  );
};

/* ---------------------------------------------------------------- Single Paper Scene */
const CARD_W = 920;

const PaperSceneView: React.FC<{
  scene: PFScene;
  index: number;
  seed: number;
  fps: number;
}> = ({scene, index, seed, fps}) => {
  const frame = useCurrentFrame();
  const currentSec = frame / fps;
  const accent = scene.accent || ACCENT_CYCLE[index % 4];
  const a = ACC[accent];
  const sd = seed * 37 + index * 89;
  const tilt = ((index % 2 ? 1 : -1) * (1.2 + (index % 3) * 0.4));

  // Determine hit frame for stamp and highlighter
  const hitWord =
    scene.hit !== undefined && scene.words && scene.words[scene.hit]
      ? scene.words[scene.hit]
      : null;
  const hitFrame = hitWord ? Math.round(hitWord.s * fps) : Math.round(fps * 0.4);

  // Entrance spring (authentic stop-motion / paper drop feel)
  const enterSpring = spring({
    frame,
    fps,
    config: {damping: 14, mass: 0.6, stiffness: 160},
  });
  const dropScale = interpolate(enterSpring, [0, 1], [1.12, 1.0]);
  const dropOpacity = interpolate(enterSpring, [0, 0.3], [0, 1]);

  // Asset detection from text/narration
  const combined = `${scene.text || ""} ${scene.sub || ""} ${scene.narration || ""}`.toLowerCase();
  const isDeity = /द्वारकाधीश|dwarkadhish|कृष्ण|krishna|शिव|shiva|महादेव|राम|rama|हनुमान|भगवान/i.test(combined);
  const isCharDham = !isDeity && /धाम|dham|सप्त|चार धाम|तीर्थ|ज्योतिर्लिंग|शिखर/i.test(combined);
  const isCity = !isDeity && !isCharDham && /नगरी|शहर|द्वारिका|मथुरा|अयोध्या|साम्राज्य|किला|दुर्ग|राजधानी/i.test(combined);
  const isTemple = !isDeity && !isCharDham && !isCity && /द्वारका|सोमनाथ|काशी|उज्जैन|मंदिर|temple/i.test(combined);

  // Map kind handling
  if (scene.kind === "map") {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 80,
          opacity: dropOpacity,
          transform: `scale(${dropScale})`,
        }}
      >
        <PaperSheet w={CARD_W} h={1200} seed={sd} accent={accent} tilt={tilt * 0.7}>
          <MaskingTape rot={-2} width={220} />
          <MapItem s={scene} lf={frame} fps={fps} accent={a.main} accentDark={a.dark} />
          {scene.stamp && (
            <PaperStamp
              text={scene.stamp}
              startFrame={hitFrame}
              currentFrame={frame}
              fps={fps}
              color={a.dark}
            />
          )}
        </PaperSheet>
        <PaperCaptions words={scene.words} currentSec={currentSec} accentColor={a.main} />
      </div>
    );
  }

  // Number stat card
  if (scene.kind === "number") {
    const numProgress = easeIO(clamp((frame - hitFrame) / (fps * 1.0)));
    const currentVal = Math.round((scene.number ?? 0) * numProgress);

    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 80,
          opacity: dropOpacity,
          transform: `scale(${dropScale})`,
        }}
      >
        <PaperSheet w={CARD_W} h={960} seed={sd} accent={accent} tilt={tilt}>
          <MaskingTape rot={2} width={200} />
          <div style={{fontFamily: DISPLAY, fontSize: 180, color: a.main, lineHeight: 1}}>
            {currentVal.toLocaleString("en-IN")}
            {scene.unit && <span style={{fontSize: 84, marginLeft: 12}}>{scene.unit}</span>}
          </div>
          <div style={{fontFamily: DISPLAY, fontSize: 64, marginTop: 24, textAlign: "center"}}>
            <PaperHighlighter start={hitFrame} f={frame} color={ACC.mustard.main}>
              {scene.text}
            </PaperHighlighter>
          </div>
          {scene.sub && (
            <div style={{fontFamily: BODY, fontSize: 38, marginTop: 16, opacity: 0.82, textAlign: "center"}}>
              {scene.sub}
            </div>
          )}
          {scene.stamp && (
            <PaperStamp
              text={scene.stamp}
              startFrame={hitFrame}
              currentFrame={frame}
              fps={fps}
              color={a.dark}
            />
          )}
        </PaperSheet>
        <PaperCaptions words={scene.words} currentSec={currentSec} accentColor={a.main} />
      </div>
    );
  }

  // Standard craft card with handcrafted paper cutouts
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 80,
        opacity: dropOpacity,
        transform: `scale(${dropScale})`,
      }}
    >
      <PaperSheet w={CARD_W} h={1220} seed={sd} accent={accent} tilt={tilt}>
        <MaskingTape rot={tilt > 0 ? 3 : -3} width={210} />

        {/* Headline with Paper Highlighter */}
        <div
          style={{
            fontFamily: DISPLAY,
            fontSize: 72,
            lineHeight: 1.2,
            textAlign: "center",
            marginBottom: 26,
            color: INK,
          }}
        >
          <PaperHighlighter start={hitFrame} f={frame} color={a.light}>
            {scene.text}
          </PaperHighlighter>
        </div>

        {/* Authentic Sanjhi Cutout Piece */}
        <div style={{margin: "12px 0 20px 0"}}>
          {isCharDham ? (
            <PaperCharDhamCutout progress={clamp(frame / 14)} width={720} height={480} />
          ) : isCity ? (
            <PaperCityCutout progress={clamp(frame / 14)} width={700} height={480} />
          ) : isTemple ? (
            <PaperTempleCutout progress={clamp(frame / 14)} width={640} height={500} />
          ) : (
            <PaperDwarkadhishCutout progress={clamp(frame / 14)} width={660} height={520} />
          )}
        </div>

        {/* Sub-Headline Text */}
        {scene.sub && (
          <div
            style={{
              fontFamily: BODY,
              fontSize: 40,
              color: INK,
              opacity: 0.85,
              textAlign: "center",
              maxWidth: 780,
            }}
          >
            {scene.sub}
          </div>
        )}

        {/* Red / Dark Ink Stamp */}
        {scene.stamp && (
          <PaperStamp
            text={scene.stamp}
            startFrame={hitFrame}
            currentFrame={frame}
            fps={fps}
            color={a.dark}
          />
        )}
      </PaperSheet>

      <PaperCaptions words={scene.words} currentSec={currentSec} accentColor={a.main} />
    </div>
  );
};

/* ---------------------------------------------------------------- Main Composition */
export const totalFramesCA = (scenes: PFScene[], fps = 30): number =>
  scenes.reduce((acc, sc) => acc + Math.max(30, Math.round(sc.durationSec * fps)), 0);

export const CinematicArc: React.FC<PFProps> = ({scenes, seed = 42, sfx = true}) => {
  useFonts();
  const {fps} = useVideoConfig();

  let accumulatedFrame = 0;
  const timeline = useMemo(() => {
    return scenes.map((sc, i) => {
      const frames = Math.max(30, Math.round(sc.durationSec * fps));
      const from = accumulatedFrame;
      accumulatedFrame += frames;
      return {scene: sc, from, frames, index: i};
    });
  }, [scenes, fps]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#e8dec7", // Authentic natural parchment kraft board
        backgroundImage: `radial-gradient(circle at 50% 50%, #f6eed8 0%, #e3d3ab 60%, #cbb98c 100%)`,
        overflow: "hidden",
      }}
    >
      {/* Physical Paper Grain Texture Overlay */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.28,
          pointerEvents: "none",
          mixBlendMode: "multiply",
        }}
      >
        <filter id="pfgrain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#pfgrain)" />
      </svg>

      {/* Natural Paper Edge Vignette */}
      <AbsoluteFill
        style={{
          boxShadow: "inset 0 0 100px rgba(120, 95, 60, 0.45), inset 0 0 200px rgba(80, 55, 30, 0.35)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* Audio SFX Sequences */}
      {sfx &&
        timeline.map((item) => (
          <Sequence key={`sfx-${item.index}`} from={item.from} durationInFrames={item.frames}>
            <Audio src={staticFile("myth-audio/whoosh.wav")} volume={0.5} />
            {item.scene.hit !== undefined && item.scene.words && item.scene.words[item.scene.hit] && (
              <Sequence
                from={Math.round(item.scene.words[item.scene.hit].s * fps)}
                durationInFrames={30}
              >
                <Audio src={staticFile("myth-audio/thump.wav")} volume={0.7} />
              </Sequence>
            )}
          </Sequence>
        ))}

      {/* Visual Scenes */}
      {timeline.map((item) => (
        <Sequence
          key={`sc-${item.index}`}
          from={item.from}
          durationInFrames={item.frames}
        >
          <PaperSceneView
            scene={item.scene}
            index={item.index}
            seed={seed}
            fps={fps}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
