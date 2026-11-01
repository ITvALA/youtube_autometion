import type {Scene} from "../Video";
import {ICON_KEYS} from "./icons";
import {findCountry} from "./geo";
import {Layout, VoxContent, VoxItem, mulberry} from "./types";

/*
 * Kisi bhi scene type (hook, card, story, quote, beforeAfter ...) ko Vox layout me badalta hai:
 *   layout + icons + chhote labels. LLM ne data.icons / data.labels / data.country diya ho to wahi use hota hai,
 *   warna text ke keywords (English / Hinglish / Devanagari) se icon chunta hai.
 */
const KW: [string, string[]][] = [
  ["bag", ["invest", "nivesh", "wealth", "ameer", "daulat", "saving", "bachat", "निवेश", "दौलत"]],
  ["coins", ["paisa", "paise", "rupay", "rupee", "rupye", "₹", "money", "dhan", "cash", "income", "kamai", "salary", "crore", "karod", "lakh", "पैसा", "पैसे", "रुपये", "धन", "कमाई", "करोड़"]],
  ["chartDown", ["fall", "girna", "gir ", "decline", "loss", "nuksan", "fail", "decrease", "गिर", "नुकसान"]],
  ["chartUp", ["grow", "badh", "increase", "rise", "success", "safal", "tarakki", "progress", "improve", "behtar", "better", "compound", "vikas", "result", "बढ़", "तरक्की", "बेहतर"]],
  ["brain", ["dimag", "mind", "think", "soch", "brain", "mental", "focus", "concentrat", "psycholog", "memory", "yaad", "identity", "belief", "दिमाग", "सोच", "ध्यान"]],
  ["bulb", ["idea", "vichar", "creativ", "insight", "samajh", "learn", "seekh", "smart", "aviskar", "सीख", "विचार", "समझ"]],
  ["book", ["book", "kitab", "padh", "read", "study", "lesson", "gyaan", "gyan", "knowledge", "author", "किताब", "पढ़", "ज्ञान"]],
  ["hourglass", ["late", "der ", "wait", "intezaar", "patience", "sabr", "dheeraj", "धैर्य", "इंतज़ार"]],
  ["calendar", ["year", "saal", "month", "mahina", "week", "hafta", "30 day", "365", "calendar", "साल", "महीना"]],
  ["clock", ["time", "samay", "waqt", "roz", "daily", "minute", "ghanta", "hour", "deadline", "समय", "वक्त", "रोज़"]],
  ["target", ["goal", "lakshya", "target", "aim", "mission", "objective", "लक्ष्य"]],
  ["rocket", ["start", "shuru", "launch", "rocket", "fast", "tez", "scale", "शुरू", "तेज़"]],
  ["trophy", ["win", "jeet", "champion", "best", "winner", "reward", "inaam", "top ", "जीत"]],
  ["gear", ["system", "process", "routine", "habit", "aadat", "machine", "method", "tarika", "आदत", "सिस्टम", "तरीका"]],
  ["fire", ["motivation", "josh", "passion", "aag", "burn", "energy", "urja", "streak", "junoon", "जोश", "जुनून"]],
  ["shield", ["protect", "bachao", "risk", "insurance", "suraksha", "trust", "bharosa", "सुरक्षा", "भरोसा"]],
  ["lock", ["secret", "raaz", "lock", "control", "discipline", "restrict", "अनुशासन"]],
  ["mountain", ["mountain", "pahad", "challenge", "summit", "peak", "struggle", "sangharsh", "mushkil", "hurdle", "obstacle", "difficult", "पहाड़", "मुश्किल", "संघर्ष"]],
  ["steps", ["step", "kadam", "ladder", "seedhi", "journey", "safar", "slowly", "dheere", "small", "chhot", "1%", "कदम", "सफर", "धीरे"]],
  ["plant", ["seed", "beej", "plant", "paudha", "tree", "ped ", "badlav", "बीज", "पौधा", "बदलाव"]],
  ["people", ["log", "people", "team", "friend", "dost", "society", "samaj", "community", "maahol", "environment", "लोग", "दोस्त", "समाज", "माहौल"]],
  ["house", ["ghar", "home", "house", "family", "parivar", "घर", "परिवार"]],
  ["building", ["company", "business", "office", "job", "naukri", "city", "shehar", "vyapar", "startup", "corporate", "नौकरी", "व्यापार", "शहर"]],
  ["phone", ["phone", "mobile", "social", "instagram", "scroll", "app", "notification", "digital", "screen", "internet", "फोन", "मोबाइल"]],
  ["laptop", ["laptop", "computer", "code", "coding", "work", "skill", "online", "course", "काम", "स्किल"]],
  ["heart", ["love", "pyar", "dil", "health", "sehat", "relationship", "emotion", "khushi", "happy", "प्यार", "दिल", "सेहत", "खुशी"]],
  ["moon", ["night", "raat", "sleep", "neend", "रात", "नींद"]],
  ["sun", ["morning", "subah", "sunrise", "सुबह"]],
  ["megaphone", ["say ", "bol", "speak", "announce", "marketing", "voice", "awaaz", "viral", "share", "आवाज़"]],
  ["magnifier", ["search", "dhundh", "detail", "observe", "dekho", "notice", "research", "analysis", "ढूंढ"]],
  ["scale", ["balance", "santulan", "choice", "decision", "faisla", "compare", "justice", "trade", "फैसला", "संतुलन"]],
  ["globe", ["world", "duniya", "global", "earth", "international", "दुनिया"]],
  ["chat", ["talk", "baat", "conversation", "communicat", "listen", "sunna", "feedback", "बात"]],
  ["dumbbell", ["exercise", "gym", "fitness", "workout", "muscle", "mehnat", "practice", "reps", "मेहनत", "कसरत"]],
  ["coffee", ["coffee", "chai", "break", "relax", "aaram", "rest", "चाय", "आराम"]],
  ["key", ["key", "chaabi", "solution", "unlock", "answer", "jawab", "rule", "चाबी", "जवाब"]],
  ["battery", ["thakaan", "tired", "burnout", "charge", "stamina", "थकान"]],
  ["pie", ["percent", "%", "hissa", "portion", "data", "statistic", "प्रतिशत", "हिस्सा"]],
  ["cross", ["galat", "mistake", "wrong", "avoid", "galti", "mat ", "stop", "गलत", "गलती", "बंद"]],
  ["check", ["sahi", "correct", "done", "complete", "right", "सही"]],
  ["question", ["why", "kyun", "kyu ", "how", "kaise", "question", "sawal", "?", "क्यों", "कैसे", "सवाल"]],
  ["person", ["you", "tum", "aap", "khud", "self", "person", "insan", "vyakti", "aadmi", "आप", "खुद", "इंसान"]],
];
/* NICHE KEYWORDS (instagram_faceless_niche_list: 12 categories / 115 niches). Ye KW se pehle check hote hain. */
const NICHE_KW: [string, string[]][] = [
  ["ghost", ["ghost", "bhoot", "horror", "haunted", "scary", "darawna", "bhootiya", "spirit", "भूत", "डरावना", "हॉरर", "आत्मा"]],
  ["skull", ["skull", "death", "maut", "murder", "khoon", "dead", "mrityu", "कंकाल", "मौत", "मृत्यु", "खून"]],
  ["handcuffs", ["arrest", "jail", "prison", "criminal", "giraftar", "qaidi", "jurm", "गिरफ्तार", "जेल", "अपराधी"]],
  ["fingerprint", ["crime", "apradh", "detective", "investigat", "forensic", "evidence", "saboot", "police", "क्राइम", "अपराध", "सबूत", "जासूस"]],
  ["puzzle", ["unsolved", "mystery", "puzzle", "riddle", "paheli", "rahasya", "gutthi", "रहस्य", "पहेली", "गुत्थी"]],
  ["siren", ["emergency", "accident", "incident", "breaking", "hadsa", "khabar", "हादसा", "खबर", "ख़बर", "real-life", "real life"]],
  ["film", ["movie", "film", "cinema", "thriller", "web series", "bollywood", "kahani", "story", "कहानी", "फिल्म", "फ़िल्म", "सिनेमा"]],
  ["mask", ["dark psychology", "manipulat", "fake", "nakli", "drama", "mask", "dhokha", "chhal", "personality", "मुखौटा", "धोखा", "नकली", "छल"]],
  ["chess", ["chess", "shatranj", "mind game", "strategy", "chaal", "rannit", "शतरंज", "रणनीति", "चाल"]],
  ["eye", ["eye", "body language", "aankh", "nazar", "आंख", "आँख", "नज़र"]],
  ["handshake", ["social skill", "handshake", "deal", "agreement", "partner", "networking", "samjhauta", "दोस्ती", "समझौता"]],
  ["face", ["emotion", "feeling", "mood", "empathy", "jazbaat", "bhavna", "smile", "muskaan", "भावना", "जज़्बात", "इमोशन", "मुस्कान"]],
  ["column", ["stoic", "philosoph", "socrates", "plato", "aristotle", "wisdom", "greek", "दर्शन", "स्टोइक", "ग्रीक"]],
  ["meditate", ["yoga", "meditat", "mental wellness", "mindful", "calm", "shanti", "peace", "sukoon", "योग", "शांति", "सुकून", "मेडिटेशन"]],
  ["lotus", ["spiritual", "adhyatm", "lotus", "kamal", "moksh", "आध्यात्म", "कमल", "मोक्ष"]],
  ["diamond", ["luxury", "luxurious", "expensive", "jewel", "diamond", "hira", "लग्ज़री", "हीरा", "महंगा", "अमीरी"]],
  ["car", ["car ", "cars ", "gaadi", "lamborghini", "ferrari", "कार ", "गाड़ी"]],
  ["crown", ["king", "raja", "queen", "rani", "royal", "emperor", "samrat", "maharaja", "millionaire", "crorepati", "राजा", "रानी", "सम्राट", "शाही"]],
  ["pyramid", ["pyramid", "egypt", "misr", "pharaoh", "mummy", "पिरामिड", "मिस्र"]],
  ["castle", ["castle", "fort ", "qila", "kila", "palace", "mahal", "kingdom", "किला", "महल", "क़िला"]],
  ["temple", ["temple", "mandir", "dharm", "religion", "bhagwan", "ishwar", "मंदिर", "भगवान", "धर्म"]],
  ["swords", ["battle", "war ", "yudh", "jung", "sword", "talwar", "soldier", "sipahi", "लड़ाई", "युद्ध", "तलवार", "जंग"]],
  ["scroll", ["history", "itihas", "ancient", "purana", "prachin", "civilization", "sabhyata", "manuscript", "इतिहास", "प्राचीन", "सभ्यता"]],
  ["compass", ["compass", "direction", "explorer", "explore", "adventure", "disha", "दिशा", "खोजी"]],
  ["telescope", ["telescope", "astronomy", "nasa", "isro", "खगोल", "दूरबीन"]],
  ["planet", ["planet", "grah", "saturn", "jupiter", "mars", "universe", "brahmand", "solar", "galaxy", "space", "ग्रह", "ब्रह्मांड", "अंतरिक्ष"]],
  ["star", ["star ", "stars ", "sitare", "tara ", "celebrity", "famous", "तारा", "सितारे"]],
  ["atom", ["atom", "physics", "quantum", "particle", "bhautik", "परमाणु", "भौतिक", "क्वांटम"]],
  ["microscope", ["microscope", "bacteria", "virus", "germ", "kitanu", "जीवाणु", "कीटाणु", "सूक्ष्म"]],
  ["dna", ["dna", "gene", "genetic", "evolution", "biology", "जीन"]],
  ["flask", ["chemistry", "experiment", "lab ", "scientific", "science", "vigyan", "discovery", "invention", "aavishkar", "रसायन", "प्रयोग", "विज्ञान", "आविष्कार"]],
  ["lightning", ["lightning", "bijli", "thunder", "electric", "बिजली", "करंट"]],
  ["heartbeat", ["heartbeat", "pulse", "dhadkan", "cardio", "human body", "body", "sharir", "शरीर", "धड़कन"]],
  ["fish", ["fish", "machli", "ocean", "samundar", "sea ", "marine", "underwater", "whale", "shark", "dolphin", "मछली", "समुद्र", "सागर"]],
  ["wave", ["wave", "surf", "tide", "lehar", "लहर"]],
  ["leaf", ["nature", "prakriti", "forest", "eco", "paryavaran", "प्रकृति", "पर्यावरण", "जंगल"]],
  ["plane", ["plane ", "flight", "airplane", "aeroplane", "travel", "yatra", "trip ", "tour", "airport", "visa", "यात्रा", "उड़ान", "हवाई"]],
  ["suitcase", ["luggage", "suitcase", "packing", "backpack", "holiday", "vacation", "chhutti", "छुट्टी", "सामान"]],
  ["tent", ["camp", "tent", "trek", "hiking", "hidden destination", "abandoned", "तंबू", "कैंप", "ट्रेक"]],
  ["palm", ["beach", "island", "tropical", "goa ", "maldives", "bali", "बीच", "द्वीप", "गोवा"]],
  ["camera", ["photo", "camera", "photograph", "cinematograph", "shoot", "फोटो", "कैमरा"]],
  ["ship", ["ship", "jahaz", "boat", "naav", "cruise", "sailing", "titanic", "pirate", "navy", "जहाज़", "नाव"]],
  ["apple", ["apple", "fruit", "phal", "nutrition", "diet", "vitamin", "protein", "फल", "सेब", "पोषण", "डाइट"]],
  ["shoe", ["running", "run ", "jogging", "marathon", "sneaker", "shoe", "daud", "दौड़", "जूते", "जूता"]],
  ["drop", ["water", "paani", "hydrat", "boond", "पानी", "बूंद"]],
  ["bed", ["sleep", "neend", "bed ", "insomnia", "sone ", "सोना", "नींद"]],
  ["stopwatch", ["stopwatch", "timer", "sprint", "seconds", "स्टॉपवॉच", "सेकंड"]],
  ["burger", ["burger", "fast food", "junk food", "street food", "chaat", "vada pav", "samosa", "बर्गर", "चाट", "समोसा", "स्ट्रीट फूड"]],
  ["pizza", ["pizza", "italian", "पिज़्ज़ा", "पिज्जा"]],
  ["chefhat", ["chef", "recipe", "cooking", "cook ", "rasoi", "kitchen", "रेसिपी", "कुकिंग", "रसोई", "शेफ"]],
  ["pot", ["curry", "sabzi", "dal ", "boil", "simmer", "सब्ज़ी", "सब्जी", "दाल"]],
  ["cake", ["cake", "dessert", "sweet", "mithai", "baking", "bake", "birthday", "केक", "मिठाई", "डेज़र्ट"]],
  ["icecream", ["ice cream", "icecream", "kulfi", "gelato", "आइसक्रीम", "कुल्फी"]],
  ["chilli", ["chilli", "chili", "spicy", "mirch", "teekha", "masala", "spice", "मिर्च", "मसाला", "तीखा"]],
  ["bowl", ["bowl", "soup", "thali", "biryani", "khichdi", "cuisine", "food", "khana", "bhojan", "बिरयानी", "थाली", "खिचड़ी", "सूप", "खाना"]],
  ["dog", ["dog", "kutta", "puppy", "कुत्ता"]],
  ["cat", ["cat ", "cats ", "billi", "kitten", "बिल्ली"]],
  ["lion", ["lion", "sher ", "tiger", "bagh", "wild animal", "wildlife", "शेर", "बाघ", "जंगली जानवर"]],
  ["elephant", ["elephant", "hathi", "हाथी"]],
  ["turtle", ["turtle", "kachua", "tortoise", "कछुआ"]],
  ["butterfly", ["butterfly", "titli", "insect", "keeda", "तितली", "कीड़ा"]],
  ["bird", ["bird", "chidiya", "parrot", "eagle", "owl ", "pakshi", "चिड़िया", "पक्षी", "तोता"]],
  ["paw", ["pet care", "paw", "pets ", "pet ", "animal", "janwar", "जानवर", "पालतू"]],
  ["cricket", ["cricket", "ipl", "kohli", "dhoni", "bcci", "wicket", "sachin", "क्रिकेट", "विराट", "धोनी", "आईपीएल"]],
  ["football", ["football", "soccer", "fifa", "messi", "ronaldo", "फुटबॉल", "मेस्सी"]],
  ["gamepad", ["gaming", "game ", "games ", "gamer", "pubg", "minecraft", "esports", "console", "गेम", "गेमिंग"]],
  ["medal", ["medal", "olympic", "sports record", "podium", "पदक", "ओलंपिक", "मेडल"]],
  ["glove", ["wrestling", "boxing", "fight", "ufc", "wwe", "kushti", "mma", "पहलवान", "कुश्ती", "बॉक्सिंग"]],
  ["abc", ["english", "vocabulary", "grammar", "alphabet", "spelling", "अंग्रेज़ी", "अंग्रेजी", "शब्द"]],
  ["gradcap", ["exam", "college", "university", "degree", "upsc", "ssc", "neet", "competitive", "graduat", "pariksha", "परीक्षा", "कॉलेज", "डिग्री"]],
  ["briefcase", ["career", "interview", "resume", "hiring", "profession", "करियर", "इंटरव्यू"]],
  ["pencil", ["write", "likhna", "writing", "essay", "notes", "pencil", "लिखना", "लेखन"]],
  ["document", ["document", "certificate", "gk ", "general knowledge", "facts", "तथ्य", "जानकारी", "सामान्य ज्ञान"]],
  ["palette", ["art ", "painting", "colour", "color", "drawing", "paint", "कला", "पेंटिंग", "रंग"]],
  ["brush", ["brush", "sketch", "illustration", "digital art", "चित्र"]],
  ["cube", ["3d", "cube", "blender", "render", "logo", "graphic", "3डी"]],
  ["pen", ["pen ", "vector", "illustrator", "typography", "font", "calligraphy", "कलम"]],
  ["sofa", ["interior", "furniture", "sofa", "decor", "living room", "bedroom", "इंटीरियर", "फर्नीचर", "सजावट"]],
  ["scissors", ["scissor", "diy", "craft", "cut ", "kainchi", "कैंची", "क्राफ्ट"]],
  ["hanger", ["fashion", "style", "dress", "clothes", "kapde", "outfit", "wardrobe", "trend", "फैशन", "कपड़े", "पहनावा"]],
  ["sparkle", ["magic", "amazing", "wow", "satisfying", "jaadu", "जादू", "कमाल", "शानदार"]],
];

const GENERIC = ["bulb", "target", "steps", "brain", "rocket", "book", "trophy", "chartUp", "gear", "fire", "mountain", "key", "heart", "globe"];
const STOP = new Set(["the", "and", "ya", "aur", "hai", "hain", "ka", "ki", "ke", "ko", "se", "me", "mein", "par", "pe", "to", "ho", "hi", "bhi", "ek", "is", "us", "ye", "wo", "yeh", "woh", "kar", "karo", "kya", "nahi", "na", "jo", "tum", "aap", "for", "of", "in", "a", "an", "है", "और", "का", "की", "के", "को", "से", "में", "पर", "तो", "भी", "एक"]);

const hit = (t: string, k: string) => (/^[a-z0-9% ?₹]+$/.test(k) ? (k.length <= 2 ? t.includes(k) : new RegExp(`(^|[^a-z])${k.replace(/[?%₹]/g, "\\$&")}`).test(t)) : t.includes(k));

const iconsIn = (text: string): string[] => {
  const t = ` ${text.toLowerCase()} `;
  const out: string[] = [];
  for (const [icon, keys] of [...NICHE_KW, ...KW]) if (keys.some((k) => hit(t, k)) && !out.includes(icon)) out.push(icon);
  return out;
};

const pickGeneric = (rnd: () => number, used: string[]) => {
  const pool = GENERIC.filter((g) => !used.includes(g));
  return pool[Math.floor(rnd() * pool.length)] || "bulb";
};

/** Text se 1-2 sabse kaam ke shabd (chhota label). */
export const keyPhrase = (text: string, max = 2): string => {
  const words = text.replace(/[.,!?;:"“”()]/g, " ").split(/\s+/).filter(Boolean);
  const cand = words.map((w, i) => ({w, i})).filter((x) => !STOP.has(x.w.toLowerCase()) && x.w.length > 2);
  const top = cand.sort((a, b) => b.w.length - a.w.length).slice(0, max).sort((a, b) => a.i - b.i);
  return (top.length ? top.map((x) => x.w).join(" ") : words.slice(0, max).join(" ")).trim();
};

const asStr = (v: any) => (v === undefined || v === null ? "" : String(v));
const listOf = (d: any): string[] => {
  if (Array.isArray(d.notes)) return d.notes.map((n: any) => asStr(n.text ?? n));
  for (const k of ["lines", "points", "items", "milestones", "habits", "options"]) if (Array.isArray(d[k])) return d[k].map((x: any) => asStr(typeof x === "object" ? x.label ?? x.text ?? x.title ?? "" : x));
  return [];
};

const statOf = (text: string) => {
  const m = text.match(/(\d[\d,]*\.?\d*)\s*(%|x|X|din|days?|saal|years?|crore|lakh|k|K|hours?|ghante|minutes?)?/);
  if (!m) return undefined;
  const value = parseFloat(m[1].replace(/,/g, ""));
  if (!isFinite(value) || value <= 0) return undefined;
  const suf = m[2] || "";
  return {value, prefix: "", suffix: suf === "%" || suf === "x" || suf === "X" || suf === "k" || suf === "K" ? suf : suf ? ` ${suf}` : ""};
};

export const voxContent = (scene: Scene, seed: number, index: number): VoxContent => {
  const d = scene.data || {};
  const rnd = mulberry(seed * 7919 + index * 104729);
  const type = scene.type;
  const all = [asStr(d.title), asStr(d.text), asStr(d.quote), asStr(d.question), asStr(d.center), asStr(d.sub), asStr(d.desc), asStr(d.before), asStr(d.after), listOf(d).join(" "), scene.narration].join(" ");
  const title = asStr(d.title || d.text || d.quote || d.question || d.center || d.label || d.panel2Title || scene.narration);
  const sub = asStr(d.sub || d.desc || d.subtitle || d.by || d.tag || "");

  // 1) LLM ne direct Vox visual diya ho
  const v = d.visual || d.vox;
  const given: VoxItem[] | undefined = Array.isArray(v?.items) ? v.items.slice(0, 4).map((x: any) => ({icon: ICON_KEYS.includes(x.icon) || String(x.icon).startsWith("map:") ? x.icon : "bulb", label: asStr(x.label)})) : undefined;
  const country = asStr(d.country || v?.country) || findCountry(all);
  const mapName = country && findCountry(country) ? findCountry(country)! : country && findCountry(all) ? findCountry(all) : undefined;

  if (given && given.length) {
    if (type === "hook") return {layout: "hook", title, sub, items: given.slice(0, 1), country: mapName};
    const layout: Layout = (v.layout as Layout) || (given.length === 1 ? "single" : given.length === 2 ? "compare" : "trio");
    return {layout, title, sub, items: given, country: mapName};
  }

  // 2) type ke hisaab se
  if (type === "quote" || type === "quotePoster") return {layout: "quote", title, sub, items: []};
  if (type === "hook") {
    const ic = iconsIn(all)[0] || pickGeneric(rnd, []);
    return {layout: "hook", title, sub, items: [{icon: ic, label: sub}]};
  }
  if (type === "beforeAfter" || (d.before && d.after))
    return {layout: "flow", title, sub, items: [{icon: "cross", label: asStr(d.before)}, {icon: "check", label: asStr(d.after)}]};
  if (type === "curve")
    return {layout: "compare", title, sub, items: [{icon: "chartDown", label: asStr(d.down)}, {icon: "chartUp", label: asStr(d.up || d.label)}]};
  if (type === "countdown") {
    const n = Number(d.rank) || 1;
    return {layout: "stat", title, sub, items: [{icon: iconsIn(all)[0] || "trophy", label: asStr(d.title)}], stat: {value: n, prefix: "#", suffix: ""}};
  }

  const lines = listOf(d).slice(0, 4);
  if (lines.length >= 2) {
    const used: string[] = [];
    const items = lines.map((ln) => {
      const ic = iconsIn(ln).find((x) => !used.includes(x)) || pickGeneric(rnd, used);
      used.push(ic);
      return {icon: ic, label: keyPhrase(ln, 3)};
    });
    return {layout: "trio", title, sub, items};
  }

  // 3) free text (story / character / paperCut / kineticBurst ...)
  const text = asStr(d.text || d.title || d.quote || d.desc || scene.narration);
  const icons = iconsIn(`${text} ${scene.narration}`);
  const st = statOf(text);
  if (mapName) {
    const other = icons[0];
    const items: VoxItem[] = [{icon: `map:${mapName}`, label: mapName}];
    if (other) items.push({icon: other, label: asStr(d.hl) || keyPhrase(text, 2)});
    return {layout: items.length === 2 ? "compare" : "single", title: text, sub, items, country: mapName};
  }
  if (st && type !== "story") {
    return {layout: "stat", title: text, sub, items: [{icon: icons[0] || pickGeneric(rnd, []), label: asStr(d.hl) || keyPhrase(text.replace(/\d[\d,.]*\S*/g, " "), 2)}], stat: st};
  }
  if (icons.length >= 2 && rnd() < 0.5)
    return {layout: "compare", title: text, sub, items: icons.slice(0, 2).map((ic, i) => ({icon: ic, label: i === 0 ? keyPhrase(text.split(/[,;]| aur | ya | par | lekin /i)[0] || text, 2) : keyPhrase(text.split(/[,;]| aur | ya | par | lekin /i)[1] || text, 2)}))};
  return {layout: "single", title: text, sub, items: [{icon: icons[0] || pickGeneric(rnd, []), label: asStr(d.hl) || asStr(d.label) || keyPhrase(text, 2)}]};
};
