import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";

export type Emotion = "neutral" | "happy" | "sad" | "angry" | "scared";

export type CharacterProps = {
  x?: number; // feet position (px)
  y?: number;
  scale?: number;
  flip?: boolean; // face left
  skin?: string;
  hair?: string;
  shirt?: string;
  pants?: string;
  emotion?: Emotion;
  talking?: boolean; // true = mouth moves
  mouthLevel?: number; // optional 0..1 (audio loudness) for real lip-sync
  enterFrame?: number; // frame at which the character pops in
  seed?: number; // different blink/idle timing per character
};

const BROW_ANGLE: Record<Emotion, number> = {
  neutral: 0,
  happy: 0,
  sad: -14,
  angry: 16,
  scared: -8,
};
const BROW_LIFT: Record<Emotion, number> = {
  neutral: 0,
  happy: -4,
  sad: 2,
  angry: 4,
  scared: -9,
};

const Mouth: React.FC<{emotion: Emotion; talking: boolean; open: number}> = ({
  emotion,
  talking,
  open,
}) => {
  if (talking) {
    const ry = 2 + open * 11;
    const rx = 8 + open * 4;
    return (
      <g>
        <ellipse cx={0} cy={26} rx={rx} ry={ry} fill="#3b1219" />
        <ellipse cx={0} cy={26 + ry * 0.5} rx={rx * 0.6} ry={ry * 0.4} fill="#d4606e" />
      </g>
    );
  }
  switch (emotion) {
    case "happy":
      return <path d="M -15 20 Q 0 38 15 20" stroke="#3b1219" strokeWidth={4} fill="none" strokeLinecap="round" />;
    case "sad":
      return <path d="M -12 32 Q 0 20 12 32" stroke="#3b1219" strokeWidth={4} fill="none" strokeLinecap="round" />;
    case "angry":
      return <path d="M -12 28 L 12 28" stroke="#3b1219" strokeWidth={5} fill="none" strokeLinecap="round" />;
    case "scared":
      return <ellipse cx={0} cy={28} rx={7} ry={9} fill="#3b1219" />;
    default:
      return <path d="M -10 27 L 10 27" stroke="#3b1219" strokeWidth={4} fill="none" strokeLinecap="round" />;
  }
};

export const Character: React.FC<CharacterProps> = ({
  x = 960,
  y = 900,
  scale = 1,
  flip = false,
  skin = "#f1c27d",
  hair = "#2b1b12",
  shirt = "#e4572e",
  pants = "#264653",
  emotion = "neutral",
  talking = false,
  mouthLevel,
  enterFrame = 0,
  seed = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f = frame + seed * 17;

  // pop-in
  const pop = spring({frame: frame - enterFrame, fps, config: {damping: 12, stiffness: 120}});
  const s = scale * pop;

  // idle: breathing + head tilt
  const breath = Math.sin(f / 14) * 2.5;
  const tilt = Math.sin(f / 38) * 2.5 + (emotion === "sad" ? 5 : 0);

  // blink every ~3s, lasts 6 frames
  const period = Math.round(fps * 3);
  const t = f % period;
  const blink = t < 6 ? 1 - Math.abs(t - 3) / 3 : 0;
  const eyeScaleY = 1 - blink * 0.92;

  // lip sync (audio-driven if mouthLevel given, else fake talking)
  const fake = (0.5 + 0.5 * Math.sin(f * 0.95)) * (0.65 + 0.35 * Math.sin(f * 0.37));
  const open = talking ? Math.min(1, Math.max(0, mouthLevel ?? fake)) : 0;

  // arms: relaxed swing, gesture while talking
  const armL = 8 + Math.sin(f / 22) * 3;
  const armR = talking ? 28 + Math.sin(f * 0.22) * 22 : -8 - Math.sin(f / 22) * 3;

  // pupils look around slightly
  const px = Math.sin(f / 55) * 2.5;
  const py = Math.cos(f / 70) * 1.5;

  const browAngle = BROW_ANGLE[emotion];
  const browLift = BROW_LIFT[emotion];
  const scaredShake = emotion === "scared" ? Math.sin(f * 1.8) * 1.2 : 0;

  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {/* shadow */}
      <ellipse cx={0} cy={4} rx={55} ry={10} fill="rgba(0,0,0,0.18)" />

      {/* legs */}
      <rect x={-28} y={-92} width={20} height={92} rx={9} fill={pants} />
      <rect x={8} y={-92} width={20} height={92} rx={9} fill={pants} />
      <ellipse cx={-18} cy={0} rx={16} ry={7} fill="#1d1d1d" />
      <ellipse cx={18} cy={0} rx={16} ry={7} fill="#1d1d1d" />

      <g transform={`translate(${scaredShake} ${breath})`}>
        {/* back arm */}
        <g transform={`translate(-35 -172) rotate(${armL})`}>
          <line x1={0} y1={0} x2={0} y2={78} stroke={shirt} strokeWidth={20} strokeLinecap="round" />
          <circle cx={0} cy={84} r={11} fill={skin} />
        </g>

        {/* torso */}
        <rect x={-38} y={-192} width={76} height={108} rx={22} fill={shirt} />

        {/* front arm */}
        <g transform={`translate(35 -172) rotate(${armR})`}>
          <line x1={0} y1={0} x2={0} y2={78} stroke={shirt} strokeWidth={20} strokeLinecap="round" />
          <circle cx={0} cy={84} r={11} fill={skin} />
        </g>

        {/* neck */}
        <rect x={-10} y={-212} width={20} height={26} fill={skin} />

        {/* head */}
        <g transform={`translate(0 -258) rotate(${tilt})`}>
          <circle cx={-56} cy={4} r={11} fill={skin} />
          <circle cx={56} cy={4} r={11} fill={skin} />
          <circle cx={0} cy={0} r={57} fill={skin} />
          {/* hair */}
          <path
            d="M -58 -6 A 58 58 0 0 1 58 -6 Q 36 -34 4 -26 Q -26 -34 -58 -6 Z"
            fill={hair}
          />
          {/* cheeks */}
          {emotion === "happy" && (
            <>
              <circle cx={-34} cy={16} r={8} fill="#ff8a8a" opacity={0.45} />
              <circle cx={34} cy={16} r={8} fill="#ff8a8a" opacity={0.45} />
            </>
          )}
          {/* eyes */}
          {[-22, 22].map((ex) => (
            <g key={ex} transform={`translate(${ex} -6)`}>
              <g transform={`scale(1 ${eyeScaleY})`}>
                <ellipse cx={0} cy={0} rx={emotion === "scared" ? 13 : 11} ry={emotion === "scared" ? 15 : 13} fill="#fff" />
                <circle cx={px} cy={py} r={emotion === "scared" ? 3.5 : 5.5} fill="#1a1a1a" />
              </g>
            </g>
          ))}
          {/* brows */}
          <g transform={`translate(-22 ${-30 + browLift}) rotate(${browAngle})`}>
            <line x1={-11} y1={0} x2={11} y2={0} stroke={hair} strokeWidth={5} strokeLinecap="round" />
          </g>
          <g transform={`translate(22 ${-30 + browLift}) rotate(${-browAngle})`}>
            <line x1={-11} y1={0} x2={11} y2={0} stroke={hair} strokeWidth={5} strokeLinecap="round" />
          </g>
          {/* nose */}
          <path d="M 0 6 Q 5 16 0 18" stroke="#00000033" strokeWidth={3} fill="none" strokeLinecap="round" />
          {/* mouth */}
          <Mouth emotion={emotion} talking={talking} open={open} />
        </g>
      </g>
    </g>
  );
};

// ---------- Example scene (copy into your story scenes) ----------
export const CharacterDemo: React.FC = () => {
  const frame = useCurrentFrame();
  const emotion: Emotion =
    frame < 90 ? "neutral" : frame < 180 ? "happy" : frame < 270 ? "scared" : frame < 360 ? "angry" : "sad";

  return (
    <AbsoluteFill style={{backgroundColor: "#f3e9d2"}}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <Character x={620} y={900} scale={1.6} emotion={emotion} talking={frame % 120 < 80} shirt="#e4572e" />
        <Character
          x={1300}
          y={900}
          scale={1.6}
          flip
          seed={3}
          enterFrame={20}
          skin="#c68642"
          hair="#111"
          shirt="#2a9d8f"
          pants="#3d405b"
          emotion={emotion === "scared" ? "angry" : "neutral"}
        />
      </svg>
    </AbsoluteFill>
  );
};



export const CharacterDemoVertical: React.FC = () => {
  const frame = useCurrentFrame();
  const emotion: Emotion =
    frame < 60 ? "neutral" : frame < 120 ? "happy" : frame < 180 ? "scared" : frame < 240 ? "angry" : "sad";
  const emotionLabel: string =
    frame < 60 ? "😐 Neutral" : frame < 120 ? "😊 Happy" : frame < 180 ? "😱 Scared" : frame < 240 ? "😡 Angry" : "😢 Sad";

  return (
    <AbsoluteFill style={{backgroundColor: "#0d1117", display: "flex", flexDirection: "column", alignItems: "center"}}>
      {/* Title & Emotion badge */}
      <div style={{position: "absolute", top: 140, textAlign: "center", color: "#ffffff", fontFamily: "system-ui, sans-serif", zIndex: 10}}>
        <div style={{fontSize: 52, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", textShadow: "0 4px 12px rgba(0,0,0,0.6)"}}>
          ✨ 2D Animated Character ✨
        </div>
        <div style={{marginTop: 24, display: "inline-block", background: "linear-gradient(135deg, #e4572e, #f28e2b)", color: "#fff", padding: "14px 40px", borderRadius: 50, fontSize: 38, fontWeight: 800, boxShadow: "0 8px 24px rgba(228,87,46,0.4)"}}>
          {emotionLabel} | Talking: {frame % 80 < 50 ? "ON 🎙️" : "OFF 🤫"}
        </div>
      </div>
      
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: "absolute", top: 0, left: 0}}>
        {/* Character 1 (Left speaker) */}
        <Character x={350} y={1450} scale={2.2} emotion={emotion} talking={frame % 80 < 50} shirt="#e4572e" />
        {/* Character 2 (Right responder) */}
        <Character
          x={760}
          y={1450}
          scale={2.2}
          flip
          seed={3}
          enterFrame={10}
          skin="#c68642"
          hair="#111"
          shirt="#2a9d8f"
          pants="#3d405b"
          emotion={emotion === "scared" ? "angry" : emotion === "happy" ? "happy" : "neutral"}
          talking={frame % 80 >= 50}
        />
      </svg>
    </AbsoluteFill>
  );
};
