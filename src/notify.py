"""Sends video directly to Telegram as streamable MP4 with 1-click PASS / REJECT buttons."""
import os, time, json, requests
from pathlib import Path

def send(video, caption, video_dir=None):
    t = (os.environ.get("TELEGRAM_BOT_TOKEN") or "").strip().strip('"').strip("'")
    c = str(os.environ.get("TELEGRAM_CHAT_ID") or "").strip().strip('"').strip("'")
    if not (t and c):
        print(f"[Telegram Notify] ⚠️ Missing TELEGRAM_BOT_TOKEN ({bool(t)}) or TELEGRAM_CHAT_ID ({bool(c)}) in environment/secrets!")
        return
    video_path = Path(video)
    if not video_path.exists():
        print(f"[Telegram Notify] ERROR: Video file not found: {video}")
        return

    file_size_mb = video_path.stat().st_size / (1024 * 1024)
    print(f"[Telegram Notify] Target video size: {file_size_mb:.2f} MB")

    # Inline keyboard buttons for 1-tap mobile review
    dir_name = Path(video_dir).name if video_dir else video_path.parent.name
    reply_markup = {
        "inline_keyboard": [
            [
                {"text": "🚀 PASS ", "callback_data": f"pass:{dir_name}"},
                {"text": "❌ REJECT", "callback_data": f"reject:{dir_name}"}
            ]
        ]
    }

    full_caption = (
        f"🎬 *New Reel Ready for Review!*\n\n"
        f"{caption}\n\n"
        f"👉 Tap *PASS* button to upload immediately to YouTube!"
    )[:1000]

    target_video_dir = Path(video_dir) if video_dir else video_path.parent
    meta_path = target_video_dir / "meta.json"
    meta_data = {}
    if meta_path.exists():
        try:
            with open(meta_path, "r", encoding="utf-8") as mf:
                meta_data = json.load(mf)
        except Exception:
            pass

    def save_pending(fid=None, fuid=None, mid=None):
        pending_info = {
            "dir_name": dir_name,
            "file_id": fid,
            "file_unique_id": fuid,
            "message_id": mid,
            "caption": full_caption,
            "meta": meta_data,
            "timestamp": int(time.time()),
            "status": "pending_review"
        }
        root_data = Path(__file__).resolve().parent.parent / "data"
        root_data.mkdir(exist_ok=True)
        with open(root_data / "pending_video.json", "w", encoding="utf-8") as pf:
            json.dump(pending_info, pf, indent=2)
        print(f"[Telegram Notify] Saved data/pending_video.json for dir '{dir_name}'")

    sent = False
    # Attempt 1: sendVideo
    for attempt in range(1, 3):
        try:
            print(f"[Telegram Notify] Sending video to Telegram (attempt {attempt}/2)...")
            with open(video_path, "rb") as f:
                r = requests.post(
                    f"https://api.telegram.org/bot{t}/sendVideo",
                    timeout=180,
                    data={
                        "chat_id": c,
                        "caption": full_caption,
                        "parse_mode": "Markdown",
                        "supports_streaming": "true",
                        "reply_markup": json.dumps(reply_markup)
                    },
                    files={"video": f}
                )
                if not r.ok:
                    f.seek(0)
                    r = requests.post(
                        f"https://api.telegram.org/bot{t}/sendVideo",
                        timeout=180,
                        data={
                            "chat_id": c,
                            "caption": caption[:900],
                            "supports_streaming": "true",
                            "reply_markup": json.dumps(reply_markup)
                        },
                        files={"video": f}
                    )
            if r.ok:
                resp_data = r.json()
                res = resp_data.get("result", {})
                save_pending(
                    res.get("video", {}).get("file_id"),
                    res.get("video", {}).get("file_unique_id"),
                    res.get("message_id")
                )
                print("[Telegram Notify] ✅ Video sent successfully via sendVideo!")
                sent = True
                break
            else:
                print(f"[Telegram Notify] sendVideo attempt {attempt} failed ({r.status_code}): {r.text[:200]}")
        except Exception as e:
            print(f"[Telegram Notify] Error sending video: {e}")
            time.sleep(2)

    # Attempt 2: sendDocument fallback (faster, no server transcoding limit)
    if not sent:
        try:
            print("[Telegram Notify] Trying fallback via sendDocument...")
            with open(video_path, "rb") as f:
                r_doc = requests.post(
                    f"https://api.telegram.org/bot{t}/sendDocument",
                    timeout=180,
                    data={
                        "chat_id": c,
                        "caption": full_caption,
                        "parse_mode": "Markdown",
                        "reply_markup": json.dumps(reply_markup)
                    },
                    files={"document": f}
                )
            if r_doc.ok:
                resp_data = r_doc.json()
                res = resp_data.get("result", {})
                save_pending(
                    res.get("document", {}).get("file_id"),
                    res.get("document", {}).get("file_unique_id"),
                    res.get("message_id")
                )
                print("[Telegram Notify] ✅ Video sent successfully via sendDocument!")
                sent = True
            else:
                print(f"[Telegram Notify] sendDocument failed ({r_doc.status_code}): {r_doc.text[:200]}")
        except Exception as de:
            print(f"[Telegram Notify] sendDocument error: {de}")

    # Attempt 3: Alert message with GitHub Pages review link
    if not sent:
        save_pending()
        try:
            pages_url = "https://itvala.github.io/youtube_autometion/"
            alert_text = (
                f"🎬 *New Reel Ready on GitHub Pages!*\n\n"
                f"{caption}\n\n"
                f"👉 [Watch & Review Video Here]({pages_url})\n"
                f"Tap *PASS* on the review page to upload to YouTube!"
            )
            r_msg = requests.post(
                f"https://api.telegram.org/bot{t}/sendMessage",
                timeout=30,
                data={
                    "chat_id": c,
                    "text": alert_text,
                    "parse_mode": "Markdown",
                    "reply_markup": json.dumps(reply_markup)
                }
            )
            if r_msg.ok:
                print("[Telegram Notify] ✅ Sent review alert message with Pages link!")
            else:
                print(f"[Telegram Notify] Alert message failed ({r_msg.status_code}): {r_msg.text[:200]}")
        except Exception as me:
            print(f"[Telegram Notify] Alert message error: {me}")

def send_msg(text):
    t = (os.environ.get("TELEGRAM_BOT_TOKEN") or "").strip().strip('"').strip("'")
    c = str(os.environ.get("TELEGRAM_CHAT_ID") or "").strip().strip('"').strip("'")
    if not (t and c):
        return
    try:
        requests.post(
            f"https://api.telegram.org/bot{t}/sendMessage",
            timeout=30,
            data={"chat_id": c, "text": text[:4000]}
        )
    except Exception as e:
        print(f"[Telegram Notify] send_msg error: {e}")
