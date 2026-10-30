import React from "react";
import {useCurrentFrame} from "remotion";
import {Scene, Plan} from "../Video";

export const TerminalScene: React.FC<{s: Scene; plan: Plan; u: number}> = ({s, plan, u}) => {
  const f = useCurrentFrame();
  const c = plan.theme.colors;
  const d = s.data || {};

  const command = d.command || "mindspark --execute protocol";
  const lines: string[] = d.lines || d.items || [
    "STATUS: 1% optimization initiated",
    "ANALYZE: cognitive resistance reduced",
    "RESULT: compound growth 37.78x",
    "VERDICT: execution confirmed [OK]"
  ];

  // Typewriter effect
  const fullText = lines.join("\n");
  const charsToShow = Math.min(fullText.length, Math.floor(f * 2.2));
  const currentOutput = fullText.slice(0, charsToShow);
  const cursorBlink = Math.floor(f / 8) % 2 === 0;

  return (
    <div style={{
      width: "100%",
      maxWidth: 92 * u,
      background: "rgba(10, 14, 22, 0.95)",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      borderRadius: 24,
      overflow: "hidden",
      boxShadow: `0 30px 80px rgba(0,0,0,0.85), 0 0 20px ${c.ac}22`,
      fontFamily: "'JetBrains Mono', monospace",
      color: "#E2E8F0",
      boxSizing: "border-box",
      textAlign: "left"
    }}>
      {/* Terminal Title Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 1.2 * u,
        padding: `${2 * u}px ${3.5 * u}px`,
        background: "rgba(255, 255, 255, 0.04)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)"
      }}>
        <div style={{width: 1.8 * u, height: 1.8 * u, borderRadius: 99, background: "#FF5F56"}} />
        <div style={{width: 1.8 * u, height: 1.8 * u, borderRadius: 99, background: "#FFBD2E"}} />
        <div style={{width: 1.8 * u, height: 1.8 * u, borderRadius: 99, background: "#27C93F"}} />
        <span style={{fontSize: 2.4 * u, marginLeft: 2 * u, color: "rgba(255,255,255,0.45)", fontWeight: 600}}>
          terminal — bash
        </span>
      </div>

      <div style={{padding: `${4 * u}px ${4.5 * u}px`}}>
        {/* Terminal Prompt */}
        <div style={{fontSize: 3.8 * u, color: "#F8FAFC", marginBottom: 3 * u, wordBreak: "break-word"}}>
          <span style={{color: c.ac, fontWeight: 700}}>root@mindspark:~# </span>
          <span style={{color: "#38BDF8"}}>{command}</span>
        </div>

        {/* Output lines */}
        <div style={{
          fontSize: 3.6 * u,
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          minHeight: 18 * u,
          color: c.ac,
          fontWeight: 600
        }}>
          {currentOutput}
          {cursorBlink && <span style={{background: c.ac, color: "#000", padding: "0 2px"}}> </span>}
        </div>
      </div>
    </div>
  );
};
