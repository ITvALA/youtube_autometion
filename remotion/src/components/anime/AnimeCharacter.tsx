import React from "react";
import {useCurrentFrame, interpolate, spring, useVideoConfig} from "remotion";

export type AnimeEmotion = "focus" | "thinking" | "triumph" | "warning";

export interface AnimeCharacterProps {
  emotion?: AnimeEmotion;
  accentColor?: string;
  u: number;
  scale?: number;
}

export const AnimeCharacter: React.FC<AnimeCharacterProps> = ({
  emotion = "focus",
  accentColor = "#00F5A0",
  u,
  scale = 1.0,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // 1. 2D Idle Natural Dynamics
  const breathe = Math.sin(frame * 0.15) * 0.015;
  const hoverY = Math.sin(frame * 0.1) * (0.8 * u);

  // 2. Eye Blink calculation: blinks for 3 frames every 80 frames
  const blinkCycle = frame % 80;
  const isBlinking = blinkCycle > 74 && blinkCycle < 78;
  const eyeScaleY = isBlinking ? 0.1 : 1.0;

  // 3. Emotion-specific aura colors & highlights
  const auraColor =
    emotion === "focus"
      ? accentColor
      : emotion === "triumph"
      ? "#FFD700"
      : emotion === "warning"
      ? "#EF4444"
      : "#38BDF8";

  // Pop-in spring entrance
  const entrance = spring({
    frame,
    fps,
    config: {damping: 12, mass: 0.6},
  });

  return (
    <div
      style={{
        position: "relative",
        width: 48 * u,
        height: 58 * u,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translateY(${hoverY}px) scale(${entrance * scale})`,
        transformOrigin: "bottom center",
      }}
    >
      {/* 🌟 ENERGETIC ANIME AURA GLOW */}
      <div
        style={{
          position: "absolute",
          width: "90%",
          height: "90%",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${auraColor} 0%, rgba(0,0,0,0) 70%)`,
          opacity: 0.35 + Math.sin(frame * 0.2) * 0.15,
          filter: "blur(24px)",
          zIndex: 0,
        }}
      />

      {/* 🥋 VECTOR ANIME CHARACTER FIGURE */}
      <svg
        viewBox="0 0 200 240"
        style={{
          width: "100%",
          height: "100%",
          overflow: "visible",
          zIndex: 1,
          transform: `scaleY(${1 + breathe})`,
          transformOrigin: "bottom center",
        }}
      >
        <defs>
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="60%" stopColor="#0F172A" />
            <stop offset="100%" stopColor={auraColor} stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE0BD" />
            <stop offset="100%" stopColor="#F6C89F" />
          </linearGradient>
          <linearGradient id="jacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#18181B" />
            <stop offset="100%" stopColor="#09090B" />
          </linearGradient>
          <filter id="animeGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* --- BODY / JACKET --- */}
        <path
          d="M 50 170 C 50 145, 150 145, 150 170 L 175 240 L 25 240 Z"
          fill="url(#jacketGrad)"
          stroke="#000"
          strokeWidth="3.5"
        />

        {/* High-tech collar & tie / core element */}
        <path
          d="M 85 152 L 100 175 L 115 152 Z"
          fill={auraColor}
          filter="url(#animeGlow)"
        />
        <path
          d="M 75 145 L 100 185 L 125 145"
          fill="none"
          stroke="#27272A"
          strokeWidth="3"
        />

        {/* --- NECK & JAW --- */}
        <path
          d="M 88 128 L 88 152 L 112 152 L 112 128 Z"
          fill="#EDB88B"
          stroke="#000"
          strokeWidth="2.5"
        />

        {/* --- HEAD / FACE (Sharp Anime Chin) --- */}
        <path
          d="M 65 80 C 65 118, 85 142, 100 146 C 115 142, 135 118, 135 80 C 135 48, 65 48, 65 80 Z"
          fill="url(#skinGrad)"
          stroke="#000"
          strokeWidth="3"
        />

        {/* Subtle Anime Cheek Blush / Highlight */}
        <ellipse cx="78" cy="112" rx="6" ry="2.5" fill="#F43F5E" opacity="0.4" />
        <ellipse cx="122" cy="112" rx="6" ry="2.5" fill="#F43F5E" opacity="0.4" />

        {/* --- NOSE --- */}
        <path d="M 100 106 L 98 114 L 102 114" fill="none" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />

        {/* --- MOUTH (Reactive based on Emotion) --- */}
        {emotion === "triumph" ? (
          <path
            d="M 91 124 Q 100 134 109 124 Z"
            fill="#BE123C"
            stroke="#000"
            strokeWidth="1.5"
          />
        ) : emotion === "thinking" ? (
          <path
            d="M 93 126 Q 100 123 107 126"
            fill="none"
            stroke="#000"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M 92 125 Q 100 128 108 125"
            fill="none"
            stroke="#000"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        )}

        {/* --- INTENSE ANIME EYES --- */}
        <g style={{transform: `scaleY(${eyeScaleY})`, transformOrigin: "100px 96px"}}>
          {/* Left Eye */}
          <path d="M 72 88 Q 84 84 94 92" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
          <path d="M 74 92 Q 83 99 92 94" fill="none" stroke="#000" strokeWidth="1.8" />
          <ellipse cx="83" cy="94" rx="6.5" ry="8.5" fill="#0F172A" />
          <circle cx="83" cy="94" r="5" fill={auraColor} filter="url(#animeGlow)" />
          <circle cx="81.5" cy="91" r="2.2" fill="#FFF" />
          <circle cx="85" cy="96" r="1" fill="#FFF" />

          {/* Right Eye */}
          <path d="M 128 88 Q 116 84 106 92" fill="none" stroke="#000" strokeWidth="4" strokeLinecap="round" />
          <path d="M 126 92 Q 117 99 108 94" fill="none" stroke="#000" strokeWidth="1.8" />
          <ellipse cx="117" cy="94" rx="6.5" ry="8.5" fill="#0F172A" />
          <circle cx="117" cy="94" r="5" fill={auraColor} filter="url(#animeGlow)" />
          <circle cx="115.5" cy="91" r="2.2" fill="#FFF" />
          <circle cx="119" cy="96" r="1" fill="#FFF" />
        </g>

        {/* --- DYNAMIC ANIME EYEBROWS --- */}
        {emotion === "focus" ? (
          <>
            <path d="M 71 83 L 94 88" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            <path d="M 129 83 L 106 88" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : emotion === "thinking" ? (
          <>
            <path d="M 72 85 Q 83 80 94 87" fill="none" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
            <path d="M 128 82 Q 117 84 106 89" fill="none" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : (
          <>
            <path d="M 72 82 Q 83 79 93 86" fill="none" stroke="#0F172A" strokeWidth="2.8" strokeLinecap="round" />
            <path d="M 128 82 Q 117 79 107 86" fill="none" stroke="#0F172A" strokeWidth="2.8" strokeLinecap="round" />
          </>
        )}

        {/* --- STYLIZED SPIKY ANIME HAIR --- */}
        <path
          d="M 52 82 
             C 45 42, 70 18, 100 15 
             C 135 15, 155 42, 148 82 
             L 158 68 L 144 95 
             L 138 60 L 126 92 
             L 114 45 L 102 96 
             L 90 42 L 82 92 
             L 66 65 L 58 95 
             Z"
          fill="url(#hairGrad)"
          stroke="#000"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Anime Hair Bangs Highlight streak */}
        <path
          d="M 85 45 Q 100 28 120 42"
          fill="none"
          stroke={auraColor}
          strokeWidth="2.5"
          opacity="0.75"
          filter="url(#animeGlow)"
        />
      </svg>
    </div>
  );
};

