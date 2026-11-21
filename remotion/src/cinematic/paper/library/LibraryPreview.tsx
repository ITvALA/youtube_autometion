import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { BackgroundType, PropType, CharacterPose, CharacterBuild, CharacterType, CharacterEmotion } from "./types";
import { PaperBackground } from "./backgrounds/PaperBackgrounds";
import { PropComponent } from "./props/PaperProps";
import { PaperPuppet } from "./character/PaperPuppet";
import { PaperFiltersDefs, stopMotionTwos } from "./filters";

export const LibraryPreview: React.FC = () => {
  const frame = useCurrentFrame();
  const f = stopMotionTwos(frame, true);

  // Background types list (10)
  const backgrounds: BackgroundType[] = [
    "village",
    "forest",
    "river_ghat",
    "mountains_temple",
    "palace_courtyard",
    "desert",
    "ocean_boat",
    "night_sky",
    "cave",
    "battlefield",
  ];

  // Props list (16)
  const propsList: PropType[] = [
    "hut",
    "tree_banyan",
    "tree_pine",
    "tree_palm",
    "cow",
    "boat",
    "well",
    "diya",
    "fire",
    "banner",
    "cloud",
    "bird",
    "bell",
    "chariot",
    "bow",
    "mace",
    "crown",
    "pot",
  ];

  // Character poses (9)
  const poses: CharacterPose[] = [
    "idle_breath",
    "blink",
    "walk",
    "run",
    "sit",
    "bow",
    "point",
    "raise_hands",
    "talk",
  ];

  // Section timing: Cycle every 60 frames (2 seconds)
  // 0-60: Backgrounds Gallery Grid
  // 60-120: Props Gallery Grid
  // 120-180: Characters & Poses Gallery
  // 180-240: Hero Scene Demo
  const activeSection = Math.floor(frame / 60) % 4;

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
        backgroundColor: "#161311",
        color: "#fbf5e6",
        fontFamily: "sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <PaperFiltersDefs />

      {/* Top Header */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 40,
          right: 40,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #c89b3c",
          paddingBottom: 15,
          zIndex: 100,
        }}
      >
        <div style={{ fontSize: 32, fontWeight: "bold", letterSpacing: 2 }}>
          MINDSPARK PAPER SCENE LIBRARY
        </div>
        <div style={{ fontSize: 22, color: "#d4af37", textTransform: "uppercase" }}>
          {activeSection === 0
            ? "1. Backgrounds (10 Types)"
            : activeSection === 1
            ? "2. Reusable Props (16 Types)"
            : activeSection === 2
            ? "3. Jointed Character Puppet (Poses & Builds)"
            : "4. Live Composed Paper Scene"}
        </div>
      </div>

      {/* Section 0: Backgrounds Grid */}
      {activeSection === 0 && (
        <div
          style={{
            position: "absolute",
            top: 130,
            left: 40,
            right: 40,
            bottom: 40,
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gridGap: 24,
          }}
        >
          {backgrounds.slice(0, 6).map((bg, i) => (
            <div
              key={bg}
              style={{
                position: "relative",
                borderRadius: 12,
                overflow: "hidden",
                border: "3px solid #fbf5e6",
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
            >
              <PaperBackground
                type={bg}
                variant={0}
                timeOfDay={i % 2 === 0 ? "day" : "dusk"}
                frame={f}
                width={480}
                height={520}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 12,
                  left: 12,
                  backgroundColor: "rgba(0,0,0,0.75)",
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "#fbf5e6",
                }}
              >
                {bg}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section 1: Props Grid */}
      {activeSection === 1 && (
        <div
          style={{
            position: "absolute",
            top: 130,
            left: 40,
            right: 40,
            bottom: 40,
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gridGap: 20,
          }}
        >
          {propsList.map((pType) => (
            <div
              key={pType}
              style={{
                position: "relative",
                height: 250,
                borderRadius: 10,
                backgroundColor: "#2a221b",
                border: "2px solid #5a4533",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 200 200" style={{ width: 150, height: 150 }}>
                <PropComponent
                  type={pType}
                  x={100}
                  y={130}
                  scale={0.7}
                  frame={f}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  fontSize: 16,
                  color: "#d4af37",
                  fontWeight: 600,
                }}
              >
                {pType}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section 2: Character Poses & Builds */}
      {activeSection === 2 && (
        <div
          style={{
            position: "absolute",
            top: 130,
            left: 40,
            right: 40,
            bottom: 40,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gridGap: 24,
          }}
        >
          {poses.map((poseName, i) => (
            <div
              key={poseName}
              style={{
                position: "relative",
                height: 340,
                borderRadius: 12,
                backgroundColor: "#231c18",
                border: "2px solid #7c5c3e",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg viewBox="0 0 240 300" style={{ width: 200, height: 260 }}>
                <PaperPuppet
                  frame={f}
                  type={i % 2 === 0 ? "warrior" : "king"}
                  pose={poseName}
                  build={i === 3 ? "muscular" : i === 4 ? "slender" : i === 5 ? "elder" : "normal"}
                  emotion={i % 4 === 0 ? "calm" : i % 4 === 1 ? "fierce" : i % 4 === 2 ? "joy" : "sorrow"}
                  x={120}
                  y={230}
                  scale={0.8}
                  audioLevel={poseName === "talk" ? 0.6 : 0}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#fbf5e6",
                }}
              >
                {poseName}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Section 3: Live Composed Scene */}
      {activeSection === 3 && (
        <div
          style={{
            position: "absolute",
            top: 130,
            left: 40,
            right: 40,
            bottom: 40,
            borderRadius: 16,
            overflow: "hidden",
            border: "4px solid #fbf5e6",
          }}
        >
          <PaperBackground
            type="mountains_temple"
            variant={0}
            timeOfDay="dusk"
            frame={f}
            width={1000}
            height={1650}
          />
          <svg viewBox="0 0 1080 1920" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}>
            <PropComponent type="banner" x={240} y={1180} scale={1.2} frame={f} />
            <PropComponent type="diya" x={500} y={1220} scale={1.0} frame={f} />
            <PropComponent type="fire" x={750} y={1220} scale={1.1} frame={f} />
            <PaperPuppet
              frame={f}
              type="warrior"
              pose="point"
              build="muscular"
              emotion="fierce"
              x={350}
              y={1240}
              scale={1.2}
            />
            <PaperPuppet
              frame={f}
              type="king"
              pose="talk"
              build="normal"
              emotion="joy"
              x={650}
              y={1240}
              scale={1.2}
              flip={true}
              audioLevel={0.7}
            />
          </svg>
        </div>
      )}
    </div>
  );
};
