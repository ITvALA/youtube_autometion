"""Generates demo plans for each of the 22 templates in data/demo_plan_<template_id>.json."""
import sys, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(ROOT / "src") not in sys.path:
    sys.path.insert(0, str(ROOT / "src"))

from common import ROOT, jload, jsave
import template_engine

SAMPLE_BOOK = {"title": "Atomic Habits", "author": "James Clear"}

SCENE_MOCK_DATA = {
    "hook": {"title": "1% BETTER EVERYDAY", "sub": "Atomic Habits, James Clear"},
    "story": {"setting": "mountains", "text": "Systems dictate your trajectory", "hl": "Systems", "tag": "RULE 1"},
    "character": {"mood": "determined", "prop": "book", "text": "Identity drives habits!"},
    "animeParallax": {"title": "MASSIVE SHIFT", "emotion": "focus", "badge": "ATOMIC"},
    "motionComic": {"panel1Title": "OLD WAY", "panel1Subtitle": "Distraction loop", "panel2Title": "NEW PROTOCOL", "panel2Subtitle": "2-minute rule"},
    "quiz": {"question": "What produces 37x compounding?", "options": ["A) Working 18 hrs", "B) 1% daily gain", "C) Luck"], "correct": 1},
    "kineticBurst": {"text": "SMALL HABITS COMPOUND FAST", "hl": "COMPOUND", "tag": "RULE 2"},
    "paper": {"title": "Core System Rule", "points": ["Make cue obvious", "Make craving attractive", "Make response easy"]},
    "terminal": {"command": "atomic.exec()", "lines": ["LOAD: Tiny Gains", "LOOP: Consistent execution", "STATUS: 37x Compounding [OK]"]},
    "stickyNotes": {"notes": [{"text": "Cue Trigger", "color": "#FEF08A", "rot": -2}, {"text": "Make it obvious", "color": "#FBCFE8", "rot": 2.5}]},
    "comicPanels": {"panel1Title": "THE TRAP", "panel1Subtitle": "Motivation only", "panel2Title": "THE SYSTEM", "panel2Subtitle": "Frictionless setup"},
    "chalkboard": {"title": "ATOMIC LAWS", "items": ["1. Make it obvious", "2. Make it attractive", "3. Make it easy"]},
    "timeline": {"milestones": ["1. Cue Trigger", "2. Craving Desire", "3. Immediate Reward"]},
    "countdown": {"rank": "#1", "title": "SYSTEM > GOALS", "sub": "Goals set direction, systems make progress"},
    "beforeAfter": {"before": "Relying on sheer willpower", "after": "Designing environment for focus"},
    "quotePoster": {"quote": "You do not rise to the level of your goals. You fall to the level of your systems.", "by": "James Clear"},
    "habitTracker": {"streak": "30 DAY STREAK", "habits": ["Read 10 Pages", "45-min Deep Work", "Morning Sunlight"]},
    "cyberGlitch": {"text": "HACK YOUR ENVIRONMENT", "tag": "IDENTITY"},
    "paperCut": {"title": "Depth Over Noise", "desc": "Optimize for long-term consistency over short bursts."},
    "gradientFlow": {"text": "MOMENTUM ENGINE", "sub": "Action produces motivation, not vice versa."},
    "curve": {"up": 1.01, "down": 0.99, "label": "37x", "labelDown": "0.03x"},
    "dial": {"center": "4 LAWS", "items": ["Obvious", "Attractive", "Easy", "Satisfying"]},
    "card": {"lines": ["Tiny changes lead to remarkable results", "Focus on identity instead of outcomes", "Design environment to make good habits default"]},
    "quote": {"quote": "Every action you take is a vote for the type of person you wish to become.", "by": "James Clear"}
}

def generate_demo_plans():
    templates = template_engine.load_templates()
    print(f"Generating demo plans for {len(templates)} templates...")
    
    out_dir = ROOT / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    generated = []

    for t in templates:
        tid = t["id"]
        enriched = template_engine._enrich_template(t, [], None)
        recipe = t.get("scene_recipe", ["hook", "card", "quote"])
        
        scenes = []
        for s_type in recipe:
            words = [{"w": w, "s": i * 0.4, "e": (i + 1) * 0.4} for i, w in enumerate("This is a demo caption for testing".split())]
            data = SCENE_MOCK_DATA.get(s_type, {"text": "Default Insight"})
            scenes.append({
                "type": s_type,
                "narration": "Ye ek atomic habits ka powerful lesson hai jo aapki zindagi badal dega.",
                "durationSec": 2.5,
                "words": words,
                "data": data
            })

        plan = {
            "book": SAMPLE_BOOK,
            "theme": enriched["theme"],
            "template": {
                "id": t["id"],
                "name": t["name"],
                "backdrop": t.get("backdrop", "none"),
                "caption_style": t.get("caption_style", "pill"),
                "transition": t.get("transition", "slide"),
                "mascot": t.get("mascot", False)
            },
            "scenes": scenes,
            "youtube": {
                "title": f"{SAMPLE_BOOK['title']} | {t['name']} Shorts",
                "description": f"Master lessons from {SAMPLE_BOOK['title']} with {t['name']}.",
                "tags": ["shorts", "mindspark", t["id"]]
            }
        }

        file_path = out_dir / f"demo_plan_{tid}.json"
        jsave(file_path, plan)
        generated.append(file_path)

    print(f"✅ Generated {len(generated)} demo plans in {out_dir}/")
    return generated

if __name__ == "__main__":
    generate_demo_plans()
