"""Asks Claude (claude-sonnet-5 via your relay) for a VIDEO PLAN as JSON.
Supports 22 templates with recipe matching, deep normalization, and 9:16 vertical enforcement.
"""
import os, sys, json, requests, re, random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(ROOT / "src") not in sys.path:
    sys.path.insert(0, str(ROOT / "src"))

from common import ROOT, jload

HINDI_STORYTELLER_SYSTEM = """Tum ek anubhavi Hindi kahani-kaar ho, jo YouTube Shorts aur voiceover ke liye kahaniyan likhte ho. Tumhara kaam aisi kahani likhna hai jise sunkar lage ki koi insaan, aankhon dekha haal ya dil ki baat, sunaa raha hai. AI ki likhi hui nahi.

## Bhaasha
- Script hamesha Devanagari me likho. Roman ya English akshar sirf tab, jab koi naam ya shabd zaroori ho.
- Roz-marra ki bolchaal ki Hindi use karo, jaisi ek kahani sunane wala bolta hai. Bhaari, kitaabi ya shuddh-Sanskrit shabd mat daalo ("tatpashchat", "athaa", "atyant" jaise).
- Chhote vaakya rakho. Ek vaakya me ek hi baat. Beech-beech me bahut chhote vaakya bhi daalo. Jaise: "Wo ruk gaya. Kuch bola nahi."
- Vaakyon ki lambai badalte raho. Sab barabar lambe ya sab barabar chhote nahi.

## Wo cheezein jo AI jaisi lagti hain, inse bacho
- "Aaj ke is video me", "toh doston", "chaliye shuru karte hain" jaisi bhumika ya generic opening nahi. Seedha kahani ke beech se shuru karo, kisi chhoti ghatna ya ek line se.
- Ye shabd aur dhaancha nahi: "ek anokha safar", "zindagi ka sabak", "yaad rakhiye", "aakhir me", "sach me", "dil ko chhu lene wali", "kya aap jaante hain".
- Har baar teen cheezon ki list ("pehla, doosra, teesra") mat banao.
- Har kahani ke ant me moral ya nasihat mat daalo. Kabhi-kabhi ek adhoora-sa, sochne wala ant chhodo.
- Bahut zyada sajawat wale vishesan mat daalo. Ek sahi, thos shabd teen sundar shabdon se behtar hai.
- Har paragraph ko ek saaf-suthra nateeje par khatam mat karo.
- Emoji, hashtag, bullet points, headings script ke andar nahi.

## Insaani ehsaas
- Ek hi kirdaar ya ek hi nazariye se kahani sunao. Uski sochi hui baat, uska darr, uski jhijhak dikhao.
- Thos, chhoti detail daalo: koi awaaz, koi cheez, koi mausam. Jaise "chai thandi ho chuki thi", "darwaze ki kundi ghis chuki thi".
- Kirdaar ko poori tarah achha ya poori tarah bura mat banao. Thodi kamzori rakho.
- Dialogue chhote aur asli bolchaal jaise rakho. Log poore vaakya me nahi bolte.
- Bhaavna ko naam mat do ("use bahut dukh hua"). Use dikhao (kya kiya, kaise ruka).

## Voiceover ke liye
- Pauses ke liye `,` `।` aur `...` ka sahi use karo. Lambe vaakya me kam se kam ek comma rakho.
- Sankhya, tarikh aur short-forms ko shabdon me likho, taaki TTS sahi bole.
- Aise shabd mat likho jinka uchcharan TTS ko mushkil ho.
- Har scene/hissa 2-4 vaakya ka rakho.

## Tone
- Gripping, mysterious, grounded, deeply human Indian storytelling.

## Output
- Output must be valid JSON object matching the requested schema. No conversational intro, no extra explanations outside JSON.
"""

SYSTEM = HINDI_STORYTELLER_SYSTEM

TYPES = {
    "hook", "curve", "dial", "card", "quote", "story", "character", "animeParallax", "motionComic",
    "quiz", "kineticBurst", "paper", "terminal", "stickyNotes", "comicPanels", "chalkboard",
    "timeline", "countdown", "beforeAfter", "quotePoster", "habitTracker", "cyberGlitch",
    "paperCut", "gradientFlow"
}

# Vox SVG icon keys: remotion/src/vox/icons.tsx + icons2.tsx + icons3.tsx (isi order me) ke barabar (tests/test_vox_icons.py check karta hai)
VOX_ICONS = [
    "coins",
    "money",
    "bag",
    "chartUp",
    "chartDown",
    "pie",
    "brain",
    "bulb",
    "book",
    "clock",
    "hourglass",
    "person",
    "people",
    "building",
    "house",
    "phone",
    "laptop",
    "heart",
    "target",
    "rocket",
    "lock",
    "trophy",
    "gear",
    "shield",
    "fire",
    "plant",
    "sun",
    "calendar",
    "megaphone",
    "magnifier",
    "scale",
    "steps",
    "check",
    "cross",
    "question",
    "arrow",
    "globe",
    "chat",
    "dumbbell",
    "coffee",
    "key",
    "battery",
    "mountain",
    "moon",
    "bars",
    "lotus",
    "column",
    "diamond",
    "crown",
    "car",
    "eye",
    "mask",
    "chess",
    "puzzle",
    "handshake",
    "face",
    "ghost",
    "skull",
    "fingerprint",
    "handcuffs",
    "siren",
    "film",
    "scroll",
    "pyramid",
    "castle",
    "temple",
    "swords",
    "compass",
    "planet",
    "star",
    "telescope",
    "atom",
    "dna",
    "flask",
    "microscope",
    "lightning",
    "leaf",
    "fish",
    "plane",
    "suitcase",
    "tent",
    "palm",
    "wave",
    "camera",
    "ship",
    "meditate",
    "apple",
    "shoe",
    "drop",
    "bed",
    "heartbeat",
    "stopwatch",
    "burger",
    "pizza",
    "chefhat",
    "pot",
    "cake",
    "icecream",
    "chilli",
    "bowl",
    "paw",
    "dog",
    "cat",
    "bird",
    "lion",
    "elephant",
    "turtle",
    "butterfly",
    "cricket",
    "football",
    "gamepad",
    "medal",
    "glove",
    "abc",
    "pencil",
    "gradcap",
    "briefcase",
    "document",
    "palette",
    "brush",
    "cube",
    "pen",
    "sofa",
    "scissors",
    "hanger",
    "sparkle",
]

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

def _call_gemini(prompt, max_tokens=3500):
    raw_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY_2", "")
    key = str(raw_key).strip().strip('"').strip("'")
    if not key:
        raise ValueError("GEMINI_API_KEY is not set.")
    
    models = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-2.0-flash-lite",
    ]
    headers = {"Content-Type": "application/json"}
    
    last_err = None
    for m in models:
        for ver in ["v1beta", "v1"]:
            url = f"https://generativelanguage.googleapis.com/{ver}/models/{m}:generateContent?key={key}"
            body = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": f"{SYSTEM}\n\n{prompt}"}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": max_tokens,
                    "responseMimeType": "application/json"
                }
            }
            try:
                r = requests.post(url, headers=headers, json=body, timeout=60)
                if r.status_code == 200:
                    data = r.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            txt = parts[0]["text"]
                            print(f"[LLM] Generated plan via Gemini '{m}' ({ver})!")
                            return txt
                else:
                    err_msg = f"{m} ({ver}) HTTP {r.status_code}: {r.text[:200]}"
                    last_err = err_msg
            except Exception as e:
                last_err = str(e)
                
    raise RuntimeError(f"Gemini API failed: {last_err}")


def _call_groq(prompt, max_tokens=2000):
    key = os.environ.get("GROQ_API_KEY", "").strip()
    if not key:
        raise RuntimeError("GROQ_API_KEY not configured in environment")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    models = ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]
    last_err = None
    for m in models:
        try:
            body = {
                "model": m,
                "messages": [
                    {"role": "system", "content": SYSTEM},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7,
                "max_tokens": max_tokens,
                "response_format": {"type": "json_object"}
            }
            r = requests.post(url, headers=headers, json=body, timeout=45)
            if r.status_code == 200:
                data = r.json()
                print(f"[LLM] Generated plan via Groq ({m})!")
                return data["choices"][0]["message"]["content"]
            else:
                last_err = f"{m} HTTP {r.status_code}: {r.text[:150]}"
        except Exception as e:
            last_err = str(e)
            continue
    raise RuntimeError(f"All Groq models failed: {last_err}")


def _call_openai_relay(prompt, max_tokens=2000):
    key = os.environ.get("LLM_API_KEY") or os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not key:
        raise ValueError("LLM_API_KEY is not set.")
    base = os.environ.get("LLM_BASE_URL", "https://api.llmsrelay.com/v1").rstrip("/")
    model = os.environ.get("LLM_MODEL", "gpt-4o-mini")
    url = f"{base}/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "max_tokens": max_tokens
    }
    r = requests.post(url, headers=headers, json=body, timeout=60)
    if r.status_code == 200:
        data = r.json()
        print(f"[LLM] Generated plan via LLM relay ({model})!")
        return data["choices"][0]["message"]["content"]
    raise RuntimeError(f"LLM relay HTTP {r.status_code}: {r.text[:150]}")


def _call(prompt, max_tokens=None):
    """Multi-tier LLM engine: Gemini -> Groq -> OpenAI/Relay."""
    errors = []
    kw = {"max_tokens": max_tokens} if max_tokens else {}
    # 1. Google Gemini (if key configured)
    if os.environ.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY_2"):
        try:
            return _call_gemini(prompt, **kw)
        except Exception as e:
            errors.append(f"Gemini: {e}")

    # 2. Groq (Always available with high speed)
    try:
        return _call_groq(prompt, **kw)
    except Exception as e:
        errors.append(f"Groq: {e}")

    # 3. LLM Relay / OpenAI (Backup)
    if os.environ.get("LLM_API_KEY") or os.environ.get("ANTHROPIC_API_KEY"):
        try:
            return _call_openai_relay(prompt, **kw)
        except Exception as e:
            errors.append(f"Relay: {e}")

    raise RuntimeError("All LLMs failed: " + " | ".join(errors))


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
            
    # Script clean-up: narration me <tags> nahi (captions), delivery chhota safe text
    for sc_ in scenes:
        if not isinstance(sc_, dict):
            continue
        if isinstance(sc_.get("narration"), str):
            sc_["narration"] = " ".join(re.sub(r"<[^>]*>", " ", sc_["narration"]).split())
        dl_ = sc_.get("delivery")
        if isinstance(dl_, str) and dl_.strip():
            sc_["delivery"] = re.sub(r"[<>\[\]{}]", "", dl_).strip()[:80]
        else:
            sc_.pop("delivery", None)

    # Vox visuals: invalid icons / lambe labels saaf karo
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
                if ic not in VOX_ICONS and not ic.startswith("map:") and not ic.startswith("char:"):
                    ic = "bulb"
                items_.append({"icon": ic, "label": " ".join(str(it.get("label", "")).split()[:3])})
        if items_:
            d_["visual"] = {"items": items_}
            if isinstance(v_, dict) and v_.get("country"):
                d_["visual"]["country"] = str(v_["country"])
        else:
            d_.pop("visual", None)

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
Return JSON: {{"scenes":[{{"type":..., "narration":..., "tts_text":..., "delivery":..., "data":{{...}}}}], "youtube":{{"title":..., "description":..., "tags":[...]}}}}

STYLE MODE REQUIREMENTS:
1. Generate exactly 5 or 6 scenes.
2. First scene MUST be 'hook' (title <= 4 words in ALL CAPS).
3. Last scene MUST be 'quote' or 'card'.
4. Middle scenes MUST be chosen ONLY from: card, dial, timeline, beforeAfter, habitTracker, chalkboard, paper, countdown, quote.
5. NEVER use story, character, animeParallax, motionComic, or curve.
6. Keep titles SHORT (hook title <= 4 words, each line item <= 8 words, max 3-4 lines).
7. At least 3 different scene types.
8. DEVANAGARI HINDI LYRICS & AUDIO (100% WORD-FOR-WORD MATCH):
   - 'narration': Shuddh Devanagari Hindi (12-20 shabd). Screen par yahi Hindi lyrics/subtitles ke roop me dikhega!
   - 'tts_text': Bilkul wahi EXACT Hindi text jo narration me hai! Dono 100% same hone chahiye, koi farak nahi!
     Example:
     Narration: "5000 सैनिक और सामने 1 लाख की फ़ौज! राजा हारने वाला था, तभी याद आई श्रीकृष्ण की गुप्त नीति।"
     TTS_Text: "5000 सैनिक और सामने 1 लाख की फ़ौज! राजा हारने वाला था, तभी याद आई श्रीकृष्ण की गुप्त नीति।"
   - 'delivery': 2-5 English words, is scene ko kaise bolna hai. e.g. "curious, leaning in", "warm and reassuring", "slow and reflective", "energetic, upbeat".
   tts_text rules:
   * Chhote vaakya (5-10 shabd). Ek chhota vaakya, phir thoda lamba. Kabhi ek lamba vaakya nahi.
   * Ek dost se baat karo: "तुम"/"आप", sawal ("पता है क्यों?"), chhote jodne wale shabd ("देखो", "सुनो", "और हाँ", "तो").
   * Jahan insaan ruk-ke saans leta hai wahan tag lagao: <short pause>, <breath>; bade reveal se pehle <long pause>. Har scene me max 3 tags, har vaakya me max 1.
   * Rozmarra ke Hindi shabd, bhaari/kitabi shabd nahi. Angrezi shabd jo log bolte hain (mindset, habit) Devanagari me likh sakte ho.
   * Numbers/symbols shabdon me likho (एक प्रतिशत, 1% nahi).
   * Hook scene: chauka dene wali line ya sawal se shuru. Last scene: garam, ek saaf call-to-action.
9. BRANDING MANDATES:
   - {hook_start_req}
   - Last scene narration MUST conclude with the channel name "MindSpark" (e.g. "...aise aur powerful insights ke liye MindSpark ko subscribe karein!").

10. VOX VISUALS (har scene ke data me "visual" do): {{"items":[{{"icon":"<icon>","label":"<1-3 shabd, Devanagari me>"}}], "country":"<English country name, sirf jab koi desh central ho>"}}.
   - 1 item = ek bada illustration, 2 items = compare (jaise desh ka map + paisa), 3 items = list.
   - Agar koi desh central hai to pehla item icon "map:<English country name>" rakho (e.g. "map:India", "map:China"), label us desh ka Hindi naam.
   - Allowed icons ONLY: {", ".join(VOX_ICONS)}.
   - quote scene me "visual" mat do. Label hamesha chhota (<= 3 words).

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
Return JSON: {{"scenes":[{{"type":..., "narration":..., "tts_text":..., "delivery":..., "data":{{...}}}}], "youtube":{{"title":..., "description":..., "tags":[...]}}}}
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
DEVANAGARI HINDI LYRICS & AUDIO (100% MANDATORY DEVANAGARI):
   - 'narration': Shuddh Devanagari Hindi (12-20 shabd). Screen par yahi Hindi lyrics/subtitles ke roop me dikhega! Koi bhi Roman/English alphabet nahi hona chahiye.
   - 'tts_text': Bilkul wahi EXACT Shuddh Devanagari Hindi text jo narration me hai! Dono 100% same Devanagari me hone chahiye, koi farak nahi!
   - 'delivery': 2-5 English words, is scene ko kaise bolna hai. e.g. "curious, leaning in", "warm and reassuring", "slow and reflective", "energetic, upbeat".
   tts_text rules:
   * Chhote vaakya (5-10 shabd). Ek chhota vaakya, phir thoda lamba. Kabhi ek lamba vaakya nahi.
   * Ek dost se baat karo: "तुम"/"आप", sawal ("पता है क्यों?"), chhote jodne wale shabd ("देखो", "सुनो", "और हाँ", "तो").
   * Jahan insaan ruk-ke saans leta hai wahan tag lagao: <short pause>, <breath>; bade reveal se pehle <long pause>. Har scene me max 3 tags, har vaakya me max 1.
   * Rozmarra ke Hindi shabd, bhaari/kitabi shabd nahi. Angrezi shabd jo log bolte hain (mindset, habit) Devanagari me likh sakte ho.
   * Numbers/symbols shabdon me likho (एक प्रतिशत, 1% nahi).
   * Hook scene: chauka dene wali line ya sawal se shuru. Last scene: garam, ek saaf call-to-action.
BRANDING MANDATES:
- First scene narration MUST start directly with "{book['title']} हमें सिखाती है..." (NO greetings like 'Namaste dosto', NO 'Kitab' prefix, start directly with the book title).
- Last scene narration MUST conclude with the channel name "MindSpark" (e.g. "...ऐसे और शक्तिशाली विचारों के लिए MindSpark को सब्सक्राइब करें!").
Avoid these recent scene sequences: {json.dumps(recent_sequences or [])}.
youtube.title under 70 chars, description 2 short lines + hashtags."""

    err = None
    for attempt in range(3):
        try:
            txt = _call(prompt + (f"\nYour previous answer was invalid: {err}. Fix it." if err else ""))
            raw = txt.strip()
            if "{" in raw and "}" in raw:
                raw = raw[raw.index("{"): raw.rindex("}") + 1]
            plan = json.loads(raw)
            plan = normalize(plan)

            # Programmatically guarantee book name at start and MindSpark at end
            if plan.get("scenes"):
                first_s = plan["scenes"][0]
                last_s = plan["scenes"][-1]
                b_title = book.get("title", "").replace(",", "").strip()
                f_narr = first_s.get("narration", "").strip()
                # Strip out any greetings like "Namaste dosto", "Kitab", etc.
                f_narr = re.sub(r'^(?:namaste\s*(?:dosto)?[\s!,.]*|kitab\s+|dosto[\s!,.]*)+', '', f_narr, flags=re.IGNORECASE).strip()
                first_s["narration"] = f_narr

                l_narr = last_s.get("narration", "")
                if "mindspark" not in l_narr.lower() and "माइंडस्पार्क" not in l_narr:
                    last_s["narration"] = l_narr.rstrip(".! ") + ". ऐसे और शक्तिशाली विचारों के लिए MindSpark को सब्सक्राइब करें!"

                # Ensure tts_text exists on each scene
                for sc in plan["scenes"]:
                    if not sc.get("tts_text"):
                        sc["tts_text"] = sc["narration"]

            err = validate(plan, template=template, style=style, style_mode=style_mode)
            if not err:
                return plan
        except Exception as e:
            err = f"{e}"
            print(f"[LLM] Plan generation attempt {attempt + 1}/3 failed: {err}")
    print(f"[LLM] Live plan failed ({err}). Generating built-in 'Mirch Masala' plan...")
    fallback_p = generate_fallback_plan(book, custom_script=custom_script)
    return normalize(fallback_p)

STYLE_RULE = {
    "mix": "include at least 1 story scene AND at least 1 character scene.",
    "story": "include at least 2 story scenes and NO character scene.",
    "character": "include at least 2 character scenes and NO story scene.",
    "classic": "do NOT use story or character scenes.",
    "anime": "include at least 1 animeParallax or motionComic scene.",
}


def generate_fallback_plan(book, custom_script=None):
    b_title = book.get("title", "सनातन ज्ञान और कर्म की शक्ति")
    clean_title = re.sub(r'[:|/\\]+', ' ', b_title).strip()
    return {
        "youtube": {
            "title": f"{clean_title} | सनातन का अनसुना रहस्य 🔱",
            "description": f"{clean_title} - सनातन धर्म, वेदों और कर्म की वो दिव्य शक्ति जो आपका जीवन बदल देगी। #Shorts #Sanatan #MindSpark #Karma",
            "tags": ["MindSpark", "Sanatan", "Karma", "Wisdom", "Shorts", "Mahabharat"]
        },
        "scenes": [
            {
                "type": "hook",
                "narration": f"क्या आपको पता है {clean_title} के पीछे छिपा सबसे बड़ा रहस्य क्या है?",
                "tts_text": f"क्या आपको पता है {clean_title} के पीछे छिपा सबसे बड़ा रहस्य क्या है?",
                "delivery": "suspenseful, urgent",
                "data": {
                    "title": clean_title[:20].upper(),
                    "sub": "Sanatan Secret",
                    "visual": {"items": [{"icon": "char:krishna", "label": "दिव्य ज्ञान"}, {"icon": "crown", "label": "सनातन सत्य"}]}
                }
            },
            {
                "type": "card",
                "narration": "संसार में हर कर्म का फल निश्चित है। जो धैर्य और सत्य के साथ चलता है, विजय उसी की होती है।",
                "tts_text": "संसार में हर कर्म का फल निश्चित है। जो धैर्य और सत्य के साथ चलता है, विजय उसी की होती है।",
                "delivery": "thoughtful, deep",
                "data": {
                    "lines": ["Satya par dridh raho", "Dhairya hi sabse bada bal hai", "Karm ka niyam atal hai"],
                    "visual": {"items": [{"icon": "om", "label": "सत्य"}, {"icon": "shield", "label": "धैर्य"}]}
                }
            },
            {
                "type": "paper",
                "narration": "कठिन से कठिन परिस्थिति में भी यदि आपका मन शांत है, तो कोई शक्ति आपको पराजित नहीं कर सकती।",
                "tts_text": "कठिन से कठिन परिस्थिति में भी यदि आपका मन शांत है, तो कोई शक्ति आपको पराजित नहीं कर सकती।",
                "delivery": "wisdom, calm",
                "data": {
                    "title": "SHANT MAN KA BAL",
                    "points": ["Man ki shanti", "Sahi nirnay", "Aparajit sankalp"],
                    "visual": {"items": [{"icon": "char:guru", "label": "ऋषि ज्ञान"}, {"icon": "fire", "label": "आत्मबल"}]}
                }
            },
            {
                "type": "beforeAfter",
                "narration": "भय और संशय हार का कारण बनते हैं, जबकि ईश्वर पर विश्वास असंभव को भी संभव बना देता है!",
                "tts_text": "भय और संशय हार का कारण बनते हैं, जबकि ईश्वर पर विश्वास असंभव को भी संभव बना देता है!",
                "delivery": "shocking, powerful",
                "data": {
                    "before": "Bhay aur Sanshay",
                    "after": "Ishwar Par Vishwas",
                    "visual": {"items": [{"icon": "target", "label": "लक्ष्य"}, {"icon": "trophy", "label": "महाविजय"}]}
                }
            },
            {
                "type": "quote",
                "narration": "सत्य और धर्म की राह पर चलने वालों का मार्गदर्शन स्वयं परमात्मा करते हैं। सब्सक्राइब करें MindSpark!",
                "tts_text": "सत्य और धर्म की राह पर चलने वालों का मार्गदर्शन स्वयं परमात्मा करते हैं। सब्सक्राइब करें MindSpark!",
                "delivery": "inspiring, devotional",
                "data": {
                    "quote": "Dharmo Rakshati Rakshitah",
                    "by": "Sanatan Satya"
                }
            }
        ]
    }


# ==============================================================================
# MINDSPARK MYTHOLOGY SHORTS ENGINE (MythShort)
# ==============================================================================

ROSTER_GODS = {
    "krishna", "guru", "rishi", "vyasa", "drona", "shishya", "arjuna", "karna", "raja", "chor", "soldier",
    "rama", "hanuman", "shiva", "vishnu", "brahma",
    "ganesha", "kartikeya", "indra", "surya", "vayu", "varuna",
    "durga", "lakshmi", "saraswati", "parvati", "kali", "narasimha",
    "ravana", "asura"
}
MYTH_BEATS = {"intro", "talk", "reveal", "fight", "victory"}
MYTH_BGS = {"forest", "pond", "temple", "battlefield", "sky", "palace"}
MYTH_POSES = {"stand", "sit", "fly", "fight", "walk", "pray", "point", "talk"}
MYTH_WEAPONS = {"none", "gada", "bow", "trishul", "chakra", "sword"}
MYTH_SHOTS = {"wide", "medium", "closeup", "extreme", "low", "high", "dutch", "side", "sideR", "over"}
MYTH_MOVES = {"still", "pushIn", "pullOut", "panL", "panR", "tiltUp", "craneDown", "orbit", "shake", "whip"}


def validate_myth_plan(plan):
    """Validator: reject unknown character ids, missing fields, or scenes under 2.5s."""
    if not isinstance(plan, dict):
        return "Plan must be a JSON object"
    scenes = plan.get("scenes")
    if not isinstance(scenes, list) or len(scenes) < 5 or len(scenes) > 14:
        return f"scenes must be a list of 5 to 14 scenes, got {len(scenes) if isinstance(scenes, list) else type(scenes)}"

    for idx, sc in enumerate(scenes):
        if not isinstance(sc, dict):
            return f"scene {idx} must be an object"
        sec = sc.get("sec")
        if not isinstance(sec, (int, float)) or sec < 2.5:
            return f"scene {idx}: sec must be >= 2.5 seconds, got {sec}"

        beat = sc.get("beat")
        if beat not in MYTH_BEATS:
            return f"scene {idx}: invalid beat '{beat}'. Allowed: {sorted(list(MYTH_BEATS))}"

        bg = sc.get("bg")
        if bg not in MYTH_BGS:
            return f"scene {idx}: invalid bg '{bg}'. Allowed: {sorted(list(MYTH_BGS))}"

        caption = sc.get("caption")
        if not isinstance(caption, dict) or not caption.get("title") or not caption.get("text"):
            return f"scene {idx}: caption must have 'title' and 'text'"

        narr = sc.get("narration")
        if not isinstance(narr, str) or not narr.strip():
            return f"scene {idx}: narration must be a non-empty Hindi string"

        actors = sc.get("actors")
        if not isinstance(actors, list) or len(actors) == 0:
            return f"scene {idx}: actors must be a non-empty list"

        for a_idx, act in enumerate(actors):
            if not isinstance(act, dict):
                return f"scene {idx} actor {a_idx} must be an object"
            who = str(act.get("who", "")).lower()
            if who not in ROSTER_GODS:
                return f"scene {idx} actor {a_idx}: unknown god '{who}'. Allowed: {sorted(list(ROSTER_GODS))}"
            act["who"] = who

            pose = act.get("pose", "stand")
            if pose not in MYTH_POSES:
                act["pose"] = "stand"

            x = act.get("x", 540)
            if not isinstance(x, (int, float)):
                act["x"] = 540
            else:
                act["x"] = max(200, min(880, int(x)))

            w = act.get("weapon")
            if w and w not in MYTH_WEAPONS:
                act["weapon"] = "none"

        cam = sc.get("camera")
        if isinstance(cam, dict):
            shot = cam.get("shot")
            move = cam.get("move")
            if shot and shot not in MYTH_SHOTS:
                cam.pop("shot", None)
            if move and move not in MYTH_MOVES:
                cam.pop("move", None)

    return None


def _detect_myth_actors_for_topic(title, summary=""):
    text = (str(title) + " " + str(summary)).lower()
    if any(k in text for k in ["एकलव्य", "द्रोण", "drona", "eklavya"]):
        return [
            [{"who": "drona", "pose": "stand", "x": 540}],
            [{"who": "shishya", "pose": "pray", "x": 330, "weapon": "bow"}, {"who": "drona", "pose": "stand", "x": 760, "flip": True}],
            [{"who": "shishya", "pose": "stand", "x": 540, "weapon": "bow"}],
            [{"who": "drona", "pose": "stand", "x": 350}, {"who": "shishya", "pose": "stand", "x": 760, "flip": True, "weapon": "bow"}],
            [{"who": "shishya", "pose": "pray", "x": 350}, {"who": "drona", "pose": "stand", "x": 760, "flip": True}],
            [{"who": "drona", "pose": "stand", "x": 540}]
        ]
    if any(k in text for k in ["कर्ण", "परशुराम", "karna", "parashurama"]):
        return [
            [{"who": "karna", "pose": "stand", "x": 540, "weapon": "bow"}],
            [{"who": "guru", "pose": "sit", "x": 350}, {"who": "karna", "pose": "pray", "x": 750, "flip": True}],
            [{"who": "karna", "pose": "sit", "x": 540}],
            [{"who": "guru", "pose": "stand", "x": 350}, {"who": "karna", "pose": "stand", "x": 750, "flip": True}],
            [{"who": "karna", "pose": "fight", "x": 340, "weapon": "bow"}, {"who": "soldier", "pose": "fight", "x": 760, "flip": True, "weapon": "sword"}],
            [{"who": "karna", "pose": "stand", "x": 540, "weapon": "bow"}]
        ]
    if any(k in text for k in ["बलि", "वामन", "bali", "vamana"]):
        return [
            [{"who": "raja", "pose": "stand", "x": 540}],
            [{"who": "raja", "pose": "pray", "x": 330}, {"who": "vishnu", "pose": "stand", "x": 760, "flip": True, "weapon": "chakra"}],
            [{"who": "vishnu", "pose": "stand", "x": 540, "weapon": "chakra"}],
            [{"who": "raja", "pose": "pray", "x": 350}, {"who": "vishnu", "pose": "stand", "x": 750, "flip": True}],
            [{"who": "raja", "pose": "pray", "x": 540}],
            [{"who": "vishnu", "pose": "stand", "x": 540}]
        ]
    if any(k in text for k in ["भस्मासुर", "मोहिनी", "bhasmasura", "mohini"]):
        return [
            [{"who": "asura", "pose": "stand", "x": 540, "weapon": "gada"}],
            [{"who": "shiva", "pose": "sit", "x": 330, "weapon": "trishul"}, {"who": "asura", "pose": "pray", "x": 760, "flip": True}],
            [{"who": "asura", "pose": "fight", "x": 350, "weapon": "gada"}, {"who": "vishnu", "pose": "stand", "x": 750, "flip": True}],
            [{"who": "vishnu", "pose": "stand", "x": 350}, {"who": "asura", "pose": "fight", "x": 750, "flip": True}],
            [{"who": "asura", "pose": "fight", "x": 540}],
            [{"who": "shiva", "pose": "stand", "x": 540, "weapon": "trishul"}]
        ]
    if any(k in text for k in ["दधीचि", "वज्र", "dadhichi", "vritrasura"]):
        return [
            [{"who": "rishi", "pose": "sit", "x": 540}],
            [{"who": "rishi", "pose": "sit", "x": 330}, {"who": "indra", "pose": "pray", "x": 750, "flip": True, "weapon": "sword"}],
            [{"who": "rishi", "pose": "pray", "x": 540}],
            [{"who": "indra", "pose": "fight", "x": 340, "weapon": "sword"}, {"who": "asura", "pose": "fight", "x": 770, "flip": True, "weapon": "gada"}],
            [{"who": "indra", "pose": "stand", "x": 540, "weapon": "sword"}],
            [{"who": "rishi", "pose": "stand", "x": 540}]
        ]
    if any(k in text for k in ["वाल्मीकि", "रत्नाकर", "valmiki", "ratnakar"]):
        return [
            [{"who": "chor", "pose": "stand", "x": 540, "weapon": "sword"}],
            [{"who": "chor", "pose": "stand", "x": 330, "weapon": "sword"}, {"who": "rishi", "pose": "stand", "x": 760, "flip": True}],
            [{"who": "chor", "pose": "pray", "x": 540}],
            [{"who": "rishi", "pose": "sit", "x": 540}],
            [{"who": "rishi", "pose": "stand", "x": 540}],
            [{"who": "rishi", "pose": "stand", "x": 540}]
        ]
    if any(k in text for k in ["शबरी", "shabari", "बेर"]):
        return [
            [{"who": "rishi", "pose": "pray", "x": 540}],
            [{"who": "rishi", "pose": "pray", "x": 330}, {"who": "rama", "pose": "stand", "x": 750, "flip": True, "weapon": "bow"}],
            [{"who": "rama", "pose": "sit", "x": 540}],
            [{"who": "rishi", "pose": "pray", "x": 330}, {"who": "rama", "pose": "sit", "x": 750, "flip": True}],
            [{"who": "rama", "pose": "stand", "x": 540, "weapon": "bow"}],
            [{"who": "rama", "pose": "stand", "x": 540, "weapon": "bow"}]
        ]
    if any(k in text for k in ["प्रह्लाद", "होलिका", "नृसिंह", "prahlada", "narasimha"]):
        return [
            [{"who": "shishya", "pose": "pray", "x": 540}],
            [{"who": "asura", "pose": "stand", "x": 330, "weapon": "sword"}, {"who": "shishya", "pose": "pray", "x": 750, "flip": True}],
            [{"who": "narasimha", "pose": "stand", "x": 540}],
            [{"who": "narasimha", "pose": "fight", "x": 340}, {"who": "asura", "pose": "fight", "x": 760, "flip": True, "weapon": "sword"}],
            [{"who": "narasimha", "pose": "stand", "x": 540}],
            [{"who": "shishya", "pose": "pray", "x": 540}]
        ]
    if any(k in text for k in ["हनुमान", "hanuman", "बजरंग", "सुग्रीव", "वाली", "संजीवनी", "लंका"]):
        return [
            [{"who": "hanuman", "pose": "stand", "x": 540}],
            [{"who": "rama", "pose": "stand", "x": 350, "weapon": "bow"}, {"who": "hanuman", "pose": "pray", "x": 760, "flip": True}],
            [{"who": "hanuman", "pose": "fly", "x": 540, "weapon": "gada"}],
            [{"who": "hanuman", "pose": "fight", "x": 330, "weapon": "gada"}, {"who": "asura", "pose": "fight", "x": 780, "flip": True, "weapon": "sword"}],
            [{"who": "hanuman", "pose": "fly", "x": 540, "weapon": "gada"}],
            [{"who": "hanuman", "pose": "pray", "x": 700, "flip": True}, {"who": "rama", "pose": "stand", "x": 350, "weapon": "bow"}]
        ]
    if any(k in text for k in ["रावण", "ravana", "सीता", "लंका", "कुंभकर्ण"]):
        return [
            [{"who": "ravana", "pose": "stand", "x": 540, "weapon": "sword"}],
            [{"who": "rama", "pose": "stand", "x": 350, "weapon": "bow"}, {"who": "soldier", "pose": "stand", "x": 750, "flip": True, "weapon": "bow"}],
            [{"who": "ravana", "pose": "fight", "x": 540, "weapon": "sword"}],
            [{"who": "rama", "pose": "fight", "x": 320, "weapon": "bow"}, {"who": "ravana", "pose": "fight", "x": 780, "flip": True, "weapon": "sword"}],
            [{"who": "rama", "pose": "stand", "x": 540, "weapon": "bow"}],
            [{"who": "rama", "pose": "stand", "x": 540, "weapon": "bow"}]
        ]
    if any(k in text for k in ["शिव", "shiva", "महादेव", "भोले", "नंदी", "पार्वती", "नीलकंठ"]):
        return [
            [{"who": "shiva", "pose": "sit", "x": 540, "weapon": "trishul"}],
            [{"who": "rishi", "pose": "pray", "x": 330}, {"who": "shiva", "pose": "sit", "x": 750, "flip": True, "weapon": "trishul"}],
            [{"who": "shiva", "pose": "stand", "x": 540, "weapon": "trishul"}],
            [{"who": "shiva", "pose": "fight", "x": 330, "weapon": "trishul"}, {"who": "asura", "pose": "fight", "x": 780, "flip": True, "weapon": "sword"}],
            [{"who": "shiva", "pose": "sit", "x": 540, "weapon": "trishul"}],
            [{"who": "shiva", "pose": "stand", "x": 540, "weapon": "trishul"}]
        ]
    if any(k in text for k in ["द्रौपदी", "draupadi", "चीरहरण", "सभा", "हस्तिनापुर", "धृतराष्ट्र", "दुर्योधन", "दुःशासन", "अक्षय"]):
        return [
            [{"who": "raja", "pose": "sit", "x": 540}],
            [{"who": "durga", "pose": "pray", "x": 340}, {"who": "soldier", "pose": "stand", "x": 760, "flip": True, "weapon": "sword"}],
            [{"who": "krishna", "pose": "stand", "x": 540, "weapon": "chakra"}],
            [{"who": "krishna", "pose": "stand", "x": 340, "weapon": "chakra"}, {"who": "soldier", "pose": "fight", "x": 780, "flip": True, "weapon": "sword"}],
            [{"who": "durga", "pose": "pray", "x": 340}, {"who": "krishna", "pose": "stand", "x": 750, "flip": True}],
            [{"who": "krishna", "pose": "stand", "x": 540}]
        ]
    if any(k in text for k in ["अर्जुन", "arjuna", "गांडीव", "कुरुक्षेत्र", "गीता"]):
        return [
            [{"who": "arjuna", "pose": "stand", "x": 540, "weapon": "bow"}],
            [{"who": "arjuna", "pose": "pray", "x": 330, "weapon": "bow"}, {"who": "krishna", "pose": "stand", "x": 760, "flip": True}],
            [{"who": "krishna", "pose": "stand", "x": 540, "weapon": "chakra"}],
            [{"who": "arjuna", "pose": "fight", "x": 330, "weapon": "bow"}, {"who": "soldier", "pose": "fight", "x": 780, "flip": True, "weapon": "sword"}],
            [{"who": "krishna", "pose": "stand", "x": 750, "weapon": "chakra", "flip": True}, {"who": "arjuna", "pose": "stand", "x": 350, "weapon": "bow"}],
            [{"who": "krishna", "pose": "stand", "x": 540}]
        ]
    # Default to Krishna & divine wisdom
    return [
        [{"who": "krishna", "pose": "stand", "x": 540}],
        [{"who": "guru", "pose": "stand", "x": 330}, {"who": "shishya", "pose": "pray", "x": 760, "flip": True}],
        [{"who": "krishna", "pose": "sit", "x": 540}],
        [{"who": "krishna", "pose": "stand", "x": 350, "weapon": "chakra"}, {"who": "asura", "pose": "fight", "x": 780, "flip": True, "weapon": "sword"}],
        [{"who": "krishna", "pose": "stand", "x": 540}],
        [{"who": "krishna", "pose": "stand", "x": 540}]
    ]


# ==============================================================================
# Choreography: gives every scene its own entrances, poses and facing.
# (The camera is NOT set here any more -> the Remotion camera director picks it per video.)
# ==============================================================================
def choreograph_myth_plan(plan, seed=None):
    rnd = random.Random(seed)
    prev_who, prev_pose = set(), {}
    talk_poses = ["talk", "point", "stand", "pray"]
    for i, sc in enumerate(plan.get("scenes", [])):
        # an LLM / fallback camera used to freeze every video on the same angle -> keep it only as a hint
        cam = sc.pop("camera", None)
        if isinstance(cam, dict):
            sc["camera_hint"] = cam
        acts = sc.get("actors", [])
        if not acts:
            continue
        beat = sc.get("beat")
        focus = sc.get("focus", 0)
        if not isinstance(focus, int) or focus < 0 or focus >= len(acts):
            focus = 0
        sc["focus"] = focus

        # pose variety (do not repeat the exact same pose for the same character in consecutive scenes)
        for k, a in enumerate(acts):
            pose = a.get("pose", "stand")
            if pose in talk_poses and prev_pose.get(a["who"]) == pose:
                pose = rnd.choice([p for p in talk_poses if p != pose])
            if beat == "talk" and pose == "stand" and k == focus:
                pose = "talk"
            a["pose"] = pose

        # positions
        if len(acts) == 1:
            a = acts[0]
            a["x"] = max(260, min(820, int(a.get("x", 540)) + rnd.randint(-70, 70)))
            a.setdefault("scale", round(rnd.uniform(0.95, 1.08), 2))
        else:
            xs = sorted(a["x"] for a in acts)
            if xs[-1] - xs[0] < 240:
                acts[0]["x"], acts[-1]["x"] = 380, 700
                if acts[0]["x"] > acts[-1]["x"]:
                    acts[0]["x"], acts[-1]["x"] = acts[-1]["x"], acts[0]["x"]

        # facing: look at the nearest other actor; solo actors look towards the centre
        for a in acts:
            others = [o for o in acts if o is not a]
            if others:
                near = min(others, key=lambda o: abs(o["x"] - a["x"]))
                a["flip"] = near["x"] < a["x"]
            else:
                a["flip"] = (a["x"] > 540) if a["x"] != 540 else (rnd.random() < 0.5)

        # entrances: new characters walk in from the edge they are standing near
        for a in acts:
            new_here = a["who"] not in prev_who
            wants = new_here or (i == 0 and rnd.random() < 0.8) or rnd.random() < 0.2
            if wants and a["pose"] not in ("fly", "sit"):
                a["enter"] = "right" if a["flip"] else "left"

        # Ensure weapons in fight scenes
        if beat == "fight":
            for a in acts:
                if not a.get("weapon") or a["weapon"] == "none":
                    a["weapon"] = "gada" if a.get("who") == "hanuman" else ("bow" if a.get("who") in ("arjuna", "rama", "karna") else "sword")

        # Context-aware background: Royal court / palace for sabha, raja, or seated king
        desc_or_narr = (sc.get("scene_description", "") + " " + sc.get("narration", "")).lower()
        has_king = any(a.get("who") == "raja" or a.get("pose") == "sit" for a in acts)
        is_court = any(w in desc_or_narr for w in ["सभा", "महल", "दरबार", "हस्तिनापुर", "राजमहल", "चीरहरण", "सिंहासन", "palace", "court"])
        if (has_king or is_court) and sc.get("bg") in ("forest", "battlefield"):
            sc["bg"] = "palace"

        prev_who = {a["who"] for a in acts}
        prev_pose = {a["who"]: a["pose"] for a in acts}
    return plan


# ==============================================================================
# Fallback (only used when the live LLM fails) - now randomised so videos differ.
# ==============================================================================
_FB_STRUCTURES = [
    [("intro", 0), ("talk", 1), ("talk", 0), ("reveal", 2), ("fight", 3), ("fight", 3), ("talk", 1), ("reveal", 2), ("victory", 4), ("victory", 5)],
    [("reveal", 2), ("talk", 1), ("talk", 0), ("talk", 1), ("fight", 3), ("reveal", 2), ("fight", 3), ("reveal", 2), ("victory", 4), ("victory", 5)],
    [("intro", 0), ("talk", 1), ("reveal", 2), ("talk", 0), ("fight", 3), ("talk", 1), ("fight", 3), ("reveal", 2), ("victory", 4), ("victory", 5)],
]
_FB_BG = {
    "intro": ["palace", "temple", "forest", "sky"],
    "talk": ["palace", "forest", "pond", "temple"],
    "reveal": ["palace", "pond", "sky", "temple"],
    "fight": ["battlefield", "palace", "sky", "forest"],
    "victory": ["palace", "sky", "temple", "pond"],
}
_FB_HOOKS = [
    "बात उस दिन की है, जब {short} की कथा ने अपना असली मोड़ लिया।",
    "{short}। नाम सुना होगा, पर पूरी कहानी शायद नहीं।",
    "सब कुछ शांत था। फिर {short} की कथा में वह घड़ी आई।",
    "एक छोटा सा पल, और {short} की पूरी कहानी बदल गई।",
    "{short}। इसके पीछे की बात बहुत कम लोग जानते हैं।",
    "कहते हैं, {short} की यह घटना आज भी लोगों को राह दिखाती है।",
]
_FB_TALK_LEAD = ["बात बहुत पुरानी है।", "कहानी यहीं से शुरू होती है।", "सब कुछ एक छोटी सी घटना से शुरू हुआ।",
                 "ज़रा ध्यान से सुनिए।", "उस दिन कुछ अलग ही था।"]
_FB_NARR = {
    "talk": [
        "यहाँ से कहानी ने करवट ली। हर कोई सोच रहा था कि अब आगे क्या होगा।",
        "किसी ने नहीं सोचा था कि बात इतनी आगे बढ़ जाएगी। पर यही नियति थी।",
        "मन में सवाल थे और आँखों में इंतज़ार। फिर वह पल आया।",
        "सब चुप थे। हवा भी जैसे रुक गई थी।",
    ],
    "reveal": [
        "और तभी वह हुआ, जिसकी किसी को उम्मीद नहीं थी। {short} का सबसे बड़ा पल सामने था।",
        "ठीक उसी क्षण सब कुछ थम गया। अब फ़ैसला होना था।",
        "यहीं आती है असली परीक्षा। हार मान लेना आसान था, पर उन्होंने हार नहीं मानी।",
        "तभी एक रोशनी फैली, और सबको समझ आ गया कि यह कोई साधारण घड़ी नहीं है।",
    ],
    "fight": [
        "फिर शुरू हुआ संघर्ष। हर कदम पर मुश्किल थी, पर पीछे हटना मंज़ूर नहीं था।",
        "टकराव भयंकर था। पर जिसके साथ धर्म हो, उसे कौन रोक सकता है?",
        "अब बात हिम्मत की थी। एक तरफ़ ताक़त, दूसरी तरफ़ सच्चाई।",
        "रण में हर पल भारी था। मगर इरादा अटल था।",
    ],
    "victory": [
        "और अंत में वही हुआ, जो सच था। सच्ची निष्ठा कभी खाली नहीं जाती।",
        "आख़िर में जीत उसी की हुई, जिसका इरादा साफ़ था।",
        "सब देखते रह गए। जो नामुमकिन लगता था, वह सच हो चुका था।",
    ],
}
_FB_CLOSINGS = [
    "{short} की यह कथा सिखाती है कि सही राह पर चलने वाला कभी अकेला नहीं होता। ऐसी और गाथाओं के लिए MindSpark को सब्सक्राइब करें!",
    "यही है {short} की सीख: भरोसा और धर्म साथ हों, तो हर मुश्किल छोटी पड़ जाती है। ऐसी और गाथाओं के लिए MindSpark को सब्सक्राइब करें!",
    "बस यही थी {short} की अमर कहानी। इसे अपनों के साथ ज़रूर बाँटिए। ऐसी और गाथाओं के लिए MindSpark को सब्सक्राइब करें!",
]
_FB_CAPTIONS = {
    "intro": [("अनसुना रहस्य", "एक अनकही बात"), ("एक पुरानी कथा", "जो आज भी ज़िंदा है"), ("सुनिए ज़रा", "कहानी यहीं से शुरू होती है")],
    "talk": [("कथा का मोड़", "बात आगे बढ़ती है"), ("आमने-सामने", "सवाल और जवाब"), ("उस दिन की बात", "सब कुछ बदलने वाला था")],
    "reveal": [("निर्णायक पल", "अब फ़ैसले की घड़ी"), ("कठिन परीक्षा", "संकल्प की घड़ी"), ("और तभी...", "सब कुछ थम गया")],
    "fight": [("संघर्ष", "हिम्मत की असली परीक्षा"), ("महासंग्राम", "धर्म की प्रतिष्ठा"), ("टकराव", "पीछे हटना मंज़ूर नहीं")],
    "victory": [("सत्य की जीत", "अटल संकल्प की शक्ति"), ("कथा का अंत", "सीख जो रह जाती है"), ("अमर गाथा", "यादों में बस गई")],
}


def generate_fallback_myth_plan(topic=None, seed=None):
    rnd = random.Random(seed)
    if isinstance(topic, dict):
        title = topic.get("title", "सनातन का अनसुना रहस्य").strip()
        summary = topic.get("summary", "").strip()
    elif isinstance(topic, str) and topic.strip():
        title = topic.strip()
        summary = ""
    else:
        title = "श्रीकृष्ण और अर्जुन: कुरुक्षेत्र का रहस्य"
        summary = "कुरुक्षेत्र के रणभूमि में भगवान श्रीकृष्ण द्वारा अर्जुन को दिया गया दिव्य कर्मयोग का उपदेश।"

    short = title.split(":")[0].strip() or title
    clean_summary = summary if summary else f"{title} भारतीय इतिहास और सनातन दर्शन का एक अमर अध्याय है।"
    actors_seq = _detect_myth_actors_for_topic(title, summary)
    structure = rnd.choice(_FB_STRUCTURES)

    pools = {k: rnd.sample(v, len(v)) for k, v in _FB_NARR.items()}
    used = {k: 0 for k in pools}
    cap_pools = {k: rnd.sample(v, len(v)) for k, v in _FB_CAPTIONS.items()}
    cap_used = {k: 0 for k in cap_pools}

    def take(pool_dict, used_dict, beat):
        pool = pool_dict[beat]
        item = pool[used_dict[beat] % len(pool)]
        used_dict[beat] += 1
        return item

    scenes, prev_bg, summary_used = [], None, False
    for idx, (beat, role) in enumerate(structure):
        last = idx == len(structure) - 1
        bgs = [b for b in _FB_BG[beat] if b != prev_bg] or _FB_BG[beat]
        bg = rnd.choice(bgs)
        prev_bg = bg
        if idx == 0:
            narration = rnd.choice(_FB_HOOKS).format(short=short)
        elif last:
            narration = rnd.choice(_FB_CLOSINGS).format(short=short)
        elif beat == "talk" and not summary_used:
            narration = f"{rnd.choice(_FB_TALK_LEAD)} {clean_summary}"
            summary_used = True
        else:
            narration = take(pools, used, "victory" if beat == "intro" else beat).format(short=short)
        cap_title, cap_text = take(cap_pools, cap_used, beat)
        if last:
            cap_title, cap_text = "सनातन ज्ञान", "MindSpark को सब्सक्राइब करें"
        actors = [dict(a) for a in actors_seq[min(role, len(actors_seq) - 1)]]
        sec = 3 if idx == 0 else (5 if (last or idx >= len(structure) - 2) else rnd.choice([4, 5, 5]))
        scenes.append({
            "sec": sec,
            "beat": beat,
            "bg": bg,
            "scene_description": f"{short}: {cap_title}",
            "actors": actors,
            "caption": {"title": cap_title, "text": cap_text},
            "narration": narration,
            "focus": 1 if (beat == "talk" and len(actors) > 1 and rnd.random() < 0.5) else 0,
        })

    return {
        "youtube": {
            "title": f"{title} ⚔️ | MindSpark Mythology",
            "description": f"{title} - सनातन धर्म और भारतीय पौराणिक कथाओं का अनसुना रहस्य। #Mythology #Shorts #MindSpark #Sanatan",
            "tags": ["MindSpark", "Mythology", "Shorts", "Sanatan", "Hindi", "Vedas", "Mahabharat"],
        },
        "scenes": scenes,
    }


# ==============================================================================
# Live story generation
# ==============================================================================
_MYTH_STYLES = [
    "Dhamakedaar high-stakes shuruaat: seedha yuddh ki lalkaar, pratigya ya sabse kathin sankat se shuru karo, phir 'ye sab kaise hua' batate hue rahasya kholo.",
    "Sanvaad-pradhan teekhi takraav: kam se kam 3 scene me pAatron ke aamne-saamne ke garma-garam sanvaad (double quotes \"...\" me) daalo.",
    "Ek yoddha ya pAatra ki nazar se: jaise woh khud us bhayankar sankat aur balidaan ko apni aankhon se dekh raha ho.",
    "Rahasya aur asambhav mod: shuruaat me ek aisi ghatna jo asambhav lage, phir ek aisa twist jo rongte khade kar de.",
    "Veer-ras aur dharmsankat: shastron ki jhankaar, swabhimaan ki raksha, aur nyay ke liye sab kuch daanv par laga dena.",
]
_MYTH_TONES = [
    "veer-ras aur teekhe sanvaad (high adrenaline drama)",
    "rahasyamayi aur rongte khade karne wala suspense",
    "bhaavuk aur balidaan se bhara (deep emotion)",
    "garv aur josh se bhari shreshtha itihaas gatha"
]

_MYTH_PROMPT = """Tum ek anubhavi Hindi kahani-kaar aur film scriptwriter ho, jo YouTube Shorts aur cinematic voiceover ke liye rochak, masaledaar aur dil ko chhoo lene wali kahaniyan likhte ho.
Tumhara kaam aisi kahani likhna hai jise sunkar lage ki koi insaan, aankhon dekha romanch ya dil ki aag, poore josh ke sath sunaa raha hai. AI ki likhi hui pheeki kahani bilkul nahi.

## Bhaasha Niyam:
- Script hamesha Devanagari me likho.
- Roz-marra ki bolchaal ki natural, damdaar Hindi use karo. Bhaari, kitaabi ya bejaan shabd mat daalo.
- Chhote, teekhe vaakya rakho. Ek vaakya me ek hi baat. Beech-beech me 2-3 shabdon ke chhote punchy vaakya daalo. Jaise: "talwar nikal chuki thi. raasta koi nahi tha."
- Vaakyon ki lambai badalte raho.
- In cheezon se bacho: "Aaj ke is video me", "toh doston", "chaliye shuru karte hain", "ek anokha safar", "zindagi ka sabak", "yaad rakhiye".
- Scene 1 Hook (MIRCH-MASALA): koi fixed generic opening line NAHI. 'क्या आपको पता है', 'क्या आप जानते हैं' ya koi bhi boring saancha bilkul mat use karo. Seedha kahani ke sabse bade sankat, lalkaar, sanvaad ya drishya se shuru karo!
- Last scene: conclude naturally with heroic pride, and the very last sentence MUST end with: 'ऐसी और गाथाओं के लिए MindSpark को सब्सक्राइब करें!'

## 3-ACT PACING & TIMING BLUEPRINT (STRICT 50-55 SECONDS TOTAL):
1. ACT 1: 0–3 Sec (THE HOOK) - Scene 1:
   - 'sec': 3 (STRICTLY 3 seconds).
   - Beat: 'intro' or 'reveal'.
   - Narration: Exactly 8-12 words in Hindi. Ek aisa sawal ya shock jo viewer ko scroll karne se turant rok le (thumb-stopper)!
   - Examples:
     "एक ऐसा योद्धा, जिसने साक्षात मृत्यु को रणभूमि में ललकार दिया!"
     "क्या आप जानते हैं इस मंदिर का वह रहस्य, जिसने मुगलों की पूरी फ़ौज को भगा दिया?"

2. ACT 2: 3–45 Sec (THE STORY) - Scenes 2 to N-2:
   - 'sec': 4 to 5 per scene (total ~40-42 seconds, fast-paced).
   - Seedhi, tej aur visual kahani (heavy dramatic background music ke saath)!
   - Chhote sentences (short punchy sentences, 5-8 words per sentence).
   - Kam se kam 2-3 scenes me pAatron ke teekhe, aamne-saamne ke sanvaad (double quotes \"...\" me) daalo.
   - Poses: 'walk' for walking gait, 'talk' / 'point' for dialogue lip-sync, 'fight' for weapon clashes.

3. ACT 3: 45–55 Sec (THE CLIMAX / TWIST) - Final 2 Scenes:
   - 'sec': 4 to 5 per scene (total ~8-10 seconds, ending at 50-55s total).
   - Beat: 'reveal' -> 'victory'.
   - Scene N-1: Kahani ka sabse bada chamatkar ya hairan kar dene wala mod (Twist)!
   - Scene N: Kahani ki amar seekh, aur last sentence MUST end with:
     'ऐसी और गाथाओं के लिए MindSpark को सब्सक्राइब करें!'

## Kahani ki bunaavat aur Masaledaar Sanvaad (SABSE ZAROORI):
- Ye ek poori KAHANI hai: 0-3s Hook -> 3-45s Tez takraav aur sankalp -> 45-55s Chamatkar/Twist aur Antim Vijay.
- Har scene me kahani AAGE badhni chahiye. Pichla scene dohrao mat.
- Kam se kam 2-3 scenes me pAatron ke damdaar sanvaad (double quotes \"...\" me) daalo. Jaise: "रुक जाओ! यदि आज शस्त्र नहीं उठाए, तो इतिहास हमें कायर कहेगा!"
- Voiceover me emotion aur thehraav laane ke liye viram-chinh (`!`, `,`, `...`, `।`) ka behtareen prayog karo taaki TTS bolte waqt asli insaan jaisa dumdaar aur bhavuk lage.
- Lip-Sync aur Visuals: Jis scene me sanvaad ho, wahan actor ka pose 'talk' ya 'point' rakho taaki animation me uska mukh bolta hua dikhe! Chalne ke liye 'walk', dhyan/chintan ke liye 'sit', yuddh ke liye 'fight'.
- Grand Elements: Mandir, mehal, yuddhabhoomi ke scenes me 'temple', 'palace', ya 'battlefield' chunao jahan grand vimana shikhar, haathi, ghode aur dhwaja dikhenge.
- Is video ki shaili: __STYLE__
- Is video ka tone: __TONE__

STORY CONTEXT:
__CONTEXT__

Return ONE valid JSON object only (no markdown, no extra commentary):
{
  "youtube": {
    "title": "[रहस्यमयी प्रश्न या गर्जना]? सनातन के अनसुने रहस्य | MindSpark",
    "description": "सनातन धर्म, भारतीय इतिहास और वीरों के अनसुने रहस्य। Watch till the end! #Shorts #Sanatan #MindSpark #Mythology #History",
    "tags": ["MindSpark", "Mythology", "Shorts", "Sanatan", "Hindi", "History", "VeerGatha"]
  },
  "scenes": [
    {
      "sec": 3,
      "beat": "intro" | "talk" | "reveal" | "fight" | "victory",
      "bg": "palace" | "forest" | "pond" | "temple" | "battlefield" | "sky",
      "scene_description": "Silent visual direction in Devanagari Hindi: who is doing what, mood (NOT SPOKEN BY TTS)",
      "actors": [
        {
          "who": "one of: __ROSTER__",
          "pose": "stand" | "sit" | "fly" | "fight" | "walk" | "pray" | "point" | "talk",
          "x": 350,
          "weapon": "none" | "gada" | "bow" | "trishul" | "chakra" | "sword",
          "flip": false
        }
      ],
      "focus": 0,
      "caption": {
        "title": "Short title in Devanagari Hindi (max 4 words)",
        "text": "One line text in Devanagari Hindi"
      },
      "narration": "8-12 words for Scene 1 hook, 14-20 words for story scenes with powerful dialogues in quotes."
    }
  ]
}

STRICT RULES:
1. Total scenes: __N__ scenes (Total video duration MUST be 50 to 55 seconds).
   - Scene 1 MUST have 'sec': 3 (The Hook, 8-12 words).
   - Middle scenes 'sec': 4 to 5 (The Story, 3-45 sec).
   - Final 2 scenes 'sec': 4 to 5 (The Climax & Twist, 45-55 sec).
2. Allowed characters: __ROSTER__. Pick the characters of THIS story (1 to 3 per scene):
   - For kings/warriors use 'raja' or 'soldier', for wise sages use 'rishi' or 'guru', for outlaws use 'chor', or specific epic heroes/gods.
3. Allowed backgrounds: palace, forest, pond, temple, battlefield, sky. Use at least 4 different backgrounds.
4. Beats: Scene 1 'intro' or 'reveal', middle 'talk'/'fight'/'reveal', last scene 'victory'. Use 'talk' with dialogue quotes so character mouth flap animates.
5. Poses: vary them. Use 'walk' for natural walking animation, 'talk' or 'point' when speaking dialogue, 'fight' in action.
6. Two characters in a scene: x between 250 and 850, at least 250 apart, and the one on the right has flip true (they face each other).
7. Do NOT add any camera field. Narration and Caption text MUST be 100% Devanagari Hindi (only the word MindSpark may be Latin).
"""


def _salvage_json(raw):
    """Parse JSON; if the model's output was cut off, keep every complete scene."""
    try:
        return json.loads(raw)
    except Exception as first_err:
        ends = [m.start() for m in re.finditer(r"\}", raw)]
        for pos in reversed(ends[-300:]):
            try:
                plan = json.loads(raw[: pos + 1] + "]}")
                if isinstance(plan, dict) and len(plan.get("scenes", [])) >= 5:
                    print(f"[LLM] Output was truncated - salvaged {len(plan['scenes'])} complete scenes.")
                    return plan
            except Exception:
                continue
        raise first_err


def make_myth_plan(topic, custom_script=None, seed=None):
    """Generates a strict JSON plan for MINDSPARK Mythology Shorts (MythShort)."""
    rnd = random.Random(seed)
    topic_str = topic.get("title", str(topic)) if isinstance(topic, dict) else str(topic)
    topic_summary = topic.get("summary", "") if isinstance(topic, dict) else ""
    if custom_script:
        story_context = f"""CUSTOM STORY FROM USER / WEBSITE / HISTORICAL SOURCE:
Topic / Title: {topic_str}
Story Text:
\"\"\"{custom_script}\"\"\"

CRITICAL ADAPTATION RULES FOR THIS CUSTOM STORY:
1. Faithfully adapt THIS EXACT STORY and its specific characters/events. Do NOT replace it with any other story.
2. Character Mapping: If this is an Indian folk tale, regional history (e.g. Saurashtra ni Rasdhar, Maratha / Rajput chronicles) or legendary heroes:
   - For kings, maharajas, chieftains: use 'raja'.
   - For commanders, senapatis, warriors, soldiers: use 'soldier'.
   - For rishis, saints, advisors, gurus: use 'rishi' or 'guru'.
   - For outlaws, dacoits, rebels: use 'chor' or 'asura'.
   - For epic heroes / gods: use the closest matched character from __ROSTER__.
3. Infuse full 'Mirch-Masala': fiery spoken dialogues in quotes (\"...\"), goosebump-inducing moments, high stakes, and intense Veer Ras / Adbhut Ras."""
    else:
        story_context = f"Story Topic: {topic_str}\nSummary: {topic_summary}"

    prompt = (_MYTH_PROMPT
              .replace("__STYLE__", rnd.choice(_MYTH_STYLES))
              .replace("__TONE__", rnd.choice(_MYTH_TONES))
              .replace("__CONTEXT__", story_context)
              .replace("__N__", rnd.choice(["10", "11", "10", "11"]))
              .replace("__ROSTER__", ", ".join(sorted(list(ROSTER_GODS)))))

    err = None
    for attempt in range(3):
        try:
            curr_prompt = prompt
            if err:
                curr_prompt += f"\n\nCRITICAL: Your previous output had this error: {err}. Please fix it strictly. Keep the JSON compact."
            # Devanagari is token-hungry: 10 scenes need far more than 2000 tokens or the JSON gets cut off
            txt = _call(curr_prompt, max_tokens=8000)
            raw = txt.strip()
            if "{" in raw and "}" in raw:
                raw = raw[raw.index("{"): raw.rindex("}") + 1]
            plan = _salvage_json(raw)

            # Enforce 3-Act Timing & MindSpark branding (0-3s Hook, 3-45s Story, 45-55s Climax & Twist)
            if plan.get("scenes"):
                # Act 1: 0-3 Sec Hook
                plan["scenes"][0]["sec"] = 3
                # Act 2: 3-45 Sec Story (middle scenes 4 to 5s)
                for sc in plan["scenes"][1:-2]:
                    if sc.get("sec", 5) > 5:
                        sc["sec"] = 5
                    elif sc.get("sec", 5) < 4:
                        sc["sec"] = 4
                # Act 3: 45-55 Sec Climax & Twist (last 2 scenes 4 to 5s)
                for sc in plan["scenes"][-2:]:
                    if sc.get("sec", 5) > 5:
                        sc["sec"] = 5
                    elif sc.get("sec", 5) < 4:
                        sc["sec"] = 4

                last_s = plan["scenes"][-1]
                l_narr = last_s.get("narration", "")
                if "mindspark" not in l_narr.lower() and "माइंडस्पार्क" not in l_narr:
                    last_s["narration"] = l_narr.rstrip(".! ") + "। ऐसी और गाथाओं के लिए MindSpark को सब्सक्राइब करें!"

            err = validate_myth_plan(plan)
            if not err:
                print(f"[LLM] Myth plan generated successfully with {len(plan['scenes'])} scenes!")
                return choreograph_myth_plan(plan, seed)
            print(f"[LLM] Myth plan validation failed on attempt {attempt + 1}: {err}")
        except Exception as e:
            err = str(e)
            print(f"[LLM] Myth plan generation attempt {attempt + 1} exception: {err}")

    # make this loud in the GitHub Actions summary: a fallback story is the reason videos look repeated
    print(f"::warning::Live myth story FAILED ({err}). Using randomised fallback plan - check your LLM keys / limits.")
    print(f"[LLM] Live myth plan failed ({err}). Using randomised fallback myth plan...")
    return choreograph_myth_plan(generate_fallback_myth_plan(topic, seed), seed)
