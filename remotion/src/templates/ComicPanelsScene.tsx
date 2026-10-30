import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Scene, Plan} from "../Video";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const ComicPanelsScene: React.FC<{s: Scene; plan: Plan; u: number}> = ({s, plan, u}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = plan.theme.colors;
  const d = s.data || {};

  const panel1 = d.panel1Title || d.title1 || "OLD MINDSET";
  const desc1 = d.panel1Subtitle || d.sub1 || "Waiting for motivation to strike first";
  const panel2 = d.panel2Title || d.title2 || "NEW PROTOCOL";
  const desc2 = d.panel2Subtitle || d.sub2 || "Take 2-minute action to ignite energy";

  const sp1 = clamp(spring({frame: Math.max(0, f - 6), fps, config: {damping: 12}}));
  const sp2 = clamp(spring({frame: Math.max(0, f - 24), fps, config: {damping: 12}}));

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 4 * u,
      width: "100%",
      maxWidth: 90 * u
    }}>
      {/* Panel 1 */}
      <div style={{
        background: "#FFF",
        color: "#111",
        border: `3px solid #000`,
        boxShadow: `6px 6px 0px #000`,
        borderRadius: 2 * u,
        padding: 3.5 * u,
        opacity: sp1,
        transform: `translateX(${(1 - sp1) * -12 * u}px)`,
        position: "relative"
      }}>
        <div style={{
          position: "absolute",
          top: -1.8 * u,
          left: 3 * u,
          background: "#EF4444",
          color: "#FFF",
          padding: `${0.4 * u}px ${2 * u}px`,
          fontSize: 3.2 * u,
          fontWeight: "900",
          letterSpacing: 1
        }}>
          BEFORE
        </div>
        <div style={{fontSize: 5.5 * u, fontWeight: "900", marginTop: u}}>{panel1}</div>
        <div style={{fontSize: 4 * u, opacity: 0.85, marginTop: u}}>{desc1}</div>
      </div>

      {/* VS Badge */}
      <div style={{
        alignSelf: "center",
        background: c.ac,
        color: c.bg1,
        width: 7 * u,
        height: 7 * u,
        borderRadius: 99,
        border: "2px solid #000",
        boxShadow: "3px 3px 0 #000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 3.6 * u,
        fontWeight: "900"
      }}>
        VS
      </div>

      {/* Panel 2 */}
      <div style={{
        background: "#FFF",
        color: "#111",
        border: `3px solid #000`,
        boxShadow: `6px 6px 0px #000`,
        borderRadius: 2 * u,
        padding: 3.5 * u,
        opacity: sp2,
        transform: `translateX(${(1 - sp2) * 12 * u}px)`,
        position: "relative"
      }}>
        <div style={{
          position: "absolute",
          top: -1.8 * u,
          left: 3 * u,
          background: "#10B981",
          color: "#FFF",
          padding: `${0.4 * u}px ${2 * u}px`,
          fontSize: 3.2 * u,
          fontWeight: "900",
          letterSpacing: 1
        }}>
          BREAKTHROUGH
        </div>
        <div style={{fontSize: 5.5 * u, fontWeight: "900", marginTop: u}}>{panel2}</div>
        <div style={{fontSize: 4 * u, opacity: 0.85, marginTop: u}}>{desc2}</div>
      </div>
    </div>
  );
};
