import React from "react";
import { TimeOfDayPalette } from "./types";
import { getPalette } from "./palettes";

export const stopMotionTwos = (frame: number, enabled: boolean = true): number => {
  if (!enabled) return frame;
  return Math.floor(frame / 2) * 2;
};

export const PaperFiltersDefs: React.FC<{ palette?: TimeOfDayPalette; seed?: number }> = ({
  palette = getPalette("day"),
  seed = 42,
}) => {
  return (
    <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }}>
      <defs>
        {/* 1. Tactile 3D Paper Bevel & Relief Lighting */}
        <filter id="paper-bevel" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
          <feSpecularLighting
            in="blur"
            surfaceScale="2"
            specularConstant="0.6"
            specularExponent="14"
            lightingColor="#ffffff"
            result="specOut"
          >
            <feDistantLight azimuth="225" elevation="45" />
          </feSpecularLighting>
          <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specIn" />
          <feComposite in="SourceGraphic" in2="specIn" operator="arithmetic" k1="0" k2="1" k3="0.45" k4="0" />
        </filter>

        {/* 2. Directional Paper Drop Shadow (Matches Time of Day) */}
        <filter id="paper-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx={palette.shadowOffsetX}
            dy={palette.shadowOffsetY}
            stdDeviation="6"
            floodColor={palette.shadowColor}
            floodOpacity={palette.shadowOpacity}
          />
        </filter>

        {/* 3. Subtle Paper Grain & Tactile Fiber */}
        <filter id="paper-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.04"
            numOctaves="3"
            seed={seed}
            result="noise"
          />
          <feColorMatrix
            type="matrix"
            values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0.15 0"
          />
        </filter>
      </defs>
    </svg>
  );
};
