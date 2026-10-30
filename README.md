# MINDSPARK Studio (Remotion + Claude + GitHub Actions)

MindSpark is an automatic Hinglish book-summary YouTube Shorts / Reels studio.
Generates 1080x1920 vertical videos with 22 dynamic visual templates, automatic rotation, no-repeat memory, voiceover (edge-tts / elevenlabs), Remotion SVG/CSS animation, GitHub Actions cloud automation, and 1-click Telegram PASS/REJECT review.

---

## 🎨 22 Visual Video Templates (`config/templates.json`)
No two consecutive videos look the same! The pipeline automatically rotates across 22 distinct templates:

1. **`parallax_dawn`** — Parallax Dawn: warm mountain layers, rising sun, slow cinematic camera, big text.
2. **`neon_city_night`** — Neon City Night: glowing cyberpunk city skyline, illuminated windows, neon palette.
3. **`whisper_forest`** — Whisper Forest: serene pine forest silhouettes, floating fireflies, clean cards.
4. **`ocean_calm`** — Ocean Calm: layered ocean waves, horizon boat, sunset/teal palette.
5. **`starry_wisdom`** — Starry Wisdom: infinite night sky, glowing celestial moon, shooting stars.
6. **`spark_talk`** — Spark Talk: original mascot Spark narrates with animated speech bubbles.
7. **`spark_quiz`** — Spark Quiz: interactive test question with 3 options and animated reveal checkmark.
8. **`kinetic_burst`** — Kinetic Typography Burst: high-energy typography popping on the audio beat.
9. **`minimal_paper`** — Minimal Paper: light flat paper aesthetic, thin lines, clean cards, calm motion.
10. **`retro_terminal`** — Retro Terminal: monospace green/cyan console, typewriter text, blinking cursor, scanlines.
11. **`sticky_notes`** — Sticky Notes Board: colorful sticky notes pinned to a board with playful tilt/wobble.
12. **`comic_panels`** — Comic Panels: split manga/comic strip cells, halftone dots, bold action badges.
13. **`chalkboard_lesson`** — Chalkboard Lesson: vintage classroom chalkboard, chalk handwriting boxes and doodles.
14. **`timeline_journey`** — Timeline Journey: progression road with milestone nodes and traveling markers.
15. **`top_n_countdown`** — Top-N Countdown: big numbered ranking badges (`#3`, `#2`, `#1`) with sliding cards.
16. **`before_after`** — Before vs After: split screen comparison (old habit trap vs new protocol shift).
17. **`quote_poster`** — Quote Poster: editorial typographic poster with ornamental double border and author badge.
18. **`data_story`** — Data Story: compounding growth curves, radial dials, and metric spikes.
19. **`habit_tracker`** — Sunrise Habit Tracker: daily protocol checklist with animated checkmarks and streak badge.
20. **`cyber_glitch`** — Neon Glitch Cyber: futuristic digital grid with RGB chromatic aberration and data HUD.
21. **`paper_cut_layers`** — Paper-Cut Layers: multi-tier physical papercraft silhouettes with soft drop shadows.
22. **`gradient_flow`** — Gradient Flow: modern morphing gradient blobs behind sleek kinetic typography.

---

## ⚙️ How to Switch Template Modes (`config/style.json`)

Configure how templates are selected in `config/style.json`:

```json
{
  "template_mode": "random",
  "fixed_id": "parallax_dawn",
  "no_repeat_last": 7
}
```

* **`"template_mode": "random"`** *(Recommended)*:
  Weighted random pick across all enabled templates, strictly guaranteeing that **no template repeats within the last N videos** (default `no_repeat_last: 7`).
* **`"template_mode": "rotate"`**:
  Cycles through all 22 templates in sequential order based on history count.
* **`"template_mode": "fixed"`**:
  Always renders the specific template defined in `"fixed_id"` (e.g. `"retro_terminal"`).

---

## 📱 Strict 9:16 Vertical Video Rule (Hard Constraint)
* **Resolution**: All 22 templates and Remotion compositions are strictly locked to `1080x1920` (9:16 Shorts/Reels).
* **Safe Areas**: Key text is kept strictly inside the 9:16 safe zone (top 8% and bottom 14% clear of UI overlays).
* **ffprobe Verification**: Every rendered video is automatically checked with `ffprobe` prior to review or upload.

---

## 🚀 Running the Studio

### 1. Local Pipeline
```bash
# Generate video with automatic template selection
python src/daily_pipeline.py

# Force specific book or template
python src/daily_pipeline.py --book "Atomic Habits" --template "retro_terminal"

# Run tests
python -m pytest tests/
python src/test_templates.py
```

### 2. GitHub Actions (Cloud Automation)
* Workflows run automatically every hour (`Hourly Studio Reels`) in GitHub Actions.
* The generated 9:16 video is sent directly to your Telegram bot with **`[ 🚀 PASS & UPLOAD TO YOUTUBE ]`** and **`[ ❌ REJECT ]`** buttons.
* Tapping **PASS** immediately uploads the video to YouTube and replies with the live link!
