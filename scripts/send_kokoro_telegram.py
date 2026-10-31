import os, sys, json, requests, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

from src.tts import synth_speech
from src.audio import pick_random_bgm
TELEGRAM_BOT_TOKEN = "9157728740:AAEBoV-I8TfxgppWYV1JLMAd0G2CgHnLrVQ"
TELEGRAM_CHAT_ID = "8905611751"

def mix_voice_and_bgm(voice_file: Path, out_file: Path) -> Path:
    bgm_file = pick_random_bgm(ROOT / "data" / "audio" / "bgm")
    if not bgm_file or not bgm_file.exists():
        print("No BGM found, using raw voice")
        return voice_file
    
    # Get voice duration
    v_dur = float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(voice_file)
    ]).strip())
    
    # Mix with ffmpeg: BGM ducked at -17dB with fade-in & fade-out matching voice duration + 0.5s padding
    total_dur = v_dur + 0.5
    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(voice_file),
        "-stream_loop", "-1", "-i", str(bgm_file),
        "-filter_complex",
        f"[1:a]volume=0.14,afade=t=in:st=0:d=1.0,afade=t=out:st={max(0, total_dur - 1.5)}:d=1.5[bgm];"
        f"[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]",
        "-map", "[aout]",
        "-t", str(total_dur),
        "-ar", "44100", "-ac", "2", "-b:a", "192k",
        str(out_file)
    ]
    subprocess.run(cmd, check=True)
    return out_file

def send_telegram_audio(audio_path: Path, title: str, caption: str):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendAudio"
    with open(audio_path, "rb") as f:
        files = {"audio": (audio_path.name, f, "audio/mpeg")}
        data = {
            "chat_id": TELEGRAM_CHAT_ID,
            "title": title,
            "performer": "MindSpark Studio (Kokoro-82M)",
            "caption": caption,
            "parse_mode": "Markdown"
        }
        resp = requests.post(url, data=data, files=files, timeout=60)
        resp.raise_for_status()
        print(f"Sent {audio_path.name} to Telegram: {resp.status_code}")

def main():
    out_dir = ROOT / "output" / "kokoro_samples"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    sample_text = (
        "एटॉमिक हैबिट्स हमें सिखाती है कि रोज़ाना सिर्फ एक प्रतिशत बेहतर होना आपके जीवन में बहुत बड़ा बदलाव ला सकता है। "
        "सफलता किसी एक बड़े कदम से नहीं, बल्कि रोज़ दोहराई जाने वाली छोटी-छोटी अच्छी आदतों से मिलती है। "
        "ऐसी और लाइफ चेंजिंग इनसाइट्स के लिए माइंडस्पार्क को अभी सब्सक्राइब करें!"
    )
    
    # 1. Male Voice: hm_omega
    cfg_male = {
        "provider": "kokoro",
        "voice": "hm_omega",
        "speed": 0.93,
        "lang": "hi"
    }
    raw_male = out_dir / "kokoro_hm_omega_raw.mp3"
    synth_speech(sample_text, cfg_male, raw_male)
    mixed_male = out_dir / "kokoro_hm_omega_motivational.mp3"
    mix_voice_and_bgm(raw_male, mixed_male)
    
    send_telegram_audio(
        mixed_male,
        title="Kokoro-82M (hm_omega) - Motivational",
        caption=(
            "*Trending #1 TTS Model: Kokoro-82M*\n\n"
            "*Voice:* `hm_omega` (Hindi Male Narrator)\n"
            "*Speed:* `0.93` (Calm & Clear)\n"
            "*BGM:* Pixabay Motivational Ducked @ -17dB\n"
            "*Hook:* Directly starts with 'एटॉमिक हैबिट्स हमें सिखाती है...'\n"
            "*Outro:* Closes with 'माइंडस्पार्क को अभी सब्सक्राइब करें!'\n\n"
            "Active and configured in MindSpark Studio!"
        )
    )

    # 2. Female Voice: hf_alpha
    cfg_female = {
        "provider": "kokoro",
        "voice": "hf_alpha",
        "speed": 0.93,
        "lang": "hi"
    }
    raw_female = out_dir / "kokoro_hf_alpha_raw.mp3"
    synth_speech(sample_text, cfg_female, raw_female)
    mixed_female = out_dir / "kokoro_hf_alpha_motivational.mp3"
    mix_voice_and_bgm(raw_female, mixed_female)
    
    send_telegram_audio(
        mixed_female,
        title="Kokoro-82M (hf_alpha) - Motivational",
        caption=(
            "*Trending #1 TTS Model: Kokoro-82M*\n\n"
            "*Voice:* `hf_alpha` (Hindi Female Narrator)\n"
            "*Speed:* `0.93` (Calm & Clear)\n"
            "*BGM:* Pixabay Motivational Ducked @ -17dB\n\n"
            "High-clarity alternative Hindi voice option."
        )
    )

if __name__ == "__main__":
    main()
