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

def _call_gemini(prompt):
    raw_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY_2", "")
    key = str(raw_key).strip().strip('"').strip("'")
    if not key:
        raise ValueError("GEMINI_API_KEY is not set.")
    
    models = [
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
                    "maxOutputTokens": 3500,
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


def _call_groq(prompt):
    key = os.environ.get("GROQ_API_KEY", "").strip()
    if not key:
        raise RuntimeError("GROQ_API_KEY not configured in environment")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    models = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"]
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
                "max_tokens": 2000,
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


def _call_openai_relay(prompt):
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
        "max_tokens": 2000
    }
    r = requests.post(url, headers=headers, json=body, timeout=60)
    if r.status_code == 200:
        data = r.json()
        print(f"[LLM] Generated plan via LLM relay ({model})!")
        return data["choices"][0]["message"]["content"]
    raise RuntimeError(f"LLM relay HTTP {r.status_code}: {r.text[:150]}")


def _call(prompt):
    """Multi-tier LLM engine: Gemini -> Groq -> OpenAI/Relay."""
    errors = []
    # 1. Google Gemini (if key configured)
    if os.environ.get("GEMINI_API_KEY") or os.environ.get("GEMINI_API_KEY_2"):
        try:
            return _call_gemini(prompt)
        except Exception as e:
            errors.append(f"Gemini: {e}")

    # 2. Groq (Always available with high speed)
    try:
        return _call_groq(prompt)
    except Exception as e:
        errors.append(f"Groq: {e}")

    # 3. LLM Relay / OpenAI (Backup)
    if os.environ.get("LLM_API_KEY") or os.environ.get("ANTHROPIC_API_KEY"):
        try:
            return _call_openai_relay(prompt)
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
MYTH_BGS = {"forest", "pond", "temple", "battlefield", "sky"}
MYTH_POSES = {"stand", "sit", "fly", "fight", "walk", "pray"}
MYTH_WEAPONS = {"none", "gada", "bow", "trishul", "chakra", "sword"}
MYTH_SHOTS = {"wide", "medium", "closeup", "extreme", "low", "high", "dutch", "side", "sideR", "over"}
MYTH_MOVES = {"still", "pushIn", "pullOut", "panL", "panR", "tiltUp", "craneDown", "orbit", "shake", "whip"}


def validate_myth_plan(plan):
    """Validator: reject unknown character ids, missing fields, or scenes under 3s."""
    if not isinstance(plan, dict):
        return "Plan must be a JSON object"
    scenes = plan.get("scenes")
    if not isinstance(scenes, list) or len(scenes) < 5 or len(scenes) > 10:
        return f"scenes must be a list of 5 to 10 scenes, got {len(scenes) if isinstance(scenes, list) else type(scenes)}"

    for idx, sc in enumerate(scenes):
        if not isinstance(sc, dict):
            return f"scene {idx} must be an object"
        sec = sc.get("sec")
        if not isinstance(sec, (int, float)) or sec < 3:
            return f"scene {idx}: sec must be >= 3 seconds, got {sec}"

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
            [{"who": "rama", "pose": "stand", "x": 350, "weapon": "bow"}, {"who": "lakshmana", "pose": "stand", "x": 750, "flip": True, "weapon": "bow"}],
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


def generate_fallback_myth_plan(topic=None):
    if isinstance(topic, dict):
        title = topic.get("title", "सनातन का अनसुना रहस्य").strip()
        summary = topic.get("summary", "").strip()
    elif isinstance(topic, str) and topic.strip():
        title = topic.strip()
        summary = ""
    else:
        title = "श्रीकृष्ण और अर्जुन: कुरुक्षेत्र का रहस्य"
        summary = "कुरुक्षेत्र के रणभूमि में भगवान श्रीकृष्ण द्वारा अर्जुन को दिया गया दिव्य कर्मयोग का उपदेश।"

    actors_seq = _detect_myth_actors_for_topic(title, summary)
    clean_summary = summary if summary else f"{title} भारतीय इतिहास और सनातन दर्शन का एक अमर अध्याय है।"
    
    return {
        "youtube": {
            "title": f"{title} ⚔️ | MindSpark Mythology",
            "description": f"{title} - सनातन धर्म और भारतीय पौराणिक कथाओं का अनसुना रहस्य। #Mythology #Shorts #MindSpark #Sanatan",
            "tags": ["MindSpark", "Mythology", "Shorts", "Sanatan", "Hindi", "Vedas", "Mahabharat"]
        },
        "scenes": [
            {
                "sec": 5,
                "beat": "intro",
                "bg": "temple",
                "actors": actors_seq[0],
                "caption": {"title": "अनसुना रहस्य", "text": "क्या आपको पता है?"},
                "narration": f"क्या आपको पता है {title} के पीछे कौन सा गहरा रहस्य छिपा है?",
                "focus": 0
            },
            {
                "sec": 6,
                "beat": "talk",
                "bg": "forest",
                "actors": actors_seq[1],
                "caption": {"title": "घटना का मोड़", "text": "इतिहास का अनकहा सच"},
                "narration": f"{clean_summary}",
                "focus": 1 if len(actors_seq[1]) > 1 else 0
            },
            {
                "sec": 5,
                "beat": "reveal",
                "bg": "pond",
                "actors": actors_seq[2],
                "caption": {"title": "कठिन परीक्षा", "text": "संकल्प की घड़ी"},
                "narration": f"{title} की इस कथा में जब परीक्षा की घड़ी आई, तब एक ऐसा अद्भुत निर्णय लिया गया जिसने सबको हतप्रभ कर दिया।",
                "focus": 0
            },
            {
                "sec": 6,
                "beat": "fight",
                "bg": "battlefield",
                "actors": actors_seq[3],
                "caption": {"title": "महासंग्राम", "text": "धर्म की प्रतिष्ठा"},
                "narration": "धार्मिक मर्यादा और सत्य की रक्षा के लिए वह अद्भुत पराक्रम दिखाया गया जो इतिहास के पन्नों में सदा के लिए अमर हो गया।",
                "focus": 0
            },
            {
                "sec": 5,
                "beat": "victory",
                "bg": "sky",
                "actors": actors_seq[4],
                "caption": {"title": "सत्य की विजय", "text": "अटल संकल्प की शक्ति"},
                "narration": "इस महान गाथा ने सिद्ध कर दिया कि संकट कितना भी विकट हो, अंत में विजय सदा सत्य और धर्म की ही होती है।",
                "focus": 0
            },
            {
                "sec": 6,
                "beat": "victory",
                "bg": "temple",
                "actors": actors_seq[5],
                "caption": {"title": "सनातन ज्ञान", "text": "MindSpark को सब्सक्राइब करें"},
                "narration": f"{title} की यह पावन गाथा हमें अपने कर्तव्य पथ पर अडिग रहना सिखाती है। ऐसी और गाथाओं के लिए MindSpark को सब्सक्राइब करें!",
                "focus": 0
            }
        ]
    }


def make_myth_plan(topic, custom_script=None):
    """Generates a strict JSON plan for MINDSPARK Mythology Shorts (MythShort)
    written with a natural, professional human Hindi storyteller persona.
    """
    topic_str = topic.get("title", str(topic)) if isinstance(topic, dict) else str(topic)
    topic_summary = topic.get("summary", "") if isinstance(topic, dict) else ""
    if custom_script:
        story_context = f"Topic: {topic_str}\nCustom Script/Details: {custom_script}"
    else:
        story_context = f"Story Topic: {topic_str}\nSummary: {topic_summary}"

    prompt = f"""Tum ek anubhavi Hindi kahani-kaar ho, jo YouTube Shorts aur voiceover ke liye kahaniyan likhte ho.
Tumhara kaam aisi kahani likhna hai jise sunkar lage ki koi insaan, aankhon dekha haal ya dil ki baat, sunaa raha hai. AI ki likhi hui nahi.

## Bhaasha Niyam:
- Script hamesha Devanagari me likho.
- Roz-marra ki bolchaal ki natural Hindi use karo, jaisi ek kahani sunane wala bolta hai. Bhaari, kitaabi ya shuddh-Sanskrit shabd mat daalo.
- Chhote vaakya rakho. Ek vaakya me ek hi baat. Beech-beech me bahut chhote vaakya bhi daalo. Jaise: "Wo ruk gaya. Kuch bola nahi."
- Vaakyon ki lambai badalte raho.
- In cheezon se bacho: "Aaj ke is video me", "toh doston", "chaliye shuru karte hain", "ek anokha safar", "zindagi ka sabak", "yaad rakhiye".
- Scene 1 (THE VIRAL HOOK): Opening line MUST strictly start with 'क्या आपको पता है...?' (NEVER 'क्या आप जानते हैं').
- Scene 6/Last scene: Conclude naturally, and the very last sentence MUST end with: 'ऐसी और गाथाओं के लिए MindSpark को सब्सक्राइब करें!'

STORY CONTEXT:
{story_context}

Return ONE valid JSON object only (no markdown, no extra commentary):
{{
  "youtube": {{
    "title": "[रहस्यमयी प्रश्न]? सनातन के अनसुने रहस्य | MindSpark",
    "description": "सनातन धर्म और भारतीय इतिहास के अनसुने रहस्य। Watch till the end! #Shorts #Sanatan #MindSpark #Mythology",
    "tags": ["MindSpark", "Mythology", "Shorts", "Sanatan", "Hindi", "Mahabharat"]
  }},
  "scenes": [
    {{
      "sec": 5,
      "beat": "intro" | "talk" | "reveal" | "fight" | "victory",
      "bg": "forest" | "pond" | "temple" | "battlefield" | "sky",
      "actors": [
        {{
          "who": "one of: {', '.join(sorted(list(ROSTER_GODS)))}",
          "pose": "stand" | "sit" | "fly" | "fight" | "walk" | "pray",
          "x": 350,
          "weapon": "none" | "gada" | "bow" | "trishul" | "chakra" | "sword",
          "flip": false
        }}
      ],
      "focus": 0,
      "caption": {{
        "title": "Short title in Devanagari Hindi (max 4 words)",
        "text": "One line text in Devanagari Hindi"
      }},
      "narration": "12-18 words in 100% natural conversational Devanagari Hindi."
    }}
  ]
}}

STRICT RULES:
1. Total scenes: 6 to 8 scenes. Duration 'sec': 4 to 6 seconds per scene (Total 35-42s).
2. Allowed characters: {', '.join(sorted(list(ROSTER_GODS)))}. Pick characters matching this legend.
3. Allowed backgrounds: forest, pond, temple, battlefield, sky. Vary backgrounds.
4. Narration and Caption text MUST be 100% Devanagari Hindi.
"""

    err = None
    for attempt in range(2):
        try:
            curr_prompt = prompt
            if err:
                curr_prompt += f"\n\nCRITICAL: Your previous output had this error: {err}. Please fix it strictly."
            txt = _call(curr_prompt)
            raw = txt.strip()
            if "{" in raw and "}" in raw:
                raw = raw[raw.index("{"): raw.rindex("}") + 1]
            plan = json.loads(raw)

            # Auto-replace "क्या आप जानते" with "क्या आपको पता है" per user directive
            for sc in plan.get("scenes", []):
                for k in ["narration", "tts_text"]:
                    if sc.get(k):
                        sc[k] = sc[k].replace("क्या आप जानते हैं", "क्या आपको पता है").replace("क्या आप जानते हो", "क्या आपको पता है")
                if sc.get("caption") and isinstance(sc["caption"], dict):
                    for ck in ["title", "text"]:
                        if sc["caption"].get(ck):
                            sc["caption"][ck] = sc["caption"][ck].replace("क्या आप जानते हैं", "क्या आपको पता है").replace("क्या आप जानते हो", "क्या आपको पता है")

            # Enforce MindSpark brand at the end
            if plan.get("scenes") and len(plan["scenes"]) > 0:
                last_s = plan["scenes"][-1]
                l_narr = last_s.get("narration", "")
                if "mindspark" not in l_narr.lower() and "माइंडस्पार्क" not in l_narr:
                    last_s["narration"] = l_narr.rstrip(".! ") + "। ऐसी और गाथाओं के लिए MindSpark को सब्सक्राइब करें!"

            err = validate_myth_plan(plan)
            if not err:
                print(f"[LLM] Myth plan generated successfully with {len(plan['scenes'])} scenes!")
                return plan
            print(f"[LLM] Myth plan validation failed on attempt {attempt + 1}: {err}")
        except Exception as e:
            err = str(e)
            print(f"[LLM] Myth plan generation attempt {attempt + 1} exception: {err}")

    print(f"[LLM] Live myth plan failed ({err}). Using curated fallback myth plan...")
    return generate_fallback_myth_plan(topic)
