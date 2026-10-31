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

    # 4. Independent Upload Execution (YouTube & Instagram decoupled)
    yt_url = None
    yt_err = None
    ig_url = None
    ig_err = None

    # --- 4A. YouTube Upload ---
    try:
        on_progress(20)
        vid_id = youtube_upload.upload(target_dir, progress_callback=on_progress)
        on_progress(50)
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

    except Exception as e:
        yt_err = str(e)
        print(f"[YouTube Upload Error]: {yt_err}")

    # --- 4B. Instagram Upload (Runs even if YouTube failed!) ---
    if os.environ.get("IG_USERNAME"):
        try:
            if status_msg_id:
                edit_msg(chat_id, status_msg_id, (
                    f"⚙️ *WORK IN PROGRESS: Uploading to Instagram*\n\n"
                    f"📌 *Video:* `{target_dir.name}`\n"
                    f"🎬 *Title:* {title}\n\n"
                    f"📊 *Progress:* `[{get_progress_bar(70)}] 70%`\n"
                    f"💬 *Status:* Publishing Reel to Instagram..."
                ))
            import instagram_upload
            ig_url = instagram_upload.upload_reel(
                target_dir / "final.mp4",
                meta=meta,
                book_title=meta.get("book", target_dir.name)
            )
            if not ig_url:
                ig_err = "Upload skipped or returned empty URL"
        except Exception as ig_e:
            ig_err = str(ig_e)
            print(f"[Instagram Upload Error]: {ig_err}")

    # --- 5. Construct Status Notification ---
    lines = []
    if yt_url:
        lines.append(f"✅ *YouTube Shorts:* {yt_url}")
    elif yt_err:
        if "uploadLimitExceeded" in yt_err or "exceeded the number of videos" in yt_err:
            lines.append("⚠️ *YouTube:* Daily upload limit reached (resets in 24h)")
        elif "quotaExceeded" in yt_err:
            lines.append("⚠️ *YouTube:* Daily API quota reached")
        else:
            lines.append(f"❌ *YouTube Error:* `{yt_err[:120]}`")

    if ig_url:
        lines.append(f"✅ *Instagram Reel:* {ig_url}")
    elif os.environ.get("IG_USERNAME") and ig_err:
        lines.append(f"⚠️ *Instagram Error:* `{ig_err[:120]}`")

    # Overall header
    if yt_url or ig_url:
        header = "🎉 *SUCCESS! Video Published!*\n\n"
    else:
        header = "❌ *Upload Failed on both platforms!*\n\n"

    final_status_text = (
        f"{header}"
        + "\n".join(lines) + "\n\n"
        f"📌 *Title:* {title}\n"
        f"📊 *Status:* Completed"
    )

    if status_msg_id:
        edit_msg(chat_id, status_msg_id, final_status_text)
    else:
        send_msg(chat_id, final_status_text)

    # Update original video buttons with direct links
    action_buttons = []
    if orig_msg_id:
        if yt_url and yt_url.startswith("http"):
            action_buttons.append({"text": "🎬 YouTube ↗", "url": yt_url})
        if ig_url and ig_url.startswith("http"):
            action_buttons.append({"text": "📸 Instagram ↗", "url": ig_url})
        if action_buttons:
            edit_reply_markup(chat_id, orig_msg_id, {
                "inline_keyboard": [action_buttons]
            })
    with upload_lock:
        active_uploads -= 1

def handle_reject(chat_id, target_dir_name=None, message_obj=None):
    if message_obj and message_obj.get("message_id"):
        edit_reply_markup(chat_id, message_obj["message_id"], {
            "inline_keyboard": [[{"text": "❌ REJECTED", "callback_data": "noop"}]]
        })
    send_msg(chat_id, "❌ *Video marked as rejected.* It will not be uploaded to YouTube.")


def git_sync_changes(commit_msg):
    try:
        subprocess.run(["git", "config", "user.name", "studio-bot"], cwd=ROOT, check=False)
        subprocess.run(["git", "config", "user.email", "bot@users.noreply.github.com"], cwd=ROOT, check=False)
        subprocess.run(["git", "add", "data/books.json", "data/next_book.txt"], cwd=ROOT, check=False)
        diff_res = subprocess.run(["git", "diff", "--cached", "--quiet"], cwd=ROOT)
        if diff_res.returncode != 0:
            subprocess.run(["git", "commit", "-m", f"{commit_msg} [skip ci]"], cwd=ROOT, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.run(["git", "pull", "--rebase", "--autostash", "origin", "main"], cwd=ROOT, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            subprocess.run(["git", "push", "origin", "main"], cwd=ROOT, check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"[Git Sync] {commit_msg} pushed to main.")
    except Exception as ge:
        print(f"[Git Sync Error]: {ge}")

def trigger_workflow_make_video(book_name):
    next_file = ROOT / "data" / "next_book.txt"
    next_file.write_text(book_name, encoding="utf-8")
    git_sync_changes(f"Queue next book: {book_name}")
    
    gh_token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if gh_token:
        try:
            headers = {
                "Authorization": f"Bearer {gh_token}",
                "Accept": "application/vnd.github.v3+json"
            }
            url = "https://api.github.com/repos/ITvALA/youtube_autometion/actions/workflows/daily.yml/dispatches"
            r = requests.post(url, headers=headers, json={"ref": "main", "inputs": {"force": True, "book": book_name}}, timeout=10)
            if r.status_code in (204, 200, 201):
                return True
            else:
                print(f"[GH Trigger] API response {r.status_code}: {r.text}")
        except Exception as ge:
            print(f"[GH Trigger Error]: {ge}")
    return False

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
                
                raw_cmd = text.strip()
                cmd_lower = raw_cmd.lower()

                # Help menu: triggered by -h, /h, -/h, /help, help
                if cmd_lower in ("/help", "/h", "-h", "-/h", "help", "/start", "h"):
                    help_text = (
                        "📚 *MindSpark Video & Book Controller* 🎬\n\n"
                        "Aap yahan se books aur video generation direct control kar sakte hain:\n\n"
                        "1️⃣ *Naya Video Banane Ke Liye:*\n"
                        "• `/make <Book Name>` — Is book par naya video banana start karein\n"
                        "  _Example:_ `/make Bhagavad Gita`\n\n"
                        "2️⃣ *Nayi Book Jodne Ke Liye:*\n"
                        "• `/add <Book Name>` — books.json me nayi book save karein\n"
                        "  _Example:_ `/add Ikigai`\n\n"
                        "3️⃣ *Book Nikalne / Delete Karne Ke Liye:*\n"
                        "• `/del <Book Name>` — books.json se book delete karein\n"
                        "  _Example:_ `/del Range`\n\n"
                        "4️⃣ *Available Books Dekhne Ke Liye:*\n"
                        "• `/list` ya `/books` — Saari books ki list dekhein\n\n"
                        "5️⃣ *Review & Publish:*\n"
                        "• `/pass` — Video YouTube & Instagram par publish karein\n"
                        "• `/reject` — Video discard karein\n"
                        "• `/status` — Current status check karein"
                    )
                    send_msg(sender_chat, help_text)

                elif cmd_lower in ("/pass", "pass", "upload", "y", "yes"):
                    threading.Thread(target=handle_pass_async, args=(sender_chat, None, msg), daemon=True).start()

                elif cmd_lower in ("/reject", "reject", "no", "n"):
                    threading.Thread(target=handle_reject, args=(sender_chat, None, msg), daemon=True).start()

                elif cmd_lower in ("/status", "status"):
                    target_dir = get_latest_output_dir()
                    next_file = ROOT / "data" / "next_book.txt"
                    queued_book = next_file.read_text(encoding="utf-8").strip() if next_file.exists() else "None (Automatic)"
                    status_report = f"📊 *MindSpark Studio Status*\n\n📌 *Next Queued Book:* {queued_book}\n"
                    if target_dir:
                        meta = jload(target_dir / "meta.json", {})
                        status_report += f"📹 *Latest Video:* {meta.get('title', target_dir.name)}\n📁 Folder: `{target_dir.name}`\n👉 Tap PASS on the video message to publish!"
                    else:
                        status_report += "ℹ️ No pending local videos."
                    send_msg(sender_chat, status_report)

                # Command: /make <Book Name> or /next <Book Name>
                elif cmd_lower.startswith("/make ") or cmd_lower.startswith("/next ") or cmd_lower.startswith("make "):
                    book_query = raw_cmd.split(" ", 1)[1].strip()
                    if book_query:
                        triggered = trigger_workflow_make_video(book_query)
                        if triggered:
                            send_msg(sender_chat, f"🚀 *Workflow Started!*\nBook: *{book_query}* ka video generate hona shuru ho gaya hai.\nLagbhag 7-8 minute me Telegram par video aa jayegi!")
                        else:
                            send_msg(sender_chat, f"✅ *Book Queued!*\nNext video ke liye *'{book_query}'* select ho gayi hai! Agle workflow run me yeh generate hogi.")
                    else:
                        send_msg(sender_chat, "⚠️ Kripya book ka naam likhein. Example: `/make Bhagavad Gita`")

                # Command: /add <Book Name>
                elif cmd_lower.startswith("/add ") or cmd_lower.startswith("add "):
                    book_arg = raw_cmd.split(" ", 1)[1].strip()
                    if book_arg:
                        author = ""
                        if " - " in book_arg:
                            b_parts = book_arg.split(" - ", 1)
                            title, author = b_parts[0].strip(), b_parts[1].strip()
                        else:
                            title = book_arg
                        books_file = ROOT / "data" / "books.json"
                        books = jload(books_file, [])
                        if any(b.get("title", "").lower() == title.lower() for b in books):
                            send_msg(sender_chat, f"ℹ️ *'{title}'* pehle se `books.json` me mojood hai!")
                        else:
                            books.append({"title": title, "author": author})
                            jsave(books_file, books)
                            git_sync_changes(f"Add book: {title}")
                            send_msg(sender_chat, f"✅ *Book Added Successfully!*\n📖 Title: *{title}*\n✍️ Author: {author or 'N/A'}\n📚 Total books in pool: {len(books)}\n\nIs par video banane ke liye type karein: `/make {title}`")
                    else:
                        send_msg(sender_chat, "⚠️ Kripya book ka naam likhein. Example: `/add Ikigai`")

                # Command: /del <Book Name> or /remove <Book Name>
                elif cmd_lower.startswith("/del ") or cmd_lower.startswith("/remove ") or cmd_lower.startswith("del "):
                    book_arg = raw_cmd.split(" ", 1)[1].strip().lower()
                    if book_arg:
                        books_file = ROOT / "data" / "books.json"
                        books = jload(books_file, [])
                        original_count = len(books)
                        matched_titles = [b.get("title", "") for b in books if book_arg == b.get("title", "").lower() or book_arg in b.get("title", "").lower()]
                        books = [b for b in books if book_arg != b.get("title", "").lower() and book_arg not in b.get("title", "").lower()]
                        if len(books) < original_count:
                            jsave(books_file, books)
                            git_sync_changes(f"Remove book: {', '.join(matched_titles)}")
                            send_msg(sender_chat, f"🗑️ *Book Removed!*\nNikaali gayi books: *{', '.join(matched_titles)}*\n📚 Ab total books bachi hain: {len(books)}")
                        else:
                            send_msg(sender_chat, f"⚠️ *'{book_arg}'* `books.json` me nahi mili. `/list` karke saari books dekh sakte hain.")
                    else:
                        send_msg(sender_chat, "⚠️ Kripya book ka naam likhein jise nikaalna hai. Example: `/del Range`")

                # Command: /list or /books
                elif cmd_lower in ("/list", "list", "/books", "books"):
                    books_file = ROOT / "data" / "books.json"
                    books = jload(books_file, [])
                    cp = ROOT / "completed_books.md"
                    done = cp.read_text(encoding="utf-8").lower() if cp.exists() else ""
                    
                    lines = []
                    for idx, b in enumerate(books[:20], 1):
                        b_title = b.get("title", "")
                        b_status = "✅ Completed" if b_title.lower() in done else "⏳ Available"
                        lines.append(f"{idx}. *{b_title}* — {b_status}")
                    
                    list_text = (
                        f"📚 *Books Library ({len(books)} Total):*\n\n"
                        + "\n".join(lines) +
                        f"\n\n_(Dikhaye gaye pehle {min(20, len(books))} books)_\n\n"
                        "👉 Nayi book jodne ke liye: `/add <Book Name>`\n"
                        "👉 Book par video banane ke liye: `/make <Book Name>`\n"
                        "👉 Book nikaalne ke liye: `/del <Book Name>`"
                    )
                    send_msg(sender_chat, list_text)
        except Exception as e:
            time.sleep(2)

if __name__ == "__main__":
    start_bot()
