import random
import pytest
from src.style_engine import STYLE_IDS, pick_style, record_style
from src.llm import validate, normalize

def test_style_ids_count():
    assert len(STYLE_IDS) == 10
    expected = [
        "motion_graphics", "perspective_3d", "cutout_collage", "blueprint", "swiss_poster", "isometric",
        "tech_glow", "cyber_terminal", "flat_vector", "cinematic_noir"
    ]
    assert set(STYLE_IDS) == set(expected)

def test_10_simulated_runs_no_repeat_within_last_4():
    """Verify that 10 consecutive simulated runs never repeat within last 4."""
    history = []
    cfg = {"style_no_repeat_last": 4}
    rng = random.Random(12345)

    for i in range(10):
        style = pick_style(history=history, cfg=cfg, rng=rng)
        sid = style["id"]
        variant = style["variant"]

        # Check: never in last 4
        recent_4 = [h["style_id"] for h in history[-4:]]
        assert sid not in recent_4, f"Run {i}: {sid} repeated in last 4 ({recent_4})"

        # Check: never same variant as last video of that same style
        last_variant = None
        for h in reversed(history):
            if h["style_id"] == sid:
                last_variant = h["variant"]
                break
        if last_variant is not None:
            assert variant != last_variant, f"Run {i}: variant {variant} repeated for style {sid}"

        history.append({
            "style_id": sid,
            "variant": variant,
            "seed": style["seed"],
            "date": "2026-10-31",
            "book": f"Book {i}"
        })

def test_30_simulated_runs():
    """Run 30 times with varying RNG seeds to ensure robust no-repeat behaviour."""
    history = []
    cfg = {"style_no_repeat_last": 4}
    rng = random.Random(999)

    for i in range(30):
        style = pick_style(history=history, cfg=cfg, rng=rng)
        recent_4 = [h["style_id"] for h in history[-4:]]
        assert style["id"] not in recent_4

        last_variant = None
        for h in reversed(history):
            if h["style_id"] == style["id"]:
                last_variant = h["variant"]
                break
        if last_variant is not None:
            assert style["variant"] != last_variant

        history.append({
            "style_id": style["id"],
            "variant": style["variant"],
            "seed": style["seed"],
            "date": "2026-10-31",
            "book": f"Book {i}"
        })

def test_forced_style():
    cfg = {"style_no_repeat_last": 4, "style_fixed_id": "blueprint"}
    st = pick_style(history=[], cfg=cfg)
    assert st["id"] == "blueprint"

    st_arg = pick_style(history=[], cfg={"style_no_repeat_last": 4}, forced_style="isometric")
    assert st_arg["id"] == "isometric"

def test_style_mode_plan_validation():
    valid_plan = {
        "youtube": {"title": "Mastering Habits 10x Faster"},
        "scenes": [
            {"type": "hook", "narration": "Roz sirf 1 percent behtar.", "data": {"title": "1 PERCENT RULE"}},
            {"type": "dial", "narration": "Yeh chaar niyam follow karo.", "data": {"center": "SYSTEM", "items": ["Cue", "Craving", "Response", "Reward"]}},
            {"type": "timeline", "narration": "Steps by step aage badho.", "data": {"milestones": ["Day 1", "Day 30", "Day 365"]}},
            {"type": "card", "narration": "Focus on identity over outcome.", "data": {"lines": ["Identity shift", "Daily reps", "System first"]}},
            {"type": "quote", "narration": "Yeh baat hamesha yaad rakhna.", "data": {"quote": "Consistency beats intensity.", "by": "James Clear"}}
        ]
    }
    # Should pass in style mode
    err = validate(valid_plan, style_mode=True)
    assert err is None

    # Forbidden scenes in style mode
    forbidden_plan = dict(valid_plan)
    forbidden_plan["scenes"] = list(valid_plan["scenes"])
    forbidden_plan["scenes"][2] = {"type": "curve", "narration": "compounding graph", "data": {"label": "37x"}}
    assert validate(forbidden_plan, style_mode=True) is not None

    story_plan = dict(valid_plan)
    story_plan["scenes"] = list(valid_plan["scenes"])
    story_plan["scenes"][1] = {"type": "story", "narration": "parallax landscape", "data": {"text": "A long journey"}}
    assert validate(story_plan, style_mode=True) is not None

    # Style mode skips template recipe validation
    dummy_template = {
        "id": "recipe_tester",
        "scene_recipe": ["hook", "quiz", "kineticBurst", "card"]
    }
    # With style_mode=True, doesn't enforce quiz or kineticBurst
    assert validate(valid_plan, template=dummy_template, style_mode=True) is None

    # 4 scenes in style mode must fail (requires 5 or 6)
    short_plan = {
        "youtube": {"title": "Short Plan"},
        "scenes": valid_plan["scenes"][:4]
    }
    assert validate(short_plan, style_mode=True) is not None

def test_normalization_limits_titles_and_lines():
    raw_plan = {
        "youtube": {"title": "Atomic Habits Summary"},
        "scenes": [
            {"type": "hook", "narration": "Hook line narration.", "data": {"title": "THIS TITLE HAS WAY TOO MANY WORDS TO BE SHORT"}},
            {"type": "card", "narration": "Card narration.", "data": {"lines": [
                "This is line 1 with more than eight words that should be truncated",
                "Line 2 is okay",
                "Line 3",
                "Line 4",
                "Line 5 which exceeds max 4 lines and should be dropped"
            ]}}
        ]
    }
    norm = normalize(raw_plan)
    hook_words = norm["scenes"][0]["data"]["title"].split()
    assert len(hook_words) <= 4

    card_lines = norm["scenes"][1]["data"]["lines"]
    assert len(card_lines) <= 4
    for line in card_lines:
        assert len(line.split()) <= 8

