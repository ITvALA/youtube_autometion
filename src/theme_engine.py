"""Picks a unique look for every video and avoids repeating recent looks. Strictly 9:16 Reel format."""
import os, random, time
from common import ROOT, jload

PALETTES = [
    {"name": "Neon Night", "bg1": "#0B1020", "bg2": "#1B1464", "ac": "#00F5A0", "tx": "#FFFFFF", "cd": "rgba(255,255,255,0.10)"},
    {"name": "Crimson Impact", "bg1": "#120205", "bg2": "#2E080E", "ac": "#FF2A55", "tx": "#FFFFFF", "cd": "rgba(255,255,255,0.12)"},
    {"name": "Sunset Pop", "bg1": "#FF5F6D", "bg2": "#FFC371", "ac": "#1B1B3A", "tx": "#1B1B3A", "cd": "rgba(255,255,255,0.35)"},
    {"name": "Cyberpunk Cyan", "bg1": "#0D0221", "bg2": "#0F084B", "ac": "#00F0FF", "tx": "#FFFFFF", "cd": "rgba(255,255,255,0.12)"},
    {"name": "Gold Luxury", "bg1": "#141414", "bg2": "#262117", "ac": "#FFD700", "tx": "#FDFDFD", "cd": "rgba(255,255,255,0.10)"},
    {"name": "Ocean Deep", "bg1": "#0F4C75", "bg2": "#3282B8", "ac": "#FFD460", "tx": "#FFFFFF", "cd": "rgba(255,255,255,0.12)"},
    {"name": "Mint Paper", "bg1": "#D4F5E9", "bg2": "#8FE3C4", "ac": "#E4572E", "tx": "#0B3D2E", "cd": "rgba(255,255,255,0.50)"},
    {"name": "Violet Anime", "bg1": "#240046", "bg2": "#5A189A", "ac": "#FF9E00", "tx": "#FFFFFF", "cd": "rgba(255,255,255,0.15)"},
    {"name": "Forest Emerald", "bg1": "#0B3D2E", "bg2": "#1F7A5A", "ac": "#F4D35E", "tx": "#F1FAEE", "cd": "rgba(255,255,255,0.12)"},
    {"name": "Midnight Charcoal", "bg1": "#121417", "bg2": "#22272E", "ac": "#FF6B6B", "tx": "#F5F7FA", "cd": "rgba(255,255,255,0.10)"},
    {"name": "Electric Cobalt", "bg1": "#03045E", "bg2": "#0077B6", "ac": "#90E0EF", "tx": "#FFFFFF", "cd": "rgba(255,255,255,0.14)"},
    {"name": "Candy Pop", "bg1": "#FFB3C6", "bg2": "#FFE5EC", "ac": "#6A0572", "tx": "#3B0A45", "cd": "rgba(255,255,255,0.55)"},
]

FONTS = ["ArchivoBlack", "SpaceGrotesk", "Anton"]
LAYOUTS = ["center", "left"]
PATTERNS = ["grid", "dots", "rays", "diagonal"]
TRANSITIONS = ["wipe", "slide", "zoom", "flip"]
CHARTS = ["line", "area", "bars"]

# Strictly 9:16 Vertical Reel format (1080x1920)
FORMATS = {
    "vertical": (1080, 1920),
}

def _avoid(options, recent, rng):
    ok = [o for o in options if o not in recent]
    if not ok:
        last = recent[-1] if recent else None
        ok = [o for o in options if o != last] or list(options)
    return rng.choice(ok)

def pick_theme(book_title, allow_wide=False, history=None):
    history = jload(ROOT / "data" / "theme_history.json", []) if history is None else history
    # High entropy seed so every single video gets a fresh distinct theme
    seed = random.SystemRandom().randint(1, 10**9)
    rng = random.Random(seed)
    
    rec = lambda key, n: [h.get("theme", {}).get(key) for h in history[-n:] if isinstance(h.get("theme"), dict)]
    
    pal = _avoid([p["name"] for p in PALETTES], rec("palette", 8), rng)
    fmt = "vertical"  # 100% Reels / Shorts format
    
    return {
        "palette": pal,
        "colors": {k: v for k, v in next(p for p in PALETTES if p["name"] == pal).items() if k != "name"},
        "font": _avoid(FONTS, rec("font", 2), rng),
        "layout": _avoid(LAYOUTS, rec("layout", 2), rng),
        "pattern": _avoid(PATTERNS, rec("pattern", 2), rng),
        "transition": _avoid(TRANSITIONS, rec("transition", 2), rng),
        "chart": _avoid(CHARTS, rec("chart", 2), rng),
        "formatName": fmt,
        "format": {"name": fmt, "width": 1080, "height": 1920},
    }
