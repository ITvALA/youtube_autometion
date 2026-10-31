import os, sys, requests, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

from src.tts import synth_speech

TELEGRAM_BOT_TOKEN = "9157728740:AAEBoV-I8TfxgppWYV1JLMAd0G2CgHnLrVQ"
TELEGRAM_CHAT_ID = "8905611751"

def mix_specific_bgm(voice_file: Path, bgm_file: Path, out_file: Path, vol_db="-21dB"):
    v_dur = float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(voice_file)
    ]).strip())
    
    total_dur = v_dur + 0.5
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(voice_file),
        "-stream_loop", "-1", "-i", str(bgm_file),
        "-filter_complex",
        f"[1:a]volume={vol_db},afade=t=in:st=0:d=1.2,afade=t=out:st={max(0, total_dur - 1.5)}:d=1.5[bgm];"
        f"[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]",
        "-map", "[aout]",
        "-t", str(total_dur),
        "-ar", "44100", "-ac", "2", "-b:a", "192k",
        str(out_file)
    ]
    subprocess.run(cmd, check=True)
    return out_file

def send_telegram_audio(audio_path: Path, title: str, performer: str, caption: str):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendAudio"
    with open(audio_path, "rb") as f:
        files = {"audio": (audio_path.name, f, "audio/mpeg")}
        data = {
            "chat_id": TELEGRAM_CHAT_ID,
            "title": title,
            "performer": performer,
            "caption": caption,
            "parse_mode": "Markdown"
        }
        resp = requests.post(url, data=data, files=files, timeout=60)
        resp.raise_for_status()
        print(f"Sent {audio_path.name} to Telegram: {resp.status_code}")

def main():
    out_dir = ROOT / "output" / "normal_speed"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    sample_text = (
        "एटॉमिक हैबिट्स हमें सिखाती है कि रोज़ाना सिर्फ एक प्रतिशत बेहतर होना आपके जीवन में बहुत बड़ा बदलाव ला सकता है। "
        "सफलता किसी एक बड़े कदम से नहीं, बल्कि रोज़ दोहराई जाने वाली छोटी-छोटी अच्छी आदतों से मिलती है। "
        "ऐसी और लाइफ चेंजिंग इनसाइट्स के लिए माइंडस्पार्क को अभी सब्सक्राइब करें!"
    )
    
    cfg = {
        "provider": "kokoro",
        "voice": "hm_psi",
        "speed": 1.0,
        "lang": "hi",
        "rate": "+0%"
    }
    
    raw_voice = out_dir / "hm_psi_normal_speed_raw.mp3"
    print("Synthesizing hm_psi at normal 1.0x speed...")
    synth_speech(sample_text, cfg, raw_voice)
    
    bgm_path = ROOT / "data" / "audio" / "bgm" / "modern-classical-inspirational-piano-625708.mp3"
    mixed_file = out_dir / "hm_psi_normal_speed_piano.mp3"
    mix_specific_bgm(raw_voice, bgm_path, mixed_file, vol_db="-21dB")
    
    send_telegram_audio(
        mixed_file,
        title="hm_psi (Male) - Normal 1.0x Speed",
        performer="MindSpark Studio (Kokoro-82M)",
        caption=(
            "*Voice Speed Set to Normal (1.0x)*\n\n"
            "- Voice: `hm_psi` (Hindi Male Storyteller)\n"
            "- Speed: `1.0` (Natural & energetic pacing)\n"
            "- Rate: `+0%` (Zero slowdown)\n"
            "- BGM: Soft Piano ducked at `-21dB` (20% lower)\n\n"
            "Now configured as active voice and default speed!"
        )
    )

if __name__ == "__main__":
    main()

