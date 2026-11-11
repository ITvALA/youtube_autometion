"""Instagram login + Reel upload with Telegram OTP support.

- Session file se login (config/ig_session.json); na ho to password se fresh login
- Instagram email/SMS code maange to Telegram pe message aata hai, 6-digit code reply karo
- Bot chal raha ho to bot.py code pakad ke submit_code() ko deta hai
- Bot na chal raha ho (ig_login.py script) to ye khud Telegram poll karta hai ya terminal se leta hai
"""
import os
import base64
import queue
import sys
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
SESSION_PATH = ROOT / "config" / "ig_session.json"

LAST_ERROR = None
BOT_LOOP_ACTIVE = False  # bot.py isko True kar deta hai
_code_queue = queue.Queue()
OTP_TIMEOUT = 300  # seconds


# ───────────── Telegram helpers ─────────────
def _tg_token():
    return os.environ.get("TELEGRAM_BOT_TOKEN", "").strip().strip('"').strip("'")


def _tg_chat():
    return str(os.environ.get("TELEGRAM_CHAT_ID", "")).strip().strip('"').strip("'")


def _tg_send(text):
    token, chat = _tg_token(), _tg_chat()
    if not token or not chat:
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{token}/sendMessage",
            data={"chat_id": chat, "text": text},
            timeout=15,
        )
    except Exception as e:
        print(f"[IG] Telegram send error: {e}")


def submit_code(code):
    """bot.py ka main loop 6-digit code aate hi isko call kare."""
    _code_queue.put(str(code).strip())


def _poll_telegram_for_code(deadline):
    """Sirf tab use hota hai jab bot loop active nahi (standalone login script)."""
    token, chat = _tg_token(), _tg_chat()
    if not token or not chat:
        return None
    base = f"https://api.telegram.org/bot{token}"
    offset = None
    try:  # purane messages skip
        r = requests.get(f"{base}/getUpdates", params={"timeout": 0}, timeout=15).json()
        res = r.get("result", [])
        if res:
            offset = res[-1]["update_id"] + 1
    except Exception:
        pass
    while time.time() < deadline:
        try:
            params = {"timeout": 20}
            if offset:
                params["offset"] = offset
            r = requests.get(f"{base}/getUpdates", params=params, timeout=30).json()
            for u in r.get("result", []):
                offset = u["update_id"] + 1
                m = u.get("message") or {}
                if str((m.get("chat") or {}).get("id")) != chat:
                    continue
                text = (m.get("text") or "").strip()
                if text.isdigit() and len(text) in (6, 8):
                    return text
        except Exception:
            time.sleep(3)
    return None


def _wait_for_code(reason):
    """Telegram pe code maange aur wait kare. Terminal available ho to wahan se bhi."""
    while not _code_queue.empty():  # purana code hatao
        try:
            _code_queue.get_nowait()
        except queue.Empty:
            break

    _tg_send(
        f"🔐 Instagram verification ({reason})\n"
        f"Email/SMS me aaya 6-digit code yahan reply karo. ({OTP_TIMEOUT // 60} min me)"
    )
    print(f"[IG] Verification code chahiye ({reason}). Telegram pe bhejo.")
    deadline = time.time() + OTP_TIMEOUT

    if BOT_LOOP_ACTIVE:
        try:
            return _code_queue.get(timeout=OTP_TIMEOUT)
        except queue.Empty:
            return None

    if sys.stdin and sys.stdin.isatty():
        import threading

        def _ask():
            try:
                c = input("Code yahan type karo (ya Telegram pe bhejo): ").strip()
                if c:
                    _code_queue.put(c)
            except Exception:
                pass

        threading.Thread(target=_ask, daemon=True).start()
        try:
            return _code_queue.get(timeout=OTP_TIMEOUT)
        except queue.Empty:
            return None
    return _poll_telegram_for_code(deadline)


# ───────────── Instagram client ─────────────
def _restore_session_from_env():
    b64 = os.environ.get("IG_SESSION_B64", "").strip()
    if b64 and not SESSION_PATH.exists():
        SESSION_PATH.parent.mkdir(parents=True, exist_ok=True)
        SESSION_PATH.write_bytes(base64.b64decode(b64))
        print("[IG] Session IG_SESSION_B64 se restore hua")


def _apply_app_version(cl):
    """Instagram 'version out of date' de to IG_APP_VERSION + IG_VERSION_CODE secrets se naya version set karo."""
    v = os.environ.get("IG_APP_VERSION", "").strip()
    c = os.environ.get("IG_VERSION_CODE", "").strip()
    if v and c:
        dev = dict(cl.device_settings)
        dev["app_version"] = v
        dev["version_code"] = c
        cl.set_device(dev)
        cl.set_user_agent()
        print(f"[IG] App version override: {v}")


def get_ig_client():
    global LAST_ERROR
    from instagrapi import Client
    from instagrapi.exceptions import TwoFactorRequired

    username = os.environ.get("IG_USERNAME", "").strip()
    password = os.environ.get("IG_PASSWORD", "").strip()
    if not username or not password:
        raise RuntimeError("IG_USERNAME / IG_PASSWORD set nahi hai")

    cl = Client()
    cl.delay_range = [1, 3]

    def challenge_code_handler(uname, choice):
        code = _wait_for_code(f"challenge: {choice}")
        if not code:
            raise RuntimeError("Instagram code time pe nahi mila")
        return code

    cl.challenge_code_handler = challenge_code_handler

    _restore_session_from_env()

    if SESSION_PATH.exists():
        try:
            cl.load_settings(SESSION_PATH)
            _apply_app_version(cl)
            cl.login(username, password)
            cl.get_timeline_feed()  # session valid hai ya nahi check
            cl.dump_settings(SESSION_PATH)
            print("[IG] Purane session se login OK")
            return cl
        except Exception as e:
            print(f"[IG] Session invalid ({e}). Fresh login karte hain...")
            old = cl.get_settings()
            cl = Client()
            cl.delay_range = [1, 3]
            cl.challenge_code_handler = challenge_code_handler
            cl.set_uuids(old.get("uuids", {}))  # same device rakho
            _apply_app_version(cl)

    _apply_app_version(cl)
    try:
        cl.login(username, password)
    except TwoFactorRequired:
        code = _wait_for_code("2FA")
        if not code:
            raise RuntimeError("2FA code time pe nahi mila")
        cl.login(username, password, verification_code=code)

    SESSION_PATH.parent.mkdir(parents=True, exist_ok=True)
    cl.dump_settings(SESSION_PATH)
    print(f"[IG] Naya session save hua: {SESSION_PATH}")
    _tg_send("✅ Instagram login ho gaya, session save ho gaya.")
    return cl


def upload_reel(video_path, meta=None, book_title=""):
    global LAST_ERROR
    LAST_ERROR = None
    meta = meta or {}
    try:
        cl = get_ig_client()
        title = meta.get("title") or book_title or Path(video_path).parent.name
        tags = meta.get("tags", [])
        hashtags = " ".join(f"#{t.replace(' ', '')}" for t in tags)
        caption = f"{title}\n\n{hashtags}".strip()
        media = cl.clip_upload(Path(video_path), caption)
        return f"https://www.instagram.com/reel/{media.code}/"
    except Exception as e:
        LAST_ERROR = str(e)
        print(f"[IG] Upload error: {e}")
        return None
