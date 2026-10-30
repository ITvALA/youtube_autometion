import os
import pytest
from pathlib import Path
from src.book_engine.book_researcher import book_researcher
from src.book_engine.script_synthesizer import script_synthesizer
from src.tts.voicebox_engine import voicebox_engine
from src.animation.paper_motion_engine import paper_motion_engine, get_theme_for_book
from src.daily_pipeline import daily_pipeline

def test_book_researcher_selection_and_exclusion():
    completed = book_researcher.get_completed_books()
    # Chanakya Neeti was seeded in completed_books.md
    assert any("chanakya" in c for c in completed)

    # Next fresh book should NOT be Chanakya Neeti
    fresh_book = book_researcher.select_next_fresh_book()
    assert "chanakya" not in fresh_book["english_title"].lower()
    assert len(fresh_book["chapters"]) >= 3

def test_script_synthesizer_5min_structure():
    book = {
        "title": "Atomic Habits (एटॉमिक हैबिट्स)",
        "english_title": "Atomic Habits",
        "author": "James Clear",
        "chapters": [
            {"chapter_no": 1, "title": "The Power of 1%", "hindi_title": "1% की शक्ति", "key_lesson": "Systems over goals"},
            {"chapter_no": 2, "title": "Identity Shift", "hindi_title": "पहचान बदलो", "key_lesson": "Identity"},
            {"chapter_no": 3, "title": "Environment", "hindi_title": "माहौल बदलो", "key_lesson": "Dopamine & cues"},
            {"chapter_no": 4, "title": "Two-Minute Rule", "hindi_title": "2-मिनट नियम", "key_lesson": "Easy start"},
            {"chapter_no": 5, "title": "Compounding", "hindi_title": "कम्पाउंडिंग", "key_lesson": "Patience"}
        ]
    }
    script = script_synthesizer.synthesize_5min_book_script(book)
    assert "sections" in script
    assert len(script["sections"]) == 5
    assert script["total_duration_minutes"] >= 4.0
    for sec in script["sections"]:
        assert len(sec["narration"]) > 50
        assert "headline" in sec

def test_voicebox_fallback():
    # If Voicebox is not running, is_voicebox_online returns False
    is_up = voicebox_engine.is_voicebox_online()
    assert isinstance(is_up, bool)

def test_pipeline_state_retrieval():
    state = daily_pipeline.get_current_review_state()
    # Can be None or a dict
    assert state is None or isinstance(state, dict)

def test_dynamic_animation_theme_variation():
    theme_wealth = get_theme_for_book("The Psychology of Money", "Wealth")
    theme_power = get_theme_for_book("The 48 Laws of Power", "Strategy")
    theme_focus = get_theme_for_book("Deep Work", "Productivity")
    theme_habits = get_theme_for_book("Atomic Habits", "Discipline")

    assert theme_wealth["id"] == "wealth"
    assert theme_power["id"] == "strategy"
    assert theme_focus["id"] == "focus"
    assert theme_habits["id"] == "psychology"

    # Verify colors and visuals are completely unique
    assert theme_wealth["bg_color"] != theme_power["bg_color"]
    assert theme_wealth["accent_color"] != theme_habits["accent_color"]
    assert theme_power["badge_icon"] != theme_focus["badge_icon"]

def test_fail_action_cleanup(tmp_path):
    from config.settings import BASE_DIR
    temp_dir = BASE_DIR / "data" / "temp_daily_run"
    temp_dir.mkdir(parents=True, exist_ok=True)
    dummy_file = temp_dir / "chapter_test.mp3"
    dummy_file.write_text("dummy audio")

    assert dummy_file.exists()
    res = daily_pipeline.execute_fail_action()
    assert res["status"] == "failed_and_discarded"
    assert not temp_dir.exists()
