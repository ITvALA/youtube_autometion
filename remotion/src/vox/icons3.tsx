import React from "react";
import {VoxPal, shade} from "./types";

/* NICHE PACK 2: Travel, Health, Food, Animals, Sports, Education, Art. 200x200 viewBox, flat style. */
type IconFn = (p: VoxPal, f: number) => React.ReactNode;
const d = (c: string) => shade(c, 0.78);
const l = (c: string) => shade(c, 1.35);
const SKIN = "#F2C29B";

export const ICONS_3: Record<string, IconFn> = {
  /* ---- Travel & nature ---- */
  plane: (p, f) => (
    <g transform={`translate(${Math.sin(f * 0.06) * 3} ${Math.cos(f * 0.06) * 3}) rotate(45 100 100)`}>
      <path d="M100 14 Q114 30 114 66 L178 112 V132 L114 112 V150 L134 168 V182 L100 174 L66 182 V168 L86 150 V112 L22 132 V112 L86 66 Q86 30 100 14 Z" fill={p.light} stroke={p.ink} strokeWidth="6" strokeLinejoin="round" />
      <path d="M100 24 Q108 36 108 60 H92 Q92 36 100 24 Z" fill={p.c2} />
    </g>
  ),
  suitcase: (p) => (
    <g>
      <path d="M72 62 V44 Q72 34 82 34 H118 Q128 34 128 44 V62" fill="none" stroke={p.ink} strokeWidth="10" />
      <rect x="22" y="60" width="156" height="112" rx="14" fill={p.c1} stroke={p.ink} strokeWidth="5" />
      <rect x="54" y="60" width="14" height="112" fill={d(p.c1)} /><rect x="132" y="60" width="14" height="112" fill={d(p.c1)} />
      <rect x="88" y="104" width="24" height="18" rx="4" fill={p.c3} stroke={p.ink} strokeWidth="3" />
      <circle cx="152" cy="94" r="10" fill={p.c2} /><rect x="30" y="140" width="18" height="14" rx="3" fill={p.light} opacity="0.85" />
    </g>
  ),
  tent: (p, f) => (
    <g>
      <path d="M100 30 L184 168 H16 Z" fill={p.c1} stroke={p.ink} strokeWidth="6" strokeLinejoin="round" />
      <path d="M100 30 L100 168 H16 Z" fill={d(p.c1)} opacity="0.4" />
      <path d="M100 100 L132 168 H68 Z" fill={p.ink} />
      <line x1="100" y1="30" x2="100" y2="10" stroke={p.ink} strokeWidth="5" /><path d="M100 10 L122 17 L100 24 Z" fill={p.c3} />
      <rect x="8" y="166" width="184" height="10" rx="5" fill={p.c2} />
      <path d={`M158 ${160 - Math.abs(Math.sin(f * 0.3)) * 6} q6 -14 0 -26 q14 10 8 26 Z`} fill={p.c3} />
    </g>
  ),
  palm: (p, f) => (
    <g>
      <circle cx="154" cy="44" r="22" fill={p.c3} />
      <path d="M96 176 Q88 118 100 74" fill="none" stroke={p.c4} strokeWidth="13" strokeLinecap="round" />
      {[-70, -35, 0, 35, 70].map((a, i) => <path key={i} d="M100 72 Q130 40 168 62 Q130 58 100 74 Z" fill={i % 2 ? p.c2 : d(p.c2)} transform={`rotate(${a + 4 + Math.sin(f * 0.07 + i) * 3} 100 74) rotate(-90 100 74)`} />)}
      <circle cx="94" cy="78" r="8" fill={p.c4} /><circle cx="108" cy="82" r="7" fill={d(p.c4)} />
      <path d="M20 176 Q100 150 180 176 V190 H20 Z" fill={p.c3} opacity="0.7" />
    </g>
  ),
  wave: (p, f) => (
    <g clipPath="url(#vox-wave-clip)">
      <clipPath id="vox-wave-clip"><rect x="0" y="0" width="200" height="200" rx="24" /></clipPath>
      {[[p.c2, 96, 1], [d(p.c2), 124, -1], [l(p.c2), 152, 1]].map(([c, y, dir], i) => (
        <path key={i} d={`M-40 ${y} q20 -26 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 V200 H-40 Z`} fill={String(c)} transform={`translate(${((f * 1.2 * Number(dir)) % 80)} ${Math.sin(f * 0.08 + i) * 3})`} opacity={i === 2 ? 0.9 : 1} />
      ))}
      <circle cx="146" cy="44" r="20" fill={p.c3} />
    </g>
  ),
  camera: (p) => (
    <g>
      <path d="M66 54 L78 36 H122 L134 54 Z" fill={p.ink} />
      <rect x="20" y="52" width="160" height="112" rx="16" fill={p.c4} stroke={p.ink} strokeWidth="5" />
      <rect x="20" y="52" width="160" height="30" rx="14" fill={p.ink} opacity="0.35" />
      <circle cx="100" cy="112" r="42" fill={p.ink} /><circle cx="100" cy="112" r="32" fill={p.c2} /><circle cx="100" cy="112" r="16" fill={l(p.c2)} /><circle cx="90" cy="102" r="6" fill={p.light} />
      <rect x="146" y="62" width="22" height="12" rx="4" fill={p.c3} /><circle cx="40" cy="70" r="6" fill={p.c1} />
    </g>
  ),
  ship: (p, f) => (
    <g transform={`translate(0 ${Math.sin(f * 0.1) * 3})`}>
      <line x1="100" y1="20" x2="100" y2="130" stroke={p.ink} strokeWidth="6" />
      <path d="M104 26 Q150 70 150 120 H104 Z" fill={p.light} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" /><path d="M96 40 Q56 80 52 120 H96 Z" fill={l(p.c1)} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" />
      <path d="M22 130 H178 Q166 166 130 168 H70 Q34 166 22 130 Z" fill={p.c1} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d="M10 176 q20 -12 40 0 t40 0 t40 0 t40 0 t20 0" fill="none" stroke={p.c2} strokeWidth="7" strokeLinecap="round" />
    </g>
  ),
  /* ---- Health & fitness ---- */
  meditate: (p, f) => (
    <g>
      <circle cx="100" cy="98" r={74 + Math.sin(f * 0.08) * 4} fill={p.c3} opacity="0.22" />
      <circle cx="100" cy="50" r="21" fill={SKIN} /><path d="M79 46 Q81 26 100 26 Q119 26 121 46 Q108 38 100 40 Q92 38 79 46 Z" fill={p.ink} />
      <path d="M66 126 Q64 78 100 74 Q136 78 134 126 Z" fill={p.c1} />
      <path d="M46 164 Q40 140 74 134 H126 Q160 140 154 164 Q100 184 46 164 Z" fill={p.c2} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" />
      <path d="M70 106 Q54 128 76 140 M130 106 Q146 128 124 140" fill="none" stroke={p.c1} strokeWidth="14" strokeLinecap="round" />
      <circle cx="78" cy="142" r="9" fill={SKIN} /><circle cx="122" cy="142" r="9" fill={SKIN} />
    </g>
  ),
  apple: (p) => (
    <g>
      <path d="M100 54 C70 34 26 52 30 106 C34 152 70 180 100 166 C130 180 166 152 170 106 C174 52 130 34 100 54 Z" fill={p.c1} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d="M100 54 Q98 34 108 20" fill="none" stroke={p.c4} strokeWidth="8" strokeLinecap="round" /><path d="M108 36 Q136 14 156 30 Q132 52 108 36 Z" fill={p.c2} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" />
      <path d="M52 92 Q54 72 70 66" fill="none" stroke={l(p.c1)} strokeWidth="8" strokeLinecap="round" />
    </g>
  ),
  shoe: (p) => (
    <g>
      <path d="M18 138 L26 72 Q56 84 78 66 L96 46 L118 76 Q154 92 184 112 V138 Z" fill={p.c1} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d="M96 46 L118 76 L100 82 L84 62 Z" fill={d(p.c1)} />
      {[0, 1, 2].map((i) => <line key={i} x1={86 + i * 14} y1={66 + i * 10} x2={98 + i * 14} y2={80 + i * 10} stroke={p.light} strokeWidth="6" strokeLinecap="round" />)}
      <path d="M14 138 H188 V158 Q188 170 174 170 H28 Q14 170 14 158 Z" fill={p.light} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d="M40 112 Q70 96 98 112" fill="none" stroke={p.c3} strokeWidth="7" strokeLinecap="round" />
    </g>
  ),
  drop: (p, f) => (
    <g>
      <path d="M100 18 C100 18 44 86 44 124 C44 158 68 180 100 180 C132 180 156 158 156 124 C156 86 100 18 100 18 Z" fill={p.c2} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d="M70 118 Q70 142 88 154" fill="none" stroke={l(p.c2)} strokeWidth="9" strokeLinecap="round" />
      <ellipse cx="100" cy="186" rx={28 + (f % 30)} ry="5" fill="none" stroke={p.c2} strokeWidth="3" opacity={1 - (f % 30) / 30} />
    </g>
  ),
  bed: (p, f) => (
    <g>
      <rect x="22" y="72" width="14" height="100" rx="5" fill={p.ink} /><rect x="164" y="104" width="14" height="68" rx="5" fill={p.ink} />
      <rect x="22" y="132" width="156" height="22" rx="6" fill={p.c4} />
      <rect x="36" y="104" width="128" height="30" rx="8" fill={p.light} stroke={p.ink} strokeWidth="4" />
      <rect x="44" y="92" width="44" height="22" rx="10" fill={p.light} stroke={p.ink} strokeWidth="4" />
      <path d="M92 108 H164 V134 H92 Z" fill={p.c1} />
      {[0, 1, 2].map((i) => <text key={i} x={118 + i * 18} y={70 - i * 14 - ((f * 0.4) % 12)} fontSize={18 + i * 6} fontWeight={900} fill={p.c2} opacity={0.9 - i * 0.2} fontFamily="sans-serif">z</text>)}
    </g>
  ),
  heartbeat: (p, f) => (
    <g>
      <rect x="14" y="40" width="172" height="124" rx="16" fill={p.light} stroke={p.ink} strokeWidth="6" />
      <path d="M26 104 H66 L82 64 L104 144 L122 52 L138 116 H174" fill="none" stroke={p.c1} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="260" strokeDashoffset={260 - ((f * 5) % 360)} />
      <g transform={`translate(100 154) scale(${1 + Math.sin(f * 0.25) * 0.08})`}><path d="M0 12 C-22 -4 -18 -20 -8 -20 C-2 -20 0 -14 0 -12 C0 -14 2 -20 8 -20 C18 -20 22 -4 0 12 Z" fill={p.c1} /></g>
    </g>
  ),
  stopwatch: (p, f) => (
    <g>
      <rect x="86" y="14" width="28" height="16" rx="4" fill={p.ink} /><rect x="94" y="28" width="12" height="16" fill={p.ink} />
      <circle cx="100" cy="112" r="68" fill={p.light} stroke={p.ink} strokeWidth="9" />
      <path d="M100 112 L100 52 A60 60 0 0 1 152 82 Z" fill={p.c1} opacity="0.35" />
      {Array.from({length: 12}, (_, i) => <line key={i} x1="100" y1="54" x2="100" y2={i % 3 === 0 ? 66 : 60} stroke={p.ink} strokeWidth={i % 3 === 0 ? 5 : 3} transform={`rotate(${i * 30} 100 112)`} />)}
      <line x1="100" y1="112" x2="100" y2="62" stroke={p.c1} strokeWidth="6" strokeLinecap="round" transform={`rotate(${(f * 6) % 360} 100 112)`} /><circle cx="100" cy="112" r="8" fill={p.ink} />
    </g>
  ),
  /* ---- Food & cooking ---- */
  burger: (p) => (
    <g>
      <path d="M32 90 Q32 36 100 36 Q168 36 168 90 Z" fill={p.c3} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      {[[70, 62], [100, 52], [130, 62], [86, 76], [116, 78]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="6" ry="3.5" fill={p.light} transform={`rotate(${i * 30} ${x} ${y})`} />)}
      <path d="M26 92 q12 14 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 V100 H26 Z" fill={p.c2} />
      <path d="M32 102 H168 L150 124 H50 Z" fill={p.c3} /><rect x="30" y="112" width="140" height="22" rx="10" fill={p.c4} stroke={p.ink} strokeWidth="4" />
      <path d="M30 140 H170 Q170 168 140 168 H60 Q30 168 30 140 Z" fill={p.c3} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
    </g>
  ),
  pizza: (p) => (
    <g>
      <path d="M100 176 L22 52 Q100 14 178 52 Z" fill={p.c3} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d="M22 52 Q100 14 178 52 L172 64 Q100 30 28 64 Z" fill={d(p.c3)} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" />
      {[[100, 70], [70, 90], [128, 92], [100, 114], [86, 138], [116, 140]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="11" fill={p.c1} stroke={p.ink} strokeWidth="3" />)}
      <circle cx="100" cy="92" r="4" fill={p.c2} /><circle cx="84" cy="64" r="4" fill={p.c2} />
    </g>
  ),
  chefhat: (p) => (
    <g>
      <circle cx="64" cy="70" r="34" fill={p.light} stroke={p.ink} strokeWidth="5" /><circle cx="136" cy="70" r="34" fill={p.light} stroke={p.ink} strokeWidth="5" /><circle cx="100" cy="52" r="38" fill={p.light} stroke={p.ink} strokeWidth="5" />
      <rect x="62" y="84" width="76" height="70" fill={p.light} stroke={p.ink} strokeWidth="5" /><rect x="62" y="136" width="76" height="24" rx="4" fill={p.c1} stroke={p.ink} strokeWidth="5" />
      <rect x="66" y="88" width="68" height="40" fill={p.light} />
      {[84, 100, 116].map((x) => <line key={x} x1={x} y1="94" x2={x} y2="130" stroke={d(p.light)} strokeWidth="4" />)}
    </g>
  ),
  pot: (p, f) => (
    <g>
      {[0, 1, 2].map((i) => <path key={i} d={`M${76 + i * 24} 44 q-10 -12 0 -24`} fill="none" stroke={p.c2} strokeWidth="6" strokeLinecap="round" opacity={0.3 + 0.4 * Math.abs(Math.sin(f * 0.12 + i * 2))} transform={`translate(0 ${-((f * 0.5 + i * 7) % 10)})`} />)}
      <rect x="40" y="56" width="120" height="14" rx="6" fill={p.c4} stroke={p.ink} strokeWidth="4" /><circle cx="100" cy="50" r="8" fill={p.ink} />
      <path d="M44 70 H156 V130 Q156 148 138 148 H62 Q44 148 44 130 Z" fill={p.c2} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <rect x="14" y="84" width="30" height="12" rx="5" fill={p.ink} /><rect x="156" y="84" width="30" height="12" rx="5" fill={p.ink} />
      <path d="M62 160 q6 -20 12 0 q6 -24 14 0 q8 -22 14 0 q8 -20 14 0 q6 -16 12 0 V172 H62 Z" fill={p.c1} />
    </g>
  ),
  cake: (p, f) => (
    <g>
      <rect x="98" y="30" width="8" height="30" rx="3" fill={p.c2} /><path d={`M102 ${14 - Math.sin(f * 0.4) * 2} q-9 10 0 18 q9 -8 0 -18 Z`} fill={p.c3} />
      <rect x="44" y="84" width="112" height="40" rx="8" fill={p.c1} stroke={p.ink} strokeWidth="4" />
      <path d="M40 90 q14 24 28 0 t28 0 t28 0 t28 0 V76 Q100 60 40 76 Z" fill={p.light} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" />
      <rect x="28" y="124" width="144" height="46" rx="10" fill={p.c4} stroke={p.ink} strokeWidth="4" />
      <path d="M24 130 q14 26 28 0 t28 0 t28 0 t28 0 t28 0 V122 H24 Z" fill={p.light} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="60" cy="152" r="5" fill={p.c3} /><circle cx="100" cy="156" r="5" fill={p.c3} /><circle cx="140" cy="152" r="5" fill={p.c3} />
    </g>
  ),
  icecream: (p) => (
    <g>
      <path d="M58 98 L100 186 L142 98 Z" fill={p.c3} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      {[0, 1, 2].map((i) => <g key={i}><line x1={70 + i * 14} y1="100" x2={96 + i * 4} y2="170" stroke={d(p.c3)} strokeWidth="4" opacity="0.7" /><line x1={130 - i * 14} y1="100" x2={104 - i * 4} y2="170" stroke={d(p.c3)} strokeWidth="4" opacity="0.7" /></g>)}
      <circle cx="100" cy="86" r="42" fill={p.c1} stroke={p.ink} strokeWidth="5" /><circle cx="100" cy="46" r="32" fill={p.c2} stroke={p.ink} strokeWidth="5" />
      <path d="M54 92 q10 14 20 0 t20 0 t20 0 t20 0 t20 0" fill="none" stroke={l(p.c1)} strokeWidth="6" strokeLinecap="round" />
      <circle cx="100" cy="16" r="8" fill={p.c1} stroke={p.ink} strokeWidth="3" />
    </g>
  ),
  chilli: (p, f) => (
    <g transform={`rotate(${Math.sin(f * 0.08) * 3} 40 40)`}>
      <path d="M34 44 C56 34 92 44 122 78 C150 108 168 148 186 182 C150 176 104 154 72 118 C48 90 36 66 34 44 Z" fill={p.c1} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d="M52 52 C80 52 108 74 132 108" fill="none" stroke={l(p.c1)} strokeWidth="8" strokeLinecap="round" opacity="0.85" />
      <path d="M34 44 C22 40 14 30 14 16 C30 14 46 22 50 38 Z" fill={p.c2} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d="M26 30 Q34 22 44 34" fill="none" stroke={p.ink} strokeWidth="3" />
    </g>
  ),
  bowl: (p, f) => (
    <g>
      {[0, 1, 2].map((i) => <path key={i} d={`M${76 + i * 24} 70 q-10 -12 0 -24`} fill="none" stroke={p.c4} strokeWidth="6" strokeLinecap="round" opacity={0.3 + 0.4 * Math.abs(Math.sin(f * 0.12 + i * 2))} />)}
      <ellipse cx="100" cy="94" rx="72" ry="16" fill={p.c3} stroke={p.ink} strokeWidth="5" />
      <path d="M28 94 Q32 170 100 170 Q168 170 172 94 Z" fill={p.c2} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <ellipse cx="100" cy="94" rx="60" ry="11" fill={p.c1} /><circle cx="82" cy="92" r="6" fill={p.c3} /><circle cx="112" cy="96" r="6" fill={p.c3} /><circle cx="130" cy="90" r="5" fill={p.light} />
      <path d="M52 124 Q100 140 148 124" fill="none" stroke={l(p.c2)} strokeWidth="6" strokeLinecap="round" />
      <rect x="64" y="172" width="72" height="8" rx="4" fill={p.ink} />
    </g>
  ),
  /* ---- Animals & pets ---- */
  paw: (p) => (
    <g>
      <path d="M100 98 C70 98 52 130 62 152 C70 170 90 164 100 164 C110 164 130 170 138 152 C148 130 130 98 100 98 Z" fill={p.c4} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      {[[48, 82, -20], [78, 54, -8], [122, 54, 8], [152, 82, 20]].map(([x, y, r], i) => <ellipse key={i} cx={x} cy={y} rx="16" ry="22" fill={p.c4} stroke={p.ink} strokeWidth="5" transform={`rotate(${r} ${x} ${y})`} />)}
    </g>
  ),
  dog: (p, f) => (
    <g>
      <ellipse cx="46" cy="96" rx="22" ry="44" fill={p.c4} stroke={p.ink} strokeWidth="5" transform="rotate(14 46 96)" /><ellipse cx="154" cy="96" rx="22" ry="44" fill={p.c4} stroke={p.ink} strokeWidth="5" transform="rotate(-14 154 96)" />
      <ellipse cx="100" cy="94" rx="56" ry="60" fill={p.c3} stroke={p.ink} strokeWidth="5" />
      <ellipse cx="100" cy="122" rx="30" ry="24" fill={p.light} /><ellipse cx="100" cy="108" rx="14" ry="10" fill={p.ink} />
      <circle cx="78" cy="84" r="8" fill={p.ink} /><circle cx="122" cy="84" r="8" fill={p.ink} /><circle cx="75" cy="81" r="3" fill={p.light} /><circle cx="119" cy="81" r="3" fill={p.light} />
      <path d="M100 118 V128 M88 130 Q100 138 112 130" fill="none" stroke={p.ink} strokeWidth="4" strokeLinecap="round" />
      <path d={`M92 134 Q100 ${148 + Math.sin(f * 0.3) * 3} 108 134 Z`} fill={p.c1} />
    </g>
  ),
  cat: (p) => (
    <g>
      <path d="M40 62 L50 14 L90 44 Z M160 62 L150 14 L110 44 Z" fill={p.c1} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" /><path d="M52 44 L56 26 L72 40 Z M148 44 L144 26 L128 40 Z" fill={l(p.c1)} />
      <ellipse cx="100" cy="104" rx="64" ry="58" fill={p.c1} stroke={p.ink} strokeWidth="5" />
      <ellipse cx="76" cy="94" rx="11" ry="14" fill={p.c2} /><ellipse cx="124" cy="94" rx="11" ry="14" fill={p.c2} /><ellipse cx="76" cy="94" rx="4" ry="12" fill={p.ink} /><ellipse cx="124" cy="94" rx="4" ry="12" fill={p.ink} />
      <path d="M92 116 H108 L100 126 Z" fill={l(p.c3)} stroke={p.ink} strokeWidth="3" strokeLinejoin="round" /><path d="M100 126 Q90 138 80 130 M100 126 Q110 138 120 130" fill="none" stroke={p.ink} strokeWidth="4" strokeLinecap="round" />
      {[[-1, 0], [-1, 12]].map(([s, o], i) => <g key={i}><line x1="62" y1={118 + o} x2="22" y2={110 + o * 1.5} stroke={p.ink} strokeWidth="3" /><line x1="138" y1={118 + o} x2="178" y2={110 + o * 1.5} stroke={p.ink} strokeWidth="3" /></g>)}
    </g>
  ),
  bird: (p, f) => (
    <g transform={`translate(0 ${Math.sin(f * 0.1) * 3})`}>
      <path d="M22 160 H178" stroke={p.c4} strokeWidth="9" strokeLinecap="round" />
      <path d="M30 100 Q30 60 76 56 Q120 52 138 88 L186 70 L150 112 Q132 156 84 154 Q34 150 30 100 Z" fill={p.c2} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d="M54 102 Q82 84 112 108 Q90 140 60 126 Z" fill={d(p.c2)} /><circle cx="52" cy="82" r="5" fill={p.ink} /><path d="M32 86 L10 94 L32 100 Z" fill={p.c3} stroke={p.ink} strokeWidth="3" strokeLinejoin="round" />
      <line x1="92" y1="152" x2="92" y2="162" stroke={p.ink} strokeWidth="4" /><line x1="112" y1="150" x2="112" y2="162" stroke={p.ink} strokeWidth="4" />
    </g>
  ),
  lion: (p) => (
    <g>
      {Array.from({length: 14}, (_, i) => <circle key={i} cx={100 + 62 * Math.cos((i * 2 * Math.PI) / 14)} cy={102 + 62 * Math.sin((i * 2 * Math.PI) / 14)} r="22" fill={p.c4} stroke={p.ink} strokeWidth="3" />)}
      <circle cx="100" cy="102" r="60" fill={p.c4} /><ellipse cx="100" cy="106" rx="46" ry="48" fill={p.c3} stroke={p.ink} strokeWidth="4" />
      <circle cx="58" cy="60" r="14" fill={p.c3} stroke={p.ink} strokeWidth="4" /><circle cx="142" cy="60" r="14" fill={p.c3} stroke={p.ink} strokeWidth="4" />
      <circle cx="82" cy="96" r="7" fill={p.ink} /><circle cx="118" cy="96" r="7" fill={p.ink} />
      <ellipse cx="100" cy="128" rx="22" ry="16" fill={p.light} /><path d="M90 114 H110 L100 126 Z" fill={p.ink} strokeLinejoin="round" />
      <path d="M100 126 V134 M88 138 Q100 146 112 138" fill="none" stroke={p.ink} strokeWidth="4" strokeLinecap="round" />
    </g>
  ),
  elephant: (p, f) => (
    <g>
      <ellipse cx="38" cy="96" rx="32" ry="48" fill={d(p.c2)} stroke={p.ink} strokeWidth="5" /><ellipse cx="162" cy="96" rx="32" ry="48" fill={d(p.c2)} stroke={p.ink} strokeWidth="5" />
      <ellipse cx="100" cy="90" rx="52" ry="60" fill={p.c2} stroke={p.ink} strokeWidth="5" />
      <path d="M84 120 Q84 174 104 178 Q124 180 120 160" fill="none" stroke={p.c2} strokeWidth="26" strokeLinecap="round" transform={`rotate(${Math.sin(f * 0.1) * 3} 100 120)`} />
      <path d="M84 120 Q84 174 104 178 Q124 180 120 160" fill="none" stroke={p.ink} strokeWidth="5" strokeLinecap="round" opacity="0.5" transform={`rotate(${Math.sin(f * 0.1) * 3} 100 120)`} />
      <circle cx="78" cy="80" r="7" fill={p.ink} /><circle cx="122" cy="80" r="7" fill={p.ink} />
      <path d="M70 118 Q58 144 66 160 Q78 150 80 128 Z M130 118 Q142 144 134 160 Q122 150 120 128 Z" fill={p.light} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" />
    </g>
  ),
  turtle: (p, f) => (
    <g>
      <ellipse cx="40" cy="116" rx="20" ry="16" fill={p.c3} stroke={p.ink} strokeWidth="4" /><circle cx="34" cy="112" r="3" fill={p.ink} />
      {[60, 136].map((x) => <rect key={x} x={x} y="140" width="26" height="30" rx="10" fill={p.c3} stroke={p.ink} strokeWidth="4" transform={`rotate(${Math.sin(f * 0.15 + x) * 6} ${x + 13} 140)`} />)}
      <path d="M170 128 L190 140 L168 140 Z" fill={p.c3} stroke={p.ink} strokeWidth="3" strokeLinejoin="round" />
      <path d="M52 140 Q52 54 112 54 Q172 54 172 140 Z" fill={p.c2} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d="M112 66 L138 82 V110 L112 124 L86 110 V82 Z" fill={d(p.c2)} stroke={p.ink} strokeWidth="3" strokeLinejoin="round" /><path d="M86 82 L66 90 M138 82 L158 90 M86 110 L66 130 M138 110 L158 130 M112 66 V54 M112 124 V140" stroke={p.ink} strokeWidth="3" />
    </g>
  ),
  butterfly: (p, f) => {
    const flap = 0.78 + 0.22 * Math.abs(Math.sin(f * 0.2));
    return (
      <g>
        <g transform={`translate(100 100) scale(${flap} 1) translate(-100 -100)`}>
          <path d="M100 96 C80 30 20 30 26 84 C28 110 70 112 100 100 Z" fill={p.c1} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" /><path d="M100 104 C76 114 36 124 50 156 C64 180 96 140 100 108 Z" fill={p.c3} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" />
          <path d="M100 96 C120 30 180 30 174 84 C172 110 130 112 100 100 Z" fill={p.c1} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" /><path d="M100 104 C124 114 164 124 150 156 C136 180 104 140 100 108 Z" fill={p.c3} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" />
          <circle cx="54" cy="72" r="8" fill={p.light} /><circle cx="146" cy="72" r="8" fill={p.light} />
        </g>
        <ellipse cx="100" cy="104" rx="7" ry="36" fill={p.ink} /><path d="M96 68 Q84 40 70 36 M104 68 Q116 40 130 36" fill="none" stroke={p.ink} strokeWidth="4" strokeLinecap="round" />
      </g>
    );
  },
  /* ---- Sports & gaming ---- */
  cricket: (p, f) => (
    <g>
      <g transform="rotate(-38 70 100)"><rect x="56" y="20" width="26" height="40" rx="6" fill={p.c4} stroke={p.ink} strokeWidth="4" /><path d="M48 60 H90 Q94 80 92 150 Q70 164 48 150 Q46 80 48 60 Z" fill={p.c3} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" /><line x1="69" y1="70" x2="69" y2="140" stroke={d(p.c3)} strokeWidth="4" /></g>
      <g transform={`translate(${Math.sin(f * 0.12) * 3} 0)`}><circle cx="146" cy="136" r="30" fill={p.c1} stroke={p.ink} strokeWidth="5" /><path d="M126 118 Q146 136 126 154 M166 118 Q146 136 166 154" fill="none" stroke={p.light} strokeWidth="4" strokeDasharray="6 5" /></g>
    </g>
  ),
  football: (p, f) => (
    <g transform={`rotate(${f * 0.8} 100 100)`}>
      <circle cx="100" cy="100" r="74" fill={p.light} stroke={p.ink} strokeWidth="6" />
      <polygon points="100,70 128,90 118,124 82,124 72,90" fill={p.ink} />
      <path d="M100 70 V28 M128 90 L166 76 M118 124 L142 158 M82 124 L58 158 M72 90 L34 76" stroke={p.ink} strokeWidth="5" />
      {[[100, 22, 0], [172, 74, 72], [146, 160, 144], [54, 160, 216], [28, 74, 288]].map(([x, y, r], i) => <polygon key={i} points="0,-14 14,-4 9,12 -9,12 -14,-4" fill={p.ink} transform={`translate(${x} ${y}) rotate(${r})`} />)}
    </g>
  ),
  gamepad: (p) => (
    <g>
      <path d="M52 56 H148 Q186 56 190 112 Q194 168 164 168 Q146 168 136 144 H64 Q54 168 36 168 Q6 168 10 112 Q14 56 52 56 Z" fill={p.c2} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <rect x="40" y="90" width="42" height="14" rx="4" fill={p.light} /><rect x="54" y="76" width="14" height="42" rx="4" fill={p.light} />
      <circle cx="140" cy="84" r="9" fill={p.c1} stroke={p.ink} strokeWidth="3" /><circle cx="162" cy="102" r="9" fill={p.c3} stroke={p.ink} strokeWidth="3" /><circle cx="118" cy="102" r="9" fill={p.c4} stroke={p.ink} strokeWidth="3" /><circle cx="140" cy="120" r="9" fill={p.light} stroke={p.ink} strokeWidth="3" />
      <circle cx="84" cy="130" r="10" fill={p.ink} opacity="0.6" /><circle cx="116" cy="130" r="10" fill={p.ink} opacity="0.6" />
    </g>
  ),
  medal: (p) => (
    <g>
      <path d="M58 14 L94 84 H66 L36 14 Z" fill={p.c1} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" /><path d="M142 14 L106 84 H134 L164 14 Z" fill={p.c2} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="100" cy="124" r="52" fill={p.c3} stroke={p.ink} strokeWidth="6" /><circle cx="100" cy="124" r="40" fill="none" stroke={d(p.c3)} strokeWidth="4" />
      <text x="100" y="146" textAnchor="middle" fontSize="60" fontWeight={900} fill={d(p.c3)} fontFamily="sans-serif">1</text>
    </g>
  ),
  glove: (p, f) => (
    <g transform={`rotate(${-12 + Math.sin(f * 0.15) * 3} 100 100)`}>
      <path d="M56 28 Q22 28 22 80 Q22 124 52 134 V164 H132 V134 Q172 126 172 80 Q172 26 120 26 Z" fill={p.c1} stroke={p.ink} strokeWidth="6" strokeLinejoin="round" />
      <path d="M52 134 H132" stroke={p.ink} strokeWidth="5" /><rect x="50" y="134" width="84" height="38" rx="6" fill={p.light} stroke={p.ink} strokeWidth="5" />
      <path d="M38 88 Q38 118 66 124" fill="none" stroke={d(p.c1)} strokeWidth="9" strokeLinecap="round" /><path d="M64 44 Q90 36 120 44" fill="none" stroke={l(p.c1)} strokeWidth="8" strokeLinecap="round" />
      {[0, 1, 2].map((i) => <line key={i} x1={72 + i * 18} y1="144" x2={72 + i * 18} y2="162" stroke={p.ink} strokeWidth="4" />)}
    </g>
  ),
  /* ---- Education & skills ---- */
  abc: (p, f) => (
    <g transform={`rotate(${Math.sin(f * 0.07) * 2} 100 100)`}>
      <rect x="22" y="32" width="156" height="136" rx="18" fill={p.c2} stroke={p.ink} strokeWidth="6" />
      <text x="100" y="116" textAnchor="middle" fontSize="84" fontWeight={900} fill={p.light} fontFamily="sans-serif">Aa</text>
      <text x="100" y="152" textAnchor="middle" fontSize="28" fontWeight={900} fill={p.c3} fontFamily="sans-serif" letterSpacing="6">BCD</text>
    </g>
  ),
  pencil: (p, f) => (
    <g transform={`rotate(${45 + Math.sin(f * 0.1) * 2} 100 100)`}>
      <rect x="82" y="14" width="36" height="26" rx="8" fill={p.c1} stroke={p.ink} strokeWidth="5" /><rect x="82" y="40" width="36" height="12" fill={p.light} stroke={p.ink} strokeWidth="4" />
      <rect x="82" y="52" width="36" height="92" fill={p.c3} stroke={p.ink} strokeWidth="5" /><line x1="100" y1="54" x2="100" y2="142" stroke={d(p.c3)} strokeWidth="4" />
      <path d="M82 144 H118 L100 184 Z" fill={SKIN} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" /><path d="M93 166 H107 L100 184 Z" fill={p.ink} />
    </g>
  ),
  gradcap: (p, f) => (
    <g>
      <path d="M52 92 V128 Q100 160 148 128 V92 L100 112 Z" fill={d(p.ink)} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" />
      <path d="M100 38 L186 78 L100 118 L14 78 Z" fill={p.ink} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" /><path d="M100 48 L166 78 L100 108 Z" fill={d(p.c2)} opacity="0.55" />
      <path d="M100 78 L158 94 V140" fill="none" stroke={p.c3} strokeWidth="6" strokeLinecap="round" /><g transform={`rotate(${Math.sin(f * 0.15) * 6} 158 140)`}><circle cx="158" cy="144" r="8" fill={p.c3} /><path d="M152 148 L148 170 M158 150 V172 M164 148 L168 170" stroke={p.c3} strokeWidth="4" strokeLinecap="round" /></g>
    </g>
  ),
  briefcase: (p) => (
    <g>
      <path d="M72 62 V46 Q72 36 82 36 H118 Q128 36 128 46 V62" fill="none" stroke={p.ink} strokeWidth="10" />
      <rect x="18" y="60" width="164" height="110" rx="14" fill={p.c4} stroke={p.ink} strokeWidth="5" />
      <path d="M18 112 H182" stroke={p.ink} strokeWidth="5" /><rect x="86" y="102" width="28" height="24" rx="5" fill={p.c3} stroke={p.ink} strokeWidth="4" />
      <rect x="18" y="60" width="164" height="36" rx="14" fill={l(p.c4)} opacity="0.35" />
    </g>
  ),
  document: (p, f) => (
    <g>
      <path d="M44 20 H122 L160 58 V176 H44 Z" fill={p.light} stroke={p.ink} strokeWidth="6" strokeLinejoin="round" /><path d="M122 20 V58 H160" fill={d(p.light)} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      {[84, 104, 124].map((y, i) => <rect key={y} x="62" y={y} width={78 - i * 14} height="8" rx="4" fill={p.c2} opacity="0.7" />)}
      <circle cx="132" cy="148" r={20 + Math.sin(f * 0.15) * 1.5} fill={p.c1} /><path d="M122 148 L130 156 L144 140" fill="none" stroke={p.light} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  /* ---- Art & creativity ---- */
  palette: (p) => (
    <g>
      <path d="M100 24 C44 24 14 64 18 110 C22 156 64 178 98 170 C118 166 110 148 124 144 C144 138 160 154 176 132 C196 100 170 24 100 24 Z" fill={p.light} stroke={p.ink} strokeWidth="6" strokeLinejoin="round" />
      <circle cx="54" cy="130" r="13" fill={p.ink} opacity="0.55" />
      {[[70, 64, p.c1], [108, 50, p.c3], [144, 70, p.c2], [48, 92, p.c4]].map(([x, y, c], i) => <circle key={i} cx={Number(x)} cy={Number(y)} r="14" fill={String(c)} stroke={p.ink} strokeWidth="3" />)}
    </g>
  ),
  brush: (p, f) => (
    <g>
      <path d="M20 168 q24 -14 46 0 t46 0 t46 0 t24 0" fill="none" stroke={p.c1} strokeWidth="12" strokeLinecap="round" opacity="0.85" strokeDasharray="260" strokeDashoffset={Math.max(0, 260 - ((f * 6) % 340))} />
      <g transform={`rotate(${40 + Math.sin(f * 0.1) * 3} 100 90)`}>
        <rect x="90" y="14" width="20" height="82" rx="8" fill={p.c3} stroke={p.ink} strokeWidth="5" />
        <rect x="86" y="94" width="28" height="22" rx="4" fill={p.light} stroke={p.ink} strokeWidth="5" />
        <path d="M86 116 H114 Q116 150 100 164 Q84 150 86 116 Z" fill={p.c1} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      </g>
    </g>
  ),
  cube: (p, f) => (
    <g transform={`translate(0 ${Math.sin(f * 0.08) * 4})`}>
      <polygon points="100,22 172,62 100,102 28,62" fill={l(p.c1)} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <polygon points="28,62 100,102 100,182 28,142" fill={p.c1} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <polygon points="172,62 100,102 100,182 172,142" fill={d(p.c1)} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
    </g>
  ),
  pen: (p) => (
    <g>
      <path d="M100 20 L146 94 L100 176 L54 94 Z" fill={p.c2} stroke={p.ink} strokeWidth="6" strokeLinejoin="round" />
      <path d="M100 20 L146 94 H54 Z" fill={l(p.c2)} /><path d="M100 94 V176" stroke={p.ink} strokeWidth="5" /><circle cx="100" cy="100" r="10" fill={p.light} stroke={p.ink} strokeWidth="4" />
      <rect x="62" y="176" width="76" height="14" rx="5" fill={p.ink} />
    </g>
  ),
  sofa: (p) => (
    <g>
      <rect x="34" y="52" width="132" height="62" rx="16" fill={p.c1} stroke={p.ink} strokeWidth="5" />
      <rect x="14" y="88" width="36" height="66" rx="14" fill={d(p.c1)} stroke={p.ink} strokeWidth="5" /><rect x="150" y="88" width="36" height="66" rx="14" fill={d(p.c1)} stroke={p.ink} strokeWidth="5" />
      <rect x="44" y="102" width="112" height="44" rx="10" fill={l(p.c1)} stroke={p.ink} strokeWidth="5" /><line x1="100" y1="104" x2="100" y2="144" stroke={p.ink} strokeWidth="4" />
      <rect x="28" y="154" width="10" height="20" rx="3" fill={p.ink} /><rect x="162" y="154" width="10" height="20" rx="3" fill={p.ink} />
      <rect x="60" y="62" width="22" height="26" rx="6" fill={p.c3} transform="rotate(-8 71 75)" />
    </g>
  ),
  scissors: (p, f) => {
    const o = 12 + Math.abs(Math.sin(f * 0.12)) * 10; // blades khulte-band hote hain
    const half = (side: number, c: string) => (
      <g transform={`rotate(${side * o} 100 104)`}>
        <path d="M88 108 L100 10 L114 108 Z" fill={p.light} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
        <line x1="100" y1="104" x2="100" y2="146" stroke={p.ink} strokeWidth="10" strokeLinecap="round" />
        <circle cx="100" cy="164" r="19" fill="none" stroke={c} strokeWidth="12" />
      </g>
    );
    return <g>{half(1, p.c1)}{half(-1, p.c2)}<circle cx="100" cy="104" r="8" fill={p.ink} /><circle cx="100" cy="104" r="3" fill={p.light} /></g>;
  },
  hanger: (p) => (
    <g>
      <path d="M100 38 V30 Q100 16 112 18 Q124 20 120 32" fill="none" stroke={p.ink} strokeWidth="7" strokeLinecap="round" />
      <path d="M100 38 L20 94 H180 Z" fill="none" stroke={p.ink} strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M58 98 L26 128 L46 146 L60 132 V182 H140 V132 L154 146 L174 128 L142 98 Q100 118 58 98 Z" fill={p.c1} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      {[0, 1, 2].map((i) => <circle key={i} cx={84 + i * 16} cy={150 + (i % 2) * 14} r="4" fill={p.light} opacity="0.9" />)}
    </g>
  ),
  sparkle: (p, f) => {
    const s = (x: number, y: number, r: number, c: string, k: number) => <path key={k} d={`M${x} ${y - r} Q${x + r * 0.12} ${y - r * 0.12} ${x + r} ${y} Q${x + r * 0.12} ${y + r * 0.12} ${x} ${y + r} Q${x - r * 0.12} ${y + r * 0.12} ${x - r} ${y} Q${x - r * 0.12} ${y - r * 0.12} ${x} ${y - r} Z`} fill={c} transform={`rotate(${Math.sin(f * 0.1 + k) * 12} ${x} ${y}) scale(${0.9 + 0.1 * Math.sin(f * 0.2 + k)})`} style={{transformOrigin: `${x}px ${y}px`}} />;
    return <g>{s(98, 102, 66, p.c3, 0)}{s(160, 40, 26, p.c1, 1)}{s(40, 52, 20, p.c2, 2)}{s(154, 154, 22, p.c1, 3)}</g>;
  },
};
