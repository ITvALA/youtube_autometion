import React from "react";
import {VoxPal, shade, rgba} from "./types";

export type SvgCharName = "raja" | "king" | "krishna" | "warrior" | "yoddha" | "enemy" | "enemy_king";

const d = (c: string) => shade(c, 0.75);
const l = (c: string) => shade(c, 1.35);

const SKIN_ROYAL = "#E5B892";
const SKIN_KRISHNA = "#7DBBE6";
const SKIN_WARRIOR = "#DCA67B";
const SKIN_ENEMY = "#CFA280";

export const SvgCharacter: React.FC<{
  name: string;
  p: VoxPal;
  size: number;
  f: number;
}> = ({name, p, size, f}) => {
  const charKey = name.toLowerCase().replace("char:", "").trim();

  // 1. Natural idle dynamics (Breathing & floating)
  const breatheY = Math.sin(f * 0.1) * 2.5;
  const capeWave = Math.sin(f * 0.12) * 5;
  const eyeBlink = (f % 85) > 80;

  // 2. Select Character
  if (charKey === "krishna") {
    // -------------------------------------------------------------
    // SHRI KRISHNA (Divine Guide & Neetikar)
    // -------------------------------------------------------------
    const auraPulse = 0.85 + Math.sin(f * 0.08) * 0.15;
    const auraRot = (f * 0.5) % 360;

    return (
      <svg viewBox="0 0 240 280" width={size} height={size} style={{overflow: "visible"}}>
        {/* --- DIVINE GOLDEN HALO AURA --- */}
        <g transform="translate(120, 95)">
          <circle r={78 * auraPulse} fill={rgba(p.c3, 0.22)} />
          <circle r={64 * auraPulse} fill={rgba(p.c3, 0.35)} />
          <g transform={`rotate(${auraRot})`}>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <line key={deg} x1="0" y1="-56" x2="0" y2="-72" stroke={p.c3} strokeWidth="3" strokeLinecap="round" transform={`rotate(${deg})`} opacity={0.6} />
            ))}
          </g>
        </g>

        {/* --- BODY & PITAMBARI ROBES --- */}
        <g transform={`translate(0, ${breatheY * 0.5})`}>
          {/* Yellow silk dhoti & angavastram */}
          <path d="M60 170 Q120 160 180 170 L195 275 Q120 285 45 275 Z" fill={p.c3} stroke={d(p.c3)} strokeWidth="4" />
          <path d="M75 170 Q120 220 165 170 L175 275 Q120 282 65 275 Z" fill={l(p.c3)} opacity="0.6" />
          {/* Blue divine torso */}
          <path d="M78 140 Q120 135 162 140 L168 185 Q120 195 72 185 Z" fill={SKIN_KRISHNA} stroke={d(SKIN_KRISHNA)} strokeWidth="3" />
          {/* Vaijayanti flower garland */}
          <path d="M82 140 Q120 230 158 140" fill="none" stroke="#FFF" strokeWidth="6" strokeLinecap="round" strokeDasharray="4 8" />
          <path d="M82 140 Q120 230 158 140" fill="none" stroke="#FF5722" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 10" />
        </g>

        {/* --- HEAD & DIVINE EXPRESSION --- */}
        <g transform={`translate(0, ${breatheY})`}>
          {/* Face */}
          <ellipse cx="120" cy="115" rx="34" ry="40" fill={SKIN_KRISHNA} stroke={d(SKIN_KRISHNA)} strokeWidth="3" />
          {/* Divine Lotus Eyes */}
          {eyeBlink ? (
            <>
              <line x1="102" y1="112" x2="114" y2="112" stroke="#1A237E" strokeWidth="3" strokeLinecap="round" />
              <line x1="126" y1="112" x2="138" y2="112" stroke="#1A237E" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="108" cy="112" rx="6" ry="4" fill="#FFF" />
              <circle cx="109" cy="112" r="3" fill="#1A237E" />
              <ellipse cx="132" cy="112" rx="6" ry="4" fill="#FFF" />
              <circle cx="131" cy="112" r="3" fill="#1A237E" />
            </>
          )}
          {/* Gentle Divine Smile */}
          <path d="M112 130 Q120 137 128 130" fill="none" stroke="#D81B60" strokeWidth="2.5" strokeLinecap="round" />
          {/* Tilak (Urdhva Pundra) */}
          <path d="M117 92 V108 Q120 112 123 108 V92 Z" fill="#FFEB3B" />
          <circle cx="120" cy="110" r="1.5" fill="#E91E63" />

          {/* Golden Crown (Mukut) */}
          <path d="M92 90 Q120 75 148 90 L144 65 Q120 55 96 65 Z" fill={p.c3} stroke={d(p.c3)} strokeWidth="3" />
          <circle cx="120" cy="72" r="6" fill="#E91E63" />

          {/* Peacock Feather (Mor-Pankh) */}
          <g transform="translate(136, 45) rotate(22)">
            <ellipse cx="0" cy="0" rx="14" ry="24" fill="#00897B" />
            <ellipse cx="0" cy="4" rx="9" ry="16" fill="#00ACC1" />
            <circle cx="0" cy="8" r="6" fill="#1A237E" />
            <circle cx="0" cy="8" r="2.5" fill="#FFD54F" />
            <path d="M0 24 Q-5 45 -12 60" fill="none" stroke="#2E7D32" strokeWidth="2.5" />
          </g>

          {/* Flute (Bansuri) */}
          <g transform={`translate(100, 138) rotate(-14)`}>
            <rect x="0" y="0" width="85" height="8" rx="4" fill="#D7CCC8" stroke="#5D4037" strokeWidth="2" />
            <circle cx="20" cy="4" r="1.5" fill="#5D4037" />
            <circle cx="35" cy="4" r="1.5" fill="#5D4037" />
            <circle cx="50" cy="4" r="1.5" fill="#5D4037" />
            <circle cx="65" cy="4" r="1.5" fill="#5D4037" />
            <path d="M82 4 Q88 18 84 28" fill="none" stroke="#E91E63" strokeWidth="2" />
          </g>
        </g>
      </svg>
    );
  }

  if (charKey === "warrior" || charKey === "yoddha") {
    // -------------------------------------------------------------
    // RAJPUT / MARATHA WARRIOR (Yoddha / Senapati)
    // -------------------------------------------------------------
    return (
      <svg viewBox="0 0 240 280" width={size} height={size} style={{overflow: "visible"}}>
        {/* --- FLOWING BATTLE CLOAK --- */}
        <path d={`M65 130 Q${40 + capeWave} 200 45 270 L195 270 Q${200 - capeWave} 200 175 130 Z`} fill={p.c1} opacity="0.9" stroke={p.ink} strokeWidth="4" />

        {/* --- TORSO & STEEL ARMOR (Kavach) --- */}
        <g transform={`translate(0, ${breatheY * 0.5})`}>
          {/* Steel chestplate */}
          <path d="M72 135 L168 135 L160 230 L80 230 Z" fill="#90A4AE" stroke="#37474F" strokeWidth="4" />
          <path d="M85 145 H155 V215 H85 Z" fill="#78909C" />
          {/* Brass rivets */}
          <circle cx="95" cy="155" r="3" fill={p.c3} /><circle cx="145" cy="155" r="3" fill={p.c3} />
          <circle cx="95" cy="205" r="3" fill={p.c3} /><circle cx="145" cy="205" r="3" fill={p.c3} />
          {/* Battle sash (Kamarbandh) */}
          <rect x="74" y="215" width="92" height="18" fill="#D32F2F" stroke="#B71C1C" strokeWidth="3" />
        </g>

        {/* --- HEAD & DETERMINED EXPRESSION --- */}
        <g transform={`translate(0, ${breatheY})`}>
          {/* Face */}
          <ellipse cx="120" cy="100" rx="32" ry="36" fill={SKIN_WARRIOR} stroke={p.ink} strokeWidth="3.5" />
          {/* Fierce Eyes */}
          {eyeBlink ? (
            <>
              <line x1="102" y1="96" x2="114" y2="96" stroke={p.ink} strokeWidth="3.5" strokeLinecap="round" />
              <line x1="126" y1="96" x2="138" y2="96" stroke={p.ink} strokeWidth="3.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <polygon points="102,96 114,93 112,99" fill={p.ink} />
              <circle cx="108" cy="96" r="3.5" fill="#FFF" />
              <circle cx="109" cy="96" r="2" fill="#000" />
              <polygon points="138,96 126,93 128,99" fill={p.ink} />
              <circle cx="132" cy="96" r="3.5" fill="#FFF" />
              <circle cx="131" cy="96" r="2" fill="#000" />
            </>
          )}
          {/* Big Warrior Moustache */}
          <path d="M102 112 Q120 118 120 110 Q120 118 138 112 Q144 105 140 102 Q120 108 120 106 Q120 108 100 102 Q96 105 102 112 Z" fill="#212121" stroke={p.ink} strokeWidth="2" />
          {/* Saffron Warrior Turban (Kesariya Pagdi) */}
          <path d="M84 88 Q120 60 156 88 L154 62 Q120 40 86 62 Z" fill="#F57C00" stroke="#BF360C" strokeWidth="4" />
          <path d="M88 64 Q120 48 152 64 L146 45 Q120 30 94 45 Z" fill="#FF9800" />
          <circle cx="120" cy="62" r="5" fill={p.c3} />
        </g>

        {/* --- WARRIOR SHIELD (Dhaal) in Left Hand --- */}
        <g transform="translate(48, 175)">
          <circle cx="0" cy="0" r="36" fill="#37474F" stroke="#263238" strokeWidth="4" />
          <circle cx="0" cy="0" r="28" fill="#455A64" />
          {/* Golden Bosses */}
          <circle cx="0" cy="0" r="8" fill={p.c3} stroke="#F57F17" strokeWidth="2" />
          <circle cx="-16" cy="0" r="4" fill={p.c3} /><circle cx="16" cy="0" r="4" fill={p.c3} />
          <circle cx="0" cy="-16" r="4" fill={p.c3} /><circle cx="0" cy="16" r="4" fill={p.c3} />
        </g>

        {/* --- RAISED SWORD (Talwar) in Right Hand --- */}
        <g transform={`translate(185, 175) rotate(${Math.sin(f * 0.15) * 6})`}>
          {/* Blade */}
          <path d="M0 0 L18 -110 Q22 -125 14 -130 Q6 -125 4 -110 L-6 0 Z" fill="#ECEFF1" stroke="#455A64" strokeWidth="3" />
          <line x1="8" y1="-120" x2="0" y2="0" stroke="#B0BEC5" strokeWidth="2" />
          {/* Golden Hilt */}
          <rect x="-16" y="0" width="32" height="6" rx="3" fill={p.c3} stroke="#F57F17" strokeWidth="2" />
          <rect x="-4" y="6" width="8" height="20" rx="3" fill="#D7CCC8" stroke="#5D4037" strokeWidth="2" />
          <circle cx="0" cy="28" r="8" fill={p.c3} />
        </g>
      </svg>
    );
  }

  // -------------------------------------------------------------
  // RAJA / MAHARANA (Royal Emperor / King - DEFAULT)
  // -------------------------------------------------------------
  return (
    <svg viewBox="0 0 240 280" width={size} height={size} style={{overflow: "visible"}}>
      {/* --- ROYAL CAPE (Shahi Choga) --- */}
      <path
        d={`M60 120 Q${35 + capeWave} 190 40 275 L200 275 Q${205 - capeWave} 190 180 120 Z`}
        fill="#880E4F"
        stroke="#4A148C"
        strokeWidth="4"
      />

      {/* --- ROYAL BODY & ORNATE JEWELRY --- */}
      <g transform={`translate(0, ${breatheY * 0.5})`}>
        {/* Shahi Angrakha (Royal Kurta) */}
        <path d="M70 128 L170 128 L178 275 L62 275 Z" fill={p.c1} stroke={p.ink} strokeWidth="4" />
        <path d="M120 128 V275" stroke={p.c3} strokeWidth="4" />
        {/* Golden Embroidered Sash */}
        <polygon points="70,215 170,215 166,240 74,240" fill={p.c3} stroke={d(p.c3)} strokeWidth="2" />

        {/* Royal Pearl & Emerald Haar (Necklaces) */}
        <path d="M84 130 Q120 170 156 130" fill="none" stroke="#FFF" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 7" />
        <path d="M88 135 Q120 190 152 135" fill="none" stroke={p.c3} strokeWidth="3" />
        <circle cx="120" cy="180" r="7" fill="#00C853" stroke={p.c3} strokeWidth="2" />
      </g>

      {/* --- ROYAL HEAD & REGAL FACE --- */}
      <g transform={`translate(0, ${breatheY})`}>
        {/* Face */}
        <ellipse cx="120" cy="95" rx="34" ry="38" fill={SKIN_ROYAL} stroke={p.ink} strokeWidth="3.5" />
        {/* Royal Eyes */}
        {eyeBlink ? (
          <>
            <line x1="102" y1="90" x2="114" y2="90" stroke={p.ink} strokeWidth="3.5" strokeLinecap="round" />
            <line x1="126" y1="90" x2="138" y2="90" stroke={p.ink} strokeWidth="3.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="108" cy="90" rx="5" ry="4" fill="#FFF" />
            <circle cx="109" cy="90" r="2.8" fill="#212121" />
            <ellipse cx="132" cy="90" rx="5" ry="4" fill="#FFF" />
            <circle cx="131" cy="90" r="2.8" fill="#212121" />
          </>
        )}

        {/* Shahi Royal Moustache (Raja Ki Moonch) */}
        <path
          d="M100 108 Q120 114 120 106 Q120 114 140 108 Q152 100 148 95 Q120 102 120 100 Q120 102 92 95 Q88 100 100 108 Z"
          fill="#1A1A1A"
          stroke={p.ink}
          strokeWidth="2"
        />

        {/* Royal Rajputi Tilak */}
        <line x1="120" y1="72" x2="120" y2="86" stroke="#C62828" strokeWidth="4" strokeLinecap="round" />
        <circle cx="120" cy="88" r="2" fill={p.c3} />

        {/* Shahi Mukut (Imperial Crown) */}
        <g transform="translate(120, 62)">
          {/* Base band */}
          <path d="M-36 0 Q0 -6 36 0 L32 16 Q0 10 -32 16 Z" fill={p.c3} stroke={d(p.c3)} strokeWidth="2" />
          {/* 3 Royal Peaks */}
          <polygon points="-32,0 -20,-32 -8,0" fill={p.c3} stroke={d(p.c3)} strokeWidth="2" />
          <polygon points="-12,0 0,-44 12,0" fill={p.c3} stroke={d(p.c3)} strokeWidth="2" />
          <polygon points="8,0 20,-32 32,0" fill={p.c3} stroke={d(p.c3)} strokeWidth="2" />
          {/* Jewels */}
          <circle cx="0" cy="-22" r="5" fill="#D50000" stroke="#FFF" strokeWidth="1.5" />
          <circle cx="-14" cy="-14" r="3.5" fill="#00C853" />
          <circle cx="14" cy="-14" r="3.5" fill="#00C853" />
          {/* Kalgi / Plume */}
          <path d="M0 -44 Q-14 -70 8 -82 Q12 -65 2 -44 Z" fill="#E0F7FA" stroke="#80DEEA" strokeWidth="2" />
          <circle cx="0" cy="-44" r="3" fill="#D50000" />
        </g>
      </g>

      {/* --- SHAHI TALWAR (Royal Sword in Hand) --- */}
      <g transform={`translate(178, 160) rotate(${Math.sin(f * 0.08) * 4})`}>
        {/* Curved Blade */}
        <path d="M0 0 Q15 -70 38 -125 Q42 -130 36 -128 Q18 -75 -4 0 Z" fill="#ECEFF1" stroke="#78909C" strokeWidth="3" />
        {/* Golden Pommel & Crossguard */}
        <rect x="-14" y="0" width="28" height="6" rx="3" fill={p.c3} stroke={d(p.c3)} strokeWidth="2" />
        <rect x="-4" y="6" width="8" height="18" rx="2" fill="#8D6E63" stroke="#4E342E" strokeWidth="2" />
        <circle cx="0" cy="27" r="7" fill={p.c3} stroke="#F57F17" strokeWidth="1.5" />
      </g>
    </svg>
  );
};

