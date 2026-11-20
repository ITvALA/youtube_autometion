// Paper-cut "film" composition: one big paper board, one continuous camera,
// every effect lands on a spoken word (ported from the cinematic-skill idea).
export type PFWord = {w: string; s: number; e: number}; // seconds, relative to scene start
export type PFKind = "title" | "card" | "number" | "quote" | "photo" | "list" | "map";
export type PFAccent = "red" | "teal" | "mustard" | "ink";

export type PFScene = {
  kind: PFKind;
  narration: string;        // on-screen caption text (Hinglish/Latin ok)
  durationSec: number;      // same field the existing pipeline already writes
  words: PFWord[];          // same shape as Plan.Scene.words
  text: string;             // big typed text (Devanagari or Latin)
  sub?: string;
  number?: number;          // kind "number": value to count up to
  unit?: string;            // e.g. "%", "करोड़"
  hit?: number;             // index into words[]: stamp / highlight / counter fires on this word
  stamp?: string;           // red stamp text slammed on the hit word
  image?: string;           // path under remotion/public (kind "photo")
  items?: string[];         // kind "list": revealed one by one across the scene
  state?: string;           // kind "map": rajya ka naam (English/Hindi), e.g. "Gujarat" / "गुजरात"
  district?: string;        // kind "map": zila jo highlight ho (optional), e.g. "Devbhumi Dwarka"
  place?: {name: string; lat: number; lon: number}; // kind "map": pin yahan girta hai
  hit2?: number;            // kind "map": words[] index jahan jagah par zoom ho (hit = rajya par zoom)
  span?: number;            // kind "map": final zoom ka size in degrees (default 1.1)
  accent?: PFAccent;
};

export type PFProps = {
  scenes: PFScene[];
  seed: number;
  captions?: boolean;
  sfx?: boolean;
};
