/**
 * MINDSPARK MYTH AUDIO GENERATOR (no dependencies, no internet)
 * Run once:  node scripts/make-myth-audio.mjs
 * Creates public/myth-audio/{score,whoosh,bell,bell2,thump,snap}.wav used by mindspark-myth-engine.tsx
 * Change SEED to get a differently-textured score for a new video style.
 */
import { existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';

const SR = 44100;
const DIRS = ['public/myth-audio', 'remotion/public/myth-audio'];
for (const dir of DIRS) {
  mkdirSync(dir, { recursive: true });
}

let s = 7;
const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

const wav = (name, data, gain = 0.8) => {
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const buf = Buffer.alloc(44 + data.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + data.length * 2, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(data.length * 2, 40);
  data.forEach((v, i) => buf.writeInt16LE(Math.round((v / (peak || 1)) * gain * 32767), 44 + i * 2));
  for (const dir of DIRS) {
    writeFileSync(`${dir}/${name}.wav`, buf);
    console.log('wrote', `${dir}/${name}.wav`);
  }
};
const make = (sec, fn) => Float64Array.from({ length: Math.floor(SR * sec) }, (_, i) => fn(i / SR, i));

// SCORE: Preserved authentic Lo-Fi chill beat from @sanatan.unfold
const scoreExists = DIRS.every(d => existsSync(`${d}/score.wav`) && statSync(`${d}/score.wav`).size > 500000);
if (!scoreExists) {
  wav('score', make(60, (t) => {
    let v = 0;
    for (const [f, g] of [[73.4, 0.5], [110, 0.35], [146.8, 0.25], [220.5, 0.12], [329.6, 0.05]]) {
      const lfo = 0.7 + 0.3 * Math.sin(2 * Math.PI * (Math.round((0.11 + f / 2000) * 60) / 60) * t);
      v += g * Math.sin(2 * Math.PI * f * t + 0.4 * Math.sin(2 * Math.PI * 0.2 * t)) * lfo;
    }
    const edge = Math.min(1, t / 0.05, (60 - t) / 0.05); // tiny edge fade, avoids loop click
    return v * edge;
  }), 0.7);
} else {
  console.log('Preserving authentic Lo-Fi chill score.wav');
}

// WHOOSH: filtered noise swell (scene transition)
{
  const L = 0.5, n = Math.floor(SR * L), k = 60, raw = Float64Array.from({ length: n + k }, rnd);
  wav('whoosh', make(L, (t, i) => {
    let a = 0; for (let j = 0; j < k; j++) a += raw[i + j]; return (a / k) * Math.sin(Math.PI * (i / n)) ** 2;
  }), 0.8);
}

// BELL (two pitches)
const bell = (f) => make(2.0, (t) => (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(2 * Math.PI * f * 2.76 * t) + 0.25 * Math.sin(2 * Math.PI * f * 5.4 * t)) * Math.exp(-t * 2.2));
wav('bell', bell(660), 0.8);
wav('bell2', bell(880), 0.8);

// THUMP: dhol-like drum hit
wav('thump', make(0.45, (t) => Math.sin(2 * Math.PI * (50 * t + (35 * (1 - Math.exp(-t * 25))) / 25)) * Math.exp(-t * 9)), 0.95);

// SNAP: short noise hit
wav('snap', make(0.18, (t) => rnd() * Math.exp(-t * 30)), 0.8);

