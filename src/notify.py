"""Sends video directly to Telegram as streamable MP4 with 1-click PASS / REJECT buttons."""
import os, time, json, requests
from pathlib import Path

def send(video, caption, video_dir=None):
    t = (os.environ.get("TELEGRAM_BOT_TOKEN") or "").strip().strip('"').strip("'")
    c = str(os.environ.get("TELEGRAM_CHAT_ID") or "").strip().strip('"').strip("'")
    if not (t and c):
        print(f"[Telegram Notify] ERROR: Missing TELEGRAM_BOT_TOKEN ({bool(t)}) or TELEGRAM_CHAT_ID ({bool(c)}) in environment/secrets!")
        return
    video_path = Path(video)
    if not video_path.exists():
        print(f"[Telegram Notify] ERROR: Video file not found: {video}")
        return

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

    sent = False
    for attempt in range(1, 3):
        try:
            print(f"[Telegram Notify] Sending video to Telegram (attempt {attempt}/2)...")
            with open(video_path, "rb") as f:
                r = requests.post(
                    f"https://api.telegram.org/bot{t}/sendVideo",
                    timeout=300,
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
                    # If markdown fails due to special chars, send as plain text
                    f.seek(0)
                    r = requests.post(
                        f"https://api.telegram.org/bot{t}/sendVideo",
                        timeout=300,
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
                file_id = res.get("video", {}).get("file_id")
                file_unique_id = res.get("video", {}).get("file_unique_id")
                msg_id = res.get("message_id")
                
                target_video_dir = Path(video_dir) if video_dir else video_path.parent
                meta_path = target_video_dir / "meta.json"
                meta_data = {}
                if meta_path.exists():
                    try:
                        with open(meta_path, "r", encoding="utf-8") as mf:
                            meta_data = json.load(mf)
                    except Exception:
                        pass
                
                pending_info = {
                    "dir_name": dir_name,
                    "file_id": file_id,
                    "file_unique_id": file_unique_id,
                    "message_id": msg_id,
                    "caption": full_caption,
                    "meta": meta_data,
                    "timestamp": int(time.time()),
                    "status": "pending_review"
                }
                
                root_data = Path(__file__).resolve().parent.parent / "data"
                root_data.mkdir(exist_ok=True)
                with open(root_data / "pending_video.json", "w", encoding="utf-8") as pf:
                    json.dump(pending_info, pf, indent=2)
                print(f"[Telegram Notify] Video sent. Saved data/pending_video.json for dir '{dir_name}'")
                sent = True
                break
            else:
                print(f"[Telegram Notify] Telegram sendVideo failed ({r.status_code}): {r.text[:200]}")
        except Exception as e:
            print(f"[Telegram Notify] Error sending video: {e}")
            time.sleep(2)

    # Fallback: send via GitHub Pages stream URL if direct file upload failed or timed out
    if not sent:
        try:
            print("[Telegram Notify] Trying fallback via GitHub Pages stream URL...")
            r_url = requests.post(
                f"https://api.telegram.org/bot{t}/sendVideo",
                timeout=120,
                data={
                    "chat_id": c,
                    "video": "https://itvala.github.io/youtube_autometion/video.mp4",
                    "caption": caption[:900],
                    "reply_markup": json.dumps(reply_markup)
                }
            )
            if r_url.ok:
                print("[Telegram Notify] Fallback stream URL sent successfully!")
            else:
                print(f"[Telegram Notify] Fallback stream URL failed ({r_url.status_code}): {r_url.text[:200]}")
        except Exception as fe:
            print(f"[Telegram Notify] Fallback URL error: {fe}")

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
