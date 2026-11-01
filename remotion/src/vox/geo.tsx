import React, {useMemo} from "react";
import {feature} from "topojson-client";
import {geoArea, geoCentroid, geoNaturalEarth1, geoPath} from "d3-geo";
import topo from "world-atlas/countries-110m.json";
import {VoxPal, shade, rgba} from "./types";

/* Vox style me jaise "China" ka orange map dikhta hai: asli desh ka shape, baaki duniya halki si. */
const FEATS: any[] = (feature(topo as any, (topo as any).objects.countries) as any).features;

const COUNTRY_KEYS: [string, string[]][] = [
  ["India", ["india", "bharat", "bhaarat", "hindustan", "भारत", "हिंदुस्तान", "हिन्दुस्तान"]],
  ["China", ["china", "cheen", "chin", "चीन"]],
  ["United States of America", ["usa", "u.s.", "america", "amerika", "united states", "अमेरिका"]],
  ["Pakistan", ["pakistan", "पाकिस्तान"]],
  ["Japan", ["japan", "jaapan", "जापान"]],
  ["Russia", ["russia", "rusi", "रूस"]],
  ["Germany", ["germany", "jarmani", "जर्मनी"]],
  ["France", ["france", "फ्रांस"]],
  ["United Kingdom", ["britain", "england", "uk", "u.k.", "ब्रिटेन"]],
  ["Brazil", ["brazil", "brazeel", "ब्राज़ील", "ब्राजील"]],
  ["Canada", ["canada", "kanada", "कनाडा"]],
  ["Australia", ["australia", "ऑस्ट्रेलिया"]],
  ["Saudi Arabia", ["saudi", "सऊदी"]],
  ["Bangladesh", ["bangladesh", "बांग्लादेश"]],
  ["Nepal", ["nepal", "नेपाल"]],
  ["Iran", ["iran", "ईरान"]],
  ["Israel", ["israel", "इज़राइल", "इजरायल"]],
  ["Ukraine", ["ukraine", "यूक्रेन"]],
  ["Turkey", ["turkey", "turkiye", "तुर्की"]],
  ["Mexico", ["mexico", "मेक्सिको"]],
  ["Egypt", ["egypt", "misr", "मिस्र"]],
  ["Nigeria", ["nigeria", "नाइजीरिया"]],
  ["South Africa", ["south africa", "दक्षिण अफ्रीका"]],
  ["Indonesia", ["indonesia", "इंडोनेशिया"]],
  ["Italy", ["italy", "इटली"]],
  ["Spain", ["spain", "स्पेन"]],
  ["South Korea", ["south korea", "korea", "कोरिया"]],
];

const hasWord = (text: string, k: string) =>
  /^[a-z0-9. ]+$/.test(k) ? new RegExp(`(^|[^a-z])${k.replace(/\./g, "\\.")}([^a-z]|$)`).test(text) : text.includes(k);

/** Text me desh ka naam dhoondho (English / Hinglish / Devanagari). */
export const findCountry = (text: string): string | undefined => {
  const t = text.toLowerCase();
  for (const [name, keys] of COUNTRY_KEYS) if (keys.some((k) => hasWord(t, k))) return name;
  return undefined;
};

const largestPolygon = (f: any) => {
  const g = f.geometry;
  if (g.type !== "MultiPolygon") return f;
  let best = g.coordinates[0], bestA = -1;
  for (const c of g.coordinates) {const a = geoArea({type: "Polygon", coordinates: c} as any); if (a > bestA) {bestA = a; best = c;}}
  return {type: "Feature", properties: f.properties, geometry: {type: "Polygon", coordinates: best}};
};

export const CountryMap: React.FC<{name: string; p: VoxPal; size: number; f: number}> = ({name, p, size, f}) => {
  const data = useMemo(() => {
    const target = FEATS.find((x) => x.properties.name === name);
    if (!target) return null;
    const main = largestPolygon(target);
    const proj = geoNaturalEarth1().fitExtent([[36, 36], [364, 364]], main as any);
    const path = geoPath(proj);
    const [cx, cy] = proj(geoCentroid(main as any)) || [200, 200];
    return {
      cx, cy,
      main: path(target as any) || "",
      others: FEATS.filter((x) => x !== target).map((x) => path(x as any) || "").filter(Boolean),
    };
  }, [name]);
  if (!data) return null;
  const bob = Math.abs(Math.sin(f * 0.12)) * 8;
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" style={{overflow: "hidden", display: "block"}}>
      <g>{data.others.map((d, i) => <path key={i} d={d} fill={rgba(p.ink, 0.07)} stroke={rgba(p.ink, 0.18)} strokeWidth="1" />)}</g>
      <path d={data.main} fill={p.c1} stroke={shade(p.c1, 0.7)} strokeWidth="3" strokeLinejoin="round" />
      <g transform={`translate(${data.cx} ${data.cy - bob})`}>
        <path d="M0 0 C-16 -22 -18 -34 -18 -40 A18 18 0 1 1 18 -40 C18 -34 16 -22 0 0 Z" fill={p.ink} />
        <circle cy="-40" r="7" fill={p.light} />
      </g>
    </svg>
  );
};
