/**
 * MINDSPARK MYTH ENGINE
 * 2D flat "puppet" gods (like the Krishna sample) + forest/pond/temple/battlefield worlds
 * + a CAMERA DIRECTOR that picks a different angle + movement for every scene of every video.
 *
 * Canvas: 1080 x 1920 (9:16). Remotion >= 4.
 * Usage:
 *   <Composition id="MythShort" component={MythShort} width={1080} height={1920} fps={30}
 *      durationInFrames={totalFrames(scenes, 30)} defaultProps={{ scenes, seed: 12345 }} />
 *   (or calculateMetadata: ({props}) => ({ durationInFrames: totalFrames(props.scenes, 30) }))
 * Use a NEW seed for every video -> different trees, colors, camera choices.
 * Needs a Devanagari font loaded (e.g. @remotion/google-fonts Noto Sans Devanagari).
 *
 * AUDIO (built in):
 *   1) node scripts/make-myth-audio.mjs      -> creates public/myth-audio/*.wav (score + sfx), run once
 *   2) Music + SFX are placed automatically from each scene's `beat`:
 *        whoosh before every scene, bells on intro/reveal/victory, thump on reveal, dhol beat in fights.
 *   3) VOICEOVER: per scene set  voice: 'voice/s1.mp3'  (file inside public/)  and  voiceSec: <seconds>.
 *      Scene length stretches to fit the voice, and the music ducks (gets quieter) while the voice speaks.
 *      Use your existing raju_clone TTS to create those files, then pass them in the scenes JSON.
 */
import React, { createContext, useContext, useMemo } from 'react';
import { AbsoluteFill, Audio, Easing, Sequence, Series, staticFile, useCurrentFrame } from 'remotion';
import { loadFont as loadNoto } from '@remotion/google-fonts/NotoSansDevanagari';

const devanagariFont = loadNoto('normal', { weights: ['400', '700', '800'], subsets: ['devanagari'] }).fontFamily;

/* ───────────────────────── TYPES ───────────────────────── */
export type Pose = 'stand' | 'sit' | 'fly' | 'fight' | 'pray' | 'point' | 'talk' | 'walk';
export type Weapon = 'none' | 'gada' | 'bow' | 'trishul' | 'chakra' | 'sword';
export type BgKind = 'forest' | 'pond' | 'temple' | 'battlefield' | 'sky';
export type Beat = 'intro' | 'talk' | 'reveal' | 'fight' | 'victory';
export type ShotName =
  | 'wide' | 'medium' | 'closeup' | 'extreme' | 'low' | 'high' | 'dutch' | 'side' | 'sideR' | 'over';
export type MoveName =
  | 'still' | 'pushIn' | 'pullOut' | 'panL' | 'panR' | 'tiltUp' | 'craneDown' | 'orbit' | 'shake' | 'whip';

export type Actor = {
  who: keyof typeof ROSTER | string;
  pose: Pose;
  x: number;            // feet x in 0..1080
  y?: number;           // ground line (default 1280)
  scale?: number;       // default 1
  flip?: boolean;       // face left
  weapon?: Weapon;      // overrides the god's default weapon
  angry?: boolean;
};

export type Scene = {
  sec: number;
  beat: Beat;
  bg: BgKind;
  actors: Actor[];
  caption: { title: string; text: string };
  focus?: number;       // index of actor the camera looks at (default 0)
  narration?: string;   // Hindi/Hinglish line for the TTS to speak in this scene (pipeline turns it into `voice`)
  voice?: string;       // voiceover file inside /public, e.g. 'voice/s1.mp3' (from your TTS)
  voiceSec?: number;    // length of that voice file in seconds (scene stretches to fit it)
  camera?: { shot: ShotName; move: MoveName }; // optional manual override
};

/* ───────────────────────── 20+ AVATARS (Gods, Rishis, Gurus, Warriors) ───────────────────────── */
type Crown = 'mukut' | 'jata' | 'monkey' | 'ganesha' | 'lion' | 'ravan' | 'horns' | 'none' | 'guru' | 'pagdi' | 'royal_mukut' | 'bandana';
type God = {
  skin: string; cloth: string; crown: Crown; halo: string;
  weapon: Weapon; long?: boolean; arms4?: boolean;
  beard?: boolean; mustache?: boolean; janeu?: boolean; sash?: string;
};

export const ROSTER: Record<string, God> = {
  krishna:   { skin: '#3fa7a0', cloth: '#e8641b', crown: 'mukut',   halo: '#8a1f12', weapon: 'chakra' },
  guru:      { skin: '#c88c58', cloth: '#f4ede2', crown: 'guru',    halo: '#e09838', weapon: 'none', beard: true, mustache: true, janeu: true, sash: '#8a2020' },
  rishi:     { skin: '#b87c48', cloth: '#ffffff', crown: 'guru',    halo: '#d08030', weapon: 'none', beard: true, mustache: true, janeu: true, sash: '#b04020' },
  vyasa:     { skin: '#c88c58', cloth: '#fdfbf7', crown: 'guru',    halo: '#e5a030', weapon: 'none', beard: true, mustache: true, janeu: true, sash: '#7a1c1c' },
  drona:     { skin: '#c08450', cloth: '#f4ede2', crown: 'guru',    halo: '#c07020', weapon: 'bow',  beard: true, mustache: true, janeu: true, sash: '#8a2020' },
  shishya:   { skin: '#c88c58', cloth: '#2d4b73', crown: 'pagdi',   halo: '#f2b632', weapon: 'none' },
  arjuna:    { skin: '#c88c58', cloth: '#1b3b6f', crown: 'pagdi',   halo: '#ffd43b', weapon: 'bow' },
  karna:     { skin: '#d89c68', cloth: '#8c2d19', crown: 'mukut',   halo: '#f2a93b', weapon: 'bow' },
  raja:      { skin: '#c88c58', cloth: '#701a25', crown: 'royal_mukut', halo: '#f2b632', weapon: 'sword' },
  chor:      { skin: '#a86c38', cloth: '#3a4a2b', crown: 'bandana', halo: '#504030', weapon: 'sword', mustache: true },
  soldier:   { skin: '#b87c48', cloth: '#2b3a4a', crown: 'pagdi',   halo: '#806040', weapon: 'sword' },
  rama:      { skin: '#5a8fd0', cloth: '#f2b632', crown: 'mukut',   halo: '#c9561a', weapon: 'bow' },
  hanuman:   { skin: '#e3a63c', cloth: '#b8321f', crown: 'monkey',  halo: '#f0b429', weapon: 'gada' },
  shiva:     { skin: '#9fb7d6', cloth: '#7a4a2b', crown: 'jata',    halo: '#4a6fa5', weapon: 'trishul' },
  vishnu:    { skin: '#3e7fd1', cloth: '#f4c430', crown: 'mukut',   halo: '#e0a526', weapon: 'chakra', arms4: true },
  brahma:    { skin: '#e8a24a', cloth: '#f5f0e0', crown: 'jata',    halo: '#d97a1e', weapon: 'none' },
  ganesha:   { skin: '#e6772e', cloth: '#d6336c', crown: 'ganesha', halo: '#f08a24', weapon: 'none' },
  kartikeya: { skin: '#e0b25c', cloth: '#2f9e6b', crown: 'mukut',   halo: '#2f9e6b', weapon: 'sword' },
  indra:     { skin: '#d9b073', cloth: '#7048c8', crown: 'mukut',   halo: '#9775fa', weapon: 'sword' },
  surya:     { skin: '#f0a030', cloth: '#d9480f', crown: 'mukut',   halo: '#ffd43b', weapon: 'none' },
  vayu:      { skin: '#8fd3c8', cloth: '#ffffff', crown: 'mukut',   halo: '#99e9f2', weapon: 'none' },
  varuna:    { skin: '#4dabf7', cloth: '#1c7ed6', crown: 'mukut',   halo: '#74c0fc', weapon: 'trishul' },
  durga:     { skin: '#f0b27a', cloth: '#c92a2a', crown: 'mukut',   halo: '#ff6b6b', weapon: 'trishul', long: true, arms4: true },
  lakshmi:   { skin: '#f3c28b', cloth: '#f08c00', crown: 'mukut',   halo: '#ffd43b', weapon: 'none', long: true },
  saraswati: { skin: '#f3d1a8', cloth: '#f8f9fa', crown: 'mukut',   halo: '#a5d8ff', weapon: 'none', long: true },
  parvati:   { skin: '#e9a27a', cloth: '#be4bdb', crown: 'mukut',   halo: '#e599f7', weapon: 'none', long: true },
  kali:      { skin: '#2b3a67', cloth: '#a61e4d', crown: 'horns',   halo: '#e03131', weapon: 'sword', long: true, arms4: true },
  narasimha: { skin: '#e8a23a', cloth: '#c2255c', crown: 'lion',    halo: '#ff922b', weapon: 'none' },
  ravana:    { skin: '#4b8f4b', cloth: '#5f3dc4', crown: 'ravan',   halo: '#5c940d', weapon: 'sword' },
  asura:     { skin: '#8b5a9e', cloth: '#343a40', crown: 'horns',   halo: '#862e9c', weapon: 'gada' },
};

/* ───────────────────────── HELPERS ───────────────────────── */
export const rng = (seed: number) => {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
};
const GOLD = '#f2b632';
const INK = '#1a0d08';

/* ───────────────────────── CAMERA ───────────────────────── */
type Cam = { x: number; y: number; z: number; rx: number; ry: number; rz: number };
const CamCtx = createContext<Cam>({ x: 0, y: 0, z: 1, rx: 0, ry: 0, rz: 0 });

// focusW = how strongly the camera centres on the focused actor (0 = fixed frame, 1 = locked on face)
export const SHOTS: Record<ShotName, Cam & { focusW: number }> = {
  wide:    { x: 0,    y: 0,   z: 0.86, rx: 0,   ry: 0,   rz: 0,  focusW: 0 },
  medium:  { x: 0,    y: 0,   z: 1.18, rx: 0,   ry: 0,   rz: 0,  focusW: 0.55 },
  closeup: { x: 0,    y: 0,   z: 1.9,  rx: 0,   ry: 0,   rz: 0,  focusW: 1 },
  extreme: { x: 0,    y: 0,   z: 2.9,  rx: 0,   ry: 0,   rz: 0,  focusW: 1 },
  low:     { x: 0,    y: 40,  z: 1.35, rx: -14, ry: 0,   rz: 0,  focusW: 0.5 },   // hero looks huge
  high:    { x: 0,    y: -30, z: 1.0,  rx: 16,  ry: 0,   rz: 0,  focusW: 0.2 },    // looking down on scene
  dutch:   { x: 0,    y: 0,   z: 1.25, rx: 0,   ry: 0,   rz: -9, focusW: 0.4 },    // tilted, tense fight
  side:    { x: 0,    y: 0,   z: 1.12, rx: 0,   ry: 24,  rz: 0,  focusW: 0.4 },
  sideR:   { x: 0,    y: 0,   z: 1.12, rx: 0,   ry: -24, rz: 0,  focusW: 0.4 },
  over:    { x: -140, y: 0,   z: 1.55, rx: 0,   ry: 14,  rz: 0,  focusW: 0.7 },
};

const MOVES: Record<MoveName, (t: number, f: number) => Partial<Cam>> = {
  still:     () => ({}),
  pushIn:    (t) => ({ z: 0.28 * t }),
  pullOut:   (t) => ({ z: 0.28 * (1 - t) - 0.05 }),
  panL:      (t) => ({ x: 130 * (0.5 - t) }),
  panR:      (t) => ({ x: -130 * (0.5 - t) }),
  tiltUp:    (t) => ({ y: 170 * (1 - t) - 60, rx: -8 * t }),
  craneDown: (t) => ({ y: -240 * (1 - t), rx: 14 * (1 - t) }),
  orbit:     (t) => ({ ry: -20 + 40 * t, x: 50 * (0.5 - t) }),
  shake:     (_t, f) => ({ x: Math.sin(f * 1.9) * 16, y: Math.cos(f * 2.3) * 12, rz: Math.sin(f * 1.3) * 0.9 }),
  whip:      (t) => ({ x: 420 * Math.pow(1 - t, 3), rz: 3 * Math.pow(1 - t, 3) }),
};

const Camera: React.FC<{
  shot: ShotName; move: MoveName; dur: number; focus: { x: number; y: number };
  children: React.ReactNode;
}> = ({ shot, move, dur, focus, children }) => {
  const f = useCurrentFrame();
  const t = Easing.inOut(Easing.cubic)(Math.min(1, f / Math.max(1, dur - 1)));
  const b = SHOTS[shot];
  const m = MOVES[move](t, f);
  const z = b.z + (m.z ?? 0);
  const cam: Cam = {
    z,
    x: b.x + (m.x ?? 0) - b.focusW * z * (focus.x - 540),
    y: b.y + (m.y ?? 0) - b.focusW * z * (focus.y - 960),
    rx: b.rx + (m.rx ?? 0),
    ry: b.ry + (m.ry ?? 0),
    rz: b.rz + (m.rz ?? 0),
  };
  return (
    <CamCtx.Provider value={cam}>
      <AbsoluteFill style={{ perspective: 1500, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute', inset: 0, transformOrigin: '50% 50%',
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.z}) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) rotateZ(${cam.rz}deg)`,
          }}
        >
          {children}
        </div>
      </AbsoluteFill>
    </CamCtx.Provider>
  );
};

/* Camera director: every video gets a different plan (seeded), never the same shot twice in a row */
const BEAT_RULES: Record<Beat, { shots: ShotName[]; moves: MoveName[] }> = {
  intro:   { shots: ['wide', 'high', 'side'],                     moves: ['pullOut', 'craneDown', 'panR', 'panL'] },
  talk:    { shots: ['medium', 'over', 'closeup', 'sideR', 'side'], moves: ['pushIn', 'still', 'panL', 'panR'] },
  reveal:  { shots: ['closeup', 'extreme', 'low'],                 moves: ['pushIn', 'tiltUp'] },
  fight:   { shots: ['dutch', 'low', 'side', 'sideR', 'medium', 'wide'], moves: ['shake', 'whip', 'orbit', 'pushIn', 'panL'] },
  victory: { shots: ['low', 'wide', 'high'],                       moves: ['pullOut', 'tiltUp', 'orbit'] },
};

export function directCameras(scenes: Scene[], seed: number): Scene[] {
  const r = rng(seed * 7919 + 13);
  let prevShot: ShotName | null = null;
  let prevMove: MoveName | null = null;
  return scenes.map((s) => {
    if (s.camera) { prevShot = s.camera.shot; prevMove = s.camera.move; return s; }
    const rule = BEAT_RULES[s.beat];
    const pick = <T,>(arr: T[], avoid: T | null) => {
      const pool = arr.filter((a) => a !== avoid);
      return pool[Math.floor(r() * pool.length)] ?? arr[0];
    };
    const shot = pick(rule.shots, prevShot);
    const move = pick(rule.moves, prevMove);
    prevShot = shot; prevMove = move;
    return { ...s, camera: { shot, move } };
  });
}

/* ───────────────────────── CHARACTER (SVG puppet) ───────────────────────── */
const POSES: Record<Pose, { aL: number; aR: number; bL: number; bR: number; lL: number; lR: number; spread: number }> = {
  stand: { aL: 12,  aR: -12,  bL: 6,   bR: -6,   lL: 5,  lR: -5,  spread: 0 },
  fight: { aL: 70,  aR: -150, bL: 60,  bR: -30,  lL: 24, lR: -20, spread: 1 },
  sit:   { aL: 28,  aR: -28,  bL: 40,  bR: -40,  lL: 0,  lR: 0,   spread: 0 },
  fly:   { aL: 160, aR: -150, bL: 10,  bR: -10,  lL: -8, lR: 10,  spread: 0 },
  pray:  { aL: 160, aR: -160, bL: 20,  bR: -20,  lL: 0,  lR: 0,   spread: 0 },
  point: { aL: 14,  aR: -85,  bL: 10,  bR: 0,    lL: 5,  lR: -5,  spread: 0 },
  talk:  { aL: 35,  aR: -45,  bL: 55,  bR: -65,  lL: 4,  lR: -4,  spread: 0 },
  walk:  { aL: 25,  aR: -25,  bL: 15,  bR: -15,  lL: 18, lR: -18, spread: 0 },
};

const WeaponSvg: React.FC<{ w: Weapon; frame: number }> = ({ w, frame }) => {
  switch (w) {
    case 'gada':
      return (<g><rect x={-6} y={-10} width={12} height={170} rx={6} fill="#8a5a2b" />
        <circle cx={0} cy={185} r={42} fill={GOLD} stroke={INK} strokeWidth={5} />
        <circle cx={0} cy={185} r={20} fill="none" stroke={INK} strokeWidth={3} /></g>);
    case 'bow':
      return (<g><path d="M0,-90 Q90,70 0,230" fill="none" stroke="#8a5a2b" strokeWidth={9} />
        <line x1={0} y1={-90} x2={0} y2={230} stroke="#eee" strokeWidth={3} /></g>);
    case 'trishul':
      return (<g><rect x={-5} y={-30} width={10} height={230} fill="#b8b8c0" />
        <path d="M-30,-30 L-30,-90 M0,-30 L0,-120 M30,-30 L30,-90 M-30,-30 L30,-30" stroke="#d8d8e0" strokeWidth={9} fill="none" strokeLinecap="round" /></g>);
    case 'chakra':
      return (<g transform={`translate(0,150) rotate(${frame * 14})`}>
        {Array.from({ length: 12 }).map((_, i) => (
          <polygon key={i} points="-8,-58 8,-58 0,-82" fill={GOLD} transform={`rotate(${i * 30})`} />))}
        <circle r={56} fill="#ffd43b" stroke={INK} strokeWidth={5} />
        <circle r={26} fill="none" stroke={INK} strokeWidth={4} /></g>);
    case 'sword':
      return (<g><rect x={-5} y={-20} width={10} height={36} fill="#7a4a2b" />
        <rect x={-26} y={14} width={52} height={10} rx={5} fill={GOLD} />
        <polygon points="-12,24 12,24 0,230" fill="#dfe3ea" stroke={INK} strokeWidth={3} /></g>);
    default:
      return null;
  }
};

const Arm: React.FC<{ sx: number; a: number; b: number; skin: string; weapon?: Weapon; frame: number }> =
  ({ sx, a, b, skin, weapon = 'none', frame }) => (
    <g transform={`translate(${sx},-205) rotate(${a})`}>
      <rect x={-19} y={0} width={38} height={112} rx={19} fill={skin} stroke={INK} strokeWidth={4} />
      <g transform={`translate(0,106) rotate(${b})`}>
        <rect x={-17} y={0} width={34} height={104} rx={17} fill={skin} stroke={INK} strokeWidth={4} />
        <rect x={-20} y={60} width={40} height={14} rx={7} fill={GOLD} />
        <circle cx={0} cy={108} r={21} fill={skin} stroke={INK} strokeWidth={4} />
        <g transform="translate(0,108)"><WeaponSvg w={weapon} frame={frame} /></g>
      </g>
    </g>
  );

const Head: React.FC<{ g: God; angry: boolean }> = ({ g, angry }) => (
  <g transform="translate(0,-300)">
    {/* halo */}
    <g>
      {Array.from({ length: 20 }).map((_, i) => (
        <polygon key={i} points="-14,-96 14,-96 0,-136" fill={g.halo} transform={`rotate(${i * 18})`} />))}
      <circle r={100} fill={g.halo} />
      <circle r={86} fill="#14080a" />
    </g>
    {g.crown === 'ganesha' && (<path d="M-14,30 Q-10,120 40,110 Q70,100 56,70" fill="none" stroke={g.skin} strokeWidth={34} strokeLinecap="round" />)}
    <circle r={68} fill={g.skin} stroke={INK} strokeWidth={5} />
    {g.crown === 'monkey' && <ellipse cx={0} cy={22} rx={42} ry={34} fill="#f6d9a0" stroke={INK} strokeWidth={3} />}
    {g.crown === 'lion' && Array.from({ length: 14 }).map((_, i) => (
      <polygon key={i} points="-12,-62 12,-62 0,-100" fill="#c2761a" transform={`rotate(${i * 25.7})`} />))}
    {/* crowns & headgears */}
    {(g.crown === 'mukut' || g.crown === 'monkey' || g.crown === 'ganesha' || g.crown === 'ravan') && (
      <g><polygon points="-44,-52 0,-170 44,-52" fill={GOLD} stroke={INK} strokeWidth={4} />
        <circle cx={0} cy={-100} r={9} fill="#d6336c" /></g>)}
    {g.crown === 'royal_mukut' && (
      <g>
        <polygon points="-56,-52 -28,-180 0,-130 28,-180 56,-52" fill={GOLD} stroke={INK} strokeWidth={4} />
        <circle cx={0} cy={-85} r={12} fill="#c92a2a" />
      </g>
    )}
    {g.crown === 'pagdi' && (
      <g>
        <ellipse cx={0} cy={-50} rx={66} ry={36} fill={g.cloth} stroke={INK} strokeWidth={4} />
        <circle cx={0} cy={-55} r={11} fill={GOLD} />
        <path d="M40,-50 Q60,-20 54,20" stroke={g.cloth} strokeWidth={16} fill="none" strokeLinecap="round" />
      </g>
    )}
    {g.crown === 'bandana' && (
      <g>
        <path d="M-64,-30 Q0,-75 64,-30 L60,-55 Q0,-95 -60,-55 Z" fill="#2b3a1a" stroke={INK} strokeWidth={4} />
      </g>
    )}
    {g.crown === 'guru' && (
      <g>
        <ellipse cx={0} cy={-60} rx={58} ry={38} fill="#231812" stroke={INK} strokeWidth={4} />
        <circle cx={0} cy={-86} r={26} fill="#231812" stroke={INK} strokeWidth={4} />
        {/* Rudraksha mala on bun */}
        {[-20, -10, 0, 10, 20].map((x, i) => (
          <circle key={i} cx={x} cy={-70 + Math.abs(x) * 0.3} r={4.5} fill="#b05820" stroke={INK} strokeWidth={1.5} />
        ))}
      </g>
    )}
    {g.crown === 'ravan' && [-60, 60].map((x, i) => (
      <polygon key={i} points={`${x - 26},-40 ${x},-130 ${x + 26},-40`} fill={GOLD} stroke={INK} strokeWidth={3} />))}
    {g.crown === 'jata' && (<path d="M-60,-20 Q-70,-120 0,-130 Q70,-120 60,-20 Q30,-60 -60,-20" fill="#3a2a22" stroke={INK} strokeWidth={4} />)}
    {g.crown === 'horns' && (<g><polygon points="-52,-40 -86,-130 -20,-62" fill="#e9ecef" stroke={INK} strokeWidth={3} />
      <polygon points="52,-40 86,-130 20,-62" fill="#e9ecef" stroke={INK} strokeWidth={3} /></g>)}
    {/* face */}
    <circle cx={-24} cy={-6} r={13} fill="#fff" /><circle cx={24} cy={-6} r={13} fill="#fff" />
    <circle cx={-24} cy={-4} r={6} fill={angry ? '#e03131' : '#222'} /><circle cx={24} cy={-4} r={6} fill={angry ? '#e03131' : '#222'} />
    <path d={angry ? 'M-42,-26 L-8,-14 M42,-26 L8,-14' : 'M-40,-22 L-10,-24 M40,-22 L10,-24'} stroke={INK} strokeWidth={6} strokeLinecap="round" />
    <path d={angry ? 'M-18,38 Q0,28 18,38' : 'M-18,32 Q0,44 18,32'} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />

    {/* Tilak / Tripund */}
    {g.crown === 'guru' ? (
      <g>
        <line x1={-18} y1={-32} x2={18} y2={-32} stroke="#ffffff" strokeWidth={3} />
        <line x1={-18} y1={-26} x2={18} y2={-26} stroke="#ffffff" strokeWidth={3} />
        <circle cx={0} cy={-29} r={4} fill="#e03131" />
      </g>
    ) : (
      <path d="M-8,-30 L8,-30 L0,-44 Z" fill="#e03131" opacity={0.85} />
    )}

    {/* Mustache */}
    {(g.mustache || g.beard) && (
      <path d="M-34,22 Q-14,32 0,22 Q14,32 34,22 Q24,13 0,16 Q-24,13 -34,22 Z" fill="#231812" stroke={INK} strokeWidth={2.5} />
    )}

    {/* Long Pointed Guru/Rishi Beard (Sanatan Unfold Style) */}
    {g.beard && (
      <path d="M-44,22 Q-32,150 0,185 Q32,150 44,22 Q28,50 0,55 Q-28,50 -44,22 Z" fill="#231812" stroke={INK} strokeWidth={4} />
    )}
  </g>
);

const Character: React.FC<{ a: Actor; frame: number }> = ({ a, frame }) => {
  const g = ROSTER[a.who as string] ?? ROSTER.krishna;
  const P = POSES[a.pose] ?? POSES.stand;
  const sc = a.scale ?? 1;
  const ground = a.y ?? 1280;
  const weapon = a.weapon ?? g.weapon;
  const angry = a.angry ?? a.pose === 'fight';
  const idle = Math.sin(frame / 9);
  const walkPhase = a.pose === 'walk' ? Math.sin(frame / 3) * 22 : 0;
  const swing = a.pose === 'fight' ? Math.sin(frame / 3.2) * 38 : a.pose === 'walk' ? -walkPhase : idle * 4;
  const bob = a.pose === 'fly' ? Math.sin(frame / 7) * 22 : a.pose === 'sit' ? Math.sin(frame / 14) * 10 : a.pose === 'walk' ? Math.abs(Math.sin(frame / 3)) * 12 : idle * 3;
  const sitDrop = a.pose === 'sit' ? 125 : 0;
  const flyRot = a.pose === 'fly' ? 72 : 0;
  const lift = a.pose === 'fly' ? -260 : 0;
  const body = (
    <g transform={`translate(0,${sitDrop + bob}) rotate(${flyRot} 0 0)`}>
      {/* aura for flying */}
      {a.pose === 'fly' && [0, 1, 2, 3].map((i) => (
        <line key={i} x1={-60 - ((frame * 22 + i * 90) % 360)} y1={-180 + i * 110} x2={-160 - ((frame * 22 + i * 90) % 360)} y2={-180 + i * 110}
          stroke="#fff" strokeOpacity={0.5} strokeWidth={6} strokeLinecap="round" />))}
      {/* legs / sitting base */}
      {a.pose === 'sit' ? (
        <g><ellipse cx={0} cy={30} rx={170} ry={46} fill={g.cloth} stroke={INK} strokeWidth={4} />
          <ellipse cx={0} cy={60} rx={120} ry={22} fill={g.skin} stroke={INK} strokeWidth={4} /></g>
      ) : (
        [-1, 1].map((s) => (
          <g key={s} transform={`translate(${s * 38},-6) rotate(${s < 0 ? P.lL + swing * 0.2 + (a.pose === 'walk' ? walkPhase : 0) : P.lR - swing * 0.2 - (a.pose === 'walk' ? walkPhase : 0)})`}>
            <rect x={-22} y={0} width={44} height={226} rx={22} fill={g.skin} stroke={INK} strokeWidth={4} />
            <rect x={-26} y={176} width={52} height={14} rx={7} fill={GOLD} />
            <ellipse cx={s * 6} cy={228} rx={34} ry={14} fill="#3a2418" />
          </g>))
      )}
      {/* back arms (4-armed gods) */}
      {g.arms4 && (<g opacity={0.95}>
        <Arm sx={-66} a={P.aL + 70} b={30} skin={g.skin} weapon="none" frame={frame} />
        <Arm sx={66} a={P.aR - 70} b={-30} skin={g.skin} weapon={weapon === 'none' ? 'trishul' : weapon === 'chakra' ? 'gada' : 'chakra'} frame={frame} />
      </g>)}
      {/* torso + cloth */}
      <path d="M-78,-215 L78,-215 L64,-4 L-64,-4 Z" fill={g.skin} stroke={INK} strokeWidth={5} />
      {/* Janeu (sacred thread) */}
      {g.janeu && (
        <line x1={-54} y1={-215} x2={44} y2={-4} stroke="#ffffff" strokeWidth={4} opacity={0.9} />
      )}
      {/* Shoulder sash (chadar) */}
      {g.sash && (
        <path d="M-78,-215 L-32,-215 L-14,-4 L-64,-4 Z" fill={g.sash} stroke={INK} strokeWidth={3} />
      )}
      <path d={g.long ? 'M-74,-120 L74,-120 L120,215 L-120,215 Z' : 'M-70,-14 L70,-14 L56,150 L0,200 L-56,150 Z'} fill={g.cloth} stroke={INK} strokeWidth={5} />
      <rect x={-72} y={-24} width={144} height={22} rx={8} fill={GOLD} stroke={INK} strokeWidth={3} />
      <path d="M-70,-215 L70,-215 L0,-100 Z" fill="#ffffff" opacity={0.15} />
      <circle cx={0} cy={-150} r={14} fill={GOLD} />
      {/* main arms */}
      <Arm sx={-80} a={P.aL + swing * 0.6} b={P.bL} skin={g.skin} weapon="none" frame={frame} />
      <Arm sx={80} a={P.aR + swing} b={P.bR} skin={g.skin} weapon={weapon} frame={frame} />
      <Head g={g} angry={angry} />
    </g>
  );
  return (
    <svg
      width={560 * sc} height={820 * sc} viewBox="-280 -520 560 820"
      style={{ position: 'absolute', left: a.x - 280 * sc, top: ground - 740 * sc, overflow: 'visible', filter: 'drop-shadow(0 18px 22px rgba(0,0,0,.45))' }}
    >
      <g transform={`scale(${a.flip ? -1 : 1},1) translate(0,${lift})`}>{body}</g>
    </svg>
  );
};

/* ───────────────────────── WORLDS (backgrounds with parallax) ───────────────────────── */
const Layer: React.FC<{ depth: number; children: React.ReactNode }> = ({ depth, children }) => {
  const cam = useContext(CamCtx);
  // depth 0 = far (barely follows camera pan), 1 = near
  return (
    <div style={{ position: 'absolute', left: -660, top: -480, width: 2400, height: 2880, transform: `translate(${-cam.x * (1 - depth) * 0.45}px,${-cam.y * (1 - depth) * 0.25}px)` }}>
      {children}
    </div>
  );
};

const Tree: React.FC<{ x: number; base: number; h: number; hue: number; pine?: boolean }> = ({ x, base, h, hue, pine }) => (
  <g transform={`translate(${x},${base})`}>
    <rect x={-h * 0.05} y={-h * 0.45} width={h * 0.1} height={h * 0.45} fill="#2b1810" />
    {pine
      ? [0, 1, 2].map((i) => (<polygon key={i} points={`${-h * (0.3 - i * 0.07)},${-h * (0.3 + i * 0.22)} ${h * (0.3 - i * 0.07)},${-h * (0.3 + i * 0.22)} 0,${-h * (0.75 + i * 0.22)}`} fill={`hsl(${hue},45%,${22 + i * 5}%)`} />))
      : [[-0.2, 0.55, 0.32], [0.2, 0.55, 0.3], [0, 0.78, 0.36]].map(([dx, dy, r], i) => (
        <circle key={i} cx={h * dx} cy={-h * dy} r={h * r} fill={`hsl(${hue},45%,${20 + i * 5}%)`} />))}
  </g>
);

const World: React.FC<{ kind: BgKind; seed: number; frame: number }> = ({ kind, seed, frame }) => {
  const r = useMemo(() => rng(seed), [seed]);
  const hue = useMemo(() => 100 + Math.floor(rng(seed + 1)() * 90), [seed]); // greens -> teals
  const warm = useMemo(() => Math.floor(rng(seed + 2)() * 40), [seed]);
  const trees = useMemo(() => {
    const rr = rng(seed + 3);
    return Array.from({ length: 16 }, () => ({ x: rr() * 2400, h: 380 + rr() * 380, pine: rr() > 0.5 }));
  }, [seed]);
  const sky: Record<BgKind, [string, string]> = {
    forest: [`hsl(${hue + 40},45%,12%)`, `hsl(${hue},40%,24%)`],
    pond: ['#0d1b3d', '#2a3d6b'],
    temple: ['#1a0a06', '#5a2a12'],
    battlefield: ['#2a0a08', `hsl(${10 + warm},70%,32%)`],
    sky: ['#0a1030', '#4a6fd0'],
  };
  const [c1, c2] = sky[kind];
  const stars = useMemo(() => Array.from({ length: 50 }, () => ({ x: rng(seed + 9)() * 0, a: 0 })), [seed]);
  void stars; void r;
  return (
    <AbsoluteFill>
      <Layer depth={0}>
        <svg width={2400} height={2880} style={{ position: 'absolute' }}>
          <defs><linearGradient id={`sk${seed}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={c1} /><stop offset="1" stopColor={c2} /></linearGradient></defs>
          <rect width={2400} height={2880} fill={`url(#sk${seed})`} />
          <circle cx={1500} cy={720} r={110} fill={kind === 'battlefield' ? '#ff6b3d' : '#ffe9a8'} opacity={0.9} />
          {Array.from({ length: 40 }).map((_, i) => (<circle key={i} cx={(i * 977) % 2400} cy={(i * 331) % 1100} r={2 + (i % 3)} fill="#fff" opacity={0.5} />))}
        </svg>
      </Layer>
      {(kind === 'forest' || kind === 'pond') && (
        <>
          <Layer depth={0.25}><svg width={2400} height={2880} style={{ position: 'absolute' }} opacity={0.55}>
            {trees.slice(0, 8).map((t, i) => <Tree key={i} x={t.x} base={1020 + 480} h={t.h * 0.8} hue={hue} pine={t.pine} />)}</svg></Layer>
          <Layer depth={0.5}><svg width={2400} height={2880} style={{ position: 'absolute' }}>
            {trees.slice(8).map((t, i) => <Tree key={i} x={t.x} base={1020 + 600} h={t.h} hue={hue} pine={t.pine} />)}</svg></Layer>
        </>
      )}
      {kind === 'temple' && (
        <Layer depth={0.4}><svg width={2400} height={2880} style={{ position: 'absolute' }}>
          {[0, 1, 2, 3].map((i) => (<path key={i} d="M-190,1000 L-190,640 Q0,380 190,640 L190,1000 Z" transform="translate(1200,480)" fill="none" stroke={[GOLD, '#e8641b', '#c92a2a', GOLD][i]} strokeWidth={26} opacity={1 - i * 0.1} style={{ transform: `translate(1200px,${480}px) scale(${1 - i * 0.14})`, transformOrigin: '0 1000px' }} />))}
          {[760, 1640].map((x, i) => (<g key={i}><rect x={x} y={1260} width={14} height={190} fill={GOLD} /><ellipse cx={x + 7} cy={1235 + Math.sin(frame / 4 + i) * 4} rx={13} ry={30} fill="#ff922b" /></g>))}
        </svg></Layer>
      )}
      {kind === 'battlefield' && (
        <Layer depth={0.45}><svg width={2400} height={2880} style={{ position: 'absolute' }}>
          {[500, 900, 1500, 1900].map((x, i) => (<g key={i}><rect x={x} y={900} width={10} height={420} fill="#2b1810" />
            <path d={`M${x + 10},910 q${60},${20 + Math.sin(frame / 6 + i) * 10} ${120},0 l-${20},44 l${20},44 q-${60},${20} -${120},0 Z`} fill={i % 2 ? '#c92a2a' : GOLD} /></g>))}
        </svg></Layer>
      )}
      {/* ground */}
      <Layer depth={0.8}>
        <svg width={2400} height={2880} style={{ position: 'absolute' }}>
          <rect x={0} y={1760} width={2400} height={1120} fill={kind === 'battlefield' ? '#3a1a10' : `hsl(${hue},35%,14%)`} />
          {kind === 'pond' && (<g>
            <ellipse cx={1200} cy={1840} rx={760} ry={150} fill="#2d5aa8" opacity={0.9} />
            {[0, 1, 2].map((i) => (<ellipse key={i} cx={1200} cy={1840} rx={140 + ((frame * 3 + i * 90) % 270)} ry={(140 + ((frame * 3 + i * 90) % 270)) * 0.2} fill="none" stroke="#bcd4ff" strokeOpacity={0.5} strokeWidth={4} />))}
            {[700, 1000, 1500, 1750].map((x, i) => (<g key={i}><ellipse cx={x} cy={1850 + (i % 2) * 40} rx={54} ry={14} fill="#2f9e44" /><circle cx={x} cy={1836 + (i % 2) * 40} r={14} fill="#f783ac" /></g>))}
          </g>)}
        </svg>
      </Layer>
    </AbsoluteFill>
  );
};

/* Foreground plants (in front of characters) for depth */
const Foreground: React.FC<{ kind: BgKind; seed: number }> = ({ kind, seed }) => {
  if (kind === 'temple' || kind === 'sky') return null;
  const hue = 100 + Math.floor(rng(seed + 1)() * 90);
  return (
    <Layer depth={1.15}>
      <svg width={2400} height={2880} style={{ position: 'absolute' }}>
        {[640, 1000, 1500, 1860].map((x, i) => (
          <g key={i} transform={`translate(${x},1930)`}>
            {Array.from({ length: 7 }).map((_, j) => (<path key={j} d={`M0,0 Q${(j - 3) * 18},-120 ${(j - 3) * 34},-${190 + (j % 3) * 40}`} stroke={`hsl(${hue},50%,${22 + j * 3}%)`} strokeWidth={14} fill="none" strokeLinecap="round" />))}
          </g>))}
      </svg>
    </Layer>
  );
};

/* ───────────────────────── CAPTION (Sanatan Unfold Floating Style) ───────────────────────── */
const Caption: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <div style={{
    position: 'absolute', left: 40, right: 40, bottom: 130, padding: '16px 24px',
    color: '#ffffff',
    textShadow: '0 4px 16px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,0.9)',
    fontFamily: `${devanagariFont}, 'Noto Sans Devanagari', 'Mukta', sans-serif`,
    fontSize: 52, lineHeight: 1.35, textAlign: 'center', fontWeight: 700,
  }}>
    {title && <div style={{ color: '#f5c842', fontSize: 44, marginBottom: 8, fontWeight: 800 }}>{title}</div>}
    <div>{text}</div>
  </div>
);

/* ───────────────────────── SCENE + VIDEO ───────────────────────── */
const SceneView: React.FC<{ scene: Scene; seed: number; dur: number }> = ({ scene, seed, dur }) => {
  const frame = useCurrentFrame();
  const a = scene.actors[scene.focus ?? 0] ?? scene.actors[0];
  const sc = a?.scale ?? 1;
  const focus = a ? { x: a.x, y: (a.y ?? 1280) - 560 * sc } : { x: 540, y: 900 };
  const cam = scene.camera!;
  const fadeIn = Math.min(1, frame / 6);
  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <Camera shot={cam.shot} move={cam.move} dur={dur} focus={focus}>
        <World kind={scene.bg} seed={seed} frame={frame} />
        {scene.actors.map((ac, i) => (<Character key={i} a={ac} frame={frame} />))}
        <Foreground kind={scene.bg} seed={seed} />
      </Camera>
      <Caption title={scene.caption.title} text={scene.caption.text} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── AUDIO ───────────────────────── */
const A = (f: string) => staticFile(`myth-audio/${f}.wav`);

const MythAudio: React.FC<{
  scenes: Scene[]; starts: number[]; durs: number[]; fps: number; total: number;
  music?: boolean; sfx?: boolean; musicVol?: number; duckedVol?: number; voiceVol?: number;
}> = ({ scenes, starts, durs, fps, total, music = true, sfx = true, musicVol = 0.5, duckedVol = 0.2, voiceVol = 1 }) => {
  // windows (in frames) where a voiceover is speaking -> music gets quieter there
  const voiceWins = scenes
    .map((s, i) => (s.voice ? [starts[i] + 6, starts[i] + 6 + Math.round((s.voiceSec ?? 3) * fps)] : null))
    .filter(Boolean) as number[][];
  const musicVolume = (f: number) => {
    const speaking = voiceWins.some(([a, b]) => f >= a - 6 && f <= b + 6);
    const target = speaking ? duckedVol : musicVol;
    const fadeIn = Math.min(1, f / 15);
    const fadeOut = Math.min(1, Math.max(0, (total - f) / (fps * 1.5)));
    return target * fadeIn * fadeOut;
  };
  const hit = (key: string, from: number, name: string, vol: number, len = 40) => (
    <Sequence key={key} from={Math.max(0, Math.round(from))} durationInFrames={len}>
      <Audio src={A(name)} volume={vol} />
    </Sequence>
  );
  const items: React.ReactNode[] = [];
  scenes.forEach((s, i) => {
    const st = starts[i];
    if (sfx) {
      if (i > 0) items.push(hit(`w${i}`, st - 12, 'whoosh', 0.35, 30));
      if (s.beat === 'intro') items.push(hit(`b${i}`, st + 2, 'bell', 0.18, 70));
      if (s.beat === 'reveal') { items.push(hit(`t${i}`, st, 'thump', 0.9, 30)); items.push(hit(`b${i}`, st + 2, 'bell', 0.18, 70)); }
      if (s.beat === 'victory') [0, 5].forEach((d, k) => items.push(hit(`v${i}${k}`, st + 6 + d, k ? 'bell' : 'bell2', 0.14, 70)));
      if (s.beat === 'fight') {
        const beats = Math.floor(durs[i] / (fps / 2));
        for (let k = 0; k < beats; k++) {
          const at = st + k * (fps / 2);
          items.push(hit(`d${i}_${k}`, at, 'thump', k % 2 === 0 ? 0.8 : 0.5, 20));
          if (k % 2 === 1) items.push(hit(`n${i}_${k}`, at, 'snap', 0.25, 12));
        }
      }
    }
    if (s.voice) {
      items.push(
        <Sequence key={`voice${i}`} from={st + 6} durationInFrames={Math.round((s.voiceSec ?? 8) * fps) + 6}>
          <Audio src={staticFile(s.voice)} volume={voiceVol} />
        </Sequence>,
      );
    }
  });
  return (
    <>
      {music && <Audio src={A('score')} loop volume={musicVolume} />}
      {items}
    </>
  );
};

/* Total frames of a video (use this for durationInFrames; honours voice lengths) */
export const sceneFrames = (s: Scene, fps = 30) => Math.max(1, Math.round(Math.max(s.sec, s.voiceSec ? s.voiceSec + 0.4 : 0) * fps));
export const totalFrames = (scenes: Scene[], fps = 30) => scenes.reduce((a, s) => a + sceneFrames(s, fps), 0);

export const MythShort: React.FC<{
  scenes: Scene[]; seed: number; fps?: number;
  music?: boolean; sfx?: boolean; musicVol?: number; duckedVol?: number; voiceVol?: number;
}> = ({ scenes, seed, fps = 30, ...audio }) => {
  const planned = useMemo(() => directCameras(scenes, seed), [scenes, seed]);
  const durs = planned.map((s) => sceneFrames(s, fps));
  const starts = durs.map((_, i) => durs.slice(0, i).reduce((a, b) => a + b, 0));
  const total = durs.reduce((a, b) => a + b, 0);
  return (
    <AbsoluteFill style={{ background: '#0b0604' }}>
      <Series>
        {planned.map((s, i) => (
          <Series.Sequence key={i} durationInFrames={durs[i]}>
            <SceneView scene={s} seed={seed + i * 31} dur={durs[i]} />
          </Series.Sequence>
        ))}
      </Series>
      <MythAudio scenes={planned} starts={starts} durs={durs} fps={fps} total={total} {...audio} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── EXAMPLE (Sanatan Unfold Guru & Shishya scenes) ───────────────────────── */
export const EXAMPLE_SCENES: Scene[] = [
  { sec: 5, beat: 'intro', bg: 'forest',
    actors: [
      { who: 'guru', pose: 'pray', x: 400 },
      { who: 'shishya', pose: 'stand', x: 760, flip: true }
    ],
    caption: { title: 'महाभारत की छिपी वजहें', text: 'गुरु द्रोण और उनके शिष्यों का सबसे बड़ा रहस्य!' } },
  { sec: 6, beat: 'talk', bg: 'forest',
    actors: [
      { who: 'guru', pose: 'point', x: 340 },
      { who: 'shishya', pose: 'talk', x: 740, flip: true }
    ],
    focus: 0, caption: { title: 'गुरु का आदेश', text: "'धनुष उठाओ वत्स! धर्म की रक्षा ही तुम्हारा कर्तव्य है।'" } },
  { sec: 5, beat: 'reveal', bg: 'pond',
    actors: [{ who: 'rishi', pose: 'sit', x: 540 }],
    caption: { title: 'तपस्या का फल', text: "'अधर्म चाहे कितना भी बलवान हो, अंत सत्य का ही होगा!'" } },
  { sec: 7, beat: 'fight', bg: 'battlefield',
    actors: [{ who: 'arjuna', pose: 'fight', x: 320, weapon: 'bow' }, { who: 'asura', pose: 'fight', x: 800, flip: true }],
    caption: { title: 'रणभूमि में महाप्रहार', text: 'गांडीव की टंकार से थर्रा उठी शत्रु सेना!' } },
  { sec: 5, beat: 'victory', bg: 'sky',
    actors: [{ who: 'krishna', pose: 'stand', x: 700, weapon: 'chakra' }, { who: 'guru', pose: 'pray', x: 360 }],
    caption: { title: 'धर्म की विजय', text: 'बोलो श्रीकृष्ण भगवान की जय!' } },
];

