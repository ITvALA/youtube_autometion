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
import { AbsoluteFill, Audio, Easing, Sequence, Series, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadNoto } from '@remotion/google-fonts/NotoSansDevanagari';
import { ClashSparks, SlashTrail, FlyingArrows, ArmyMarch } from '../components/PuppetKit';
import { AnimeSpeedLines } from '../components/anime/AnimeSpeedLines';

const devanagariFont = loadNoto('normal', { weights: ['400', '700', '800'], subsets: ['devanagari'] }).fontFamily;

/* ───────────────────────── TYPES ───────────────────────── */
export type Pose = 'stand' | 'sit' | 'fly' | 'fight' | 'pray' | 'point' | 'talk' | 'walk';
export type Weapon = 'none' | 'gada' | 'bow' | 'trishul' | 'chakra' | 'sword';
export type BgKind = 'forest' | 'pond' | 'temple' | 'battlefield' | 'sky' | 'palace';
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
  enter?: 'left' | 'right' | 'none'; // walk in from the screen edge when the scene starts (set by the choreographer)
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
  voiceLead?: number;   // extra frames before the voice starts (first scene waits for the opening effect)
  camera?: { shot: ShotName; move: MoveName }; // only honoured when cameraLock is true
  cameraLock?: boolean; // true = use `camera` as-is; otherwise the seeded camera director decides
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
  wide:    { x: 0,    y: -18, z: 0.80, rx: 0,   ry: 0,   rz: 0,  focusW: 0 },
  medium:  { x: 0,    y: -10, z: 0.94, rx: 0,   ry: 0,   rz: 0,  focusW: 0.15 },
  closeup: { x: 0,    y: -6,  z: 1.08, rx: 0,   ry: 0,   rz: 0,  focusW: 0.20 },
  extreme: { x: 0,    y: 8,   z: 1.18, rx: 0,   ry: 0,   rz: 0,  focusW: 0.24 },
  low:     { x: 0,    y: 35,  z: 1.02, rx: -10, ry: 0,   rz: 0,  focusW: 0.15 },
  high:    { x: 0,    y: -36, z: 0.88, rx: 12,  ry: 0,   rz: 0,  focusW: 0.1 },
  dutch:   { x: 0,    y: 0,   z: 0.98, rx: -5,  ry: 7,   rz: -9, focusW: 0.15 },
  side:    { x: -32,  y: -10, z: 0.94, rx: -2,  ry: 15,  rz: 0,  focusW: 0.15 },
  sideR:   { x: 32,   y: -10, z: 0.94, rx: -2,  ry: -15, rz: 0,  focusW: 0.15 },
  over:    { x: -45,  y: -12, z: 1.04, rx: 2,   ry: 12,  rz: 0,  focusW: 0.18 },
};

const MOVES: Record<MoveName, (t: number, f: number) => Partial<Cam>> = {
  still:     () => ({}),
  pushIn:    (t) => ({ z: 0.12 * t }),
  pullOut:   (t) => ({ z: 0.12 * (1 - t) }),
  panL:      (t) => ({ x: 50 * (0.5 - t) }),
  panR:      (t) => ({ x: -50 * (0.5 - t) }),
  tiltUp:    (t) => ({ y: 50 * (1 - t) - 20, rx: -3 * t }),
  craneDown: (t) => ({ y: -70 * (1 - t), rx: 5 * (1 - t) }),
  orbit:     (t) => ({ ry: -10 + 20 * t, x: 20 * (0.5 - t) }),
  shake:     (_t, f) => ({ x: Math.sin(f * 1.9) * 6, y: Math.cos(f * 2.3) * 5, rz: Math.sin(f * 1.3) * 0.4 }),
  whip:      (t) => ({ x: 140 * Math.pow(1 - t, 3), rz: 1.5 * Math.pow(1 - t, 3) }),
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
    // grounded, subtle organic drift without disorienting pans
    x: b.x + (m.x ?? 0) + Math.sin(f / 47) * 4 - b.focusW * z * (focus.x - 540) * 0.35,
    y: b.y + (m.y ?? 0) + Math.cos(f / 61) * 3 - b.focusW * z * (focus.y - 960) * 0.25,
    rx: b.rx + (m.rx ?? 0),
    ry: b.ry + (m.ry ?? 0),
    rz: b.rz + (m.rz ?? 0),
  };
  return (
    <CamCtx.Provider value={cam}>
      <AbsoluteFill style={{ perspective: 1400, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute', inset: 0, transformOrigin: '50% 50%',
            transformStyle: 'preserve-3d',
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

// first scene voice starts quickly with 4 frames lead so scene 0 is immediately active
export const withLead = (scenes: Scene[]): Scene[] =>
  scenes.map((s, i) => (i === 0 ? { ...s, voiceLead: s.voiceLead ?? 4 } : s));

export function directCameras(rawScenes: Scene[], seed: number): Scene[] {
  const scenes = withLead(rawScenes);
  const r = rng(seed * 7919 + 13);
  const recentShots: ShotName[] = [];
  let prevMove: MoveName | null = null;
  const pickAvoid = <T,>(arr: T[], avoid: T[]) => {
    const pool = arr.filter((a) => !avoid.includes(a));
    const src = pool.length ? pool : arr;
    return src[Math.floor(r() * src.length)];
  };
  return scenes.map((s) => {
    // The LLM / fallback plan used to ALWAYS carry a camera, which switched this director off.
    // Now the director decides every scene (seeded, so every video differs) unless cameraLock is set.
    if (s.camera && s.cameraLock) {
      recentShots.push(s.camera.shot); prevMove = s.camera.move;
      return s;
    }
    const rule = BEAT_RULES[s.beat];
    const shot = pickAvoid(rule.shots, recentShots.slice(-2));
    const move = pickAvoid(rule.moves, prevMove ? [prevMove] : []);
    recentShots.push(shot); prevMove = move;
    return { ...s, camera: { shot, move } };
  });
}

/* ───────────────────────── CHARACTER (SVG puppet) ───────────────────────── */
const POSES: Record<Pose, { aL: number; aR: number; bL: number; bR: number; lL: number; lR: number; spread: number }> = {
  stand: { aL: 12,  aR: -12,  bL: 6,   bR: -6,   lL: 5,  lR: -5,  spread: 0 },
  fight: { aL: 70,  aR: -150, bL: 60,  bR: -30,  lL: 24, lR: -20, spread: 1 },
  sit:   { aL: 32,  aR: -32,  bL: 20,  bR: -20,  lL: 0,  lR: 0,   spread: 0 },
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
      {/* Baju-band (royal jeweled armlet) */}
      <rect x={-22} y={32} width={44} height={14} rx={6} fill={GOLD} stroke={INK} strokeWidth={2.5} />
      <circle cx={0} cy={39} r={4.5} fill="#c92a2a" />
      <g transform={`translate(0,106) rotate(${b})`}>
        <rect x={-17} y={0} width={34} height={104} rx={17} fill={skin} stroke={INK} strokeWidth={4} />
        {/* Royal Kada / Golden Bracelet */}
        <rect x={-21} y={62} width={42} height={16} rx={7} fill={GOLD} stroke={INK} strokeWidth={2.5} />
        <line x1={-18} y1={70} x2={18} y2={70} stroke="#c92a2a" strokeWidth={3} />
        {/* Sculpted natural hand with fingers & thumb */}
        <path d="M-15,102 Q-20,116 -12,128 Q-2,134 10,128 Q18,120 15,104 Q12,96 2,96 Z" fill={skin} stroke={INK} strokeWidth={3.5} />
        <path d="M-6,110 Q-10,118 -6,124" stroke={INK} strokeWidth={2} />
        <path d="M2,110 Q-2,118 2,124" stroke={INK} strokeWidth={2} />
        <g transform="translate(0,112)"><WeaponSvg w={weapon} frame={frame} /></g>
      </g>
    </g>
  );

const Head: React.FC<{ g: God; angry: boolean; blink?: boolean; mouth?: number; tilt?: number; talking?: boolean; frame?: number }> = ({
  g, angry, blink = false, mouth = 0, tilt = 0, talking = false, frame = 0
}) => {
  const browShift = talking ? Math.sin(frame / 3.8) * 3 : 0;
  const kundalSway = Math.sin(frame / 16) * 3.5;
  return (
    <g transform={`translate(0,-300) rotate(${tilt})`}>
      {/* halo */}
      <g>
        {Array.from({ length: 20 }).map((_, i) => (
          <polygon key={i} points="-14,-96 14,-96 0,-136" fill={g.halo} transform={`rotate(${i * 18})`} />))}
        <circle r={100} fill={g.halo} />
        <circle r={86} fill="#14080a" />
      </g>
      {g.crown === 'ganesha' && (<path d="M-14,30 Q-10,120 40,110 Q70,100 56,70" fill="none" stroke={g.skin} strokeWidth={34} strokeLinecap="round" />)}

      {/* Head base */}
      <circle r={68} fill={g.skin} stroke={INK} strokeWidth={5} />

      {/* Royal Kundal (Golden Drop Earrings with Ruby Stud) on both ears */}
      {[-68, 68].map((ex, i) => (
        <g key={i} transform={`translate(${ex}, 12) rotate(${i === 0 ? kundalSway : -kundalSway})`}>
          <circle cx={0} cy={0} r={8} fill={GOLD} stroke={INK} strokeWidth={2.5} />
          <circle cx={0} cy={0} r={3.5} fill="#c92a2a" />
          <path d="M0,8 L-5,24 L0,29 L5,24 Z" fill={GOLD} stroke={INK} strokeWidth={2} />
          <circle cx={0} cy={32} r={4.5} fill="#ffd700" />
        </g>
      ))}

      {/* Crowns & Headgears */}
      {g.crown === 'monkey' && <ellipse cx={0} cy={22} rx={42} ry={34} fill="#f6d9a0" stroke={INK} strokeWidth={3} />}
      {g.crown === 'lion' && Array.from({ length: 14 }).map((_, i) => (
        <polygon key={i} points="-12,-62 12,-62 0,-100" fill="#c2761a" transform={`rotate(${i * 25.7})`} />))}
      {(g.crown === 'mukut' || g.crown === 'monkey' || g.crown === 'ganesha' || g.crown === 'ravan') && (
        <g>
          <polygon points="-44,-52 0,-170 44,-52" fill={GOLD} stroke={INK} strokeWidth={4} />
          <polygon points="-28,-52 0,-140 28,-52" fill="#ffd700" opacity={0.8} />
          <circle cx={0} cy={-100} r={9} fill="#d6336c" stroke={INK} strokeWidth={2} />
          <circle cx={0} cy={-140} r={6} fill="#2f9e44" />
        </g>
      )}
      {g.crown === 'royal_mukut' && (
        <g>
          <polygon points="-56,-52 -28,-180 0,-130 28,-180 56,-52" fill={GOLD} stroke={INK} strokeWidth={4} />
          <circle cx={-28} cy={-120} r={8} fill="#2f9e44" stroke={INK} strokeWidth={2} />
          <circle cx={28} cy={-120} r={8} fill="#2f9e44" stroke={INK} strokeWidth={2} />
          <circle cx={0} cy={-85} r={12} fill="#c92a2a" stroke={INK} strokeWidth={2.5} />
        </g>
      )}
      {g.crown === 'pagdi' && (
        <g>
          <ellipse cx={0} cy={-50} rx={66} ry={36} fill={g.cloth} stroke={INK} strokeWidth={4} />
          <circle cx={0} cy={-55} r={11} fill={GOLD} stroke={INK} strokeWidth={2} />
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

      {/* Realistic Almond-shaped Eyes with Iris and Specular Highlights */}
      {blink ? (
        <path d="M-38,-4 Q-24,6 -10,-4 M10,-4 Q24,6 38,-4" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      ) : (
        <g>
          {[-24, 24].map((ex, i) => (
            <g key={i}>
              <path d={`M${ex - 15},-6 Q${ex},-17 ${ex + 15},-6 Q${ex},5 ${ex - 15},-6 Z`} fill="#ffffff" stroke={INK} strokeWidth={2.5} />
              <ellipse cx={ex} cy={-6} rx={7} ry={6.5} fill={angry ? '#b91c1c' : '#1e293b'} />
              <circle cx={ex} cy={-6} r={3.2} fill="#0f172a" />
              <circle cx={ex + 2.2} cy={-8.5} r={2.2} fill="#ffffff" />
            </g>
          ))}
        </g>
      )}

      {/* Expressive Eyebrows that Emote Dynamically */}
      <path
        d={angry
          ? 'M-42,-24 L-8,-14 M42,-24 L8,-14'
          : `M-40,${-22 + browShift} L-10,${-24 + browShift} M40,${-22 + browShift} L10,${-24 + browShift}`}
        stroke={INK}
        strokeWidth={5.5}
        strokeLinecap="round"
      />

      {/* Realistic Speech Mouth with Lip Contours */}
      {mouth > 0.12 ? (
        <g transform="translate(0, 36)">
          <path
            d={`M${-12 - mouth * 5},0 Q0,${-6 - mouth * 4} ${12 + mouth * 5},0 Q0,${14 + mouth * 16} ${-12 - mouth * 5},0 Z`}
            fill="#3b0a0a"
            stroke={INK}
            strokeWidth={2.5}
          />
          <path d={`M${-8 - mouth * 2},-1 Q0,${-3} ${8 + mouth * 2},-1`} stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" />
          <ellipse cx={0} cy={6 + mouth * 6} rx={6 + mouth * 3} ry={3 + mouth * 3} fill="#d6336c" />
          <path d={`M${-14 - mouth * 5},-2 Q0,${-7} ${14 + mouth * 5},-2`} fill="none" stroke="#a3182d" strokeWidth={2} />
        </g>
      ) : (
        <g transform="translate(0, 34)">
          <path d={angry ? 'M-18,6 Q0,-4 18,6' : 'M-18,-2 Q0,10 18,-2'} fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
          <path d="M-10,-4 Q0,-2 10,-4" fill="none" stroke="#a3182d" strokeWidth={2} />
        </g>
      )}

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

      {/* Long Pointed Guru/Rishi Beard */}
      {g.beard && (
        <path d="M-44,22 Q-32,150 0,185 Q32,150 44,22 Q28,50 0,55 Q-28,50 -44,22 Z" fill="#231812" stroke={INK} strokeWidth={4} />
      )}
    </g>
  );
};

/* ───────────────────────── ROYAL DHWAJA (सaffron / Royal Banners) ───────────────────────── */
const FlutteringDhwaja: React.FC<{ x: number; y: number; h?: number; color?: string; frame: number }> = ({
  x, y, h = 320, color = '#ff6b1a', frame
}) => {
  const wave1 = Math.sin(frame / 6.5) * 14;
  const wave2 = Math.sin(frame / 7.8 + 1.2) * 10;
  return (
    <g transform={`translate(${x}, ${y})`}>
      <line x1={0} y1={-h} x2={0} y2={0} stroke="#4a2e18" strokeWidth={7} strokeLinecap="round" />
      <polygon points={`0,${-h - 26} -10,${-h} 10,${-h}`} fill={GOLD} stroke={INK} strokeWidth={2} />
      <circle cx={0} cy={-h} r={6.5} fill="#ffd700" />
      <path
        d={`M0,${-h + 6} Q${60 + wave1},${-h + 12 + wave2} 160,${-h + 20 + wave1} L120,${-h + 58} L170,${-h + 88 + wave2} Q${60 + wave2},${-h + 78 + wave1} 0,${-h + 98} Z`}
        fill={color}
        stroke="#9a2a0a"
        strokeWidth={3}
      />
      <circle cx={44} cy={-h + 48} r={13} fill="#ffd700" opacity={0.88} />
      <circle cx={44} cy={-h + 48} r={6} fill="#c92a2a" />
    </g>
  );
};

/* ───────────────────────── ROYAL ELEPHANT (शाही ऐरावत / हाथी) ───────────────────────── */
const RoyalElephant: React.FC<{ x: number; y: number; scale?: number; flip?: boolean; frame: number }> = ({
  x, y, scale = 1, flip = false, frame
}) => {
  const trunkLift = Math.sin(frame / 14) * 12;
  const earFlap = Math.sin(frame / 12) * 7;
  const tailSway = Math.sin(frame / 10) * 8;
  return (
    <g transform={`translate(${x}, ${y}) scale(${flip ? -scale : scale}, ${scale})`}>
      {/* Silky tail */}
      <path d={`M-160,-120 Q-190,${-40 + tailSway} -180,20`} stroke="#3b3e45" strokeWidth={8} fill="none" strokeLinecap="round" />
      {/* Back legs */}
      <rect x={-140} y={-40} width={48} height={180} rx={18} fill="#464a52" stroke={INK} strokeWidth={4} />
      <rect x={-80} y={-40} width={48} height={180} rx={18} fill="#3b3e45" stroke={INK} strokeWidth={4} />
      {/* Massive elephant torso */}
      <ellipse cx={-20} cy={-90} rx={160} ry={120} fill="#545861" stroke={INK} strokeWidth={5} />
      {/* Front legs */}
      <rect x={40} y={-40} width={52} height={180} rx={18} fill="#464a52" stroke={INK} strokeWidth={4} />
      <rect x={100} y={-40} width={52} height={180} rx={18} fill="#545861" stroke={INK} strokeWidth={4} />
      {[-130, -112, 110, 130].map((nx, i) => (
        <circle key={i} cx={nx} cy={135} r={6} fill="#f1f3f5" />
      ))}
      {/* Royal Jhul (Embroidered saddle blanket with gold tassels) */}
      <path d="M-110,-140 Q-20,-155 70,-140 L85,-10 Q-20,15 -115,-10 Z" fill="#801020" stroke={GOLD} strokeWidth={5} />
      <path d="M-95,-120 Q-20,-130 55,-120 L65,-20 Q-20,0 -95,-20 Z" fill="#9e182a" />
      {[-60, -20, 20].map((dx, i) => (
        <polygon key={i} points={`${dx},-70 ${dx + 16},-50 ${dx},-30 ${dx - 16},-50`} fill={GOLD} stroke={INK} strokeWidth={2} />
      ))}
      {[-100, -70, -40, -10, 20, 50, 75].map((bx, i) => (
        <circle key={i} cx={bx} cy={0} r={5} fill={GOLD} stroke={INK} strokeWidth={1.5} />
      ))}
      {/* Golden Howdah (शाही अंबारी) on back */}
      <g transform="translate(-20, -170)">
        <rect x={-65} y={-40} width={130} height={45} rx={8} fill={GOLD} stroke={INK} strokeWidth={4} />
        {[-45, -20, 5, 30].map((rx, i) => (
          <line key={i} x1={rx} y1={-40} x2={rx} y2={-10} stroke="#9e7c10" strokeWidth={3} />
        ))}
        <rect x={-55} y={-35} width={110} height={20} fill="#701222" rx={4} />
        <line x1={-60} y1={-90} x2={-60} y2={-40} stroke="#5c4018" strokeWidth={4} />
        <path d={`M-60,-90 Q-30,${-95 + Math.sin(frame / 7) * 8} 0,${-90 + Math.sin(frame / 7) * 6} L-20,-70 Q-40,-72 -60,-65 Z`} fill="#ff7a00" />
      </g>
      {/* Elephant Head & Tusks */}
      <g transform="translate(140, -110)">
        <circle cx={0} cy={0} r={70} fill="#545861" stroke={INK} strokeWidth={5} />
        <polygon points="-30,-40 30,-40 20,10 -20,10" fill={GOLD} stroke={INK} strokeWidth={3} />
        <circle cx={0} cy={-15} r={9} fill="#c92a2a" stroke={INK} strokeWidth={2} />
        <path d="M20,20 Q60,40 85,0 Q65,-10 30,10 Z" fill="#fffdf0" stroke={INK} strokeWidth={3} />
        <rect x={42} y={14} width={8} height={14} rx={2} fill={GOLD} transform="rotate(25 42 14)" />
        <path
          d={`M15,30 Q${40 + trunkLift},80 ${30 + trunkLift},140 Q${65 + trunkLift},160 ${80 + trunkLift},130 Q${55 + trunkLift},100 ${35 + trunkLift},30 Z`}
          fill="#545861"
          stroke={INK}
          strokeWidth={4.5}
        />
        <circle cx={10} cy={-20} r={6} fill="#ffffff" stroke={INK} strokeWidth={2} />
        <circle cx={11} cy={-20} r={3} fill="#212529" />
        <path
          d={`M-30,-30 Q${-90 + earFlap},-40 ${-75 + earFlap},30 Q${-40 + earFlap},60 -15,20 Z`}
          fill="#464a52"
          stroke={INK}
          strokeWidth={4}
        />
      </g>
    </g>
  );
};

/* ───────────────────────── ROYAL WAR HORSE (शाही युद्ध अश्व / घोड़ा) ───────────────────────── */
const RoyalHorse: React.FC<{ x: number; y: number; scale?: number; flip?: boolean; frame: number }> = ({
  x, y, scale = 1, flip = false, frame
}) => {
  const tailWave = Math.sin(frame / 8) * 10;
  const headBob = Math.sin(frame / 14) * 4;
  return (
    <g transform={`translate(${x}, ${y}) scale(${flip ? -scale : scale}, ${scale})`}>
      <path d={`M-130,-50 Q-170,${0 + tailWave} -150,60`} stroke="#1a110b" strokeWidth={14} fill="none" strokeLinecap="round" />
      <path d="M-105,-40 L-120,40 L-100,140" stroke="#8a4b24" strokeWidth={22} fill="none" strokeLinecap="round" />
      <path d="M-60,-40 L-75,40 L-60,140" stroke="#6d3918" strokeWidth={20} fill="none" strokeLinecap="round" />
      <rect x={-112} y={130} width={24} height={14} rx={4} fill="#1a110b" />
      <rect x={-72} y={130} width={24} height={14} rx={4} fill="#1a110b" />
      <ellipse cx={-10} cy={-30} rx={115} ry={60} fill="#8a4b24" stroke={INK} strokeWidth={4.5} />
      <path d="M40,-30 L55,40 L50,140" stroke="#6d3918" strokeWidth={20} fill="none" strokeLinecap="round" />
      <path d="M85,-30 L95,40 L90,140" stroke="#8a4b24" strokeWidth={22} fill="none" strokeLinecap="round" />
      <rect x={38} y={130} width={24} height={14} rx={4} fill="#1a110b" />
      <rect x={78} y={130} width={24} height={14} rx={4} fill="#1a110b" />
      <rect x={-45} y={-72} width={70} height={24} rx={8} fill="#701222" stroke={GOLD} strokeWidth={3} />
      <path d="M-30,-48 L-15,10" stroke={GOLD} strokeWidth={4} />
      <circle cx={-15} cy={14} r={6} fill={GOLD} />
      <g transform={`translate(0, ${headBob})`}>
        <path d="M50,-40 Q90,-100 115,-130 L155,-90 Q120,-30 80,-10 Z" fill="#8a4b24" stroke={INK} strokeWidth={4} />
        <path d="M60,-55 Q95,-105 110,-130" stroke="#1a110b" strokeWidth={16} fill="none" strokeLinecap="round" />
        <polygon points="110,-140 155,-160 175,-120 135,-95" fill="#8a4b24" stroke={INK} strokeWidth={4} />
        <polygon points="120,-145 130,-175 140,-150" fill="#6d3918" stroke={INK} strokeWidth={2.5} />
        <line x1={130} y1={-150} x2={165} y2={-115} stroke={GOLD} strokeWidth={3.5} />
        <line x1={140} y1={-130} x2={175} y2={-125} stroke={GOLD} strokeWidth={3.5} />
        <circle cx={155} cy={-120} r={5} fill="#ffd700" />
        <circle cx={145} cy={-135} r={5} fill="#ffffff" />
        <circle cx={146} cy={-135} r={2.8} fill="#1a110b" />
      </g>
    </g>
  );
};

/* ───────────────────────── TEMPLE VIMANA & ARCHITECTURE (भव्य पाषाण मंदिर) ───────────────────────── */
const TempleVimana: React.FC<{ x: number; y: number; frame: number }> = ({ x, y, frame }) => (
  <g transform={`translate(${x}, ${y})`}>
    <path d="M-220,1200 L-220,950 L220,950 L220,1200 Z" fill="#442a1d" stroke="#25140b" strokeWidth={6} />
    <path d="M-180,950 L-180,780 L180,780 L180,950 Z" fill="#523424" stroke="#25140b" strokeWidth={5} />
    <path d="M-140,780 L-140,620 L140,620 L140,780 Z" fill="#5f3d2b" stroke="#25140b" strokeWidth={5} />
    <path d="M-100,620 L-100,480 L100,480 L100,620 Z" fill="#6d4733" stroke="#25140b" strokeWidth={5} />
    <path d="M-70,480 Q-50,320 0,260 Q50,320 70,480 Z" fill="#7d523c" stroke="#25140b" strokeWidth={5} />
    <ellipse cx={0} cy={260} rx={42} ry={16} fill="#b8860b" stroke={INK} strokeWidth={3} />
    <path d="M-16,260 L-8,210 L8,210 L16,260 Z" fill={GOLD} stroke={INK} strokeWidth={2.5} />
    <circle cx={0} cy={200} r={12} fill="#ffd700" stroke={INK} strokeWidth={2} />
    <polygon points="0,175 -6,200 6,200" fill={GOLD} />
    <FlutteringDhwaja x={0} y={175} h={140} color="#ff6b1a" frame={frame} />
    {[-120, 0, 120].map((gx, i) => (
      <path key={i} d={`M${gx - 20},930 Q${gx},880 ${gx + 20},930 Z`} fill="#2a160c" />
    ))}
    {[-80, 0, 80].map((gx, i) => (
      <path key={i} d={`M${gx - 16},760 Q${gx},720 ${gx + 16},760 Z`} fill="#2a160c" />
    ))}
    {[-40, 40].map((gx, i) => (
      <path key={i} d={`M${gx - 12},600 Q${gx},570 ${gx + 12},600 Z`} fill="#2a160c" />
    ))}
    {[-200, -100, 100, 200].map((px, i) => {
      const bellSway = Math.sin(frame / 16 + i) * 6;
      return (
        <g key={i}>
          <rect x={px - 14} y={950} width={28} height={250} fill="#5a3826" stroke="#25140b" strokeWidth={3.5} />
          <rect x={px - 22} y={950} width={44} height={16} fill={GOLD} opacity={0.6} />
          <g transform={`translate(${px}, 980) rotate(${bellSway})`}>
            <line x1={0} y1={0} x2={0} y2={35} stroke={GOLD} strokeWidth={3} />
            <path d="M-14,35 Q-16,65 -22,70 L22,70 Q16,65 14,35 Z" fill="#d49b13" stroke={INK} strokeWidth={2.5} />
            <circle cx={0} cy={74} r={5} fill={GOLD} />
          </g>
          <g transform={`translate(${px}, 1130)`}>
            <ellipse cx={0} cy={0} rx={14} ry={5} fill="#8b5a2b" stroke={INK} strokeWidth={2} />
            <ellipse cx={0} cy={-12 + Math.sin(frame / 4 + i) * 2} rx={6} ry={14} fill="#ff922b" />
            <circle cx={0} cy={-10} r={4} fill="#ffe066" />
          </g>
        </g>
      );
    })}
  </g>
);

/* ───────────────────────── ROYAL THRONE (सिंहासन) ───────────────────────── */
const RoyalThrone: React.FC<{ isPalace?: boolean }> = () => (
  <g transform="translate(0, 10)">
    <path
      d="M-135,20 L-135,-250 Q-135,-370 0,-425 Q135,-370 135,-250 L135,20 Z"
      fill="#b8860b"
      stroke={INK}
      strokeWidth={6}
    />
    <path
      d="M-115,10 L-115,-235 Q-115,-350 0,-400 Q115,-350 115,-235 L115,10 Z"
      fill="#ffd700"
      stroke={INK}
      strokeWidth={3}
    />
    {Array.from({ length: 11 }).map((_, i) => {
      const ang = -60 + i * 12;
      return (
        <line
          key={i}
          x1={0}
          y1={-400}
          x2={Math.sin((ang * Math.PI) / 180) * 55}
          y2={-400 - Math.cos((ang * Math.PI) / 180) * 55}
          stroke={GOLD}
          strokeWidth={5}
          strokeLinecap="round"
        />
      );
    })}
    <circle cx={0} cy={-400} r={16} fill="#c92a2a" stroke={INK} strokeWidth={3} />
    <path
      d="M-88,15 L-88,-200 Q-88,-295 0,-340 Q88,-295 88,-200 L88,15 Z"
      fill="#7a1222"
      stroke={INK}
      strokeWidth={3}
    />
    {[-50, -25, 0, 25, 50].map((x, i) => (
      <line key={i} x1={x} y1={-250 + Math.abs(x) * 1.2} x2={x} y2={10} stroke="#a3182d" strokeWidth={2} />
    ))}
    <g>
      <rect x={-152} y={-85} width={34} height={100} rx={12} fill={GOLD} stroke={INK} strokeWidth={4} />
      <circle cx={-135} cy={-90} r={18} fill="#ffd700" stroke={INK} strokeWidth={3} />
      <circle cx={-135} cy={-90} r={7} fill="#c92a2a" />
      <rect x={118} y={-85} width={34} height={100} rx={12} fill={GOLD} stroke={INK} strokeWidth={4} />
      <circle cx={135} cy={-90} r={18} fill="#ffd700" stroke={INK} strokeWidth={3} />
      <circle cx={135} cy={-90} r={7} fill="#c92a2a" />
    </g>
    <rect x={-135} y={-12} width={270} height={46} rx={14} fill="#8b1525" stroke={INK} strokeWidth={4} />
    <rect x={-128} y={-6} width={256} height={10} fill={GOLD} opacity={0.85} />
    <path d="M-150,34 L150,34 L170,110 L-170,110 Z" fill="#b8860b" stroke={INK} strokeWidth={5} />
    <path d="M-140,42 L140,42 L155,102 L-155,102 Z" fill="#ffd700" stroke={INK} strokeWidth={2} />
    {[-110, -55, 0, 55, 110].map((px, i) => (
      <path key={i} d={`M${px - 22},102 Q${px},70 ${px + 22},102 Z`} fill="#d49b13" stroke={INK} strokeWidth={2} />
    ))}
  </g>
);

const ENTER_FRAMES = 50;

const Character: React.FC<{ a: Actor; frame: number; talking?: boolean; idx?: number }> = ({ a, frame, talking = false, idx = 0 }) => {
  const g = ROSTER[a.who as string] ?? ROSTER.krishna;
  const dir = a.enter === 'left' ? -1 : a.enter === 'right' ? 1 : 0;
  const entering = dir !== 0 && frame < ENTER_FRAMES && a.pose !== 'fly' && a.pose !== 'sit';
  const pose: Pose = entering ? 'walk' : a.pose;
  const P = POSES[pose] ?? POSES.stand;
  const sc = (a.scale ?? 1) * 0.82;
  const isDivine = ['durga', 'krishna', 'shiva', 'vishnu', 'brahma', 'parvati', 'kali', 'lakshmi', 'saraswati'].includes(String(a.who).toLowerCase());
  const ground = a.y ?? 1360;

  const weapon: Weapon = (a.weapon && a.weapon !== 'none')
    ? a.weapon
    : (g.weapon && g.weapon !== 'none')
      ? g.weapon
      : (pose === 'fight' ? 'sword' : 'none');

  const angry = a.angry ?? pose === 'fight';
  const idle = Math.sin(frame / 9 + idx);

  // Natural human-like walking animation
  const explicitTravel = a.pose === 'walk' && !entering ? Math.min(frame * 0.9, 240) : 0;
  const walkingNow = pose === 'walk' && (entering || frame * 0.9 < 240);

  const walkSpeed = 5.2;
  const walkStep = frame / walkSpeed;
  const humanLegL = walkingNow ? Math.sin(walkStep) * 26 : 0;
  const humanLegR = walkingNow ? -Math.sin(walkStep) * 26 : 0;
  const humanKneeL = walkingNow && humanLegL < 0 ? Math.abs(humanLegL) * 0.65 : 0;
  const humanKneeR = walkingNow && humanLegR < 0 ? Math.abs(humanLegR) * 0.65 : 0;
  const humanFootL = walkingNow ? (humanLegL > 0 ? -10 : 12) : 0;
  const humanFootR = walkingNow ? (humanLegR > 0 ? -10 : 12) : 0;

  // Opposite arm swing during human walking
  const humanArmSwingL = walkingNow ? -Math.sin(walkStep) * 28 : (pose === 'fight' ? 25 : idle * 4);
  const humanArmSwingR = walkingNow ? Math.sin(walkStep) * 28 : (pose === 'fight' ? Math.sin(frame / 4.2) * 65 : idle * 4);

  // Human vertical bounce (bobbing twice per step cycle)
  const humanBob = walkingNow ? Math.abs(Math.sin(walkStep)) * 8 : pose === 'fly' ? Math.sin(frame / 7) * 22 : pose === 'sit' ? Math.sin(frame / 14) * 3 : idle * 2.5;
  const humanTorsoSway = walkingNow ? Math.sin(walkStep) * 2.2 : pose === 'fight' || pose === 'fly' ? 0 : Math.sin(frame / 27 + idx) * 1.4;

  const sitDrop = pose === 'sit' ? 120 : 0;
  const flyRot = pose === 'fly' ? 72 : 0;
  const lift = pose === 'fly' ? -260 : 0;

  // Emotional gestures while speaking
  const gest = talking || pose === 'talk' || pose === 'point' ? Math.sin(frame / 4.5 + idx * 2) * 10 : 0;
  const blink = (frame + idx * 17) % 96 < 4;
  const mouth = talking ? Math.abs(Math.sin(frame / 2.2 + idx)) * (0.6 + 0.4 * Math.sin(frame / 5.8)) : 0;
  const tilt = Math.sin(frame / 23 + idx * 1.3) * 2.2 + (talking ? Math.sin(frame / 4) * 2 : 0);

  const faceLeft = entering ? dir > 0 : !!a.flip;
  const dirFace = faceLeft ? -1 : 1;
  const walkDelta = explicitTravel ? dirFace * (explicitTravel - 120) : 0;
  let enterX = 0;
  if (entering) {
    const p = Math.min(1, frame / ENTER_FRAMES);
    enterX = Math.pow(1 - p, 2.5) * dir * 380;
  }
  const posX = a.x + walkDelta + enterX;

  const body = (
    <g transform={`translate(0,${sitDrop + humanBob}) rotate(${flyRot + humanTorsoSway} 0 0)`}>
      {pose === 'sit' && <RoyalThrone />}

      {pose === 'fly' && [0, 1, 2, 3].map((i) => (
        <line key={i} x1={-60 - ((frame * 22 + i * 90) % 360)} y1={-180 + i * 110} x2={-160 - ((frame * 22 + i * 90) % 360)} y2={-180 + i * 110}
          stroke="#fff" strokeOpacity={0.5} strokeWidth={6} strokeLinecap="round" />))}

      {/* Legs with natural human knee & ankle articulation */}
      {pose === 'sit' ? (
        <g>
          <ellipse cx={0} cy={22} rx={160} ry={42} fill={g.cloth} stroke={INK} strokeWidth={4} />
          <ellipse cx={0} cy={50} rx={110} ry={20} fill={g.skin} stroke={INK} strokeWidth={4} />
          <rect x={-75} y={40} width={24} height={8} rx={4} fill={GOLD} stroke={INK} strokeWidth={2} />
          <rect x={51} y={40} width={24} height={8} rx={4} fill={GOLD} stroke={INK} strokeWidth={2} />
        </g>
      ) : (
        [-1, 1].map((s) => {
          const legSwing = s < 0 ? humanLegL : humanLegR;
          const kneeBend = s < 0 ? humanKneeL : humanKneeR;
          const footAngle = s < 0 ? humanFootL : humanFootR;
          const baseRot = s < 0 ? P.lL : P.lR;
          const totalHip = baseRot + legSwing;
          return (
            <g key={s} transform={`translate(${s * 36},-6) rotate(${totalHip})`}>
              <rect x={-20} y={0} width={40} height={118} rx={20} fill={g.skin} stroke={INK} strokeWidth={4} />
              <g transform={`translate(0, 108) rotate(${kneeBend})`}>
                <rect x={-18} y={0} width={36} height={116} rx={18} fill={g.skin} stroke={INK} strokeWidth={4} />
                <rect x={-22} y={92} width={44} height={14} rx={7} fill={GOLD} stroke={INK} strokeWidth={2} />
                <g transform={`translate(${s * 4}, 114) rotate(${footAngle})`}>
                  <ellipse cx={0} cy={6} rx={34} ry={13} fill="#2d1a10" stroke={INK} strokeWidth={3} />
                  <path d="M-12,4 Q0,-2 12,4" stroke={GOLD} strokeWidth={2.5} />
                </g>
              </g>
            </g>
          );
        })
      )}

      {/* back arms (4-armed gods) */}
      {g.arms4 && (<g opacity={0.95}>
        <Arm sx={-66} a={P.aL + 70 + gest} b={30} skin={g.skin} weapon="none" frame={frame} />
        <Arm sx={66} a={P.aR - 70 - gest} b={-30} skin={g.skin} weapon={weapon === 'none' ? 'trishul' : weapon === 'chakra' ? 'gada' : 'chakra'} frame={frame} />
      </g>)}

      {/* torso + cloth */}
      <path d="M-78,-215 L78,-215 L64,-4 L-64,-4 Z" fill={g.skin} stroke={INK} strokeWidth={5} />
      {g.janeu && (
        <line x1={-54} y1={-215} x2={44} y2={-4} stroke="#ffffff" strokeWidth={4} opacity={0.9} />
      )}
      {g.sash && (
        <path d="M-78,-215 L-32,-215 L-14,-4 L-64,-4 Z" fill={g.sash} stroke={INK} strokeWidth={3} />
      )}

      {/* Dhoti / Pitambar with Gold Embroidered Borders and Pleats */}
      <path d={g.long ? 'M-74,-120 L74,-120 L120,215 L-120,215 Z' : 'M-70,-14 L70,-14 L56,150 L0,200 L-56,150 Z'} fill={g.cloth} stroke={INK} strokeWidth={5} />
      <path d="M-66,-10 L66,-10 L52,142 L0,192 L-52,142 Z" fill="none" stroke={GOLD} strokeWidth={3} opacity={0.85} />
      <path d="M-18,-14 L18,-14 L12,175 L0,190 L-12,175 Z" fill={GOLD} stroke={INK} strokeWidth={2.5} />
      <rect x={-72} y={-24} width={144} height={22} rx={8} fill={GOLD} stroke={INK} strokeWidth={3} />

      {/* Royal Jeweled Kanthi Haar (Necklace with ruby and gold beads) */}
      <g transform="translate(0, -210)">
        <path d="M-42,10 Q0,50 42,10" fill="none" stroke={GOLD} strokeWidth={5} />
        {[-30, -15, 0, 15, 30].map((nx, i) => (
          <circle key={i} cx={nx} cy={20 + (1 - Math.abs(nx) / 45) * 16} r={4.5} fill={i % 2 ? '#c92a2a' : '#ffd700'} stroke={INK} strokeWidth={1.5} />
        ))}
      </g>

      {/* main arms with alternating human walking swing and gestures */}
      <Arm sx={-80} a={P.aL + humanArmSwingL + gest * 0.5} b={P.bL} skin={g.skin} weapon="none" frame={frame} />
      <Arm sx={80} a={P.aR + humanArmSwingR + gest} b={P.bR} skin={g.skin} weapon={weapon} frame={frame} />
      <Head g={g} angry={angry} blink={blink} mouth={mouth} tilt={tilt} talking={talking} frame={frame} />
    </g>
  );
  return (
    <svg
      width={560 * sc} height={820 * sc} viewBox="-280 -520 560 820"
      style={{
        position: 'absolute',
        left: posX - 280 * sc,
        top: ground - 740 * sc,
        overflow: 'visible',
        filter: isDivine
          ? 'drop-shadow(0 0 20px #ffd700)'
          : 'drop-shadow(0 18px 24px rgba(0,0,0,0.75))'
      }}
    >
      <g transform={`scale(${faceLeft ? -1 : 1},1) translate(0,${lift})`}>{body}</g>
    </svg>
  );
};

/* ───────────────────────── WORLDS (backgrounds with 3D multiplane parallax) ───────────────────────── */
const Layer: React.FC<{ depth: number; children: React.ReactNode }> = ({ depth, children }) => {
  const cam = useContext(CamCtx);
  // True 3D multiplane Z-depth + differential parallax pan
  const zOffset = (depth - 0.75) * 450;
  const xOffset = -cam.x * (1 - depth) * 0.7;
  const yOffset = -cam.y * (1 - depth) * 0.4;
  const rotY = cam.ry * (depth - 0.75) * 0.35;
  return (
    <div
      style={{
        position: 'absolute',
        left: -660,
        top: -480,
        width: 2400,
        height: 2880,
        transformStyle: 'preserve-3d',
        transform: `translate3d(${xOffset}px, ${yOffset}px, ${zOffset}px) rotateY(${rotY}deg)`,
      }}
    >
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
    palace: ['#1a071d', '#421238'],
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
        <>
          {/* Layer 0.25: Grand Ancient Stone Temple Vimana / Shikhar with Kalash & Dhwaja */}
          <Layer depth={0.25}>
            <svg width={2400} height={2880} style={{ position: 'absolute' }}>
              <TempleVimana x={1200} y={380} frame={frame} />
              <g transform="translate(420, 680) scale(0.65)">
                <TempleVimana x={0} y={0} frame={frame} />
              </g>
              <g transform="translate(1980, 680) scale(0.65)">
                <TempleVimana x={0} y={0} frame={frame} />
              </g>
            </svg>
          </Layer>
          {/* Layer 0.5: Temple Courtyard Guardian War Elephant, Horse & Saffron Banners */}
          <Layer depth={0.5}>
            <svg width={2400} height={2880} style={{ position: 'absolute' }}>
              <RoyalElephant x={420} y={1660} scale={0.72} flip={false} frame={frame} />
              <RoyalHorse x={1980} y={1680} scale={0.75} flip={true} frame={frame} />
              <FlutteringDhwaja x={780} y={1700} h={360} color="#ff6b1a" frame={frame} />
              <FlutteringDhwaja x={1620} y={1700} h={360} color="#ff6b1a" frame={frame} />
            </svg>
          </Layer>
        </>
      )}
      {kind === 'battlefield' && (
        <>
          {/* Layer 0.3: Distant Fluttering Battle Dhwaja & Standards */}
          <Layer depth={0.3}>
            <svg width={2400} height={2880} style={{ position: 'absolute' }}>
              {[350, 750, 1200, 1650, 2050].map((bx, i) => (
                <FlutteringDhwaja key={i} x={bx} y={1450} h={400} color={i % 2 === 0 ? '#ff6b1a' : '#c92a2a'} frame={frame} />
              ))}
            </svg>
          </Layer>
          {/* Layer 0.45: Armored War Elephant & War Horse on Battlefield */}
          <Layer depth={0.45}>
            <svg width={2400} height={2880} style={{ position: 'absolute' }}>
              <RoyalHorse x={520} y={1640} scale={0.82} flip={false} frame={frame} />
              <RoyalElephant x={1880} y={1620} scale={0.84} flip={true} frame={frame} />
              {[500, 900, 1500, 1900].map((x, i) => (
                <g key={i}>
                  <rect x={x} y={900} width={10} height={420} fill="#2b1810" />
                  <path d={`M${x + 10},910 q${60},${20 + Math.sin(frame / 6 + i) * 10} ${120},0 l-${20},44 l${20},44 q-${60},${20} -${120},0 Z`} fill={i % 2 ? '#c92a2a' : GOLD} />
                </g>
              ))}
            </svg>
          </Layer>
        </>
      )}
      {kind === 'palace' && (
        <>
          {/* Layer 0.2: Royal Arched Palace Domes & Glowing Jharokha Windows */}
          <Layer depth={0.2}>
            <svg width={2400} height={2880} style={{ position: 'absolute' }}>
              {[380, 840, 1560, 2020].map((x, i) => (
                <g key={i}>
                  <path
                    d={`M${x - 140},1300 L${x - 140},780 Q${x},520 ${x + 140},780 L${x + 140},1300 Z`}
                    fill="#2a0d2e"
                    stroke="#5a1848"
                    strokeWidth={8}
                  />
                  <ellipse cx={x} cy={820} rx={42} ry={60} fill="#f59f00" opacity={0.65} style={{ filter: 'blur(8px)' }} />
                  <circle cx={x} cy={820} r={18} fill="#ffd43b" opacity={0.9} />
                </g>
              ))}
            </svg>
          </Layer>

          {/* Layer 0.45: Grand Carved Marble & Gold Pillars, Grand Royal Arches & Hanging Chandeliers */}
          <Layer depth={0.45}>
            <svg width={2400} height={2880} style={{ position: 'absolute' }}>
              {/* Grand royal arches connecting columns */}
              {[600, 1200, 1800].map((cx, i) => (
                <path
                  key={i}
                  d={`M${cx - 300},1000 Q${cx},480 ${cx + 300},1000`}
                  fill="none"
                  stroke={GOLD}
                  strokeWidth={22}
                  strokeLinecap="round"
                />
              ))}
              {/* Ornate Golden & Marble Pillars */}
              {[300, 900, 1500, 2100].map((px, i) => (
                <g key={i}>
                  <path d={`M${px - 70},480 L${px + 70},480 L${px + 45},580 L${px - 45},580 Z`} fill={GOLD} stroke={INK} strokeWidth={4} />
                  <rect x={px - 40} y={580} width={80} height={1200} fill="#ede6db" stroke={INK} strokeWidth={5} />
                  {[-22, -8, 8, 22].map((ox, j) => (
                    <line key={j} x1={px + ox} y1={585} x2={px + ox} y2={1775} stroke={GOLD} strokeWidth={3.5} />
                  ))}
                  <path d={`M${px - 65},1780 L${px + 65},1780 L${px + 85},1860 L${px - 85},1860 Z`} fill={GOLD} stroke={INK} strokeWidth={5} />
                </g>
              ))}
              {/* Hanging Royal Chandeliers (झुमर) with warm glowing lamps */}
              {[600, 1200, 1800].map((hx, i) => {
                const swingChandelier = Math.sin(frame / 22 + i * 1.5) * 4;
                return (
                  <g key={i} transform={`translate(${hx + swingChandelier}, 540)`}>
                    <line x1={0} y1={0} x2={0} y2={120} stroke={GOLD} strokeWidth={4} />
                    <polygon points="-70,120 70,120 0,165" fill={GOLD} stroke={INK} strokeWidth={3} />
                    {[-50, -25, 0, 25, 50].map((lx, j) => (
                      <g key={j} transform={`translate(${lx}, 120)`}>
                        <circle cx={0} cy={20} r={10} fill="#ffd43b" opacity={0.9} style={{ filter: 'drop-shadow(0 0 10px #ff922b)' }} />
                        <ellipse cx={0} cy={16 + Math.sin(frame / 4 + j) * 2} rx={6} ry={14} fill="#ffe066" />
                      </g>
                    ))}
                  </g>
                );
              })}
              {/* Royal Crimson Silk Drapes on sides with Gold Tassels */}
              <path d="M0,450 Q280,750 180,1400 Q80,1600 0,1800 Z" fill="#68101e" stroke={GOLD} strokeWidth={6} />
              <path d="M2400,450 Q2120,750 2220,1400 Q2320,1600 2400,1800 Z" fill="#68101e" stroke={GOLD} strokeWidth={6} />
            </svg>
          </Layer>
        </>
      )}
      {/* ground */}
      <Layer depth={0.8}>
        <svg width={2400} height={2880} style={{ position: 'absolute' }}>
          <rect
            x={0}
            y={1760}
            width={2400}
            height={1120}
            fill={kind === 'battlefield' ? '#3a1a10' : kind === 'palace' ? '#220e24' : `hsl(${hue},35%,14%)`}
          />
          {kind === 'pond' && (<g>
            <ellipse cx={1200} cy={1840} rx={760} ry={150} fill="#2d5aa8" opacity={0.9} />
            {[0, 1, 2].map((i) => (<ellipse key={i} cx={1200} cy={1840} rx={140 + ((frame * 3 + i * 90) % 270)} ry={(140 + ((frame * 3 + i * 90) % 270)) * 0.2} fill="none" stroke="#bcd4ff" strokeOpacity={0.5} strokeWidth={4} />))}
            {[700, 1000, 1500, 1750].map((x, i) => (<g key={i}><ellipse cx={x} cy={1850 + (i % 2) * 40} rx={54} ry={14} fill="#2f9e44" /><circle cx={x} cy={1836 + (i % 2) * 40} r={14} fill="#f783ac" /></g>))}
          </g>)}
          {/* Grand Red Velvet Royal Carpet with Gold Embroidery Borders in Palace */}
          {kind === 'palace' && (
            <g>
              {Array.from({ length: 12 }).map((_, i) => (
                <line key={i} x1={i * 200} y1={1760} x2={i * 200} y2={2880} stroke="#38183c" strokeWidth={3} opacity={0.5} />
              ))}
              <polygon points="760,1760 1640,1760 1840,2880 560,2880" fill="#781122" stroke={GOLD} strokeWidth={10} />
              <polygon points="790,1760 1610,1760 1800,2880 600,2880" fill="none" stroke="#ffd700" strokeWidth={4} strokeDasharray="18 12" />
            </g>
          )}
        </svg>
      </Layer>
    </AbsoluteFill>
  );
};

/* Foreground (in front of characters) for depth */
const Foreground: React.FC<{ kind: BgKind; seed: number }> = ({ kind, seed }) => {
  if (kind === 'temple' || kind === 'sky') return null;
  if (kind === 'palace') {
    return (
      <Layer depth={1.22}>
        <svg width={2400} height={2880} style={{ position: 'absolute' }}>
          {/* Foreground carved golden railings and corner pillars for intense 3D stage depth */}
          <g transform="translate(180, 1920)">
            <rect x={-40} y={-160} width={80} height={200} rx={12} fill={GOLD} stroke={INK} strokeWidth={6} />
            <circle cx={0} cy={-175} r={28} fill="#ffd700" stroke={INK} strokeWidth={5} />
            <line x1={0} y1={-80} x2={450} y2={-80} stroke={GOLD} strokeWidth={16} />
            <line x1={0} y1={-10} x2={450} y2={-10} stroke={GOLD} strokeWidth={16} />
            {[80, 160, 240, 320, 400].map((bx, j) => (
              <rect key={j} x={bx - 8} y={-80} width={16} height={70} fill={GOLD} rx={5} stroke={INK} strokeWidth={3} />
            ))}
          </g>
          <g transform="translate(2220, 1920)">
            <rect x={-40} y={-160} width={80} height={200} rx={12} fill={GOLD} stroke={INK} strokeWidth={6} />
            <circle cx={0} cy={-175} r={28} fill="#ffd700" stroke={INK} strokeWidth={5} />
            <line x1={-450} y1={-80} x2={0} y2={-80} stroke={GOLD} strokeWidth={16} />
            <line x1={-450} y1={-10} x2={0} y2={-10} stroke={GOLD} strokeWidth={16} />
            {[-80, -160, -240, -320, -400].map((bx, j) => (
              <rect key={j} x={bx - 8} y={-80} width={16} height={70} fill={GOLD} rx={5} stroke={INK} strokeWidth={3} />
            ))}
          </g>
        </svg>
      </Layer>
    );
  }
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

/* ───────────────────────── CINEMATIC SUBTITLES & TOP BADGE ───────────────────────── */
const CinematicSubtitles: React.FC<{
  title: string;
  narration?: string;
  text: string;
}> = ({ title, narration, text }) => {
  const displayText = narration || text;
  // Highlight spoken dialogue inside quotes in radiant gold
  const formattedText = useMemo(() => {
    if (!displayText) return null;
    const parts = displayText.split(/(".*?"|“.*?”|'.*?')/g);
    return parts.map((part, i) => {
      const isQuote = /^["'“].*["'”]$/.test(part.trim());
      return isQuote ? (
        <span key={i} style={{ color: '#ffd700', textShadow: '0 0 16px rgba(255, 215, 0, 0.65)' }}>
          {part}{' '}
        </span>
      ) : (
        <span key={i}>{part} </span>
      );
    });
  }, [displayText]);

  return (
    <>
      {/* Top Epic Cultural Badge */}
      <div
        style={{
          position: 'absolute',
          top: 130,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          zIndex: 20,
        }}
      >
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(30, 15, 8, 0.88) 0%, rgba(12, 6, 3, 0.94) 100%)',
            border: '2px solid rgba(245, 197, 66, 0.75)',
            boxShadow: '0 6px 24px rgba(0,0,0,0.85), inset 0 1px 2px rgba(255,215,0,0.5)',
            borderRadius: 32,
            padding: '10px 28px',
            color: '#ffd700',
            fontSize: 32,
            fontWeight: 800,
            fontFamily: `${devanagariFont}, 'Noto Sans Devanagari', sans-serif`,
            letterSpacing: '0.04em',
            textShadow: '0 2px 8px rgba(0,0,0,0.9)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 30 }}>🚩</span>
          <span>{title || 'સૌરાષ્ટ્રની રસધાર | અમર ગાથા'}</span>
        </div>
      </div>

      {/* Lower-Third Cinematic Spoken Narration Subtitles */}
      <div
        style={{
          position: 'absolute',
          left: 36,
          right: 36,
          bottom: 125,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 20,
        }}
      >
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(12, 6, 4, 0.88) 0%, rgba(5, 2, 1, 0.95) 100%)',
            border: '1.5px solid rgba(255, 215, 0, 0.35)',
            boxShadow: '0 12px 36px rgba(0,0,0,0.92), 0 0 20px rgba(0,0,0,0.8)',
            borderRadius: 24,
            padding: '18px 26px',
            maxWidth: 1000,
            color: '#ffffff',
            textShadow: '0 4px 16px rgba(0,0,0,0.98), 0 2px 4px rgba(0,0,0,0.9)',
            fontFamily: `${devanagariFont}, 'Noto Sans Devanagari', 'Mukta', sans-serif`,
            fontSize: 48,
            lineHeight: 1.38,
            textAlign: 'center',
            fontWeight: 700,
          }}
        >
          {formattedText}
        </div>
      </div>
    </>
  );
};

/* Divine floating embers / golden particles for sacred ambiance */
const DivineParticles: React.FC<{ frame: number; seed: number }> = ({ frame, seed }) => {
  const r = rng(seed * 313);
  const sparks = useMemo(() => Array.from({ length: 32 }).map(() => ({
    x: 60 + r() * 960,
    baseY: 300 + r() * 1400,
    speed: 1.2 + r() * 2.5,
    sway: 14 + r() * 28,
    size: 2.2 + r() * 4.5,
    op: 0.35 + r() * 0.55,
    color: r() > 0.4 ? '#ffd43b' : '#ff922b',
  })), [seed]);

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width={1080} height={1920} style={{ position: 'absolute' }}>
        {sparks.map((s, i) => {
          const y = ((s.baseY - frame * s.speed) % 1800 + 1800) % 1800;
          const x = s.x + Math.sin((frame + i * 20) / 18) * s.sway;
          const pulse = 0.6 + 0.4 * Math.sin(frame / 8 + i);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r={s.size * 2.8}
                fill={s.color}
                opacity={s.op * pulse * 0.3}
              />
              <circle
                cx={x}
                cy={y}
                r={s.size}
                fill="#fff9db"
                opacity={s.op * pulse * 0.9}
              />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ───────────────────────── SCENE + VIDEO ───────────────────────── */
export type TransName = 'none' | 'fade' | 'wipeL' | 'wipeR' | 'iris' | 'flash' | 'zoom' | 'dip';
const TRANS_POOL: TransName[] = ['fade', 'wipeL', 'wipeR', 'iris', 'flash', 'zoom', 'dip'];
const T_LEN = 12;

const SceneView: React.FC<{ scene: Scene; seed: number; dur: number; trans?: TransName }> = ({ scene, seed, dur, trans = 'fade' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = scene.actors[scene.focus ?? 0] ?? scene.actors[0];
  const sc = (a?.scale ?? 1) * 0.82;
  const focus = a ? { x: a.x, y: (a.y ?? 1360) - 370 * sc } : { x: 540, y: 960 };
  const cam = scene.camera!;
  const auraPulse = scene.beat === 'reveal' ? 1 + Math.sin(frame * 0.15) * 0.12 : 1;

  // who is speaking right now (mouth + gestures); talk scenes alternate between the actors
  const win = Math.max(1, Math.round((scene.voiceSec ?? 0) * fps));
  const local = frame - (6 + (scene.voiceLead ?? 0));
  const speaking = !!scene.voice && local >= 0 && local <= win;
  let speaker = scene.focus ?? 0;
  if (scene.actors.length > 1 && scene.beat === 'talk') {
    speaker = Math.min(scene.actors.length - 1, Math.floor((local / win) * scene.actors.length));
  }

  // scene-start transition (different every scene)
  const tp = Math.min(1, frame / T_LEN);
  const te = Easing.out(Easing.cubic)(tp);
  let wrap: React.CSSProperties = {};
  let flashOpacity = 0;
  switch (trans) {
    case 'fade': wrap = { opacity: tp }; break;
    case 'wipeL': wrap = { clipPath: `inset(0 ${(1 - te) * 100}% 0 0)` }; break;
    case 'wipeR': wrap = { clipPath: `inset(0 0 0 ${(1 - te) * 100}%)` }; break;
    case 'iris': wrap = { clipPath: `circle(${te * 85}% at 50% 55%)` }; break;
    case 'flash': wrap = { opacity: Math.min(1, tp * 3) }; flashOpacity = (1 - tp) * 0.85; break;
    case 'zoom': wrap = { opacity: Math.min(1, tp * 2.5), transform: `scale(${1.12 - 0.12 * te})` }; break;
    case 'dip': wrap = { opacity: tp * tp }; break;
    default: break;
  }

  return (
    <AbsoluteFill style={wrap}>
      <Camera shot={cam.shot} move={cam.move} dur={dur} focus={focus}>
        <World kind={scene.bg} seed={seed} frame={frame} />

        {/* Battlefield Marching Army silhouettes in background */}
        {scene.bg === 'battlefield' && (
          <Layer depth={0.48}>
            <ArmyMarch frame={frame} direction={1} />
          </Layer>
        )}

        {/* Characters: walk-in entrances, blinking, lip-sync, gestures, combat lunges */}
        {scene.actors.map((ac, i) => (<Character key={i} a={ac} frame={frame} idx={i} talking={speaking && i === speaker} />))}

        {/* Action Combat VFX (Sparks, Weapon Slash, Flying Arrows) */}
        {scene.beat === 'fight' && (
          <Layer depth={0.92}>
            <FlyingArrows frame={frame} count={5} />
            {[20, 48, 76].map((tf) => (
              <ClashSparks
                key={tf}
                x={focus.x + (Math.sin(tf) * 35)}
                y={(a?.y ?? 1280) - 340}
                triggerFrame={tf}
                frame={frame}
              />
            ))}
            {[16, 44, 72].map((sf) => (
              <SlashTrail
                key={sf}
                cx={focus.x + (a?.flip ? -60 : 60)}
                cy={(a?.y ?? 1280) - 380}
                radius={190}
                startAngle={a?.flip ? 130 : -50}
                endAngle={a?.flip ? 230 : 50}
                frame={frame}
                startFrame={sf}
                duration={10}
              />
            ))}
          </Layer>
        )}

        {/* Divine Revelation Sunburst Glow */}
        {scene.beat === 'reveal' && (
          <Layer depth={0.35}>
            <ellipse
              cx={focus.x}
              cy={(a?.y ?? 1280) - 460}
              rx={380 * auraPulse}
              ry={380 * auraPulse}
              fill="#ffd43b"
              opacity={0.22}
              style={{ filter: 'blur(35px)' }}
            />
          </Layer>
        )}

        <Foreground kind={scene.bg} seed={seed} />
      </Camera>

      {/* Dynamic Action SpeedLines on fight / reveal beats */}
      {(scene.beat === 'fight' || scene.beat === 'reveal') && (
        <AnimeSpeedLines
          color={scene.beat === 'fight' ? '#ff4d4d' : '#ffd700'}
          count={scene.beat === 'fight' ? 42 : 28}
          opacity={scene.beat === 'fight' ? 0.35 : 0.22}
          center={[50, 52]}
        />
      )}

      {/* Cinematic Film Vignette & Atmosphere */}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 50% 50%, transparent 48%, rgba(6, 3, 2, 0.72) 100%)',
        }}
      />

      <DivineParticles frame={frame} seed={seed} />
      <CinematicSubtitles title={scene.caption.title} narration={scene.narration} text={scene.caption.text} />
      {flashOpacity > 0.01 && <AbsoluteFill style={{ background: '#fff7dc', opacity: flashOpacity }} />}
    </AbsoluteFill>
  );
};

/* ───────────────── OPENING / CLOSING effects (6 kinds each, picked per video) ───────────────── */
export const FX_COUNT = 6;
const OPEN_LEN = 12;
const CLOSE_LEN = 36;

// p = how much of the screen is covered (1 = fully covered, 0 = nothing)
const Cover: React.FC<{ kind: number; p: number; ox?: number; oy?: number }> = ({ kind, p, ox = 50, oy = 55 }) => {
  if (p <= 0.002) return null;
  const k = ((kind % FX_COUNT) + FX_COUNT) % FX_COUNT;
  const full: React.CSSProperties = { position: 'absolute', inset: 0 };
  let inner: React.ReactNode = null;
  switch (k) {
    case 0: // fade through black
      inner = <div style={{ ...full, background: '#000', opacity: p }} />;
      break;
    case 1: { // iris: circle opens / closes around a point
      const r = (1 - p) * 1500;
      inner = p >= 0.995
        ? <div style={{ ...full, background: '#050202' }} />
        : <div style={{ ...full, background: `radial-gradient(circle at ${ox}% ${oy}%, transparent ${r}px, #050202 ${r + 3}px)` }} />;
      break;
    }
    case 2: // temple curtains with gold edges
      inner = (
        <>
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: `${p * 50}%`, background: 'linear-gradient(90deg,#3d0a10,#7a1c1c)', borderRight: '6px solid #f2b632' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: `${p * 50}%`, background: 'linear-gradient(270deg,#3d0a10,#7a1c1c)', borderLeft: '6px solid #f2b632' }} />
        </>
      );
      break;
    case 3: // divine light burst
      inner = (
        <div style={{ ...full, opacity: p, background: 'radial-gradient(circle at 50% 50%, #fff6d6 0%, #ffd166 35%, #f2a93b 70%, #7a3b10 100%)' }}>
          <div style={{ ...full, opacity: 0.5, background: 'repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,.6) 0 5deg, transparent 5deg 10deg)', transform: `rotate(${p * 40}deg) scale(1.7)` }} />
        </div>
      );
      break;
    case 4: { // shutters
      const n = 8;
      inner = (
        <>
          {Array.from({ length: n }).map((_, i) => {
            const local = Math.min(1, Math.max(0, p * 1.6 - (i / n) * 0.6));
            return (
              <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: `${(i / n) * 100}%`, height: `${100 / n + 0.4}%`, background: '#0b0604', transform: `scaleY(${local})`, transformOrigin: i % 2 ? 'top' : 'bottom' }} />
            );
          })}
        </>
      );
      break;
    }
    default: // slide panel
      inner = <div style={{ ...full, background: '#0b0604', transform: `translateY(${(1 - p) * -100}%)` }} />;
  }
  return <AbsoluteFill style={{ pointerEvents: 'none', overflow: 'hidden' }}>{inner}</AbsoluteFill>;
};

const OpeningFX: React.FC<{ kind: number; ox: number; oy: number }> = ({ kind, ox, oy }) => {
  const f = useCurrentFrame();
  const p = 1 - Easing.out(Easing.cubic)(Math.min(1, f / OPEN_LEN));
  return <Cover kind={kind} p={p} ox={ox} oy={oy} />;
};

const ClosingFX: React.FC<{ kind: number; ox: number; oy: number }> = ({ kind, ox, oy }) => {
  const f = useCurrentFrame();
  const p = Easing.inOut(Easing.cubic)(Math.min(1, f / CLOSE_LEN));
  return <Cover kind={kind} p={p} ox={ox} oy={oy} />;
};

/* ───────────────────────── AUDIO ───────────────────────── */
const A = (f: string) => staticFile(`myth-audio/${f}.wav`);

const MythAudio: React.FC<{
  scenes: Scene[]; starts: number[]; durs: number[]; fps: number; total: number;
  music?: boolean; sfx?: boolean; musicVol?: number; duckedVol?: number; voiceVol?: number;
}> = ({ scenes, starts, durs, fps, total, music = true, sfx = true, musicVol = 0.65, duckedVol = 0.32, voiceVol = 1 }) => {
  // windows (in frames) where a voiceover is speaking -> music gets quieter there
  const voiceWins = scenes
    .map((s, i) => (s.voice ? [starts[i] + 6 + (s.voiceLead ?? 0), starts[i] + 6 + (s.voiceLead ?? 0) + Math.round((s.voiceSec ?? 3) * fps)] : null))
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
        <Sequence key={`voice${i}`} from={st + 6 + (s.voiceLead ?? 0)} durationInFrames={Math.round((s.voiceSec ?? 8) * fps) + 6}>
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
export const sceneFrames = (s: Scene, fps = 30) => Math.max(1, Math.round(Math.max(s.sec, s.voiceSec ? s.voiceSec + 0.4 + (s.voiceLead ?? 0) / fps : 0) * fps));
export const totalFrames = (scenes: Scene[], fps = 30) => withLead(scenes).reduce((a, s) => a + sceneFrames(s, fps), 0);

export const MythShort: React.FC<{
  scenes: Scene[]; seed: number; fps?: number;
  music?: boolean; sfx?: boolean; musicVol?: number; duckedVol?: number; voiceVol?: number;
  openingFx?: number; closingFx?: number;   // 0..5 ; omitted = chosen from the seed
}> = ({ scenes, seed, fps = 30, openingFx, closingFx, ...audio }) => {
  const planned = useMemo(() => directCameras(scenes, seed), [scenes, seed]);
  const durs = planned.map((s) => sceneFrames(s, fps));
  const starts = durs.map((_, i) => durs.slice(0, i).reduce((a, b) => a + b, 0));
  const total = durs.reduce((a, b) => a + b, 0);

  // seeded look: opening effect, closing effect and a different transition into every scene
  const look = useMemo(() => {
    const r = rng(seed * 104729 + 31);
    const open = openingFx ?? Math.floor(r() * FX_COUNT);
    const close = closingFx ?? ((open + 1 + Math.floor(r() * (FX_COUNT - 1))) % FX_COUNT);
    const ox = 25 + r() * 50;
    const oy = 35 + r() * 40;
    const trans: TransName[] = [];
    planned.forEach((_, i) => {
      if (i === 0) { trans.push('none'); return; }
      const prev = trans[i - 1];
      const pool = TRANS_POOL.filter((t) => t !== prev);
      trans.push(pool[Math.floor(r() * pool.length)]);
    });
    return { open, close, ox, oy, trans };
  }, [seed, planned, openingFx, closingFx]);

  return (
    <AbsoluteFill style={{ background: '#0b0604' }}>
      <Series>
        {planned.map((s, i) => (
          <Series.Sequence key={i} durationInFrames={durs[i]}>
            <SceneView scene={s} seed={seed + i * 31} dur={durs[i]} trans={look.trans[i]} />
          </Series.Sequence>
        ))}
      </Series>
      <Sequence from={0} durationInFrames={OPEN_LEN}>
        <OpeningFX kind={look.open} ox={look.ox} oy={look.oy} />
      </Sequence>
      <Sequence from={Math.max(0, total - CLOSE_LEN)} durationInFrames={CLOSE_LEN}>
        <ClosingFX kind={look.close} ox={100 - look.ox} oy={look.oy} />
      </Sequence>
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

