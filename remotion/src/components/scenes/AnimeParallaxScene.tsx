import React from "react";
import {useCurrentFrame, useVideoConfig, interpolate, spring, AbsoluteFill} from "remotion";
import {AnimeCharacter, AnimeEmotion} from "../anime/AnimeCharacter";
import {AnimeSpeedLines} from "../anime/AnimeSpeedLines";
import {AnimeFloatingParticles} from "../anime/AnimeFloatingParticles";

export interface AnimeParallaxSceneProps {
  s: any;
  plan: any;
  u: number;
}

export const AnimeParallaxScene: React.FC<AnimeParallaxSceneProps> = ({s, plan, u}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();
  const c = plan.theme.colors;
  const d = s.data || {};

  const emotion: AnimeEmotion = (d.emotion as AnimeEmotion) || "focus";
  const showSpeedLines = d.speedLines !== false;

  // 1. Cinematic 2.5D Parallax Camera: slow push-in + subtle tracking pan
  const camZoom = interpolate(frame, [0, durationInFrames], [1.0, 1.15], {
    extrapolateRight: "clamp",
  });
  const bgPanX = interpolate(frame, [0, durationInFrames], [-20, 20]);
  const charPanX = interpolate(frame, [0, durationInFrames], [15, -15]); // Opposing parallax depth

  // 2. Text entrance springs
  const badgePop = spring({frame: Math.max(0, frame - 4), fps, config: {damping: 10, mass: 0.6}});
  const titleSpring = spring({frame: Math.max(0, frame - 10), fps, config: {damping: 12}});

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: `${6 * u}px ${4 * u}px`,
        transform: `scale(${camZoom})`,
      }}
    >
      {/* --- LAYER 1: 2.5D PARALLAX BACKGROUND SPEED LINES & GLOW --- */}
      {showSpeedLines && (
        <AnimeSpeedLines
          color={c.ac}
          count={32}
          opacity={0.3}
          center={[50 + bgPanX * 0.1, 50]}
        />
      )}

      {/* Atmospheric embers / particles */}
      <AnimeFloatingParticles color={c.ac} count={20} speed={1.0} />

      {/* --- LAYER 2: TOP ANIME BADGE & HEADLINE --- */}
      <div
        style={{
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5 * u,
          width: "100%",
        }}
      >
        {d.badge && (
          <div style={{transform: `scale(${badgePop})`}}>
            <span
              style={{
                background: c.ac,
                color: c.bg1,
                fontSize: 3.4 * u,
                fontWeight: 900,
                padding: `${0.6 * u}px ${2.2 * u}px`,
                borderRadius: 8,
                letterSpacing: 2,
                textTransform: "uppercase",
                boxShadow: `0 0 20px ${c.ac}`,
                display: "inline-block",
              }}
            >
              ⚡ {d.badge}
            </span>
          </div>
        )}

        {d.title && (
          <div
            style={{
              fontSize: 8.5 * u,
              fontWeight: 900,
              lineHeight: 1.1,
              textAlign: "center",
              color: "#FFF",
              textShadow: `0 4px 18px rgba(0,0,0,0.8), 0 0 30px ${c.ac}40`,
              transform: `translateY(${(1 - titleSpring) * -20}px)`,
              opacity: titleSpring,
            }}
          >
            {d.title}
          </div>
        )}

        {d.subtitle && (
          <div
            style={{
              fontSize: 4.2 * u,
              fontWeight: 700,
              color: c.ac,
              opacity: titleSpring,
            }}
          >
            {d.subtitle}
          </div>
        )}
      </div>

      {/* --- LAYER 3: 2D ANIME CHARACTER WITH PARALLAX OFFSET --- */}
      <div
        style={{
          zIndex: 5,
          transform: `translateX(${charPanX}px)`,
          transition: "transform 0.1s linear",
          marginTop: "auto",
        }}
      >
        <AnimeCharacter emotion={emotion} accentColor={c.ac} u={u} scale={1.12} />
      </div>
    </AbsoluteFill>
  );
};
