import asyncio, json, pathlib, subprocess
import edge_tts

VOICE = "en-US-ChristopherNeural"  # crisp documentary narrator
PROJ = pathlib.Path("d:/mindspark/cinematic_demo")
script_data = json.loads((PROJ / "script.json").read_text(encoding="utf-8"))

lines_dir = PROJ / "audio" / "lines"
lines_dir.mkdir(parents=True, exist_ok=True)

segments = []

async def synthesize_all():
    for take in script_data["takes"]:
        for line in take["lines"]:
            lid = line["id"]
            text = line.get("spoken") or line["text"]
            wav_path = lines_dir / f"seg{lid:02d}.wav"
            mp3_temp = lines_dir / f"temp_{lid:02d}.mp3"
            
            print(f"🎙️ Line {lid}: {text}")
            communicate = edge_tts.Communicate(text, VOICE, rate="+0%", pitch="+0Hz")
            await communicate.save(str(mp3_temp))
            
            # Convert to 48kHz mono WAV
            subprocess.run([
                "ffmpeg", "-y", "-v", "error", "-i", str(mp3_temp),
                "-ar", "48000", "-ac", "1", str(wav_path)
            ], check=True)
            mp3_temp.unlink(missing_ok=True)
            
            segments.append({
                "id": lid,
                "scene": lid,
                "caption": line.get("hero", ""),
                "vo": text,
                "gap_after": line.get("gap_after", 0.45)
            })

asyncio.run(synthesize_all())

segments_file = PROJ / "audio" / "segments.json"
segments_file.write_text(json.dumps({"segments": segments}, indent=2), encoding="utf-8")
print(f"✅ Generated {len(segments)} segments in {segments_file}")
