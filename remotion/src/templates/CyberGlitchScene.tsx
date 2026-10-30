import React from "react";
import {useCurrentFrame} from "remotion";
import {Scene, Plan} from "../Video";

export const CyberGlitchScene: React.FC<{s: Scene; plan: Plan; u: number}> = ({s, plan, u}) => {
  const f = useCurrentFrame();
  const c = plan.theme.colors;
  const d = s.data || {};

  const headline = d.text || d.title || "SYSTEM SHIFT: 10X LEVERAGE";
  const glitchOffset = (f % 15 < 3) ? Math.sin(f) * 6 : 0;
  const scanlineY = (f * 12) % 300;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100%",
      maxWidth: 90 * u,
      textAlign: "center",
      position: "relative"
    }}>
      {/* Glitch HUD header */}
      <div style={{
        fontFamily: "monospace",
        fontSize: 3.4 * u,
        color: c.ac,
        letterSpacing: 3,
        marginBottom: 3 * u,
        display: "flex",
        alignItems: "center",
        gap: 2 * u
      }}>
        <span>[SYS.OVERRIDE]</span>
        <span>•</span>
        <span>NODE://0x7F</span>
      </div>

      {/* Main Glitch Headline */}
      <div style={{position: "relative", display: "inline-block"}}>
        {/* Cyan Shift Layer */}
        {glitchOffset !== 0 && (
          <div style={{
            position: "absolute",
            top: 0,
            left: glitchOffset,
            right: 0,
            fontSize: 8.5 * u,
            fontWeight: "900",
            lineHeight: 1.15,
            color: "#00F0FF",
            opacity: 0.7,
            textTransform: "uppercase"
          }}>
            {headline}
          </div>
        )}
        {/* Red Shift Layer */}
        {glitchOffset !== 0 && (
          <div style={{
            position: "absolute",
            top: 0,
            left: -glitchOffset,
            right: 0,
            fontSize: 8.5 * u,
            fontWeight: "900",
            lineHeight: 1.15,
            color: "#FF2A55",
            opacity: 0.7,
            textTransform: "uppercase"
          }}>
            {headline}
          </div>
        )}
        {/* Main Layer */}
        <div style={{
          fontSize: 8.5 * u,
          fontWeight: "900",
          lineHeight: 1.15,
          color: c.tx,
          textTransform: "uppercase",
          textShadow: `0 0 20px ${c.ac}AA`
        }}>
          {headline}
        </div>
      </div>

      {/* Cyber Tag */}
      {d.tag && (
        <div style={{
          marginTop: 4 * u,
          padding: `${0.8 * u}px ${2.5 * u}px`,
          border: `1.5px solid ${c.ac}`,
          borderRadius: u,
          fontSize: 3.6 * u,
          fontFamily: "monospace",
          color: c.ac
        }}>
          DATA: {d.tag}
        </div>
      )}
    </div>
  );
};
