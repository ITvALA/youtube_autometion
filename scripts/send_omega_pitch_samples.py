import os, sys, requests, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

from src.tts import synth_speech

TELEGRAM_BOT_TOKEN = "9157728740:AAEBoV-I8TfxgppWYV1JLMAd0G2CgHnLrVQ"
TELEGRAM_CHAT_ID = "8905611751"

def apply_pitch_and_mix_bgm(voice_file: Path, bgm_file: Path, out_file: Path, pitch_factor=1.0, vol_db="-21dB"):
    # Apply pitch shift: if pitch_factor < 1.0, lower pitch (darker/deeper)
    pitched_voice = voice_file.with_name(f"{voice_file.stem}_pitched_{int(pitch_factor*100)}.mp3")
    if pitch_factor != 1.0:
        # asetrate shifts pitch & speed, atempo compensates speed back to normal
        rate = int(44100 * pitch_factor)
        tempo = 1.0 / pitch_factor
        cmd_pitch = [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(voice_file),
            "-af", f"asetrate={rate},atempo={tempo:.4f}",
            "-ar", "44100",
            str(pitched_voice)
        ]
        subprocess.run(cmd_pitch, check=True)
    else:
        pitched_voice = voice_file

    v_dur = float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(pitched_voice)
    ]).strip())
    
    total_dur = v_dur + 0.5
    cmd_mix = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(pitched_voice),
        "-stream_loop", "-1", "-i", str(bgm_file),
        "-filter_complex",
        f"[1:a]volume={vol_db},afade=t=in:st=0:d=1.2,afade=t=out:st={max(0, total_dur - 1.5)}:d=1.5[bgm];"
        f"[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]",
        "-map", "[aout]",
        "-t", str(total_dur),
        "-ar", "44100", "-ac", "2", "-b:a", "192k",
        str(out_file)
    ]
    subprocess.run(cmd_mix, check=True)
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
    out_dir = ROOT / "output" / "omega_pitch_samples"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    sample_text = (
        "एटॉमिक हैबिट्स हमें सिखाती है कि रोज़ाना सिर्फ एक प्रतिशत बेहतर होना आपके जीवन में बहुत बड़ा बदलाव ला सकता है। "
        "सफलता किसी एक बड़े कदम से नहीं, बल्कि रोज़ दोहराई जाने वाली छोटी-छोटी अच्छी आदतों से मिलती है। "
        "ऐसी और लाइफ चेंजिंग इनसाइट्स के लिए माइंडस्पार्क को अभी सब्सक्राइब करें!"
    )
    
    cfg = {
        "provider": "kokoro",
        "voice": "hm_omega",
        "speed": 1.0,
        "lang": "hi",
        "rate": "+0%"
    }
    
    raw_voice = out_dir / "hm_omega_raw.mp3"
    print("Synthesizing hm_omega raw voice...")
    synth_speech(sample_text, cfg, raw_voice)
    
    bgm_path = ROOT / "data" / "audio" / "bgm" / "modern-classical-inspirational-piano-625708.mp3"
    
    pitch_variations = [
        {
            "factor": 1.0,
            "title": "hm_omega (Natural Pitch 1.0x)",
            "desc": "*hm_omega (Natural Pitch - Bold & Confident)*\n\n- Voice: `hm_omega` (Kokoro Hindi Male)\n- Tone: Confident, steady, clear articulation (no hesitations)\n- Pitch: Natural (1.0x)\n- BGM: Soft Piano (-21dB)"
        },
        {
            "factor": 0.95,
            "title": "hm_omega (Deep Pitch -5%)",
            "desc": "*hm_omega (Deep Pitch - Dark Baritone)*\n\n- Voice: `hm_omega` (Kokoro Hindi Male)\n- Tone: Deeper, heavier, authoritative narrator\n- Pitch: `-5%` deeper\n- BGM: Soft Piano (-21dB)"
        },
        {
            "factor": 0.92,
            "title": "hm_omega (Dark Pitch -8%)",
            "desc": "*hm_omega (Dark Pitch - Extra Deep & Heavy)*\n\n- Voice: `hm_omega` (Kokoro Hindi Male)\n- Tone: Very deep documentary / cinematic trailer narrator\n- Pitch: `-8%` dark\n- BGM: Soft Piano (-21dB)"
        }
    ]
    
    for v in pitch_variations:
        out_f = out_dir / f"hm_omega_pitch_{int(v['factor']*100)}.mp3"
        print(f"Processing {v['title']}...")
        apply_pitch_and_mix_bgm(raw_voice, bgm_path, out_f, pitch_factor=v["factor"], vol_db="-21dB")
        send_telegram_audio(out_f, v["title"], "MindSpark (hm_omega)", v["desc"])

if __name__ == "__main__":
    main()

