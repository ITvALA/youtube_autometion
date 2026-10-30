"""Asks Claude (claude-sonnet-5 via your relay) for a VIDEO PLAN as JSON."""
import os, json, requests

SYSTEM = "You are the script writer of a Hinglish book-lessons YouTube Shorts studio. Reply with ONE JSON object only. No markdown, no explanation."
TYPES = {"hook", "curve", "dial", "card", "quote", "animeParallax", "motionComic"}
NEED = {
    "hook": ["title"],
    "curve": ["up", "down", "label"],
    "dial": ["center", "items"],
    "card": ["lines"],
    "quote": ["quote"],
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

def validate(p):
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
    if not p.get("youtube", {}).get("title"): return "missing youtube.title"
    return None

def make_plan(book, recent_sequences):
    prompt = f"""Book: {book['title']} by {book['author']}.
Make a 25-35 second vertical video plan about its 3-4 most powerful lessons.
Return JSON: {{"scenes":[{{"type":..., "narration":..., "data":{{...}}}}], "youtube":{{"title":..., "description":..., "tags":[...]}}}}
Scene types and their data:
- hook:  {{"title":"max 4 words, CAPS", "sub":"{book['title']}, {book['author']}"}}
- animeParallax: 2.5D Japanese anime character scene with dynamic action speed lines. {{"title":"PUNCHY TITLE", "subtitle":"insight", "emotion":"focus"|"thinking"|"triumph"|"warning", "badge":"ANIME SHIFT", "speedLines":true}}
- motionComic: Split manga comic strip scene with 2 panels. {{"panel1Title":"OLD WAY", "panel1Subtitle":"bad habit", "panel2Title":"1% SHIFT", "panel2Subtitle":"exponential result", "badgeText":"PROTOCOL", "emotion":"focus"|"triumph"}}
- curve: growth chart. {{"up":1.01,"down":0.99,"label":"37x","labelDown":"0.03x"}} (only if the book has a compounding or growth idea)
- dial:  {{"center":"max 9 chars","items":["2 to 6 short items"]}} (steps, rules, pillars)
- card:  {{"lines":["3 short lines"]}} (key takeaways)
- quote: {{"quote":"max 14 words","by":"{book['author']}"}}
Rules: 5 or 6 scenes. First scene = hook. Last scene = card or quote. At least 3 different types.
narration = Hinglish (Roman Hindi + English), natural, 12 to 22 words, high attention, no emojis.
Avoid these recent scene-type sequences: {json.dumps(recent_sequences)}.
youtube.title under 70 chars, description 2 short lines + hashtags."""
    err = None
    for _ in range(3):
        txt = _call(prompt + (f"\nYour previous answer was invalid: {err}. Fix it." if err else ""))
        try:
            plan = json.loads(txt[txt.index("{"): txt.rindex("}") + 1])
            err = validate(plan)
            if not err:
                return plan
        except Exception as e:
            err = f"not valid JSON ({e})"
    raise RuntimeError("LLM plan failed: " + str(err))
