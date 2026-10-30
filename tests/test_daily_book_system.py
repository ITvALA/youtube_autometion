import os
import pytest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

from src.daily_pipeline import pick_book
from src.llm import TYPES, NEED, validate
from src.theme_engine import pick_theme

def test_pick_book_selection():
    # Forced book selection
    forced = pick_book([], forced="Atomic Habits")
    assert forced["title"] == "Atomic Habits"

    # Default book from library
    book = pick_book([])
    assert "title" in book
    assert "author" in book

def test_anime_and_motion_comic_scene_validation():
    assert "animeParallax" in TYPES
    assert "motionComic" in TYPES
    assert "emotion" in NEED["animeParallax"]
    assert "panel1Title" in NEED["motionComic"]

    valid_plan = {
        "youtube": {"title": "Master Your Focus in 3 Steps"},
        "scenes": [
            {"type": "hook", "narration": "Yeh video dekho.", "data": {"title": "STOP PROCRASTINATING"}},
            {"type": "animeParallax", "narration": "Jab aap focus karte ho toh game badal jata hai.", "data": {"title": "HYPER FOCUS", "emotion": "focus"}},
            {"type": "motionComic", "narration": "Purani aadat aur naye protocol me farak dekho.", "data": {"panel1Title": "OLD HABIT", "panel2Title": "NEW PROTOCOL"}},
            {"type": "quote", "narration": "Deep work is superpower.", "data": {"quote": "Focus is power"}}
        ]
    }
    err = validate(valid_plan)
    assert err is None

def test_theme_engine_selection():
    theme = pick_theme("Deep Work", False, [])
    assert "palette" in theme
    assert "colors" in theme
    assert "bg1" in theme["colors"]
    assert "tx" in theme["colors"]
    assert "ac" in theme["colors"]
    assert "transition" in theme
    assert "formatName" in theme
