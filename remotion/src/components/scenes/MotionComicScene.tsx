import React from "react";
import {useCurrentFrame, useVideoConfig, interpolate, AbsoluteFill} from "remotion";
import {MangaPanels} from "../anime/MangaPanels";
import {AnimeCharacter, AnimeEmotion} from "../anime/AnimeCharacter";
import {AnimeFloatingParticles} from "../anime/AnimeFloatingParticles";

export interface MotionComicSceneProps {
  s: any;
  plan: any;
  u: number;
}

export const MotionComicScene: React.FC<MotionComicSceneProps> = ({s, plan, u}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const c = plan.theme.colors;
  const d = s.data || {};

  // Cinematic comic pan
  const camShiftY = interpolate(frame, [0, durationInFrames], [15, -15], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: `0 ${3 * u}px`,
        transform: `translateY(${camShiftY}px)`,
      }}
    >
      <AnimeFloatingParticles color={c.ac} count={16} speed={0.8} />

      {/* Main Manga Comic Panels */}
      <div style={{zIndex: 10, width: "100%", maxWidth: 90 * u}}>
        <MangaPanels
          panel1Title={d.panel1Title || "OLD COMFORT ZONE"}
          panel1Subtitle={d.panel1Subtitle || "Same routine, zero compounding"}
          panel2Title={d.panel2Title || "1% SHIFT EVERY DAY"}
          panel2Subtitle={d.panel2Subtitle || "37X Exponential growth unlocked"}
          badgeText={d.badgeText || "MANGA PROTOCOL"}
          accentColor={c.ac}
          u={u}
        />
      </div>

      {/* Side Anime Character cutout overlay */}
      <div
        style={{
          position: "absolute",
          right: -4 * u,
          bottom: 2 * u,
          zIndex: 15,
          opacity: 0.95,
          transform: "scale(0.85)",
        }}
      >
        <AnimeCharacter
          emotion={(d.emotion as AnimeEmotion) || "triumph"}
          accentColor={c.ac}
          u={u}
          scale={0.85}
        />
      </div>
    </AbsoluteFill>
  );
};
