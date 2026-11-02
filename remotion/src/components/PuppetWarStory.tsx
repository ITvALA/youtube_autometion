import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

import {
  C,
  TempleBackground,
  PuppetCharacter,
  GoldDust,
  Vignette,
  Grain,
  Camera,
  PoseKey,
  Look,
} from "./PuppetKit";

/* ---------------------------------------------------------------------
   5000 VS 1 LAKH : KRISHNA WAR SECRET
   Pure SVG Cutout Puppet Marionette Story + Synced Hindi Subtitles
   --------------------------------------------------------------------- */

// Specialized Looks for Raja and Krishna
export const RAJA_LOOK: Look = {
  face: "human",
  skin: "#f1c27d",
  dhoti: "#c2185b", // royal magenta
  halo: false,
  prop: "mace",
  propHand: "B",
};

export const KRISHNA_LOOK: Look = {
  face: "human",
  skin: "#3f8f86", // divine teal
  dhoti: "#e65100", // pitambar orange
  halo: true,
  prop: "none",
};

export const WARRIOR_LOOK: Look = {
  face: "vanara",
  skin: C.skinGold,
  dhoti: C.red,
  prop: "mace",
  propHand: "B",
};

// Hindi Subtitle Badge Component (styled like the user's photo banner)
const HindiSubtitle: React.FC<{text: string; highlight?: string}> = ({text, highlight}) => {
  const frame = useCurrentFrame();
  const pop = interpolate(frame, [0, 8], [0.85, 1], {extrapolateRight: "clamp"});
  const op = interpolate(frame, [0, 6], [0, 1], {extrapolateRight: "clamp"});

  return (
    <div
      style={{
        position: "absolute",
        bottom: "8%",
        left: 40,
        right: 40,
        display: "flex",
        justifyContent: "center",
        zIndex: 40,
        opacity: op,
        transform: `scale(${pop})`,
      }}
    >
      <div
        style={{
          background: "rgba(38, 50, 56, 0.94)",
          border: "3px solid #f0b429",
          borderRadius: 40,
          padding: "16px 36px",
          color: "#ffffff",
          fontFamily: "'Noto Serif Devanagari', 'Mukta', serif",
          fontSize: 46,
          fontWeight: 800,
          textAlign: "center",
          lineHeight: 1.3,
          boxShadow: "0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(240, 180, 41, 0.4)",
        }}
      >
        {highlight ? (
          <>
            <span style={{color: "#ffd45e", textDecoration: "underline"}}>{highlight}</span>{" "}
            {text.replace(highlight, "").trim()}
          </>
        ) : (
          text
        )}
      </div>
    </div>
  );
};

// Top Title Card (Matching the user's uploaded photo)
const HeroTitleOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const pop = interpolate(frame, [4, 18], [0.7, 1], {extrapolateRight: "clamp"});

  return (
    <div
      style={{
        position: "absolute",
        top: "38%",
        left: 0,
        right: 0,
        textAlign: "center",
        zIndex: 35,
        transform: `scale(${pop})`,
        pointerEvents: "none",
      }}
    >
      {/* 5000 VS 1 LAKH */}
      <div
        style={{
          fontFamily: "'Cinzel Decorative', 'Arial Black', serif",
          fontSize: 104,
          fontWeight: 900,
          letterSpacing: "0.02em",
          lineHeight: 1.05,
          textTransform: "uppercase",
          filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.9))",
        }}
      >
        <span style={{color: "#1c2b2d"}}>5000 </span>
        <span style={{color: "#e91e63", fontStyle: "italic"}}>VS </span>
        <span style={{color: "#1c2b2d"}}>1 LAKH</span>
      </div>

      {/* Subtitle: Krishna War Secret */}
      <div
        style={{
          marginTop: 18,
          fontSize: 54,
          fontFamily: "'Cinzel', serif",
          fontWeight: 700,
          color: "#2a1409",
          letterSpacing: "0.06em",
        }}
      >
        <span style={{borderBottom: "4px solid #e91e63", paddingBottom: 6}}>Krishna War Secret</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------
// SCENE 0: Hook (5000 vs 1 Lakh Challenge)
// ---------------------------------------------------------------------
const Scene0Hook: React.FC = () => {
  const keys: PoseKey[] = [
    {f: 0, pose: "idle"},
    {f: 40, pose: "mace"},
    {f: 120, pose: "raiseA"},
  ];

  return (
    <AbsoluteFill style={{backgroundColor: C.night}}>
      <Camera x0={0} x1={0} z0={1.04} z1={1.12} duration={222}>
        <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{overflow: "visible"}}>
          <TempleBackground />
          {/* Raja Puppet standing in royal court */}
          <PuppetCharacter x={540} y={1180} scale={1.55} look={RAJA_LOOK} keys={keys} speaking={true} />
        </svg>
      </Camera>

      <HeroTitleOverlay />
      <GoldDust count={30} />
      <Vignette />
      <Grain opacity={0.06} />
      <HindiSubtitle text="५००० सैनिक और सामने १ लाख की सेना! राजा युद्ध से पहले घबरा गया..." highlight="५००० सैनिक बनाम १ लाख" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------
// SCENE 1: Raja Asks Krishna
// ---------------------------------------------------------------------
const Scene1Ask: React.FC = () => {
  const rajaKeys: PoseKey[] = [
    {f: 0, pose: "idle"},
    {f: 30, pose: "bow"},
    {f: 120, pose: "point"},
    {f: 180, pose: "bow"},
  ];
  const krishnaKeys: PoseKey[] = [
    {f: 0, pose: "guard"},
    {f: 60, pose: "idle"},
    {f: 140, pose: "raiseA"},
  ];

  return (
    <AbsoluteFill style={{backgroundColor: C.night}}>
      <Camera x0={-40} x1={40} z0={1.08} z1={1.14} duration={244}>
        <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{overflow: "visible"}}>
          <TempleBackground />
          {/* Raja on left bowing / pleading */}
          <PuppetCharacter x={320} y={1190} scale={1.38} look={RAJA_LOOK} keys={rajaKeys} speaking={true} seed={1} />
          {/* Krishna on right listening calmly */}
          <PuppetCharacter x={760} y={1190} scale={1.42} flip={true} look={KRISHNA_LOOK} keys={krishnaKeys} speaking={false} seed={2} />
        </svg>
      </Camera>

      <GoldDust count={35} />
      <Vignette />
      <Grain opacity={0.06} />
      <HindiSubtitle text="राजा ने श्रीकृष्ण से पूछा: 'प्रभु, हमारे पास केवल पाँच हज़ार योद्धा हैं, हम इस महायुद्ध को कैसे जीतेंगे?'" highlight="राजा का प्रश्न" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------
// SCENE 2: Krishna Reveals War Secret
// ---------------------------------------------------------------------
const Scene2Secret: React.FC = () => {
  const frame = useCurrentFrame();
  const auraPulse = 1 + Math.sin(frame * 0.1) * 0.05;
  const krishnaKeys: PoseKey[] = [
    {f: 0, pose: "idle"},
    {f: 30, pose: "raiseA"},
    {f: 100, pose: "point"},
    {f: 180, pose: "raiseA"},
  ];

  return (
    <AbsoluteFill style={{backgroundColor: C.night}}>
      <Camera x0={0} x1={0} y0={10} y1={-20} z0={1.12} z1={1.18} duration={237}>
        <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{overflow: "visible"}}>
          <TempleBackground />
          {/* Golden Divine Sun Glow behind Krishna */}
          <ellipse cx={540} cy={820} rx={420} ry={420} fill="#f0b429" opacity={0.25 * auraPulse} filter="url(#blur30)" />
          {/* Krishna Puppet in Divine Center Stage */}
          <PuppetCharacter x={540} y={1170} scale={1.6} look={KRISHNA_LOOK} keys={krishnaKeys} speaking={true} seed={5} />
        </svg>
      </Camera>

      <GoldDust count={45} />
      <Vignette />
      <Grain opacity={0.06} />
      <HindiSubtitle text="श्रीकृष्ण मुस्कुराए: 'सेना की संख्या नहीं, रणनीति और मनोबल युद्ध जीतता है! एक संकल्पी योद्धा सौ पर भारी है!'" highlight="श्रीकृष्ण का अमर रहस्य" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------
// SCENE 3: The Battlefield Clash
// ---------------------------------------------------------------------
const Scene3Clash: React.FC = () => {
  const warriorKeys: PoseKey[] = [
    {f: 0, pose: "mace"},
    {f: 40, pose: "point"},
    {f: 90, pose: "angry"},
    {f: 160, pose: "mace"},
  ];
  const rajaKeys: PoseKey[] = [
    {f: 0, pose: "raiseA"},
    {f: 60, pose: "angry"},
    {f: 140, pose: "point"},
  ];

  return (
    <AbsoluteFill style={{backgroundColor: C.night}}>
      <Camera x0={30} x1={-30} z0={1.1} z1={1.16} shake={4.5} duration={225}>
        <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{overflow: "visible"}}>
          <TempleBackground />
          {/* Warrior swinging mace on left */}
          <PuppetCharacter x={320} y={1180} scale={1.45} look={WARRIOR_LOOK} keys={warriorKeys} speaking={false} seed={7} />
          {/* Raja charging with sword on right */}
          <PuppetCharacter x={750} y={1180} scale={1.42} flip={true} look={RAJA_LOOK} keys={rajaKeys} speaking={true} seed={8} />
        </svg>
      </Camera>

      <GoldDust count={50} />
      <Vignette />
      <Grain opacity={0.07} />
      <HindiSubtitle text="राजा के शूरवीरों ने शंखनाद किया और गदा-धनुष से दुश्मन सेना के पसीने छुड़ा दिए!" highlight="रणभूमि में महाप्रहार" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------
// SCENE 4: Victory of Dharma & Krishna
// ---------------------------------------------------------------------
const Scene4Victory: React.FC = () => {
  const rajaKeys: PoseKey[] = [
    {f: 0, pose: "idle"},
    {f: 40, pose: "bow"},
    {f: 140, pose: "raiseA"},
  ];
  const krishnaKeys: PoseKey[] = [
    {f: 0, pose: "raiseA"},
    {f: 80, pose: "guard"},
    {f: 160, pose: "raiseA"},
  ];

  return (
    <AbsoluteFill style={{backgroundColor: C.night}}>
      <Camera x0={0} x1={0} z0={1.06} z1={1.14} duration={281}>
        <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{overflow: "visible"}}>
          <TempleBackground />
          {/* Raja and Krishna together in triumph */}
          <PuppetCharacter x={330} y={1190} scale={1.42} look={RAJA_LOOK} keys={rajaKeys} speaking={false} seed={9} />
          <PuppetCharacter x={740} y={1190} scale={1.46} flip={true} look={KRISHNA_LOOK} keys={krishnaKeys} speaking={true} seed={10} />
        </svg>
      </Camera>

      {/* Victory Badge */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 40,
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, rgba(26, 13, 5, 0.95), rgba(74, 36, 16, 0.95))",
            border: "3px solid #f0b429",
            color: "#ffd45e",
            padding: "14px 44px",
            borderRadius: 50,
            fontSize: 44,
            fontWeight: 900,
            letterSpacing: 2,
            boxShadow: "0 8px 30px rgba(0,0,0,0.8), 0 0 25px rgba(240, 180, 41, 0.5)",
            fontFamily: "'Mukta', sans-serif",
            textTransform: "uppercase",
          }}
        >
          🚩 धर्म और नीति की विजय | जय श्रीकृष्ण
        </div>
      </div>

      <GoldDust count={55} />
      <Vignette />
      <Grain opacity={0.06} />
      <HindiSubtitle text="इतिहास गवाह है: जीत उसी की होती है जिसका सारथी सत्य और धर्म है! बोलो श्रीकृष्ण भगवान की जय!" highlight="सत्य और धर्म की विजय" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------
// Full 5-Scene Composition: PuppetWarStory
// Total Frames: 222 + 244 + 237 + 225 + 281 = 1209 (~40.3s)
// ---------------------------------------------------------------------
export const PuppetWarStory: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: C.night}}>
      <Sequence from={0} durationInFrames={222}>
        <Scene0Hook />
      </Sequence>
      <Sequence from={222} durationInFrames={244}>
        <Scene1Ask />
      </Sequence>
      <Sequence from={222 + 244} durationInFrames={237}>
        <Scene2Secret />
      </Sequence>
      <Sequence from={222 + 244 + 237} durationInFrames={225}>
        <Scene3Clash />
      </Sequence>
      <Sequence from={222 + 244 + 237 + 225} durationInFrames={281}>
        <Scene4Victory />
      </Sequence>
    </AbsoluteFill>
  );
};

export const PUPPET_WAR_STORY_FRAMES = 222 + 244 + 237 + 225 + 281; // 1209
