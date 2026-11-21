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
import type {PFProps, PFScene, PFWord} from "./types";
import {
  PaperTempleCutout,
  PaperCityCutout,
  PaperCharDhamCutout,
  PaperDwarkadhishCutout,
} from "./PaperSvgAssets";

/* ------------------------------------------------------------------ fonts */
const FONTS: [string, string, string][] = [
  ["CA Display", "RozhaOne-Regular.ttf", "400"],
  ["CA Hand", "YatraOne-Regular.ttf", "400"],
  ["CA Bold", "Mukta-ExtraBold.ttf", "800"],
  ["CA Body", "Mukta-Medium.ttf", "500"],
];
const DISPLAY = "'CA Display','Mukta',serif";
const HAND = "'CA Hand','Mukta',serif";
const BOLD = "'CA Bold','Mukta',sans-serif";
const BODY = "'CA Body','Mukta',sans-serif";

const useFonts = () => {
  const [h] = useState(() => delayRender("cinematic-arc-fonts"));
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

/* ---------------------------------------------------------------- helpers */
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOutCubic = Easing.bezier(0.215, 0.61, 0.355, 1);
const easeInOutCubic = Easing.bezier(0.645, 0.045, 0.355, 1);

const pseudoRandom = (seed: number) => {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/* ---------------------------------------------------------------- particles */
const Embers: React.FC<{seed: number; count?: number}> = ({seed, count = 36}) => {
  const frame = useCurrentFrame();
  const dots = useMemo(() => {
    const rng = pseudoRandom(seed);
    return Array.from({length: count}, (_, i) => ({
      id: i,
      x: rng() * 1080,
      yStart: 1920 + rng() * 400,
      speed: 1.4 + rng() * 2.8,
      size: 2 + rng() * 5.5,
      opacity: 0.25 + rng() * 0.65,
      hue: 35 + rng() * 25, // warm golden embers
      swayAmp: 15 + rng() * 30,
      swayFreq: 0.02 + rng() * 0.03,
      delay: rng() * 120,
    }));
  }, [seed, count]);

  return (
    <AbsoluteFill style={{pointerEvents: "none", overflow: "hidden"}}>
      {dots.map((d) => {
        const effectiveFrame = frame + d.delay;
        const totalDistance = 1920 + 500;
        const yProgress = ((effectiveFrame * d.speed) % totalDistance);
        const y = 1920 + 200 - yProgress;
        const x = d.x + Math.sin(effectiveFrame * d.swayFreq + d.id) * d.swayAmp;
        const alpha =
          y > 1800 ? clamp((1920 - y) / 120) * d.opacity :
          y < 200 ? clamp(y / 200) * d.opacity : d.opacity;

        return (
          <div
            key={d.id}
            style={{
              position: "absolute",
              left: `${x}px`,
              top: `${y}px`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              borderRadius: "50%",
              backgroundColor: `hsl(${d.hue}, 100%, 72%)`,
              boxShadow: `0 0 ${d.size * 2.5}px hsl(${d.hue}, 100%, 60%)`,
              opacity: alpha,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- Sacred Mandala */
const SacredMandala: React.FC<{speed?: number}> = ({speed = 0.08}) => {
  const frame = useCurrentFrame();
  const rotation = frame * speed;
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "45%",
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        width: 1400,
        height: 1400,
        pointerEvents: "none",
        opacity: 0.07,
        zIndex: 1,
      }}
    >
      <svg viewBox="0 0 400 400" width="100%" height="100%">
        <circle cx="200" cy="200" r="190" fill="none" stroke="#ffd700" strokeWidth="1.5" strokeDasharray="6 6" />
        <circle cx="200" cy="200" r="160" fill="none" stroke="#ffd700" strokeWidth="1" />
        <circle cx="200" cy="200" r="130" fill="none" stroke="#ffd700" strokeWidth="2" strokeDasharray="12 4" />
        <polygon points="200,40 338,280 62,280" fill="none" stroke="#ffd700" strokeWidth="1.5" />
        <polygon points="200,360 338,120 62,120" fill="none" stroke="#ffd700" strokeWidth="1.5" />
        <circle cx="200" cy="200" r="80" fill="none" stroke="#ffd700" strokeWidth="1.2" />
        <circle cx="200" cy="200" r="40" fill="none" stroke="#ffd700" strokeWidth="2" />
      </svg>
    </div>
  );
};

/* ---------------------------------------------------------------- Word-by-Word Kinetic Captions */
const KineticCaptions: React.FC<{
  words: PFWord[];
  currentSec: number;
  hitIndex?: number;
}> = ({words, currentSec, hitIndex}) => {
  if (!words || words.length === 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 220,
        left: 60,
        right: 60,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: "10px 14px",
        padding: "16px 28px",
        borderRadius: 24,
        background: "rgba(10, 8, 7, 0.72)",
        backdropFilter: "blur(14px)",
        border: "1px solid rgba(255, 215, 0, 0.2)",
        boxShadow: "0 12px 36px rgba(0,0,0,0.6)",
        zIndex: 50,
      }}
    >
      {words.map((w, idx) => {
        const isActive = currentSec >= w.s && currentSec <= w.e + 0.12;
        const isPast = currentSec > w.e + 0.12;
        const isHit = hitIndex !== undefined && idx === hitIndex && isActive;

        let color = isPast ? "rgba(255, 255, 255, 0.65)" : "rgba(255, 255, 255, 0.88)";
        if (isActive) color = "#ffd23f";
        if (isHit) color = "#ff4d4d";

        return (
          <span
            key={idx}
            style={{
              fontFamily: BOLD,
              fontSize: isActive ? 44 : 38,
              fontWeight: 800,
              color,
              transform: isActive ? "scale(1.12)" : "scale(1.0)",
              transition: "transform 0.08s ease, color 0.08s ease",
              textShadow: isActive
                ? "0 0 16px rgba(255, 210, 63, 0.75), 0 2px 8px rgba(0,0,0,0.9)"
                : "0 2px 6px rgba(0,0,0,0.8)",
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

/* ---------------------------------------------------------------- Single Scene Arc View */
const SceneView: React.FC<{
  scene: PFScene;
  actIndex: number;
  totalActs: number;
  seed: number;
  fps: number;
}> = ({scene, actIndex, totalActs, seed, fps}) => {
  const frame = useCurrentFrame();
  const currentSec = frame / fps;
  const totalFrames = Math.max(30, Math.round(scene.durationSec * fps));

  // Determine hit frame
  const hitWord =
    scene.hit !== undefined && scene.words && scene.words[scene.hit]
      ? scene.words[scene.hit]
      : null;
  const hitFrame = hitWord ? Math.round(hitWord.s * fps) : Math.round(totalFrames * 0.35);

  // Remotion spring for impact
  const hitSpring = spring({
    frame: Math.max(0, frame - hitFrame),
    fps,
    config: {damping: 12, mass: 0.5, stiffness: 180},
  });

  // Continuous cinematic parallax drift
  const scaleDrift = interpolate(frame, [0, totalFrames], [1.0, 1.05], {
    easing: easeInOutCubic,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tiltDrift = interpolate(frame, [0, totalFrames], [-0.4, 0.4]);

  // Combined scale with punch
  const isPunchActive = frame >= hitFrame && frame < hitFrame + 18;
  const punchScale = isPunchActive ? interpolate(hitSpring, [0, 1], [1.0, 1.06]) : 1.0;
  const totalScale = scaleDrift * punchScale;

  // Act classification: 0=Hook, intermediate=Lore/Tension, last=Payoff
  const isHook = actIndex === 0;
  const isPayoff = actIndex === totalActs - 1;
  const isClimax = actIndex === totalActs - 2 || scene.kind === "number";

  // Atmosphere background gradient based on act
  const bgGradient = useMemo(() => {
    if (isHook) {
      return "radial-gradient(circle at 50% 38%, #36170d 0%, #170905 50%, #080302 100%)";
    }
    if (isClimax) {
      return "radial-gradient(circle at 50% 45%, #3d1010 0%, #1a0808 55%, #0a0303 100%)";
    }
    if (isPayoff) {
      return "radial-gradient(circle at 50% 50%, #3a280e 0%, #1f1506 55%, #0a0802 100%)";
    }
    return "radial-gradient(circle at 50% 40%, #1c2230 0%, #0d121c 55%, #05070a 100%)";
  }, [isHook, isClimax, isPayoff]);

  // Asset auto-detection from text/narration
  const combinedText = `${scene.text || ""} ${scene.narration || ""} ${scene.sub || ""}`.toLowerCase();
  const isTemple = /मंदिर|temple|धाम|शिखर|द्वारका|केदार|काशी|सोमनाथ|शक्तिपीठ|तीर्थ/i.test(combinedText);
  const isCity = /नगरी|शहर|द्वारिका|मथुरा|अयोध्या|साम्राज्य|किला|दुर्ग|राजधानी/i.test(combinedText);
  const isCharDham = /चारधाम|char dham|बद्रीनाथ|रामेश्वरम|पुरी/i.test(combinedText);

  // Entrance spring for main card
  const enterSpring = spring({
    frame,
    fps,
    config: {damping: 14, mass: 0.7, stiffness: 140},
  });
  const cardOpacity = interpolate(enterSpring, [0, 0.4], [0, 1]);
  const cardTranslateY = interpolate(enterSpring, [0, 1], [60, 0]);

  return (
    <AbsoluteFill
      style={{
        background: bgGradient,
        overflow: "hidden",
        transform: `scale(${totalScale}) rotate(${tiltDrift}deg)`,
      }}
    >
      <SacredMandala speed={isClimax ? 0.14 : 0.06} />
      <Embers seed={seed + actIndex * 13} count={isClimax ? 48 : 32} />

      {/* Cinematic Vignette */}
      <AbsoluteFill
        style={{
          boxShadow: "inset 0 0 160px rgba(0,0,0,0.88), inset 0 0 320px rgba(0,0,0,0.72)",
          pointerEvents: "none",
          zIndex: 4,
        }}
      />

      {/* Main Content Center */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 60px 180px 60px",
          zIndex: 10,
          opacity: cardOpacity,
          transform: `translateY(${cardTranslateY}px)`,
        }}
      >
        {/* Top Act Tag / Badge */}
        <div
          style={{
            fontFamily: BOLD,
            fontSize: 22,
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "#ffd700",
            background: "rgba(255, 215, 0, 0.12)",
            border: "1px solid rgba(255, 215, 0, 0.35)",
            padding: "8px 24px",
            borderRadius: 30,
            marginBottom: 36,
            backdropFilter: "blur(10px)",
            boxShadow: "0 0 20px rgba(255, 215, 0, 0.25)",
          }}
        >
          {isHook
            ? "⚡ MYTHIC REVELATION"
            : isClimax
            ? "⚔️ CLIMAX & TRUTH"
            : isPayoff
            ? "🔱 DIVINE ETERNAL"
            : "📜 SACRED LORE"}
        </div>

        {/* Centerpiece SVG Icon Cutout with Golden Aura */}
        <div
          style={{
            width: 320,
            height: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            marginBottom: 24,
            filter: "drop-shadow(0 0 32px rgba(255, 215, 0, 0.45)) drop-shadow(0 16px 24px rgba(0,0,0,0.85))",
          }}
        >
          {/* Radiant Backglow */}
          <div
            style={{
              position: "absolute",
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,200,50,0.35) 0%, transparent 72%)",
              transform: `scale(${1.0 + Math.sin(frame * 0.08) * 0.08})`,
            }}
          />

          {isCharDham ? (
            <PaperCharDhamCutout />
          ) : isTemple ? (
            <PaperTempleCutout />
          ) : isCity ? (
            <PaperCityCutout />
          ) : (
            <PaperDwarkadhishCutout />
          )}
        </div>

        {/* Primary Headline Title */}
        <h1
          style={{
            fontFamily: DISPLAY,
            fontSize: isHook ? 68 : 58,
            fontWeight: 800,
            lineHeight: 1.25,
            textAlign: "center",
            margin: "0 0 16px 0",
            maxWidth: 960,
            background: "linear-gradient(135deg, #ffffff 0%, #fff0b8 40%, #ffd700 80%, #ff9500 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.95))",
          }}
        >
          {scene.text}
        </h1>

        {/* Sub-Headline / Supporting Lore */}
        {scene.sub && (
          <p
            style={{
              fontFamily: HAND,
              fontSize: 34,
              color: "#e2d2b5",
              textAlign: "center",
              margin: "0 0 20px 0",
              maxWidth: 860,
              textShadow: "0 2px 12px rgba(0,0,0,0.9)",
            }}
          >
            {scene.sub}
          </p>
        )}

        {/* Numeric Stat Highlight for Kind="number" */}
        {scene.number !== undefined && (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 12,
              margin: "12px 0 24px 0",
              padding: "12px 36px",
              background: "rgba(255, 60, 60, 0.15)",
              border: "2px solid rgba(255, 80, 80, 0.5)",
              borderRadius: 24,
              boxShadow: "0 0 30px rgba(255, 60, 60, 0.35)",
            }}
          >
            <span
              style={{
                fontFamily: DISPLAY,
                fontSize: 84,
                fontWeight: 900,
                color: "#ff5252",
                textShadow: "0 0 24px rgba(255, 82, 82, 0.8)",
              }}
            >
              {Math.round(
                interpolate(
                  frame,
                  [hitFrame, hitFrame + 24],
                  [0, scene.number],
                  {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOutCubic}
                )
              )}
            </span>
            {scene.unit && (
              <span
                style={{
                  fontFamily: BOLD,
                  fontSize: 38,
                  color: "#ffffff",
                }}
              >
                {scene.unit}
              </span>
            )}
          </div>
        )}

        {/* Slam Stamp Reveal */}
        {scene.stamp && frame >= hitFrame && (
          <div
            style={{
              marginTop: 18,
              padding: "10px 32px",
              fontFamily: BOLD,
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: "3px",
              color: "#ffffff",
              background: "linear-gradient(135deg, #d8452e, #8f1f14)",
              border: "3px solid #ffbebe",
              borderRadius: 16,
              boxShadow: "0 8px 24px rgba(216, 69, 46, 0.65), 0 0 20px rgba(255, 100, 100, 0.4)",
              transform: `scale(${interpolate(hitSpring, [0, 1], [2.2, 1.0])}) rotate(${interpolate(
                hitSpring,
                [0, 1],
                [-8, -2]
              )}deg)`,
            }}
          >
            {scene.stamp}
          </div>
        )}
      </AbsoluteFill>

      {/* Kinetic Captions Box */}
      <KineticCaptions
        words={scene.words}
        currentSec={currentSec}
        hitIndex={scene.hit}
      />
    </AbsoluteFill>
  );
};

/* ---------------------------------------------------------------- Main CinematicArc Composition */
export const totalFramesCA = (scenes: PFScene[], fps = 30): number =>
  scenes.reduce((acc, sc) => acc + Math.max(30, Math.round(sc.durationSec * fps)), 0);

export const CinematicArc: React.FC<PFProps> = ({scenes, seed = 42, sfx = true}) => {
  useFonts();
  const {fps} = useVideoConfig();

  // Compute scene sequence boundaries
  let accumulatedFrame = 0;
  const sceneTimeline = useMemo(() => {
    return scenes.map((sc, i) => {
      const frames = Math.max(30, Math.round(sc.durationSec * fps));
      const from = accumulatedFrame;
      accumulatedFrame += frames;
      return {scene: sc, from, frames, index: i};
    });
  }, [scenes, fps]);

  return (
    <AbsoluteFill style={{backgroundColor: "#080706"}}>
      {/* Sound Design Triggers */}
      {sfx &&
        sceneTimeline.map((item) => (
          <Sequence key={`sfx-${item.index}`} from={item.from} durationInFrames={item.frames}>
            <Audio src={staticFile("myth-audio/whoosh.wav")} volume={0.65} />
            {item.scene.hit !== undefined && item.scene.words && item.scene.words[item.scene.hit] && (
              <Sequence
                from={Math.round(item.scene.words[item.scene.hit].s * fps)}
                durationInFrames={45}
              >
                <Audio src={staticFile("myth-audio/thump.wav")} volume={0.85} />
              </Sequence>
            )}
          </Sequence>
        ))}

      {/* Visual Scenes Sequence */}
      {sceneTimeline.map((item) => (
        <Sequence
          key={`scene-${item.index}`}
          from={item.from}
          durationInFrames={item.frames}
        >
          <SceneView
            scene={item.scene}
            actIndex={item.index}
            totalActs={scenes.length}
            seed={seed}
            fps={fps}
          />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
