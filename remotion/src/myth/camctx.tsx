/**
 * Shared camera context + parallax Layer + seeded rng.
 * (Split out of mindspark-myth-engine.tsx so that cinema.tsx and the engine can both use it
 *  without importing each other.)
 */
import React, { createContext, useContext } from 'react';

export type Cam = { x: number; y: number; z: number; rx: number; ry: number; rz: number };
export const CamCtx = createContext<Cam>({ x: 0, y: 0, z: 1, rx: 0, ry: 0, rz: 0 });

export const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};

/** One plane of the multiplane world. depth 0 = far sky ... 1 = character plane ... >1 = foreground */
export const Layer: React.FC<{ depth: number; children: React.ReactNode }> = ({ depth, children }) => {
  const cam = useContext(CamCtx);
  const zOffset = (depth - 0.75) * 450;
  const xOffset = -cam.x * (1 - depth) * 0.7;
  const yOffset = -cam.y * (1 - depth) * 0.4;
  const rotY = cam.ry * (depth - 0.75) * 0.35;
  return (
    <div
      style={{
        position: 'absolute',
        left: -660,
        top: -480,
        width: 2400,
        height: 2880,
        transformStyle: 'preserve-3d',
        transform: `translate3d(${xOffset}px, ${yOffset}px, ${zOffset}px) rotateY(${rotY}deg)`,
      }}
    >
      {children}
    </div>
  );
};
