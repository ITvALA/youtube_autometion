"""Style Engine for MindSpark StyleEngine integration.
Supports 222 total visual styles:
  - 10 original motion graphic styles (each with 3 custom color palettes)
  - 200 procedural engine styles (s001 - s200) from Motion Graphics Atlas
  - 12 'Thinking loader' styles (t01 - t12)
Ensures no repetition within the last 10 videos via state/recent-styles.json.
"""
import sys, random, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(ROOT / "src") not in sys.path:
    sys.path.insert(0, str(ROOT / "src"))

from common import ROOT, jload, jsave

EXISTING_STYLE_IDS = [
    "motion_graphics", "perspective_3d", "cutout_collage",
    "blueprint", "swiss_poster", "isometric",
    "tech_glow", "cyber_terminal", "flat_vector", "cinematic_noir"
]
ENGINE_200_IDS = [f"s{i:03d}" for i in range(1, 201)]
THINKING_12_IDS = [f"t{i:02d}" for i in range(1, 13)]

ALL_STYLE_IDS = EXISTING_STYLE_IDS + ENGINE_200_IDS + THINKING_12_IDS
STYLE_IDS = ALL_STYLE_IDS

STYLE_HIST_FILE = ROOT / "data" / "style_history.json"
STYLE_CFG_FILE = ROOT / "config" / "style.json"
RECENT_STYLES_FILE = ROOT / "state" / "recent-styles.json"


def load_style_history():
    return jload(STYLE_HIST_FILE, [])


def save_style_history(history):
    jsave(STYLE_HIST_FILE, history)


def load_recent_styles():
    """Load the list of the last 10 style IDs from state/recent-styles.json."""
    if RECENT_STYLES_FILE.exists():
        try:
            data = jload(RECENT_STYLES_FILE, [])
            if isinstance(data, list):
                return [str(x) for x in data][-10:]
        except Exception:
            pass
    return []


def save_recent_styles(style_id):
    """Append style_id to state/recent-styles.json, keeping only the last 10."""
    RECENT_STYLES_FILE.parent.mkdir(parents=True, exist_ok=True)
    recents = load_recent_styles()
    recents.append(str(style_id))
    recents = recents[-10:]
    jsave(RECENT_STYLES_FILE, recents)
    return recents


def pick_style(history=None, cfg=None, rng=None, forced_style=None, recent_ids=None):
    """Pick a style that hasn't been used in the last N videos.
    Returns {"id": str, "variant": int, "seed": int}.
    """
    cfg = cfg or jload(STYLE_CFG_FILE, {})
    hist = history if history is not None else load_style_history()
    no_repeat = int(cfg.get("style_no_repeat_last", 10))
    forced = forced_style or cfg.get("style_fixed_id")

    if forced and forced in ALL_STYLE_IDS:
        sid = forced
    else:
        # Load from recent_ids or state/recent-styles.json or hist
        if recent_ids is not None:
            recents = list(recent_ids)[-no_repeat:]
        else:
            recents = load_recent_styles()
            if not recents:
                recents = [h.get("style_id") for h in hist[-no_repeat:] if isinstance(h, dict) and "style_id" in h]

        eligible = [s for s in ALL_STYLE_IDS if s not in recents]
        if not eligible:
            eligible = [s for s in ALL_STYLE_IDS if s != (recents[-1] if recents else None)]
        if not eligible:
            eligible = ALL_STYLE_IDS

        r = rng or random.SystemRandom()
        sid = r.choice(eligible)

    # Pick variant: avoid last variant used for this same style
    last_variant_for_style = None
    for h in reversed(hist):
        if isinstance(h, dict) and h.get("style_id") == sid and "variant" in h:
            last_variant_for_style = h.get("variant")
            break
    variants = [0, 1, 2] if sid in EXISTING_STYLE_IDS else [0, 1, 2, 3, 4]
    if last_variant_for_style is not None and len(variants) > 1:
        variants = [v for v in variants if v != last_variant_for_style]
    r2 = rng or random.SystemRandom()
    variant = r2.choice(variants)

    seed = (rng or random.SystemRandom()).randint(1, 10**9)

    return {"id": sid, "variant": variant, "seed": seed}


def record_style(style, book_title=""):
    """Append to style history and update state/recent-styles.json."""
    hist = load_style_history()
    entry = {
        "style_id": style["id"],
        "variant": style.get("variant", 0),
        "date": str(datetime.date.today()),
        "book": book_title
    }
    if "seed" in style:
        entry["seed"] = style["seed"]
    hist.append(entry)
    save_style_history(hist)

    # Also update state/recent-styles.json
    save_recent_styles(style["id"])

    return hist
