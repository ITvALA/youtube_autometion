"""Voice with edge-tts (word timings for synced captions) + FFmpeg."""
import asyncio, subprocess
import edge_tts

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]))

async def _synth(text, cfg, out):
    voice = cfg.get("voice") or cfg.get("voice_model", "en-IN-PrabhatNeural")
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

def narrate(scenes, workdir, cfg, pad=0.45):
    workdir.mkdir(parents=True, exist_ok=True)
    parts = []
    for i, s in enumerate(scenes):
        raw, padded = workdir / f"s{i}_raw.mp3", workdir / f"s{i}.mp3"
        words = asyncio.run(_synth(s["narration"], cfg, raw))
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
