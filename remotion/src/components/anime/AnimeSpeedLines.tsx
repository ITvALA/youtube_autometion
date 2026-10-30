import React from "react";
import {useCurrentFrame, AbsoluteFill} from "remotion";

export interface AnimeSpeedLinesProps {
  color?: string;
  count?: number;
  opacity?: number;
  center?: [number, number]; // Percentage [x, y]
}

export const AnimeSpeedLines: React.FC<AnimeSpeedLinesProps> = ({
  color = "#FFFFFF",
  count = 36,
  opacity = 0.25,
  center = [50, 50],
}) => {
  const frame = useCurrentFrame();
  const step = 360 / count;

  // Jitter seed changes every 2 frames for that authentic hand-drawn anime look
  const jitterSeed = Math.floor(frame / 2);

  const lines = Array.from({length: count}, (_, i) => {
    const angle = i * step + ((jitterSeed * 17 + i * 31) % 4) - 2;
    const rad = (angle * Math.PI) / 180;
    const innerRadius = 28 + ((jitterSeed * 7 + i * 13) % 12);
    const outerRadius = 140;

    const x1 = center[0] + Math.cos(rad) * innerRadius;
    const y1 = center[1] + Math.sin(rad) * innerRadius;
    const x2 = center[0] + Math.cos(rad) * outerRadius;
    const y2 = center[1] + Math.sin(rad) * outerRadius;
    const strokeWidth = 0.35 + ((i + jitterSeed) % 3) * 0.3;

    return {x1, y1, x2, y2, strokeWidth, key: i};
  });

  return (
    <AbsoluteFill style={{pointerEvents: "none", overflow: "hidden", opacity}}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{width: "100%", height: "100%"}}
      >
        {lines.map((line) => (
          <line
            key={line.key}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke={color}
            strokeWidth={line.strokeWidth}
            strokeLinecap="round"
          />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
