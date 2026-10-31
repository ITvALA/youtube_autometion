"""Asks Claude (claude-sonnet-5 via your relay) for a VIDEO PLAN as JSON.
Supports 22 templates with recipe matching, deep normalization, and 9:16 vertical enforcement.
"""
import os, sys, json, requests, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(ROOT / "src") not in sys.path:
    sys.path.insert(0, str(ROOT / "src"))

from common import ROOT, jload

SYSTEM = "You are the script writer of a Hinglish book-lessons YouTube Shorts studio. Reply with ONE JSON object only. No markdown, no explanation."

TYPES = {
    "hook", "curve", "dial", "card", "quote", "story", "character", "animeParallax", "motionComic",
    "quiz", "kineticBurst", "paper", "terminal", "stickyNotes", "comicPanels", "chalkboard",
    "timeline", "countdown", "beforeAfter", "quotePoster", "habitTracker", "cyberGlitch",
    "paperCut", "gradientFlow"
}

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
    "quiz": ["question", "options"],
    "kineticBurst": ["text"],
    "paper": ["title", "points"],
    "terminal": ["command", "lines"],
    "stickyNotes": ["notes"],
    "comicPanels": ["panel1Title", "panel2Title"],
    "chalkboard": ["title", "items"],
    "timeline": ["milestones"],
    "countdown": ["rank", "title"],
    "beforeAfter": ["before", "after"],
    "quotePoster": ["quote"],
    "habitTracker": ["streak", "habits"],
    "cyberGlitch": ["text"],
    "paperCut": ["title", "desc"],
    "gradientFlow": ["text", "sub"],
}

def _call(prompt):
    base = os.environ.get("LLM_BASE_URL", "https://api.llmsrelay.com").rstrip("/")
    if base.endswith("/v1"):
        base = base[:-3]
    key, model = os.environ.get("LLM_API_KEY", ""), os.environ.get("LLM_MODEL", "claude-sonnet-5")
    if not key:
        raise RuntimeError("LLM_API_KEY is not set.")
        
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
    """config/style.json -> legacy style or template_mode"""
    cfg = jload(ROOT / "config" / "style.json", {})
    st = str(cfg.get("animation_style", "story")).lower()
    return st if st in STYLES else "story"

def normalize(p):
    """Fix small LLM slips so daily runs never fail on missing fields."""
    if not isinstance(p, dict):
        return p
    scenes = p.get("scenes", [])
    for idx, s in enumerate(scenes):
        if not isinstance(s, dict):
            continue
        d = s.get("data")
        if not isinstance(d, dict):
            d = {}
            s["data"] = d
            
        stype = s.get("type")
        if stype == "story":
            if d.get("setting") not in SETTINGS:
                d["setting"] = SETTINGS[len(str(d.get("text", ""))) % len(SETTINGS)]
            if not d.get("text"):
                d["text"] = "Power of intentional focus"
        elif stype == "character":
            if d.get("mood") not in MOODS: d["mood"] = "happy"
            if d.get("prop") not in PROPS: d["prop"] = "none"
            if not d.get("text"): d["text"] = "Consistency beats intensity!"
        elif stype == "quiz":
            if not d.get("question"): d["question"] = "Which habit leads to massive results?"
            if not d.get("options") or not isinstance(d.get("options"), list):
                d["options"] = ["A) Waiting for luck", "B) 1% daily improvement", "C) Overthinking"]
            if "correct" not in d: d["correct"] = 1
        elif stype == "kineticBurst":
            if not d.get("text"): d["text"] = "MASSIVE SHIFT HAPPENS DAILY"
        elif stype == "paper":
            if not d.get("title"): d["title"] = "Core Principle"
            if not d.get("points") or not isinstance(d.get("points"), list):
                d["points"] = ["Focus deeply", "Remove distractions", "Measure execution"]
        elif stype == "terminal":
            if not d.get("command"): d["command"] = "system.optimize()"
            if not d.get("lines") or not isinstance(d.get("lines"), list):
                d["lines"] = ["TASK: Compound Protocol", "STATUS: Executing", "RESULT: 37x Compounding"]
        elif stype == "stickyNotes":
            if not d.get("notes") or not isinstance(d.get("notes"), list):
                d["notes"] = [
                    {"text": "Small daily wins", "color": "#FEF08A", "rot": -2},
                    {"text": "Protect your energy", "color": "#FBCFE8", "rot": 2},
                    {"text": "Standardize before optimizing", "color": "#BAE6FD", "rot": -1}
                ]
        elif stype in ("comicPanels", "motionComic"):
            if not d.get("panel1Title"): d["panel1Title"] = "OLD HABIT"
            if not d.get("panel1Subtitle"): d["panel1Subtitle"] = "Endless distractions"
            if not d.get("panel2Title"): d["panel2Title"] = "NEW LEVERAGE"
            if not d.get("panel2Subtitle"): d["panel2Subtitle"] = "Uninterrupted focus blocks"
        elif stype == "chalkboard":
            if not d.get("title"): d["title"] = "CLASSROOM PROTOCOL"
            if not d.get("items") or not isinstance(d.get("items"), list):
                d["items"] = ["Master the fundamentals", "Eliminate friction", "Track your streak"]
        elif stype == "timeline":
            if not d.get("milestones") or not isinstance(d.get("milestones"), list):
                d["milestones"] = ["Phase 1: Identify Trigger", "Phase 2: Routine Action", "Phase 3: Immediate Reward"]
        elif stype == "countdown":
            if not d.get("rank"): d["rank"] = f"0{idx}"
            if not d.get("title"): d["title"] = "DECISION MASTERY"
        elif stype == "beforeAfter":
            if not d.get("before"): d["before"] = "Multitasking chaos"
            if not d.get("after"): d["after"] = "Single-task focus blocks"
        elif stype in ("quote", "quotePoster"):
            if not d.get("quote"): d["quote"] = "Small disciplines repeated with consistency lead to great achievements."
        elif stype == "habitTracker":
            if not d.get("streak"): d["streak"] = "30 DAY PROTOCOL"
            if not d.get("habits") or not isinstance(d.get("habits"), list):
                d["habits"] = ["Morning Routine", "45-min Deep Focus", "Daily Review"]
        elif stype == "cyberGlitch":
            if not d.get("text"): d["text"] = "UPGRADE OPERATING SYSTEM"
        elif stype == "paperCut":
            if not d.get("title"): d["title"] = "Depth Over Noise"
            if not d.get("desc"): d["desc"] = "Build systems that outlast daily motivation."
        elif stype == "gradientFlow":
            if not d.get("text"): d["text"] = "The Power of Momentum"
            if not d.get("sub"): d["sub"] = "Friction decreases as velocity increases."

        # Keep titles and lines short for crisp visual rendering (especially StyleEngine)
        if stype == "hook" and "title" in d:
            words = str(d["title"]).split()
            if len(words) > 4:
                d["title"] = " ".join(words[:4])
        for list_key in ("lines", "points", "items", "habits", "milestones"):
            if list_key in d and isinstance(d[list_key], list):
                d[list_key] = [" ".join(str(item).split()[:8]) for item in d[list_key][:4]]
            
    # Guarantee strict 9:16 vertical 1080x1920 format
    if "theme" in p and isinstance(p["theme"], dict):
        p["theme"]["format"] = {"name": "vertical", "width": 1080, "height": 1920}
        p["theme"]["formatName"] = "vertical"

    return p

def validate(p, template=None, style=None, style_mode=False):
    sc = p.get("scenes")
    if not isinstance(sc, list):
        return "scenes must be a list"

    if style_mode:
        if not (5 <= len(sc) <= 6):
            return "style mode requires 5 or 6 scenes"
        if sc[0].get("type") != "hook":
            return "first scene must be hook"
        if sc[-1].get("type") not in ("card", "quote"):
            return "last scene in style mode must be card or quote"
        allowed_middle = {
            "card", "dial", "timeline", "beforeAfter", "habitTracker",
            "chalkboard", "paper", "countdown", "quote"
        }
        forbidden_style_types = {"story", "character", "animeParallax", "motionComic", "curve"}
        for s in sc[1:-1]:
            st = s.get("type")
            if st in forbidden_style_types or st not in allowed_middle:
                return f"forbidden scene type in style mode: {st}"
    else:
        if not (4 <= len(sc) <= 7):
            return "need 4 to 7 scenes"
        if sc[0].get("type") != "hook":
            return "first scene must be hook"
        if sc[-1].get("type") not in ("card", "quote", "quotePoster"):
            return "last scene must be card, quote, or quotePoster"

    if len({s.get("type") for s in sc}) < 3:
        return "need at least 3 different scene types"
    
    for s in sc:
        t = s.get("type")
        if t not in TYPES:
            return f"unknown type {t}"
        if not str(s.get("narration", "")).strip():
            return "empty narration"
        for k in NEED.get(t, []):
            if k not in s.get("data", {}):
                return f"{t} scene missing data.{k}"
                
    # Validate template recipe adherence if template provided (skip in style mode)
    if not style_mode and template and isinstance(template, dict):
        recipe = template.get("scene_recipe", [])
        recipe_types = set(recipe)
        present_types = set(s.get("type") for s in sc)
        # Ensure at least the core specialized scene types from the recipe are present
        specialized = recipe_types - {"hook", "card", "quote"}
        if specialized and not (present_types & specialized):
            return f"template {template.get('id')} requires at least one of {specialized}"

    if not p.get("youtube", {}).get("title"):
        return "missing youtube.title"
        
    return None

def make_plan(book, recent_sequences=None, template=None, style_mode=False, custom_script=None):
    style = get_style()

    if style_mode:
        if custom_script:
            topic_desc = f"""CUSTOM USER TOPIC / SCRIPT:
\"\"\"{custom_script}\"\"\"
Convert this custom user topic/script into a high-energy 25-35 second vertical 9:16 video plan with 5 scenes.
Faithfully follow the user's message and core points."""
            hook_start_req = "First scene narration MUST immediately hook the viewer with the core question or problem (NO greetings like 'Namaste dosto', get straight to the point)."
        else:
            topic_desc = f"""Book: {book['title']} by {book.get('author', 'Author')}.
Make a 25-35 second vertical 9:16 video plan about its 3-4 most powerful lessons."""
            hook_start_req = f"First scene narration MUST start directly with '{book['title']} hume sikhati hai...' (NO greetings like 'Namaste dosto', start directly with the book title)."

        prompt = f"""{topic_desc}
Return JSON: {{"scenes":[{{"type":..., "narration":..., "tts_text":..., "data":{{...}}}}], "youtube":{{"title":..., "description":..., "tags":[...]}}}}

STYLE MODE REQUIREMENTS:
1. Generate exactly 5 or 6 scenes.
2. First scene MUST be 'hook' (title <= 4 words in ALL CAPS).
3. Last scene MUST be 'quote' or 'card'.
4. Middle scenes MUST be chosen ONLY from: card, dial, timeline, beforeAfter, habitTracker, chalkboard, paper, countdown, quote.
5. NEVER use story, character, animeParallax, motionComic, or curve.
6. Keep titles SHORT (hook title <= 4 words, each line item <= 8 words, max 3-4 lines).
7. At least 3 different scene types.
8. DUAL-SCRIPT SYSTEM:
   - 'narration': Clean Hinglish (Roman English letters, 12-22 words) for ON-SCREEN visual subtitles/lyrics.
   - 'tts_text': Pure Devanagari Hindi text corresponding to the scene for the TTS audio voice to speak with flawless native pronunciation.
9. BRANDING MANDATES:
   - {hook_start_req}
   - Last scene narration MUST conclude with the channel name "MindSpark" (e.g. "...aise aur powerful insights ke liye MindSpark ko subscribe karein!").

Available Scene types in Style Mode and their data:
- hook: {{"title":"MAX 4 WORDS CAPS", "sub":"{book['title']}, {book.get('author', 'Author')}"}}
- card: {{"lines":["takeaway 1 (<= 8 words)", "takeaway 2", "takeaway 3"]}}
- dial: circular breakdown. {{"center":"PILLARS", "items":["pillar 1", "pillar 2", "pillar 3"]}}
- timeline: roadmap steps. {{"milestones":["Step 1", "Step 2", "Step 3"]}}
- beforeAfter: {{"before":"old way trap", "after":"breakthrough shift"}}
- habitTracker: daily habit streak. {{"streak":"30 DAY PROTOCOL", "habits":["habit 1", "habit 2", "habit 3"]}}
- chalkboard: classroom chalk board. {{"title":"RULE", "items":["point 1", "point 2", "point 3"]}}
- paper: clean minimalist note. {{"title":"CORE PRINCIPLE", "points":["point 1", "point 2", "point 3"]}}
- countdown: numbered ranking. {{"rank":"01", "title":"LESSON", "sub":"explanation"}}
- quote: wisdom quote. {{"quote":"short punchy quote", "by":"{book.get('author', 'Author')}"}}

Avoid these recent scene sequences: {json.dumps(recent_sequences or [])}.
youtube.title under 70 chars, description 2 short lines + hashtags."""
    else:
        template_info = ""
        if template and isinstance(template, dict):
            t_id = template.get("id")
            t_name = template.get("name")
            t_desc = template.get("description")
            t_recipe = template.get("scene_recipe", [])
            template_info = f"""\nACTIVE TEMPLATE: {t_name} ({t_id})
Template Look & Vibe: {t_desc}
TARGET SCENE RECIPE: {json.dumps(t_recipe)}
Ensure your chosen scenes closely match this recipe while covering the book's core insights."""
        else:
            template_info = f"\nSTYLE RULE: {STYLE_RULE.get(style, 'Use rich varied scenes')}"

        prompt = f"""Book: {book['title']} by {book.get('author', 'Author')}.
Make a 25-35 second vertical 9:16 video plan about its 3-4 most powerful lessons.
Return JSON: {{"scenes":[{{"type":..., "narration":..., "tts_text":..., "data":{{...}}}}], "youtube":{{"title":..., "description":..., "tags":[...]}}}}
{template_info}

Available Scene types and their data:
- hook: {{"title":"max 4 words CAPS", "sub":"{book['title']}, {book.get('author', 'Author')}"}}
- story: animated parallax landscape. {{"setting":"mountains"|"city"|"forest"|"ocean"|"night_sky", "text":"punchy Hinglish line", "hl":"word to highlight", "tag":"e.g. LESSON 1"}}
- character: Spark mascot speech bubble. {{"mood":"happy"|"thinking"|"surprised"|"determined", "prop":"none"|"book"|"bulb"|"coin", "text":"Hinglish speech bubble"}}
- quiz: interactive quiz. {{"question":"quiz question", "options":["A) ...", "B) ...", "C) ..."], "correct":1}}
- kineticBurst: bold typography explosion. {{"text":"PUNCHY HIGH ENERGY LINE", "hl":"WORD", "tag":"INSIGHT"}}
- paper: clean minimalist note. {{"title":"Core Rule", "points":["point 1", "point 2", "point 3"]}}
- terminal: retro hacker console. {{"command":"sys.run()", "lines":["line 1", "line 2", "line 3"]}}
- stickyNotes: pinned notes board. {{"notes":[{{"text":"Note 1", "color":"#FEF08A", "rot":-2}}, {{"text":"Note 2", "color":"#FBCFE8", "rot":2}}]}}
- comicPanels: split comic strip. {{"panel1Title":"OLD WAY", "panel1Subtitle":"bad habit", "panel2Title":"NEW PROTOCOL", "panel2Subtitle":"exponential result"}}
- chalkboard: classroom chalk board. {{"title":"RULE", "items":["point 1", "point 2"]}}
- timeline: roadmap journey. {{"milestones":["Step 1", "Step 2", "Step 3"]}}
- countdown: numbered ranking. {{"rank":"01", "title":"LESSON", "sub":"explanation"}}
- beforeAfter: split comparison. {{"before":"old trap", "after":"breakthrough shift"}}
- quotePoster: editorial quote poster. {{"quote":"powerful insight quote", "by":"{book.get('author', 'Author')}"}}
- habitTracker: daily habit streak. {{"streak":"30 DAY PROTOCOL", "habits":["habit 1", "habit 2", "habit 3"]}}
- cyberGlitch: glitch cyber digital HUD. {{"text":"SYSTEM SHIFT", "tag":"PROTOCOL"}}
- paperCut: organic layered paper craft. {{"title":"Depth Over Noise", "desc":"meaningful insight"}}
- gradientFlow: modern kinetic gradient flow. {{"text":"MOMENTUM", "sub":"formula for action"}}
- curve: growth compounding chart. {{"up":1.01, "down":0.99, "label":"37x", "labelDown":"0.03x"}}
- dial: circular pillar breakdown. {{"center":"PILLARS", "items":["item 1", "item 2", "item 3"]}}
- card: takeaway cards. {{"lines":["takeaway 1", "takeaway 2", "takeaway 3"]}}
- quote: wisdom quote. {{"quote":"quote text", "by":"{book.get('author', 'Author')}"}}

Rules: 5 or 6 scenes. First scene = hook. Last scene = card, quote, or quotePoster. At least 3 different scene types.
DUAL-SCRIPT SYSTEM:
- 'narration': Clean Hinglish (Roman English letters, 12-22 words) for ON-SCREEN visual subtitles/lyrics.
- 'tts_text': Pure Devanagari Hindi text corresponding to the scene for the TTS audio voice to speak with flawless native pronunciation.
BRANDING MANDATES:
- First scene narration MUST start directly with "{book['title']} hume sikhati hai..." (NO greetings like 'Namaste dosto', NO 'Kitab' prefix, start directly with the book title).
- Last scene narration MUST conclude with the channel name "MindSpark" (e.g. "...aise aur powerful insights ke liye MindSpark ko subscribe karein!").
Avoid these recent scene sequences: {json.dumps(recent_sequences or [])}.
youtube.title under 70 chars, description 2 short lines + hashtags."""

    err = None
    for _ in range(3):
        txt = _call(prompt + (f"\nYour previous answer was invalid: {err}. Fix it." if err else ""))
        try:
            plan = json.loads(txt[txt.index("{"): txt.rindex("}") + 1])
            plan = normalize(plan)

            # Programmatically guarantee book name at start and MindSpark at end
            if plan.get("scenes"):
                first_s = plan["scenes"][0]
                last_s = plan["scenes"][-1]
                b_title = book.get("title", "").replace(",", "").strip()
                f_narr = first_s.get("narration", "").strip()
                # Strip out any greetings like "Namaste dosto", "Kitab", etc.
                f_narr = re.sub(r'^(?:namaste\s*(?:dosto)?[\s!,.]*|kitab\s+|dosto[\s!,.]*)+', '', f_narr, flags=re.IGNORECASE).strip()
                if not f_narr.lower().startswith(b_title.lower()):
                    first_s["narration"] = f"{b_title} hume sikhati hai: " + f_narr
                else:
                    first_s["narration"] = f_narr

                l_narr = last_s.get("narration", "")
                if "mindspark" not in l_narr.lower():
                    last_s["narration"] = l_narr.rstrip(".! ") + ". Aur aisi life-changing insights ke liye MindSpark ko subscribe karein!"

                # Ensure tts_text exists on each scene
                for sc in plan["scenes"]:
                    if not sc.get("tts_text"):
                        sc["tts_text"] = sc["narration"]

            err = validate(plan, template=template, style=style, style_mode=style_mode)
            if not err:
                return plan
        except Exception as e:
            err = f"not valid JSON ({e})"
    raise RuntimeError("LLM plan failed: " + str(err))

STYLE_RULE = {
    "mix": "include at least 1 story scene AND at least 1 character scene.",
    "story": "include at least 2 story scenes and NO character scene.",
    "character": "include at least 2 character scenes and NO story scene.",
    "classic": "do NOT use story or character scenes.",
    "anime": "include at least 1 animeParallax or motionComic scene.",
}
