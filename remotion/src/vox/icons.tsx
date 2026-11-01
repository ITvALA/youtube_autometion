import React from "react";
import {VoxPal, shade} from "./types";

/*
 * VOX ICON LIBRARY: flat illustrations, 200x200 viewBox, sab SVG code me (koi image/API nahi).
 * Har icon palette (p) ke colours use karta hai, f = frame (halki idle motion ke liye).
 */
type IconFn = (p: VoxPal, f: number) => React.ReactNode;
const d = (c: string) => shade(c, 0.78);
const l = (c: string) => shade(c, 1.35);

const coin = (cx: number, cy: number, r: number, c: string, sym = "₹") => (
  <g>
    <ellipse cx={cx} cy={cy + r * 0.18} rx={r} ry={r * 0.42} fill={d(c)} />
    <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.42} fill={c} />
    <ellipse cx={cx} cy={cy} rx={r * 0.7} ry={r * 0.27} fill="none" stroke={d(c)} strokeWidth={r * 0.07} />
    <text x={cx} y={cy + r * 0.13} textAnchor="middle" fontSize={r * 0.42} fontWeight={900} fill={d(c)} fontFamily="sans-serif">{sym}</text>
  </g>
);

export const ICONS: Record<string, IconFn> = {
  coins: (p) => (
    <g>
      {coin(100, 150, 56, p.c3)}{coin(100, 128, 56, l(p.c3))}{coin(100, 106, 56, p.c3)}
      <g transform="translate(150 70) rotate(-12)"><circle r="34" fill={d(p.c3)} /><circle r="30" fill={l(p.c3)} /><circle r="22" fill="none" stroke={d(p.c3)} strokeWidth="3" /><text y="9" textAnchor="middle" fontSize="26" fontWeight={900} fill={d(p.c3)} fontFamily="sans-serif">₹</text></g>
    </g>
  ),
  money: (p) => (
    <g>
      <rect x="24" y="56" width="152" height="90" rx="8" fill={d(p.c2)} transform="rotate(-6 100 100)" />
      <rect x="24" y="56" width="152" height="90" rx="8" fill={p.c2} />
      <rect x="34" y="66" width="132" height="70" rx="4" fill="none" stroke={l(p.c2)} strokeWidth="3" />
      <circle cx="100" cy="101" r="26" fill={l(p.c2)} /><text x="100" y="112" textAnchor="middle" fontSize="34" fontWeight={900} fill={d(p.c2)} fontFamily="sans-serif">₹</text>
      <circle cx="48" cy="101" r="7" fill={l(p.c2)} /><circle cx="152" cy="101" r="7" fill={l(p.c2)} />
    </g>
  ),
  bag: (p) => (
    <g>
      <path d="M72 52 Q100 20 128 52 L120 66 L80 66 Z" fill={d(p.c3)} />
      <path d="M62 66 H138 Q176 110 156 156 Q100 176 44 156 Q24 110 62 66 Z" fill={p.c3} />
      <path d="M62 66 H138" stroke={d(p.c3)} strokeWidth="8" strokeLinecap="round" />
      <text x="100" y="134" textAnchor="middle" fontSize="60" fontWeight={900} fill={d(p.c3)} fontFamily="sans-serif">₹</text>
    </g>
  ),
  chartUp: (p) => (
    <g>
      <rect x="28" y="120" width="30" height="44" rx="3" fill={p.c2} /><rect x="70" y="96" width="30" height="68" rx="3" fill={p.c2} />
      <rect x="112" y="70" width="30" height="94" rx="3" fill={p.c2} /><rect x="154" y="40" width="30" height="124" rx="3" fill={p.c1} />
      <path d="M26 110 L84 76 L116 92 L172 26" fill="none" stroke={p.ink} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M150 24 L174 24 L174 48" fill="none" stroke={p.ink} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="20" y="168" width="170" height="6" rx="3" fill={d(p.c2)} />
    </g>
  ),
  chartDown: (p) => (
    <g>
      <rect x="28" y="40" width="30" height="124" rx="3" fill={p.c2} /><rect x="70" y="70" width="30" height="94" rx="3" fill={p.c2} />
      <rect x="112" y="100" width="30" height="64" rx="3" fill={p.c2} /><rect x="154" y="128" width="30" height="36" rx="3" fill={p.c1} />
      <path d="M26 30 L84 66 L116 52 L172 116" fill="none" stroke={p.ink} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M150 118 L174 118 L174 94" fill="none" stroke={p.ink} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="20" y="168" width="170" height="6" rx="3" fill={d(p.c2)} />
    </g>
  ),
  pie: (p) => (
    <g>
      <circle cx="100" cy="104" r="68" fill={p.c2} />
      <path d="M100 104 L100 36 A68 68 0 0 1 164 126 Z" fill={p.c1} />
      <path d="M100 104 L164 126 A68 68 0 0 1 80 170 Z" fill={p.c3} />
      <circle cx="100" cy="104" r="68" fill="none" stroke={p.ink} strokeWidth="5" />
    </g>
  ),
  brain: (p, f) => (
    <g transform={`translate(0 ${Math.sin(f * 0.08) * 2})`}>
      <path d="M100 46 C80 28 40 40 44 76 C22 86 26 120 46 128 C44 154 76 168 100 152 C124 168 156 154 154 128 C174 120 178 86 156 76 C160 40 120 28 100 46 Z" fill={p.c1} />
      <path d="M100 46 V152" stroke={d(p.c1)} strokeWidth="5" />
      <path d="M72 70 C60 76 62 92 76 94 M72 112 C60 116 64 132 78 130 M128 70 C140 76 138 92 124 94 M128 112 C140 116 136 132 122 130" fill="none" stroke={d(p.c1)} strokeWidth="5" strokeLinecap="round" />
    </g>
  ),
  bulb: (p, f) => (
    <g>
      {[0, 1, 2, 3, 4].map((i) => <line key={i} x1="100" y1="22" x2="100" y2="6" stroke={p.c3} strokeWidth="7" strokeLinecap="round" transform={`rotate(${-80 + i * 40} 100 84)`} opacity={0.6 + 0.4 * Math.sin(f * 0.15 + i)} />)}
      <path d="M100 30 C60 30 46 70 66 98 C76 112 76 120 76 128 H124 C124 120 124 112 134 98 C154 70 140 30 100 30 Z" fill={p.c3} />
      <rect x="76" y="132" width="48" height="12" rx="4" fill={p.ink} /><rect x="82" y="148" width="36" height="12" rx="4" fill={p.ink} />
      <path d="M86 100 L96 76 L106 100 L116 76" fill="none" stroke={d(p.c3)} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  book: (p) => (
    <g>
      <path d="M100 52 C76 36 44 38 24 46 V150 C44 142 76 140 100 156 Z" fill={p.c2} />
      <path d="M100 52 C124 36 156 38 176 46 V150 C156 142 124 140 100 156 Z" fill={l(p.c2)} />
      <path d="M100 52 V156" stroke={d(p.c2)} strokeWidth="5" />
      {[66, 82, 98].map((y) => <g key={y}><path d={`M38 ${y} Q66 ${y - 6} 88 ${y + 6}`} stroke={d(p.c2)} strokeWidth="4" fill="none" strokeLinecap="round" /><path d={`M112 ${y + 6} Q134 ${y - 6} 162 ${y}`} stroke={p.c2} strokeWidth="4" fill="none" strokeLinecap="round" /></g>)}
      <path d="M20 154 C44 146 76 144 100 160 C124 144 156 146 180 154" fill="none" stroke={p.ink} strokeWidth="6" strokeLinecap="round" />
    </g>
  ),
  clock: (p, f) => (
    <g>
      <circle cx="100" cy="104" r="70" fill={p.light} stroke={p.ink} strokeWidth="9" />
      {Array.from({length: 12}, (_, i) => <line key={i} x1="100" y1="46" x2="100" y2={i % 3 === 0 ? 58 : 52} stroke={p.ink} strokeWidth={i % 3 === 0 ? 6 : 3} strokeLinecap="round" transform={`rotate(${i * 30} 100 104)`} />)}
      <line x1="100" y1="104" x2="100" y2="62" stroke={p.c1} strokeWidth="7" strokeLinecap="round" transform={`rotate(${f * 3} 100 104)`} />
      <line x1="100" y1="104" x2="100" y2="76" stroke={p.ink} strokeWidth="8" strokeLinecap="round" transform={`rotate(${f * 0.25 + 40} 100 104)`} />
      <circle cx="100" cy="104" r="7" fill={p.c1} />
    </g>
  ),
  hourglass: (p, f) => (
    <g>
      <rect x="44" y="26" width="112" height="12" rx="5" fill={p.ink} /><rect x="44" y="168" width="112" height="12" rx="5" fill={p.ink} />
      <path d="M56 38 H144 C144 80 112 92 112 104 C112 116 144 128 144 168 H56 C56 128 88 116 88 104 C88 92 56 80 56 38 Z" fill={p.light} stroke={p.ink} strokeWidth="6" strokeLinejoin="round" />
      <path d="M66 44 H134 C132 66 112 80 100 84 C88 80 68 66 66 44 Z" fill={p.c3} transform={`translate(0 ${(f % 90) * 0.1})`} />
      <path d="M100 104 V156" stroke={p.c3} strokeWidth="4" strokeDasharray="4 5" /><path d="M64 166 Q100 128 136 166 Z" fill={p.c3} />
    </g>
  ),
  person: (p) => (
    <g>
      <circle cx="100" cy="50" r="26" fill="#F2C29B" /><path d="M74 46 Q76 22 100 22 Q124 22 126 46 Q112 36 100 38 Q86 36 74 46 Z" fill={p.ink} />
      <path d="M52 172 C52 112 72 84 100 84 C128 84 148 112 148 172 Z" fill={p.c1} />
      <path d="M100 84 L100 172" stroke={d(p.c1)} strokeWidth="4" /><path d="M84 84 L100 104 L116 84" fill={p.light} />
    </g>
  ),
  people: (p) => (
    <g>
      {[[52, p.c2], [148, p.c3], [100, p.c1]].map(([x, c], i) => (
        <g key={i} transform={`translate(${Number(x) - 100} ${i === 2 ? 0 : 14})`}>
          <circle cx="100" cy="68" r="22" fill="#F2C29B" /><path d="M80 64 Q82 44 100 44 Q118 44 120 64 Q108 56 100 58 Q92 56 80 64 Z" fill={p.ink} />
          <path d="M62 170 C62 120 78 100 100 100 C122 100 138 120 138 170 Z" fill={String(c)} />
        </g>
      ))}
    </g>
  ),
  building: (p) => (
    <g>
      <rect x="22" y="90" width="52" height="82" fill={p.c2} /><rect x="78" y="40" width="58" height="132" fill={p.c1} /><rect x="140" y="76" width="44" height="96" fill={d(p.c2)} />
      {[52, 72, 92, 112, 132].map((y) => <g key={y}><rect x="88" y={y} width="12" height="10" fill={p.light} /><rect x="112" y={y} width="12" height="10" fill={p.light} /></g>)}
      {[104, 124, 144].map((y) => <g key={y}><rect x="32" y={y} width="10" height="10" fill={p.light} /><rect x="52" y={y} width="10" height="10" fill={p.light} /><rect x="150" y={y - 14} width="10" height="10" fill={p.light} /><rect x="166" y={y - 14} width="10" height="10" fill={p.light} /></g>)}
      <rect x="14" y="170" width="180" height="8" rx="4" fill={p.ink} />
    </g>
  ),
  house: (p) => (
    <g>
      <path d="M100 26 L178 94 H162 V168 H38 V94 H22 Z" fill={p.c2} /><path d="M100 26 L178 94 H22 Z" fill={p.c1} />
      <rect x="84" y="116" width="32" height="52" rx="3" fill={p.ink} /><rect x="48" y="108" width="26" height="26" fill={p.light} /><rect x="126" y="108" width="26" height="26" fill={p.light} />
      <rect x="14" y="166" width="172" height="8" rx="4" fill={d(p.c2)} />
    </g>
  ),
  phone: (p, f) => (
    <g>
      <rect x="62" y="16" width="76" height="168" rx="16" fill={p.ink} /><rect x="70" y="32" width="60" height="136" rx="6" fill={p.light} />
      <rect x="78" y="42" width="44" height="30" rx="4" fill={p.c1} />
      {[84, 100, 116, 132].map((y, i) => <rect key={y} x="78" y={y} width={44 - i * 6} height="8" rx="4" fill={i % 2 ? p.c2 : p.c3} />)}
      <circle cx="100" cy="176" r="3" fill={p.light} />
      <circle cx="142" cy="30" r={9 + Math.sin(f * 0.2) * 2} fill={p.c1} />
    </g>
  ),
  laptop: (p) => (
    <g>
      <rect x="38" y="40" width="124" height="88" rx="8" fill={p.ink} /><rect x="46" y="48" width="108" height="72" rx="3" fill={p.light} />
      <rect x="54" y="58" width="40" height="8" rx="4" fill={p.c1} /><rect x="54" y="74" width="70" height="6" rx="3" fill={p.c2} /><rect x="54" y="88" width="56" height="6" rx="3" fill={p.c3} /><rect x="54" y="102" width="80" height="6" rx="3" fill={p.c2} />
      <path d="M22 134 H178 L168 156 H32 Z" fill={d(p.light)} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
    </g>
  ),
  heart: (p, f) => (
    <g transform={`translate(100 100) scale(${1 + Math.sin(f * 0.18) * 0.05}) translate(-100 -100)`}>
      <path d="M100 168 C34 122 22 82 42 56 C62 34 90 44 100 66 C110 44 138 34 158 56 C178 82 166 122 100 168 Z" fill={p.c1} />
      <path d="M58 68 C66 56 80 56 86 64" fill="none" stroke={l(p.c1)} strokeWidth="7" strokeLinecap="round" />
    </g>
  ),
  target: (p) => (
    <g>
      <circle cx="96" cy="108" r="68" fill={p.c1} /><circle cx="96" cy="108" r="50" fill={p.light} /><circle cx="96" cy="108" r="34" fill={p.c1} /><circle cx="96" cy="108" r="18" fill={p.light} /><circle cx="96" cy="108" r="8" fill={p.c1} />
      <line x1="100" y1="104" x2="170" y2="34" stroke={p.ink} strokeWidth="7" strokeLinecap="round" /><path d="M160 24 L180 24 L180 44 Z" fill={p.ink} /><path d="M150 40 L168 56 L180 44 L164 28 Z" fill={p.c3} />
    </g>
  ),
  rocket: (p, f) => (
    <g transform={`translate(0 ${Math.sin(f * 0.15) * 3}) rotate(40 100 100)`}>
      <path d="M100 10 C128 40 130 90 118 130 H82 C70 90 72 40 100 10 Z" fill={p.light} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <circle cx="100" cy="70" r="14" fill={p.c2} stroke={p.ink} strokeWidth="5" />
      <path d="M82 104 L56 140 L82 130 Z M118 104 L144 140 L118 130 Z" fill={p.c1} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d="M88 134 Q100 190 112 134 Z" fill={p.c3} />
    </g>
  ),
  lock: (p) => (
    <g>
      <path d="M62 90 V68 C62 40 138 40 138 68 V90" fill="none" stroke={p.ink} strokeWidth="14" strokeLinecap="round" />
      <rect x="40" y="86" width="120" height="86" rx="14" fill={p.c3} /><circle cx="100" cy="124" r="11" fill={p.ink} /><rect x="95" y="128" width="10" height="26" rx="4" fill={p.ink} />
    </g>
  ),
  trophy: (p) => (
    <g>
      <path d="M58 30 H142 V78 C142 108 122 124 100 124 C78 124 58 108 58 78 Z" fill={p.c3} />
      <path d="M58 44 H34 C34 76 46 88 62 92 M142 44 H166 C166 76 154 88 138 92" fill="none" stroke={p.c3} strokeWidth="10" strokeLinecap="round" />
      <rect x="90" y="122" width="20" height="28" fill={d(p.c3)} /><rect x="62" y="148" width="76" height="22" rx="6" fill={p.ink} />
      <path d="M78 44 V74" stroke={l(p.c3)} strokeWidth="8" strokeLinecap="round" />
    </g>
  ),
  gear: (p, f) => (
    <g transform={`rotate(${f * 0.8} 100 100)`}>
      {Array.from({length: 8}, (_, i) => <rect key={i} x="88" y="14" width="24" height="34" rx="5" fill={p.c2} transform={`rotate(${i * 45} 100 100)`} />)}
      <circle cx="100" cy="100" r="62" fill={p.c2} /><circle cx="100" cy="100" r="26" fill={p.light} />
    </g>
  ),
  shield: (p) => (
    <g>
      <path d="M100 18 L168 42 V96 C168 140 134 164 100 180 C66 164 32 140 32 96 V42 Z" fill={p.c2} />
      <path d="M100 18 L168 42 V96 C168 140 134 164 100 180 Z" fill={d(p.c2)} />
      <path d="M68 98 L92 122 L136 74" fill="none" stroke={p.light} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  fire: (p, f) => (
    <g transform={`translate(100 180) scale(${1 + Math.sin(f * 0.3) * 0.03} ${1 + Math.sin(f * 0.25) * 0.05}) translate(-100 -180)`}>
      <path d="M100 14 C112 54 158 72 152 122 C148 156 126 176 100 176 C74 176 52 156 50 124 C48 98 66 90 74 70 C86 84 88 96 96 98 C94 64 90 40 100 14 Z" fill={p.c1} />
      <path d="M100 96 C108 116 130 124 126 146 C124 164 112 172 100 172 C86 172 76 162 76 148 C76 132 92 124 100 96 Z" fill={p.c3} />
    </g>
  ),
  plant: (p, f) => (
    <g>
      <path d="M70 170 H130 L122 128 H78 Z" fill={p.c1} /><rect x="66" y="120" width="68" height="14" rx="5" fill={d(p.c1)} />
      <path d="M100 124 C100 90 100 70 100 50" stroke={d(p.c2)} strokeWidth="7" fill="none" strokeLinecap="round" />
      <g transform={`rotate(${Math.sin(f * 0.1) * 3} 100 124)`}>
        <path d="M100 96 C70 96 50 72 52 44 C82 44 100 66 100 96 Z" fill={p.c2} /><path d="M100 70 C128 70 150 50 148 22 C118 22 100 44 100 70 Z" fill={l(p.c2)} />
      </g>
    </g>
  ),
  sun: (p, f) => (
    <g>
      <g transform={`rotate(${f * 0.5} 100 100)`}>{Array.from({length: 12}, (_, i) => <rect key={i} x="94" y="14" width="12" height="28" rx="6" fill={p.c3} transform={`rotate(${i * 30} 100 100)`} />)}</g>
      <circle cx="100" cy="100" r="46" fill={p.c3} /><circle cx="100" cy="100" r="46" fill="none" stroke={d(p.c3)} strokeWidth="5" />
    </g>
  ),
  calendar: (p) => (
    <g>
      <rect x="28" y="38" width="144" height="134" rx="14" fill={p.light} stroke={p.ink} strokeWidth="7" />
      <path d="M28 52 Q28 38 42 38 H158 Q172 38 172 52 V82 H28 Z" fill={p.c1} />
      <rect x="60" y="22" width="12" height="30" rx="6" fill={p.ink} /><rect x="128" y="22" width="12" height="30" rx="6" fill={p.ink} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={44 + (i % 4) * 30} y={98 + Math.floor(i / 4) * 32} width="20" height="20" rx="4" fill={i === 5 ? p.c1 : p.c2} opacity={i === 5 ? 1 : 0.55} />)}
    </g>
  ),
  megaphone: (p, f) => (
    <g>
      <path d="M34 80 H70 L146 36 V164 L70 120 H34 Z" fill={p.c1} /><rect x="22" y="80" width="20" height="40" rx="6" fill={p.ink} /><path d="M52 120 L62 168 H82 L76 124 Z" fill={d(p.c1)} />
      {[0, 1, 2].map((i) => <path key={i} d={`M${160 + i * 10} ${78 - i * 12} Q${176 + i * 10} 100 ${160 + i * 10} ${122 + i * 12}`} fill="none" stroke={p.c3} strokeWidth="6" strokeLinecap="round" opacity={0.5 + 0.5 * Math.sin(f * 0.2 - i)} />)}
    </g>
  ),
  magnifier: (p) => (
    <g>
      <circle cx="84" cy="84" r="52" fill={p.light} stroke={p.ink} strokeWidth="12" /><circle cx="84" cy="84" r="40" fill={p.c2} opacity="0.35" />
      <path d="M62 66 Q72 52 90 54" stroke={p.light} strokeWidth="7" fill="none" strokeLinecap="round" /><line x1="124" y1="124" x2="174" y2="174" stroke={p.ink} strokeWidth="20" strokeLinecap="round" />
    </g>
  ),
  scale: (p) => (
    <g>
      <rect x="94" y="30" width="12" height="130" fill={p.ink} /><rect x="58" y="158" width="84" height="14" rx="6" fill={p.ink} /><rect x="30" y="48" width="140" height="10" rx="5" fill={p.ink} />
      <path d="M40 58 L18 114 H62 Z M160 58 L138 114 H182 Z" fill="none" stroke={p.ink} strokeWidth="4" />
      <path d="M14 114 H66 Q40 142 14 114 Z" fill={p.c1} /><path d="M134 114 H186 Q160 142 134 114 Z" fill={p.c2} />
    </g>
  ),
  steps: (p, f) => (
    <g>
      <path d="M16 170 V138 H58 V106 H100 V74 H142 V42 H184 V170 Z" fill={p.c2} />
      <path d="M16 138 H58 V106 H100 V74 H142 V42 H184" fill="none" stroke={d(p.c2)} strokeWidth="6" strokeLinejoin="round" />
      <g transform={`translate(0 ${Math.sin(f * 0.15) * 2})`}><line x1="164" y1="42" x2="164" y2="8" stroke={p.ink} strokeWidth="5" /><path d="M164 8 L192 18 L164 28 Z" fill={p.c1} /></g>
    </g>
  ),
  check: (p) => (
    <g><circle cx="100" cy="100" r="70" fill={p.c2} /><path d="M62 102 L90 130 L142 74" fill="none" stroke={p.light} strokeWidth="18" strokeLinecap="round" strokeLinejoin="round" /></g>
  ),
  cross: (p) => (
    <g><circle cx="100" cy="100" r="70" fill={p.c1} /><path d="M70 70 L130 130 M130 70 L70 130" fill="none" stroke={p.light} strokeWidth="18" strokeLinecap="round" /></g>
  ),
  question: (p, f) => (
    <g transform={`rotate(${Math.sin(f * 0.1) * 4} 100 100)`}>
      <circle cx="100" cy="100" r="72" fill={p.c3} />
      <text x="100" y="140" textAnchor="middle" fontSize="116" fontWeight={900} fill={p.ink} fontFamily="sans-serif">?</text>
    </g>
  ),
  arrow: (p) => (
    <g><path d="M20 78 H110 V44 L184 100 L110 156 V122 H20 Z" fill={p.c1} /><path d="M110 44 L184 100 L110 156 Z" fill={d(p.c1)} opacity="0.35" /></g>
  ),
  globe: (p, f) => (
    <g>
      <circle cx="100" cy="100" r="72" fill={p.c2} />
      <g transform={`translate(${((f * 0.4) % 160) - 40} 0)`}><path d="M30 74 Q50 56 70 70 Q80 90 60 100 Q44 96 30 74 Z M96 110 Q122 98 134 126 Q120 150 100 140 Z M110 52 Q130 40 148 56 Q140 74 116 70 Z" fill={p.c3} /></g>
      <circle cx="100" cy="100" r="72" fill="none" stroke={p.ink} strokeWidth="7" />
      <ellipse cx="100" cy="100" rx="30" ry="72" fill="none" stroke={p.ink} strokeWidth="3" opacity="0.5" /><line x1="28" y1="100" x2="172" y2="100" stroke={p.ink} strokeWidth="3" opacity="0.5" />
    </g>
  ),
  chat: (p) => (
    <g>
      <path d="M26 38 H128 Q142 38 142 52 V102 Q142 116 128 116 H74 L46 140 V116 H40 Q26 116 26 102 Z" fill={p.c2} />
      <path d="M72 84 H170 Q184 84 184 98 V140 Q184 154 170 154 H162 V178 L136 154 H86 Q72 154 72 140 Z" fill={p.c1} />
      {[0, 1, 2].map((i) => <circle key={i} cx={62 + i * 22} cy="78" r="6" fill={p.light} />)}<rect x="96" y="108" width="62" height="7" rx="3" fill={p.light} /><rect x="96" y="124" width="42" height="7" rx="3" fill={p.light} />
    </g>
  ),
  dumbbell: (p) => (
    <g transform="rotate(-20 100 100)">
      <rect x="52" y="92" width="96" height="16" rx="6" fill={p.ink} />
      <rect x="30" y="66" width="22" height="68" rx="6" fill={p.c1} /><rect x="148" y="66" width="22" height="68" rx="6" fill={p.c1} /><rect x="14" y="80" width="16" height="40" rx="5" fill={p.ink} /><rect x="170" y="80" width="16" height="40" rx="5" fill={p.ink} />
    </g>
  ),
  coffee: (p, f) => (
    <g>
      {[0, 1, 2].map((i) => <path key={i} d={`M${72 + i * 22} 52 Q${64 + i * 22} 36 ${72 + i * 22} 22`} fill="none" stroke={p.c2} strokeWidth="6" strokeLinecap="round" opacity={0.35 + 0.35 * Math.sin(f * 0.15 + i * 2)} />)}
      <path d="M40 70 H150 V120 C150 150 130 168 96 168 C62 168 40 150 40 120 Z" fill={p.c1} /><path d="M150 82 H166 Q184 82 184 102 Q184 122 160 122 H148" fill="none" stroke={p.c1} strokeWidth="12" />
      <ellipse cx="95" cy="70" rx="55" ry="10" fill={d(p.c1)} /><rect x="30" y="172" width="130" height="9" rx="4" fill={p.ink} />
    </g>
  ),
  key: (p) => (
    <g transform="rotate(-30 100 100)">
      <circle cx="56" cy="100" r="34" fill={p.c3} /><circle cx="56" cy="100" r="14" fill={p.light} />
      <rect x="86" y="92" width="94" height="16" rx="5" fill={p.c3} /><rect x="146" y="106" width="14" height="24" rx="3" fill={p.c3} /><rect x="166" y="106" width="14" height="18" rx="3" fill={p.c3} />
    </g>
  ),
  battery: (p, f) => (
    <g>
      <rect x="24" y="62" width="140" height="82" rx="14" fill="none" stroke={p.ink} strokeWidth="9" /><rect x="168" y="86" width="16" height="34" rx="5" fill={p.ink} />
      {[0, 1, 2].map((i) => <rect key={i} x={36 + i * 40} y="74" width="32" height="58" rx="6" fill={i === 2 && f % 40 < 20 ? p.light : i === 0 ? p.c1 : p.c2} />)}
    </g>
  ),
  mountain: (p) => (
    <g>
      <path d="M12 170 L76 58 L112 112 L136 78 L188 170 Z" fill={p.c2} /><path d="M76 58 L98 96 L82 90 L72 100 L60 86 Z" fill={p.light} /><path d="M112 112 L136 78 L188 170 H130 Z" fill={d(p.c2)} />
      <line x1="76" y1="58" x2="76" y2="30" stroke={p.ink} strokeWidth="5" /><path d="M76 30 L104 40 L76 50 Z" fill={p.c1} />
    </g>
  ),
  moon: (p, f) => (
    <g>
      <path d="M130 30 C80 34 52 80 66 124 C80 168 130 182 168 150 C120 156 90 120 100 80 C106 58 118 42 130 30 Z" fill={p.c3} />
      {[[158, 54], [176, 92], [146, 100]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3 + Math.abs(Math.sin(f * 0.1 + i)) * 2.5} fill={p.ink} />)}
    </g>
  ),
  bars: (p) => (
    <g>
      {[[30, 90], [72, 56], [114, 120], [156, 36]].map(([x, y], i) => <rect key={i} x={x} y={y} width="30" height={170 - y} rx="4" fill={i === 3 ? p.c1 : p.c2} />)}
      <rect x="18" y="170" width="170" height="6" rx="3" fill={p.ink} />
    </g>
  ),
};

export const ICON_KEYS = Object.keys(ICONS);

/** Chhota helper: ek icon ko 200x200 SVG me draw karo. */
export const Icon: React.FC<{name: string; p: VoxPal; f: number; size: number}> = ({name, p, f, size}) => {
  const fn = ICONS[name] || ICONS.question;
  return <svg width={size} height={size} viewBox="0 0 200 200" style={{overflow: "visible", display: "block"}}>{fn(p, f)}</svg>;
};
