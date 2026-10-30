"""Picks a look for every video and avoids repeating recent looks."""
import hashlib, random, datetime
from common import ROOT, jload

PALETTES = [
 {"name":"Neon Night","bg1":"#0B1020","bg2":"#1B1464","ac":"#00F5A0","tx":"#FFFFFF","cd":"rgba(255,255,255,0.10)"},
 {"name":"Sunset Pop","bg1":"#FF5F6D","bg2":"#FFC371","ac":"#1B1B3A","tx":"#1B1B3A","cd":"rgba(255,255,255,0.35)"},
 {"name":"Ocean","bg1":"#0F4C75","bg2":"#3282B8","ac":"#FFD460","tx":"#FFFFFF","cd":"rgba(255,255,255,0.12)"},
 {"name":"Mint Paper","bg1":"#D4F5E9","bg2":"#8FE3C4","ac":"#E4572E","tx":"#0B3D2E","cd":"rgba(255,255,255,0.50)"},
 {"name":"Violet Pop","bg1":"#3A0CA3","bg2":"#F72585","ac":"#FFE066","tx":"#FFFFFF","cd":"rgba(255,255,255,0.14)"},
 {"name":"Forest","bg1":"#0B3D2E","bg2":"#1F7A5A","ac":"#F4D35E","tx":"#F1FAEE","cd":"rgba(255,255,255,0.12)"},
 {"name":"Graphite","bg1":"#1F2933","bg2":"#3E4C59","ac":"#FF6B6B","tx":"#F5F7FA","cd":"rgba(255,255,255,0.10)"},
 {"name":"Candy","bg1":"#FFB3C6","bg2":"#FFE5EC","ac":"#6A0572","tx":"#3B0A45","cd":"rgba(255,255,255,0.55)"},
]
FONTS = ["ArchivoBlack", "SpaceGrotesk", "Anton"]
LAYOUTS = ["center", "left"]
PATTERNS = ["grid", "dots", "rays", "diagonal"]
TRANSITIONS = ["wipe", "slide", "zoom", "flip"]
CHARTS = ["line", "area", "bars"]
FORMATS = {"vertical": (1080, 1920), "portrait": (1080, 1350), "square": (1080, 1080), "wide": (1920, 1080)}

def _avoid(options, recent, rng):
    ok = [o for o in options if o not in recent]
    if not ok:
        last = recent[-1] if recent else None
        ok = [o for o in options if o != last] or list(options)
    return rng.choice(ok)

def pick_theme(book_title, allow_wide=False, history=None):
    history = jload(ROOT / "data" / "theme_history.json", []) if history is None else history
    seed = int(hashlib.sha256((book_title + datetime.date.today().isoformat()).encode()).hexdigest(), 16)
    rng = random.Random(seed)
    rec = lambda key, n: [h["theme"][key] for h in history[-n:]]
    fmts = [f for f in FORMATS if allow_wide or f != "wide"]
    pal = _avoid([p["name"] for p in PALETTES], rec("palette", 6), rng)
    fmt = _avoid(fmts, rec("formatName", 3), rng)
    return {
        "palette": pal,
        "colors": {k: v for k, v in next(p for p in PALETTES if p["name"] == pal).items() if k != "name"},
        "font": _avoid(FONTS, rec("font", 2), rng),
        "layout": _avoid(LAYOUTS, rec("layout", 1), rng),
        "pattern": _avoid(PATTERNS, rec("pattern", 2), rng),
        "transition": _avoid(TRANSITIONS, rec("transition", 3), rng),
        "chart": _avoid(CHARTS, rec("chart", 2), rng),
        "formatName": fmt,
        "format": {"name": fmt, "width": FORMATS[fmt][0], "height": FORMATS[fmt][1]},
    }
