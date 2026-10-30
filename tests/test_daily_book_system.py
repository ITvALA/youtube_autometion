import os
import pytest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from src.daily_pipeline import pick_book
from src.llm import TYPES, NEED, validate
from src.theme_engine import pick_theme
import src.template_engine as template_engine

def test_pick_book_selection():
    forced = pick_book([], forced="Atomic Habits")
    assert forced["title"] == "Atomic Habits"

    book = pick_book([])
    assert "title" in book
    assert "author" in book

def test_all_22_templates_loaded():
    templates = template_engine.load_templates()
    assert len(templates) == 22
    for t in templates:
        assert "id" in t
        assert "name" in t
        assert "scene_recipe" in t
        assert "palette_family" in t
        assert "weight" in t
        assert t.get("enabled", True) is True

def test_template_engine_modes():
    # Fixed mode
    t_fixed = template_engine.pick_template(config={"template_mode": "fixed", "fixed_id": "retro_terminal"})
    assert t_fixed["id"] == "retro_terminal"
    assert t_fixed["theme"]["format"]["width"] == 1080
    assert t_fixed["theme"]["format"]["height"] == 1920

    # Rotate mode
    t_rot0 = template_engine.pick_template(history=[], config={"template_mode": "rotate"})
    t_rot1 = template_engine.pick_template(history=[{"template_id": t_rot0["id"]}], config={"template_mode": "rotate"})
    assert t_rot0["id"] != t_rot1["id"]

    # Random mode with no_repeat_last
    hist = [{"template_id": "parallax_dawn"}, {"template_id": "neon_city_night"}]
    t_rand = template_engine.pick_template(history=hist, config={"template_mode": "random", "no_repeat_last": 2})
    assert t_rand["id"] not in ("parallax_dawn", "neon_city_night")

def test_new_scene_types_in_llm_registry():
    new_types = [
        "quiz", "kineticBurst", "paper", "terminal", "stickyNotes", "comicPanels",
        "chalkboard", "timeline", "countdown", "beforeAfter", "quotePoster",
        "habitTracker", "cyberGlitch", "paperCut", "gradientFlow"
    ]
    for nt in new_types:
        assert nt in TYPES, f"Missing {nt} in TYPES"
        assert nt in NEED, f"Missing {nt} in NEED"

def test_template_recipe_plan_validation():
    # Test valid plan matching spark_quiz recipe
    t_quiz = next(t for t in template_engine.load_templates() if t["id"] == "spark_quiz")
    quiz_plan = {
        "youtube": {"title": "Pop Quiz On Atomic Habits"},
        "scenes": [
            {"type": "hook", "narration": "Yeh video dekho.", "data": {"title": "WHICH HABIT WINS"}},
            {"type": "quiz", "narration": "Option A ya Option B?", "data": {"question": "What brings 37x growth?", "options": ["A", "B", "C"]}},
            {"type": "card", "narration": "System beats goals.", "data": {"lines": ["Make cue obvious", "Make craving attractive"]}},
            {"type": "quote", "narration": "Final wisdom quote.", "data": {"quote": "Every action is a vote for who you want to be."}}
        ]
    }
    err = validate(quiz_plan, template=t_quiz)
    assert err is None

def test_theme_engine_selection():
    theme = pick_theme("Deep Work", False, [])
    assert "palette" in theme
    assert "colors" in theme
    assert "bg1" in theme["colors"]
    assert "tx" in theme["colors"]
    assert "ac" in theme["colors"]
    assert "transition" in theme
    assert theme["format"]["width"] == 1080
    assert theme["format"]["height"] == 1920
