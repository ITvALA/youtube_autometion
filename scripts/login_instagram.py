"""One-time interactive Instagram login helper:
- Prompts for verification code in terminal and via Telegram bot
- Saves authenticated session to config/ig_session.json
- Once saved, all future reel uploads use this session without asking for code again!
"""
import os
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(ROOT / "src") not in sys.path:
    sys.path.insert(0, str(ROOT / "src"))

from common import ROOT, load_env
import instagram_upload

def main():
    load_env()
    username = os.environ.get("IG_USERNAME", "").strip()
    password = os.environ.get("IG_PASSWORD", "").strip()

    if not username or not password:
        print("❌ ERROR: IG_USERNAME or IG_PASSWORD not set in .env")
        return

    print("=" * 60)
    print(f"🔐 STARTING INSTAGRAM LOGIN FOR: {username}")
    print("=" * 60)
    print("ℹ️ If Instagram asks for a verification code (sent to your Gmail):")
    print("  -> You will receive a message on Telegram!")
    print("  -> Reply with the 6-digit code on Telegram OR enter it here.")
    print("=" * 60)

    try:
        cl = instagram_upload.get_ig_client()
        if cl:
            user_info = cl.user_info(cl.user_id)
            print("\n🎉 SUCCESS! Logged into Instagram successfully!")
            print(f"👤 Account: @{user_info.username} ({user_info.full_name})")
            print(f"💾 Session file saved: {instagram_upload.SESSION_PATH}")
            print("\n✅ All future uploads will now work automatically without login prompts!")
        else:
            print("❌ Login failed: Client returned None")
    except Exception as e:
        print(f"\n❌ Login failed with error: {e}")

if __name__ == "__main__":
    main()
