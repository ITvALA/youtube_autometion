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
    assert "story" in TYPES
    assert "character" in TYPES
    assert "emotion" in NEED["animeParallax"]
    assert "panel1Title" in NEED["motionComic"]
    assert "setting" in NEED["story"]
    assert "mood" in NEED["character"]

    # Test anime plan with style="anime"
    valid_anime_plan = {
        "youtube": {"title": "Master Your Focus in 3 Steps"},
        "scenes": [
            {"type": "hook", "narration": "Yeh video dekho.", "data": {"title": "STOP PROCRASTINATING"}},
            {"type": "animeParallax", "narration": "Jab aap focus karte ho toh game badal jata hai.", "data": {"title": "HYPER FOCUS", "emotion": "focus"}},
            {"type": "motionComic", "narration": "Purani aadat aur naye protocol me farak dekho.", "data": {"panel1Title": "OLD HABIT", "panel2Title": "NEW PROTOCOL"}},
            {"type": "quote", "narration": "Deep work is superpower.", "data": {"quote": "Focus is power"}}
        ]
    }
    err = validate(valid_anime_plan, style="anime")
    assert err is None

def test_story_style_validation():
    valid_story_plan = {
        "youtube": {"title": "Atomic Habits Story"},
        "scenes": [
            {"type": "hook", "narration": "Hook line.", "data": {"title": "TINY CHANGES"}},
            {"type": "story", "narration": "First story scene.", "data": {"setting": "mountains", "text": "Small steps"}},
            {"type": "story", "narration": "Second story scene.", "data": {"setting": "city", "text": "Huge compound"}},
            {"type": "card", "narration": "Final takeaway.", "data": {"lines": ["1% better every day"]}}
        ]
    }
    # Should pass for style="story"
    assert validate(valid_story_plan, style="story") is None

    # Should fail if style="story" has character scenes
    invalid_story_plan = dict(valid_story_plan)
    invalid_story_plan["scenes"] = [
        {"type": "hook", "narration": "Hook line.", "data": {"title": "TINY CHANGES"}},
        {"type": "story", "narration": "First story scene.", "data": {"setting": "mountains", "text": "Small steps"}},
        {"type": "character", "narration": "Character scene.", "data": {"mood": "happy", "text": "Hello"}},
        {"type": "card", "narration": "Final takeaway.", "data": {"lines": ["1% better every day"]}}
    ]
    err = validate(invalid_story_plan, style="story")
    assert err is not None
    assert "need at least 2 story scenes and no character scene" in err

def test_theme_engine_selection():
    theme = pick_theme("Deep Work", False, [])
    assert "palette" in theme
    assert "colors" in theme
    assert "bg1" in theme["colors"]
    assert "tx" in theme["colors"]
    assert "ac" in theme["colors"]
    assert "transition" in theme
    assert "formatName" in theme
