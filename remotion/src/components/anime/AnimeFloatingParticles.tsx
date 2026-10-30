import React from "react";
import {useCurrentFrame, useVideoConfig, AbsoluteFill} from "remotion";

export interface AnimeParticlesProps {
  color?: string;
  count?: number;
  speed?: number;
}

export const AnimeFloatingParticles: React.FC<AnimeParticlesProps> = ({
  color = "#00F5A0",
  count = 24,
  speed = 1.2,
}) => {
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();

  const particles = Array.from({length: count}, (_, i) => {
    // Deterministic position based on index
    const seedX = (i * 37 + 13) % 100;
    const seedY = (i * 53 + 71) % 100;
    const size = 3 + ((i * 11) % 6);
    const zDepth = 0.5 + ((i * 7) % 10) * 0.1; // 0.5 to 1.4

    // Upward flow + gentle wave drift
    const yOffset = ((seedY - (frame * speed * zDepth * 0.4)) % 120 + 120) % 120 - 10;
    const xOffset = seedX + Math.sin(frame * 0.04 + i) * 3;
    const opacity = 0.2 + (Math.sin(frame * 0.08 + i * 2) + 1) * 0.25;

    return {
      x: xOffset,
      y: yOffset,
      size,
      opacity,
      key: i,
    };
  });

  return (
    <AbsoluteFill style={{pointerEvents: "none", overflow: "hidden"}}>
      {particles.map((p) => (
        <div
          key={p.key}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: "50%",
            backgroundColor: color,
            opacity: p.opacity,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

