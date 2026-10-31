import os, sys, requests, subprocess
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

from src.tts import get_kokoro_model, synth_speech

TELEGRAM_BOT_TOKEN = "9157728740:AAEBoV-I8TfxgppWYV1JLMAd0G2CgHnLrVQ"
TELEGRAM_CHAT_ID = "8905611751"

def dur(p):
    return float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)
    ]).strip())

def mix_specific_bgm(voice_file: Path, bgm_file: Path, out_file: Path, vol_db="-21dB"):
    v_dur = dur(voice_file)
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
    out_dir = ROOT / "output" / "tri_blend_samples"
    out_dir.mkdir(parents=True, exist_ok=True)
    
    sample_text = (
        "एटॉमिक हैबिट्स हमें सिखाती है कि रोज़ाना सिर्फ एक प्रतिशत बेहतर होना आपके जीवन में बहुत बड़ा बदलाव ला सकता है। "
        "सफलता किसी एक बड़े कदम से नहीं, बल्कि रोज़ दोहराई जाने वाली छोटी-छोटी अच्छी आदतों से मिलती है। "
        "ऐसी और लाइफ चेंजिंग इनसाइट्स के लिए माइंडस्पार्क को अभी सब्सक्राइब करें!"
    )
    bgm_path = ROOT / "data" / "audio" / "bgm" / "modern-classical-inspirational-piano-625708.mp3"
    
    # 1. Kokoro Omega + Psi Latent Blend (Pure 50/50 blend in neural space)
    k = get_kokoro_model()
    raw_kokoro_blend = out_dir / "kokoro_omega_psi_blend.mp3"
    if k:
        print("Creating Kokoro (hm_omega 50% + hm_psi 50%) latent fusion...")
        v_omega = k.get_voice_style("hm_omega")
        v_psi = k.get_voice_style("hm_psi")
        v_fused = (v_omega * 0.5) + (v_psi * 0.5)
        samples, sr = k.create(sample_text, voice=v_fused, speed=1.0, lang="hi")
        wav_tmp = out_dir / "kokoro_fused_tmp.wav"
        sf.write(str(wav_tmp), samples, sr)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_tmp), "-ar", "44100", "-ac", "2", "-b:a", "192k", str(raw_kokoro_blend)], check=True)
        if wav_tmp.exists():
            wav_tmp.unlink()
            
    # 2. Madhur Neural (Edge-TTS)
    raw_madhur = out_dir / "madhur_raw.mp3"
    print("Generating Madhur Neural...")
    cfg_madhur = {"provider": "edge-tts", "voice": "hi-IN-MadhurNeural", "speed": 1.0, "rate": "+0%"}
    synth_speech(sample_text, cfg_madhur, raw_madhur)
    
    # 3. Method A: Studio Master Vocal Blend (Layering Madhur with Kokoro Omega+Psi)
    # Time align Kokoro blend to Madhur's timing exactly
    d_madhur = dur(raw_madhur)
    d_kokoro = dur(raw_kokoro_blend)
    tempo_ratio = d_kokoro / d_madhur
    print(f"Madhur duration: {d_madhur:.2f}s, Kokoro duration: {d_kokoro:.2f}s, tempo ratio: {tempo_ratio:.4f}")
    
    kokoro_aligned = out_dir / "kokoro_aligned.mp3"
    # Adjust tempo of kokoro to match madhur
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(raw_kokoro_blend),
        "-filter:a", f"atempo={tempo_ratio:.4f}",
        str(kokoro_aligned)
    ], check=True)
    
    # Mix Madhur (60% clarity & diction) + Kokoro (40% chest warmth & baritone)
    layered_voice = out_dir / "tri_blend_layered_raw.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(raw_madhur),
        "-i", str(kokoro_aligned),
        "-filter_complex", "[0:a]volume=0.65[a0];[1:a]volume=0.35[a1];[a0][a1]amix=inputs=2:duration=first[aout]",
        "-map", "[aout]",
        "-ar", "44100", "-ac", "2", "-b:a", "192k",
        str(layered_voice)
    ], check=True)
    
    final_layered = out_dir / "tri_blend_studio_master.mp3"
    mix_specific_bgm(layered_voice, bgm_path, final_layered, vol_db="-21dB")
    send_telegram_audio(
        final_layered,
        title="Tri-Blend Studio Master (Madhur + Omega + Psi)",
        performer="MindSpark Tri-Vocal Fusion",
        caption=(
            "*Tri-Blend Method 1: Studio Master Layering*\n\n"
            "- Combines all 3: `Madhur Neural` (Diction) + `hm_omega` (Confidence) + `hm_psi` (Storytelling depth)\n"
            "- Time-aligned & layered in stereo\n"
            "- BGM: Soft Piano (-21dB ducked)"
        )
    )

    # Method B: Pure Kokoro Latent Fusion (Omega 50% + Psi 50%)
    final_kokoro_fused = out_dir / "kokoro_omega_psi_motivational.mp3"
    mix_specific_bgm(raw_kokoro_blend, bgm_path, final_kokoro_fused, vol_db="-21dB")
    send_telegram_audio(
        final_kokoro_fused,
        title="Kokoro Dual-Male Latent Blend (Omega + Psi)",
        performer="Kokoro-82M (hm_omega 50% + hm_psi 50%)",
        caption=(
            "*Tri-Blend Method 2: Kokoro Latent Fusion (Omega + Psi)*\n\n"
            "- Blends `hm_omega` (50%) + `hm_psi` (50%) inside neural weights\n"
            "- 100% natural synchronization, rich baritone storytelling warmth\n"
            "- BGM: Soft Piano (-21dB ducked)"
        )
    )

    # Method C: Multi-Speaker Co-Host Trio (Scene 1 Hook = Madhur, Scene 2 Insights = Omega, Scene 3 Outro = Psi)
    print("Generating Multi-Speaker Co-Host Trio...")
    sc1_text = "एटॉमिक हैबिट्स हमें सिखाती है कि रोज़ाना सिर्फ एक प्रतिशत बेहतर होना आपके जीवन में बहुत बड़ा बदलाव ला सकता है।"
    sc2_text = "सफलता किसी एक बड़े कदम से नहीं, बल्कि रोज़ दोहराई जाने वाली छोटी-छोटी अच्छी आदतों से मिलती है।"
    sc3_text = "ऐसी और लाइफ चेंजिंग इनसाइट्स के लिए माइंडस्पार्क को अभी सब्सक्राइब करें!"
    
    part1 = out_dir / "part1_madhur.mp3"
    part2 = out_dir / "part2_omega.mp3"
    part3 = out_dir / "part3_psi.mp3"
    
    synth_speech(sc1_text, {"provider": "edge-tts", "voice": "hi-IN-MadhurNeural", "speed": 1.0, "rate": "+0%"}, part1)
    synth_speech(sc2_text, {"provider": "kokoro", "voice": "hm_omega", "speed": 1.0, "lang": "hi", "rate": "+0%"}, part2)
    synth_speech(sc3_text, {"provider": "kokoro", "voice": "hm_psi", "speed": 1.0, "lang": "hi", "rate": "+0%"}, part3)
    
    concat_list = out_dir / "cohost_list.txt"
    concat_list.write_text(f"file '{part1.resolve().as_posix()}'\nfile '{part2.resolve().as_posix()}'\nfile '{part3.resolve().as_posix()}'\n")
    cohost_voice = out_dir / "cohost_voice.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(concat_list), "-c:a", "libmp3lame", "-b:a", "192k", str(cohost_voice)], check=True)
    
    final_cohost = out_dir / "cohost_trio_motivational.mp3"
    mix_specific_bgm(cohost_voice, bgm_path, final_cohost, vol_db="-21dB")
    send_telegram_audio(
        final_cohost,
        title="Dynamic Co-Host Trio (Madhur -> Omega -> Psi)",
        performer="MindSpark Multi-Speaker Trio",
        caption=(
            "*Tri-Blend Method 3: Dynamic Co-Host Trio*\n\n"
            "- Hook: `Madhur Neural` (Powerful opening)\n"
            "- Core Insight: `hm_omega` (Confident teaching)\n"
            "- Outro & CTA: `hm_psi` (Warm subscriber invite)\n"
            "- BGM: Soft Piano (-21dB ducked)"
        )
    )

if __name__ == "__main__":
    main()
