import React from "react";
import {VoxPal, shade} from "./types";

/* NICHE PACK 1: Lifestyle, Psychology, Stories, History, Science. 200x200 viewBox, flat style. */
type IconFn = (p: VoxPal, f: number) => React.ReactNode;
const d = (c: string) => shade(c, 0.78);
const l = (c: string) => shade(c, 1.35);
const SKIN = "#F2C29B";
const star5 = (cx: number, cy: number, R: number, r: number) =>
  Array.from({length: 10}, (_, i) => {const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? r : R; return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;}).join(" ");

export const ICONS_2: Record<string, IconFn> = {
  /* ---- Lifestyle & philosophy ---- */
  lotus: (p) => (
    <g>
      {[-62, -31, 31, 62].map((a, i) => <ellipse key={i} cx="100" cy="108" rx="22" ry="54" fill={i % 2 ? l(p.c1) : p.c1} transform={`rotate(${a} 100 158)`} />)}
      <ellipse cx="100" cy="106" rx="24" ry="58" fill={d(p.c1)} /><ellipse cx="100" cy="110" rx="16" ry="48" fill={l(p.c1)} />
      <path d="M30 164 Q100 190 170 164 Q100 176 30 164 Z" fill={p.c2} />
    </g>
  ),
  column: (p) => (
    <g>
      <rect x="48" y="26" width="104" height="16" rx="4" fill={p.light} stroke={p.ink} strokeWidth="5" />
      <rect x="62" y="42" width="76" height="10" fill={d(p.light)} stroke={p.ink} strokeWidth="4" />
      <rect x="70" y="52" width="60" height="100" fill={p.light} stroke={p.ink} strokeWidth="5" />
      {[86, 100, 114].map((x) => <line key={x} x1={x} y1="58" x2={x} y2="148" stroke={d(p.light)} strokeWidth="5" />)}
      <rect x="58" y="152" width="84" height="12" fill={p.light} stroke={p.ink} strokeWidth="5" /><rect x="46" y="164" width="108" height="14" rx="3" fill={p.light} stroke={p.ink} strokeWidth="5" />
    </g>
  ),
  diamond: (p, f) => (
    <g>
      <path d="M50 72 L72 40 H128 L150 72 L100 168 Z" fill={p.c2} />
      <path d="M50 72 H150 L100 168 Z" fill={d(p.c2)} /><path d="M72 40 L84 72 L100 40 L116 72 L128 40 Z" fill={l(p.c2)} />
      <path d="M50 72 L72 40 H128 L150 72 L100 168 Z" fill="none" stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d={`M${150 + Math.sin(f * 0.2) * 2} 28 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 Z`} fill={p.c3} />
    </g>
  ),
  crown: (p) => (
    <g>
      <path d="M30 148 L40 66 L76 106 L100 54 L124 106 L160 66 L170 148 Z" fill={p.c3} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <rect x="28" y="148" width="144" height="22" rx="5" fill={p.c1} stroke={p.ink} strokeWidth="5" />
      {[[40, 62], [100, 50], [160, 62]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="9" fill={p.c1} stroke={p.ink} strokeWidth="4" />)}
      <circle cx="100" cy="124" r="9" fill={p.c2} /><circle cx="68" cy="130" r="6" fill={p.c2} /><circle cx="132" cy="130" r="6" fill={p.c2} />
    </g>
  ),
  car: (p) => (
    <g>
      <path d="M18 132 Q20 106 50 100 L72 72 Q80 66 92 66 H130 Q144 66 152 76 L168 100 Q186 104 186 128 V144 H14 Z" fill={p.c1} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d="M82 76 H128 L146 100 H68 Z" fill={p.light} stroke={p.ink} strokeWidth="4" /><line x1="104" y1="76" x2="104" y2="100" stroke={p.ink} strokeWidth="4" />
      <rect x="170" y="116" width="14" height="10" rx="3" fill={p.c3} />
      {[54, 148].map((x) => <g key={x}><circle cx={x} cy="146" r="24" fill={p.ink} /><circle cx={x} cy="146" r="11" fill={p.light} /></g>)}
    </g>
  ),
  /* ---- Psychology ---- */
  eye: (p) => (
    <g>
      <path d="M14 100 Q100 14 186 100 Q100 186 14 100 Z" fill={p.light} stroke={p.ink} strokeWidth="7" strokeLinejoin="round" />
      <circle cx="100" cy="100" r="36" fill={p.c2} /><circle cx="100" cy="100" r="18" fill={p.ink} /><circle cx="90" cy="90" r="7" fill={p.light} />
    </g>
  ),
  mask: (p) => (
    <g>
      <path d="M36 40 H164 V104 Q164 172 100 180 Q36 172 36 104 Z" fill={p.c3} stroke={p.ink} strokeWidth="6" strokeLinejoin="round" />
      <path d="M56 84 Q74 64 90 88 Q72 96 56 84 Z M110 88 Q126 64 144 84 Q128 96 110 88 Z" fill={p.ink} />
      <path d="M66 128 Q100 168 134 128" fill="none" stroke={p.ink} strokeWidth="8" strokeLinecap="round" />
      <path d="M52 52 Q100 36 148 52" fill="none" stroke={p.c1} strokeWidth="8" strokeLinecap="round" />
    </g>
  ),
  chess: (p) => (
    <g>
      <circle cx="100" cy="58" r="26" fill={p.ink} /><rect x="76" y="80" width="48" height="12" rx="5" fill={p.ink} />
      <path d="M84 92 H116 Q122 130 140 150 H60 Q78 130 84 92 Z" fill={p.ink} />
      <rect x="48" y="150" width="104" height="22" rx="7" fill={p.ink} /><path d="M86 42 Q92 36 100 36" fill="none" stroke={p.light} strokeWidth="6" strokeLinecap="round" opacity="0.6" />
      <rect x="30" y="172" width="140" height="8" rx="4" fill={p.c1} />
    </g>
  ),
  puzzle: (p) => (
    <g>
      <rect x="104" y="62" width="70" height="70" rx="6" fill={p.c2} /><circle cx="139" cy="58" r="15" fill={p.c2} /><circle cx="176" cy="97" r="0" fill={p.c2} />
      <rect x="30" y="62" width="76" height="70" rx="6" fill={p.c1} /><circle cx="108" cy="97" r="16" fill={p.c1} /><circle cx="68" cy="132" r="15" fill={p.c1} />
      <rect x="62" y="130" width="76" height="54" rx="6" fill={p.c3} /><circle cx="100" cy="128" r="14" fill={p.c3} />
      <path d="M30 62 H174 V132 H138 V184 H62 V132 H30 Z" fill="none" stroke={p.ink} strokeWidth="4" opacity="0.35" />
    </g>
  ),
  handshake: (p) => (
    <g>
      <rect x="8" y="80" width="44" height="72" rx="8" fill={p.c1} /><rect x="148" y="80" width="44" height="72" rx="8" fill={p.c2} />
      <path d="M52 90 L92 78 Q104 74 118 84 L148 96 V134 L112 150 Q100 154 88 148 L52 132 Z" fill={SKIN} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M${86 + i * 14} 110 Q${92 + i * 14} 122 ${84 + i * 14} 134`} fill="none" stroke={d(SKIN)} strokeWidth="5" strokeLinecap="round" />)}
    </g>
  ),
  face: (p, f) => (
    <g transform={`translate(0 ${Math.sin(f * 0.08) * 2})`}>
      <circle cx="100" cy="100" r="74" fill={p.c3} stroke={p.ink} strokeWidth="6" />
      <ellipse cx="74" cy="84" rx="9" ry="13" fill={p.ink} /><ellipse cx="126" cy="84" rx="9" ry="13" fill={p.ink} />
      <path d="M62 116 Q100 160 138 116" fill="none" stroke={p.ink} strokeWidth="8" strokeLinecap="round" />
      <ellipse cx="56" cy="112" rx="10" ry="6" fill={p.c1} opacity="0.5" /><ellipse cx="144" cy="112" rx="10" ry="6" fill={p.c1} opacity="0.5" />
    </g>
  ),
  /* ---- Stories ---- */
  ghost: (p, f) => (
    <g transform={`translate(0 ${Math.sin(f * 0.1) * 5})`}>
      <path d="M46 168 V90 C46 28 154 28 154 90 V168 L134 150 L117 170 L100 150 L83 170 L66 150 Z" fill={p.light} stroke={p.ink} strokeWidth="6" strokeLinejoin="round" />
      <ellipse cx="80" cy="92" rx="9" ry="14" fill={p.ink} /><ellipse cx="120" cy="92" rx="9" ry="14" fill={p.ink} /><ellipse cx="100" cy="124" rx="11" ry="15" fill={p.ink} />
    </g>
  ),
  skull: (p) => (
    <g>
      <path d="M100 22 C52 22 34 60 40 96 C42 112 54 118 60 124 V150 H140 V124 C146 118 158 112 160 96 C166 60 148 22 100 22 Z" fill={p.light} stroke={p.ink} strokeWidth="6" strokeLinejoin="round" />
      <ellipse cx="74" cy="92" rx="18" ry="20" fill={p.ink} /><ellipse cx="126" cy="92" rx="18" ry="20" fill={p.ink} />
      <path d="M100 108 L90 128 H110 Z" fill={p.ink} />
      {[80, 100, 120].map((x) => <line key={x} x1={x} y1="134" x2={x} y2="150" stroke={p.ink} strokeWidth="5" />)}
      <rect x="62" y="150" width="76" height="22" rx="6" fill={p.light} stroke={p.ink} strokeWidth="6" />
    </g>
  ),
  fingerprint: (p, f) => (
    <g fill="none" strokeLinecap="round" stroke={p.c1}>
      {[16, 30, 44, 58, 72].map((r, i) => <ellipse key={r} cx="100" cy="104" rx={r * 0.9} ry={r * 1.15} strokeWidth="7" strokeDasharray={`${50 + i * 14} ${12 + i * 3}`} transform={`rotate(${i * 38 + f * 0.4} 100 104)`} opacity={1 - i * 0.1} />)}
      <circle cx="100" cy="104" r="5" fill={p.c1} />
    </g>
  ),
  handcuffs: (p) => (
    <g>
      <circle cx="58" cy="112" r="38" fill="none" stroke={p.ink} strokeWidth="15" /><circle cx="142" cy="112" r="38" fill="none" stroke={p.ink} strokeWidth="15" />
      <rect x="44" y="54" width="28" height="22" rx="5" fill={p.c2} stroke={p.ink} strokeWidth="4" /><rect x="128" y="54" width="28" height="22" rx="5" fill={p.c2} stroke={p.ink} strokeWidth="4" />
      {[90, 110].map((x) => <ellipse key={x} cx={x} cy="66" rx="13" ry="8" fill="none" stroke={p.c3} strokeWidth="6" />)}
    </g>
  ),
  siren: (p, f) => (
    <g>
      {[-1, 0, 1].map((k) => <line key={k} x1={100 + k * 52} y1="34" x2={100 + k * 66} y2="14" stroke={p.c3} strokeWidth="8" strokeLinecap="round" opacity={0.4 + 0.6 * Math.abs(Math.sin(f * 0.25 + k))} />)}
      <path d="M44 150 V108 Q44 56 100 56 Q156 56 156 108 V150 Z" fill={p.c1} stroke={p.ink} strokeWidth="6" strokeLinejoin="round" />
      <path d="M62 140 V110 Q62 76 88 70" fill="none" stroke={l(p.c1)} strokeWidth="8" strokeLinecap="round" />
      <rect x="32" y="150" width="136" height="24" rx="7" fill={p.ink} />
    </g>
  ),
  film: (p) => (
    <g>
      <rect x="22" y="78" width="156" height="96" rx="8" fill={p.ink} />
      <g transform="rotate(-10 22 76)"><rect x="22" y="48" width="156" height="28" rx="5" fill={p.light} stroke={p.ink} strokeWidth="5" />
        {[0, 1, 2, 3, 4].map((i) => <polygon key={i} points={`${36 + i * 30},76 ${50 + i * 30},76 ${62 + i * 30},48 ${48 + i * 30},48`} fill={p.ink} />)}</g>
      {[100, 122, 144].map((y, i) => <rect key={y} x="38" y={y} width={92 - i * 18} height="8" rx="4" fill={i === 0 ? p.c3 : p.light} opacity={0.9} />)}
    </g>
  ),
  scroll: (p) => (
    <g>
      <rect x="48" y="40" width="104" height="122" fill={l(p.c3)} stroke={p.ink} strokeWidth="5" />
      <ellipse cx="100" cy="40" rx="60" ry="13" fill={p.c3} stroke={p.ink} strokeWidth="5" /><ellipse cx="100" cy="162" rx="60" ry="13" fill={p.c3} stroke={p.ink} strokeWidth="5" />
      {[64, 82, 100, 118, 136].map((y, i) => <line key={y} x1="66" y1={y} x2={i % 2 ? 126 : 136} y2={y} stroke={p.ink} strokeWidth="5" strokeLinecap="round" opacity="0.7" />)}
    </g>
  ),
  /* ---- History & geography ---- */
  pyramid: (p) => (
    <g>
      <circle cx="152" cy="52" r="22" fill={p.c1} />
      <path d="M100 38 L176 160 H24 Z" fill={p.c3} /><path d="M100 38 L176 160 H112 Z" fill={d(p.c3)} />
      {[78, 100, 122, 144].map((y, i) => <line key={y} x1={100 - (y - 38) * 0.62} y1={y} x2={100 + (y - 38) * 0.62} y2={y} stroke={d(p.c3)} strokeWidth="3" opacity="0.6" />)}
      <rect x="10" y="158" width="180" height="14" rx="5" fill={p.c4} />
    </g>
  ),
  castle: (p, f) => (
    <g>
      <rect x="56" y="76" width="88" height="94" fill={p.c2} stroke={p.ink} strokeWidth="4" />
      {[28, 142].map((x) => <g key={x}><rect x={x} y="50" width="34" height="120" fill={d(p.c2)} stroke={p.ink} strokeWidth="4" />{[0, 1, 2].map((i) => <rect key={i} x={x + i * 12} y="38" width="10" height="14" fill={d(p.c2)} stroke={p.ink} strokeWidth="3" />)}</g>)}
      {[0, 1, 2, 3].map((i) => <rect key={i} x={58 + i * 22} y="64" width="14" height="14" fill={p.c2} stroke={p.ink} strokeWidth="3" />)}
      <path d="M84 170 V132 Q100 112 116 132 V170 Z" fill={p.ink} />
      <g transform={`translate(0 ${Math.sin(f * 0.15) * 1.5})`}><line x1="100" y1="64" x2="100" y2="22" stroke={p.ink} strokeWidth="4" /><path d="M100 22 L128 31 L100 40 Z" fill={p.c1} /></g>
    </g>
  ),
  temple: (p) => (
    <g>
      <rect x="40" y="150" width="120" height="20" rx="3" fill={p.c4} />
      <rect x="54" y="110" width="92" height="40" fill={p.c3} stroke={p.ink} strokeWidth="4" />
      <path d="M62 110 L74 80 H126 L138 110 Z" fill={l(p.c3)} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" />
      <path d="M74 80 L86 54 H114 L126 80 Z" fill={p.c3} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" />
      <path d="M86 54 L100 24 L114 54 Z" fill={p.c1} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" />
      <line x1="100" y1="24" x2="100" y2="10" stroke={p.ink} strokeWidth="4" /><path d="M100 10 L116 16 L100 22 Z" fill={p.c1} />
      <path d="M88 150 V128 Q100 114 112 128 V150 Z" fill={p.ink} />
    </g>
  ),
  swords: (p) => (
    <g>
      {[45, -45].map((a) => (
        <g key={a} transform={`rotate(${a} 100 100)`}>
          <path d="M92 22 H108 V132 H92 Z" fill={p.light} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" /><path d="M100 10 L108 22 H92 Z" fill={p.light} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
          <rect x="68" y="130" width="64" height="12" rx="5" fill={p.c3} stroke={p.ink} strokeWidth="4" /><rect x="94" y="142" width="12" height="30" rx="4" fill={p.c1} stroke={p.ink} strokeWidth="4" />
          <circle cx="100" cy="178" r="7" fill={p.c3} stroke={p.ink} strokeWidth="4" />
        </g>
      ))}
    </g>
  ),
  compass: (p, f) => (
    <g>
      <circle cx="100" cy="100" r="76" fill={p.light} stroke={p.ink} strokeWidth="9" />
      {Array.from({length: 12}, (_, i) => <line key={i} x1="100" y1="34" x2="100" y2={i % 3 === 0 ? 46 : 40} stroke={p.ink} strokeWidth={i % 3 === 0 ? 5 : 3} transform={`rotate(${i * 30} 100 100)`} />)}
      <g transform={`rotate(${40 + Math.sin(f * 0.07) * 8} 100 100)`}><path d="M100 36 L116 100 H84 Z" fill={p.c1} /><path d="M100 164 L116 100 H84 Z" fill={p.ink} /></g>
      <circle cx="100" cy="100" r="8" fill={p.c3} stroke={p.ink} strokeWidth="3" />
    </g>
  ),
  /* ---- Science ---- */
  planet: (p, f) => (
    <g>
      <ellipse cx="100" cy="104" rx="88" ry="22" fill="none" stroke={p.c3} strokeWidth="11" transform="rotate(-20 100 104)" />
      <circle cx="100" cy="100" r="54" fill={p.c1} /><path d="M52 84 Q100 70 148 90 M50 112 Q100 100 150 118" fill="none" stroke={d(p.c1)} strokeWidth="8" opacity="0.5" />
      <path d="M14 112 A88 22 0 0 0 186 96" fill="none" stroke={p.c3} strokeWidth="11" transform="rotate(-20 100 104)" />
      <circle cx={150 + Math.cos(f * 0.1) * 4} cy="44" r="5" fill={p.ink} />
    </g>
  ),
  star: (p, f) => (
    <g transform={`rotate(${Math.sin(f * 0.05) * 6} 100 104)`}>
      <polygon points={star5(100, 106, 80, 34)} fill={p.c3} stroke={p.ink} strokeWidth="6" strokeLinejoin="round" />
      <polygon points={star5(100, 106, 40, 17)} fill={l(p.c3)} />
    </g>
  ),
  telescope: (p) => (
    <g>
      <line x1="100" y1="116" x2="64" y2="180" stroke={p.ink} strokeWidth="9" strokeLinecap="round" /><line x1="100" y1="116" x2="136" y2="180" stroke={p.ink} strokeWidth="9" strokeLinecap="round" /><line x1="100" y1="116" x2="100" y2="180" stroke={p.ink} strokeWidth="9" strokeLinecap="round" />
      <g transform="rotate(-32 100 100)"><rect x="34" y="78" width="132" height="40" rx="8" fill={p.c2} stroke={p.ink} strokeWidth="5" /><rect x="136" y="70" width="34" height="56" rx="8" fill={p.c1} stroke={p.ink} strokeWidth="5" /><rect x="54" y="78" width="10" height="40" fill={l(p.c2)} /><rect x="18" y="88" width="20" height="20" rx="4" fill={p.ink} /></g>
      <circle cx="154" cy="34" r="4" fill={p.c3} /><circle cx="34" cy="48" r="3" fill={p.c3} />
    </g>
  ),
  atom: (p, f) => (
    <g>
      {[0, 60, 120].map((a, i) => {
        const t = f * 0.08 + i * 2.1;
        const ex = 100 + 76 * Math.cos(t), ey = 100 + 28 * Math.sin(t);
        const r = (a * Math.PI) / 180;
        const rx = 100 + (ex - 100) * Math.cos(r) - (ey - 100) * Math.sin(r), ry = 100 + (ex - 100) * Math.sin(r) + (ey - 100) * Math.cos(r);
        return <g key={a}><ellipse cx="100" cy="100" rx="76" ry="28" fill="none" stroke={p.ink} strokeWidth="5" transform={`rotate(${a} 100 100)`} /><circle cx={rx} cy={ry} r="9" fill={i === 1 ? p.c2 : p.c3} stroke={p.ink} strokeWidth="3" /></g>;
      })}
      <circle cx="100" cy="100" r="16" fill={p.c1} stroke={p.ink} strokeWidth="4" />
    </g>
  ),
  dna: (p, f) => (
    <g>
      {Array.from({length: 11}, (_, i) => {
        const y = 22 + i * 15.6, a = i * 0.62 + f * 0.06;
        const x1 = 100 + 40 * Math.sin(a), x2 = 100 - 40 * Math.sin(a);
        return <g key={i}><line x1={x1} y1={y} x2={x2} y2={y} stroke={p.ink} strokeWidth="4" opacity="0.5" /><circle cx={x1} cy={y} r={7 + Math.cos(a) * 2} fill={p.c1} /><circle cx={x2} cy={y} r={7 - Math.cos(a) * 2} fill={p.c2} /></g>;
      })}
    </g>
  ),
  flask: (p, f) => (
    <g>
      <path d="M78 26 H122 V76 L168 150 Q178 172 156 174 H44 Q22 172 32 150 L78 76 Z" fill={p.light} stroke={p.ink} strokeWidth="6" strokeLinejoin="round" />
      <path d="M58 116 H142 L168 152 Q176 170 156 170 H44 Q24 170 32 152 Z" fill={p.c2} />
      <rect x="72" y="20" width="56" height="12" rx="5" fill={p.ink} />
      {[0, 1, 2].map((i) => <circle key={i} cx={76 + i * 26} cy={150 - ((f * 0.7 + i * 17) % 30)} r={4 + i} fill={p.light} opacity="0.8" />)}
    </g>
  ),
  microscope: (p) => (
    <g>
      <rect x="50" y="160" width="100" height="16" rx="6" fill={p.ink} />
      <path d="M126 160 V108 Q126 54 90 46" fill="none" stroke={p.c2} strokeWidth="16" strokeLinecap="round" />
      <g transform="rotate(-24 76 70)"><rect x="62" y="22" width="28" height="70" rx="6" fill={p.c1} stroke={p.ink} strokeWidth="4" /><rect x="66" y="14" width="20" height="12" rx="4" fill={p.ink} /><rect x="68" y="92" width="16" height="18" rx="3" fill={p.ink} /></g>
      <rect x="62" y="130" width="64" height="9" rx="4" fill={p.ink} /><rect x="44" y="164" width="12" height="0" fill={p.ink} />
    </g>
  ),
  lightning: (p, f) => (
    <g opacity={0.82 + 0.18 * Math.abs(Math.sin(f * 0.3))}>
      <path d="M116 14 L50 112 H92 L76 188 L152 80 H108 Z" fill={p.c3} stroke={p.ink} strokeWidth="6" strokeLinejoin="round" />
    </g>
  ),
  leaf: (p, f) => (
    <g transform={`rotate(${Math.sin(f * 0.08) * 3} 100 176)`}>
      <path d="M100 178 C100 130 100 90 100 60" fill="none" stroke={d(p.c2)} strokeWidth="7" strokeLinecap="round" />
      <path d="M100 150 C58 150 34 116 40 80 C80 80 100 110 100 150 Z" fill={p.c2} /><path d="M100 110 C142 110 166 78 160 42 C120 42 100 72 100 110 Z" fill={l(p.c2)} />
      <path d="M100 70 C100 40 100 26 100 14 C88 30 84 50 100 70 Z" fill={p.c2} />
    </g>
  ),
  fish: (p, f) => (
    <g transform={`translate(${Math.sin(f * 0.1) * 4} 0)`}>
      <path d="M20 100 Q60 44 130 62 Q164 76 170 100 Q164 124 130 138 Q60 156 20 100 Z" fill={p.c1} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d="M160 100 L196 66 V134 Z" fill={p.c3} stroke={p.ink} strokeWidth="5" strokeLinejoin="round" />
      <path d="M70 64 Q90 40 116 62 Z" fill={p.c3} stroke={p.ink} strokeWidth="4" strokeLinejoin="round" />
      <circle cx="52" cy="92" r="9" fill={p.light} stroke={p.ink} strokeWidth="3" /><circle cx="50" cy="92" r="4" fill={p.ink} />
      <path d="M92 76 Q104 100 92 124" fill="none" stroke={d(p.c1)} strokeWidth="5" /><circle cx="22" cy="60" r="6" fill="none" stroke={p.c2} strokeWidth="3" /><circle cx="34" cy="40" r="4" fill="none" stroke={p.c2} strokeWidth="3" />
    </g>
  ),
};
