"""Interactive Telegram Bot for MindSpark Studio:
- Receives video directly as streamable MP4 (no zip!)
- Automatically downloads video if generated in cloud (GitHub Actions)
- Tap 'PASS' or text 'pass' to upload immediately to YouTube
- Real-time status notifications
"""
import os, sys, time, json, pathlib, requests
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
TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
ALLOWED_CHAT = str(os.environ.get("TELEGRAM_CHAT_ID", ""))
BASE_URL = f"https://api.telegram.org/bot{TOKEN}"
OUT_DIR = ROOT / "data" / "output"

def send_msg(chat_id, text, reply_markup=None):
    data = {"chat_id": chat_id, "text": text, "parse_mode": "Markdown"}
    if reply_markup:
        data["reply_markup"] = json.dumps(reply_markup)
    try:
        requests.post(f"{BASE_URL}/sendMessage", data=data, timeout=20)
    except Exception as e:
        print(f"Error sending msg: {e}")

def get_latest_output_dir():
    dirs = sorted([d for d in OUT_DIR.glob("*") if d.is_dir() and (d / "final.mp4").exists()], key=os.path.getmtime)
    return dirs[-1] if dirs else None

def download_video_from_telegram(file_id, target_dir):
    """Downloads video directly from Telegram servers into local target_dir."""
    target_dir.mkdir(parents=True, exist_ok=True)
    out_file = target_dir / "final.mp4"
    if out_file.exists() and out_file.stat().st_size > 100000:
        return True
    
    file_info = requests.get(f"{BASE_URL}/getFile?file_id={file_id}", timeout=30).json()
    if not file_info.get("ok"):
        raise RuntimeError(f"Failed to get file path from Telegram: {file_info.get('description')}")
    
    file_path = file_info["result"]["file_path"]
    download_url = f"https://api.telegram.org/file/bot{TOKEN}/{file_path}"
    
    with requests.get(download_url, stream=True, timeout=300) as r:
        r.raise_for_status()
        with open(out_file, "wb") as f:
            for chunk in r.iter_content(chunk_size=131072):
                if chunk:
                    f.write(chunk)
    return True

def handle_pass(chat_id, target_dir_name=None, message_obj=None):
    if target_dir_name:
        target_dir = OUT_DIR / target_dir_name
    else:
        target_dir = get_latest_output_dir()
    
    # If not found locally on disk, download directly from Telegram message!
    if not target_dir or not (target_dir / "final.mp4").exists():
        video_obj = None
        caption_text = ""
        if message_obj:
            video_obj = message_obj.get("video")
            caption_text = message_obj.get("caption", "")
            if not video_obj and "reply_to_message" in message_obj:
                video_obj = message_obj["reply_to_message"].get("video")
                caption_text = message_obj["reply_to_message"].get("caption", "")

        if video_obj and video_obj.get("file_id"):
            dir_name = target_dir_name or f"reel_{int(time.time())}"
            target_dir = OUT_DIR / dir_name
            send_msg(chat_id, "⏳ *Fetching cloud video from Telegram...*")
            try:
                download_video_from_telegram(video_obj["file_id"], target_dir)
                
                # Build metadata from caption if meta.json doesn't exist
                if not (target_dir / "meta.json").exists():
                    lines = [l.strip() for l in caption_text.split("\n") if l.strip() and not l.startswith("🎬") and not l.startswith("👉")]
                    raw_title = lines[0] if lines else dir_name.replace("-", " ").title()
                    # Clean title
                    clean_title = raw_title.replace("*", "").strip()[:90]
                    meta = {
                        "book": clean_title,
                        "title": clean_title,
                        "description": caption_text or clean_title,
                        "tags": ["shorts", "reels", "motivation", "books", "mindspark"],
                        "privacy": "public"
                    }
                    jsave(target_dir / "meta.json", meta)
            except Exception as dl_err:
                send_msg(chat_id, f"❌ *Download Failed:*\n`{str(dl_err)}`")
                return
        else:
            send_msg(chat_id, "⚠️ No pending video found. Please tap the *PASS* button directly on the video message.")
            return

    meta = jload(target_dir / "meta.json", {})
    title = meta.get("title", target_dir.name)
    send_msg(chat_id, f"⏳ *Uploading to YouTube...*\n📌 *Title:* {title}\nPlease wait ~30-60 seconds.")
    
    try:
        vid_id = youtube_upload.upload(target_dir)
        yt_url = f"https://youtu.be/{vid_id}" if vid_id and vid_id != "dry_run_video_id" else "Uploaded (Draft)"
        youtube_upload.append_completed_book(meta.get("book", target_dir.name), "", "Self Improvement", yt_url)
        send_msg(chat_id, f"🎉 *SUCCESS! Video is LIVE on YouTube!*\n\n🎬 *Watch:* {yt_url}\n📌 *Title:* {title}")
    except Exception as e:
        send_msg(chat_id, f"❌ *Upload Failed:*\n`{str(e)}`")

def handle_reject(chat_id, target_dir_name=None):
    send_msg(chat_id, "❌ *Video marked as rejected.* It will not be uploaded to YouTube.")

def start_bot():
    if not TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN not found in environment or .env file.")
        sys.exit(1)
        
    print("🚀 MindSpark Telegram Bot is online and listening!")
    offset = 0
    while True:
        try:
            r = requests.get(f"{BASE_URL}/getUpdates", params={"offset": offset, "timeout": 30}, timeout=45)
            if not r.ok:
                time.sleep(3)
                continue
            data = r.json()
            for update in data.get("result", []):
                offset = update["update_id"] + 1
                
                # 1. Handle Inline Button Clicks
                if "callback_query" in update:
                    cb = update["callback_query"]
                    cb_data = cb.get("data", "")
                    sender_chat = str(cb["message"]["chat"]["id"])
                    
                    if ALLOWED_CHAT and sender_chat != ALLOWED_CHAT:
                        continue
                        
                    requests.post(f"{BASE_URL}/answerCallbackQuery", json={"callback_query_id": cb["id"]})
                    
                    if cb_data.startswith("pass"):
                        dir_name = cb_data.split(":", 1)[1] if ":" in cb_data else None
                        handle_pass(sender_chat, dir_name, message_obj=cb.get("message"))
                    elif cb_data.startswith("reject"):
                        dir_name = cb_data.split(":", 1)[1] if ":" in cb_data else None
                        handle_reject(sender_chat, dir_name)
                    continue

                # 2. Handle Text Messages
                msg = update.get("message", {})
                text = msg.get("text", "").strip()
                sender_chat = str(msg.get("chat", {}).get("id", ""))
                
                if not text:
                    continue
                if ALLOWED_CHAT and sender_chat != ALLOWED_CHAT:
                    continue
                
                cmd = text.lower()
                if cmd in ("/start", "/help"):
                    send_msg(sender_chat, (
                        "👋 *Welcome to MindSpark Studio Bot!*\n\n"
                        "Har roz naya 9:16 vertical Reel video yahan send hoga.\n\n"
                        "*Commands:*\n"
                        "• Tap *PASS* button — Turant YouTube par video upload karein.\n"
                        "• Tap *REJECT* button — Video ko discard karein.\n"
                        "• Send `pass` or `/pass` — Latest video ko upload karein."
                    ))
                elif cmd in ("/pass", "pass", "upload", "y", "yes"):
                    handle_pass(sender_chat, message_obj=msg)
                elif cmd in ("/reject", "reject", "no", "n"):
                    handle_reject(sender_chat)
                elif cmd in ("/status", "status"):
                    target_dir = get_latest_output_dir()
                    if target_dir:
                        meta = jload(target_dir / "meta.json", {})
                        send_msg(sender_chat, f"📹 *Latest Local Video:* {meta.get('title', target_dir.name)}\n📁 Folder: `{target_dir.name}`\n👉 Tap PASS on the video to upload.")
                    else:
                        send_msg(sender_chat, "ℹ️ No local video found. Tap PASS on any video in chat to upload it to YouTube!")
        except Exception as e:
            time.sleep(2)

if __name__ == "__main__":
    start_bot()
