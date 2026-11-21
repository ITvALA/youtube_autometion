import React from "react";
import { useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";
import { PaperSceneSpec, CameraPreset, TransitionType } from "./types";
import { PaperFiltersDefs, stopMotionTwos } from "./filters";
import { PaperBackground } from "./backgrounds/PaperBackgrounds";
import { PropComponent } from "./props/PaperProps";
import { PaperPuppet } from "./character/PaperPuppet";
import { getPalette } from "./palettes";

interface PaperSceneProps {
  spec: PaperSceneSpec;
  durationInFrames?: number;
}

export const PaperScene: React.FC<PaperSceneProps> = ({ spec, durationInFrames = 90 }) => {
  const frame = useCurrentFrame();
  const { fps, width = 1080, height = 1920 } = useVideoConfig();
  const f = stopMotionTwos(frame, true);
  const palette = getPalette(spec.timeOfDay);

  const move: CameraPreset = spec.camera?.move || "push-in";
  const speed = spec.camera?.speed || 1.0;
  const progress = Math.min(1, Math.max(0, frame / Math.max(1, durationInFrames)));

  // POP-UP STAGGER SPRINGS (Authentic 3D Pop-Up Storybook Physics)
  const bgPop = Math.min(1, Math.max(0, spring({ frame: f, fps, config: { damping: 14, stiffness: 90 } })));
  const structPop = Math.min(1, Math.max(0, spring({ frame: Math.max(0, f - 4), fps, config: { damping: 13, stiffness: 100 } })));
  const charPop = Math.min(1, Math.max(0, spring({ frame: Math.max(0, f - 8), fps, config: { damping: 12, stiffness: 110 } })));
  const fgPop = Math.min(1, Math.max(0, spring({ frame: Math.max(0, f - 11), fps, config: { damping: 14, stiffness: 120 } })));

  // 3D CAMERA PRESETS (Physical Dolly, Tilt & Orbit Parallax)
  let camDollyZ = 0;
  let camPanX = 0;
  let camCraneY = 0;
  let camTiltX = 0;
  let camTiltY = 0;
  let camRollZ = 0;

  if (move === "push-in") {
    camDollyZ = interpolate(progress, [0, 1], [-140 * speed, 180 * speed]);
    camCraneY = interpolate(progress, [0, 1], [30 * speed, -40 * speed]);
    camTiltX = interpolate(progress, [0, 1], [-2.5 * speed, 3.2 * speed]);
    camTiltY = interpolate(progress, [0, 1], [-2.0 * speed, 1.8 * speed]);
  } else if (move === "pull-out") {
    camDollyZ = interpolate(progress, [0, 1], [180 * speed, -100 * speed]);
    camCraneY = interpolate(progress, [0, 1], [-40 * speed, 20 * speed]);
    camTiltX = interpolate(progress, [0, 1], [3.0 * speed, -2.0 * speed]);
    camTiltY = interpolate(progress, [0, 1], [2.0 * speed, -1.5 * speed]);
  } else if (move === "pan") {
    camPanX = interpolate(progress, [0, 1], [90 * speed, -90 * speed]);
    camTiltY = interpolate(progress, [0, 1], [-5.0 * speed, 5.0 * speed]);
    camDollyZ = 40 * speed;
  } else if (move === "orbit") {
    const angle = progress * Math.PI * 0.9;
    camPanX = Math.sin(angle) * 75 * speed;
    camDollyZ = Math.cos(angle) * 80 * speed;
    camTiltY = Math.sin(angle) * 6.5 * speed;
    camTiltX = Math.cos(angle) * 3.5 * speed;
    camRollZ = interpolate(progress, [0, 1], [-1.2 * speed, 1.2 * speed]);
  } else if (move === "crane") {
    camCraneY = interpolate(progress, [0, 1], [120 * speed, -100 * speed]);
    camTiltX = interpolate(progress, [0, 1], [-6.5 * speed, 5.0 * speed]);
    camDollyZ = interpolate(progress, [0, 1], [-60 * speed, 80 * speed]);
  }

  // TRANSITIONS
  const transition: TransitionType = spec.transition || "slide";
  let transX = 0;
  let transScale = 1.0;
  let transRotate = 0;
  let transOpacity = 1.0;

  const introFrames = 10;
  const outroFrames = 10;

  if (frame < introFrames) {
    const ip = frame / introFrames;
    if (transition === "slide") {
      transX = interpolate(ip, [0, 1], [-width, 0]);
    } else if (transition === "tear" || transition === "page-turn") {
      transRotate = interpolate(ip, [0, 1], [-12, 0]);
      transX = interpolate(ip, [0, 1], [-150, 0]);
      transOpacity = ip;
    } else if (transition === "fold") {
      transScale = interpolate(ip, [0, 1], [0.85, 1.0]);
      transOpacity = ip;
    }
  } else if (frame > durationInFrames - outroFrames) {
    const op = (frame - (durationInFrames - outroFrames)) / outroFrames;
    if (transition === "slide") {
      transX = interpolate(op, [0, 1], [0, width]);
    } else if (transition === "tear" || transition === "page-turn") {
      transRotate = interpolate(op, [0, 1], [0, 12]);
      transX = interpolate(op, [0, 1], [0, 150]);
      transOpacity = 1 - op;
    } else if (transition === "fold") {
      transScale = interpolate(op, [0, 1], [1.0, 0.85]);
      transOpacity = 1 - op;
    }
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#161311",
        perspective: 1300, // True 3D perspective viewport
      }}
    >
      <PaperFiltersDefs />

      {/* 3D GIMBAL CAMERA RIG */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          transformStyle: "preserve-3d",
          transform: `translate3d(${transX + camPanX}px, ${camCraneY}px, ${camDollyZ}px) rotateX(${camTiltX}deg) rotateY(${camTiltY}deg) rotateZ(${camRollZ + transRotate}deg) scale(${transScale})`,
          transformOrigin: "540px 1050px",
          opacity: transOpacity,
        }}
      >
        {/* ========================================================= */}
        {/* 3D LAYER 1: DEEP BACKGROUND (Sky & Celestial Body) at Z = -220px */}
        {/* ========================================================= */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: `translateZ(-220px) scale(1.18)`,
            transformOrigin: "540px 960px",
          }}
        >
          <PaperBackground
            type={spec.bg}
            variant={spec.variant}
            timeOfDay={spec.timeOfDay}
            frame={f}
            seed={spec.seed}
          />
        </div>

        {/* ========================================================= */}
        {/* 3D LAYER 2: MIDGROUND PROPS & STRUCTURES at Z = 0px */}
        {/* ========================================================= */}
        {spec.props && spec.props.length > 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
              transform: `translateZ(0px) scale(1.0)`,
              transformOrigin: "540px 1200px",
            }}
          >
            <svg
              viewBox="0 0 1080 1920"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              {spec.props.map((prop, idx) => (
                <PropComponent
                  key={prop.id || `prop-${idx}`}
                  type={prop.type}
                  x={prop.x}
                  y={prop.y}
                  scale={prop.scale || 1}
                  flip={prop.flip || false}
                  seed={(spec.seed || 1) + idx * 7}
                  frame={f}
                />
              ))}
            </svg>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3D LAYER 3: 3D CHARACTER PUPPETS at Z = +140px with Pop-Up Tilt */}
        {/* ========================================================= */}
        {spec.characters && spec.characters.length > 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              transformStyle: "preserve-3d",
              // Pop-up fold angle from floor (starts lying down, folds up standing!)
              transform: `translateZ(140px) scale(0.9) rotateX(${interpolate(charPop, [0, 1], [65, 0])}deg) translateY(${interpolate(charPop, [0, 1], [150, 0])}px)`,
              transformOrigin: "540px 1500px",
            }}
          >
            <svg
              viewBox="0 0 1080 1920"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            >
              {spec.characters.map((char, idx) => (
                <PaperPuppet
                  key={char.id || `char-${idx}`}
                  type={char.type || "warrior"}
                  pose={char.pose || "idle_breath"}
                  build={char.build || "normal"}
                  emotion={char.emotion || "calm"}
                  x={char.x}
                  y={char.y || 1350}
                  scale={char.scale || 1.15}
                  flip={char.flip || false}
                  skin={char.skin}
                  clothes={char.clothes}
                  headgear={char.headgear}
                  audioLevel={char.audioLevel || 0}
                  frame={f}
                />
              ))}
            </svg>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3D LAYER 4: FOREGROUND FRAMING & TACTILE VIGNETTE at Z = +260px */}
        {/* ========================================================= */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
            transform: `translateZ(260px) scale(0.82)`,
            transformOrigin: "540px 960px",
            pointerEvents: "none",
          }}
        >
          {/* Foreground framing silhouette spikes/rocks */}
          <svg
            viewBox="0 0 1080 1920"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
          >
            <g transform="translate(0, 1680)">
              {/* Foreground Shadow */}
              <g transform="translate(6, 12)" fill="rgba(15, 10, 6, 0.5)">
                <polygon points="-40,240 140,80 320,240" />
                <polygon points="760,240 940,80 1140,240" />
              </g>
              {/* Left Foreground Paper Peak */}
              <polygon
                points="-40,240 140,80 320,240"
                fill="#2c1a12"
                stroke="#fbf5e6"
                strokeWidth={5}
                strokeLinejoin="round"
              />
              {/* Right Foreground Paper Peak */}
              <polygon
                points="760,240 940,80 1140,240"
                fill="#2c1a12"
                stroke="#fbf5e6"
                strokeWidth={5}
                strokeLinejoin="round"
              />
            </g>
          </svg>

          {/* Deep Cinematic Corner Vignette */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              boxShadow: "inset 0 0 160px rgba(10, 6, 4, 0.65)",
              mixBlendMode: "multiply",
            }}
          />
        </div>
      </div>
    </div>
  );
};
