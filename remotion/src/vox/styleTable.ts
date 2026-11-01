import {CamKind, CaptionKind, FontDef, LabelKind, PaperDef, TransKind, VoxPal, VoxStyle, hashStr} from "./types";

/*
 * 212 VOX STYLES = 8 paper x 14 palette x 7 font ke combos mein se 212 alag (paper, palette, font) triples,
 * upar se label / caption / camera / transition / dust ka alag mix. Pure data: koi font/React import nahi.
 */
export const PAPERS: PaperDef[] = [
  {id: "cream", name: "Cream", base: "#F4ECDD", edge: "#DDD0B7", grain: 0.5, kind: "plain", ink: "#2B2118"},
  {id: "sand", name: "Sand Dots", base: "#EBDFC8", edge: "#CDBE9C", grain: 0.55, kind: "dots", ink: "#2B2118"},
  {id: "news", name: "Newsprint", base: "#EAE7DE", edge: "#C9C5B8", grain: 0.6, kind: "lines", ink: "#222222"},
  {id: "graph", name: "Graph", base: "#F2F0E7", edge: "#D6D2C2", grain: 0.4, kind: "grid", ink: "#1F2A33"},
  {id: "blush", name: "Blush", base: "#F5E5DC", edge: "#DEC3B4", grain: 0.5, kind: "plain", ink: "#33201A"},
  {id: "sage", name: "Sage Dots", base: "#E4E9DB", edge: "#BFC8B0", grain: 0.5, kind: "dots", ink: "#1E2B22"},
  {id: "kraft", name: "Kraft", base: "#D2B78F", edge: "#A98B60", grain: 0.8, kind: "kraft", ink: "#2A1D10"},
  {id: "ice", name: "Ice Grid", base: "#E7EDF0", edge: "#C2CDD3", grain: 0.35, kind: "grid", ink: "#16262F"},
];

export const PALS: VoxPal[] = [
  {name: "Saffron", ink: "#2B2118", c1: "#E8683A", c2: "#2C6E7F", c3: "#F2B632", c4: "#8A4B2A", light: "#FFF8EA"},
  {name: "Ocean", ink: "#14273E", c1: "#E4572E", c2: "#1F6FB2", c3: "#F6C945", c4: "#0B3C5D", light: "#FDF7E9"},
  {name: "Forest", ink: "#1E2B22", c1: "#D9622B", c2: "#2F7D5B", c3: "#E9B949", c4: "#1B4D3E", light: "#FBF6E6"},
  {name: "Berry", ink: "#2A1530", c1: "#D7385E", c2: "#6B3FA0", c3: "#F4B942", c4: "#3D1F56", light: "#FFF5EC"},
  {name: "Terracotta", ink: "#3A2418", c1: "#C8553D", c2: "#588B8B", c3: "#FFD166", c4: "#8C3B2A", light: "#FFF3E0"},
  {name: "Navy Red", ink: "#101B3A", c1: "#E63946", c2: "#1D3557", c3: "#F1C453", c4: "#457B9D", light: "#F8F4E8"},
  {name: "Mint", ink: "#17332D", c1: "#F26B5B", c2: "#1FA187", c3: "#FFC857", c4: "#136F63", light: "#F7FAF0"},
  {name: "Plum Gold", ink: "#2B1B2E", c1: "#E07A5F", c2: "#81456B", c3: "#EDB458", c4: "#5C2A4E", light: "#FFF6E8"},
  {name: "Cobalt", ink: "#0F1B33", c1: "#FF7A1A", c2: "#2D5BE3", c3: "#FFD23F", c4: "#1A3399", light: "#FFF8E7"},
  {name: "Olive", ink: "#2A2A14", c1: "#D1495B", c2: "#6B8E23", c3: "#EDAE49", c4: "#4A5D16", light: "#FBF5E1"},
  {name: "Rose", ink: "#3B1F2B", c1: "#EF476F", c2: "#118AB2", c3: "#FFD166", c4: "#073B4C", light: "#FFF4EA"},
  {name: "Teal Coral", ink: "#0E2F3A", c1: "#FF6F59", c2: "#254441", c3: "#F4C95D", c4: "#43AA8B", light: "#FBF3E4"},
  {name: "Indigo", ink: "#1B1B3A", c1: "#F0803C", c2: "#5B4B8A", c3: "#F7D154", c4: "#2E2459", light: "#FFF6EA"},
  {name: "Rust", ink: "#33190F", c1: "#B5451B", c2: "#3E7CB1", c3: "#F2C14E", c4: "#7A2E12", light: "#FFF2DF"},
];

// Sab fonts Devanagari + Latin dono support karte hain (Hindi labels aur Hinglish dono).
export const FONTS: FontDef[] = [
  {id: "hind", name: "Hind", weight: 700, scale: 1, upper: false},
  {id: "mukta", name: "Mukta", weight: 800, scale: 1, upper: false},
  {id: "baloo", name: "Baloo", weight: 800, scale: 0.95, upper: false},
  {id: "kalam", name: "Kalam", weight: 700, scale: 1.05, upper: false},
  {id: "khand", name: "Khand", weight: 700, scale: 1.1, upper: true},
  {id: "poppins", name: "Poppins", weight: 800, scale: 0.88, upper: false},
  {id: "rozha", name: "Rozha", weight: 400, scale: 0.92, upper: false},
];

const LABELS: LabelKind[] = ["underline", "marker", "tag", "circle", "stamp", "plain"];
const CAPTIONS: CaptionKind[] = ["box", "karaoke", "outline", "bar", "plain"];
const CAMS: CamKind[] = ["push", "pull", "drift", "pan"];
const TRANS: TransKind[] = ["wipe", "page", "zoom", "blur", "iris", "tear"];

export const VOX_COUNT = 212;
const TOTAL = PAPERS.length * PALS.length * FONTS.length; // 784
const STRIDE = 37; // TOTAL ke saath coprime => pehle 212 index sab alag triples dete hain

export const VOX_STYLES: VoxStyle[] = Array.from({length: VOX_COUNT}, (_, i) => {
  const idx = (i * STRIDE) % TOTAL;
  const paper = PAPERS[idx % PAPERS.length];
  const pal = PALS[Math.floor(idx / PAPERS.length) % PALS.length];
  const font = FONTS[Math.floor(idx / (PAPERS.length * PALS.length)) % FONTS.length];
  const h = hashStr(`vox-${i}`);
  return {
    id: `v${String(i + 1).padStart(3, "0")}`,
    name: `${paper.name} / ${pal.name} / ${font.name}`,
    paper, pal, font,
    label: LABELS[h % LABELS.length],
    caption: CAPTIONS[(h >>> 4) % CAPTIONS.length],
    cam: CAMS[(h >>> 8) % CAMS.length],
    trans: TRANS[(h >>> 12) % TRANS.length],
    dust: (h >>> 16) % 3 === 0,
  };
});

export const getVoxStyle = (id: string): VoxStyle | undefined => VOX_STYLES.find((s) => s.id === id);
