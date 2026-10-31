import os, sys, requests, subprocess
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
    out_dir = ROOT / "output" / "extra_samples"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    sample_text = (
        "एटॉमिक हैबिट्स हमें सिखाती है कि रोज़ाना सिर्फ एक प्रतिशत बेहतर होना आपके जीवन में बहुत बड़ा बदलाव ला सकता है। "
        "सफलता किसी एक बड़े कदम से नहीं, बल्कि रोज़ दोहराई जाने वाली छोटी-छोटी अच्छी आदतों से मिलती है। "
        "ऐसी और लाइफ चेंजिंग इनसाइट्स के लिए माइंडस्पार्क को अभी सब्सक्राइब करें!"
    )
    
    voices = [
        {
            "name": "hm_psi",
            "provider": "kokoro",
            "voice": "hm_psi",
            "speed": 0.93,
            "lang": "hi",
            "title": "Kokoro-82M (hm_psi) - Male #2",
            "performer": "Kokoro-82M (Male 2)",
            "desc": "*Kokoro-82M Hindi Male #2 (`hm_psi`)*\n\n- Model: `hexgrad/Kokoro-82M` (Open-weights on HF)\n- Voice: `hm_psi` (Male Storyteller)\n- Background: Pixabay Motivational BGM (-17dB ducked)"
        },
        {
            "name": "hf_beta",
            "provider": "kokoro",
            "voice": "hf_beta",
            "speed": 0.93,
            "lang": "hi",
            "title": "Kokoro-82M (hf_beta) - Female #2",
            "performer": "Kokoro-82M (Female 2)",
            "desc": "*Kokoro-82M Hindi Female #2 (`hf_beta`)*\n\n- Model: `hexgrad/Kokoro-82M` (Open-weights on HF)\n- Voice: `hf_beta` (Female Expressive)\n- Background: Pixabay Motivational BGM (-17dB ducked)"
        },
        {
            "name": "hi_in_madhur",
            "provider": "edge-tts",
            "voice": "hi-IN-MadhurNeural",
            "speed": 0.93,
            "rate": "-7%",
            "title": "Madhur Neural (Studio Hindi Male)",
            "performer": "Microsoft Studio Neural",
            "desc": "*Microsoft Studio Neural: Madhur (`hi-IN-MadhurNeural`)*\n\n- Voice: Madhur (Deep, authoritative Hindi male narrator)\n- Speed: -7% (Calm articulation)\n- Background: Pixabay Motivational BGM (-17dB ducked)\n- Most popular for high-retention YouTube Shorts!"
        },
        {
            "name": "hi_in_swara",
            "provider": "edge-tts",
            "voice": "hi-IN-SwaraNeural",
            "speed": 0.93,
            "rate": "-7%",
            "title": "Swara Neural (Studio Hindi Female)",
            "performer": "Microsoft Studio Neural",
            "desc": "*Microsoft Studio Neural: Swara (`hi-IN-SwaraNeural`)*\n\n- Voice: Swara (Clear, warm Hindi female narrator)\n- Speed: -7% (Calm articulation)\n- Background: Pixabay Motivational BGM (-17dB ducked)"
        }
    ]
    
    for v in voices:
        print(f"Generating voice: {v['name']}...")
        raw_f = out_dir / f"{v['name']}_raw.mp3"
        synth_speech(sample_text, v, raw_f)
        mixed_f = out_dir / f"{v['name']}_motivational.mp3"
        mix_voice_and_bgm(raw_f, mixed_f)
        send_telegram_audio(mixed_f, v["title"], v["performer"], v["desc"])

if __name__ == "__main__":
    main()
