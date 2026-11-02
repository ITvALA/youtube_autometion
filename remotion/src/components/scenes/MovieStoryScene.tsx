import React from "react";
import {useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill} from "remotion";
import {AnimeSpeedLines} from "../anime/AnimeSpeedLines";
import {AnimeFloatingParticles} from "../anime/AnimeFloatingParticles";

export interface MovieStorySceneProps {
  s: any;
  plan: any;
  u: number;
}

export const MovieStoryScene: React.FC<MovieStorySceneProps> = ({s, plan, u}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const c = plan.theme?.colors || {ac: "#FF9933", bg1: "#100906", tx: "#FFFFFF"};
  const narration = (s.narration || s.tts_text || "").toLowerCase();

  // Deduce scene 0..4 based on keywords
  const isCamp = narration.includes("अफ़ज़ल") && (narration.includes("सेना") || narration.includes("१० फुट") || narration.includes("बुलाया"));
  const isArmor = narration.includes("कवच") || narration.includes("वाघ-नख") && narration.includes("छिपाए") || narration.includes("कुर्ते");
  const isBetrayal = narration.includes("शामियाने") || narration.includes("खंजर") && narration.includes("पीठ");
  const isClash = narration.includes("फिसल") || (narration.includes("सीना चीर") || narration.includes("पलटवार"));
  const isVictory = narration.includes("प्रतापगढ़") || narration.includes("धूल चटा") || narration.includes("जय");

  // Determine active movie scene index
  let sceneIndex = 0;
  if (isVictory) sceneIndex = 4;
  else if (isClash) sceneIndex = 3;
  else if (isBetrayal) sceneIndex = 2;
  else if (isArmor) sceneIndex = 1;
  else sceneIndex = 0;

  // Cinematic slow camera push-in
  const camZoom = interpolate(frame, [0, durationInFrames], [1.0, 1.14], {extrapolateRight: "clamp"});
  const camPanY = Math.sin(frame * 0.03) * (1.2 * u);
  const camPanX = Math.cos(frame * 0.025) * (1.0 * u);

  // Screen shake on action / clash scene
  const clashShake = sceneIndex === 3 ? (Math.sin(frame * 2.5) * (1.8 * u) * Math.max(0, 1 - frame / (fps * 2))) : 0;
  const betrayalPulse = sceneIndex === 2 ? 0.96 + Math.sin(frame * 0.25) * 0.04 : 1;

  // 1. SCENE 0: AFZAL KHAN & WAR ENCAMPMENT
  const renderCampScene = () => {
    const torchFlicker = Math.sin(frame * 0.6) * 4;
    return (
      <AbsoluteFill style={{background: "linear-gradient(180deg, #09060b 0%, #1a0d08 55%, #0d0603 100%)"}}>
        {/* Full Moon & Dark Clouds */}
        <div style={{position: "absolute", top: "12%", right: "15%", width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, #FFF5E1 20%, #E6C280 60%, rgba(255,255,255,0) 80%)", opacity: 0.85, filter: "blur(2px)"}} />
        <svg viewBox="0 0 1080 1920" style={{position: "absolute", width: "100%", height: "100%"}}>
          {/* Distant Mountain Silhouettes */}
          <path d="M 0 1100 Q 250 880 540 1020 T 1080 920 L 1080 1920 L 0 1920 Z" fill="#120808" opacity={0.9} />
          {/* Rows of War Tents */}
          {[-60, 180, 420, 680, 920].map((tx, idx) => (
            <g key={idx} transform={`translate(${tx} 1150) scale(0.85)`}>
              <polygon points="120,0 20,200 220,200" fill="#2d1611" stroke="#3d1d17" strokeWidth={3} />
              <polygon points="120,0 120,200 220,200" fill="#23100b" />
              <line x1={120} y1={0} x2={120} y2={-35} stroke="#5c2618" strokeWidth={4} />
              <polygon points="120,-35 170,-20 120,-5" fill="#C62828" />
            </g>
          ))}
          {/* Flaming Camp Torches */}
          {[120, 360, 620, 880, 1000].map((pos, idx) => (
            <g key={idx} transform={`translate(${pos} 1280)`}>
              <line x1={0} y1={0} x2={0} y2={120} stroke="#3e2723" strokeWidth={6} strokeLinecap="round" />
              <circle cx={0} cy={-5} r={22 + torchFlicker} fill="rgba(255, 87, 34, 0.45)" filter="blur(8px)" />
              <ellipse cx={0} cy={-5} rx={8} ry={16 + torchFlicker * 0.8} fill="#FFB300" />
              <ellipse cx={0} cy={-2} rx={4} ry={10} fill="#FFF" />
            </g>
          ))}
        </svg>

        {/* TOWERING GIANT AFZAL KHAN (Low-Angle Menacing Shot) */}
        <div style={{position: "absolute", bottom: "14%", left: "50%", transform: `translateX(-50%) translateY(${camPanY}px)`, zIndex: 10}}>
          <svg width={720} height={1020} viewBox="0 0 720 1020" style={{overflow: "visible", filter: "drop-shadow(0 25px 45px rgba(0,0,0,0.95))"}}>
            {/* Dark Broad Shoulders & Heavy Iron Armor */}
            <path d="M 180 500 L 260 280 L 460 280 L 540 500 L 500 850 L 220 850 Z" fill="#1b1d24" stroke="#37474f" strokeWidth={6} />
            <path d="M 280 280 L 360 480 L 440 280 Z" fill="#C62828" opacity={0.8} />
            {/* Spiked Shoulder Plates */}
            <path d="M 140 380 L 250 310 L 220 460 Z" fill="#263238" stroke="#455a64" strokeWidth={4} />
            <polygon points="170,300 190,340 150,340" fill="#90a4ae" />
            <path d="M 580 380 L 470 310 L 500 460 Z" fill="#263238" stroke="#455a64" strokeWidth={4} />
            <polygon points="550,300 570,340 530,340" fill="#90a4ae" />
            {/* Giant Head with Bijapur War Helmet */}
            <ellipse cx={360} cy={200} rx={95} ry={110} fill="#8d6e63" />
            {/* Heavy Dark Beard & Moustache */}
            <path d="M 270 200 Q 360 360 450 200 Q 420 380 360 410 Q 300 380 270 200 Z" fill="#111111" />
            <path d="M 290 220 Q 360 270 430 220" stroke="#111111" strokeWidth={16} strokeLinecap="round" />
            {/* Menacing Glowing Eyes */}
            <ellipse cx={320} cy={175} rx={14} ry={8} fill="#fff" />
            <circle cx={322} cy={175} r={4.5} fill="#D32F2F" />
            <ellipse cx={400} cy={175} rx={14} ry={8} fill="#fff" />
            <circle cx={398} cy={175} r={4.5} fill="#D32F2F" />
            <line x1={295} y1={155} x2={340} y2={168} stroke="#111" strokeWidth={7} strokeLinecap="round" />
            <line x1={425} y1={155} x2={380} y2={168} stroke="#111" strokeWidth={7} strokeLinecap="round" />
            {/* Spiked War Helmet */}
            <path d="M 260 180 Q 360 60 460 180 L 460 130 Q 360 20 260 130 Z" fill="#37474f" stroke="#cfd8dc" strokeWidth={3} />
            <polygon points="360,-20 345,60 375,60" fill="#eceff1" stroke="#37474f" strokeWidth={2} />
            {/* Massive Broadsword in Hand */}
            <g transform="translate(110 320) rotate(-22)">
              <rect x={-8} y={-420} width={18} height={420} rx={3} fill="#cfd8dc" stroke="#546e7a" strokeWidth={3} />
              <rect x={-45} y={0} width={90} height={14} rx={4} fill="#FFD700" />
              <rect x={-6} y={14} width={12} height={60} fill="#3e2723" />
              <circle cx={0} cy={82} r={14} fill="#FFD700" />
            </g>
          </svg>
        </div>
      </AbsoluteFill>
    );
  };

  // 2. SCENE 1: SECRET ARMING & WAGH NAKH CLOSE-UP
  const renderArmorScene = () => {
    const shineX = interpolate(frame % 40, [0, 40], [-250, 450]);
    return (
      <AbsoluteFill style={{background: "radial-gradient(circle at 50% 50%, #2a140d 0%, #150a06 60%, #080302 100%)"}}>
        {/* Armory Stone Wall & Torches */}
        <svg viewBox="0 0 1080 1920" style={{position: "absolute", width: "100%", height: "100%", opacity: 0.3}}>
          <pattern id="brick" width="120" height="60" patternUnits="userSpaceOnUse">
            <rect width="120" height="60" fill="none" stroke="#4a2818" strokeWidth="2" />
            <line x1="60" y1="0" x2="60" y2="60" stroke="#4a2818" strokeWidth="2" />
          </pattern>
          <rect width="1080" height="1920" fill="url(#brick)" />
        </svg>

        {/* Centerpiece: Concealed Chainmail Armor & Tiger Claws Display */}
        <div style={{position: "absolute", top: "24%", left: "50%", transform: "translateX(-50%)", width: 850, height: 850, display: "flex", justifyContent: "center", alignItems: "center"}}>
          <svg width={820} height={820} viewBox="0 0 820 820" style={{filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.85))"}}>
            {/* Royal Gold Sun Shield in Backdrop */}
            <circle cx={410} cy={410} r={360} fill="#3e1d10" stroke="#FF9933" strokeWidth={12} />
            <circle cx={410} cy={410} r={330} fill="none" stroke="#FFD700" strokeWidth={4} strokeDasharray="14 10" />
            {/* Iron Chainmail Pattern (Zari Kavach) */}
            <defs>
              <pattern id="rings" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="11" cy="11" r="9" fill="none" stroke="#B0BEC5" strokeWidth="2.5" />
                <circle cx="11" cy="11" r="5" fill="none" stroke="#78909C" strokeWidth="1.5" />
              </pattern>
              <clipPath id="clawClip">
                <rect x={180} y={150} width={460} height={520} />
              </clipPath>
            </defs>
            {/* Cutaway Royal Saffron Robe revealing Iron Chainmail */}
            <path d="M 240 180 Q 410 260 580 180 L 640 680 L 180 680 Z" fill="#b0bec5" stroke="#78909c" strokeWidth={6} />
            <path d="M 240 180 Q 410 260 580 180 L 640 680 L 180 680 Z" fill="url(#rings)" opacity={0.9} />
            {/* Left and Right Saffron Silk Lapels folded back */}
            <path d="M 180 160 L 320 280 L 260 680 L 140 680 Z" fill="#E65100" stroke="#FF9933" strokeWidth={6} />
            <path d="M 640 160 L 500 280 L 560 680 L 680 680 Z" fill="#E65100" stroke="#FF9933" strokeWidth={6} />

            {/* THE STEEL WAGH NAKH (TIGER CLAWS) CLOSE-UP */}
            <g transform="translate(180 260)">
              {/* Knuckle Bar & Dual Finger Rings */}
              <rect x={40} y={180} width={380} height={28} rx={10} fill="#455a64" stroke="#cfd8dc" strokeWidth={4} />
              <ellipse cx={80} cy={194} rx={22} ry={30} fill="none" stroke="#eceff1" strokeWidth={7} />
              <ellipse cx={380} cy={194} rx={22} ry={30} fill="none" stroke="#eceff1" strokeWidth={7} />
              {/* 4 Razor-Sharp Curved Steel Tiger Claws */}
              {[100, 180, 260, 340].map((cx, idx) => (
                <g key={idx}>
                  <path
                    d={`M ${cx - 14} 180 Q ${cx - 8} 80 ${cx + 25} 0 Q ${cx + 10} 70 ${cx + 16} 180 Z`}
                    fill="#eceff1"
                    stroke="#37474f"
                    strokeWidth={3}
                  />
                  {/* Razor edge highlight */}
                  <path d={`M ${cx - 14} 180 Q ${cx - 8} 80 ${cx + 25} 0`} stroke="#FFF" strokeWidth={4} fill="none" strokeLinecap="round" />
                </g>
              ))}
              {/* Light Glint / Sheen Sweep */}
              <line x1={shineX} y1={-20} x2={shineX + 80} y2={220} stroke="rgba(255,255,255,0.7)" strokeWidth={12} strokeLinecap="round" />
            </g>
          </svg>
        </div>
      </AbsoluteFill>
    );
  };

  // 3. SCENE 2: DEADLY EMBRACE IN SHAMIANA (THE BACKSTAB TRAP)
  const renderBetrayalScene = () => {
    return (
      <AbsoluteFill style={{background: "linear-gradient(180deg, #1b0709 0%, #3a0a10 50%, #150306 100%)"}}>
        {/* Royal Velvet Shamiana Curtains & Gold Tassels */}
        <svg viewBox="0 0 1080 1920" style={{position: "absolute", width: "100%", height: "100%"}}>
          {/* Top Velvet Valance */}
          <path d="M 0 0 L 1080 0 L 1080 240 Q 900 160 720 240 Q 540 160 360 240 Q 180 160 0 240 Z" fill="#880e4f" stroke="#FFD700" strokeWidth={8} />
          {/* Golden Tassels */}
          {[180, 360, 540, 720, 900].map((tx) => (
            <circle key={tx} cx={tx} cy={205} r={14} fill="#FFD700" />
          ))}
          {/* Ornate Gold Pillars */}
          <rect x={40} y={180} width={60} height={1740} fill="#c5a059" stroke="#5d4037" strokeWidth={4} />
          <rect x={980} y={180} width={60} height={1740} fill="#c5a059" stroke="#5d4037" strokeWidth={4} />
        </svg>

        {/* DRAMATIC TENSE EMBRACE & SECRET DAGGER */}
        <div style={{position: "absolute", bottom: "16%", left: "50%", transform: `translateX(-50%) scale(${betrayalPulse})`, zIndex: 10}}>
          <svg width={760} height={980} viewBox="0 0 760 980" style={{filter: "drop-shadow(0 25px 45px rgba(0,0,0,0.9))"}}>
            {/* Giant Afzal Khan Looming on the Right */}
            <path d="M 360 220 Q 550 140 680 320 L 720 920 L 320 920 Z" fill="#1b2e1b" stroke="#0d1b0d" strokeWidth={5} />
            <ellipse cx={560} cy={220} rx={95} ry={110} fill="#8d6e63" />
            <path d="M 470 230 Q 560 380 650 230 Z" fill="#111" />
            <polygon points="460,180 560,100 660,180" fill="#2e7d32" stroke="#FFD700" strokeWidth={4} />

            {/* Chhatrapati Shivaji Maharaj in Front Left */}
            <path d="M 120 420 L 340 380 L 400 920 L 100 920 Z" fill="#E65100" stroke="#FF9933" strokeWidth={4} />
            <ellipse cx={240} cy={320} rx={75} ry={88} fill="#f1c27d" />
            <path d="M 180 320 Q 240 390 300 320 Z" fill="#2b1b12" />
            {/* Saffron Turban with Pearl Kalgi */}
            <path d="M 160 290 Q 240 180 320 290 Z" fill="#FF9933" stroke="#E65100" strokeWidth={3} />
            <polygon points="240,190 230,130 250,130" fill="#FFD700" />
            <circle cx={240} cy={195} r={8} fill="#FFF" />

            {/* Afzal Khan's Treacherous Arm reaching around Shivaji's back */}
            <path d="M 520 420 Q 340 440 280 490" stroke="#8d6e63" strokeWidth={44} strokeLinecap="round" fill="none" />
            {/* The Poison Dagger Stabbing Shivaji's Back */}
            <g transform="translate(260 480) rotate(-45)">
              <rect x={-8} y={-80} width={16} height={80} rx={4} fill="#2e7d32" stroke="#FFD700" strokeWidth={2} />
              {/* Gleaming curved venom blade plunging down */}
              <path d="M -8 0 Q -15 90 28 170 Q 10 90 8 0 Z" fill="#eceff1" stroke="#37474f" strokeWidth={3} />
              <line x1={-8} y1={0} x2={28} y2={170} stroke="#76ff03" strokeWidth={3} />
              {/* Warning Poison Flash Glow */}
              <circle cx={14} cy={100} r={40} fill="rgba(213, 0, 0, 0.45)" filter="blur(10px)" />
            </g>
          </svg>
        </div>

        {/* Cinematic Red Blood/Betrayal Alert Vignette */}
        <AbsoluteFill style={{background: "radial-gradient(circle at 45% 55%, rgba(183, 28, 28, 0) 40%, rgba(183, 28, 28, 0.45) 100%)", pointerEvents: "none"}} />
      </AbsoluteFill>
    );
  };

  // 4. SCENE 3: THE CLASH, ARMOR DEFLECTION & WAGH NAKH STRIKE
  const renderClashScene = () => {
    return (
      <AbsoluteFill style={{background: "linear-gradient(180deg, #1f0802 0%, #3e1205 50%, #150502 100%)"}}>
        {/* Anime Speedlines on Impact */}
        <AnimeSpeedLines color="#FF9933" count={44} opacity={0.4} />

        <div style={{position: "absolute", width: "100%", height: "100%", transform: `translate(${clashShake}px, ${clashShake * 0.7}px)`}}>
          {/* THE EXPLOSIVE IMPACT CLASH */}
          <div style={{position: "absolute", top: "25%", left: "50%", transform: "translateX(-50%)", width: 850, height: 850}}>
            <svg width={850} height={850} viewBox="0 0 850 850" style={{overflow: "visible"}}>
              {/* Broken / Sliding Dagger deflected by Iron Chainmail */}
              <g transform="translate(240 320) rotate(-15)">
                <path d="M 0 0 L 180 80" stroke="#cfd8dc" strokeWidth={14} strokeLinecap="round" />
                <path d="M 180 80 L 260 90" stroke="#90a4ae" strokeWidth={10} strokeDasharray="8 6" strokeLinecap="round" />
              </g>

              {/* MASSIVE SPARK EXPLOSION AT CONTACT POINT */}
              <g transform="translate(420 400)">
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <line
                    key={deg}
                    x1={0}
                    y1={0}
                    x2={Math.cos((deg * Math.PI) / 180) * 160}
                    y2={Math.sin((deg * Math.PI) / 180) * 160}
                    stroke={deg % 60 === 0 ? "#FFF" : "#FFD700"}
                    strokeWidth={deg % 60 === 0 ? 8 : 4}
                    strokeLinecap="round"
                  />
                ))}
                <circle cx={0} cy={0} r={45} fill="#FFF" filter="blur(4px)" />
                <circle cx={0} cy={0} r={95} fill="rgba(255, 153, 51, 0.6)" filter="blur(16px)" />
              </g>

              {/* SHIVAJI MAHARAJ'S WAGH NAKH COUNTER-STRIKE */}
              <g transform="translate(420 400) rotate(35)">
                {/* 4 Glowing Tiger Claw Slash Arcs */}
                {[-35, -12, 12, 35].map((off, idx) => (
                  <path
                    key={idx}
                    d={`M ${off} -180 Q ${off + 40} 0 ${off - 20} 220`}
                    fill="none"
                    stroke="#FF9933"
                    strokeWidth={14}
                    strokeLinecap="round"
                    filter="drop-shadow(0 0 12px #FF5722)"
                  />
                ))}
              </g>

              {/* Afzal Khan's Armor Shattering */}
              <path d="M 520 280 L 720 380 L 680 720 Z" fill="#263238" stroke="#f44336" strokeWidth={6} />
              <line x1={580} y1={360} x2={660} y2={560} stroke="#f44336" strokeWidth={8} strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </AbsoluteFill>
    );
  };

  // 5. SCENE 4: GLORIOUS SUNRISE OVER PRATAPGARH & BHAGWA DHWAJ
  const renderVictoryScene = () => {
    const sunRot = (frame * 0.25) % 360;
    const flagWave = Math.sin(frame * 0.18) * 16;
    return (
      <AbsoluteFill style={{background: "linear-gradient(180deg, #1a0802 0%, #d84315 45%, #ff8f00 70%, #ffe082 100%)"}}>
        {/* Radiant Sunrise Sunburst Rays */}
        <div
          style={{
            position: "absolute",
            top: "35%",
            left: "50%",
            width: 1400,
            height: 1400,
            transform: `translate(-50%, -50%) rotate(${sunRot}deg)`,
            opacity: 0.35,
          }}
        >
          <svg viewBox="0 0 1400 1400" width="100%" height="100%">
            {[0, 20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340].map((deg) => (
              <polygon key={deg} points="700,700 660,0 740,0" fill="#FFD54F" transform={`rotate(${deg} 700 700)`} />
            ))}
          </svg>
        </div>

        {/* Fort Pratapgarh Mountain Silhouette */}
        <svg viewBox="0 0 1080 1920" style={{position: "absolute", width: "100%", height: "100%"}}>
          {/* Jagged Western Ghats Mountains */}
          <path d="M 0 1200 Q 240 920 540 1080 T 1080 960 L 1080 1920 L 0 1920 Z" fill="#210d04" />
          <path d="M 180 1350 L 380 980 L 720 980 L 920 1350 Z" fill="#140602" />
          {/* Fort Bastions & Stone Ramparts */}
          <rect x={380} y={960} width={340} height={120} fill="#1a0a03" stroke="#5d280b" strokeWidth={4} />
          {/* Battlements teeth */}
          {[390, 440, 490, 540, 590, 640, 690].map((bx) => (
            <rect key={bx} x={bx} y={930} width={30} height={35} fill="#1a0a03" />
          ))}

          {/* GIANT SAFFRON BHAGWA DHWAJ FLUTTERING PROUDLY */}
          <g transform="translate(540 680)">
            {/* Tall Golden Flagpole */}
            <line x1={0} y1={-20} x2={0} y2={320} stroke="#FFD700" strokeWidth={10} strokeLinecap="round" />
            <circle cx={0} cy={-24} r={14} fill="#FFD700" />
            {/* Twin-Tailed Maratha Saffron Flag */}
            <path
              d={`M 0 0 Q 140 ${-20 + flagWave} 340 ${20 + flagWave} L 220 ${90 + flagWave} L 340 ${160 + flagWave} Q 140 ${120 + flagWave} 0 140 Z`}
              fill="#FF6D00"
              stroke="#FFAB00"
              strokeWidth={5}
              filter="drop-shadow(0 15px 30px rgba(0,0,0,0.6))"
            />
            {/* Saffron Crescent Moon Tilak on Flag */}
            <circle cx={90} cy={60 + flagWave * 0.4} r={22} fill="#FFD700" />
            <circle cx={98} cy={56 + flagWave * 0.4} r={18} fill="#FF6D00" />
          </g>
        </svg>

        {/* Cheering Victorious Warriors Silhouettes */}
        <svg viewBox="0 0 1080 1920" style={{position: "absolute", width: "100%", height: "100%", opacity: 0.8}}>
          {[-20, 160, 320, 760, 920].map((wx, idx) => (
            <g key={idx} transform={`translate(${wx} 1360)`}>
              <circle cx={50} cy={0} r={16} fill="#000" />
              <rect x={35} y={16} width={30} height={70} fill="#000" />
              {/* Raised Spear / Sword */}
              <line x1={50} y1={25} x2={idx % 2 === 0 ? 95 : 10} y2={-75} stroke="#000" strokeWidth={5} strokeLinecap="round" />
            </g>
          ))}
        </svg>
      </AbsoluteFill>
    );
  };

  // Top Cinematic Scene Title Badge
  const sceneBadges = [
    "⚔️ दृश्य १: १० फुट का अफ़ज़ल ख़ान व बीजापुर सेना",
    "🛡️ दृश्य २: गुप्त कवच और लोहे के वाघ-नख",
    "⚠️ दृश्य ३: शामियाने में गले मिलने का छल",
    "⚡ दृश्य ४: कवच पर खंजर और वाघ-नख का प्रहार",
    "🚩 दृश्य ५: प्रतापगढ़ पर भगवा ध्वज व महाविजय",
  ];

  return (
    <AbsoluteFill style={{overflow: "hidden", transform: `scale(${camZoom}) translate(${camPanX}px, ${camPanY}px)`}}>
      {/* 1. REAL CINEMATIC MOVIE SCENE VISUAL */}
      {sceneIndex === 0 && renderCampScene()}
      {sceneIndex === 1 && renderArmorScene()}
      {sceneIndex === 2 && renderBetrayalScene()}
      {sceneIndex === 3 && renderClashScene()}
      {sceneIndex === 4 && renderVictoryScene()}

      {/* 2. FLOATING BATTLE EMBERS & SPARKS */}
      <AnimeFloatingParticles
        color={sceneIndex === 4 ? "#FFD54F" : sceneIndex === 3 ? "#FF5722" : "#FF9933"}
        count={28}
        speed={1.2}
      />

      {/* 3. CINEMATIC TOP SCENE BADGE */}
      <div
        style={{
          position: "absolute",
          top: "7.5%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          zIndex: 25,
        }}
      >
        <div
          style={{
            background: "rgba(10, 5, 3, 0.92)",
            border: `2px solid ${c.ac || "#FF9933"}`,
            color: "#FFF",
            padding: `${1.1 * u}px ${4.2 * u}px`,
            borderRadius: 50,
            fontSize: 4.2 * u,
            fontWeight: 900,
            letterSpacing: 1.5,
            boxShadow: `0 8px 30px rgba(0,0,0,0.8), 0 0 25px ${c.ac}66`,
            fontFamily: "'Mukta', sans-serif",
            textTransform: "uppercase",
          }}
        >
          {sceneBadges[sceneIndex]}
        </div>
      </div>

      {/* 4. CINEMATIC LETTERBOX & VIGNETTE */}
      <AbsoluteFill
        style={{
          pointerEvents: "none",
          background: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.75) 100%)",
          zIndex: 18,
        }}
      />
    </AbsoluteFill>
  );
};
