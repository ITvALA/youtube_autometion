"""Daily pipeline: book -> theme -> plan (Claude) -> voice+BGM -> Remotion -> final.mp4"""
import sys, re, random, shutil, argparse, datetime, subprocess, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from common import ROOT, load_env, jload, jsave
import theme_engine, llm, tts, audio, notify

HIST = ROOT / "data" / "theme_history.json"
slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def pick_book(history, forced=None):
    books = jload(ROOT / "data" / "books.json", [])
    if forced:
        return next((b for b in books if b["title"].lower() == forced.lower()), {"title": forced, "author": ""})
    cp = ROOT / "completed_books.md"
    done = cp.read_text(encoding="utf-8").lower() if cp.exists() else ""
    used = {h["book"].lower() for h in history}
    left = [b for b in books if b["title"].lower() not in done and b["title"].lower() not in used]
    if not left:
        raise SystemExit("No new books left. Add more to data/books.json")
    return random.choice(left)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--book")
    ap.add_argument("--headless", action="store_true", help="CI mode (kept for clarity; review happens via Telegram/artifact)")
    a = ap.parse_args()
    load_env()
    history = jload(HIST, [])
    cfg = jload(ROOT / "config" / "voice_config.json", {})
    book = pick_book(history, a.book)
    theme = theme_engine.pick_theme(book["title"], cfg.get("allow_wide", False), history)
    print("Book:", book["title"], "| Theme:", theme["palette"], theme["transition"], theme["formatName"])
    plan = llm.make_plan(book, [h["sceneTypes"] for h in history[-3:]])
    key = f"{datetime.date.today()}_{slug(book['title'])}"
    work, out = ROOT / "data" / "work" / key, ROOT / "data" / "output" / key
    out.mkdir(parents=True, exist_ok=True)
    voice = tts.narrate(plan["scenes"], work, cfg)
    total = sum(s["durationSec"] for s in plan["scenes"])
    audio.mix(voice, total, work / "audio.mp3")
    rp = {"book": book, "theme": theme, "scenes": plan["scenes"]}
    jsave(work / "plan.json", rp)
    silent = work / "silent.mp4"
    npx = shutil.which("npx.cmd") or shutil.which("npx") or "npx.cmd"
    subprocess.run([npx, "remotion", "render", "src/index.ts", "Main", str(silent), f"--props={(work / 'plan.json').resolve().as_posix()}"], cwd=ROOT / "remotion", check=True)
    final = out / "final.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", silent, "-i", work / "audio.mp3", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", final], check=True)
    y = plan["youtube"]
    jsave(out / "meta.json", {"book": book["title"], "title": y["title"], "description": y.get("description", ""), "tags": y.get("tags", []), "privacy": "private"})
    jsave(out / "plan.json", rp)
    history.append({"book": book["title"], "date": str(datetime.date.today()), "theme": theme, "sceneTypes": [s["type"] for s in plan["scenes"]]})
    jsave(HIST, history)
    shutil.rmtree(work, ignore_errors=True)
    notify.send(final, f"{y['title']}\n{theme['palette']} / {theme['transition']} / {theme['formatName']}")
    print("DONE:", final)

if __name__ == "__main__":
    main()
