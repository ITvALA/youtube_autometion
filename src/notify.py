"""Sends video directly to Telegram as streamable MP4 with 1-click PASS / REJECT buttons."""
import os, time, json, requests
from pathlib import Path

def send(video, caption, video_dir=None):
    t, c = os.environ.get("TELEGRAM_BOT_TOKEN"), os.environ.get("TELEGRAM_CHAT_ID")
    if not (t and c):
        return
    video_path = Path(video)
    if not video_path.exists():
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
        f"👉 Tap *PASS* button  to upload immediately to YouTube!"
    )[:1000]

    with open(video_path, "rb") as f:
        try:
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

            # Record pending video info so telegram_bot can pre-load or instant PASS
            if r.ok:
                resp_data = r.json()
                res = resp_data.get("result", {})
                file_id = res.get("video", {}).get("file_id")
                file_unique_id = res.get("video", {}).get("file_unique_id")
                msg_id = res.get("message_id")
                
                # Check for meta.json
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

        except Exception as e:
            print(f"[Telegram Notify] Error sending video: {e}")
