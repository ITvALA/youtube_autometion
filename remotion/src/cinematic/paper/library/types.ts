export type TimeOfDay = "dawn" | "day" | "dusk" | "night";

export type BackgroundType =
  | "village"
  | "forest"
  | "river_ghat"
  | "mountains_temple"
  | "palace_courtyard"
  | "desert"
  | "ocean_boat"
  | "night_sky"
  | "cave"
  | "battlefield";

export type PropType =
  | "hut"
  | "tree_banyan"
  | "tree_pine"
  | "tree_palm"
  | "cow"
  | "boat"
  | "well"
  | "diya"
  | "fire"
  | "banner"
  | "cloud"
  | "bird"
  | "bell"
  | "chariot"
  | "bow"
  | "mace"
  | "crown"
  | "pot";

export type CharacterPose =
  | "idle_breath"
  | "blink"
  | "walk"
  | "run"
  | "sit"
  | "bow"
  | "point"
  | "raise_hands"
  | "talk";

export type CharacterEmotion = "calm" | "fierce" | "joy" | "sorrow";
export type CharacterBuild = "normal" | "muscular" | "slender" | "elder";
export type CharacterType = "warrior" | "king" | "rishi" | "commoner" | "deity" | "guard";

export type CameraPreset = "push-in" | "pull-out" | "pan" | "orbit" | "crane";
export type TransitionType = "slide" | "tear" | "fold" | "page-turn";

export type PropSpec = {
  id?: string;
  type: PropType;
  x: number; // 0 to 1080 (or relative px)
  y: number; // 0 to 1920
  scale?: number;
  flip?: boolean;
  seed?: number;
};

export type CharacterSpec = {
  id?: string;
  type?: CharacterType;
  pose?: CharacterPose;
  x: number; // 0 to 1080
  y?: number; // 0 to 1920
  scale?: number;
  flip?: boolean;
  skin?: string;
  clothes?: string;
  headgear?: string;
  build?: CharacterBuild;
  emotion?: CharacterEmotion;
  audioLevel?: number; // 0.0 to 1.0 for lip-sync / talking motion
};

export type PaperSceneSpec = {
  bg: BackgroundType;
  variant: number; // 0, 1, 2
  timeOfDay: TimeOfDay;
  props?: PropSpec[];
  characters?: CharacterSpec[];
  camera?: {
    move: CameraPreset;
    speed?: number;
  };
  transition?: TransitionType;
  seed: number;
};

export type TimeOfDayPalette = {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  sunMoonColor: string;
  sunMoonGlow: string;
  shadowColor: string;
  shadowOpacity: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  terracotta: string;
  terracottaLight: string;
  terracottaDark: string;
  sand: string;
  foliage: string;
  foliageDark: string;
  water: string;
  waterHighlight: string;
  paperTint: string;
  ambientLight: string;
};
