"""Interactive Telegram Bot for MindSpark Studio:
- Instant feedback on PASS button click with live progress bar animation
- Live status updates during YouTube upload
- Auto-preloads pending videos in background into data/output/
- Zero-delay, multithreaded operation
"""
import os, sys, time, json, pathlib, requests, threading, subprocess, signal
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

active_uploads = 0
upload_lock = threading.Lock()
shutdown_requested = False

def sigterm_handler(signum, frame):
    global shutdown_requested
    print(f"🛑 Received signal {signum} (SIGTERM/SIGINT). Waiting for active uploads to finish...")
    shutdown_requested = True
    start_wait = time.time()
    while time.time() - start_wait < 180:
        with upload_lock:
            if active_uploads == 0:
                break
        print("⏳ Waiting for running YouTube upload to finish...")
        time.sleep(2)
    print("👋 Clean shutdown complete.")
    sys.exit(0)

try:
    signal.signal(signal.SIGTERM, sigterm_handler)
    signal.signal(signal.SIGINT, sigterm_handler)
except Exception:
    pass

def send_msg(chat_id, text, reply_markup=None):
    data = {"chat_id": chat_id, "text": text, "parse_mode": "Markdown"}
    if reply_markup:
        data["reply_markup"] = json.dumps(reply_markup)
    try:
        r = requests.post(f"{BASE_URL}/sendMessage", data=data, timeout=20)
        return r.json().get("result", {})
    except Exception as e:
        print(f"Error sending msg: {e}")
        return {}

def edit_msg(chat_id, message_id, text, reply_markup=None):
    data = {"chat_id": chat_id, "message_id": message_id, "text": text, "parse_mode": "Markdown"}
    if reply_markup:
        data["reply_markup"] = json.dumps(reply_markup)
    try:
        requests.post(f"{BASE_URL}/editMessageText", data=data, timeout=15)
    except Exception:
        pass

def edit_reply_markup(chat_id, message_id, reply_markup):
    try:
        requests.post(f"{BASE_URL}/editMessageReplyMarkup", json={
            "chat_id": chat_id,
            "message_id": message_id,
            "reply_markup": reply_markup
        }, timeout=15)
    except Exception:
        pass

def get_progress_bar(percent):
    clamped = max(0, min(100, int(percent)))
    filled = clamped // 10
    empty = 10 - filled
    return "▓" * filled + "░" * empty

def get_latest_output_dir():
    dirs = sorted([d for d in OUT_DIR.glob("*") if d.is_dir() and (d / "final.mp4").exists()], key=os.path.getmtime)
    return dirs[-1] if dirs else None

def download_video_from_telegram(file_id, target_dir):
    """Downloads video directly from Telegram servers into local target_dir."""
    target_dir.mkdir(parents=True, exist_ok=True)
    out_file = target_dir / "final.mp4"
    if out_file.exists() and out_file.stat().st_size > 500000:
        return True
    
    file_info = requests.get(f"{BASE_URL}/getFile?file_id={file_id}", timeout=30).json()
    if not file_info.get("ok"):
        raise RuntimeError(f"Failed to get file path from Telegram: {file_info.get('description')}")
    
    file_path = file_info["result"]["file_path"]
    download_url = f"https://api.telegram.org/file/bot{TOKEN}/{file_path}"
    
    with requests.get(download_url, stream=True, timeout=120) as r:
        r.raise_for_status()
        with open(out_file, "wb") as f:
            for chunk in r.iter_content(chunk_size=262144):
                if chunk:
                    f.write(chunk)
    return True

def background_video_sync():
    """Background worker that continuously pulls git updates and pre-downloads pending videos into data/output/."""
    last_git_pull = 0
    while True:
        try:
            now = time.time()
            if now - last_git_pull > 45:
                last_git_pull = now
                try:
                    subprocess.run(
                        ["git", "pull", "--rebase", "--autostash", "origin", "main"],
                        cwd=ROOT,
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL,
                        timeout=30
                    )
                except Exception:
                    pass

            if PENDING_FILE.exists():
                pending = jload(PENDING_FILE, {})
                dir_name = pending.get("dir_name")
                file_id = pending.get("file_id")
                meta = pending.get("meta", {})

                if dir_name and file_id:
                    target_dir = OUT_DIR / dir_name
                    target_file = target_dir / "final.mp4"
                    if not target_file.exists() or target_file.stat().st_size < 500000:
                        target_dir.mkdir(parents=True, exist_ok=True)
                        download_video_from_telegram(file_id, target_dir)
                        if meta and not (target_dir / "meta.json").exists():
                            jsave(target_dir / "meta.json", meta)
        except Exception:
            pass
        time.sleep(10)

def handle_pass_async(chat_id, target_dir_name=None, message_obj=None):
    """Handles upload in background thread with live animated progress bar."""
    global active_uploads
    with upload_lock:
        active_uploads += 1
    if target_dir_name:
        target_dir = OUT_DIR / target_dir_name
    else:
        target_dir = get_latest_output_dir()
    
    # 1. Immediate visual feedback: Update original video button
    orig_msg_id = message_obj.get("message_id") if message_obj else None
    if orig_msg_id:
        edit_reply_markup(chat_id, orig_msg_id, {
            "inline_keyboard": [[{"text": "⏳ Work in progress... ⚙️", "callback_data": "noop"}]]
        })

    # If not found locally on disk, download directly from Telegram message or pending_video.json
    if not target_dir or not (target_dir / "final.mp4").exists():
        video_obj = None
        caption_text = ""
        if message_obj:
            video_obj = message_obj.get("video")
            caption_text = message_obj.get("caption", "")
            if not video_obj and "reply_to_message" in message_obj:
                video_obj = message_obj["reply_to_message"].get("video")
                caption_text = message_obj["reply_to_message"].get("caption", "")

        file_id_to_use = video_obj.get("file_id") if video_obj else None
        
        if not file_id_to_use and PENDING_FILE.exists():
            pending = jload(PENDING_FILE, {})
            if not target_dir_name or pending.get("dir_name") == target_dir_name:
                file_id_to_use = pending.get("file_id")
                target_dir_name = target_dir_name or pending.get("dir_name")

        if file_id_to_use:
            dir_name = target_dir_name or f"reel_{int(time.time())}"
            target_dir = OUT_DIR / dir_name
            try:
                download_video_from_telegram(file_id_to_use, target_dir)
                if not (target_dir / "meta.json").exists():
                    lines = [l.strip() for l in caption_text.split("\n") if l.strip() and not l.startswith("🎬") and not l.startswith("👉")]
                    raw_title = lines[0] if lines else dir_name.replace("-", " ").title()
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

    # 2. Send Live Animated Progress Status Message
    status_text = (
        f"⚙️ *WORK IN PROGRESS: Uploading to YouTube*\n\n"
        f"📌 *Video:* `{target_dir.name}`\n"
        f"🎬 *Title:* {title}\n\n"
        f"📊 *Progress:* `[{get_progress_bar(10)}] 10%`\n"
        f"💬 *Status:* Connecting to YouTube Studio API..."
    )
    status_msg = send_msg(chat_id, status_text)
    status_msg_id = status_msg.get("message_id")

    # 3. Live Progress Callback (throttled to 1.5s to respect Telegram limits)
    last_update = [time.time()]
    def on_progress(pct):
        now = time.time()
        if (now - last_update[0] < 1.5) and pct < 100:
            return
        last_update[0] = now
        stage = "Uploading video chunks..." if pct < 85 else "Finalizing metadata & processing..."
        bar = get_progress_bar(pct)
        updated_text = (
            f"⚙️ *WORK IN PROGRESS: Uploading to YouTube*\n\n"
            f"📌 *Video:* `{target_dir.name}`\n"
            f"🎬 *Title:* {title}\n\n"
            f"📊 *Progress:* `[{bar}] {pct}%`\n"
            f"💬 *Status:* {stage}"
        )
        if status_msg_id:
            edit_msg(chat_id, status_msg_id, updated_text)

    # 4. Execute YouTube Upload
    try:
        on_progress(25)
        vid_id = youtube_upload.upload(target_dir, progress_callback=on_progress)
        on_progress(100)
        
        yt_url = f"https://youtu.be/{vid_id}" if vid_id and vid_id != "dry_run_video_id" else "Uploaded (Draft)"
        youtube_upload.append_completed_book(meta.get("book", target_dir.name), "", "Self Improvement", yt_url)
        
        # Git commit and push completed_books.md
        try:
            subprocess.run(["git", "config", "user.name", "studio-bot"], cwd=ROOT, check=False)
            subprocess.run(["git", "config", "user.email", "bot@users.noreply.github.com"], cwd=ROOT, check=False)
            subprocess.run(["git", "add", "completed_books.md"], cwd=ROOT, check=False)
            diff_res = subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=ROOT)
            if diff_res.returncode != 0:
                book_name = meta.get("book", target_dir.name)
                subprocess.run(
                    ["git", "commit", "-m", f"Record completed book: {book_name} [skip ci]"],
                    cwd=ROOT, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
                )
                subprocess.run(
                    ["git", "pull", "--rebase", "--autostash", "origin", "main"],
                    cwd=ROOT, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
                )
                subprocess.run(["git", "push", "origin", "main"], cwd=ROOT, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                print(f"✅ Successfully committed and pushed completed book record for '{book_name}'")
        except Exception as git_err:
            print(f"⚠️ Git push completed_books.md error: {git_err}")

        final_success_text = (
            f"🎉 *SUCCESS! Video is LIVE on YouTube!*\n\n"
            f"🎬 *Watch:* {yt_url}\n"
            f"📌 *Title:* {title}\n"
            f"📊 *Progress:* `[{get_progress_bar(100)}] 100% Complete` ✅"
        )
        if status_msg_id:
            edit_msg(chat_id, status_msg_id, final_success_text)
        else:
            send_msg(chat_id, final_success_text)

        # Update original video button with direct YouTube link
        if orig_msg_id and yt_url.startswith("http"):
            edit_reply_markup(chat_id, orig_msg_id, {
                "inline_keyboard": [[{"text": "🎬 Watch on YouTube ↗", "url": yt_url}]]
            })

    except Exception as e:
        err_msg = str(e)
        if "uploadLimitExceeded" in err_msg or "exceeded the number of videos" in err_msg:
            err_text = (
                "⚠️ *YouTube Daily Upload Limit Reached!*\n\n"
                "Aapke YouTube channel ki daily video upload limit aaj ke liye khatam ho chuki hai.\n\n"
                "📌 *Reason:* YouTube unverified/new channels par per day 5-10 videos ki limit rakhta hai.\n"
                "⏳ *Solution:* Yeh limit agle 24 ghante me auto-reset ho jayegi. Video safe hai, kal dobara *PASS* daba kar upload kar sakte hain!"
            )
        elif "quotaExceeded" in err_msg:
            err_text = (
                "⚠️ *YouTube API Quota Reached!*\n\n"
                "YouTube Data API ki daily 10,000 units quota limit reach ho chuki hai.\n"
                "Midnight PST par yeh auto-reset ho jayegi."
            )
        else:
            err_text = f"❌ *Upload Failed:*\n`{err_msg}`"
        print(f"❌ Upload error: {err_msg}")
        if status_msg_id:
            edit_msg(chat_id, status_msg_id, err_text)
        else:
            send_msg(chat_id, err_text)
    finally:
        with upload_lock:
            active_uploads -= 1

def handle_reject(chat_id, target_dir_name=None, message_obj=None):
    if message_obj and message_obj.get("message_id"):
        edit_reply_markup(chat_id, message_obj["message_id"], {
            "inline_keyboard": [[{"text": "❌ REJECTED", "callback_data": "noop"}]]
        })
    send_msg(chat_id, "❌ *Video marked as rejected.* It will not be uploaded to YouTube.")

def start_bot():
    if not TOKEN:
        print("Error: TELEGRAM_BOT_TOKEN not found in environment or .env file.")
        sys.exit(1)
        
    print("🚀 MindSpark Telegram Bot is online and listening!")
    
    # Start background pre-loader thread
    sync_thread = threading.Thread(target=background_video_sync, daemon=True)
    sync_thread.start()
    print("⚡ Auto-preload background sync active: videos save to output automatically on arrival.")

    offset = 0
    while not shutdown_requested:
        try:
            r = requests.get(f"{BASE_URL}/getUpdates", params={"offset": offset, "timeout": 30}, timeout=45)
            if r.status_code == 409:
                print("⚠️ Telegram 409 Conflict: Another bot instance is currently polling. Sleeping 5s before retrying...")
                time.sleep(5)
                continue
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
                    
                    print(f"📥 Callback query: '{cb_data}' from chat {sender_chat}")
                    if ALLOWED_CHAT and sender_chat.strip() != ALLOWED_CHAT:
                        print(f"⚠️ Ignored callback from unauthorized chat: {sender_chat} (expected {ALLOWED_CHAT})")
                        continue
                        
                    # Immediate instant feedback via toast notification
                    if cb_data.startswith("pass"):
                        requests.post(f"{BASE_URL}/answerCallbackQuery", json={
                            "callback_query_id": cb["id"],
                            "text": "🚀 Upload shuru ho gaya! Work in progress..."
                        })
                        dir_name = cb_data.split(":", 1)[1] if ":" in cb_data else None
                        threading.Thread(
                            target=handle_pass_async,
                            args=(sender_chat, dir_name, cb.get("message")),
                            daemon=True
                        ).start()
                    elif cb_data.startswith("reject"):
                        requests.post(f"{BASE_URL}/answerCallbackQuery", json={
                            "callback_query_id": cb["id"],
                            "text": "❌ Video rejected."
                        })
                        dir_name = cb_data.split(":", 1)[1] if ":" in cb_data else None
                        threading.Thread(
                            target=handle_reject,
                            args=(sender_chat, dir_name, cb.get("message")),
                            daemon=True
                        ).start()
                    else:
                        requests.post(f"{BASE_URL}/answerCallbackQuery", json={"callback_query_id": cb["id"]})
                    continue

                # 2. Handle Text Messages
                msg = update.get("message", {})
                text = msg.get("text", "").strip()
                sender_chat = str(msg.get("chat", {}).get("id", ""))
                
                if not text:
                    continue
                print(f"💬 Text message: '{text}' from chat {sender_chat}")
                if ALLOWED_CHAT and sender_chat.strip() != ALLOWED_CHAT:
                    print(f"⚠️ Ignored text message from unauthorized chat: {sender_chat} (expected {ALLOWED_CHAT})")
                    continue
                
                cmd = text.lower()
                if cmd in ("/start", "/help"):
                    send_msg(sender_chat, (
                        "👋 *Welcome to MindSpark Studio Bot!*\n\n"
                        "*Commands:*\n"
                        "• Tap *PASS* button — Turant YouTube par video upload karein.\n"
                        "• Tap *REJECT* button — Video ko discard karein.\n"
                        "• Send `pass` or `/pass` — Latest video ko upload karein."
                    ))
                elif cmd in ("/pass", "pass", "upload", "y", "yes"):
                    threading.Thread(target=handle_pass_async, args=(sender_chat, None, msg), daemon=True).start()
                elif cmd in ("/reject", "reject", "no", "n"):
                    threading.Thread(target=handle_reject, args=(sender_chat, None, msg), daemon=True).start()
                elif cmd in ("/status", "status"):
                    target_dir = get_latest_output_dir()
                    if target_dir:
                        meta = jload(target_dir / "meta.json", {})
                        send_msg(sender_chat, f"📹 *Latest Local Video:* {meta.get('title', target_dir.name)}\n📁 Folder: `{target_dir.name}`\n👉 Tap PASS on the video to upload.")
                    else:
                        send_msg(sender_chat, "ℹ️ No local video found in output. Tap PASS on any video in chat to upload it to YouTube!")
        except Exception as e:
            time.sleep(2)

if __name__ == "__main__":
    start_bot()
