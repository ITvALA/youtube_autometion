/**
 * MINDSPARK CINEMA  -  makes every myth video feel directed, not templated.
 *
 *  1. MULTI-CUT CAMERA   every scene is cut into 2-4 shots (wide -> medium -> close-up -> reaction ...),
 *                        with real framing on the speaking actor, dolly / crane / orbit / crash-zoom / handheld.
 *  2. CHOREOGRAPHY       actors walk in, walk across the screen, step towards each other, lunge + recoil in fights,
 *                        float up on reveals and jump on victory. They automatically face each other.
 *  3. LIVING WORLD       mood per scene (dawn / day / dusk / night / storm): sky, sun/moon, god-rays, clouds,
 *                        birds, fog, fireflies, embers, leaves, rain + lightning, marigold petals, colour grade.
 *                        Optional real VIDEO backgrounds (public/bg/*.mp4).
 *  4. CHARACTER MOMENTS  impact words (धड़ाम!), divine burst + shock-rings, camera punch + shake, anger / shock /
 *                        sparkle emotes, footstep dust, contact shadows, whip-pan swish, light leaks, film grain.
 *
 *  Everything is seeded: a new seed gives a new director style, moods, cuts and effects.
 *  Nothing here needs the LLM / Python pipeline to change - all new Scene fields are OPTIONAL.
 */
import React, { useContext, useId, useMemo } from 'react';
import { AbsoluteFill, Easing, Video, staticFile } from 'remotion';
import { CamCtx, Layer, rng } from './camctx';
import type { Cam } from './camctx';
import type { Actor, Beat, BgKind, MoveName, Pose, Scene, ShotName } from './mindspark-myth-engine';

/* ───────────────────────── TYPES ───────────────────────── */
export type Mood = 'dawn' | 'day' | 'dusk' | 'night' | 'storm';
export type Emote = 'anger' | 'shock' | 'sweat' | 'sparkle';
export type Cut = { from: number; to: number; shot: ShotName; move: MoveName; focus: number; whip: boolean };
export type Moment = {
  at: number; kind: 'hit' | 'burst' | 'punch' | 'word'; actor: number;
  text?: string; px: number; py: number; rot: number;
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = Easing.out(Easing.cubic);
const pick = <T,>(arr: T[], r: () => number) => arr[Math.floor(r() * arr.length)];

/* ───────────────────────── MOODS (look of the world) ───────────────────────── */
type Cel = { x: number; y: number; r: number; c: string; glow: string };
type MoodStyle = {
  sky: [string, string]; cel: Cel; stars: number;
  ray: string; rayOp: number; cloud: string; cloudOp: number; fog: string; fogOp: number;
  sat: number; con: number; bri: number; tint: string; tintOp: number; blend: string;
};
export const MOOD: Record<Mood, MoodStyle> = {
  dawn:  { sky: ['#3b2a5e', '#ffb48a'], cel: { x: 1180, y: 1060, r: 130, c: '#ffe3b0', glow: '#ffb070' }, stars: 0.15,
           ray: '#ffd9a8', rayOp: 0.22, cloud: '#ffc9b0', cloudOp: 0.55, fog: '#ffd2c0', fogOp: 0.20,
           sat: 1.10, con: 1.05, bri: 1.04, tint: '#ff9ec2', tintOp: 0.12, blend: 'soft-light' },
  day:   { sky: ['#2f6fd6', '#a9d8ff'], cel: { x: 1560, y: 620, r: 110, c: '#fff4c2', glow: '#fff0a0' }, stars: 0,
           ray: '#fff6c8', rayOp: 0.18, cloud: '#ffffff', cloudOp: 0.78, fog: '#e8f4ff', fogOp: 0.10,
           sat: 1.12, con: 1.05, bri: 1.08, tint: '#ffe9a8', tintOp: 0.08, blend: 'soft-light' },
  dusk:  { sky: ['#2a1240', '#ff7a3d'], cel: { x: 1500, y: 1120, r: 170, c: '#ffb347', glow: '#ff6a2a' }, stars: 0.25,
           ray: '#ff9a52', rayOp: 0.26, cloud: '#ff8f5a', cloudOp: 0.60, fog: '#ff9d6a', fogOp: 0.16,
           sat: 1.20, con: 1.10, bri: 0.98, tint: '#ff7a30', tintOp: 0.20, blend: 'soft-light' },
  night: { sky: ['#050818', '#1b2a5e'], cel: { x: 1450, y: 640, r: 100, c: '#f1f4ff', glow: '#8fa8ff' }, stars: 1,
           ray: '#9fb4ff', rayOp: 0.16, cloud: '#3a4a7a', cloudOp: 0.45, fog: '#5a6ea8', fogOp: 0.14,
           sat: 0.85, con: 1.10, bri: 0.85, tint: '#2a4aa8', tintOp: 0.30, blend: 'soft-light' },
  storm: { sky: ['#0b0d14', '#3a4252'], cel: { x: 1500, y: 700, r: 0, c: '#000', glow: '#000' }, stars: 0,
           ray: '#c9d4ff', rayOp: 0, cloud: '#262c3a', cloudOp: 0.85, fog: '#6b7488', fogOp: 0.24,
           sat: 0.70, con: 1.20, bri: 0.85, tint: '#2a3550', tintOp: 0.30, blend: 'multiply' },
};

const MOOD_ORDER: Mood[] = ['dawn', 'day', 'dusk', 'night'];

/** One mood per scene. Story "time" drifts forward (dawn -> day -> dusk -> night); fights get stormy. */
export function planMoods(scenes: Scene[], seed: number): Mood[] {
  const r = rng(seed * 4099 + 11);
  let t = Math.floor(r() * 4);
  return scenes.map((s) => {
    if (s.mood) return s.mood;
    if (r() < 0.34) t = (t + 1) % 4;
    if (s.beat === 'fight' && s.bg === 'battlefield') return pick<Mood>(['storm', 'dusk', 'night', 'storm'], r);
    if (s.beat === 'reveal') return pick<Mood>([MOOD_ORDER[t], 'dawn', 'dusk'], r);
    return MOOD_ORDER[t];
  });
}

/* ───────────────────────── CAMERA ───────────────────────── */
export type Aim = 'head' | 'body' | 'feet' | 'two';
type CamShot = Cam & { lock: number; aim: Aim };

/** z = zoom, lock = how hard the camera centres on its target (0 = fixed frame, 1 = locked on) */
export const CINE_SHOTS: Record<ShotName, CamShot> = {
  wide:    { x: 0,   y: -10, z: 0.84, rx: 0,   ry: 0,  rz: 0,   lock: 0.25, aim: 'two' },
  twoShot: { x: 0,   y: 0,   z: 1.02, rx: 0,   ry: 0,  rz: 0,   lock: 0.90, aim: 'two' },
  medium:  { x: 0,   y: -6,  z: 1.22, rx: 0,   ry: 0,  rz: 0,   lock: 0.80, aim: 'body' },
  closeup: { x: 0,   y: 0,   z: 1.70, rx: 0,   ry: 0,  rz: 0,   lock: 0.95, aim: 'head' },
  extreme: { x: 0,   y: 0,   z: 2.25, rx: 0,   ry: 0,  rz: 0,   lock: 1.00, aim: 'head' },
  ecu:     { x: 0,   y: 0,   z: 3.10, rx: 0,   ry: 0,  rz: 0,   lock: 1.00, aim: 'head' },
  low:     { x: 0,   y: 40,  z: 1.25, rx: -12, ry: 0,  rz: 0,   lock: 0.85, aim: 'body' },
  worm:    { x: 0,   y: 70,  z: 1.05, rx: -18, ry: 0,  rz: 0,   lock: 0.80, aim: 'feet' },
  high:    { x: 0,   y: -40, z: 0.95, rx: 14,  ry: 0,  rz: 0,   lock: 0.50, aim: 'two' },
  hero:    { x: 0,   y: 50,  z: 1.05, rx: -14, ry: 0,  rz: 0,   lock: 0.90, aim: 'body' },
  dutch:   { x: 0,   y: 0,   z: 1.20, rx: -4,  ry: 6,  rz: -10, lock: 0.85, aim: 'body' },
  side:    { x: -40, y: -8,  z: 1.15, rx: -2,  ry: 16, rz: 0,   lock: 0.85, aim: 'body' },
  sideR:   { x: 40,  y: -8,  z: 1.15, rx: -2,  ry: -16, rz: 0,  lock: 0.85, aim: 'body' },
  over:    { x: -60, y: -12, z: 1.45, rx: 2,   ry: 12, rz: 0,   lock: 0.90, aim: 'head' },
};

/** (e = eased 0..1 progress of this shot, f = scene frame, lin = linear 0..1) */
export const CINE_MOVES: Record<MoveName, (e: number, f: number, lin: number) => Partial<Cam>> = {
  still:     () => ({}),
  slowPush:  (e) => ({ z: 0.10 * e }),
  pushIn:    (e) => ({ z: 0.30 * e }),
  pullOut:   (e) => ({ z: 0.30 * (1 - e) }),
  panL:      (e) => ({ x: 130 * (0.5 - e) }),
  panR:      (e) => ({ x: -130 * (0.5 - e) }),
  dollyL:    (e) => ({ x: 280 * (0.5 - e), ry: 7 * (0.5 - e) }),
  dollyR:    (e) => ({ x: -280 * (0.5 - e), ry: -7 * (0.5 - e) }),
  tiltUp:    (e) => ({ y: 150 * (1 - e) - 40, rx: -4 * e }),
  craneDown: (e) => ({ y: -240 * (1 - e), rx: 7 * (1 - e) }),
  rise:      (e) => ({ y: 180 * e - 40, rx: -3 * e }),
  orbit:     (e) => ({ ry: -16 + 32 * e, x: 70 * (0.5 - e), z: 0.12 * e }),
  spiral:    (e) => ({ rz: -7 * (1 - e), ry: 8 * (1 - e), z: 0.34 * e }),
  crash:     (_e, _f, lin) => ({ z: 0.60 * (1 - Math.pow(1 - Math.min(1, lin * 3.2), 4)) + 0.06 * lin }),
  shake:     (_e, f) => ({ x: Math.sin(f * 1.9) * 11, y: Math.cos(f * 2.3) * 9, rz: Math.sin(f * 1.3) * 0.7 }),
  handheld:  (e, f) => ({
    x: Math.sin(f / 9) * 9 + Math.sin(f / 3.7) * 3, y: Math.cos(f / 11) * 8 + Math.cos(f / 4.3) * 2.5,
    rz: Math.sin(f / 15) * 0.5, z: 0.08 * e,
  }),
  whip:      (e) => ({ x: 220 * Math.pow(1 - e, 3), rz: 2 * Math.pow(1 - e, 3) }),
};

/** where on the actor does a shot aim?  (sc = actor scale incl. the 0.82 puppet factor) */
export const aimOffset = (aim: Aim, sc: number) =>
  aim === 'head' ? -612 * sc : aim === 'feet' ? -40 * sc : -320 * sc;

export const CineCamera: React.FC<{
  cut: Cut; f: number; focus: { x: number; y: number };
  punch: { z: number; sx: number; sy: number };
  back?: React.ReactNode; children: React.ReactNode;
}> = ({ cut, f, focus, punch, back, children }) => {
  const len = Math.max(1, cut.to - cut.from);
  const lin = clamp01((f - cut.from) / len);
  const e = Easing.inOut(Easing.cubic)(lin);
  const b = CINE_SHOTS[cut.shot];
  const m = CINE_MOVES[cut.move](e, f, lin);
  const z = b.z + (m.z ?? 0) + punch.z;
  // organic handheld drift is always on, a tiny bit
  const hx = Math.sin(f / 13) * 3.5 + Math.sin(f / 5.3) * 1.4;
  const hy = Math.cos(f / 11) * 3 + Math.cos(f / 4.7) * 1.2;
  const cam: Cam = {
    z,
    x: b.x + (m.x ?? 0) - b.lock * z * (focus.x - 540) + hx + punch.sx,
    y: b.y + (m.y ?? 0) - b.lock * z * (focus.y - 960) + hy + punch.sy,
    rx: b.rx + (m.rx ?? 0),
    ry: b.ry + (m.ry ?? 0),
    rz: b.rz + (m.rz ?? 0) + Math.sin(f / 31) * 0.15,
  };
  return (
    <CamCtx.Provider value={cam}>
      {back && <AbsoluteFill>{back}</AbsoluteFill>}
      <AbsoluteFill style={{ perspective: 1400, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute', inset: 0, transformOrigin: '50% 50%', transformStyle: 'preserve-3d',
            transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.z}) rotateX(${cam.rx}deg) rotateY(${cam.ry}deg) rotateZ(${cam.rz}deg)`,
          }}
        >
          {children}
        </div>
      </AbsoluteFill>
    </CamCtx.Provider>
  );
};

/** whip-pan swish on the first frames of a cut */
export const swishStyle = (cut: Cut, f: number): React.CSSProperties => {
  if (!cut.whip) return {};
  const p = clamp01((f - cut.from) / 7);
  if (p >= 1) return {};
  const k = Math.pow(1 - p, 2);
  return { transform: `translateX(${(cut.from % 2 ? -1 : 1) * k * 160}px)`, filter: `blur(${(k * 9).toFixed(2)}px)` };
};

/* ───────────────────────── DIRECTOR: cut planning ───────────────────────── */
export type DirStyle = { name: string; len: number; whip: number; close: number; hand: number };
/** every video gets its own directing personality */
export function directorStyle(seed: number): DirStyle {
  const r = rng(seed * 977 + 5)();
  if (r < 0.25) return { name: 'kinetic', len: 0.75, whip: 0.6, close: 0.6, hand: 0.5 };
  if (r < 0.5) return { name: 'epic', len: 1.25, whip: 0.15, close: 0.3, hand: 0.1 };
  if (r < 0.75) return { name: 'intimate', len: 1.0, whip: 0.25, close: 0.8, hand: 0.3 };
  return { name: 'documentary', len: 1.0, whip: 0.2, close: 0.4, hand: 0.8 };
}

const SHOT_POOL: Record<Beat, ShotName[]> = {
  intro:   ['wide', 'high', 'twoShot', 'side', 'hero'],
  talk:    ['medium', 'over', 'closeup', 'twoShot', 'side', 'sideR', 'ecu', 'medium'],
  reveal:  ['closeup', 'hero', 'low', 'extreme', 'ecu', 'wide'],
  fight:   ['dutch', 'low', 'side', 'sideR', 'medium', 'wide', 'worm', 'closeup'],
  victory: ['hero', 'wide', 'high', 'low', 'twoShot'],
};
const MOVE_POOL: Record<Beat, MoveName[]> = {
  intro:   ['pullOut', 'craneDown', 'dollyR', 'dollyL', 'rise', 'spiral'],
  talk:    ['slowPush', 'still', 'handheld', 'dollyL', 'dollyR', 'pushIn'],
  reveal:  ['crash', 'pushIn', 'tiltUp', 'spiral', 'slowPush'],
  fight:   ['shake', 'whip', 'orbit', 'crash', 'handheld', 'dollyL', 'dollyR', 'pushIn'],
  victory: ['pullOut', 'tiltUp', 'spiral', 'rise', 'orbit', 'craneDown'],
};
const SEG_SEC: Record<Beat, [number, number]> = {
  intro: [2.6, 3.8], talk: [2.2, 3.4], reveal: [1.8, 2.8], fight: [1.1, 1.9], victory: [2.4, 3.4],
};
const CLOSE_SET = new Set<ShotName>(['closeup', 'extreme', 'ecu', 'over']);
const HAND_SET = new Set<MoveName>(['handheld', 'shake']);

function pickW<T>(r: () => number, arr: T[], avoid: T[], weight: (t: T) => number): T {
  const pool = arr.filter((a) => !avoid.includes(a));
  const src = pool.length ? pool : arr;
  const ws = src.map(weight);
  let x = r() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < src.length; i++) { x -= ws[i]; if (x <= 0) return src[i]; }
  return src[src.length - 1];
}

/** who is speaking, and how strongly (0..1 per actor) at scene frame f */
export function speech(scene: Scene, f: number, fps: number, dur: number) {
  const n = scene.actors.length;
  const hasVoice = !!scene.voice;
  const win = hasVoice ? Math.max(1, Math.round((scene.voiceSec ?? 0) * fps)) : Math.max(1, dur);
  const local = f - (6 + (scene.voiceLead ?? 0));
  const speaking = hasVoice && local >= 0 && local <= win;
  let speaker = scene.focus ?? 0;
  if (n > 1 && scene.beat === 'talk') speaker = Math.max(0, Math.min(n - 1, Math.floor((local / win) * n)));
  const W = win / Math.max(1, n);
  const w = scene.actors.map((_, i) => {
    if (n > 1 && scene.beat === 'talk') {
      return clamp01((local - i * W) / 6) * clamp01(((i + 1) * W - local) / 6);
    }
    return i === speaker ? (speaking ? 1 : 0.4) : 0;
  });
  return { speaker, speaking, w };
}

export function planAllCuts(scenes: Scene[], durs: number[], seed: number, fps: number): Cut[][] {
  const r = rng(seed * 6151 + 17);
  const st = directorStyle(seed);
  const recent: ShotName[] = [];
  let prevMove: MoveName | null = null;
  return scenes.map((s, si) => {
    const dur = durs[si];
    const n = s.actors.length;
    if (s.camera && s.cameraLock) {
      recent.push(s.camera.shot); prevMove = s.camera.move;
      return [{ from: 0, to: dur, shot: s.camera.shot, move: s.camera.move, focus: s.focus ?? 0, whip: false }];
    }
    const [lo, hi] = SEG_SEC[s.beat];
    const target = (lo + r() * (hi - lo)) * st.len * fps;
    const count = Math.max(1, Math.min(8, Math.round(dur / target)));
    const raw = Array.from({ length: count }, () => 0.8 + r() * 0.4);
    const tot = raw.reduce((a, b) => a + b, 0);
    const cuts: Cut[] = [];
    let at = 0;
    raw.forEach((w, k) => {
      const last = k === count - 1;
      const to = last ? dur : Math.min(dur - 14, Math.max(at + 14, at + Math.round((dur * w) / tot)));
      let shots = [...SHOT_POOL[s.beat]];
      if (k === 0 && s.beat === 'intro') shots = ['wide', 'high', 'hero'];
      if (n === 1) shots = shots.filter((x) => x !== 'twoShot' && x !== 'over');
      const shot = pickW(r, shots, recent.slice(-2), (t) => (CLOSE_SET.has(t) ? 0.5 + st.close : 1));
      let moves = [...MOVE_POOL[s.beat]];
      if (k === 0 && s.beat === 'reveal') moves = ['crash', 'pushIn'];
      const move = pickW(r, moves, prevMove ? [prevMove] : [], (t) => (HAND_SET.has(t) ? 0.4 + st.hand : 1));
      const mid = Math.round((at + to) / 2);
      let focus = s.focus ?? 0;
      if (n > 1) {
        const sp = s.beat === 'talk' ? speech(s, mid, fps, dur).speaker : s.beat === 'fight' ? k % n : focus;
        focus = r() < 0.3 ? (sp + 1) % n : sp; // sometimes cut to the listener's reaction
        if (shot === 'over') focus = (sp + 1) % n;
      }
      const whip = k > 0 && r() < st.whip + (s.beat === 'fight' ? 0.25 : 0);
      cuts.push({ from: at, to, shot, move, focus, whip });
      recent.push(shot); prevMove = move;
      at = to;
    });
    return cuts;
  });
}

/* ───────────────────────── MOMENTS (impact, burst, punch) ───────────────────────── */
export const HIT_WORDS = ['धड़ाम!', 'टंकार!', 'प्रहार!', 'गर्जना!', 'धमाका!'];
export const REVEAL_WORDS = ['ॐ', 'जय!', 'प्रकट!', 'तेज!'];
export const VICTORY_WORDS = ['जय!', 'विजय!', 'धर्म!'];

export const fightHits = (dur: number): number[] => {
  const h: number[] = [];
  for (let t = 20; t < dur - 10; t += 26) h.push(t);
  return h;
};

export function planMoments(s: Scene, dur: number, seed: number): Moment[] {
  const r = rng(seed * 7907 + 3);
  const out: Moment[] = [];
  const foc = s.focus ?? 0;
  const n = Math.max(1, s.actors.length);
  const pos = () => ({ px: 300 + r() * 480, py: 520 + r() * 300, rot: -9 + r() * 18 });
  switch (s.beat) {
    case 'fight':
      fightHits(dur).forEach((h, k) => out.push({ at: h, kind: 'hit', actor: k % n, text: k % 2 === 0 ? pick(HIT_WORDS, r) : undefined, ...pos() }));
      break;
    case 'reveal':
      out.push({ at: 8, kind: 'burst', actor: foc, text: pick(REVEAL_WORDS, r), ...pos() });
      break;
    case 'victory':
      out.push({ at: 10, kind: 'burst', actor: foc, text: pick(VICTORY_WORDS, r), ...pos() });
      break;
    case 'talk': {
      const c = 1 + (r() < 0.5 ? 1 : 0);
      for (let i = 0; i < c; i++) out.push({ at: Math.round(40 + r() * Math.max(1, dur - 100)), kind: 'punch', actor: foc, ...pos() });
      break;
    }
    default: break;
  }
  return out;
}

/** combined per-frame effect of all moments */
export function momentFx(f: number, ms: Moment[]) {
  let z = 0, sx = 0, sy = 0, flash = 0, red = 0, gold = 0;
  for (const m of ms) {
    const p = f - m.at;
    if (p < 0 || p > 14) continue;
    const a = Math.exp(-p / 4);
    if (m.kind === 'hit') {
      z += 0.07 * a; sx += Math.sin(p * 3.1) * 14 * a; sy += Math.cos(p * 2.7) * 12 * a;
      flash = Math.max(flash, p < 2 ? 0.45 - 0.15 * p : 0); red = Math.max(red, a * 0.28);
    } else if (m.kind === 'punch') {
      z += 0.05 * a;
    } else if (m.kind === 'burst') {
      z += 0.08 * a; gold = Math.max(gold, p < 3 ? 0.5 : 0.3 * a);
    }
  }
  return { z, sx, sy, flash, red, gold };
}

/* ───────────────────────── CHOREOGRAPHY ───────────────────────── */
export type Dyn = { dx: number; dy: number; walking: boolean; pose: Pose; flip: boolean; scaleMul: number };

export function actorDyn(scene: Scene, i: number, f: number, w: number, hits: number[]): Dyn {
  const a = scene.actors[i];
  const n = scene.actors.length;
  let flip = !!a.flip;
  let d: 1 | -1 = flip ? -1 : 1;
  if (n > 1 && scene.autoFace !== false && a.pose !== 'fly') {
    const others = scene.actors.filter((_, j) => j !== i);
    const near = others.reduce((b, c) => (Math.abs(c.x - a.x) < Math.abs(b.x - a.x) ? c : b), others[0]);
    if (Math.abs(near.x - a.x) > 4) { d = near.x > a.x ? 1 : -1; flip = d < 0; }
  }
  let pose: Pose = a.pose;
  let dx = 0, dy = 0, walking = false, scaleMul = 1;

  switch (scene.beat) {
    case 'talk':
      dx += d * Math.min(1, f / 90) * 36;
      scaleMul *= 1 + 0.05 * w - 0.012 * (1 - w);
      if (n > 1 && w < 0.5 && (pose === 'talk' || pose === 'point')) pose = 'stand';
      break;
    case 'fight': {
      const approach = easeOut(clamp01(f / 18));
      dx += -d * 190 * (1 - approach);
      let lunge = 0, recoil = 0;
      hits.forEach((h, k) => {
        const mine = n === 1 ? k % 2 === 0 : k % 2 === i % 2;
        if (mine) { const p = f - (h - 6); if (p >= 0 && p < 16) lunge = Math.max(lunge, p < 6 ? p / 6 : 1 - (p - 6) / 10); }
        else { const p = f - h; if (p >= 0 && p < 24) recoil = Math.max(recoil, p < 2 ? p / 2 : 1 - (p - 2) / 22); }
      });
      dx += d * 84 * lunge - d * 64 * recoil;
      dy += -lunge * 20;
      scaleMul *= 1 + 0.05 * lunge;
      break;
    }
    case 'reveal': {
      const e = easeOut(clamp01(f / 36));
      dy += -e * 34 + Math.sin(f / 20) * 6;
      scaleMul *= 1 + 0.06 * e;
      break;
    }
    case 'victory':
      if (f > 8 && f < 8 + 34 * 3) dy += -Math.abs(Math.sin(((f - 8) / 34) * Math.PI)) * 26;
      break;
    default: break;
  }

  // walk-in: intro scenes (or enter: 'left' | 'right') - actors really walk on from off-screen
  const wantsEnter = a.enter === 'left' || a.enter === 'right' || (scene.beat === 'intro' && a.enter !== 'none');
  if (wantsEnter && a.pose !== 'sit' && a.pose !== 'fly') {
    const from = a.enter === 'left' ? 'L' : a.enter === 'right' ? 'R' : a.x < 540 ? 'L' : 'R';
    const startX = from === 'L' ? -240 : 1320;
    const p = clamp01((f - i * 10) / (44 + i * 6));
    if (p < 1) {
      dx += (startX - a.x) * (1 - Easing.out(Easing.quad)(p));
      flip = from === 'R';
      if (p > 0) { walking = true; pose = 'walk'; }
    }
  }

  // explicit walkTo (or a legacy `pose: 'walk'`): walk across the screen, camera follows
  const tgt = a.walkTo ?? (a.pose === 'walk' ? a.x + d * 420 : undefined);
  if (tgt !== undefined && !walking) {
    const dist = tgt - a.x;
    const moved = Math.min(Math.abs(dist), 4.6 * Math.max(0, f - 6));
    dx += Math.sign(dist) * moved;
    if (moved < Math.abs(dist) && f > 6) { walking = true; pose = 'walk'; flip = dist < 0; }
    else if (a.pose === 'walk') pose = 'stand';
  }
  return { dx, dy, walking, pose, flip, scaleMul };
}

/** which emote (if any) floats above an actor right now */
export function emoteAt(scene: Scene, i: number, f: number, hits: number[]): { kind: Emote; since: number } | null {
  const a = scene.actors[i];
  const n = scene.actors.length;
  if (a.emote) return f >= 10 && f < 60 ? { kind: a.emote, since: f - 10 } : null;
  if (scene.beat === 'fight') {
    for (let k = 0; k < hits.length; k++) {
      const h = hits[k];
      const mine = n === 1 ? k % 2 === 0 : k % 2 === i % 2;
      if (mine && f >= h - 6 && f < h + 16) return { kind: 'anger', since: f - (h - 6) };
      if (!mine && f >= h && f < h + 22) return { kind: k % 3 === 0 ? 'sweat' : 'shock', since: f - h };
    }
  }
  if (scene.beat === 'reveal' && i === (scene.focus ?? 0) && f >= 12 && f < 80) return { kind: 'sparkle', since: f - 12 };
  if (scene.beat === 'victory' && f >= 10 && f < 80) return { kind: 'sparkle', since: f - 10 };
  return null;
}

/** background extras (courtiers / disciples) for palace + temple scenes */
const CROWD_POOL: Partial<Record<BgKind, { who: string; pose: Pose }[]>> = {
  palace: [{ who: 'soldier', pose: 'stand' }, { who: 'shishya', pose: 'stand' }, { who: 'raja', pose: 'stand' }, { who: 'soldier', pose: 'stand' }],
  temple: [{ who: 'rishi', pose: 'pray' }, { who: 'shishya', pose: 'pray' }, { who: 'guru', pose: 'pray' }, { who: 'rishi', pose: 'pray' }],
};
export function crowdFor(s: Scene, seed: number): Actor[] {
  if (s.crowd === false) return [];
  const pool = CROWD_POOL[s.bg] ?? (s.crowd ? CROWD_POOL.temple : undefined);
  if (!pool) return [];
  const r = rng(seed * 17 + 9);
  const xs = [100, 215, 865, 980].sort(() => r() - 0.5).slice(0, 3);
  return xs.map((x, k) => ({
    who: pool[k % pool.length].who, pose: s.beat === 'victory' ? 'pray' : pool[k % pool.length].pose,
    x, y: 1250, scale: 0.5, flip: x > 540, enter: 'none' as const,
  }));
}

/* ───────────────────────── EFFECT COMPONENTS ───────────────────────── */
export const ImpactText: React.FC<{ m: Moment; f: number; font: string }> = ({ m, f, font }) => {
  const p = f - m.at;
  if (!m.text || p < 0 || p > 26) return null;
  const sc = p < 5 ? 0.2 + (1.25 - 0.2) * (p / 5) : p < 9 ? 1.25 - 0.25 * ((p - 5) / 4) : 1 + (p - 9) * 0.004;
  const op = p > 20 ? 1 - (p - 20) / 6 : 1;
  return (
    <div
      style={{
        position: 'absolute', left: m.px, top: m.py, transform: `translate(-50%,-50%) rotate(${m.rot}deg) scale(${sc})`,
        opacity: op, fontFamily: font, fontWeight: 800, fontSize: 150, color: '#ffd43b', whiteSpace: 'nowrap',
        WebkitTextStroke: '12px #1a0d08', paintOrder: 'stroke fill',
        textShadow: '0 10px 0 #7a1c0c, 0 0 46px rgba(255,120,0,0.85)',
      }}
    >
      {m.text}
    </div>
  );
};

export const DivineBurst: React.FC<{ x: number; y: number; f: number; at: number; color?: string }> = ({ x, y, f, at, color = '#ffd43b' }) => {
  const p = f - at;
  const uid = useId().replace(/:/g, '');
  if (p < 0 || p > 70) return null;
  const op = p < 6 ? p / 6 * 0.8 : 0.8 * (1 - (p - 6) / 64);
  const rays = Array.from({ length: 14 }, (_, i) => {
    const a0 = (i / 14) * Math.PI * 2 + p * 0.012;
    const w = 0.09;
    const R = 900;
    return `${x},${y} ${x + Math.cos(a0 - w) * R},${y + Math.sin(a0 - w) * R} ${x + Math.cos(a0 + w) * R},${y + Math.sin(a0 + w) * R}`;
  });
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', mixBlendMode: 'screen' }}>
      <defs>
        <radialGradient id={`db${uid}`} gradientUnits="userSpaceOnUse" cx={x} cy={y} r={900}>
          <stop offset="0" stopColor={color} stopOpacity={1} />
          <stop offset="1" stopColor={color} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g opacity={op}>{rays.map((pts, i) => <polygon key={i} points={pts} fill={`url(#db${uid})`} />)}</g>
      <circle cx={x} cy={y} r={150 + Math.min(p, 12) * 4} fill={color} opacity={op * 0.5} />
      {[0, 1, 2].map((k) => {
        const q = p - k * 7;
        if (q < 0) return null;
        return <circle key={k} cx={x} cy={y} r={90 + q * 20} fill="none" stroke="#fff3c4" strokeWidth={Math.max(1, 14 - q * 0.25)} opacity={Math.max(0, 0.8 - q / 55)} />;
      })}
    </svg>
  );
};

export const EmoteIcon: React.FC<{ kind: Emote; since: number; x: number; y: number; sc: number }> = ({ kind, since, x, y, sc }) => {
  const pop = since < 5 ? since / 5 * 1.25 : since < 9 ? 1.25 - 0.25 * ((since - 5) / 4) : 1;
  const op = since > 16 ? Math.max(0, 1 - (since - 16) / 8) : 1;
  const wob = Math.sin(since * 0.8) * 4;
  let body: React.ReactNode = null;
  switch (kind) {
    case 'anger':
      body = (
        <g stroke="#e03131" strokeWidth={9} fill="none" strokeLinecap="round">
          <path d="M-22,-6 Q-6,-8 -8,-24" /><path d="M22,-6 Q6,-8 8,-24" /><path d="M-22,6 Q-6,8 -8,24" /><path d="M22,6 Q6,8 8,24" />
        </g>
      );
      break;
    case 'shock':
      body = (
        <g>
          <polygon points="0,-46 12,-16 44,-22 22,2 40,30 8,20 0,50 -10,20 -40,30 -22,2 -44,-22 -12,-16" fill="#ffd43b" stroke="#1a0d08" strokeWidth={4} />
          <rect x={-4} y={-26} width={8} height={30} rx={4} fill="#1a0d08" /><circle cx={0} cy={16} r={5} fill="#1a0d08" />
        </g>
      );
      break;
    case 'sweat':
      body = (
        <g fill="#74c0fc" stroke="#1a0d08" strokeWidth={3}>
          <path d="M-14,-30 C0,-6 4,6 -14,18 C-32,6 -28,-6 -14,-30Z" />
          <g transform={`translate(26,${10 + since * 1.2})`}><path d="M0,-18 C9,-4 11,4 0,11 C-11,4 -9,-4 0,-18Z" /></g>
        </g>
      );
      break;
    case 'sparkle':
      body = (
        <g fill="#ffd43b" stroke="#fff6c8" strokeWidth={1.5}>
          {[[-30, 8, 1], [18, -14, 1.3], [34, 22, 0.8]].map(([sx, sy, s], i) => {
            const tw = 0.7 + 0.3 * Math.sin(since * 0.7 + i * 2);
            return <path key={i} transform={`translate(${sx},${sy}) scale(${(s as number) * tw})`} d="M0,-24 Q3,-3 24,0 Q3,3 0,24 Q-3,3 -24,0 Q-3,-3 0,-24Z" />;
          })}
        </g>
      );
      break;
    default: break;
  }
  return (
    <svg width={220} height={220} viewBox="-110 -110 220 220" style={{ position: 'absolute', left: x - 110, top: y - 110, overflow: 'visible', opacity: op }}>
      <g transform={`translate(${wob},0) scale(${pop * sc})`}>{body}</g>
    </svg>
  );
};

export const ContactShadows: React.FC<{ items: { x: number; y: number; sc: number; lift: number }[] }> = ({ items }) => (
  <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
    {items.map((s, i) => {
      const k = 1 - Math.min(0.55, s.lift / 520);
      return <ellipse key={i} cx={s.x} cy={s.y + 14 * s.sc} rx={118 * s.sc * k} ry={17 * s.sc * k} fill="#000" opacity={0.4 * k} />;
    })}
  </svg>
);

export const FootDust: React.FC<{
  f: number; seed: number; ground: (i: number) => number;
  posAt: (i: number, k: number) => { x: number; walking: boolean; dir: number; sc: number };
  count: number;
}> = ({ f, seed, ground, posAt, count }) => {
  const puffs: React.ReactNode[] = [];
  const stepEvery = 8.15;
  const kMax = Math.floor(f / stepEvery);
  for (let i = 0; i < count; i++) {
    for (let k = Math.max(0, kMax - 3); k <= kMax; k++) {
      const kf = Math.round(k * stepEvery);
      const age = f - kf;
      if (age < 0 || age > 20) continue;
      const p = posAt(i, kf);
      if (!p.walking) continue;
      const t = age / 20;
      const jit = rng(seed + k * 13 + i)();
      puffs.push(
        <circle key={`${i}-${k}`} cx={p.x - p.dir * (14 + age * 1.6) + (jit - 0.5) * 20} cy={ground(i) + 8 * p.sc - age * 1.3}
          r={(10 + t * 30) * p.sc} fill="#d9c3a0" opacity={0.5 * (1 - t)} />,
      );
    }
  }
  return <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>{puffs}</svg>;
};

/* ───────────────────────── LIVING BACKGROUND ───────────────────────── */
const BIG = { position: 'absolute' as const };
const outdoor = (k: BgKind) => k !== 'palace';

const Clouds: React.FC<{ f: number; seed: number; mood: Mood; count: number; depth: number; yLo: number; yHi: number }> = ({ f, seed, mood, count, depth, yLo, yHi }) => {
  const uid = useId().replace(/:/g, '');
  const M = MOOD[mood];
  const items = useMemo(() => {
    const r = rng(seed * 31 + depth * 100);
    return Array.from({ length: count }, () => ({ x: r() * 3200, y: yLo + r() * (yHi - yLo), s: 0.8 + r() * 1.4, v: 0.18 + r() * 0.42 }));
  }, [seed, count, depth, yLo, yHi]);
  return (
    <Layer depth={depth}>
      <svg width={2400} height={2880} style={BIG}>
        <defs>
          <radialGradient id={`cl${uid}`}><stop offset="0" stopColor={M.cloud} stopOpacity={M.cloudOp} /><stop offset="1" stopColor={M.cloud} stopOpacity={0} /></radialGradient>
        </defs>
        {items.map((c, i) => {
          const x = ((c.x + f * c.v) % 3200) - 400;
          return (
            <g key={i} transform={`translate(${x},${c.y}) scale(${c.s})`}>
              {[[-90, 8, 120, 50], [-35, -14, 130, 58], [20, 0, 140, 56], [78, 10, 120, 46]].map(([ox, oy, rx, ry], j) => (
                <ellipse key={j} cx={ox} cy={oy} rx={rx} ry={ry} fill={`url(#cl${uid})`} />
              ))}
            </g>
          );
        })}
      </svg>
    </Layer>
  );
};

const GodRays: React.FC<{ f: number; kind: BgKind; mood: Mood }> = ({ f, kind, mood }) => {
  const uid = useId().replace(/:/g, '');
  const M = MOOD[mood];
  if (M.rayOp <= 0) return null;
  const interior = kind === 'palace' || kind === 'temple';
  const ox = interior ? 1200 : mood === 'night' ? 1450 : M.cel.x;
  const oy = interior ? -160 : Math.min(M.cel.y, 700) - 260;
  const sway = Math.sin(f / 90) * 0.05;
  const N = 8;
  return (
    <Layer depth={0.3}>
      <svg width={2400} height={2880} style={{ ...BIG, mixBlendMode: 'screen' }}>
        <defs>
          <radialGradient id={`gr${uid}`} gradientUnits="userSpaceOnUse" cx={ox} cy={oy} r={2200}>
            <stop offset="0" stopColor={M.ray} stopOpacity={1} /><stop offset="1" stopColor={M.ray} stopOpacity={0} />
          </radialGradient>
        </defs>
        {Array.from({ length: N }, (_, i) => {
          const a = Math.PI / 2 + (i - (N - 1) / 2) * 0.17 + sway;
          const w = 0.045 + (i % 3) * 0.012;
          const R = 2400;
          const op = M.rayOp * (0.55 + 0.45 * Math.sin(f / 40 + i * 1.7));
          return (
            <polygon key={i} opacity={op} fill={`url(#gr${uid})`}
              points={`${ox},${oy} ${ox + Math.cos(a - w) * R},${oy + Math.sin(a - w) * R} ${ox + Math.cos(a + w) * R},${oy + Math.sin(a + w) * R}`} />
          );
        })}
      </svg>
    </Layer>
  );
};

const Birds: React.FC<{ f: number; seed: number }> = ({ f, seed }) => {
  const items = useMemo(() => {
    const r = rng(seed * 53);
    return Array.from({ length: 6 }, () => ({ x: r() * 3000, y: 380 + r() * 520, v: 1.1 + r() * 1.3, s: 0.7 + r() * 0.9 }));
  }, [seed]);
  return (
    <Layer depth={0.14}>
      <svg width={2400} height={2880} style={BIG}>
        {items.map((b, i) => {
          const x = ((b.x + f * b.v) % 3000) - 300;
          const y = b.y + Math.sin((f + i * 20) / 30) * 18;
          const fl = Math.sin(f / 3 + i);
          return <path key={i} transform={`translate(${x},${y}) scale(${b.s * 2.2})`} d={`M-14,0 Q-7,${-10 * fl} 0,0 Q7,${-10 * fl} 14,0`} fill="none" stroke="#1a0d08" strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />;
        })}
      </svg>
    </Layer>
  );
};

const Fog: React.FC<{ f: number; seed: number; mood: Mood; depth: number; y: number; k: number }> = ({ f, seed, mood, depth, y, k }) => {
  const uid = useId().replace(/:/g, '');
  const M = MOOD[mood];
  return (
    <Layer depth={depth}>
      <svg width={2400} height={2880} style={BIG}>
        <defs><radialGradient id={`fg${uid}`}><stop offset="0" stopColor={M.fog} stopOpacity={Math.min(0.5, M.fogOp * k)} /><stop offset="1" stopColor={M.fog} stopOpacity={0} /></radialGradient></defs>
        {[0, 1, 2, 3].map((i) => {
          const x = ((i * 820 + f * (0.35 + i * 0.12) + seed * 7) % 3400) - 500;
          return <ellipse key={i} cx={x} cy={y + (i % 2) * 70} rx={780} ry={150} fill={`url(#fg${uid})`} />;
        })}
      </svg>
    </Layer>
  );
};

const Glows: React.FC<{ f: number; seed: number; n: number; colors: string[]; yLo: number; yHi: number; depth: number; mode: 'float' | 'rise' }> = ({ f, seed, n, colors, yLo, yHi, depth, mode }) => {
  const uid = useId().replace(/:/g, '');
  const items = useMemo(() => {
    const r = rng(seed * 71 + n);
    return Array.from({ length: n }, () => ({ x: r() * 2200 + 100, y: yLo + r() * (yHi - yLo), p: r() * 100, s: 0.5 + r() * 1.1, c: Math.floor(r() * colors.length), v: 1.2 + r() * 2.4 }));
  }, [seed, n, yLo, yHi, colors.length]);
  return (
    <Layer depth={depth}>
      <svg width={2400} height={2880} style={BIG}>
        <defs>{colors.map((c, i) => (<radialGradient key={i} id={`gl${uid}${i}`}><stop offset="0" stopColor={c} stopOpacity={1} /><stop offset="0.35" stopColor={c} stopOpacity={0.55} /><stop offset="1" stopColor={c} stopOpacity={0} /></radialGradient>))}</defs>
        {items.map((g, i) => {
          let x: number, y: number, op: number;
          if (mode === 'float') {
            x = g.x + Math.sin((f + g.p) / (34 + i)) * 90; y = g.y + Math.cos((f + g.p) / (46 + i * 2)) * 60;
            op = 0.35 + 0.65 * Math.max(0, Math.sin((f + g.p * 3) / 12));
          } else {
            const t = ((f * g.v + g.p * 20) % (yHi - yLo));
            x = g.x + Math.sin((f + g.p) / 20) * 36; y = yHi - t; op = 1 - t / (yHi - yLo);
          }
          return <circle key={i} cx={x} cy={y} r={20 * g.s} fill={`url(#gl${uid}${g.c})`} opacity={op} />;
        })}
      </svg>
    </Layer>
  );
};

const Leaves: React.FC<{ f: number; seed: number }> = ({ f, seed }) => {
  const items = useMemo(() => {
    const r = rng(seed * 97);
    return Array.from({ length: 14 }, () => ({ x: r() * 2300, p: r() * 2600, v: 1.4 + r() * 2.2, c: pick(['#6aa84f', '#c98a2b', '#9a6b2a', '#4f8a3a'], r), s: 0.8 + r() * 0.8 }));
  }, [seed]);
  return (
    <Layer depth={1.1}>
      <svg width={2400} height={2880} style={BIG}>
        {items.map((l, i) => {
          const y = ((f * l.v + l.p) % 2700) - 100;
          const x = l.x + Math.sin((f + l.p) / 24) * 60;
          return <ellipse key={i} cx={x} cy={y} rx={13 * l.s} ry={6 * l.s} fill={l.c} transform={`rotate(${f * 4 + l.p} ${x} ${y})`} opacity={0.85} />;
        })}
      </svg>
    </Layer>
  );
};

/** world-space atmosphere BEHIND the characters */
export const AtmosBack: React.FC<{ kind: BgKind; mood: Mood; f: number; seed: number }> = ({ kind, mood, f, seed }) => {
  const M = MOOD[mood];
  return (
    <>
      {outdoor(kind) && <Clouds f={f} seed={seed} mood={mood} depth={0.1} count={kind === 'sky' ? 8 : 4} yLo={150} yHi={kind === 'sky' ? 1100 : 750} />}
      {outdoor(kind) && kind !== 'battlefield' && mood !== 'night' && mood !== 'storm' && <Birds f={f} seed={seed} />}
      {M.rayOp > 0 && kind !== 'battlefield' && <GodRays f={f} kind={kind} mood={mood} />}
      {outdoor(kind) && <Clouds f={f + 400} seed={seed + 5} mood={mood} depth={0.22} count={3} yLo={500} yHi={1100} />}
      <Fog f={f} seed={seed} mood={mood} depth={0.65} y={1700} k={kind === 'battlefield' || kind === 'pond' || kind === 'forest' ? 1.6 : 0.9} />
    </>
  );
};

/** world-space atmosphere IN FRONT of the characters (adds depth when the camera moves) */
export const AtmosFront: React.FC<{ kind: BgKind; mood: Mood; f: number; seed: number }> = ({ kind, mood, f, seed }) => {
  const glowy = mood === 'night' || mood === 'dusk' || mood === 'dawn';
  return (
    <>
      <Fog f={f + 90} seed={seed + 3} mood={mood} depth={1.0} y={2050} k={kind === 'battlefield' ? 1.2 : 0.7} />
      {(kind === 'forest' || kind === 'pond') && glowy && <Glows f={f} seed={seed} n={26} colors={['#d8ff7a', '#fff3a0']} yLo={1100} yHi={1900} depth={1.04} mode="float" />}
      {kind === 'forest' && !glowy && mood !== 'storm' && <Leaves f={f} seed={seed} />}
      {kind === 'battlefield' && <Glows f={f} seed={seed} n={40} colors={['#ff9d3a', '#ff5a1f']} yLo={900} yHi={2300} depth={1.0} mode="rise" />}
      {kind === 'temple' && <Glows f={f} seed={seed} n={22} colors={['#ffd43b', '#ff9d3a']} yLo={1100} yHi={2100} depth={1.0} mode="rise" />}
      {(kind === 'palace' || kind === 'temple') && <Glows f={f + 40} seed={seed + 9} n={26} colors={['#ffe9a8']} yLo={500} yHi={1900} depth={1.06} mode="float" />}
    </>
  );
};

/* screen-space overlays */
export const Rain: React.FC<{ f: number; seed: number; amount?: number }> = ({ f, seed, amount = 70 }) => {
  const items = useMemo(() => {
    const r = rng(seed * 13);
    return Array.from({ length: amount }, () => ({ x: r() * 1300, y: r() * 2000, v: 32 + r() * 18, l: 36 + r() * 30 }));
  }, [seed, amount]);
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
      {items.map((d, i) => {
        const y = (d.y + f * d.v) % 2000 - 40;
        const x = ((d.x - f * 6) % 1300 + 1300) % 1300 - 100;
        return <line key={i} x1={x} y1={y} x2={x - d.l * 0.16} y2={y + d.l} stroke="#cfe0ff" strokeOpacity={0.32} strokeWidth={2.4} strokeLinecap="round" />;
      })}
    </svg>
  );
};

/** sky flash a couple of times per storm scene */
export const lightning = (f: number, seed: number, dur: number): number => {
  const r = rng(seed * 8191 + 7);
  let best = 0;
  for (let i = 0; i < 2; i++) {
    const at = Math.round(20 + r() * Math.max(10, dur - 50));
    const p = f - at;
    if (p >= 0 && p < 12) best = Math.max(best, p % 6 < 3 ? 0.55 * (1 - p / 12) : 0.15);
  }
  return best;
};

export const Petals: React.FC<{ f: number; seed: number; since: number }> = ({ f, seed, since }) => {
  const items = useMemo(() => {
    const r = rng(seed * 29);
    return Array.from({ length: 30 }, () => ({ x: r() * 1080, p: r() * 2100, v: 2.4 + r() * 3.2, c: pick(['#ffa62b', '#ff7a00', '#ffcf33', '#ff5d8f'], r), s: 0.8 + r() * 0.9 }));
  }, [seed]);
  const k = clamp01(since / 20);
  if (k <= 0) return null;
  return (
    <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', opacity: k }}>
      {items.map((p, i) => {
        const y = ((f * p.v + p.p) % 2100) - 100;
        const x = p.x + Math.sin((f + p.p) / 18) * 46;
        return <ellipse key={i} cx={x} cy={y} rx={10 * p.s} ry={5.5 * p.s} fill={p.c} transform={`rotate(${f * 5 + p.p} ${x} ${y})`} opacity={0.92} />;
      })}
    </svg>
  );
};

const GRAIN_SVG = "<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>";
const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(GRAIN_SVG)}")`;
export const FilmGrain: React.FC<{ f: number; opacity?: number }> = ({ f, opacity = 0.12 }) => (
  <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'overlay', opacity, backgroundImage: GRAIN, backgroundSize: '220px 220px', backgroundPosition: `${(f * 53) % 220}px ${(f * 97) % 220}px` }} />
);

/** warm light-leak sweep on whip cuts */
export const LightLeak: React.FC<{ cut: Cut; f: number }> = ({ cut, f }) => {
  if (!cut.whip) return null;
  const p = (f - cut.from) / 10;
  if (p < 0 || p > 1) return null;
  const x = 20 + p * 70;
  return <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'screen', opacity: (1 - p) * 0.45, background: `radial-gradient(ellipse 60% 45% at ${x}% 40%, #ffb36b 0%, rgba(255,120,60,0.4) 45%, transparent 75%)` }} />;
};

/** optional real video background (drop mp4 loops into public/bg/) */
export const VideoBG: React.FC<{ src: string; mood: Mood }> = ({ src, mood }) => {
  const cam = useContext(CamCtx);
  const M = MOOD[mood];
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translate(${-cam.x * 0.1}px, ${-cam.y * 0.06}px) scale(${1.14 + (cam.z - 1) * 0.12})` }}>
        <Video
          src={staticFile(src)} muted loop
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: `saturate(${M.sat}) brightness(${(M.bri * 0.92).toFixed(2)})` }}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: M.tint, opacity: M.tintOp * 0.8, mixBlendMode: M.blend as React.CSSProperties['mixBlendMode'] }} />
    </AbsoluteFill>
  );
};
