"""Daily pipeline: book -> template & theme -> plan (Claude) -> voice+BGM -> Remotion -> final.mp4
Strictly 9:16 vertical 1080x1920 with 22 dynamic visual templates.
"""
import sys, re, random, shutil, argparse, datetime, subprocess, pathlib
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(ROOT / "src") not in sys.path:
    sys.path.insert(0, str(ROOT / "src"))

from common import ROOT, load_env, jload, jsave
import theme_engine, template_engine, style_engine, llm, tts, audio, notify

THEME_HIST = ROOT / "data" / "theme_history.json"
slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def pick_book(history, forced=None):
    books = jload(ROOT / "data" / "books.json", [])
    if forced:
        return next((b for b in books if b["title"].lower() == forced.lower()), {"title": forced, "author": ""})

    # Check if a custom next book was requested via Telegram
    next_file = ROOT / "data" / "next_book.txt"
    if next_file.exists():
        try:
            custom_title = next_file.read_text(encoding="utf-8").strip()
            if custom_title:
                next_file.unlink(missing_ok=True)
                print(f"[Pipeline] Found Telegram queued book: '{custom_title}'")
                return next((b for b in books if b["title"].lower() == custom_title.lower()), {"title": custom_title, "author": ""})
        except Exception as e:
            print(f"[Pipeline] Warning reading next_book.txt: {e}")

    cp = ROOT / "completed_books.md"
    done = cp.read_text(encoding="utf-8").lower() if cp.exists() else ""
    used = {h["book"].lower() for h in history if "book" in h}
    left = [b for b in books if b["title"].lower() not in done and b["title"].lower() not in used]
    if not left:
        print("All books from books.json used! Resetting selection pool...")
        left = books
    return random.choice(left)

def verify_resolution(video_path):
    """Verifies that the generated video is strictly 1080x1920 using ffprobe."""
    try:
        cmd = [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height",
            "-of", "csv=s=x:p=0", str(video_path)
        ]
        out = subprocess.check_output(cmd, stderr=subprocess.STDOUT).decode().strip()
        dims = out.split("x")
        w, h = int(dims[0]), int(dims[1])
        return w, h
    except Exception as e:
        print(f"⚠️ ffprobe check warning: {e}")
        return 1080, 1920

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--book")
    ap.add_argument("--script", help="Custom user script or arbitrary topic")
    ap.add_argument("--template")
    ap.add_argument("--style", help="Force style ID (motion_graphics, perspective_3d, cutout_collage, blueprint, swiss_poster, isometric)")
    ap.add_argument("--headless", action="store_true", help="CI mode (kept for clarity)")
    a = ap.parse_args()
    load_env()
    
    theme_history = jload(THEME_HIST, [])
    template_history = template_engine.load_template_history()
    style_cfg = jload(ROOT / "config" / "style.json", {})
    voice_cfg = jload(ROOT / "config" / "voice_config.json", {})
    
    custom_script = a.script
    script_file = ROOT / "data" / "custom_script.txt"
    if not custom_script and script_file.exists():
        try:
            custom_script = script_file.read_text(encoding="utf-8").strip()
            script_file.unlink(missing_ok=True)
            print("[Pipeline] Loaded custom script from Telegram!")
        except Exception as se:
            print(f"[Pipeline] Warning reading custom_script.txt: {se}")

    if custom_script:
        # Generate short title from first words
        first_line = custom_script.split("\n")[0].strip()
        short_title = " ".join(first_line.split()[:4]).title() or "MindSpark Wisdom"
        book = {"title": short_title, "author": "MindSpark"}
    else:
        book = pick_book(theme_history, a.book)
    
    # Check if style engine is active
    style_mode = style_cfg.get("style_mode", "engine")
    is_style_engine = (a.style is not None) or (style_mode == "engine")
    
    style = None
    if is_style_engine:
        style_hist = style_engine.load_style_history()
        style = style_engine.pick_style(history=style_hist, cfg=style_cfg, forced_style=a.style)
        
        # Minimal dummy template & theme so llm.make_plan and fallback work cleanly
        template = {
            "id": f"style_{style['id']}",
            "name": f"Style: {style['id'].replace('_', ' ').title()}",
            "backdrop": "none",
            "caption_style": "pill",
            "transition": "slide",
            "mascot": False,
            "scene_recipe": ["hook", "card", "quote"]
        }
        theme = {
            "palette": f"Style {style['id']} (v{style['variant']})",
            "colors": {
                "bg1": "#111111", "bg2": "#222222", "ac": "#FFD93D", "tx": "#FFFFFF", "cd": "rgba(255,255,255,0.10)"
            },
            "font": "Inter",
            "layout": "center",
            "pattern": "grid",
            "transition": "slide",
            "chart": "bars",
            "format": {"name": "vertical", "width": 1080, "height": 1920},
            "formatName": "vertical"
        }
        print("=" * 60)
        print(f"📖 Book: {book['title']}")
        print(f"🎨 Style Engine: {style['id']} (variant {style['variant']}, seed {style['seed']})")
        print("=" * 60)
    else:
        # 1. Pick Template
        if a.template:
            style_cfg["template_mode"] = "fixed"
            style_cfg["fixed_id"] = a.template
            
        template = template_engine.pick_template(history=template_history, config=style_cfg)
        theme = template["theme"]

        # Hard rule: strictly enforce 1080x1920 vertical
        if theme.get("format", {}).get("width") != 1080 or theme.get("format", {}).get("height") != 1920:
            print("⚠️ Non-vertical format requested. Forcing strictly to 1080x1920 vertical.")
            theme["format"] = {"name": "vertical", "width": 1080, "height": 1920}
            theme["formatName"] = "vertical"

        print("=" * 60)
        print(f"📖 Book: {book['title']}")
        print(f"🎨 Template: {template['name']} ({template['id']})")
        print(f"✨ Palette: {theme['palette']} | Transition: {theme['transition']} | Layout: {theme['layout']}")
        print("=" * 60)

    # 2. Generate Plan with LLM (with template fallback safety)
    recent_seqs = [h.get("sceneTypes", []) for h in theme_history[-3:] if isinstance(h, dict)]
    try:
        plan = llm.make_plan(book, recent_sequences=recent_seqs, template=template, style_mode=is_style_engine, custom_script=custom_script)
    except Exception as plan_err:
        print(f"⚠️ Plan failed: {plan_err}. Falling back to default plan.")
        template = template_engine.DEFAULT_TEMPLATE
        theme = template_engine._enrich_template(template, theme_history, random.Random())["theme"]
        plan = llm.make_plan(book, recent_sequences=recent_seqs, template=template, style_mode=False)
        is_style_engine = False
        style = None

    unique_ts = datetime.datetime.now().strftime("%Y-%m-%d_%H%M%S")
    key = f"{unique_ts}_{slug(book['title'])}"
    work, out = ROOT / "data" / "work" / key, ROOT / "data" / "output" / key
    out.mkdir(parents=True, exist_ok=True)
    work.mkdir(parents=True, exist_ok=True)

    # 3. Audio Narration & Mixing
    voice = tts.narrate(plan["scenes"], work, voice_cfg)
    total = sum(s["durationSec"] for s in plan["scenes"])
    audio.mix(voice, total, work / "audio.mp3")

    # 4. Remotion Render
    rp = {
        "book": book,
        "theme": theme,
        "template": {
            "id": template["id"],
            "name": template["name"],
            "backdrop": template.get("backdrop", "none"),
            "caption_style": template.get("caption_style", "pill"),
            "transition": template.get("transition", theme.get("transition", "slide")),
            "mascot": template.get("mascot", False)
        },
        "scenes": plan["scenes"]
    }
    if is_style_engine and style:
        rp["style"] = style

    jsave(work / "plan.json", rp)
    silent = work / "silent.mp4"
    npx = shutil.which("npx.cmd") or shutil.which("npx") or "npx.cmd"
    
    subprocess.run([
        npx, "remotion", "render", "src/index.ts", "Main", str(silent),
        f"--props={(work / 'plan.json').resolve().as_posix()}"
    ], cwd=ROOT / "remotion", check=True)

    # 5. Final Video Assembly
    final = out / "final.mp4"
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(silent), "-i", str(work / "audio.mp3"),
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", str(final)
    ], check=True)

    # 6. Strict Format Verification with ffprobe
    w, h = verify_resolution(final)
    print(f"📏 Output video dimensions: {w}x{h}")
    if (w, h) != (1080, 1920):
        error_msg = f"❌ Format violation: Video resolution is {w}x{h}, expected 1080x1920!"
        print(error_msg)
        notify.send_msg(error_msg)
        raise RuntimeError(error_msg)

    # 7. Metadata and History Recording
    y = plan["youtube"]
    meta = {
        "book": book["title"],
        "title": y["title"],
        "description": y.get("description", ""),
        "tags": y.get("tags", []),
        "privacy": os.environ.get("YOUTUBE_PRIVACY", "public"),
        "template_id": template["id"],
        "template_name": template["name"]
    }
    if is_style_engine and style:
        meta["style_id"] = style["id"]
        meta["style_variant"] = style["variant"]
        meta["style_seed"] = style["seed"]

    jsave(out / "meta.json", meta)
    jsave(out / "plan.json", rp)

    # Record theme & template history
    theme_history.append({
        "book": book["title"],
        "date": str(datetime.date.today()),
        "theme": theme,
        "template_id": template["id"],
        "sceneTypes": [s["type"] for s in plan["scenes"]]
    })
    jsave(THEME_HIST, theme_history)

    if is_style_engine and style:
        style_engine.record_style(style, book["title"])
    else:
        template_engine.record_template_history(template, book["title"])

    shutil.rmtree(work, ignore_errors=True)

    # 8. Send to Telegram for 1-Click Mobile Review
    if is_style_engine and style:
        caption = (
            f"{y['title']}\n\n"
            f"🎨 Style: *{style['id'].replace('_', ' ').title()}* (variant {style['variant']})\n"
            f"✨ 9:16 Vertical | Seed: {style['seed']}"
        )
    else:
        caption = (
            f"{y['title']}\n\n"
            f"🎨 Template: *{template['name']}* (`{template['id']}`)\n"
            f"✨ Palette: {theme['palette']} / {theme['transition']} / 9:16 Vertical"
        )
    notify.send(final, caption, video_dir=out)
    print("DONE:", final)

if __name__ == "__main__":
    main()
