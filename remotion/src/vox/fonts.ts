import {loadFont as hind} from "@remotion/google-fonts/Hind";
import {loadFont as mukta} from "@remotion/google-fonts/Mukta";
import {loadFont as baloo} from "@remotion/google-fonts/Baloo2";
import {loadFont as kalam} from "@remotion/google-fonts/Kalam";
import {loadFont as khand} from "@remotion/google-fonts/Khand";
import {loadFont as poppins} from "@remotion/google-fonts/Poppins";
import {loadFont as rozha} from "@remotion/google-fonts/RozhaOne";

const sub = {subsets: ["devanagari", "latin"] as ("devanagari" | "latin")[]};

/* Sab fonts Devanagari + Latin: Hindi labels aur Hinglish dono sahi dikhte hain. */
export const FAMILY: Record<string, string> = {
  hind: hind("normal", {weights: ["700"], ...sub}).fontFamily,
  mukta: mukta("normal", {weights: ["800"], ...sub}).fontFamily,
  baloo: baloo("normal", {weights: ["800"], ...sub}).fontFamily,
  kalam: kalam("normal", {weights: ["700"], ...sub}).fontFamily,
  khand: khand("normal", {weights: ["700"], ...sub}).fontFamily,
  poppins: poppins("normal", {weights: ["800"], ...sub}).fontFamily,
  rozha: rozha("normal", {weights: ["400"], ...sub}).fontFamily,
};
