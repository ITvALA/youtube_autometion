"""Daily pipeline: book -> template & theme -> plan (Claude) -> voice+BGM -> Remotion -> final.mp4
Strictly 9:16 vertical 1080x1920 with 22 dynamic visual templates.
"""
import os, sys, re, random, shutil, argparse, datetime, subprocess, pathlib
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