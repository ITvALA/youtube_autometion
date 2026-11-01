"""Interactive Telegram Bot for MindSpark Studio:
- Instant feedback on PASS button click with live progress bar animation
- Live status updates during YouTube upload
- Auto-preloads pending videos in background into data/output/
- Zero-delay, multithreaded operation
- Videos >20MB: GitHub Actions artifact se download (Telegram getFile limit bypass)
"""
import os, sys, time, json, pathlib, requests, threading, subprocess, signal, zipfile
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
import youtube_upload

load_env()
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip().strip('"').strip("'")
ALLOWED_CHAT = str(os.environ.get("TELEGRAM_CHAT_ID", "")).strip().strip('"').strip("'")
BASE_URL = f"https://api.telegram.org/bot{TOKEN}"
OUT_DIR = ROOT / "data" / "output"
PENDING_FILE = ROOT / "data" / "pending_video.json"

# NEW: GitHub artifact download config
GH_TOKEN = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
REPO = "ITvALA/youtube_autometion"

active_uploads = 0