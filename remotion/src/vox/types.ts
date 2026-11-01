export type VoxPal = {name: string; ink: string; c1: string; c2: string; c3: string; c4: string; light: string};

export type Layout = "single" | "compare" | "trio" | "flow" | "stat" | "quote" | "map" | "hook";

export type VoxItem = {icon: string; label: string};

export type VoxContent = {
  layout: Layout;
  title: string;
  sub: string;
  items: VoxItem[];
  stat?: {value: number; prefix: string; suffix: string};
  country?: string; // atlas country name
};

export type LabelKind = "underline" | "marker" | "tag" | "circle" | "stamp" | "plain";
export type CaptionKind = "box" | "karaoke" | "outline" | "bar" | "plain";
export type CamKind = "push" | "pull" | "drift" | "pan";
export type TransKind = "wipe" | "page" | "zoom" | "blur" | "iris" | "tear";

export type PaperDef = {id: string; name: string; base: string; edge: string; grain: number; kind: "plain" | "grid" | "dots" | "lines" | "kraft"; ink: string};
export type FontDef = {id: string; name: string; weight: number; scale: number; upper: boolean};

export type VoxStyle = {
  id: string;
  name: string;
  paper: PaperDef;
  pal: VoxPal;
  font: FontDef;
  label: LabelKind;
  caption: CaptionKind;
  cam: CamKind;
  trans: TransKind;
  dust: boolean;
};

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const hx = (h: string) => {
  if (h.startsWith("rgb")) {const m = h.match(/[\d.]+/g) || ["0", "0", "0"]; return [Number(m[0]), Number(m[1]), Number(m[2])];}
  const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** k < 1 = darker, k > 1 = lighter */
export const shade = (hex: string, k: number) => {
  const [r, g, b] = hx(hex);
  const f = (v: number) => Math.round(clamp(k <= 1 ? v * k : v + (255 - v) * (k - 1), 0, 255));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};
export const rgba = (hex: string, a: number) => {const [r, g, b] = hx(hex); return `rgba(${r},${g},${b},${a})`;};
export const isLight = (hex: string) => {const [r, g, b] = hx(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;};
export const hashStr = (s: string) => {let h = 2166136261; for (let i = 0; i < s.length; i++) {h ^= s.charCodeAt(i); h = Math.imul(h, 16777619);} return h >>> 0;};
export const mulberry = (seed: number) => () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
