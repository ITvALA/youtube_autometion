import os, sys, subprocess, requests, json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

from common import load_env, jload
import tts, audio

load_env()
vcfg = jload(ROOT / "config" / "voice_config.json", {})
token = os.environ.get("TELEGRAM_BOT_TOKEN")
chat_id = os.environ.get("TELEGRAM_CHAT_ID")

print("Voice Config:", vcfg)

# Work directory with the 5 raw Raju clone files
work_dirs = sorted((ROOT / "data" / "work").glob("*5000-vs-1-lakh*"))
if not work_dirs:
    work_dirs = sorted((ROOT / "data" / "work").glob("*"))
latest_work = work_dirs[-1]
print(f"Using raw files from: {latest_work}")

tempo = float(vcfg.get("tempo", 0.92))
lead_s = float(vcfg.get("lead", 0.15))
tail_s = float(vcfg.get("tail", 0.7))
tail_last_s = float(vcfg.get("tail_last", 0.9))
squeeze = float(vcfg.get("squeeze_pauses", 1.0))
normalize = bool(vcfg.get("normalize", True))

parts = []
trial_dir = ROOT / "data" / "output" / "trial_audio"
trial_dir.mkdir(parents=True, exist_ok=True)

for i in range(5):
    raw = latest_work / f"s{i}_raw.mp3"
    padded = trial_dir / f"s{i}_trial.mp3"
    tail = tail_last_s if i == 4 else tail_s
    print(f"Processing Scene {i}: tempo={tempo}, lead={lead_s}, tail={tail}, squeeze={squeeze}")
    tts._tighten(raw, padded, tempo, lead_s, tail, squeeze, normalize)
    parts.append(padded)

# Concat
lst = trial_dir / "list.txt"
lst.write_text("".join(f"file '{p.resolve().as_posix()}'\n" for p in parts))
trial_voice = trial_dir / "trial_raju_voice.mp3"
subprocess.run([
    "ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst),
    "-c:a", "libmp3lame", "-q:a", "2", str(trial_voice)
], check=True)

# Get duration
dur = float(subprocess.run(
    ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(trial_voice)],
    capture_output=True, text=True, check=True).stdout.strip())

print(f"Total voice duration: {dur:.2f}s")

# Mix with BGM
trial_final = trial_dir / "trial_raju_with_bgm.mp3"
bgm_file = ROOT / "data" / "audio" / "bgm" / "maksymmalko-hindi-hindi-music-604960.mp3"
audio.mix(trial_voice, dur, trial_final, bgm_file=bgm_file)

caption = (
    f"🎙️ *Raju XTTS-v2 Trial Audio*\n\n"
    f"⚙️ *Settings:*\n"
    f"• Tempo: `{tempo}`\n"
    f"• Lead: `{lead_s}s` | Tail: `{tail_s}s` (Tail last: `{tail_last_s}s`)\n"
    f"• Squeeze Pauses: `{squeeze}`\n"
    f"• EQ: Level 1 Warm Studio Mic\n\n"
    f"🎧 Sun kar batao yeh pace aur flow kaisa laga!"
)

print("Sending trial audio to Telegram...")
with open(trial_final, "rb") as f:
    r = requests.post(
        f"https://api.telegram.org/bot{token}/sendAudio",
        timeout=120,
        data={
            "chat_id": chat_id,
            "caption": caption,
            "parse_mode": "Markdown",
            "title": f"Raju Clone Trial (Tempo {tempo}, Lead {lead_s})",
            "performer": "MindSpark AI"
        },
        files={"audio": f}
    )
    if not r.ok:
        print("Markdown failed, sending plain text:", r.text)
        f.seek(0)
        r = requests.post(
            f"https://api.telegram.org/bot{token}/sendAudio",
            timeout=120,
            data={
                "chat_id": chat_id,
                "caption": caption.replace("*", "").replace("`", ""),
                "title": f"Raju Clone Trial (Tempo {tempo}, Lead {lead_s})",
                "performer": "MindSpark AI"
            },
            files={"audio": f}
        )

print("Telegram response ok:", r.ok)
