"""Instagram Reels uploader using instagrapi.
- Session persistence (config/ig_session.json)
- Login challenge: code Telegram pe maanga jaata hai (tum reply me 6-digit code bhejte ho)
- Optional: IG_TOTP_SECRET (authenticator 2FA) set ho to code bot khud banata hai
"""

import os
import sys
import json
import time
import threading
import subprocess
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
SESSION_PATH = Path(os.environ.get("IG_SESSION_PATH") or (ROOT / "config" / "ig_session.json"))

# Last error text (bot isko Telegram message me dikhata hai)
LAST_ERROR = None

# ───────── Telegram se verification code lene ka shared state ─────────
_code_event = threading.Event()
_code_box = {"value": None, "waiting": False}


def is_waiting_for_code():
    """Bot ka main loop isse check karta hai ki Instagram code maang raha hai ya nahi."""
    return _code_box["waiting"]


def provide_code(code):
    """Bot ka main loop yahan user ka bheja hua code deta hai."""
    _code_box["value"] = str(code).strip()
    _code_event.set()


def _tg_send(text):
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip().strip('"').strip("'")
    chat = str(os.environ.get("TELEGRAM_CHAT_ID", "")).strip().strip('"').strip("'")
    if not token or not chat:
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            data={"chat_id": chat, "text": text},
            timeout=20,
        )
    except Exception as e:
        print(f"[Instagram] Telegram message failed: {e}")


def telegram_code_handler(username, choice):
    """instagrapi challenge handler: Telegram pe code maangta hai, 5 min wait karta hai."""
    _code_event.clear()
    _code_box["value"] = None
    _code_box["waiting"] = True
    _tg_send(
        f"🔐 Instagram ({username}) verification code maang raha hai.\n"
        f"Code email/SMS me aaya hoga ({choice}). 6-digit code yahan reply me bhejo.\n"
        f"Time: 5 minute."
    )
    got = _code_event.wait(300)
    _code_box["waiting"] = False
    if got and _code_box["value"]:
        return _code_box["value"]
    _tg_send("⏰ Instagram code time par nahi mila, login cancel.")
    return ""


def _totp_code():
    seed = os.environ.get("IG_TOTP_SECRET", "").replace(" ", "").strip()
    if not seed:
        return ""
    try:
        import pyotp
        return pyotp.TOTP(seed).now()
    except Exception as e:
        print(f"[Instagram] TOTP generate failed: {e}")
        return ""


def _login(cl, username, password):
    from instagrapi.exceptions import TwoFactorRequired, ChallengeRequired
    code = _totp_code()
    if code:
        try:
            cl.login(username, password, verification_code=code)
            return
        except Exception as e:
            print(f"[Instagram] TOTP login failed ({e}), trying normal flow...")

    try:
        cl.login(username, password)
    except TwoFactorRequired:
        print("[Instagram] 2FA/Gmail verification code required! Asking user on Telegram...")
        code = telegram_code_handler(username, "Gmail / SMS 2FA Code")
        if code:
            cl.login(username, password, verification_code=code)
        else:
            raise RuntimeError("Instagram verification code was not provided in time.")
    except ChallengeRequired:
        print("[Instagram] Security challenge required! Asking user on Telegram...")
        code = telegram_code_handler(username, "Gmail Security Checkpoint Code")
        if code:
            cl.login(username, password, verification_code=code)
        else:
            raise RuntimeError("Instagram challenge code was not provided in time.")


def get_ig_client():
    from instagrapi import Client

    username = os.environ.get("IG_USERNAME", "").strip()
    password = os.environ.get("IG_PASSWORD", "").strip()

    if not username or not password:
        print("[Instagram] IG_USERNAME or IG_PASSWORD not set in environment.")
        return None

    cl = Client()
    cl.delay_range = [1, 3]
    cl.challenge_code_handler = telegram_code_handler

    SESSION_PATH.parent.mkdir(parents=True, exist_ok=True)

    logged_in = False
    if SESSION_PATH.exists():
        try:
            print(f"[Instagram] Loading saved session from {SESSION_PATH}...")
            cl.load_settings(SESSION_PATH)
            _login(cl, username, password)
            cl.get_timeline_feed()  # session valid hai ya nahi
            logged_in = True
            print("[Instagram] Logged in via saved session!")
        except Exception as se:
            print(f"[Instagram] Saved session expired/invalid ({se}). Re-authenticating...")
            # Same device ids rakho, baaki session saaf (Instagram ko naya device na lage)
            old_uuids = cl.get_settings().get("uuids")
            cl.set_settings({})
            if old_uuids:
                cl.set_uuids(old_uuids)

    if not logged_in:
        print(f"[Instagram] Logging in as '{username}'...")
        _login(cl, username, password)
        print("[Instagram] Fresh login OK")

    cl.dump_settings(SESSION_PATH)
    print(f"[Instagram] Session saved to {SESSION_PATH}")
    return cl


def generate_reel_caption(meta, book_title=None):
    title = meta.get("title") or book_title or "Inspiring Book Wisdom"
    desc = meta.get("description", "")

    # Clean up markdown asterisks
    clean_title = title.replace("*", "").strip()
    clean_desc = desc.replace("*", "").strip()

    caption = (
        f"📖 {clean_title}\n\n"
        f"{clean_desc}\n\n"
        f"━━━━━━━━━━━━━━━\n"
        f"💾 Save this Reel for later reminder!\n"
        f"❤️ Share with someone who needs this today.\n"
        f"🔔 Follow @mindspark for daily book summaries & wisdom.\n\n"
        f"#MindSpark #BookSummary #HindiQuotes #ReelsIndia #Motivation #SelfImprovement "
        f"#PersonalGrowth #HindiMotivation #BookLovers #DailyWisdom #LifeLessons #Shorts"
    )
    return caption[:2100]


def upload_reel(video_path, meta=None, book_title=None, progress_callback=None):
    """Uploads final.mp4 as an Instagram Reel.

    Returns the reel URL on success, or None on skip/failure (reason: LAST_ERROR).
    """
    global LAST_ERROR
    LAST_ERROR = None

    video_path = Path(video_path)
    if not video_path.exists():
        LAST_ERROR = f"Video not found: {video_path}"
        print(f"[Instagram] {LAST_ERROR}")
        return None

    meta = meta or {}
    caption = generate_reel_caption(meta, book_title)

    try:
        if progress_callback:
            progress_callback(10)

        cl = get_ig_client()
        if not cl:
            LAST_ERROR = "IG_USERNAME/IG_PASSWORD set nahi hain"
            print("[Instagram] Skipping Instagram upload (credentials not configured).")
            return None

        if progress_callback:
            progress_callback(40)

        # Generate thumbnail using ffmpeg to avoid MoviePy requirement
        thumb_path = video_path.with_suffix(".jpg")
        if not thumb_path.exists():
            try:
                subprocess.run([
                    "ffmpeg", "-y", "-ss", "00:00:01", "-i", str(video_path),
                    "-vframes", "1", "-q:v", "2", str(thumb_path)
                ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=False)
            except Exception as e:
                print(f"[Instagram] Thumbnail extraction warning: {e}")

        print(f"[Instagram] Uploading reel: {video_path.name} ({video_path.stat().st_size / (1024*1024):.2f} MB)...")
        media = cl.clip_upload(
            path=str(video_path),
            caption=caption,
            thumbnail=str(thumb_path) if thumb_path.exists() else None
        )

        try:
            cl.dump_settings(SESSION_PATH)
        except Exception:
            pass

        if progress_callback:
            progress_callback(100)

        reel_code = getattr(media, "code", None)
        reel_url = f"https://www.instagram.com/reel/{reel_code}/" if reel_code else "https://www.instagram.com/"
        print(f"[Instagram] ✅ Successfully uploaded Reel! URL: {reel_url}")
        return reel_url

    except Exception as e:
        LAST_ERROR = str(e)
        print(f"[Instagram] ❌ Error uploading reel: {e}")
        return None


if __name__ == "__main__":
    if len(sys.argv) > 1:
        target = Path(sys.argv[1])
        v_path = target if target.is_file() else target / "final.mp4"
        m_path = target / "meta.json" if target.is_dir() else target.parent / "meta.json"
        meta_data = {}
        if m_path.exists():
            try:
                meta_data = json.loads(m_path.read_text(encoding="utf-8"))
            except Exception:
                pass
        res = upload_reel(v_path, meta=meta_data)
        print("Result:", res)
    else:
        print("Usage: python src/instagram_upload.py <path_to_video_or_dir>")
