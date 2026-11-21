import React from "react";
import { interpolate } from "remotion";
import {
  CharacterSpec,
  CharacterBuild,
  CharacterType,
  CharacterPose,
  CharacterEmotion,
} from "../types";
import { stopMotionTwos } from "../filters";

const CREAM = "#fbf5e6";
const INK = "#1c1815";
const SHADOW = "#4a3c31";
const GOLD = "#d4af37";
const RED = "#b8321e";
const SAFFRON = "#e67322";

interface PaperPuppetProps extends CharacterSpec {
  frame: number;
}

export const PaperPuppet: React.FC<PaperPuppetProps> = ({
  frame,
  type = "warrior",
  pose = "idle_breath",
  build = "normal",
  emotion = "calm",
  x = 540,
  y = 1200,
  scale = 1,
  flip = false,
  skin = "#e0ab76",
  clothes,
  headgear,
  audioLevel = 0,
}) => {
  // Quantize frame on twos (12-15fps feel)
  const f = stopMotionTwos(frame, true);

  // Clothing color defaults based on character type
  const outfitColor =
    clothes ||
    (type === "king"
      ? "#a8201a"
      : type === "rishi"
      ? "#e67322"
      : type === "deity"
      ? "#f39c12"
      : type === "warrior"
      ? "#8c3b24"
      : type === "guard"
      ? "#4a5568"
      : "#4a7c59");

  // Build proportions
  let torsoW = 80;
  let torsoH = 120;
  let shoulderW = 100;
  let legH = 130;
  let scaleMultiplier = 1;
  let postureTilt = 0;

  if (build === "muscular") {
    torsoW = 105;
    shoulderW = 130;
    torsoH = 130;
    scaleMultiplier = 1.1;
  } else if (build === "slender") {
    torsoW = 68;
    shoulderW = 85;
    torsoH = 115;
    legH = 140;
    scaleMultiplier = 0.95;
  } else if (build === "elder") {
    torsoW = 75;
    shoulderW = 90;
    torsoH = 110;
    postureTilt = 12; // Stooped posture
    scaleMultiplier = 0.95;
  }

  // Joint Angles & Animations based on pose
  let headRot = Math.sin(f * 0.12) * 3;
  let leftArmRot = -10 + Math.sin(f * 0.1) * 4;
  let rightArmRot = 15 + Math.cos(f * 0.1) * 4;
  let leftForearmRot = 20;
  let rightForearmRot = -20;
  let leftLegRot = 0;
  let rightLegRot = 0;
  let bodyBob = Math.sin(f * 0.16) * 4;
  let chestExpansion = 1 + Math.sin(f * 0.08) * 0.03;

  // Blinking logic: blink for 4 frames every 70 frames
  const blinkCycle = f % 70;
  const isBlinking = blinkCycle >= 0 && blinkCycle <= 3;

  // Mouth openness driven by audioLevel or talk animation
  let mouthOpen = 0;
  if (pose === "talk") {
    mouthOpen = audioLevel > 0.05 ? audioLevel * 14 : Math.abs(Math.sin(f * 0.45)) * 10;
    headRot += Math.sin(f * 0.3) * 5;
  } else if (audioLevel > 0.1) {
    mouthOpen = audioLevel * 10;
  }

  if (pose === "walk") {
    const walkCycle = f * 0.25;
    leftLegRot = Math.sin(walkCycle) * 26;
    rightLegRot = -Math.sin(walkCycle) * 26;
    leftArmRot = -Math.sin(walkCycle) * 28;
    rightArmRot = Math.sin(walkCycle) * 28;
    bodyBob = Math.abs(Math.sin(walkCycle)) * 12;
  } else if (pose === "run") {
    const runCycle = f * 0.45;
    leftLegRot = Math.sin(runCycle) * 45;
    rightLegRot = -Math.sin(runCycle) * 45;
    leftArmRot = -Math.sin(runCycle) * 50;
    rightArmRot = Math.sin(runCycle) * 50;
    bodyBob = Math.abs(Math.sin(runCycle)) * 18;
    postureTilt += 15;
  } else if (pose === "sit") {
    leftLegRot = 75;
    rightLegRot = 75;
    bodyBob = 40;
    leftArmRot = 30;
    rightArmRot = -30;
  } else if (pose === "bow") {
    postureTilt += 32;
    headRot += 15;
    leftArmRot = 45;
    rightArmRot = -45;
    bodyBob = 15;
  } else if (pose === "point") {
    rightArmRot = -75;
    rightForearmRot = -10;
    leftArmRot = 15;
    headRot = 8;
  } else if (pose === "raise_hands") {
    leftArmRot = -120;
    rightArmRot = -120;
    leftForearmRot = -30;
    rightForearmRot = 30;
    headRot = -10;
  }

  const finalScale = scale * scaleMultiplier;
  const flipScale = flip ? -1 : 1;

  return (
    <g
      transform={`translate(${x}, ${y + bodyBob}) scale(${finalScale * flipScale}, ${finalScale})`}
      style={{ transformOrigin: "0px 0px" }}
    >
      {/* Soft Drop Shadow Layer */}
      <g
        transform={`translate(8, 12) rotate(${postureTilt})`}
        opacity={0.4}
        fill={SHADOW}
      >
        <ellipse cx="0" cy={legH + 20} rx="65" ry="16" />
        <rect x={-torsoW / 2} y={-torsoH} width={torsoW} height={torsoH} rx="8" />
        <circle cx="0" cy={-torsoH - 45} r="38" />
      </g>

      {/* Main Jointed Character Group with Paper Bevel */}
      <g filter="url(#paper-bevel)" transform={`rotate(${postureTilt})`}>
        {/* LEGS (Back layer) */}
        {/* Left Leg */}
        <g transform={`translate(-18, -10) rotate(${leftLegRot})`}>
          <rect
            x="-12"
            y="0"
            width="24"
            height={legH}
            rx="5"
            fill={CREAM}
            stroke={INK}
            strokeWidth="3.5"
          />
          {/* Shoe / Mojari */}
          <path
            d={`M-14,${legH - 8} L14,${legH - 8} L18,${legH + 12} L-14,${legH + 12} Z`}
            fill="#302015"
            stroke={CREAM}
            strokeWidth="2.5"
          />
        </g>

        {/* Right Leg */}
        <g transform={`translate(18, -10) rotate(${rightLegRot})`}>
          <rect
            x="-12"
            y="0"
            width="24"
            height={legH}
            rx="5"
            fill={CREAM}
            stroke={INK}
            strokeWidth="3.5"
          />
          {/* Shoe */}
          <path
            d={`M-14,${legH - 8} L14,${legH - 8} L18,${legH + 12} L-14,${legH + 12} Z`}
            fill="#302015"
            stroke={CREAM}
            strokeWidth="2.5"
          />
        </g>

        {/* DHOTI / LOWER GARMENT */}
        <path
          d={`M${-torsoW / 2 - 5}, -15 L${torsoW / 2 + 5}, -15 L${torsoW / 2 + 15}, 65 L${-torsoW / 2 - 15}, 65 Z`}
          fill={CREAM}
          stroke={INK}
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d={`M-10, -15 L10, -15 L22, 60 L-22, 60 Z`}
          fill={GOLD}
          stroke={CREAM}
          strokeWidth="3"
        />

        {/* LEFT ARM (Behind torso) */}
        <g transform={`translate(${-shoulderW / 2}, ${-torsoH + 20}) rotate(${leftArmRot})`}>
          {/* Upper Arm */}
          <rect
            x="-11"
            y="0"
            width="22"
            height="55"
            rx="6"
            fill={outfitColor}
            stroke={CREAM}
            strokeWidth="3"
          />
          {/* Forearm & Hand */}
          <g transform={`translate(0, 50) rotate(${leftForearmRot})`}>
            <rect
              x="-9"
              y="0"
              width="18"
              height="50"
              rx="5"
              fill={skin}
              stroke={CREAM}
              strokeWidth="3"
            />
            {/* Hand */}
            <circle cx="0" cy="55" r="9" fill={skin} stroke={CREAM} strokeWidth="2.5" />
          </g>
        </g>

        {/* TORSO / CHEST */}
        <g transform={`scale(${chestExpansion}, 1)`} style={{ transformOrigin: "0px 0px" }}>
          <rect
            x={-torsoW / 2}
            y={-torsoH}
            width={torsoW}
            height={torsoH}
            rx="8"
            fill={outfitColor}
            stroke={CREAM}
            strokeWidth="4.5"
          />

          {/* Armor or Royal Sash */}
          {type === "warrior" || type === "guard" ? (
            <path
              d={`M${-torsoW / 2 + 8}, ${-torsoH + 25} L0, ${-torsoH + 50} L${torsoW / 2 - 8}, ${-torsoH + 25} L${torsoW / 2 - 12}, ${-25} L${-torsoW / 2 + 12}, ${-25} Z`}
              fill="#522b1d"
              stroke={GOLD}
              strokeWidth="3"
            />
          ) : (
            <path
              d={`M${-torsoW / 2}, ${-torsoH} L${torsoW / 2}, 0`}
              stroke={CREAM}
              strokeWidth="6"
              strokeDasharray="14 6"
            />
          )}

          {/* Waist Band / Kamarband */}
          <rect
            x={-torsoW / 2 - 4}
            y="-22"
            width={torsoW + 8}
            height="18"
            rx="4"
            fill={GOLD}
            stroke={CREAM}
            strokeWidth="3"
          />
        </g>

        {/* RIGHT ARM (In front of torso) */}
        <g transform={`translate(${shoulderW / 2}, ${-torsoH + 20}) rotate(${rightArmRot})`}>
          {/* Upper Arm */}
          <rect
            x="-11"
            y="0"
            width="22"
            height="55"
            rx="6"
            fill={outfitColor}
            stroke={CREAM}
            strokeWidth="3"
          />
          {/* Forearm & Hand */}
          <g transform={`translate(0, 50) rotate(${rightForearmRot})`}>
            <rect
              x="-9"
              y="0"
              width="18"
              height="50"
              rx="5"
              fill={skin}
              stroke={CREAM}
              strokeWidth="3"
            />
            {/* Hand */}
            <circle cx="0" cy="55" r="9" fill={skin} stroke={CREAM} strokeWidth="2.5" />

            {/* Held Weapon / Prop for Warrior / Rishi */}
            {type === "warrior" && (
              <g transform="translate(0, 50) rotate(-65)">
                <rect x="-4" y="-80" width="8" height="180" rx="3" fill="#cbd5e1" stroke={INK} strokeWidth="2.5" />
                <polygon points="-12,-80 12,-80 0,-115" fill="#cbd5e1" stroke={INK} strokeWidth="2.5" />
                <rect x="-14" y="20" width="28" height="8" rx="2" fill={GOLD} stroke={CREAM} strokeWidth="2" />
              </g>
            )}
            {type === "rishi" && (
              <g transform="translate(0, 50) rotate(15)">
                {/* Kamandalu / Wooden Staff */}
                <rect x="-3" y="-60" width="6" height="150" rx="2" fill="#8d5b34" stroke={CREAM} strokeWidth="2" />
              </g>
            )}
          </g>
        </g>

        {/* HEAD & NECK */}
        <g transform={`translate(0, ${-torsoH}) rotate(${headRot})`}>
          {/* Neck */}
          <rect x="-12" y="-15" width="24" height="20" rx="4" fill={skin} stroke={CREAM} strokeWidth="2.5" />

          {/* Deity Radiant Halo */}
          {type === "deity" && (
            <circle
              cx="0"
              cy="-52"
              r="62"
              fill="none"
              stroke={GOLD}
              strokeWidth="6"
              strokeDasharray="8 6"
              opacity={0.85}
            />
          )}

          {/* Face */}
          <circle
            cx="0"
            cy="-50"
            r="42"
            fill={skin}
            stroke={CREAM}
            strokeWidth="4"
          />

          {/* Rishi Beard / Elder Beard */}
          {(type === "rishi" || build === "elder") && (
            <path
              d="M-28, -40 Q0, -5 28, -40 Q34, -20 20, 5 Q0, 24 -20, 5 Z"
              fill={build === "elder" ? "#eceff1" : "#5a3a22"}
              stroke={CREAM}
              strokeWidth="3"
            />
          )}

          {/* EYES */}
          {isBlinking ? (
            <g stroke={INK} strokeWidth="3.5" strokeLinecap="round">
              <line x1="-22" y1="-50" x2="-8" y2="-50" />
              <line x1="8" y1="-50" x2="22" y2="-50" />
            </g>
          ) : emotion === "fierce" ? (
            <g>
              {/* Fierce angled eyebrows */}
              <line x1="-24" y1="-62" x2="-8" y2="-56" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
              <line x1="8" y1="-56" x2="24" y2="-62" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="-16" cy="-50" r="4.5" fill={INK} />
              <circle cx="16" cy="-50" r="4.5" fill={INK} />
            </g>
          ) : emotion === "joy" ? (
            <g>
              {/* Cheerful curved arch eyes */}
              <path d="M-22,-48 Q-15,-58 -8,-48" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
              <path d="M8,-48 Q15,-58 22,-48" fill="none" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
            </g>
          ) : emotion === "sorrow" ? (
            <g>
              {/* Sad angled up eyebrows */}
              <line x1="-24" y1="-56" x2="-8" y2="-62" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
              <line x1="8" y1="-62" x2="24" y2="-56" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="-16" cy="-50" r="4" fill={INK} />
              <circle cx="16" cy="-50" r="4" fill={INK} />
            </g>
          ) : (
            <g>
              {/* Calm neutral eyes */}
              <line x1="-24" y1="-60" x2="-8" y2="-60" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
              <line x1="8" y1="-60" x2="24" y2="-60" stroke={INK} strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="-16" cy="-50" r="4.5" fill={INK} />
              <circle cx="16" cy="-50" r="4.5" fill={INK} />
            </g>
          )}

          {/* Tilak / Teeka */}
          <line x1="0" y1="-74" x2="0" y2="-60" stroke={RED} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="0" cy="-55" r="2.5" fill={GOLD} />

          {/* MOUTH */}
          {mouthOpen > 2 ? (
            <ellipse
              cx="0"
              cy="-34"
              rx="8"
              ry={mouthOpen}
              fill="#4a1515"
              stroke={CREAM}
              strokeWidth="2"
            />
          ) : emotion === "sorrow" ? (
            <path d="M-10,-32 Q0,-40 10,-32" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          ) : emotion === "fierce" ? (
            <line x1="-12" y1="-34" x2="12" y2="-34" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
          ) : (
            <path d="M-10,-36 Q0,-26 10,-36" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
          )}

          {/* HEADGEAR / MUKUT / TURBAN */}
          {type === "king" || type === "deity" || headgear === "crown" ? (
            <g transform="translate(0, -84)">
              {/* Golden Mukut */}
              <path
                d="M-36,0 L36,0 L28,-34 L14,-16 L0,-42 L-14,-16 L-28,-34 Z"
                fill={GOLD}
                stroke={CREAM}
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <circle cx="0" cy="-20" r="5" fill={RED} stroke={CREAM} strokeWidth="2" />
            </g>
          ) : type === "warrior" || headgear === "helmet" ? (
            <g transform="translate(0, -82)">
              {/* Warrior Turban / Helmet with plume */}
              <ellipse cx="0" cy="0" rx="38" ry="16" fill={SAFFRON} stroke={CREAM} strokeWidth="3" />
              <path d="M-15, -8 Q0, -32 25, -6 L-15, -8 Z" fill={GOLD} stroke={CREAM} strokeWidth="2.5" />
            </g>
          ) : type === "rishi" ? (
            <g transform="translate(0, -86)">
              {/* Topknot / Juda */}
              <circle cx="0" cy="-6" r="16" fill="#3d2616" stroke={CREAM} strokeWidth="3" />
              <line x1="-14" y1="-6" x2="14" y2="-6" stroke={GOLD} strokeWidth="3" />
            </g>
          ) : (
            <g transform="translate(0, -80)">
              {/* Simple Pagdi */}
              <ellipse cx="0" cy="0" rx="36" ry="14" fill="#a0522d" stroke={CREAM} strokeWidth="3" />
            </g>
          )}
        </g>
      </g>
    </g>
  );
};
