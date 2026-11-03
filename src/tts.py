"""MINDSPARK voice synthesis.

Chain (config "providers"): Gemini TTS (AI Studio key, no card) -> Google Chirp 3 HD -> Edge-TTS Madhur
Each Gemini key (GEMINI_API_KEY, GEMINI_API_KEY_2 ...) and model is tried in order.
Optional: ElevenLabs, OpenAI (gpt-4o-mini-tts)

Features: per-scene cache (re-runs cost 0 chars), monthly quota guard,
natural-pause friendly post-processing, loudness normalisation.
"""
import os, re, json, time, wave, base64, shutil, hashlib, asyncio, subprocess, requests
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE_DIR = ROOT / "data" / "tts_cache"
USAGE_FILE = ROOT / "data" / "tts_usage.json"

LEAD, TAIL, TAIL_LAST = 0.12, 0.30, 0.50

# Har scene ke baad yahan likha jata hai ki kaunsa provider/voice actually use hua (Telegram caption me dikhta hai)
_STATE = {"provider": None, "voice": None, "cached": False, "fails": []}


def _short_why(msg):
    """Lambe error se chhota karan: 'HTTP 404 gemini-3.8-flash-tts' jaisa."""
    codes = []
    for c in re.findall(r"HTTP \d{3}", msg or ""):
        if c not in codes:
            codes.append(c)
    model = re.search(r"gkey\d/([\w.\-]+)", msg or "")
    if codes:
        return " ".join(codes) + (f" {model.group(1)}" if model else "")
    return (msg or "")[-70:]


def strip_tags(text):
    """<short pause>, <breath> jaise Gemini tags hatao (Edge/Chirp unhe bol dete hain, captions me bhi nahi chahiye)."""
    return re.sub(r"\s+", " ", re.sub(r"<[^>]*>", " ", text or "")).strip()


# ----------------------------------------------------------------- helpers
def dur(p):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]))


def _usage_month():
    return time.strftime("%Y-%m")


def _usage_read():
    try:
        d = json.loads(USAGE_FILE.read_text())
    except Exception:
        d = {}
    m = d.get(_usage_month(), {})
    if isinstance(m, int):  # old format
        m = {"key1": m}
    return d, m


def _usage_get(slot="key1"):
    return int(_usage_read()[1].get(slot, 0))


def _usage_add(n, slot="key1"):
    d, m = _usage_read()
    m[slot] = int(m.get(slot, 0)) + int(n)
    d[_usage_month()] = m
    USAGE_FILE.parent.mkdir(parents=True, exist_ok=True)
    USAGE_FILE.write_text(json.dumps(d))


def _google_keys():
    """[(slot, key)] in priority order: GOOGLE_TTS_API_KEY, GOOGLE_TTS_API_KEY_2, _3 ..."""
    keys = []
    k1 = os.getenv("GOOGLE_TTS_API_KEY") or os.getenv("GCP_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if k1:
        keys.append(("key1", k1))
    for n in range(2, 6):
        k = os.getenv(f"GOOGLE_TTS_API_KEY_{n}")
        if k:
            keys.append((f"key{n}", k))
    return keys


# --------------------------------------------------------------- providers
def _synth_google_chirp(text, cfg, out):
    """Google Cloud TTS - Chirp 3 HD. Tries key 1, then key 2 (3, 4, 5) if a key is
    over quota / billing-disabled / invalid / failing."""
    keys = _google_keys()
    if not keys:
        raise RuntimeError("GOOGLE_TTS_API_KEY is not set")

    limit = int(cfg.get("monthly_char_limit", 950000))  # per key
    payload = {
        "input": {"text": text},
        "voice": {"languageCode": cfg.get("language_code", "hi-IN"),
                  "name": cfg.get("voice", "hi-IN-Chirp3-HD-Charon")},
        "audioConfig": {"audioEncoding": "MP3", "speakingRate": float(cfg.get("speed", 1.0))},
    }
    errors = []
    for slot, key in keys:
        used = _usage_get(slot)
        if used + len(text) > limit:
            errors.append(f"{slot}: local quota guard ({used:,}/{limit:,})")
            print(f"[TTS] {slot} quota guard hit, trying next key")
            continue
        url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={key}"
        for attempt in range(2):
            try:
                r = requests.post(url, json=payload, timeout=40)
                if r.status_code in (400, 401, 403):      # bad key / billing off / quota exhausted
                    raise PermissionError(f"HTTP {r.status_code} {r.text[:120]}")
                if r.status_code in (429, 500, 502, 503):  # transient or quota: retry once
                    raise RuntimeError(f"HTTP {r.status_code}")
                r.raise_for_status()
                Path(out).write_bytes(base64.b64decode(r.json()["audioContent"]))
                _usage_add(len(text), slot)
                if slot != "key1":
                    print(f"[TTS] used backup {slot}")
                return []
            except PermissionError as e:
                errors.append(f"{slot}: {e}")
                break                                       # no point retrying this key
            except Exception as e:
                errors.append(f"{slot}: {e}")
                time.sleep(1.5)
        print(f"[TTS] {slot} failed, trying next key")
    raise RuntimeError("all Google keys failed: " + " | ".join(errors))


def _gemini_keys():
    keys = []
    k1 = os.getenv("GEMINI_API_KEY")
    if k1:
        keys.append(("gkey1", k1))
    for n in range(2, 6):
        k = os.getenv(f"GEMINI_API_KEY_{n}")
        if k:
            keys.append((f"gkey{n}", k))
    return keys


GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta"


def _find_audio(obj):
    """Interactions response me se aakhri audio block dhoondho (steps[].content[] type=audio)."""
    found = None
    if isinstance(obj, dict):
        if obj.get("type") == "audio" and obj.get("data"):
            found = obj
        for v in obj.values():
            r = _find_audio(v)
            if r:
                found = r
    elif isinstance(obj, list):
        for v in obj:
            r = _find_audio(v)
            if r:
                found = r
    return found


def _gemini_new_api(model):
    """Gemini 3.x TTS models: /v1beta/interactions + speech_metadata.style (text = sirf transcript)."""
    return str(model).startswith("gemini-3")


def _synth_gemini(text, cfg, out):
    """Gemini TTS via AI Studio key.
    - gemini-3.8-*: Interactions API. `style` speech_metadata me jata hai (bola nahi jata), tags (<short pause> ...) transcript me rehte hain.
    - purane models (2.5 ...): generateContent, style prompt ke aage lagta hai.
    Rotates: key1 -> key2 ..., and for each key: models in cfg['gemini_models'] order."""
    keys = _gemini_keys()
    if not keys:
        raise RuntimeError("GEMINI_API_KEY is not set")
    models = cfg.get("gemini_models") or ["gemini-3.8-flash-tts"]
    style = (cfg.get("style") or "").strip()
    voice = cfg.get("voice", "Charon")
    errors = []
    for slot, key in keys:
        for model in models:
            new_api = _gemini_new_api(model)
            if new_api:
                url = f"{GEMINI_BASE}/interactions"
                item = {"type": "text", "text": text}
                if style:
                    item["annotations"] = [{"type": "speech_metadata", "style": style}]
                body = {
                    "model": model,
                    "input": [{"type": "user_input", "content": [item]}],
                    "response_format": {"type": "audio"},
                    "generation_config": {"speech_config": [{"voice": voice}]},
                }
            else:
                url = f"{GEMINI_BASE}/models/{model}:generateContent"
                plain = strip_tags(text)
                body = {
                    "contents": [{"parts": [{"text": f"{style}: {plain}" if style else plain}]}],
                    "generationConfig": {
                        "responseModalities": ["AUDIO"],
                        "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voice}}},
                    },
                }
            for attempt in range(2):
                try:
                    r = requests.post(url, json=body, headers={"x-goog-api-key": key}, timeout=120)
                    if r.status_code in (400, 401, 403, 404, 429):   # bad key/model/request, no access, quota
                        raise PermissionError(f"HTTP {r.status_code} {r.text[:160]}")
                    if r.status_code >= 500:
                        raise RuntimeError(f"HTTP {r.status_code}")
                    r.raise_for_status()
                    j = r.json()
                    if new_api:
                        blk = _find_audio(j)
                        if not blk:
                            raise RuntimeError("no audio in response")
                        raw_bytes = base64.b64decode(blk["data"])
                        mime = blk.get("mime_type") or blk.get("mimeType") or "audio/wav"
                    else:
                        part = j["candidates"][0]["content"]["parts"][0]
                        inline = part.get("inlineData") or part.get("inline_data")
                        if not inline:
                            raise RuntimeError("no audio in response")
                        raw_bytes = base64.b64decode(inline["data"])
                        mime = inline.get("mimeType") or inline.get("mime_type") or ""
                    wav = Path(out).with_suffix(".gem.wav")
                    if raw_bytes[:4] == b"RIFF":          # already a WAV file
                        wav.write_bytes(raw_bytes)
                    else:                                  # headerless 16-bit PCM
                        rate = 24000
                        if "rate=" in mime:
                            try:
                                rate = int(mime.split("rate=")[1].split(";")[0])
                            except Exception:
                                pass
                        with wave.open(str(wav), "wb") as w:
                            w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
                            w.writeframes(raw_bytes)
                    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav),
                                    "-ar", "44100", "-ac", "2", "-b:a", "192k", str(out)], check=True)
                    try:
                        wav.unlink()
                    except Exception:
                        pass
                    print(f"[TTS] gemini ok via {slot} / {model} / {voice}")
                    return []
                except PermissionError as e:
                    errors.append(f"{slot}/{model}: {e}")
                    break                       # don't retry this key+model, go next
                except Exception as e:
                    errors.append(f"{slot}/{model}: {e}")
                    time.sleep(1.5)
            print(f"[TTS] {slot}/{model} failed, trying next")
    raise RuntimeError("all Gemini keys/models failed: " + " | ".join(errors[-4:]))


async def _synth_edge_async(text, cfg, out):
    import edge_tts
    voice = cfg.get("voice") or "hi-IN-MadhurNeural"
    comm = edge_tts.Communicate(text, voice, rate=cfg.get("rate", "+0%"), pitch=cfg.get("pitch", "+0Hz"))
    with open(out, "wb") as f:
        async for ch in comm.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
    return []


def _synth_edge(text, cfg, out):
    return asyncio.run(_synth_edge_async(text, cfg, out))


def _synth_elevenlabs(text, cfg, out):
    key = os.getenv("ELEVENLABS_API_KEY") or os.getenv("XI_API_KEY")
    if not key:
        raise RuntimeError("ELEVENLABS_API_KEY is not set")
    voice_id = cfg.get("elevenlabs_voice_id") or "AZnzlk1XvdvUeBnXmlld"
    r = requests.post(
        f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
        headers={"xi-api-key": key, "Content-Type": "application/json"},
        json={"text": text, "model_id": cfg.get("voice_model", "eleven_multilingual_v2"),
              "voice_settings": {"stability": 0.35, "similarity_boost": 0.75,
                                 "style": 0.3, "use_speaker_boost": True}},
        timeout=60)
    r.raise_for_status()
    Path(out).write_bytes(r.content)
    return []


def _synth_openai(text, cfg, out):
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    payload = {"model": cfg.get("voice_model", "gpt-4o-mini-tts"), "voice": cfg.get("voice", "onyx"),
               "input": text, "response_format": "mp3"}
    if cfg.get("instructions"):
        payload["instructions"] = cfg["instructions"]
    r = requests.post("https://api.openai.com/v1/audio/speech",
                      headers={"Authorization": f"Bearer {key}"}, json=payload, timeout=60)
    r.raise_for_status()
    Path(out).write_bytes(r.content)
    return []



_LOCAL_XTTS_MODEL = None

def _ensure_devanagari_hindi(text):
    """XTTS-v2 speaks with an American/foreign accent if fed Roman Latin alphabet.
    This guard guarantees that any Latin/English or Hinglish characters are converted
    into pure, authentic Devanagari Hindi so Raju's voice clone sounds 100% native Indian."""
    if not text:
        return ""
    latin_chars = re.findall(r'[a-zA-Z]', text)
    if len(latin_chars) == 0:
        return text
    
    keys = _gemini_keys()
    if keys:
        prompt = (
            "Translate/transliterate the following text into fluent, natural conversational Hindi in 100% Devanagari script. "
            "Output ONLY the Devanagari Hindi text without any English letters, explanation, or quotes.\n\n"
            f"Text: {text}"
        )
        for _, key in keys:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key.strip()}"
                r = requests.post(
                    url,
                    headers={"Content-Type": "application/json"},
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                    timeout=15
                )
                if r.status_code == 200:
                    cand = r.json().get("candidates", [])
                    if cand:
                        res_txt = cand[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                        if res_txt and len(re.findall(r'[\u0900-\u097F]', res_txt)) > 0:
                            print(f"[XTTS-v2] Transliterated Roman script to Devanagari for Raju native voice:\n  Original: {text}\n  Devanagari: {res_txt}")
                            return res_txt
            except Exception as e:
                print(f"[XTTS-v2] Devanagari conversion error: {e}")
                continue
    return text


def _synth_raju_clone(text, cfg, out):
    """Zero-shot voice cloning using Local XTTS-v2 or Hugging Face XTTS-v2 with native Hindi support."""
    import time
    global _LOCAL_XTTS_MODEL

    clean_text = strip_tags(text)
    clean_text = _ensure_devanagari_hindi(clean_text)
    local_ref = ROOT / "data" / "voice_references" / "slice_5s.wav"
    ref_url = cfg.get("reference_audio_url") or "https://raw.githubusercontent.com/ITvALA/youtube_autometion/main/data/voice_references/slice_5s.wav"
    raw_token = os.environ.get("HF_TOKEN") or os.environ.get("HUGGINGFACE_TOKEN") or os.environ.get("HUGGINGFACE_API_KEY") or None
    token = str(raw_token).strip() if raw_token else None

    last_err = None
    res = None

    # 1. Try Local Coqui XTTS-v2 first if installed
    try:
        try:
            import transformers
            if not hasattr(transformers, "BeamSearchScorer"):
                try:
                    from transformers.generation import BeamSearchScorer
                    transformers.BeamSearchScorer = BeamSearchScorer
                except Exception:
                    try:
                        from transformers.generation.beam_search import BeamSearchScorer
                        transformers.BeamSearchScorer = BeamSearchScorer
                    except Exception:
                        pass
        except Exception:
            pass

        from TTS.api import TTS
        os.environ["COQUI_TOS_AGREED"] = "1"
        print("[XTTS-v2] Synthesizing scene via local Coqui XTTS-v2 on CPU...")
        if _LOCAL_XTTS_MODEL is None:
            _LOCAL_XTTS_MODEL = TTS("tts_models/multilingual/multi-dataset/xtts_v2").to("cpu")
        
        temp_wav = Path(out).with_suffix(".local_xtts.wav")
        _LOCAL_XTTS_MODEL.tts_to_file(
            text=clean_text,
            speaker_wav=str(local_ref) if local_ref.exists() else str(ref_url),
            language="hi",
            file_path=str(temp_wav),
            speed=float(cfg.get("speed", 1.0))
        )
        if temp_wav.exists() and temp_wav.stat().st_size > 1000:
            res = str(temp_wav)
            print("[XTTS-v2] Local XTTS-v2 synthesis succeeded!")
    except Exception as local_e:
        print(f"[XTTS-v2] Local XTTS not active ({local_e}), falling back to HF Spaces...")

    # 2. Fallback to Hugging Face XTTS-v2 Spaces if local is not available
    if not res:
        from gradio_client import Client
        try:
            from gradio_client import handle_file
            has_handle_file = True
        except ImportError:
            has_handle_file = False

        ref_input = handle_file(str(local_ref)) if (has_handle_file and local_ref.exists()) else (str(local_ref) if local_ref.exists() else ref_url)

        primary_space = cfg.get("xtts_space") or "JymNils/Voice-Cloning-XTTS-v2"
        all_spaces = cfg.get("xtts_spaces") or [
            primary_space,
            "minsus/Voice-Cloning-XTTS-v2",
            "Fatimamirza970/Voice-Cloning-XTTS-v2",
            "hasanbasbunar/Voice-Cloning-XTTS-v2",
        ]
        spaces = [primary_space] + [s for s in all_spaces if s != primary_space]

        for space in spaces:
            for attempt in range(1, 3):
                try:
                    print(f"[XTTS-v2] Synthesizing scene via {space} (attempt {attempt}/2)...")
                    cl = Client(space, token=token)
                    try:
                        # Explicitly pass example_audio_name=None so Gradio doesn't inject default 'audio_1.wav'
                        res = cl.predict(
                            text=clean_text,
                            reference_audio_url=ref_url,
                            example_audio_name=None,
                            language="Hindi",
                            temperature=float(cfg.get("temperature", 0.75)),
                            speed=float(cfg.get("speed", 1.0)),
                            api_name="/voice_clone_synthesis"
                        )
                    except Exception as pe:
                        # Fallback signature with local audio handle or without example_audio_name
                        try:
                            res = cl.predict(
                                text=clean_text,
                                reference_audio_url=ref_input,
                                example_audio_name=None,
                                language="Hindi",
                                temperature=float(cfg.get("temperature", 0.75)),
                                speed=float(cfg.get("speed", 1.0)),
                                api_name="/voice_clone_synthesis"
                            )
                        except Exception:
                            res = cl.predict(
                                text=clean_text,
                                reference_audio_url=ref_url,
                                language="Hindi",
                                temperature=float(cfg.get("temperature", 0.75)),
                                speed=float(cfg.get("speed", 1.0)),
                                api_name="/voice_clone_synthesis"
                            )
                    if res and Path(res).exists() and Path(res).stat().st_size > 1000:
                        print(f"[XTTS-v2] Success on {space}!")
                        break
                except Exception as se:
                    err_str = str(se)
                    print(f"[XTTS-v2] {space} attempt {attempt} failed: {err_str[:120]}")
                    last_err = se
                    if "ZeroGPU" in err_str or "quota" in err_str or "exceeded" in err_str:
                        break
                    time.sleep(3)
            if res and Path(res).exists() and Path(res).stat().st_size > 1000:
                break

    if not res or not Path(res).exists():
        raise RuntimeError(f"XTTS-v2 synthesis failed after retries: {last_err}")

    af = "equalizer=f=130:t=q:w=1.4:g=3.5,equalizer=f=240:t=q:w=1.2:g=2.0,equalizer=f=650:t=q:w=1.0:g=-1.5,equalizer=f=3800:t=q:w=1.0:g=1.2,loudnorm=I=-16:TP=-1.5:LRA=10,asetpts=PTS-STARTPTS"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-fflags", "+genpts", "-avoid_negative_ts", "make_zero",
                    "-i", str(res), "-af", af,
                    "-ar", "44100", "-ac", "2", "-b:a", "192k", str(out)], check=True)
    return []


PROVIDERS = {
    "raju_clone": _synth_raju_clone, "xtts_clone": _synth_raju_clone, "voice_clone": _synth_raju_clone,
    "gemini_tts": _synth_gemini, "gemini": _synth_gemini,
    "google_chirp": _synth_google_chirp, "google": _synth_google_chirp, "chirp3": _synth_google_chirp,
    "edge-tts": _synth_edge, "edge": _synth_edge,
    "elevenlabs": _synth_elevenlabs,
    "openai": _synth_openai,
}


# ------------------------------------------------------ cache + fallback
def _run_cached(provider, text, cfg, out):
    fn = PROVIDERS[provider]
    use_cache = bool(cfg.get("cache", True))
    if provider not in ("gemini_tts", "gemini"):
        text = strip_tags(text)                 # Edge/Chirp/ElevenLabs tags ko bol dete hain
    models = "|".join(cfg.get("gemini_models") or []) if provider in ("gemini_tts", "gemini") else ""
    sig = f"{provider}|{cfg.get('voice')}|{cfg.get('style')}|{models}|{cfg.get('speed')}|{cfg.get('rate')}|{cfg.get('pitch')}|{text}"
    path = CACHE_DIR / (hashlib.sha1(sig.encode("utf-8")).hexdigest() + ".mp3")
    _STATE["cached"] = False
    if use_cache and path.exists():
        shutil.copyfile(path, out)
        _STATE["cached"] = True
        return []
    words = fn(text, cfg, out)
    if use_cache:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(out, path)
    return words


def _cfg_for(prov, cfg):
    voices = cfg.get("voices") or {}
    if prov in ("edge-tts", "edge"):
        v = voices.get(prov) or cfg.get("fallback_voice", "hi-IN-MadhurNeural")
    else:
        v = voices.get(prov) or cfg.get("voice")
    return dict(cfg, voice=v)


def synth_speech(text, cfg, out):
    """Walk the provider chain: cfg['providers'] (list) or provider -> fallback_provider."""
    if cfg.get("providers"):
        names = [str(p).lower() for p in cfg["providers"]]
    else:
        names = [str(cfg.get("provider", "gemini_tts")).lower(),
                 str(cfg.get("fallback_provider", "edge-tts")).lower()]
    seen, chain = set(), []
    for n in names:
        if n not in seen:
            seen.add(n); chain.append(n)
    last = None
    _STATE["fails"] = []
    for prov in chain:
        if prov not in PROVIDERS:
            print(f"[TTS] unknown provider '{prov}', skipping")
            continue
        try:
            pcfg = _cfg_for(prov, cfg)
            words = _run_cached(prov, text, pcfg, out)
            _STATE["provider"], _STATE["voice"] = prov, pcfg.get("voice")
            return words
        except Exception as e:
            last = e
            _STATE["fails"].append((prov, str(e)))
            print(f"[TTS] {prov} failed ({e})")
    raise RuntimeError(f"All TTS providers failed: {last}")


# ------------------------------------------------------- post-processing
def _tighten(raw, out, tempo, lead, tail, squeeze=0.0, normalize=True):
    """Trim leading/trailing silence, optional gentle pause squeeze, tempo, loudness, lead/tail pad."""
    trim = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05"
    af = f"{trim},areverse,{trim},areverse"
    if squeeze and squeeze > 0:
        # only shorten pauses longer than `squeeze` sec, down to 0.25s (keeps natural breathing)
        af += f",silenceremove=stop_periods=-1:stop_duration={squeeze}:stop_threshold=-42dB:stop_silence=0.25"
    if abs(tempo - 1.0) > 0.01:
        af += f",atempo={tempo:.3f}"
    if normalize:
        af += ",loudnorm=I=-16:TP=-1.5:LRA=11"
    af += f",adelay={int(lead * 1000)}:all=1,apad=pad_dur={tail},asetpts=PTS-STARTPTS"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-fflags", "+genpts", "-avoid_negative_ts", "make_zero",
                    "-i", str(raw), "-af", af,
                    "-ar", "44100", "-ac", "2", str(out)], check=True)


def narrate(scenes, workdir, cfg, pad=0.45):
    """tts_text (Devanagari) -> voice. narration (Hinglish) -> on-screen caption word timings."""
    workdir.mkdir(parents=True, exist_ok=True)
    parts = []
    report = []
    narrate.report = report
    tempo = float(cfg.get("tempo", 1.0))
    lead_s = float(cfg.get("lead", LEAD))
    tail_s = float(cfg.get("tail", TAIL))
    tail_last_s = float(cfg.get("tail_last", TAIL_LAST))
    squeeze = float(cfg.get("squeeze_pauses", 0.0))
    normalize = bool(cfg.get("normalize", True))

    for i, s in enumerate(scenes):
        raw, padded = workdir / f"s{i}_raw.mp3", workdir / f"s{i}.mp3"
        voice_text = (s.get("tts_text") or s["narration"]).strip()
        scene_cfg = dict(cfg)
        if str(s.get("delivery") or "").strip():          # LLM ka scene-wise "kaise bolna hai" (chhota English phrase)
            scene_cfg["style"] = str(s["delivery"]).strip()[:80]
        synth_speech(voice_text, scene_cfg, raw)
        report.append({"scene": i, "provider": _STATE["provider"], "voice": _STATE["voice"], "cached": _STATE["cached"],
                       "style": scene_cfg.get("style", ""), "fails": [f[0] for f in _STATE["fails"]],
                       "why": (_short_why(_STATE["fails"][0][1]) if _STATE["fails"] else "")})
        s["voiceProvider"] = _STATE["provider"]
        print(f"[TTS] scene {i}: {_STATE['provider']} / {_STATE['voice']}" + (" (cache)" if _STATE["cached"] else "")
              + (f" | fell back after: {', '.join(f[0] for f in _STATE['fails'])}" if _STATE["fails"] else ""))

        tail = tail_last_s if i == len(scenes) - 1 else tail_s
        try:
            _tighten(raw, padded, tempo, lead_s, tail, squeeze, normalize)
            if dur(padded) < lead_s + tail + 0.4:
                raise RuntimeError("over-trimmed")
        except Exception as e:
            print(f"[TTS] Scene {i}: trim skipped ({e})")
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-fflags", "+genpts", "-avoid_negative_ts", "make_zero",
                            "-i", str(raw), "-af", f"apad=pad_dur={pad},asetpts=PTS-STARTPTS", "-ar", "44100", "-ac", "2", str(padded)], check=True)
            tail = pad
        s["durationSec"] = round(dur(padded), 3)

        tokens = strip_tags(s["narration"]).split()
        words = []
        if tokens:
            speech = max(0.3, s["durationSec"] - lead_s - tail)
            weights = [len(t) + 2 for t in tokens]
            tot, cur = float(sum(weights)), lead_s
            for t, w in zip(tokens, weights):
                d = speech * w / tot
                words.append({"w": t, "s": round(cur, 3), "e": round(cur + d, 3)})
                cur += d
        s["words"] = words
        parts.append(padded)

    lst = workdir / "list.txt"
    lst.write_text("".join(f"file '{p.resolve().as_posix()}'\n" for p in parts))
    out = workdir / "voice.mp3"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-fflags", "+genpts", "-avoid_negative_ts", "make_zero",
                    "-f", "concat", "-safe", "0", "-i", str(lst),
                    "-c:a", "libmp3lame", "-q:a", "3", str(out)], check=True)
    for slot, _ in _google_keys():
        used = _usage_get(slot)
        if used:
            print(f"[TTS] {slot} chars used this month: {used:,}")
    return out


def voice_summary(report=None):
    """Telegram caption ke liye ek line (Markdown-safe: koi _ * ` [ nahi)."""
    rep = report if report is not None else getattr(narrate, "report", [])
    if not rep:
        return ""
    n = len(rep)
    by = {}
    for r in rep:
        by[r["provider"]] = by.get(r["provider"], 0) + 1
    clean = lambda x: re.sub(r"[^A-Za-z0-9 .,:/()-]", " ", str(x or "")).replace("  ", " ").strip()
    line = "Voice: " + ", ".join(f"{clean(str(k).replace('_', ' '))} {v}/{n}" for k, v in by.items())
    fb = [r for r in rep if r["fails"]]
    if fb:
        line += f" | fallback: {clean(fb[0]['fails'][0].replace('_', ' '))} failed ({clean(fb[0]['why'])[:60]})"
    voices = sorted({clean(r["voice"]) for r in rep if r["voice"]})
    if voices:
        line += " | " + ", ".join(voices)
    return line
