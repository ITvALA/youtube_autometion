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

  // CAMERA MOTION PRESETS
  let camScale = 1.0;
  let camX = 0;
  let camY = 0;
  let camRotate = 0;

  if (move === "push-in") {
    camScale = interpolate(progress, [0, 1], [1.0, 1.08 * speed]);
    camY = interpolate(progress, [0, 1], [0, -40 * speed]);
  } else if (move === "pull-out") {
    camScale = interpolate(progress, [0, 1], [1.12 * speed, 1.0]);
    camY = interpolate(progress, [0, 1], [-40 * speed, 0]);
  } else if (move === "pan") {
    camScale = 1.06;
    camX = interpolate(progress, [0, 1], [40 * speed, -40 * speed]);
  } else if (move === "orbit") {
    camScale = 1.05;
    camX = Math.sin(progress * Math.PI) * 30 * speed;
    camY = Math.cos(progress * Math.PI) * 15 * speed;
    camRotate = interpolate(progress, [0, 1], [-1.2 * speed, 1.2 * speed]);
  } else if (move === "crane") {
    camScale = 1.04;
    camY = interpolate(progress, [0, 1], [60 * speed, -60 * speed]);
  }

  // TRANSITIONS (First 12 frames and last 12 frames)
  const transition: TransitionType = spec.transition || "slide";
  let transX = 0;
  let transY = 0;
  let transScale = 1.0;
  let transRotate = 0;
  let transOpacity = 1.0;

  const introFrames = 12;
  const outroFrames = 10;

  if (frame < introFrames) {
    const introProgress = frame / introFrames;
    if (transition === "slide") {
      transX = interpolate(introProgress, [0, 1], [-width, 0]);
    } else if (transition === "tear" || transition === "page-turn") {
      transRotate = interpolate(introProgress, [0, 1], [-15, 0]);
      transX = interpolate(introProgress, [0, 1], [-200, 0]);
      transOpacity = introProgress;
    } else if (transition === "fold") {
      transScale = interpolate(introProgress, [0, 1], [0.8, 1.0]);
      transOpacity = introProgress;
    }
  } else if (frame > durationInFrames - outroFrames) {
    const outroProgress = (frame - (durationInFrames - outroFrames)) / outroFrames;
    if (transition === "slide") {
      transX = interpolate(outroProgress, [0, 1], [0, width]);
    } else if (transition === "tear" || transition === "page-turn") {
      transRotate = interpolate(outroProgress, [0, 1], [0, 15]);
      transX = interpolate(outroProgress, [0, 1], [0, 200]);
      transOpacity = 1 - outroProgress;
    } else if (transition === "fold") {
      transScale = interpolate(outroProgress, [0, 1], [1.0, 0.8]);
      transOpacity = 1 - outroProgress;
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
      }}
    >
      <PaperFiltersDefs />

      {/* Main Camera Transform Layer */}
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          transform: `translate(${transX + camX}px, ${transY + camY}px) scale(${camScale * transScale}) rotate(${camRotate + transRotate}deg)`,
          transformOrigin: "540px 960px",
          opacity: transOpacity,
        }}
      >
        {/* Layer 1: Animated Background */}
        <PaperBackground
          type={spec.bg}
          variant={spec.variant}
          timeOfDay={spec.timeOfDay}
          frame={f}
          seed={spec.seed}
          width={width}
          height={height}
        />

        {/* Layer 2: Props Stage */}
        {spec.props && spec.props.length > 0 && (
          <svg
            viewBox={`0 0 ${width} ${height}`}
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
        )}

        {/* Layer 3: Characters Stage */}
        {spec.characters && spec.characters.length > 0 && (
          <svg
            viewBox={`0 0 ${width} ${height}`}
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
                scale={char.scale || 1.1}
                flip={char.flip || false}
                skin={char.skin}
                clothes={char.clothes}
                headgear={char.headgear}
                audioLevel={char.audioLevel || 0}
                frame={f}
              />
            ))}
          </svg>
        )}

        {/* Layer 4: Vignette / Ambient Lighting Tone */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            boxShadow: "inset 0 0 120px rgba(0, 0, 0, 0.45)",
            pointerEvents: "none",
            mixBlendMode: "multiply",
          }}
        />
      </div>
    </div>
  );
};
