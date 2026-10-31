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
    voice = cfg.get("voice_model") or cfg.get("voice") or "en-IN-PrabhatNeural"
    if not voice.startswith(("en-", "hi-", "Microsoft")):
        voice = "en-IN-PrabhatNeural"
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

def synth_speech(text, cfg, out):
    provider = cfg.get("provider", "kittentts").lower()
    
    # 1. KittenTTS (Default / Requested)
    if provider in ("kittentts", "kitten", "kitten_tts"):
        try:
            return _synth_kitten(text, cfg, out)
        except Exception as e:
            print(f"[TTS] KittenTTS synthesis failed ({e}), falling back to Edge-TTS.")

    # 2. ElevenLabs
    el_key = os.getenv("ELEVENLABS_API_KEY") or os.getenv("XI_API_KEY") or cfg.get("elevenlabs_api_key")
    if (provider == "elevenlabs" or cfg.get("voice") == "elevenlabs_neil") and el_key:
        voice_id = cfg.get("elevenlabs_voice_id") or "AZnzlk1XvdvUeBnXmlld"
        try:
            return _synth_elevenlabs(text, voice_id, el_key, out)
        except Exception as e:
            print(f"[TTS] ElevenLabs call failed ({e}), falling back to Edge-TTS.")

    # 3. Edge-TTS Fallback
    return asyncio.run(_synth_edge(text, cfg, out))

def narrate(scenes, workdir, cfg, pad=0.45):
    workdir.mkdir(parents=True, exist_ok=True)
    parts = []
    for i, s in enumerate(scenes):
        raw, padded = workdir / f"s{i}_raw.mp3", workdir / f"s{i}.mp3"
        words = synth_speech(s["narration"], cfg, raw)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", f"apad=pad_dur={pad}", "-ar", "44100", "-ac", "2", padded], check=True)
        s["durationSec"] = round(dur(padded), 3)
        if not words:  # fallback: evenly spaced words
            toks = s["narration"].split()
            step = (s["durationSec"] - pad) / max(1, len(toks))
            words = [{"w": t, "s": round(k * step, 3), "e": round((k + 1) * step, 3)} for k, t in enumerate(toks)]
        s["words"] = words
        parts.append(padded)
    lst = workdir / "list.txt"
    lst.write_text("".join(f"file '{p.resolve().as_posix()}'\n" for p in parts))
    out = workdir / "voice.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-c:a", "libmp3lame", "-q:a", "3", out], check=True)
    return out
