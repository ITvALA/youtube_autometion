"""PaperFilm plan maker: topic -> LLM -> clean scenes the PaperFilm Remotion engine can render.

Flow (used by daily_pipeline.run_paperfilm_pipeline):
    make_plan(topic, custom_script, seed)  -> {"youtube": {...}, "scenes": [...]}
    tts.narrate(scenes, ...)               -> adds durationSec + words[] to every scene
    resolve_hits(scenes)                   -> turns hit_word / hit2_word into hit / hit2 (index into words[])
"""
import re, json, random
from pathlib import Path

from common import ROOT
import llm
import yt_growth_engine

KINDS = ["title", "card", "number", "quote", "list", "map"]   # "photo" is not used: no images in the pipeline
ACCENTS = ["red", "teal", "mustard", "ink"]
DATA_DIR = ROOT / "remotion" / "src" / "cinematic" / "data"


def _load_geo():
    states, districts = [], {}
    try:
        for f in json.loads((DATA_DIR / "india-states.json").read_text(encoding="utf-8")):
            states.append(f["n"])
        for f in json.loads((DATA_DIR / "india-districts.json").read_text(encoding="utf-8")):
            districts.setdefault(f.get("s"), set()).add(f["n"])
    except Exception as e:
        print(f"[PaperFilm] geo data not readable ({e}) - map scenes will be turned into cards")
    return states, districts


_PROMPT = """Tum ek anubhavi Hindi kahani-kaar aur viral YouTube scriptwriter ho jo YouTube Shorts ke liye "paper-cut film" style video ka script likhte ho.
Ek kahani ko __N__ chhote scenes me todo. Har scene ek torn paper card jaisa dikhega: bada text, ek stamp ya highlight, aur cinematic voiceover.

__CONTEXT__

VIRAL HOOK NIYAM (Scene 1 - 21 Hook Formulas):
- Scene 1 hamesha kind "title" hoga: strictly 0-3 second ka thumb-stopper hook!
- KABHI BHI boring, informative ya generic shuruat mat karo (jaise "aaj hum baat karenge", "kya aapko pata hai").
- Seedha Extreme Stakes ("जब 1 लाख की सुल्तानी सेना के सामने..."), Forbidden Mystery ("काशी का वह गुप्त रहस्य जिसे इतिहास ने छुपाया..."), ya Contrarian Flip ("सब कहते हैं... लेकिन सच कुछ और था") se shuru karo!

NARRATIVE BRIDGES & STORY SPINE (SEAMLESS SCENE CONTINUITY):
- KABHI BHI toote hue ya alag-thalag cards mat banao!
- Har agla scene pichhle scene ka natural kram (Cause-and-Effect / Karana aur Parinaam) hona chahiye.
- Scene narration me natural connectors use karo: 'लेकिन तभी...', 'और फिर...', 'पिता के वचनों की मर्यादा के लिए...', 'तभी अचानक...', 'इसलिए...'

OUTPUT: sirf ek JSON object (koi markdown nahi, koi explanation nahi):
{
  "youtube": {"title": "Hindi title with emoji, max 60 chars, concrete proper name/number", "description": "3-4 line Hindi description + hashtags", "tags": ["..."]},
  "scenes": [
    {
      "kind": "title | card | number | quote | list | map",
      "narration": "Hinglish (Roman letters) me bolne wali line, STRICTLY 8-12 words max. Ye screen par caption banegi.",
      "tts_text": "WAHI line shuddh Devanagari Hindi me, voice ke liye. Numbers shabdon me likho.",
      "text": "Screen par bada text, Devanagari, max 6 words",
      "sub": "chhoti line (optional), max 6 words",
      "hit_word": "narration ka ek word jis par effect (highlight / stamp) lage - narration se hu-ba-hu copy karo",
      "stamp": "optional lal stamp, 1-3 words Devanagari (sirf 2-3 scenes me)",
      "accent": "red | teal | mustard | ink"
    }
  ]
}

KIND ke extra fields:
- number: "number": 1500 (sirf ank, JSON number), "unit": "साल" ya "%" ya "करोड़" (optional).
- list: "items": ["max 4 words", "max 4 words", "max 4 words"]  (3 items).
- quote: "text" = kisi paatra ka dialogue, "sub" = kisne bola.
- map: sirf tab jab kahani Bharat ki kisi asli jagah par ho. Fields:
    "state": __STATES__ me se EXACT ek naam (English),
    "district": "English zila (optional, pakka ho tabhi)",
    "place": {"name": "jagah ka naam Devanagari me", "lat": 22.2376, "lon": 68.9674},
    "text": "भारत → राज्य → जगह"  (teen naam, → se alag),
    "hit_word": narration ka wo word jab RAJYA ka naam bola jata hai,
    "hit2_word": narration ka wo word jab JAGAH ka naam bola jata hai.
  Poore video me zyada se zyada 1 map scene, aur wo scene 2 ya 3 me.

RULES:
1. Scene 1 hamesha kind "title" ho: 3 second ka hook, kahani ka naam ya sabse chaunkane wali baat.
2. Aakhri scene me kahani ka antim prabhavshali sandesh/conclusion ho. KABHI BHI 'subscribe kare' ya 'like kare' ya channel promotion mat bolo.
3. Kahani ke asli naam, jagah aur ghatnayen use karo. Kuch bhi apni taraf se mat gadho. Ek hi kind lagatar 3 baar mat lagao.
4. Beech ke scenes me kam se kam 1 "quote" ya "number" ho agar kahani me dialogue ya ank ho.
5. STRICT TIMELINE RULE: Poora video STRICTLY 38 se 45 second ka hona chahiye (kabhi bhi 45s se upar na jaye). Har scene narration STRICTLY 8 se 12 words ki concise aur fast-paced ho!
6. JSON compact rakho, trailing comma mat lagao.
"""


def _context(topic, custom_script):
    title = topic.get("title", str(topic)) if isinstance(topic, dict) else str(topic)
    summary = topic.get("summary", "") if isinstance(topic, dict) else ""
    key = topic.get("topic", "") if isinstance(topic, dict) else ""
    if custom_script:
        return (f"KAHANI (user ne di hai, isi ko faithfully adapt karo, koi aur kahani nahi):\n"
                f"Title: {title}\n\"\"\"{custom_script}\"\"\"")
    lore = None
    hay = f"{key} {title} {summary}".lower()
    for k, data in getattr(llm, "HISTORICAL_LORE", {}).items():
        if k in hay or any(p in hay for p in k.split("_") if len(p) > 3):
            lore = data
            break
    if lore:
        return ("ASLI ITIHAAS / PURAN DOSSIER (isi par tike raho):\n"
                f"Title: {lore.get('title')}\nNayak: {lore.get('protagonist')}\n"
                f"Khalnayak: {lore.get('antagonist', '')}\nSankat: {lore.get('crisis')}\n"
                f"Chamatkar: {lore.get('miracle', lore.get('miracle_climax', ''))}\n"
                f"Climax: {lore.get('climax', '')}\n"
                f"In naamo ko zaroor bolo: {', '.join(lore.get('mandatory_names', []))}\n"
                f"Dialogues: {lore.get('sample_dialogues', [])}")
    return f"KAHANI: {title}\nSummary: {summary}"


def _norm(t):
    return re.sub(r"[^\w\u0900-\u097F]+", "", str(t).lower())


def _num(v):
    try:
        return float(v)
    except Exception:
        return None


def clean_plan(plan, seed=None):
    """Make the LLM output safe for the engine. Returns the plan or raises ValueError."""
    scenes = plan.get("scenes") if isinstance(plan, dict) else None
    if not isinstance(scenes, list) or len(scenes) < 4:
        raise ValueError("plan has fewer than 4 scenes")
    states, districts = _load_geo()
    out = []
    for i, s in enumerate(scenes):
        if not isinstance(s, dict):
            continue
        narr = str(s.get("narration") or "").strip()
        if not narr:
            continue
        kind = s.get("kind") if s.get("kind") in KINDS else "card"
        sc = {
            "kind": kind,
            "narration": narr,
            "tts_text": str(s.get("tts_text") or "").strip() or narr,
            "text": str(s.get("text") or "").strip() or narr.split(".")[0][:40],
        }
        if s.get("sub"):
            sc["sub"] = str(s["sub"]).strip()
        if s.get("hit_word"):
            sc["hit_word"] = str(s["hit_word"]).strip()
        if s.get("stamp"):
            sc["stamp"] = str(s["stamp"]).strip()[:24]
        if s.get("accent") in ACCENTS:
            sc["accent"] = s["accent"]

        if kind == "number":
            n = _num(s.get("number"))
            if n is None:
                sc["kind"] = "card"
            else:
                sc["number"] = n
                if s.get("unit"):
                    sc["unit"] = str(s["unit"]).strip()
        elif kind == "list":
            items = [str(x).strip() for x in (s.get("items") or []) if str(x).strip()][:4]
            if len(items) < 2:
                sc["kind"] = "card"
            else:
                sc["items"] = items
        elif kind == "map":
            st = next((n for n in states if n.lower() == str(s.get("state") or "").strip().lower()), None)
            if not st:
                sc["kind"] = "card"
                sc["text"] = re.sub(r"\s*→\s*", " ", sc["text"]).strip()
            else:
                sc["state"] = st
                d = str(s.get("district") or "").strip()
                if d and d in districts.get(st, set()):
                    sc["district"] = d
                pl = s.get("place") if isinstance(s.get("place"), dict) else None
                if pl and _num(pl.get("lat")) is not None and _num(pl.get("lon")) is not None and pl.get("name"):
                    sc["place"] = {"name": str(pl["name"]).strip(), "lat": _num(pl["lat"]), "lon": _num(pl["lon"])}
                    if s.get("hit2_word"):
                        sc["hit2_word"] = str(s["hit2_word"]).strip()
                if s.get("span") and _num(s["span"]):
                    sc["span"] = max(0.3, min(4.0, _num(s["span"])))
        out.append(sc)

    if len(out) < 4:
        raise ValueError("fewer than 4 usable scenes")
    # Strictly cap at 8 scenes max for 38-45s timeline
    if len(out) > 8:
        out = out[:7] + [out[-1]]
    # only one map scene
    seen_map = False
    for sc in out:
        if sc["kind"] == "map":
            if seen_map:
                sc["kind"] = "card"
                sc["text"] = re.sub(r"\s*→\s*", " ", sc["text"]).strip()
            seen_map = True
    out[0]["kind"] = "title"
    out[0].pop("items", None)
    out[0].pop("number", None)

    # Clean up any subscribe / channel promotion mentions across all scenes
    for sc in out:
        for k in ["narration", "tts_text", "text", "sub"]:
            if k in sc and isinstance(sc[k], str):
                sc[k] = re.sub(r"(?i)\s*(?:aisi\s+aur\s+gathaon\s+ke\s+liye\s+)?(?:mindspark|माइंडस्पार्क)\s*(?:ko|को)?\s*(?:subscribe|सब्सक्राइब)\s*(?:karein?|करें)?[.!।]?", "", sc[k]).strip()
                sc[k] = re.sub(r"(?i)\s*(?:subscribe|सब्सक्राइब)\s*(?:karein?|करें)?[.!।]?", "", sc[k]).strip()

    # YouTube Growth & Packaging Engine Audits (21 Hook Formulas & Packaging Linter)
    hook_audit = yt_growth_engine.score_hook(out[0].get("narration") or out[0].get("text", ""))
    print(f"[PaperFilm] Hook audit: score={hook_audit['score']}/100 band={hook_audit['band']} (weakest={hook_audit['weakest']})")

    y = plan.get("youtube") if isinstance(plan.get("youtube"), dict) else {}
    if y.get("title"):
        pkg_audit = yt_growth_engine.lint_packaging(y["title"], out[0].get("text", ""))
        print(f"[PaperFilm] Packaging audit: score={pkg_audit['score']}/100, issues={len(pkg_audit['issues'])}")
        if len(y["title"]) > yt_growth_engine.HARD_LIMIT:
            y["title"] = y["title"][:yt_growth_engine.HARD_LIMIT].rstrip()
    return {"youtube": y, "scenes": out}


def make_plan(topic, custom_script=None, seed=None):
    rnd = random.Random(seed)
    states, _ = _load_geo()
    prompt = (_PROMPT
              .replace("__N__", rnd.choice(["7", "8", "7"]))
              .replace("__CONTEXT__", _context(topic, custom_script))
              .replace("__STATES__", json.dumps(states, ensure_ascii=False)))
    err = None
    for attempt in range(3):
        try:
            p = prompt if not err else prompt + f"\n\nCRITICAL: pichhle output me ye galti thi: {err}. Isse theek karo."
            raw = llm._call(p, max_tokens=8000).strip()
            if "{" in raw and "}" in raw:
                raw = raw[raw.index("{"): raw.rindex("}") + 1]
            plan = clean_plan(llm._salvage_json(raw), seed)
            print(f"[PaperFilm] plan ready: {len(plan['scenes'])} scenes, kinds = {[s['kind'] for s in plan['scenes']]}")
            return plan
        except Exception as e:
            err = str(e)
            print(f"[PaperFilm] plan attempt {attempt + 1} failed: {err}")
    raise RuntimeError(f"PaperFilm plan failed after 3 attempts: {err}")


def _find(words, target, default_frac):
    if target:
        t = _norm(target.split()[0])
        if t:
            for k, w in enumerate(words):
                if _norm(w["w"]) == t:
                    return k
            for k, w in enumerate(words):
                if t in _norm(w["w"]):
                    return k
    return max(0, min(len(words) - 1, int(len(words) * default_frac)))


def resolve_hits(scenes):
    """Call after tts.narrate (needs words[]). Writes hit / hit2 as word indexes, drops the *_word helpers."""
    for s in scenes:
        words = s.get("words") or []
        if not words:
            continue
        if s["kind"] == "map":
            h1 = _find(words, s.pop("hit_word", None), 0.3)
            h2 = _find(words, s.pop("hit2_word", None), 0.62)
            if h2 <= h1:
                h2 = min(len(words) - 1, h1 + max(1, len(words) // 4))
            s["hit"], s["hit2"] = h1, h2
        else:
            s["hit"] = _find(words, s.pop("hit_word", None), 0.35)
            s.pop("hit2_word", None)
    return scenes
