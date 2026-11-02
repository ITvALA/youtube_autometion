#!/usr/bin/env python3
"""Gemini voice tools: phone se GitHub Actions ("Voice Tools" workflow) ke zariye chalao.

  list    Hindi voices ki list (Gemini Voice Library) Actions log me.
  design  Natural-language description se ek PERMANENT custom awaaz (voice_...) banata hai.
          Sample Telegram par aata hai; voice ID ko config/voice_config.json me "voices" -> "gemini_tts" me daalo.
  test    Ek ya zyada voices (comma se alag) ko apne text par bajao, Telegram par sunne ke liye.

Sab settings environment variables se aati hain (workflow inputs): VOICE_NAME, VOICE_TEXT, VOICE_STYLE,
VOICE_DESC, VOICE_DISPLAY, VOICE_SEARCH, VOICE_MODEL. Secrets: GEMINI_API_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
"""
import os, sys, base64, subprocess, requests
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "src"))

BASE = "https://generativelanguage.googleapis.com/v1beta"
MODEL = os.getenv("VOICE_MODEL") or "gemini-3.8-flash-tts"


def _key():
    k = os.getenv("GEMINI_API_KEY")
    if not k:
        sys.exit("GEMINI_API_KEY secret nahi mila")
    return k


def _headers():
    return {"x-goog-api-key": _key(), "Content-Type": "application/json"}


def tg_audio(path, caption):
    t, c = os.getenv("TELEGRAM_BOT_TOKEN"), os.getenv("TELEGRAM_CHAT_ID")
    if not (t and c):
        print("[tg] Telegram secrets nahi hain, audio sirf runner par:", path)
        return
    with open(path, "rb") as f:
        r = requests.post(f"https://api.telegram.org/bot{t}/sendAudio",
                          data={"chat_id": c, "caption": caption[:900]}, files={"audio": f}, timeout=120)
    print("[tg]", r.status_code, r.text[:120])


def tg_text(msg):
    t, c = os.getenv("TELEGRAM_BOT_TOKEN"), os.getenv("TELEGRAM_CHAT_ID")
    if t and c:
        requests.post(f"https://api.telegram.org/bot{t}/sendMessage", data={"chat_id": c, "text": msg[:3900]}, timeout=60)


def _to_mp3(wav_path, mp3_path):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_path), "-b:a", "128k", str(mp3_path)], check=True)


def cmd_list():
    params = [("language_code", "hi-IN"), ("page_size", "100")]
    if os.getenv("VOICE_SEARCH"):
        params.append(("search", os.getenv("VOICE_SEARCH")))
    r = requests.get(f"{BASE}/voices", params=params, headers={"x-goog-api-key": _key()}, timeout=60)
    print("HTTP", r.status_code)
    if r.status_code >= 400:
        sys.exit(r.text[:500])
    voices = r.json().get("voices", [])
    lines = []
    for v in voices:
        lines.append(f"{v.get('id')} | {v.get('display_name')} | {v.get('gender')} | pitch={v.get('pitch')} | {v.get('accent')} | {(v.get('description') or '')[:70]}")
    print("\n".join(lines) or "koi voice nahi mili")
    tg_text("Hindi voices (" + str(len(lines)) + "):\n" + "\n".join(l.split(" | ")[0] + " - " + l.split(" | ")[1] for l in lines[:60]))


def cmd_design():
    desc = os.getenv("VOICE_DESC") or "A warm, friendly Indian man in his late 20s with a natural Hindi accent, speaking like a friend telling a story."
    body = {"store": True, "voice": {
        "model": MODEL, "type": "prompted",
        "display_name": os.getenv("VOICE_DISPLAY") or "MindSpark Storyteller",
        "gender": os.getenv("VOICE_GENDER") or "male",
        "language_code": "hi-IN",
        "prompted": {"input": desc}}}
    r = requests.post(f"{BASE}/voices", json=body, headers=_headers(), timeout=180)
    print("HTTP", r.status_code)
    if r.status_code >= 400:
        sys.exit(r.text[:600])
    j = r.json()
    vid = j.get("id")
    print("VOICE ID:", vid)
    sa = (j.get("sample_audio") or {}).get("data")
    cap = f"Naya voice ID: {vid}\nIse config/voice_config.json me voices -> gemini_tts me daalo."
    if sa:
        wav = Path("/tmp/designed.wav"); wav.write_bytes(base64.b64decode(sa))
        mp3 = Path("/tmp/designed.mp3"); _to_mp3(wav, mp3)
        tg_audio(mp3, cap)
    else:
        tg_text(cap)


def cmd_test():
    import tts
    names = [n.strip() for n in (os.getenv("VOICE_NAME") or "Charon").split(",") if n.strip()]
    text = os.getenv("VOICE_TEXT") or "देखो, <short pause> एक छोटी सी आदत... <breath> जो तुम्हारी पूरी ज़िंदगी बदल सकती है। पता है क्यों? <short pause> क्योंकि रोज़ का एक प्रतिशत भी, साल भर में बहुत बड़ा फ़र्क बन जाता है।"
    style = os.getenv("VOICE_STYLE") or "warm, conversational, like a friend"
    for n in names:
        out = Path(f"/tmp/test_{n}.mp3")
        cfg = {"voice": n, "style": style, "gemini_models": [MODEL], "cache": False}
        try:
            tts._synth_gemini(text, cfg, out)
            tg_audio(out, f"Voice: {n}\nStyle: {style}\nModel: {MODEL}")
        except Exception as e:
            print(f"[{n}] FAILED: {e}")
            tg_text(f"Voice {n} FAILED: {str(e)[:300]}")


if __name__ == "__main__":
    cmd = (sys.argv[1] if len(sys.argv) > 1 else "test").lower()
    {"list": cmd_list, "design": cmd_design, "test": cmd_test}.get(cmd, lambda: sys.exit("action: list | design | test"))()
