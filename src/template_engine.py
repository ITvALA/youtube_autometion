"""Template Engine for MindSpark:
Selects from 22 distinct video templates with auto-rotation, weighted-random selection,
strict no-repeat history window, and full backward compatibility fallback.
"""
import os, sys, random, copy
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(ROOT / "src") not in sys.path:
    sys.path.insert(0, str(ROOT / "src"))

from common import ROOT, jload, jsave
import theme_engine

TEMPLATES_FILE = ROOT / "config" / "templates.json"
STYLE_FILE = ROOT / "config" / "style.json"
HISTORY_FILE = ROOT / "data" / "template_history.json"

DEFAULT_TEMPLATE = {
    "id": "parallax_dawn",
    "name": "Parallax Dawn",
    "description": "Warm mountain landscape, rising sun, cinematic depth and large punchy headlines.",
    "scene_recipe": ["hook", "story", "story", "story", "card"],
    "palette_family": ["Sunset Pop", "Gold Luxury", "Crimson Impact"],
    "font": "SpaceGrotesk",
    "layout": "center",
    "pattern": "rays",
    "transition": "slide",
    "caption_style": "pill",
    "backdrop": "landscape",
    "mascot": False,
    "weight": 10,
    "enabled": True
}

def load_templates():
    templates = jload(TEMPLATES_FILE, [])
    enabled = [t for t in templates if t.get("enabled", True)]
    return enabled if enabled else [DEFAULT_TEMPLATE]

def load_template_history():
    return jload(HISTORY_FILE, [])

def save_template_history(history):
    jsave(HISTORY_FILE, history)

def pick_template(history=None, config=None, rng=None):
    """Picks a template based on config/style.json rules (random, rotate, or fixed).
    Ensures no repetition within the last N videos (default 7).
    """
    try:
        all_templates = load_templates()
        if not all_templates:
            return copy.deepcopy(DEFAULT_TEMPLATE)
        
        cfg = config or jload(STYLE_FILE, {})
        hist = history if history is not None else load_template_history()
        mode = str(cfg.get("template_mode", "random")).lower()
        no_repeat_n = int(cfg.get("no_repeat_last", 7))
        
        if rng is None:
            seed = random.SystemRandom().randint(1, 10**9)
            rng = random.Random(seed)

        # 1. FIXED MODE
        if mode == "fixed":
            fixed_id = cfg.get("fixed_id", "parallax_dawn")
            chosen = next((t for t in all_templates if t["id"] == fixed_id), all_templates[0])
            return _enrich_template(chosen, hist, rng)

        # 2. ROTATE MODE
        if mode == "rotate":
            idx = len(hist) % len(all_templates)
            chosen = all_templates[idx]
            return _enrich_template(chosen, hist, rng)

        # 3. RANDOM MODE (with weighted pick and no-repeat window)
        recent_ids = [h.get("template_id") for h in hist[-no_repeat_n:] if isinstance(h, dict) and h.get("template_id")]
        
        eligible = [t for t in all_templates if t["id"] not in recent_ids]
        
        # If too strict and no eligible left, fallback to not repeating only the very last one
        if not eligible and recent_ids:
            last_id = recent_ids[-1]
            eligible = [t for t in all_templates if t["id"] != last_id]
        
        if not eligible:
            eligible = all_templates

        # Weighted selection
        weights = [max(1, int(t.get("weight", 10))) for t in eligible]
        chosen = rng.choices(eligible, weights=weights, k=1)[0]
        return _enrich_template(chosen, hist, rng)

    except Exception as e:
        print(f"⚠️ Template engine error: {e}. Falling back to default template.")
        return _enrich_template(copy.deepcopy(DEFAULT_TEMPLATE), history or [], rng or random.Random())

def _enrich_template(template, history, rng=None):
    """Enriches the template with dynamic palette, font, and strict 1080x1920 vertical format."""
    rng = rng or random.Random()
    t = copy.deepcopy(template)
    
    # Select palette from palette_family or fallback
    family = t.get("palette_family", [])
    available_palettes = [p for p in theme_engine.PALETTES if p["name"] in family]
    if not available_palettes:
        available_palettes = theme_engine.PALETTES

    recent_palettes = [h.get("palette") for h in history[-4:] if isinstance(h, dict) and h.get("palette")]
    fresh_palettes = [p for p in available_palettes if p["name"] not in recent_palettes]
    chosen_palette = rng.choice(fresh_palettes or available_palettes)

    # Allow slight dynamic variation in fonts/layouts if specified in theme_engine
    fonts = theme_engine.FONTS
    layouts = theme_engine.LAYOUTS
    patterns = theme_engine.PATTERNS
    transitions = theme_engine.TRANSITIONS

    chosen_font = t.get("font") or rng.choice(fonts)
    chosen_layout = t.get("layout") or rng.choice(layouts)
    chosen_pattern = t.get("pattern") or rng.choice(patterns)
    chosen_transition = t.get("transition") or rng.choice(transitions)

    # Strictly 9:16 vertical 1080x1920 format
    fmt = {
        "name": "vertical",
        "width": 1080,
        "height": 1920
    }

    t["theme"] = {
        "palette": chosen_palette["name"],
        "colors": {k: v for k, v in chosen_palette.items() if k != "name"},
        "font": chosen_font,
        "layout": chosen_layout,
        "pattern": chosen_pattern,
        "transition": chosen_transition,
        "chart": rng.choice(theme_engine.CHARTS),
        "formatName": "vertical",
        "format": fmt
    }
    t["template_id"] = t["id"]
    return t

def record_template_history(template, book_title=None):
    """Appends chosen template execution into data/template_history.json."""
    hist = load_template_history()
    import datetime
    entry = {
        "template_id": template.get("id"),
        "template_name": template.get("name"),
        "palette": template.get("theme", {}).get("palette"),
        "book": book_title or "",
        "date": str(datetime.date.today())
    }
    hist.append(entry)
    save_template_history(hist)
    return hist
