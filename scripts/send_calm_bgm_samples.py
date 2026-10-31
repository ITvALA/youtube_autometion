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
    out_dir = ROOT / "output" / "calm_bgm_samples"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    sample_text = (
        "एटॉमिक हैबिट्स हमें सिखाती है कि रोज़ाना सिर्फ एक प्रतिशत बेहतर होना आपके जीवन में बहुत बड़ा बदलाव ला सकता है। "
        "सफलता किसी एक बड़े कदम से नहीं, बल्कि रोज़ दोहराई जाने वाली छोटी-छोटी अच्छी आदतों से मिलती है। "
        "ऐसी और लाइफ चेंजिंग इनसाइट्स के लिए माइंडस्पार्क को अभी सब्सक्राइब करें!"
    )
    
    cfg = {
        "provider": "kokoro",
        "voice": "hf_beta",
        "speed": 0.93,
        "lang": "hi"
    }
    
    raw_voice = out_dir / "hf_beta_clean_raw.mp3"
    print("Synthesizing hf_beta voice...")
    synth_speech(sample_text, cfg, raw_voice)
    
    calm_tracks = [
        {
            "filename": "modern-classical-inspirational-piano-625708.mp3",
            "title": "BGM 1: Soft Inspirational Piano (-21dB)",
            "style": "Soft Inspirational Piano (20% Lower Volume)",
            "desc": "*Track 1: Soft Inspirational Piano*\n\n- Voice: `hf_beta` (Kokoro-82M)\n- BGM Volume: `-21dB` (20% reduced - voice stands out clearly!)\n- Style: Gentle acoustic piano with motivational chords."
        },
        {
            "filename": "modern-classical-uplifting-calm-355592.mp3",
            "title": "BGM 2: Uplifting Calm Strings (-21dB)",
            "style": "Uplifting Calm Strings & Harmony (20% Lower Volume)",
            "desc": "*Track 2: Uplifting Calm Strings*\n\n- Voice: `hf_beta` (Kokoro-82M)\n- BGM Volume: `-21dB` (20% reduced)\n- Style: Peaceful, non-intrusive uplifting strings harmony."
        },
        {
            "filename": "modern-classical-calm-discovery-152248.mp3",
            "title": "BGM 3: Calm Discovery Ambient (-21dB)",
            "style": "Calm Discovery Ambient Pad (20% Lower Volume)",
            "desc": "*Track 3: Calm Discovery Ambient*\n\n- Voice: `hf_beta` (Kokoro-82M)\n- BGM Volume: `-21dB` (20% reduced)\n- Style: Subtle cinematic atmosphere with zero clutter."
        }
    ]
    
    for item in calm_tracks:
        bgm_path = ROOT / "data" / "audio" / "bgm" / item["filename"]
        if bgm_path.exists():
            out_file = out_dir / f"hf_beta_{item['filename']}"
            print(f"Mixing with {item['filename']}...")
            mix_specific_bgm(raw_voice, bgm_path, out_file, vol_db="-21dB")
            send_telegram_audio(out_file, item["title"], "MindSpark (hf_beta)", item["desc"])

if __name__ == "__main__":
    main()

