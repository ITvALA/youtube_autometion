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
  ClashSparks,
  SlashTrail,
  FlyingArrows,
  ArmyMarch,
} from "./PuppetKit";

/* ---------------------------------------------------------------------
   5000 VS 1 LAKH : KRISHNA WAR SECRET
   Full-Motion Battle Action & Walk Cycles + SVG Cutout Marionette Story
   --------------------------------------------------------------------- */

// Specialized Looks for Raja, Krishna, Warrior & Enemy Soldier
export const RAJA_LOOK: Look = {
  face: "human",
  skin: "#f1c27d",
  dhoti: "#c2185b", // royal magenta
  halo: false,
  prop: "sword",
  propHand: "B",
  secondaryProp: "shield",
  secondaryPropHand: "A",
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

export const ENEMY_LOOK: Look = {
  face: "human",
  skin: "#c88452",
  dhoti: "#1e293b",
  halo: false,
  prop: "spear",
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
          fontSize: 34,
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.45,
          boxShadow: "0 14px 38px rgba(0,0,0,0.85)",
          maxWidth: 960,
        }}
      >
        {highlight ? (
          <span
            style={{
              color: "#ffd45e",
              fontWeight: 800,
              marginRight: 10,
              textDecoration: "underline",
              textUnderlineOffset: 6,
            }}
          >
            {highlight}:
          </span>
        ) : null}
        <span>{text}</span>
      </div>
    </div>
  );
};

// 5000 VS 1 LAKH Hero Title Badge from user's reference image
const HeroTitleOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const pop = interpolate(frame, [0, 14], [0.8, 1], {extrapolateRight: "clamp"});
  const op = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: "clamp"});

  return (
    <div
      style={{
        position: "absolute",
        top: "38%",
        left: 0,
        right: 0,
        textAlign: "center",
        zIndex: 35,
        opacity: op,
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
        <span style={{color: "#ffffff"}}>5000 </span>
        <span style={{color: "#e91e63", fontStyle: "italic"}}>VS </span>
        <span style={{color: "#ffffff"}}>1 LAKH</span>
      </div>

      {/* Subtitle: Krishna War Secret */}
      <div
        style={{
          marginTop: 18,
          fontSize: 54,
          fontFamily: "'Cinzel', serif",
          fontWeight: 700,
          color: "#ffd45e",
          letterSpacing: "0.06em",
          filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.8))",
        }}
      >
        <span style={{borderBottom: "4px solid #e91e63", paddingBottom: 6}}>Krishna War Secret</span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------
// SCENE 0: Hook (5000 vs 1 Lakh - Raja Marching into Challenge)
// ---------------------------------------------------------------------
const Scene0Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const rajaX = interpolate(frame, [0, 140], [180, 540], {extrapolateRight: "clamp"});
  const isWalking = frame < 140;

  const keys: PoseKey[] = [
    {f: 0, pose: "marchA"},
    {f: 60, pose: "marchB"},
    {f: 140, pose: "slashHigh"},
    {f: 180, pose: "point"},
  ];

  return (
    <AbsoluteFill style={{backgroundColor: C.night}}>
      <Camera x0={-30} x1={20} z0={1.04} z1={1.12} duration={222}>
        <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{overflow: "visible"}}>
          <TempleBackground />
          {/* Silhouetted Army marching in background */}
          <ArmyMarch frame={frame} direction={1} />
          {/* Flying arrows across the sky */}
          <FlyingArrows frame={frame} count={5} />
          {/* Raja Puppet physically walking forward with Sword & Shield */}
          <PuppetCharacter
            x={rajaX}
            y={1180}
            scale={1.55}
            look={RAJA_LOOK}
            keys={keys}
            speaking={true}
            walk={isWalking ? {speed: 0.28} : false}
          />
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
// SCENE 1: Raja Walks To Krishna Pleading for Strategy
// ---------------------------------------------------------------------
const Scene1Ask: React.FC = () => {
  const frame = useCurrentFrame();
  const rajaX = interpolate(frame, [0, 80], [120, 330], {extrapolateRight: "clamp"});
  const isWalking = frame < 80;

  const rajaKeys: PoseKey[] = [
    {f: 0, pose: "marchA"},
    {f: 80, pose: "bow"},
    {f: 130, pose: "point"},
    {f: 190, pose: "bow"},
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
          {/* Raja walking in urgently, then bowing to Krishna */}
          <PuppetCharacter
            x={rajaX}
            y={1190}
            scale={1.38}
            look={RAJA_LOOK}
            keys={rajaKeys}
            speaking={true}
            seed={1}
            walk={isWalking ? {speed: 0.26} : false}
          />
          {/* Krishna on right listening calmly with divine halo */}
          <PuppetCharacter
            x={760}
            y={1190}
            scale={1.42}
            flip={true}
            look={KRISHNA_LOOK}
            keys={krishnaKeys}
            speaking={false}
            seed={2}
          />
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
  const auraPulse = 1 + Math.sin(frame * 0.1) * 0.08;
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
          <ellipse cx={540} cy={820} rx={440} ry={440} fill="#f0b429" opacity={0.28 * auraPulse} filter="url(#blur30)" />
          {/* Flying divine aura rays */}
          {Array.from({length: 12}).map((_, i) => {
            const rot = i * 30 + frame * 0.25;
            return (
              <line
                key={i}
                x1={540}
                y1={820}
                x2={540 + Math.cos((rot * Math.PI) / 180) * 580}
                y2={820 + Math.sin((rot * Math.PI) / 180) * 580}
                stroke="#ffd45e"
                strokeWidth={3}
                opacity={0.35}
                strokeDasharray="16 16"
              />
            );
          })}
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
// SCENE 3: FULL ACTION BATTLE CLASH (Running, Sword Attack & Strike)
// ---------------------------------------------------------------------
const Scene3Clash: React.FC = () => {
  const frame = useCurrentFrame();

  // Raja runs forward and attacks
  const rajaX = interpolate(frame, [0, 48, 80, 140, 225], [120, 360, 350, 410, 480], {extrapolateRight: "clamp"});
  const isRajaRunning = frame < 48;

  // Enemy soldier charges from right, gets hit at frame 50, knocked back
  const enemyX = interpolate(frame, [0, 48, 65, 120, 150, 225], [980, 640, 750, 720, 860, 940], {extrapolateRight: "clamp"});
  const isEnemyRunning = frame < 48;

  // Vanara hero advances in support with mace
  const warriorX = interpolate(frame, [0, 80, 140], [40, 210, 250], {extrapolateRight: "clamp"});

  // Raja attacks with sword
  const rajaKeys: PoseKey[] = [
    {f: 0, pose: "charge"},
    {f: 40, pose: "slashHigh"},
    {f: 50, pose: "slashStrike"},
    {f: 90, pose: "clashLock"},
    {f: 135, pose: "slashHigh"},
    {f: 145, pose: "slashStrike"},
    {f: 180, pose: "angry"},
  ];

  // Enemy spear strike, then recoil from hit
  const enemyKeys: PoseKey[] = [
    {f: 0, pose: "charge"},
    {f: 45, pose: "slashStrike"},
    {f: 52, pose: "recoilHit"},
    {f: 95, pose: "guard"},
    {f: 140, pose: "recoilHit"},
    {f: 190, pose: "sad"},
  ];

  const warriorKeys: PoseKey[] = [
    {f: 0, pose: "charge"},
    {f: 55, pose: "slashStrike"},
    {f: 120, pose: "mace"},
    {f: 170, pose: "angry"},
  ];

  // Camera shake violently on hits
  const isHit1 = frame >= 48 && frame <= 68;
  const isHit2 = frame >= 140 && frame <= 160;
  const shakeAmt = isHit1 || isHit2 ? 8.5 : 2.5;

  return (
    <AbsoluteFill style={{backgroundColor: C.night}}>
      <Camera x0={20} x1={-20} z0={1.12} z1={1.2} shake={shakeAmt} duration={225}>
        <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{overflow: "visible"}}>
          <TempleBackground />

          {/* Flying battle arrows across the battlefield */}
          <FlyingArrows frame={frame} count={8} />

          {/* Vanara hero with Mace leaping in */}
          <PuppetCharacter
            x={warriorX}
            y={1190}
            scale={1.35}
            look={WARRIOR_LOOK}
            keys={warriorKeys}
            speaking={false}
            seed={7}
            walk={frame < 60 ? {speed: 0.32, run: true} : false}
          />

          {/* Raja charging forward with Sword & Shield */}
          <PuppetCharacter
            x={rajaX}
            y={1180}
            scale={1.46}
            look={RAJA_LOOK}
            keys={rajaKeys}
            speaking={false}
            seed={8}
            walk={isRajaRunning ? {speed: 0.36, run: true} : false}
          />

          {/* Enemy soldier charging and clashing */}
          <PuppetCharacter
            x={enemyX}
            y={1180}
            scale={1.44}
            flip={true}
            look={ENEMY_LOOK}
            keys={enemyKeys}
            speaking={false}
            seed={11}
            walk={isEnemyRunning ? {speed: 0.34, run: true} : false}
          />

          {/* Visual Combat FX: Sword Slash Arc */}
          <SlashTrail cx={460} cy={1020} startFrame={45} frame={frame} duration={12} radius={220} />
          <SlashTrail cx={480} cy={1010} startFrame={140} frame={frame} duration={12} radius={240} />

          {/* Weapon Clash Sparks Explosion */}
          <ClashSparks x={510} y={1030} triggerFrame={50} frame={frame} />
          <ClashSparks x={550} y={1010} triggerFrame={145} frame={frame} />
        </svg>
      </Camera>

      <GoldDust count={55} />
      <Vignette />
      <Grain opacity={0.07} />
      <HindiSubtitle text="राजा के शूरवीरों ने शंखनाद किया और गदा-धनुष से दुश्मन सेना के पसीने छुड़ा दिए!" highlight="रणभूमि में महाप्रहार" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------
// SCENE 4: VICTORY MARCH (Dharma & Strategy Triumphant)
// ---------------------------------------------------------------------
const Scene4Victory: React.FC = () => {
  const frame = useCurrentFrame();

  // Grand victory march - characters walking forward together
  const rajaX = interpolate(frame, [0, 281], [240, 360], {extrapolateRight: "clamp"});
  const krishnaX = interpolate(frame, [0, 281], [680, 780], {extrapolateRight: "clamp"});

  const rajaKeys: PoseKey[] = [
    {f: 0, pose: "marchA"},
    {f: 80, pose: "marchB"},
    {f: 160, pose: "raiseA"},
  ];
  const krishnaKeys: PoseKey[] = [
    {f: 0, pose: "raiseA"},
    {f: 90, pose: "guard"},
    {f: 170, pose: "raiseA"},
  ];

  return (
    <AbsoluteFill style={{backgroundColor: C.night}}>
      <Camera x0={-20} x1={20} z0={1.06} z1={1.14} duration={281}>
        <svg width="100%" height="100%" viewBox="0 0 1080 1920" style={{overflow: "visible"}}>
          <TempleBackground />

          {/* Celebrating army marching in background */}
          <ArmyMarch frame={frame} direction={1} />

          {/* Raja marching victoriously with sword */}
          <PuppetCharacter
            x={rajaX}
            y={1190}
            scale={1.42}
            look={RAJA_LOOK}
            keys={rajaKeys}
            speaking={false}
            seed={9}
            walk={{speed: 0.22}}
          />

          {/* Lord Krishna triumphant with divine aura */}
          <PuppetCharacter
            x={krishnaX}
            y={1190}
            scale={1.46}
            flip={true}
            look={KRISHNA_LOOK}
            keys={krishnaKeys}
            speaking={true}
            seed={10}
            walk={{speed: 0.18}}
          />
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
            background: "linear-gradient(135deg, #f0b429, #d9541c)",
            border: "3px solid #ffd45e",
            borderRadius: 30,
            padding: "14px 34px",
            color: "#1a0802",
            fontFamily: "'Cinzel', serif",
            fontSize: 32,
            fontWeight: 900,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
          }}
        >
          🚩 धर्म और नीति की विजय | जय श्रीकृष्ण
        </div>
      </div>

      <GoldDust count={60} />
      <Vignette />
      <Grain opacity={0.06} />
      <HindiSubtitle text="रणनीति और विश्वास ने असंभव को संभव कर दिखाया! अधर्म हारा, धर्म जीता!" highlight="परम विजय" />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------
// MAIN 5000 VS 1 LAKH STORY COMPOSITION (1209 frames total = 40.30s)
// ---------------------------------------------------------------------
export const PuppetWarStory: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: C.night}}>
      {/* Scene 0: Hook (222 frames / 7.4s) */}
      <Sequence from={0} durationInFrames={222}>
        <Scene0Hook />
      </Sequence>

      {/* Scene 1: The Question (244 frames / 8.13s) */}
      <Sequence from={222} durationInFrames={244}>
        <Scene1Ask />
      </Sequence>

      {/* Scene 2: Krishna's Secret (237 frames / 7.9s) */}
      <Sequence from={466} durationInFrames={237}>
        <Scene2Secret />
      </Sequence>

      {/* Scene 3: Battlefield Action Clash (225 frames / 7.5s) */}
      <Sequence from={703} durationInFrames={225}>
        <Scene3Clash />
      </Sequence>

      {/* Scene 4: Victory (281 frames / 9.37s) */}
      <Sequence from={928} durationInFrames={281}>
        <Scene4Victory />
      </Sequence>
    </AbsoluteFill>
  );
};

export const PUPPET_WAR_STORY_FRAMES = 222 + 244 + 237 + 225 + 281; // 1209
