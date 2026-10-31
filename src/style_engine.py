"""Style Engine for MindSpark StyleEngine integration.
Picks a visual style (art direction) from the 6 available styles,
ensuring no repetition within a configurable window.
"""
import sys, random, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(ROOT / "src") not in sys.path:
    sys.path.insert(0, str(ROOT / "src"))

from common import ROOT, jload, jsave

STYLE_IDS = [
    "motion_graphics", "perspective_3d", "cutout_collage",
    "blueprint", "swiss_poster", "isometric",
    "tech_glow", "cyber_terminal", "flat_vector", "cinematic_noir"
]
STYLE_HIST_FILE = ROOT / "data" / "style_history.json"
STYLE_CFG_FILE = ROOT / "config" / "style.json"


def load_style_history():
    return jload(STYLE_HIST_FILE, [])


def save_style_history(history):
    jsave(STYLE_HIST_FILE, history)


def pick_style(history=None, cfg=None, rng=None, forced_style=None):
    """Pick a style that hasn't been used in the last N videos.
    Returns {"id": str, "variant": int, "seed": int}.
    """
    cfg = cfg or jload(STYLE_CFG_FILE, {})
    hist = history if history is not None else load_style_history()
    no_repeat = int(cfg.get("style_no_repeat_last", 4))
    forced = forced_style or cfg.get("style_fixed_id")

    if forced and forced in STYLE_IDS:
        sid = forced
    else:
        recent_ids = [h.get("style_id") for h in hist[-no_repeat:] if isinstance(h, dict) and "style_id" in h]
        eligible = [s for s in STYLE_IDS if s not in recent_ids]
        if not eligible:
            eligible = [s for s in STYLE_IDS if s != (recent_ids[-1] if recent_ids else None)]
        if not eligible:
            eligible = STYLE_IDS
        r = rng or random.SystemRandom()
        sid = r.choice(eligible)

    # Pick variant: avoid last variant used for this same style
    last_variant_for_style = None
    for h in reversed(hist):
        if isinstance(h, dict) and h.get("style_id") == sid and "variant" in h:
            last_variant_for_style = h.get("variant")
            break
    variants = [0, 1, 2]
    if last_variant_for_style is not None:
        variants = [v for v in variants if v != last_variant_for_style]
    r2 = rng or random.SystemRandom()
    variant = r2.choice(variants)

    seed = (rng or random.SystemRandom()).randint(1, 10**9)

    return {"id": sid, "variant": variant, "seed": seed}


def record_style(style, book_title=""):
    """Append to style history."""
    hist = load_style_history()
    entry = {
        "style_id": style["id"],
        "variant": style["variant"],
        "date": str(datetime.date.today()),
        "book": book_title
    }
    if "seed" in style:
        entry["seed"] = style["seed"]
    hist.append(entry)
    save_style_history(hist)
    return hist
