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
    out_dir = ROOT / "output" / "remaining_two_samples"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    sample_text = (
        "एटॉमिक हैबिट्स हमें सिखाती है कि रोज़ाना सिर्फ एक प्रतिशत बेहतर होना आपके जीवन में बहुत बड़ा बदलाव ला सकता है। "
        "सफलता किसी एक बड़े कदम से नहीं, बल्कि रोज़ दोहराई जाने वाली छोटी-छोटी अच्छी आदतों से मिलती है। "
        "ऐसी और लाइफ चेंजिंग इनसाइट्स के लिए माइंडस्पार्क को अभी सब्सक्राइब करें!"
    )
    
    bgm_path = ROOT / "data" / "audio" / "bgm" / "modern-classical-inspirational-piano-625708.mp3"

    # 1. hi-IN-MadhurNeural (Microsoft Studio Hindi Male)
    print("Generating hi-IN-MadhurNeural (Studio Hindi Male)...")
    cfg_madhur = {
        "provider": "edge-tts",
        "voice": "hi-IN-MadhurNeural",
        "speed": 1.0,
        "rate": "+0%",
        "pitch": "+0Hz"
    }
    raw_madhur = out_dir / "madhur_raw.mp3"
    synth_speech(sample_text, cfg_madhur, raw_madhur)
    mixed_madhur = out_dir / "madhur_studio_male_clean.mp3"
    mix_specific_bgm(raw_madhur, bgm_path, mixed_madhur, vol_db="-21dB")
    send_telegram_audio(
        mixed_madhur,
        title="Madhur Neural (Studio Hindi Male)",
        performer="Microsoft Studio Neural",
        caption=(
            "*Option 1: Microsoft Studio Neural — Madhur*\n\n"
            "- Voice: `hi-IN-MadhurNeural` (Hindi Male)\n"
            "- Pacing: Normal 1.0x | Zero Filter Distortion\n"
            "- Tone: Ultra-natural, human-like studio narrator\n"
            "- BGM: Soft Inspirational Piano (-21dB ducked)"
        )
    )

    # 2. hf_beta (Kokoro-82M Clean Hindi Female)
    print("Generating hf_beta (Kokoro Hindi Female)...")
    cfg_beta = {
        "provider": "kokoro",
        "voice": "hf_beta",
        "speed": 1.0,
        "lang": "hi",
        "rate": "+0%"
    }
    raw_beta = out_dir / "hf_beta_raw.mp3"
    synth_speech(sample_text, cfg_beta, raw_beta)
    mixed_beta = out_dir / "hf_beta_female_clean.mp3"
    mix_specific_bgm(raw_beta, bgm_path, mixed_beta, vol_db="-21dB")
    send_telegram_audio(
        mixed_beta,
        title="hf_beta (Kokoro Hindi Female)",
        performer="Kokoro-82M (Natural Clean)",
        caption=(
            "*Option 2: Kokoro-82M — hf_beta*\n\n"
            "- Voice: `hf_beta` (Hindi Female Narrator)\n"
            "- Pacing: Normal 1.0x | Zero Pitch Shift Filter\n"
            "- Tone: Crisp, expressive, clear articulation\n"
            "- BGM: Soft Inspirational Piano (-21dB ducked)"
        )
    )

if __name__ == "__main__":
    main()

