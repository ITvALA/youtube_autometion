import os, requests

def send(video, caption):
    t, c = os.environ.get("TELEGRAM_BOT_TOKEN"), os.environ.get("TELEGRAM_CHAT_ID")
    if not (t and c):
        return
    with open(video, "rb") as f:
        requests.post(f"https://api.telegram.org/bot{t}/sendVideo", timeout=300,
                      data={"chat_id": c, "caption": caption[:900], "supports_streaming": "true"}, files={"video": f})
