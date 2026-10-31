import os, sys, requests, subprocess
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

from src.tts import get_kokoro_model
from src.audio import pick_random_bgm

TELEGRAM_BOT_TOKEN = "9157728740:AAEBoV-I8TfxgppWYV1JLMAd0G2CgHnLrVQ"
TELEGRAM_CHAT_ID = "8905611751"

def mix_voice_and_bgm(voice_file: Path, out_file: Path) -> Path:
    bgm_file = pick_random_bgm(ROOT / "data" / "audio" / "bgm")
    if not bgm_file or not bgm_file.exists():
        return voice_file
    
    v_dur = float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(voice_file)
    ]).strip())
    
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
    out_dir = ROOT / "output" / "hybrid_samples"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    sample_text = (
        "एटॉमिक हैबिट्स हमें सिखाती है कि रोज़ाना सिर्फ एक प्रतिशत बेहतर होना आपके जीवन में बहुत बड़ा बदलाव ला सकता है। "
        "सफलता किसी एक बड़े कदम से नहीं, बल्कि रोज़ दोहराई जाने वाली छोटी-छोटी अच्छी आदतों से मिलती है। "
        "ऐसी और लाइफ चेंजिंग इनसाइट्स के लिए माइंडस्पार्क को अभी सब्सक्राइब करें!"
    )
    
    k = get_kokoro_model()
    import soundfile as sf
    
    # 1. Custom Female Hybrid: hf_beta (60%) + hf_alpha (40%)
    if k:
        print("Generating Kokoro Female Hybrid...")
        v_beta = k.get_voice_style("hf_beta")
        v_alpha = k.get_voice_style("hf_alpha")
        v_hybrid_female = (v_beta * 0.6) + (v_alpha * 0.4)
        samples, sr = k.create(sample_text, voice=v_hybrid_female, speed=0.93, lang="hi")
        
        raw_f = out_dir / "kokoro_hybrid_female_raw.wav"
        sf.write(str(raw_f), samples, sr)
        mp3_f = out_dir / "kokoro_hybrid_female_raw.mp3"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw_f), "-ar", "44100", "-ac", "2", "-b:a", "192k", str(mp3_f)], check=True)
        mixed_f = out_dir / "kokoro_hybrid_female_motivational.mp3"
        mix_voice_and_bgm(mp3_f, mixed_f)
        send_telegram_audio(
            mixed_f,
            title="Kokoro Hybrid Female (Beta 60% + Alpha 40%)",
            performer="Kokoro-82M Studio Blend",
            caption=(
                "*Kokoro-82M: Custom Female Hybrid Voice*\n\n"
                "- Blend: `hf_beta` (60%) + `hf_alpha` (40%)\n"
                "- Tone: Ultra-smooth, warm & expressive\n"
                "- Speed: 0.93 | BGM: Pixabay Motivational (-17dB)\n\n"
                "A blended alternative based on your favorite `hf_beta`!"
            )
        )

        # 2. Custom Male Hybrid: hm_omega (60%) + hm_psi (40%)
        print("Generating Kokoro Male Hybrid...")
        v_omega = k.get_voice_style("hm_omega")
        v_psi = k.get_voice_style("hm_psi")
        v_hybrid_male = (v_omega * 0.6) + (v_psi * 0.4)
        samples_m, sr_m = k.create(sample_text, voice=v_hybrid_male, speed=0.93, lang="hi")
        
        raw_m = out_dir / "kokoro_hybrid_male_raw.wav"
        sf.write(str(raw_m), samples_m, sr_m)
        mp3_m = out_dir / "kokoro_hybrid_male_raw.mp3"
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(raw_m), "-ar", "44100", "-ac", "2", "-b:a", "192k", str(mp3_m)], check=True)
        mixed_m = out_dir / "kokoro_hybrid_male_motivational.mp3"
        mix_voice_and_bgm(mp3_m, mixed_m)
        send_telegram_audio(
            mixed_m,
            title="Kokoro Hybrid Male (Omega 60% + Psi 40%)",
            performer="Kokoro-82M Studio Blend",
            caption=(
                "*Kokoro-82M: Custom Male Hybrid Voice*\n\n"
                "- Blend: `hm_omega` (60%) + `hm_psi` (40%)\n"
                "- Tone: Rich resonant baritone guru narrator\n"
                "- Speed: 0.93 | BGM: Pixabay Motivational (-17dB)"
            )
        )

    # 3. Google Translate Hindi (gTTS)
    try:
        from gtts import gTTS
        print("Generating Google TTS Hindi...")
        raw_gtts = out_dir / "google_tts_raw.mp3"
        tts = gTTS(text=sample_text, lang="hi", slow=False)
        tts.save(str(raw_gtts))
        mixed_gtts = out_dir / "google_tts_motivational.mp3"
        mix_voice_and_bgm(raw_gtts, mixed_gtts)
        send_telegram_audio(
            mixed_gtts,
            title="Google Hindi (Official gTTS)",
            performer="Google Speech",
            caption=(
                "*Google Official Hindi Voice (gTTS)*\n\n"
                "- Engine: Google Translate Text-to-Speech\n"
                "- Tone: Clean, familiar authentic Hindi pronunciation\n"
                "- BGM: Pixabay Motivational (-17dB)"
            )
        )
    except Exception as e:
        print(f"gTTS error: {e}")

if __name__ == "__main__":
    main()

