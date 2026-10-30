"""Sends video directly to Telegram as streamable MP4 with 1-click PASS / REJECT buttons."""
import os, json, requests
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
                requests.post(
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
        except Exception as e:
            print(f"[Telegram Notify] Error sending video: {e}")
