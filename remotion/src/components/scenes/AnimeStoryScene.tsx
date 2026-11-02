import React from "react";
import {useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill} from "remotion";
import {SvgCharacter} from "../../vox/SvgCharacter";
import {AnimeSpeedLines} from "../anime/AnimeSpeedLines";
import {AnimeFloatingParticles} from "../anime/AnimeFloatingParticles";

export interface AnimeStorySceneProps {
  s: any;
  plan: any;
  u: number;
}

export const AnimeStoryScene: React.FC<AnimeStorySceneProps> = ({s, plan, u}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames, width, height} = useVideoConfig();
  const c = plan.theme?.colors || {ac: "#FFD700", bg1: "#0a0a0f", bg2: "#1a120b", tx: "#FFFFFF"};
  const d = s.data || {};

  // Scene index or type deduction
  const title = (d.title || "").toLowerCase();
  const narration = (s.narration || s.tts_text || "").toLowerCase();

  // Determine which story scene we are in
  const isKrishna = narration.includes("krishna") || narration.includes("श्रीकृष्ण") || narration.includes("गीता") || title.includes("krishna");
  const isWarrior = narration.includes("warrior") || narration.includes("योद्धा") || narration.includes("मशाल") || title.includes("chakravyuh");
  const isClash = narration.includes("दुश्मन") || narration.includes("fauj") || narration.includes("लड़कर") || title.includes("lakh");
  const isVictory = narration.includes("इतिहास") || narration.includes("जीत") || narration.includes("विजय") || title.includes("victory");

  // 1. Cinematic Camera: Slow push-in + subtle horizontal sway
  const camZoom = interpolate(frame, [0, durationInFrames], [1.0, 1.12], {
    extrapolateRight: "clamp",
  });
  const camPanX = Math.sin(frame * 0.04) * (1.5 * u);
  const shake = (isWarrior || isClash) && frame % 18 < 6 ? Math.sin(frame * 2.2) * (1.2 * u) : 0;

  // 2. Scene Badges and Character Selection
  let badge = "⚔️ ५,००० बनाम १,००,०००";
  let charName = "raja";
  let bgTheme = "fortress_night"; // fortress_night | celestial_temple | mountain_fire | victory_dawn
  let particleColor = "#FF5722";
  let particleCount = 22;

  if (isKrishna) {
    badge = "🕉️ श्रीकृष्ण की अमर नीति";
    charName = "krishna";
    bgTheme = "celestial_temple";
    particleColor = "#FFD700";
    particleCount = 28;
  } else if (isWarrior) {
    badge = "🔥 रात का चक्रव्यूह";
    charName = "warrior";
    bgTheme = "mountain_fire";
    particleColor = "#FF7043";
    particleCount = 30;
  } else if (isVictory) {
    badge = "🚩 धर्म और नीति की विजय";
    charName = "raja";
    bgTheme = "victory_dawn";
    particleColor = "#FFD54F";
    particleCount = 35;
  } else if (isClash) {
    badge = "⚡ घाटी में महाविनाश";
    charName = "warrior";
    bgTheme = "mountain_fire";
    particleColor = "#E53935";
    particleCount = 25;
  }

  // 3. Background Environments
  const renderBackground = () => {
    if (bgTheme === "celestial_temple") {
      // Divine Celestial Aura Background
      const auraPulse = 0.9 + Math.sin(frame * 0.08) * 0.1;
      const rot = (frame * 0.4) % 360;
      return (
        <AbsoluteFill style={{background: "radial-gradient(circle at 50% 40%, #1a237e 0%, #0d1338 60%, #050818 100%)"}}>
          {/* Rotating Divine God Rays */}
          <div style={{position: "absolute", top: "35%", left: "50%", transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${auraPulse})`, opacity: 0.35}}>
            <svg width={900} height={900} viewBox="0 0 900 900">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <polygon key={deg} points="450,450 420,0 480,0" fill="#FFD700" transform={`rotate(${deg} 450 450)`} opacity={0.6} />
              ))}
            </svg>
          </div>
          {/* Temple Pillars Silhouette */}
          <svg viewBox="0 0 1080 1920" style={{position: "absolute", bottom: 0, width: "100%", height: "100%", opacity: 0.25}}>
            <rect x="60" y="500" width="90" height="1420" fill="#283593" />
            <rect x="930" y="500" width="90" height="1420" fill="#283593" />
            <path d="M0 1600 L1080 1600 L1080 1920 L0 1920 Z" fill="#1A237E" />
          </svg>
        </AbsoluteFill>
      );
    }

    if (bgTheme === "mountain_fire") {
      // Rugged Mountain Valley at Night with Blazing Torches
      return (
        <AbsoluteFill style={{background: "linear-gradient(180deg, #120907 0%, #2a0e05 50%, #150602 100%)"}}>
          {/* Action Speedlines on warrior scenes */}
          <AnimeSpeedLines color="#FF7043" count={32} opacity={0.35} />
          {/* Jagged Mountain Peaks Silhouette */}
          <svg viewBox="0 0 1080 1920" style={{position: "absolute", bottom: 0, width: "100%", height: "100%"}}>
            {/* Far mountains */}
            <path d="M0 1100 L250 850 L520 1050 L820 800 L1080 1020 L1080 1920 L0 1920 Z" fill="#1b0803" />
            {/* Flickering Torches across mountain ridge */}
            {[180, 250, 340, 520, 640, 780, 820, 960].map((tx, idx) => {
              const flameFlicker = 10 + Math.sin(frame * 0.3 + idx * 7) * 4;
              return (
                <g key={idx} transform={`translate(${tx}, ${920 + (idx % 3) * 30})`}>
                  <circle r={flameFlicker * 1.8} fill="rgba(255, 112, 67, 0.25)" />
                  <ellipse cx="0" cy="0" rx={flameFlicker * 0.6} ry={flameFlicker} fill="#FFEB3B" />
                  <ellipse cx="0" cy="2" rx={flameFlicker * 0.4} ry={flameFlicker * 0.7} fill="#FF5722" />
                  <line x1="0" y1="4" x2="0" y2="28" stroke="#4E342E" strokeWidth="4" />
                </g>
              );
            })}
            {/* Near cliff */}
            <path d="M0 1350 L380 1200 L720 1380 L1080 1250 L1080 1920 L0 1920 Z" fill="#0c0402" />
          </svg>
        </AbsoluteFill>
      );
    }

    if (bgTheme === "victory_dawn") {
      // Golden Sunrise over Fortress Walls
      return (
        <AbsoluteFill style={{background: "linear-gradient(180deg, #3E2723 0%, #D84315 40%, #FFB300 70%, #FFF8E1 100%)"}}>
          {/* Radiant Sun disc */}
          <div style={{position: "absolute", top: "35%", left: "50%", transform: "translate(-50%, -50%)"}}>
            <circle cx="0" cy="0" r="160" fill="rgba(255, 235, 59, 0.85)" filter="blur(20px)" />
            <circle cx="0" cy="0" r="110" fill="#FFF" />
          </div>
          {/* Fortress battlements */}
          <svg viewBox="0 0 1080 1920" style={{position: "absolute", bottom: 0, width: "100%", height: "100%"}}>
            <path d="M0 1400 H120 V1340 H200 V1400 H320 V1340 H400 V1400 H520 V1340 H600 V1400 H720 V1340 H800 V1400 H920 V1340 H1000 V1400 H1080 V1920 H0 Z" fill="#1b1008" />
            {/* Saffron Victory Flag */}
            <g transform="translate(860, 1180)">
              <line x1="0" y1="0" x2="0" y2="170" stroke="#4E342E" strokeWidth="6" />
              <path d={`M0 0 Q${60 + Math.sin(frame * 0.15) * 15} 35 120 30 L0 75 Z`} fill="#FF6F00" stroke="#E65100" strokeWidth="2" />
            </g>
          </svg>
        </AbsoluteFill>
      );
    }

    // Default: Fortress Night with Torches
    return (
      <AbsoluteFill style={{background: "radial-gradient(circle at 50% 20%, #1c1524 0%, #0d0a14 60%, #050408 100%)"}}>
        {/* Starry Night particles */}
        <AnimeSpeedLines color="#FFB300" count={18} opacity={0.12} />
        {/* Royal Fort battlements in darkness */}
        <svg viewBox="0 0 1080 1920" style={{position: "absolute", bottom: 0, width: "100%", height: "100%"}}>
          <path d="M0 1380 H140 V1320 H220 V1380 H360 V1320 H440 V1380 H580 V1320 H660 V1380 H800 V1320 H880 V1380 H1080 V1920 H0 Z" fill="#08070d" />
          {/* Royal Fire Torches */}
          {[180, 840].map((tx, idx) => {
            const flameFlicker = 14 + Math.sin(frame * 0.35 + idx * 5) * 5;
            return (
              <g key={idx} transform={`translate(${tx}, 1280)`}>
                <circle r={flameFlicker * 2.2} fill="rgba(255, 152, 0, 0.3)" />
                <ellipse cx="0" cy="0" rx={flameFlicker * 0.7} ry={flameFlicker} fill="#FFF" />
                <ellipse cx="0" cy="4" rx={flameFlicker * 0.5} ry={flameFlicker * 0.8} fill="#FF9800" />
                <line x1="0" y1="6" x2="0" y2="40" stroke="#795548" strokeWidth="5" />
              </g>
            );
          })}
        </svg>
      </AbsoluteFill>
    );
  };

  // Entrance spring for character and badge
  const badgeSpring = spring({frame: Math.max(0, frame - 3), fps, config: {damping: 11, stiffness: 130}});
  const charSpring = spring({frame: Math.max(0, frame - 5), fps, config: {damping: 12, stiffness: 110}});

  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      {/* 1. ANIMATED 2D BACKGROUND ENVIRONMENT */}
      {renderBackground()}

      {/* 2. ATMOSPHERIC FLOATING EMBERS & PARTICLES */}
      <AnimeFloatingParticles color={particleColor} count={particleCount} speed={1.1} />

      {/* 3. TOP CINEMATIC ANIME STORY BADGE */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 15,
          transform: `scale(${badgeSpring})`,
          transformOrigin: "center top",
        }}
      >
        <div
          style={{
            background: "linear-gradient(135deg, rgba(20,20,25,0.92), rgba(35,30,45,0.92))",
            border: `2px solid ${c.ac || "#FFD700"}`,
            color: "#FFF",
            padding: `${1.1 * u}px ${4.5 * u}px`,
            borderRadius: 50,
            fontSize: 4.6 * u,
            fontWeight: 900,
            letterSpacing: 2,
            boxShadow: `0 8px 30px rgba(0,0,0,0.6), 0 0 25px ${c.ac}55`,
            textTransform: "uppercase",
            fontFamily: "'Mukta', sans-serif",
          }}
        >
          {badge}
        </div>
      </div>

      {/* 4. MAIN PROMINENT 2D ANIMATED CHARACTER */}
      <div
        style={{
          position: "absolute",
          bottom: "16%",
          left: "50%",
          transform: `translateX(calc(-50% + ${camPanX + shake}px)) scale(${camZoom * charSpring})`,
          transformOrigin: "bottom center",
          zIndex: 10,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.85))",
        }}
      >
        <SvgCharacter
          name={charName}
          p={{
            name: "royal_war",
            c1: "#C62828",
            c2: "#1A237E",
            c3: "#FFD700",
            c4: "#FF5722",
            ink: "#111111",
            light: "#FFF8E1",
          }}
          size={580}
          f={frame}
        />
      </div>

      {/* 5. CINEMATIC VIGNETTE & MOOD LIGHTING OVERLAY */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)",
          zIndex: 12,
        }}
      />
    </AbsoluteFill>
  );
};
