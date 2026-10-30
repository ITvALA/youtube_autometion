"""Asks Claude (claude-sonnet-5 via your relay) for a VIDEO PLAN as JSON."""
import os, json, requests
from common import ROOT, jload

SYSTEM = "You are the script writer of a Hinglish book-lessons YouTube Shorts studio. Reply with ONE JSON object only. No markdown, no explanation."
TYPES = {"hook", "curve", "dial", "card", "quote", "story", "character", "animeParallax", "motionComic"}
SETTINGS = ["mountains", "city", "forest", "ocean", "night_sky"]
MOODS = ["happy", "thinking", "surprised", "determined"]
PROPS = ["none", "book", "bulb", "coin"]
STYLES = ("mix", "story", "character", "classic", "anime")
NEED = {
    "hook": ["title"],
    "curve": ["up", "down", "label"],
    "dial": ["center", "items"],
    "card": ["lines"],
    "quote": ["quote"],
    "story": ["setting", "text"],
    "character": ["mood", "text"],
    "animeParallax": ["title", "emotion"],
    "motionComic": ["panel1Title", "panel2Title"],
}

def _call(prompt):
    base = os.environ.get("LLM_BASE_URL", "https://api.llmsrelay.com").rstrip("/")
    if base.endswith("/v1"):
        base = base[:-3]
    key, model = os.environ["LLM_API_KEY"], os.environ.get("LLM_MODEL", "claude-sonnet-5")
    if os.environ.get("LLM_API_STYLE", "openai") == "anthropic":
        r = requests.post(base + "/v1/messages", timeout=180,
            headers={"x-api-key": key, "anthropic-version": "2023-06-01"},
            json={"model": model, "max_tokens": 3000, "system": SYSTEM, "messages": [{"role": "user", "content": prompt}]})
        r.raise_for_status()
        return r.json()["content"][0]["text"]
    r = requests.post(base + "/v1/chat/completions", timeout=180, headers={"Authorization": "Bearer " + key},
        json={"model": model, "max_tokens": 3000, "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": prompt}]})
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]

def get_style():
    """config/style.json -> {"animation_style": "mix" | "story" | "character" | "classic" | "anime"}"""
    st = str(jload(ROOT / "config" / "style.json", {}).get("animation_style", "story")).lower()
    return st if st in STYLES else "story"

def normalize(p):
    """Fix small LLM slips (unknown setting/mood/prop) so the daily run never fails on them."""
    for s in p.get("scenes", []) if isinstance(p, dict) else []:
        d = s.get("data")
        if not isinstance(d, dict): continue
        if s.get("type") == "story" and d.get("setting") not in SETTINGS:
            d["setting"] = SETTINGS[len(str(d.get("text", ""))) % len(SETTINGS)]
        if s.get("type") == "character":
            if d.get("mood") not in MOODS: d["mood"] = "happy"
            if d.get("prop") not in PROPS: d["prop"] = "none"
            if d.get("setting") not in SETTINGS: d.pop("setting", None)
    return p

def validate(p, style=None):
    style = style or get_style()
    sc = p.get("scenes")
    if not isinstance(sc, list) or not 4 <= len(sc) <= 7: return "need 4 to 7 scenes"
    if sc[0].get("type") != "hook": return "first scene must be hook"
    if sc[-1].get("type") not in ("card", "quote"): return "last scene must be card or quote"
    if len({s.get("type") for s in sc}) < 3: return "need at least 3 different scene types"
    for s in sc:
        t = s.get("type")
        if t not in TYPES: return f"unknown type {t}"
        if not str(s.get("narration", "")).strip(): return "empty narration"
        for k in NEED[t]:
            if k not in s.get("data", {}): return f"{t} scene missing data.{k}"
    n_story = sum(1 for s in sc if s["type"] == "story")
    n_char = sum(1 for s in sc if s["type"] == "character")
    if style == "mix" and not (n_story >= 1 and n_char >= 1): return "need at least 1 story scene AND 1 character scene"
    if style == "story" and not (n_story >= 2 and n_char == 0): return "need at least 2 story scenes and no character scene"
    if style == "character" and not (n_char >= 2 and n_story == 0): return "need at least 2 character scenes and no story scene"
    if style == "classic" and (n_story or n_char): return "do not use story or character scenes"
    if style == "anime":
        n_anime = sum(1 for s in sc if s["type"] in ("animeParallax", "motionComic"))
        if n_anime < 1: return "need at least 1 animeParallax or motionComic scene"
    if not p.get("youtube", {}).get("title"): return "missing youtube.title"
    return None

STYLE_RULE = {
    "mix": "include at least 1 story scene AND at least 1 character scene.",
    "story": "include at least 2 story scenes and NO character scene.",
    "character": "include at least 2 character scenes and NO story scene.",
    "classic": "do NOT use story or character scenes.",
    "anime": "include at least 1 animeParallax or motionComic scene.",
}

def make_plan(book, recent_sequences):
    style = get_style()
    prompt = f"""Book: {book['title']} by {book['author']}.
Make a 25-35 second vertical video plan about its 3-4 most powerful lessons.
Return JSON: {{"scenes":[{{"type":..., "narration":..., "data":{{...}}}}], "youtube":{{"title":..., "description":..., "tags":[...]}}}}
Scene types and their data:
- hook:  {{"title":"max 4 words, CAPS", "sub":"{book['title']}, {book['author']}"}}
- story: animated parallax landscape with big text. {{"setting":"one of {'|'.join(SETTINGS)}","text":"max 8 words, punchy Hinglish line","hl":"one word from text to highlight","tag":"optional short label e.g. LESSON 1"}}
- character: Spark the mascot talks in a speech bubble. {{"mood":"one of {'|'.join(MOODS)}","prop":"one of {'|'.join(PROPS)}","text":"max 10 words Hinglish speech bubble"}}
- animeParallax: 2.5D Japanese anime character scene with dynamic action speed lines. {{"title":"PUNCHY TITLE", "subtitle":"insight", "emotion":"focus"|"thinking"|"triumph"|"warning", "badge":"ANIME SHIFT", "speedLines":true}}
- motionComic: Split manga comic strip scene with 2 panels. {{"panel1Title":"OLD WAY", "panel1Subtitle":"bad habit", "panel2Title":"1% SHIFT", "panel2Subtitle":"exponential result", "badgeText":"PROTOCOL", "emotion":"focus"|"triumph"}}
- curve: growth chart. {{"up":1.01,"down":0.99,"label":"37x","labelDown":"0.03x"}} (only if the book has a compounding or growth idea)
- dial:  {{"center":"max 9 chars","items":["2 to 6 short items"]}} (steps, rules, pillars)
- card:  {{"lines":["3 short lines"]}} (key takeaways)
- quote: {{"quote":"max 14 words","by":"{book['author']}"}}
STYLE RULE: {STYLE_RULE[style]}
Rules: 5 or 6 scenes. First scene = hook. Last scene = card or quote. At least 3 different types.
narration = Hinglish (Roman Hindi + English), natural, 12 to 22 words, high attention, no emojis.
Avoid these recent scene-type sequences: {json.dumps(recent_sequences)}.
youtube.title under 70 chars, description 2 short lines + hashtags."""
    err = None
    for _ in range(3):
        txt = _call(prompt + (f"\nYour previous answer was invalid: {err}. Fix it." if err else ""))
        try:
            plan = json.loads(txt[txt.index("{"): txt.rindex("}") + 1])
            plan = normalize(plan)
            err = validate(plan, style)
            if not err:
                return plan
        except Exception as e:
            err = f"not valid JSON ({e})"
    raise RuntimeError("LLM plan failed: " + str(err))
