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
      maxWidth: 90 * u,
      background: "#080C10",
      border: `2px solid ${c.ac}`,
      borderRadius: 3 * u,
      padding: 4.5 * u,
      boxShadow: `0 0 30px ${c.ac}33`,
      fontFamily: "monospace",
      color: c.ac,
      boxSizing: "border-box",
      textAlign: "left"
    }}>
      {/* Terminal window buttons */}
      <div style={{display: "flex", gap: 1.5 * u, marginBottom: 3.5 * u, opacity: 0.6}}>
        <div style={{width: 2.2 * u, height: 2.2 * u, borderRadius: 99, background: "#FF5F56"}} />
        <div style={{width: 2.2 * u, height: 2.2 * u, borderRadius: 99, background: "#FFBD2E"}} />
        <div style={{width: 2.2 * u, height: 2.2 * u, borderRadius: 99, background: "#27C93F"}} />
        <span style={{fontSize: 2.8 * u, marginLeft: 2 * u, color: "#888"}}>sh: bash-v5.2</span>
      </div>

      {/* Terminal Prompt */}
      <div style={{fontSize: 4.2 * u, color: "#FFF", marginBottom: 2.5 * u}}>
        <span style={{color: c.ac}}>root@mindspark:~# </span>
        <span>{command}</span>
      </div>

      {/* Output lines */}
      <div style={{
        fontSize: 3.9 * u,
        lineHeight: 1.6,
        whiteSpace: "pre-wrap",
        minHeight: 20 * u
      }}>
        {currentOutput}
        {cursorBlink && <span style={{background: c.ac, color: "#000"}}>_</span>}
      </div>
    </div>
  );
};
