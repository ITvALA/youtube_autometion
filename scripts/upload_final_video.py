import os
import sys
import json
import time
from pathlib import Path
from dotenv import load_dotenv
import requests

load_dotenv()
token = os.environ.get("TELEGRAM_BOT_TOKEN")
chat_id = os.environ.get("TELEGRAM_CHAT_ID")

video_path = Path("data/output/2026-10-31_132536_meditations/final.mp4")
if not video_path.exists():
    print("Video not found:", video_path)
    sys.exit(1)

file_size = video_path.stat().st_size
print(f"Uploading {video_path.name} ({file_size / (1024*1024):.2f} MB) to Telegram...")

caption = "🎬 *MindSpark Reel Ready!*\n\nBook: *Meditations*\nVoice: *Hybrid (MadhurNeural Hook/Outro + Kokoro hm_omega Body)*\nBGM: *-21dB Calm Ambient*"

reply_markup = {
    "inline_keyboard": [
        [
            {"text": "🚀 PASS", "callback_data": f"pass:{video_path.parent.name}"},
            {"text": "❌ REJECT", "callback_data": f"reject:{video_path.parent.name}"}
        ]
    ]
}

url = f"https://api.telegram.org/bot{token}/sendVideo"

with open(video_path, "rb") as f:
    r = requests.post(
        url,
        data={
            "chat_id": chat_id,
            "caption": caption,
            "parse_mode": "Markdown",
            "supports_streaming": "true",
            "reply_markup": json.dumps(reply_markup)
        },
        files={"video": f},
        timeout=180
    )

print("Status:", r.status_code)
if r.ok:
    data = r.json()
    print("Success! Message ID:", data.get("result", {}).get("message_id"))
    # Save pending_video.json
    pending_info = {
        "dir_name": video_path.parent.name,
        "file_id": data.get("result", {}).get("video", {}).get("file_id"),
        "message_id": data.get("result", {}).get("message_id"),
        "timestamp": int(time.time()),
        "status": "pending_review"
    }
    with open("data/pending_video.json", "w", encoding="utf-8") as pf:
        json.dump(pending_info, pf, indent=2)
    print("Updated data/pending_video.json")
else:
    print("Failed:", r.text)

