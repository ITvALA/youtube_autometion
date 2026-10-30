"""Voice synthesis with Edge-TTS and ElevenLabs (Neil / custom) + word timings for captions."""
import os, json, base64, asyncio, subprocess, requests
from pathlib import Path
import edge_tts

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

async def _synth_edge(text, cfg, out):
    voice = cfg.get("voice_model") or cfg.get("voice") or "en-IN-PrabhatNeural"
    if not voice.startswith(("en-", "hi-", "Microsoft")):
        voice = "en-IN-PrabhatNeural"
    kw = dict(rate=cfg.get("rate", "+0%"), pitch=cfg.get("pitch", "+0Hz"))
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

def synth_speech(text, cfg, out):
    provider = cfg.get("provider", "").lower()
    el_key = os.getenv("ELEVENLABS_API_KEY") or os.getenv("XI_API_KEY") or cfg.get("elevenlabs_api_key")
    if (provider == "elevenlabs" or cfg.get("voice") == "elevenlabs_neil") and el_key:
        voice_id = cfg.get("elevenlabs_voice_id") or "AZnzlk1XvdvUeBnXmlld" # Neil default ID
        try:
            return _synth_elevenlabs(text, voice_id, el_key, out)
        except Exception as e:
            print(f"[TTS] ElevenLabs call failed ({e}), falling back to Edge-TTS neural.")
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
