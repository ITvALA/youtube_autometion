import React from "react";
import {useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill} from "remotion";

export interface CutoutPuppetSceneProps {
  s: any;
  plan: any;
  u: number;
}

export const CutoutPuppetScene: React.FC<CutoutPuppetSceneProps> = ({s, plan, u}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const c = plan.theme?.colors || {ac: "#FF9933", bg1: "#120d0a", bg2: "#241812", tx: "#FFFFFF"};
  const d = s.data || {};

  const narration = String(s.narration || s.tts_text || "").toLowerCase();
  const isShivaji = narration.includes("शिवाजी") || narration.includes("shivaji") || narration.includes("वाघ-नख") || narration.includes("कवच");
  const isAfzal = narration.includes("अफ़ज़ल") || narration.includes("afzal") || narration.includes("खंजर") || narration.includes("धोखा");
  const isClash = narration.includes("हमला") || narration.includes("वार") || narration.includes("चीर") || narration.includes("खत्म");
  const isVictory = narration.includes("इतिहास") || narration.includes("विजय") || narration.includes("स्वराज्य") || narration.includes("जीत");

  // 1. Natural Puppet Cutout Dynamics (Kurzgesagt / South Park style)
  const breath = Math.sin(frame * 0.14) * (2 * u);
  const headTilt = Math.sin(frame * 0.08) * 3;
  const blink = (frame % 75) > 71;

  // Lip sync mouth open level (0..1)
  const isTalking = (frame % 40) < 26;
  const mouthOpen = isTalking ? (Math.sin(frame * 0.9) * 0.5 + 0.5) : 0;

  // Arms rotation around shoulder joint
  const armL = Math.sin(frame * 0.12) * 8;
  const armR = isClash ? -45 + Math.sin(frame * 0.4) * 20 : (isTalking ? 20 + Math.sin(frame * 0.3) * 25 : -10);

  // 2. Camera: Subtle cinematic zoom-in
  const camZoom = interpolate(frame, [0, durationInFrames], [1.0, 1.1], {extrapolateRight: "clamp"});
  const camPanY = interpolate(frame, [0, durationInFrames], [0, -10]);

  // Screen shake on clash scene
  const shake = isClash && frame % 12 < 4 ? Math.sin(frame * 2.5) * 6 : 0;

  // Puppet entrance spring
  const pop = spring({frame: Math.max(0, frame - 3), fps, config: {damping: 12, stiffness: 120}});

  // Badges & Context
  let badge = "🚩 छत्रपति शिवाजी महाराज 🚩";
  let sceneTitle = "वाघ-नख की अमर रणनीति";
  if (isAfzal) {
    badge = "⚠️ धोखे का षડયંત્ર ⚠️";
    sceneTitle = "शामियाने में घातक मिलन";
  } else if (isClash) {
    badge = "⚡ वाघ-नख का पलटवार ⚡";
    sceneTitle = "कवच ने बचाई जान!";
  } else if (isVictory) {
    badge = "🚩 हिन्दवी स्वराज्य की जय 🚩";
    sceneTitle = "इतिहास रच दिया!";
  }

  return (
    <AbsoluteFill style={{overflow: "hidden", background: "linear-gradient(175deg, #181210 0%, #2b1a11 60%, #150b06 100%)"}}>
      {/* 1. CUTOUT PAPER AMBIENCE & TORCH PARTICLES */}
      <div style={{position: "absolute", inset: 0, opacity: 0.15, backgroundImage: "radial-gradient(#ff9933 1px, transparent 1px)", backgroundSize: "36px 36px"}} />

      {/* 2. TOP CUTOUT BADGE */}
      <div style={{position: "absolute", top: "7%", left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 20, transform: `scale(${pop})`}}>
        <div style={{
          background: "linear-gradient(135deg, #FF6F00, #E65100)",
          color: "#FFF",
          padding: `${1.1 * u}px ${4.5 * u}px`,
          borderRadius: 99,
          fontSize: 4.8 * u,
          fontWeight: 900,
          boxShadow: "0 8px 24px rgba(0,0,0,0.6), 0 0 20px rgba(255,111,0,0.5)",
          border: "2px solid #FFD54F",
          letterSpacing: 1.5,
          fontFamily: "'Mukta', sans-serif"
        }}>
          {badge}
        </div>
        <div style={{marginTop: 12, fontSize: 4.2 * u, color: "#FFE082", fontWeight: 700, textShadow: "0 2px 10px rgba(0,0,0,0.8)"}}>
          {sceneTitle}
        </div>
      </div>

      {/* 3. MAIN FLAT VECTOR PUPPET STAGE */}
      <div style={{
        position: "absolute",
        bottom: "16%",
        left: "50%",
        transform: `translateX(calc(-50% + ${shake}px)) translateY(${camPanY}px) scale(${camZoom * pop})`,
        transformOrigin: "bottom center",
        zIndex: 10,
        filter: "drop-shadow(0 25px 35px rgba(0,0,0,0.75))"
      }}>
        <svg width={640} height={780} viewBox="0 0 320 390" style={{overflow: "visible"}}>
          {/* --- PUPPET SHADOW --- */}
          <ellipse cx="160" cy="370" rx="90" ry="16" fill="rgba(0,0,0,0.4)" />

          {/* --- PUPPET LEGS (Jointed Cutout) --- */}
          <g>
            <rect x="130" y="270" width="24" height="95" rx="10" fill="#E65100" stroke="#BF360C" strokeWidth="3" />
            <rect x="166" y="270" width="24" height="95" rx="10" fill="#E65100" stroke="#BF360C" strokeWidth="3" />
            {/* Royal Jootis */}
            <path d="M125 360 Q142 360 156 365 L156 375 L120 375 Z" fill="#3E2723" />
            <path d="M166 360 Q183 360 197 365 L197 375 L161 375 Z" fill="#3E2723" />
          </g>

          {/* --- PUPPET TORSO & CHATRAPATI ATTIRE (with Breathing Bob) --- */}
          <g transform={`translate(0, ${breath})`}>
            {/* Left Arm (Jointed at shoulder 105, 160) */}
            <g transform={`translate(105, 165) rotate(${armL})`}>
              <rect x="-14" y="0" width="28" height="90" rx="14" fill="#FF8F00" stroke="#E65100" strokeWidth="3" />
              {/* Hand holding Shield */}
              <circle cx="0" cy="95" r="14" fill="#E5B892" />
              {/* Maratha Dhal (Shield) */}
              <circle cx="5" cy="85" r="38" fill="#212121" stroke="#FFD54F" strokeWidth="4" />
              <circle cx="5" cy="85" r="6" fill="#D50000" />
            </g>

            {/* Torso (Angarkha with hidden chainmail kavach under it) */}
            <path d="M100 150 Q160 140 220 150 L235 285 Q160 295 85 285 Z" fill="#FF8F00" stroke="#E65100" strokeWidth="4" />
            {/* Saffron Sash & Royal Belt */}
            <rect x="100" y="225" width="120" height="24" rx="4" fill="#FFD54F" stroke="#FF8F00" strokeWidth="2" />
            {/* Hidden Steel Armor (Kavach) peek */}
            <path d="M135 155 L185 155 L180 205 L140 205 Z" fill="#78909C" stroke="#37474F" strokeWidth="2" strokeDasharray="4 4" opacity={isAfzal ? 0.95 : 0.6} />

            {/* Pearl Haar (Royal Necklace) */}
            <path d="M120 150 Q160 195 200 150" fill="none" stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 8" />
            <circle cx="160" cy="182" r="7" fill="#00E676" stroke="#FFD54F" strokeWidth="2" />

            {/* Right Arm (Jointed at shoulder 215, 165) */}
            <g transform={`translate(215, 165) rotate(${armR})`}>
              <rect x="-14" y="0" width="28" height="90" rx="14" fill="#FF8F00" stroke="#E65100" strokeWidth="3" />
              <circle cx="0" cy="95" r="14" fill="#E5B892" />
              {/* WAGH NAKH (Steel Tiger Claws in Hand!) */}
              <g transform="translate(0, 95)">
                <rect x="-12" y="-4" width="24" height="8" rx="3" fill="#37474F" stroke="#263238" strokeWidth="1.5" />
                {/* 4 Sharp curved tiger claws */}
                {[-9, -3, 3, 9].map((cx, i) => (
                  <path key={i} d={`M${cx} -4 Q${cx + 4} -25 ${cx + 10} -28 Q${cx + 5} -20 ${cx + 3} -4 Z`} fill="#ECEFF1" stroke="#455A64" strokeWidth="1.5" />
                ))}
              </g>
            </g>

            {/* --- NECK & HEAD (Jointed at 160, 130) --- */}
            <g transform={`translate(160, 120) rotate(${headTilt})`}>
              {/* Neck */}
              <rect x="-12" y="-10" width="24" height="24" fill="#E5B892" />

              {/* Head / Face Cutout */}
              <ellipse cx="0" cy="-35" rx="36" ry="42" fill="#E5B892" stroke="#BF360C" strokeWidth="2.5" />
              {/* Chhatrapati Royal Beard & Mustache */}
              <path d="M-28 -28 Q0 -18 28 -28 Q35 -38 28 -32 Q0 -22 -28 -32 Z" fill="#1A1A1A" />
              <path d="M-18 -20 Q0 -8 18 -20 Q12 -2 -12 -2 Z" fill="#1A1A1A" />

              {/* Rajputi Chandrakor Tilak (Crescent Moon Tilak) */}
              <path d="M-6 -60 A6 6 0 0 0 6 -60 A4 4 0 0 1 -6 -60 Z" fill="#C62828" />

              {/* Fierce Cutout Eyes */}
              {blink ? (
                <>
                  <line x1="-22" y1="-42" x2="-8" y2="-42" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
                  <line x1="8" y1="-42" x2="22" y2="-42" stroke="#1A1A1A" strokeWidth="3.5" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <ellipse cx="-15" cy="-42" rx="7" ry="5" fill="#FFF" />
                  <circle cx="-14" cy="-42" r="3" fill="#1A1A1A" />
                  <ellipse cx="15" cy="-42" rx="7" ry="5" fill="#FFF" />
                  <circle cx="14" cy="-42" r="3" fill="#1A1A1A" />
                </>
              )}

              {/* Talking Lip-Sync Cutout Mouth */}
              <ellipse cx="0" cy="-14" rx={8 + mouthOpen * 4} ry={2 + mouthOpen * 8} fill="#3b1219" />
              {mouthOpen > 0.4 && <ellipse cx="0" cy={-14 + mouthOpen * 3} rx={4} ry={2} fill="#d4606e" />}

              {/* CHHATRAPATI MARATHA PAGDI (Royal Turban with Kalgi) */}
              <g transform="translate(0, -68)">
                {/* Saffron Turban Wrap */}
                <path d="M-42 0 Q0 -25 42 0 L36 24 Q0 12 -36 24 Z" fill="#E65100" stroke="#BF360C" strokeWidth="2.5" />
                <path d="M-36 -10 Q0 -35 36 -10 L30 6 Q0 -6 -30 6 Z" fill="#FF6D00" />
                {/* Royal Jewel Kalgi Plume */}
                <path d="M0 -30 Q-12 -65 6 -75 Q10 -55 2 -30 Z" fill="#FFF8E1" stroke="#FFD54F" strokeWidth="2" />
                <circle cx="0" cy="-28" r="6" fill="#D50000" stroke="#FFD54F" strokeWidth="2" />
              </g>
            </g>
          </g>
        </svg>
      </div>
    </AbsoluteFill>
  );
};

