"""Asks LLM for a VIDEO PLAN as JSON.
Multi-tier resilient architecture:
  1. Primary: Custom Relay / Claude / OpenAI (via LLM_API_KEY, LLM_BASE_URL)
  2. Secondary: Hugging Face Serverless Chat API (via HF_TOKEN / HUGGINGFACE_API_KEY)
  3. Tertiary: Google Gemini API (via GEMINI_API_KEY, GEMINI_API_KEY_2)
  4. Quaternary: Built-in High-Energy 'Mirch Masala' Fallback Plan Generator
"""
import os, sys, json, requests, re, random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(ROOT / "src") not in sys.path:
    sys.path.insert(0, str(ROOT / "src"))

from common import ROOT, jload

SYSTEM = """You are India's #1 viral YouTube Shorts & Reels scriptwriter for MindSpark.
You specialize in HIGH-ENERGY, ADDICTIVE, DRAMATIC Hinglish storytelling with intense 'MIRCH MASALA' (suspense, shock, psychological intrigue, high stakes, emotional punch).
You NEVER write boring academic summaries. Every line must sound like an urgent, exciting conversation that hooks the viewer instantly.
Reply with ONE valid JSON object only. No markdown fences, no explanation."""

TYPES = {
    "hook", "curve", "dial", "card", "quote", "story", "character", "animeParallax", "motionComic",
    "quiz", "kineticBurst", "paper", "terminal", "stickyNotes", "comicPanels", "chalkboard",
    "timeline", "countdown", "beforeAfter", "quotePoster", "habitTracker", "cyberGlitch",
    "paperCut", "gradientFlow"
}

VOX_ICONS = ['coins', 'money', 'bag', 'chartUp', 'chartDown', 'pie', 'brain', 'bulb', 'book', 'clock', 'hourglass', 'person', 'people', 'building', 'house', 'phone', 'laptop', 'heart', 'target', 'rocket', 'lock', 'trophy', 'gear', 'shield', 'fire', 'plant', 'sun', 'calendar', 'megaphone', 'magnifier', 'scale', 'steps', 'check', 'cross', 'question', 'arrow', 'globe', 'chat', 'dumbbell', 'coffee', 'key', 'battery', 'mountain', 'moon', 'bars', 'lotus', 'column', 'diamond', 'crown', 'car', 'eye', 'mask', 'chess', 'puzzle', 'handshake', 'face', 'ghost', 'skull', 'fingerprint', 'handcuffs', 'siren', 'film', 'scroll', 'pyramid', 'castle', 'temple', 'swords', 'compass', 'planet', 'star', 'telescope', 'atom', 'dna', 'flask', 'microscope', 'lightning', 'leaf', 'fish', 'plane', 'suitcase', 'tent', 'palm', 'wave', 'camera', 'ship', 'meditate', 'apple', 'shoe', 'drop', 'bed', 'heartbeat', 'stopwatch', 'burger', 'pizza', 'chefhat', 'pot', 'cake', 'icecream', 'chilli', 'bowl', 'paw', 'dog', 'cat', 'bird', 'lion', 'elephant', 'turtle', 'butterfly', 'cricket', 'football', 'gamepad', 'medal', 'glove', 'abc', 'pencil', 'gradcap', 'briefcase', 'document', 'palette', 'brush', 'cube', 'pen', 'sofa', 'scissors', 'hanger', 'sparkle']

STYLES = {"mix", "story", "character", "classic", "anime"}

SETTINGS = ["study", "cafe", "park", "tokyo", "cyberpunk", "library", "mountains", "studio", "office", "sunset_rooftop"]
MOODS = ["neutral", "happy", "curious", "intense", "shocked", "celebrating", "focused", "thoughtful"]
PROPS = ["none", "book", "coffee", "laptop", "pen", "notebook", "trophy"]

NEED = {
    "hook": ["title"],
    "curve": ["up", "down", "label"],
    "dial": ["center", "items"],
    "card": ["lines"],
    "quote": ["quote"],
    "story": ["text", "setting"],
    "character": ["text", "mood", "prop"],
    "animeParallax": ["text"],
    "motionComic": ["text"],
    "quiz": ["question", "options", "correct"],
    "kineticBurst": ["text"],
    "paper": ["title", "points"],
    "terminal": ["title", "lines"],
    "stickyNotes": ["notes"],
    "comicPanels": ["panels"],
    "chalkboard": ["title", "items"],
    "timeline": ["milestones"],
    "countdown": ["rank", "title", "sub"],
    "beforeAfter": ["before", "after"],
    "quotePoster": ["quote"],
    "habitTracker": ["streak", "habits"],
    "cyberGlitch": ["text"],
    "paperCut": ["title", "desc"],
    "gradientFlow": ["text", "sub"],
}


def _call_relay(prompt):
    """Primary: calls custom relay or OpenAI/Anthropic endpoint."""
    base = os.environ.get("LLM_BASE_URL", "https://api.llmsrelay.com").rstrip("/")
    if base.endswith("/v1"):
        base = base[:-3]
    key = os.environ.get("LLM_API_KEY", "").strip()
    model = os.environ.get("LLM_MODEL", "claude-sonnet-5").strip()
    if not key:
        raise ValueError("LLM_API_KEY is not set.")

    if os.environ.get("LLM_API_STYLE", "openai") == "anthropic":
        r = requests.post(
            base + "/v1/messages",
            timeout=120,
            headers={"x-api-key": key, "anthropic-version": "2023-06-01"},
            json={"model": model, "max_tokens": 3000, "system": SYSTEM, "messages": [{"role": "user", "content": prompt}]}
        )
        r.raise_for_status()
        return r.json()["content"][0]["text"]

    r = requests.post(
        base + "/v1/chat/completions",
        timeout=120,
        headers={"Authorization": "Bearer " + key},
        json={"model": model, "max_tokens": 3000, "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": prompt}]}
    )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]["content"]


def _call_huggingface(prompt):
    """Secondary: Hugging Face serverless chat completion API."""
    token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_API_KEY") or os.environ.get("HF_API_KEY", "").strip()
    if not token:
        raise ValueError("HF_TOKEN is not set.")

    # Try fast instruction models
    models = ["Qwen/Qwen2.5-7B-Instruct", "meta-llama/Llama-3.2-3B-Instruct", "mistralai/Mistral-7B-Instruct-v0.3"]
    endpoints = [
        "https://router.huggingface.co/hf-inference/v1/chat/completions",
        "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-7B-Instruct/v1/chat/completions",
    ]

    for ep in endpoints:
        for m in models:
            try:
                r = requests.post(
                    ep,
                    timeout=90,
                    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                    json={
                        "model": m,
                        "messages": [{"role": "system", "content": SYSTEM}, {"role": "user", "content": prompt}],
                        "max_tokens": 2500,
                        "temperature": 0.7,
                    }
                )
                if r.status_code == 200:
                    data = r.json()
                    content = data["choices"][0]["message"]["content"]
                    print(f"[LLM] Successfully generated plan via HuggingFace model '{m}'!")
                    return content
            except Exception as hf_err:
                print(f"[LLM] HuggingFace endpoint {ep} / model {m} failed: {hf_err}")
                continue

    raise RuntimeError("All Hugging Face endpoints failed.")


def _call_gemini(prompt):
    """Tertiary: Google Gemini free-tier REST API."""
    key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY_2", "").strip()
    if not key:
        raise ValueError("GEMINI_API_KEY is not set.")

    models = ["gemini-2.0-flash", "gemini-1.5-flash"]
    for m in models:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={key}"
            body = {
                "contents": [{"parts": [{"text": SYSTEM + "\n\n" + prompt}]}],
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 3000}
            }
            r = requests.post(url, timeout=90, json=body)
            if r.status_code == 200:
                txt = r.json()["candidates"][0]["content"]["parts"][0]["text"]
                print(f"[LLM] Successfully generated plan via Gemini API '{m}'!")
                return txt
        except Exception as gem_err:
            print(f"[LLM] Gemini model {m} failed: {gem_err}")
            continue

    raise RuntimeError("All Gemini API models failed.")


def _call(prompt):
    """Tries LLM providers in order: HuggingFace (Open/Free) -> Gemini (Free) -> Relay."""
    errors = []

    # 1. Hugging Face (Primary Free Open-Source LLM)
    try:
        return _call_huggingface(prompt)
    except Exception as e:
        errors.append(f"HuggingFace: {e}")
        print(f"[LLM] Hugging Face failed or not configured ({e}). Trying Google Gemini...")

    # 2. Google Gemini (Free Tier)
    try:
        return _call_gemini(prompt)
    except Exception as e:
        errors.append(f"Gemini: {e}")
        print(f"[LLM] Google Gemini failed ({e}). Trying Relay...")

    # 3. Primary Relay / Claude
    try:
        return _call_relay(prompt)
    except Exception as e:
        errors.append(f"Relay: {e}")

    raise RuntimeError("All LLM providers failed: " + " | ".join(errors))


def generate_fallback_plan(book, custom_script=None):
    """High-energy 'Mirch Masala' fallback plan generator when all external APIs are unreachable.
    Guarantees that GitHub Actions workflow NEVER crashes!
    """
    title = book.get("title", "Life Wisdom").strip()
    author = book.get("author", "MindSpark").strip()

    if custom_script:
        first_line = custom_script.split("\n")[0].strip()
        topic = " ".join(first_line.split()[:5]).title()
    else:
        topic = title

    print(f"[LLM] Generating high-energy 'Mirch Masala' fallback plan for '{topic}'...")

    return {
        "book": {"title": title, "author": author},
        "youtube": {
            "title": f"{topic} Summary: Ye Kadwa Sach Aapko Koi Nahi Batayega! 🔥 #Shorts",
            "description": f"Discover the shocking reality and life-changing breakthrough from {title} by {author}.\n\n#mindspark #motivation #hindi #selfimprovement #shorts",
            "tags": ["mindspark", "book summary", "hindi", "shorts", "motivation", "success", "habits"]
        },
        "scenes": [
            {
                "type": "hook",
                "narration": f"99% log apni kismat ko gaali dete hain, lekin '{title}' ka ye kadwa sach aapke hosh uda dega!",
                "tts_text": f"९९% लोग अपनी किस्मत को गाली देते हैं, लेकिन '{title}' का ये कड़वा सच आपके होश उड़ा देगा!",
                "data": {
                    "title": "KADWA SACH",
                    "sub": f"{title}, {author}",
                    "visual": {"items": [{"icon": "brain", "label": "कड़वा सच"}]}
                }
            },
            {
                "type": "beforeAfter",
                "narration": "Zyadatar log bina planning ke pagal ki tarah mehnat karte hain, jabki asli game daily systems ka hai.",
                "tts_text": "ज़्यादातर लोग बिना प्लानिंग के पागल की तरह मेहनत करते हैं, जबकि असली गेम डेली सिस्टम्स का है!",
                "data": {
                    "before": "Bina system ke mehnat",
                    "after": "Smart daily protocol",
                    "visual": {"items": [{"icon": "target", "label": "माइंडसेट"}]}
                }
            },
            {
                "type": "dial",
                "narration": "Apne goals ke peeche bhaagna band karo aur apni identity badlo. Roz sirf 1% behtar bano.",
                "tts_text": "अपने गोल्स के पीछे भागना बंद करो और अपनी पहचान बदलो। रोज़ सिर्फ १% बेहतर बनो!",
                "data": {
                    "center": "PILLARS",
                    "items": ["Identity Shift", "1% Daily Habit", "Focus Rule"],
                    "visual": {"items": [{"icon": "chartUp", "label": "ग्रोथ"}]}
                }
            },
            {
                "type": "timeline",
                "narration": "Buri aadaton ke triggers ko khatam karo aur ache kaamon ko itna aasan bana do ki aap chahkar bhi rok na pao.",
                "tts_text": "बुरी आदतों के ट्रिगर्स को खत्म करो और अच्छे कामों को इतना आसान बना दो कि आप चाहकर भी रोक ना पाओ!",
                "data": {
                    "milestones": ["Trigger Spotting", "Friction Removal", "Reward Loop"],
                    "visual": {"items": [{"icon": "rocket", "label": "एक्शन"}]}
                }
            },
            {
                "type": "quote",
                "narration": f"Aap apne goals ke level tak nahi pahunchte, aap apne systems ke level par girte hain. Aise aur powerful lessons ke liye MindSpark ko subscribe karein!",
                "tts_text": f"आप अपने गोल्स के लेवल तक नहीं पहुँचते, आप अपने सिस्टम्स के लेवल पर गिरते हैं! ऐसे और पावरफुल लेसन्स के लिए माइंडस्पार्क को सब्सक्राइब करें!",
                "data": {
                    "quote": "Small disciplines repeated with consistency lead to great achievements.",
                    "by": author
                }
            }
        ]
    }


def get_style():
    cfg = jload(ROOT / "config" / "style.json", {})
    st = str(cfg.get("animation_style", "story")).lower()
    return st if st in STYLES else "story"


def normalize(p):
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
        elif stype == "card":
            if not d.get("lines") or not isinstance(d.get("lines"), list):
                d["lines"] = ["Focus on high leverage work", "Eliminate distractions", "Protect deep work time"]
        elif stype == "dial":
            if not d.get("center"): d["center"] = "CORE"
            if not d.get("items") or not isinstance(d.get("items"), list):
                d["items"] = ["Clarity", "Execution", "Review"]
        elif stype == "timeline":
            if not d.get("milestones") or not isinstance(d.get("milestones"), list):
                d["milestones"] = ["Trigger", "Routine", "Reward"]
        elif stype == "countdown":
            if not d.get("rank"): d["rank"] = f"0{idx+1}"
            if not d.get("title"): d["title"] = "KEY TAKEAWAY"
            if not d.get("sub"): d["sub"] = "Crucial insight for momentum"
        elif stype == "chalkboard":
            if not d.get("title"): d["title"] = "RULE"
            if not d.get("items") or not isinstance(d.get("items"), list):
                d["items"] = ["Point 1", "Point 2", "Point 3"]
        elif stype == "paper":
            if not d.get("title"): d["title"] = "PRINCIPLE"
            if not d.get("points") or not isinstance(d.get("points"), list):
                d["points"] = ["Point A", "Point B", "Point C"]
        elif stype == "stickyNotes":
            if not d.get("notes") or not isinstance(d.get("notes"), list):
                d["notes"] = [{"text": "Ship daily"}, {"text": "Learn fast"}]
        elif stype == "comicPanels":
            if not d.get("panels") or not isinstance(d.get("panels"), list):
                d["panels"] = [{"title": "Challenge", "caption": "Facing friction"}, {"title": "Victory", "caption": "Breakthrough moment"}]
        elif stype == "terminal":
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

        if stype == "hook" and "title" in d:
            words = str(d["title"]).split()
            if len(words) > 4:
                d["title"] = " ".join(words[:4])
        for list_key in ("lines", "points", "items", "habits", "milestones"):
            if list_key in d and isinstance(d[list_key], list):
                d[list_key] = [" ".join(str(item).split()[:8]) for item in d[list_key][:4]]

    # Vox visuals
    for sc_ in scenes:
        if not isinstance(sc_, dict) or not isinstance(sc_.get("data"), dict):
            continue
        d_ = sc_["data"]
        v_ = d_.get("visual")
        if v_ is None:
            continue
        items_ = []
        if isinstance(v_, dict) and isinstance(v_.get("items"), list):
            for it in v_["items"][:4]:
                if not isinstance(it, dict):
                    continue
                ic = str(it.get("icon", ""))
                if ic not in VOX_ICONS and not ic.startswith("map:"):
                    ic = "bulb"
                items_.append({"icon": ic, "label": " ".join(str(it.get("label", "")).split()[:3])})
        if items_:
            d_["visual"] = {"items": items_}
            if isinstance(v_, dict) and v_.get("country"):
                d_["visual"]["country"] = str(v_["country"])
        else:
            d_.pop("visual", None)

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

    if not style_mode and template and isinstance(template, dict):
        recipe = template.get("scene_recipe", [])
        recipe_types = set(recipe)
        present_types = set(s.get("type") for s in sc)
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
'---' + str(custom_script) + '---'
Convert this custom user script into a HIGH-ENERGY, DRAMATIC 25-35 second vertical 9:16 viral Shorts plan with 5 scenes."""
            hook_start_req = "First scene narration MUST start with a shocking pattern-interrupt question or bold controversy (NO greetings like 'Namaste dosto')."
        else:
            topic_desc = f"""Book: {book['title']} by {book.get('author', 'Author')}.
Make a viral, intense 25-35 second vertical 9:16 Shorts plan about its 3-4 most mind-blowing lessons."""
            hook_start_req = f"First scene narration MUST be an explosive hook that mentions '{book['title']}' within the first 10 words (e.g. '99% log fail hote hain kyunki {book['title']} ka ye kadwa sach unhe pata nahi...' - NO boring academic greetings like 'Namaste dosto')."

        prompt = f"""{topic_desc}
Return JSON: {{"scenes":[{{"type":..., "narration":..., "tts_text":..., "data":{{...}}}}], "youtube":{{"title":..., "description":..., "tags":[...]}}}}

MIRCH MASALA VIRAL GUIDELINES:
1. Generate exactly 5 scenes.
2. High emotion, tension, curiosity, dramatic contrast, and punchy Hinglish words.
3. First scene MUST be 'hook' (title <= 4 words in ALL CAPS, e.g. "KADWA SACH", "99% LOG FAIL").
4. Last scene MUST be 'quote' or 'card'.
5. Middle scenes MUST be chosen ONLY from: card, dial, timeline, beforeAfter, habitTracker, chalkboard, paper, countdown, quote.
6. NEVER use story, character, animeParallax, motionComic, or curve.
7. Keep titles SHORT (hook title <= 4 words, each line item <= 8 words, max 3-4 lines).
8. DUAL-SCRIPT SYSTEM:
   - 'narration': Casual, punchy Hinglish (Roman English letters, 12-22 words) for ON-SCREEN visual subtitles.
   - 'tts_text': Pure expressive Devanagari Hindi text with exclamation and pauses for the voice audio.
9. BRANDING MANDATES:
   - {hook_start_req}
   - Last scene narration MUST conclude with the channel name 'MindSpark' (e.g. '...aise aur life-changing insights ke liye MindSpark ko subscribe karein!').

10. VOX VISUALS (har scene ke data me 'visual' do): {{"items":[{{"icon":"<icon>","label":"<1-3 shabd, Devanagari me>"}}], "country":"<English country name, sirf jab koi desh central ho>"}}.
    - Allowed icons ONLY: {", ".join(VOX_ICONS)}.
    - quote scene me visual mat do. Label hamesha chhota (<= 3 words).

Available Scene types:
- hook: {{"title":"MAX 4 WORDS CAPS", "sub":"{book['title']}, {book.get('author', 'Author')}"}}
- card: {{"lines":["takeaway 1 (<= 8 words)", "takeaway 2", "takeaway 3"]}}
- dial: {{"center":"PILLARS", "items":["pillar 1", "pillar 2", "pillar 3"]}}
- timeline: {{"milestones":["Step 1", "Step 2", "Step 3"]}}
- beforeAfter: {{"before":"old way trap", "after":"breakthrough shift"}}
- habitTracker: {{"streak":"30 DAY PROTOCOL", "habits":["habit 1", "habit 2", "habit 3"]}}
- chalkboard: {{"title":"RULE", "items":["point 1", "point 2", "point 3"]}}
- paper: {{"title":"CORE PRINCIPLE", "points":["point 1", "point 2", "point 3"]}}
- countdown: {{"rank":"01", "title":"LESSON", "sub":"explanation"}}
- quote: {{"quote":"short punchy quote", "by":"{book.get('author', 'Author')}"}}

Avoid these recent scene sequences: {json.dumps(recent_sequences or [])}.
youtube.title under 70 chars with emoji, description 2 short lines + hashtags."""
    else:
        template_info = ""
        if template and isinstance(template, dict):
            template_info = f"ACTIVE TEMPLATE: {template.get('name')} ({template.get('id')})"
        prompt = f"""Book: {book['title']} by {book.get('author', 'Author')}.
{template_info}
Return JSON: {{"scenes":[{{"type":..., "narration":..., "tts_text":..., "data":{{...}}}}], "youtube":{{"title":..., "description":..., "tags":[...]}}}}
Rules: 5 scenes. High energy viral Hinglish. First scene = hook. Last scene = quote or card."""

    err = None
    for attempt in range(3):
        try:
            txt = _call(prompt + (f"\nYour previous answer was invalid: {err}. Fix it." if err else ""))
            plan = json.loads(txt[txt.index("{"): txt.rindex("}") + 1])
            plan = normalize(plan)

            if plan.get("scenes"):
                first_s = plan["scenes"][0]
                last_s = plan["scenes"][-1]
                b_title = book.get("title", "").replace(",", "").strip()
                f_narr = first_s.get("narration", "").strip()
                f_narr = re.sub(r'^(?:namaste\s*(?:dosto)?[\s!,.]*|kitab\s+|dosto[\s!,.]*)+', '', f_narr, flags=re.IGNORECASE).strip()
                if b_title.lower() not in f_narr.lower():
                    first_s["narration"] = f"{b_title} ka kadwa sach: " + f_narr
                else:
                    first_s["narration"] = f_narr

                l_narr = last_s.get("narration", "")
                if "mindspark" not in l_narr.lower():
                    last_s["narration"] = l_narr.rstrip(".! ") + ". Aur aisi mind-blowing insights ke liye MindSpark ko subscribe karein!"

                for sc in plan["scenes"]:
                    if not sc.get("tts_text"):
                        sc["tts_text"] = sc["narration"]

            err = validate(plan, template=template, style=style, style_mode=style_mode)
            if not err:
                return plan
        except Exception as e:
            err = f"API or JSON parse failed: {e}"
            print(f"[LLM] Attempt {attempt+1} failed: {err}")

    # If all attempts failed, use the authentic High-Energy Fallback Plan Generator
    print(f"[LLM] All live attempts failed ({err}). Falling back to built-in 'Mirch Masala' Plan Generator!")
    fallback_plan = generate_fallback_plan(book, custom_script=custom_script)
    return normalize(fallback_plan)
