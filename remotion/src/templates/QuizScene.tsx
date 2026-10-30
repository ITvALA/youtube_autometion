import React from "react";
import {spring, useCurrentFrame, useVideoConfig} from "remotion";
import {Scene, Plan} from "../Video";

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const QuizScene: React.FC<{s: Scene; plan: Plan; u: number}> = ({s, plan, u}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const c = plan.theme.colors;
  const d = s.data || {};
  
  const question = d.question || d.text || d.title || "Which habit leads to 37x growth?";
  const options: string[] = d.options || [
    "A) Working 14 hours every single day",
    "B) Getting 1% better every single day",
    "C) Waiting for the perfect inspiration"
  ];
  const correctIdx = typeof d.correct === "number" ? d.correct : 1;
  const revealFrame = 45;
  const isRevealed = f >= revealFrame;

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 3.5 * u,
      width: "100%",
      maxWidth: 90 * u,
      margin: "0 auto",
      boxSizing: "border-box"
    }}>
      {/* Quiz badge */}
      <div style={{
        alignSelf: "center",
        padding: `${0.8 * u}px ${2.5 * u}px`,
        background: c.ac,
        color: c.bg1,
        borderRadius: 99,
        fontSize: 3.8 * u,
        fontWeight: "bold",
        letterSpacing: 1.5,
        textTransform: "uppercase"
      }}>
        ⚡ POP QUIZ
      </div>

      {/* Question Card */}
      <div style={{
        fontSize: 5.5 * u,
        lineHeight: 1.25,
        fontWeight: "bold",
        padding: 3.5 * u,
        background: c.cd,
        borderRadius: 4 * u,
        border: `1.5px solid rgba(255,255,255,0.25)`
      }}>
        {question}
      </div>

      {/* 3 Options */}
      <div style={{display: "flex", flexDirection: "column", gap: 2.2 * u}}>
        {options.slice(0, 3).map((opt, i) => {
          const sp = clamp(spring({frame: Math.max(0, f - 12 - i * 8), fps, config: {damping: 12}}));
          const isCorrect = i === correctIdx;
          const bgOption = isRevealed && isCorrect ? "rgba(46, 204, 113, 0.35)" : c.cd;
          const borderOption = isRevealed && isCorrect ? "2px solid #2ECC71" : "1px solid rgba(255,255,255,0.15)";
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: `${2 * u}px ${3 * u}px`,
                background: bgOption,
                border: borderOption,
                borderRadius: 3 * u,
                fontSize: 4.4 * u,
                opacity: sp,
                transform: `translateX(${(1 - sp) * (i % 2 === 0 ? -12 : 12) * u}px)`
              }}
            >
              <span>{opt}</span>
              {isRevealed && isCorrect && (
                <span style={{
                  background: "#2ECC71",
                  color: "#000",
                  borderRadius: 99,
                  width: 4.5 * u,
                  height: 4.5 * u,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 3.5 * u,
                  fontWeight: "bold"
                }}>
                  ✓
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
