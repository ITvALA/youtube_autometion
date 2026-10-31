"""Instagram Reels uploader using instagrapi.
Handles session persistence, auto-caption generation with viral hashtags,
and error handling so it can run autonomously on PASS action.
"""

import os
import sys
import json
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def get_ig_client():
    from instagrapi import Client

    username = os.environ.get("IG_USERNAME", "").strip()
    password = os.environ.get("IG_PASSWORD", "").strip()

    if not username or not password:
        print("[Instagram] IG_USERNAME or IG_PASSWORD not set in environment.")
        return None

    cl = Client()
    cl.delay_range = [1, 3]

    session_path = ROOT / "config" / "ig_session.json"
    session_path.parent.mkdir(parents=True, exist_ok=True)

    logged_in = False
    if session_path.exists():
        try:
            print(f"[Instagram] Loading saved session from {session_path}...")
            cl.load_settings(session_path)
            cl.login(username, password)
            logged_in = True
            print("[Instagram] Logged in via saved session!")
        except Exception as se:
            print(f"[Instagram] Saved session expired/invalid ({se}). Re-authenticating...")

    if not logged_in:
        print(f"[Instagram] Logging in as '{username}'...")
        cl.login(username, password)
        cl.dump_settings(session_path)
        print(f"[Instagram] Session saved to {session_path}")

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

    Returns the reel URL on success, or None on skip/failure.
    """
    video_path = Path(video_path)
    if not video_path.exists():
        print(f"[Instagram] Video not found: {video_path}")
        return None

    meta = meta or {}
    caption = generate_reel_caption(meta, book_title)

    try:
        if progress_callback:
            progress_callback(10)

        cl = get_ig_client()
        if not cl:
            print("[Instagram] Skipping Instagram upload (credentials not configured).")
            return None

        if progress_callback:
            progress_callback(40)

        print(f"[Instagram] Uploading reel: {video_path.name} ({video_path.stat().st_size / (1024*1024):.2f} MB)...")
        media = cl.clip_upload(
            path=str(video_path),
            caption=caption
        )

        if progress_callback:
            progress_callback(100)

        reel_code = getattr(media, "code", None)
        reel_url = f"https://www.instagram.com/reel/{reel_code}/" if reel_code else "https://www.instagram.com/"
        print(f"[Instagram] ✅ Successfully uploaded Reel! URL: {reel_url}")
        return reel_url

    except Exception as e:
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

