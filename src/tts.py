"""Voice synthesis with KittenTTS (neural local), Edge-TTS, and ElevenLabs + word timings for captions."""
import os, sys, json, base64, asyncio, subprocess, requests
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Ensure espeak-ng paths are configured on Windows
try:
    import espeakng_loader, phonemizer
    if hasattr(espeakng_loader, "get_data_path") and not os.environ.get("ESPEAK_DATA_PATH"):
        os.environ["ESPEAK_DATA_PATH"] = str(espeakng_loader.get_data_path())
    if hasattr(espeakng_loader, "get_library_path"):
        try:
            phonemizer.backend.espeak.wrapper.EspeakWrapper.set_library(espeakng_loader.get_library_path())
        except Exception:
            pass
except Exception:
    pass

_kitten_model = None
_kokoro_model = None

def get_kokoro_model(model_path=None, voices_path=None):
    """Loads and caches Kokoro-82M ONNX model instance."""
    global _kokoro_model
    if _kokoro_model is None:
        try:
            from kokoro_onnx import Kokoro
            m_path = model_path or (ROOT / "data" / "models" / "kokoro" / "kokoro-v1.0.int8.onnx")
            v_path = voices_path or (ROOT / "data" / "models" / "kokoro" / "voices-v1.0.bin")
            if Path(m_path).exists() and Path(v_path).exists():
                _kokoro_model = Kokoro(str(m_path), str(v_path))
            else:
                print(f"[Kokoro] Model files not found at {m_path} or {v_path}")
        except Exception as e:
            print(f"[Kokoro] Initialization error: {e}")
            _kokoro_model = None
    return _kokoro_model

def get_kitten_model(model_name="KittenML/kitten-tts-nano-0.8"):
    """Loads and caches KittenTTS model instance for low-latency generation."""
    global _kitten_model
    if _kitten_model is None:
        try:
            from kittenml import KittenTTS
            _kitten_model = KittenTTS(model_name)
            # Check for custom Hindi voice sample in data/voices
            voices_dir = ROOT / "data" / "voices"
            custom_npz = voices_dir / "hindi_sample.npz"
            if custom_npz.exists() and hasattr(_kitten_model, "model") and hasattr(_kitten_model.model, "voices"):
                import numpy as np
                custom_data = np.load(str(custom_npz))
                for k in custom_data.files:
                    _kitten_model.model.voices["hindi_custom"] = custom_data[k]
                    if "hindi_custom" not in _kitten_model.model.available_voices:
                        _kitten_model.model.available_voices.append("hindi_custom")
                print(f"[KittenTTS] Loaded custom Hindi voice sample from {custom_npz}")
        except Exception as e:
            print(f"[KittenTTS] Initialization error: {e}")
            _kitten_model = None
    return _kitten_model

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]))

def parse_elevenlabs_alignment(alignment):
    chars = alignment.get("characters", [])
    starts = alignment.get("character_start_times_seconds", [])
    ends = alignment.get("character_end_times_seconds", [])
    words = []
    curr_w, curr_start, curr_end = [], None, None
    for c, s, e in zip(chars, starts, ends):
        if c.isspace():
            if curr_w:
                words.append({"w": "".join(curr_w), "s": round(curr_start, 3), "e": round(curr_end, 3)})
                curr_w, curr_start = [], None
        else:
            if curr_start is None:
                curr_start = s
            curr_end = e
            curr_w.append(c)
    if curr_w:
        words.append({"w": "".join(curr_w), "s": round(curr_start, 3), "e": round(curr_end, 3)})
    return words

def _synth_elevenlabs(text, voice_id, api_key, out):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps"
    headers = {"xi-api-key": api_key, "Content-Type": "application/json"}
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}
    }
    resp = requests.post(url, json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    data = resp.json()
    with open(out, "wb") as f:
        f.write(base64.b64decode(data["audio_base64"]))
    return parse_elevenlabs_alignment(data.get("alignment", {}))

def _synth_kokoro(text, cfg, out):
    """Synthesizes speech using hexgrad/Kokoro-82M ONNX with native Hindi voices."""
    k = get_kokoro_model()
    if not k:
        raise RuntimeError("Kokoro ONNX model failed to load")
    voice = cfg.get("voice", "hm_omega")
    available = k.get_voices()
    if voice not in available:
        voice = "hm_omega" if "hm_omega" in available else (available[0] if available else "af")
    speed = float(cfg.get("speed", 1.0))
    lang = cfg.get("lang", "hi")
    
    samples, sample_rate = k.create(text, voice=voice, speed=speed, lang=lang)
    
    import soundfile as sf
    wav_out = Path(out).with_suffix(".wav")
    sf.write(str(wav_out), samples, sample_rate)
    
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(wav_out),
        "-ar", "44100", "-ac", "2",
        "-b:a", "192k",
        str(out)
    ], check=True)
    
    if wav_out.exists() and str(wav_out) != str(out):
        try:
            wav_out.unlink()
        except Exception:
            pass
    return []

def _synth_kitten(text, cfg, out):
    """Synthesizes speech using KittenTTS with optional custom Hindi voice sample."""
    model_name = cfg.get("voice_model", "KittenML/kitten-tts-nano-0.8")
    model = get_kitten_model(model_name)
    if not model:
        raise RuntimeError("KittenTTS model failed to load")

    # Select voice: check if custom Hindi voice exists, else use selected voice or default
    voice = cfg.get("voice", "Bruno")
    if hasattr(model, "model") and hasattr(model.model, "available_voices"):
        if "hindi_custom" in model.model.available_voices:
            voice = "hindi_custom"
        elif voice not in model.model.available_voices:
            voice = model.model.available_voices[0] if model.model.available_voices else "Bruno"

    speed = float(cfg.get("speed", 1.0))
    wav_out = Path(out).with_suffix(".wav")
    
    # Generate WAV via KittenTTS
    model.generate_to_file(text, str(wav_out), voice=voice, speed=speed, sample_rate=24000)

    # Convert to MP3
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(wav_out),
        "-ar", "44100", "-ac", "2",
        "-b:a", "192k",
        str(out)
    ], check=True)

    if wav_out.exists() and str(wav_out) != str(out):
        try:
            wav_out.unlink()
        except Exception:
            pass

    # Build aligned word timings for Remotion vertical captions
    audio_duration = dur(out)
    tokens = text.split()
    words = []
    if tokens:
        total_chars = sum(len(t) for t in tokens)
        curr = 0.0
        for t in tokens:
            w_dur = max(0.12, (len(t) / max(1, total_chars)) * audio_duration)
            words.append({"w": t, "s": round(curr, 3), "e": round(curr + w_dur, 3)})
            curr += w_dur
    return words

async def _synth_edge(text, cfg, out):
    voice = cfg.get("voice_model") or cfg.get("voice") or "hi-IN-MadhurNeural"
    # If Wavenet requested without Google key, fall back to high-fidelity Madhur Neural
    if "wavenet" in voice.lower() or not voice.startswith(("en-", "hi-", "Microsoft")):
        voice = cfg.get("fallback_voice", "hi-IN-MadhurNeural")
    kw = dict(rate=cfg.get("rate", "+0%"), pitch=cfg.get("pitch", "+0Hz"))
    try:
        import edge_tts
        try:
            comm = edge_tts.Communicate(text, voice, boundary="WordBoundary", **kw)
        except TypeError:
            comm = edge_tts.Communicate(text, voice, **kw)
        words = []
        with open(out, "wb") as f:
            async for ch in comm.stream():
                if ch["type"] == "audio":
                    f.write(ch["data"])
                elif ch["type"] == "WordBoundary":
                    words.append({"w": ch["text"], "s": round(ch["offset"] / 1e7, 3), "e": round((ch["offset"] + ch["duration"]) / 1e7, 3)})
        return words
    except Exception as e:
        print(f"[TTS] Edge-TTS error: {e}")
        return []

def _synth_google_wavenet(text, cfg, out):
    """Google Cloud Text-to-Speech API for hi-IN-Wavenet-C."""
    api_key = os.getenv("GOOGLE_TTS_API_KEY") or os.getenv("GCP_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise RuntimeError("GOOGLE_TTS_API_KEY is not set for Wavenet-C")
    voice_name = cfg.get("voice", "hi-IN-Wavenet-C")
    url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={api_key}"
    payload = {
        "input": {"text": text},
        "voice": {
            "languageCode": "hi-IN",
            "name": voice_name
        },
        "audioConfig": {
            "audioEncoding": "MP3",
            "speakingRate": float(cfg.get("speed", 0.93))
        }
    }
    r = requests.post(url, json=payload, timeout=30)
    r.raise_for_status()
    audio_content = base64.b64decode(r.json()["audioContent"])
    with open(out, "wb") as f:
        f.write(audio_content)
    return []

def _synth_openai(text, cfg, out):
    """OpenAI TTS (powers openai.fm) with native Hindi support."""
    api_key = os.getenv("OPENAI_API_KEY") or cfg.get("openai_api_key")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set in .env for OpenAI TTS (openai.fm)")
    model = cfg.get("voice_model", "tts-1")  # tts-1 or tts-1-hd
    voice = cfg.get("voice", "onyx")        # onyx (deep male), echo, alloy, nova, shimmer
    speed = float(cfg.get("speed", 0.95))
    url = "https://api.openai.com/v1/audio/speech"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "input": text,
        "voice": voice,
        "speed": speed
    }
    r = requests.post(url, headers=headers, json=payload, timeout=60)
    r.raise_for_status()
    with open(out, "wb") as f:
        f.write(r.content)
    return []

def synth_speech(text, cfg, out):
    provider = cfg.get("provider", "edge-tts").lower()
    voice = cfg.get("voice", "").lower()

    # 1. Kokoro-82M (Top Trending Hindi Open-Weights Model on Hugging Face)
    if provider in ("kokoro", "kokoro-82m", "kokoro_onnx", "hexgrad/kokoro-82m") or voice.startswith(("hm_", "hf_")):
        try:
            return _synth_kokoro(text, cfg, out)
        except Exception as e:
            print(f"[TTS] Kokoro-82M failed ({e}), falling back to studio neural voice: {cfg.get('fallback_voice', 'hi-IN-MadhurNeural')}")

    # 1. OpenAI TTS (openai.fm)
    if provider in ("openai", "openaifm", "openai.fm") or voice in ("onyx", "echo", "alloy", "fable", "nova", "shimmer"):
        try:
            return _synth_openai(text, cfg, out)
        except Exception as e:
            print(f"[TTS] OpenAI TTS (openai.fm) failed: {e}. Falling back to studio neural voice: {cfg.get('fallback_voice', 'hi-IN-MadhurNeural')}")

    # 2. KittenTTS (if provider is kittentts)
    if provider in ("kittentts", "kitten", "kitten_tts"):
        try:
            return _synth_kitten(text, cfg, out)
        except Exception as e:
            print(f"[TTS] KittenTTS synthesis failed ({e}), falling back to Edge-TTS.")

    # 3. Google Wavenet-C (if requested and API key available)
    if "wavenet" in voice or provider == "google":
        try:
            return _synth_google_wavenet(text, cfg, out)
        except Exception as e:
            print(f"[TTS] Google Wavenet-C unavailable ({e}), using studio neural fallback: {cfg.get('fallback_voice', 'hi-IN-MadhurNeural')}")

    # 3. ElevenLabs
    el_key = os.getenv("ELEVENLABS_API_KEY") or os.getenv("XI_API_KEY") or cfg.get("elevenlabs_api_key")
    if (provider == "elevenlabs" or cfg.get("voice") == "elevenlabs_neil") and el_key:
        voice_id = cfg.get("elevenlabs_voice_id") or "AZnzlk1XvdvUeBnXmlld"
        try:
            return _synth_elevenlabs(text, voice_id, el_key, out)
        except Exception as e:
            print(f"[TTS] ElevenLabs call failed ({e}), falling back to Edge-TTS.")

    # 4. Edge-TTS Studio Neural
    return asyncio.run(_synth_edge(text, cfg, out))

def narrate(scenes, workdir, cfg, pad=0.45):
    """Synthesizes speech using dual scripts: tts_text (Devanagari Hindi) for audio voice, narration (Hinglish) for on-screen lyrics."""
    workdir.mkdir(parents=True, exist_ok=True)
    parts = []
    for i, s in enumerate(scenes):
        raw, padded = workdir / f"s{i}_raw.mp3", workdir / f"s{i}.mp3"
        # 1. Voice audio: Use tts_text (Devanagari Hindi) if provided for 100% natural pronunciation
        voice_text = s.get("tts_text") or s["narration"]
        synth_speech(voice_text, cfg, raw)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", f"apad=pad_dur={pad}", "-ar", "44100", "-ac", "2", padded], check=True)
        s["durationSec"] = round(dur(padded), 3)

        # 2. Screen Lyrics / Captions: Always use Hinglish 'narration' for modern on-screen reading
        hinglish_tokens = s["narration"].split()
        if hinglish_tokens:
            step = (s["durationSec"] - pad) / max(1, len(hinglish_tokens))
            words = [{"w": t, "s": round(k * step, 3), "e": round((k + 1) * step, 3)} for k, t in enumerate(hinglish_tokens)]
        else:
            words = []
        s["words"] = words
        parts.append(padded)
    lst = workdir / "list.txt"
    lst.write_text("".join(f"file '{p.resolve().as_posix()}'\n" for p in parts))
    out = workdir / "voice.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c:a", "libmp3lame", "-q:a", "3", out], check=True)
    return out
