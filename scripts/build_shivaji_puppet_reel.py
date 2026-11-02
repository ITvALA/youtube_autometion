"""Generate Chhatrapati Shivaji Maharaj: Wagh Nakh Strategy reel
in Flat Vector Puppet / Cutout style with Raju XTTS-v2 cloned voice and pure Devanagari Hindi subtitles.
"""
import os, sys, datetime, subprocess, shutil
from pathlib import Path

# Fix Windows console UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(ROOT / "src") not in sys.path:
    sys.path.insert(0, str(ROOT / "src"))

from common import ROOT, load_env, jload, jsave
import tts, audio, notify, llm

def main():
    load_env()
    print("=" * 60)
    print("🚩 CHHATRAPATI SHIVAJI MAHARAJ: WAGH NAKH STRATEGY")
    print("Flat Vector Puppet / Cutout Style with Raju XTTS-v2")
    print("=" * 60)

    voice_cfg = jload(ROOT / "config" / "voice_config.json", {})

    book = {
        "title": "Chhatrapati Shivaji Maharaj: Wagh Nakh Strategy",
        "author": "Maratha Empire & Guerrilla Warfare"
    }

    template = {
        "id": "puppet_cutout_v1",
        "name": "Flat Vector Cutout Puppet",
        "backdrop": "none",
        "caption_style": "pill",
        "transition": "slide",
        "mascot": False,
        "scene_recipe": ["hook", "card", "paper", "beforeAfter", "quote"]
    }

    theme = {
        "palette": "Cutout Puppet Maratha",
        "colors": {
            "bg1": "#140e0b",
            "bg2": "#281911",
            "ac": "#FF9933",
            "tx": "#FFFFFF",
            "cd": "rgba(255,255,255,0.12)"
        },
        "font": "Inter",
        "layout": "center",
        "pattern": "dots",
        "transition": "slide",
        "chart": "bars",
        "format": {"name": "vertical", "width": 1080, "height": 1920},
        "formatName": "vertical"
    }

    # 5 Scenes in Pure Devanagari Hindi
    scenes = [
        {
            "type": "hook",
            "narration": "१० फुट का अफ़ज़ल ख़ान और विशाल बीजापुर सेना! छत्रपति शिवाजी महाराज को अकेले मिलने बुलाया।",
            "tts_text": "१० फुट का अफ़ज़ल ख़ान और विशाल बीजापुर सेना! छत्रपति शिवाजी महाराज को अकेले मिलने बुलाया।",
            "delivery": "suspenseful, royal",
            "data": {
                "title": "SHIVAJI VS AFZAL KHAN",
                "sub": "Wagh Nakh Secret Strategy"
            }
        },
        {
            "type": "card",
            "narration": "महाराज को धोखे की भनक थी। कुर्ते के नीचे लोहे का कवच पहना और हाथ में छिपाए लोहे के वाघ-नख!",
            "tts_text": "महाराज को धोखे की भनक थी। कुर्ते के नीचे लोहे का कवच पहना और हाथ में छिपाए लोहे के वाघ-नख!",
            "delivery": "mysterious, strategic",
            "data": {
                "title": "GUPT SURAKSHA",
                "points": ["Kavach pehna", "Wagh Nakh chhipaye"]
            }
        },
        {
            "type": "paper",
            "narration": "शामियाने में अफ़ज़ल ख़ान ने गले लगाने के बहाने महाराज की पीठ में ज़हर बुझा खंजर घोंप दिया!",
            "tts_text": "शामियाने में अफ़ज़ल ख़ान ने गले लगाने के बहाने महाराज की पीठ में ज़हर बुझा खंजर घोंप दिया!",
            "delivery": "shocking, intense",
            "data": {
                "title": "DHOKHA",
                "points": ["Khan ne khanjar mara"]
            }
        },
        {
            "type": "beforeAfter",
            "narration": "पर लोहे के कवच से खंजर फिसल गया! उसी पल महाराज ने वाघ-नख से अफ़ज़ल ख़ान का सीना चीर दिया!",
            "tts_text": "पर लोहे के कवच से खंजर फिसल गया! उसी पल महाराज ने वाघ-नख से अफ़ज़ल ख़ान का सीना चीर दिया!",
            "delivery": "fierce, thunderous",
            "data": {
                "before": "Afzal Khan Ka Hamla",
                "after": "Shivaji Maharaj Ka Palatwar"
            }
        },
        {
            "type": "quote",
            "narration": "प्रतापगढ़ के जंगलों में मराठा सेना ने धावा बोला और मुग़ल फ़ौज को धूल चटा दी! बोलो छत्रपति शिवाजी महाराज की जय!",
            "tts_text": "प्रतापगढ़ के जंगलों में मराठा सेना ने धावा बोला और मुग़ल फ़ौज को धूल चटा दी! बोलो छत्रपति शिवाजी महाराज की जय!",
            "delivery": "triumphant, inspiring",
            "data": {
                "quote": "Bolo Chhatrapati Shivaji Maharaj Ki Jai",
                "by": "Hindavi Swarajya"
            }
        }
    ]

    plan = {
        "book": book,
        "scenes": scenes,
        "youtube": {
            "title": "Chhatrapati Shivaji Maharaj: Wagh Nakh Strategy 🐅",
            "description": "अफज़ल खान के धोखे को छत्रपति शिवाजी महाराज ने कैसे वाघ-नख से चूर किया? देखिए ऐतिहासिक शौर्य गाथा। #shivaji #maratha #history #strategy #mindspark",
            "tags": ["shivaji", "maratha", "wagh nakh", "afzal khan", "history", "shorts"]
        }
    }

    unique_ts = datetime.datetime.now().strftime("%Y-%m-%d_%H%M%S")
    key = f"{unique_ts}_shivaji-wagh-nakh-strategy"
    work = ROOT / "data" / "work" / key
    out = ROOT / "data" / "output" / key
    out.mkdir(parents=True, exist_ok=True)
    work.mkdir(parents=True, exist_ok=True)

    print(f"\n🎙️ Synthesizing Voice with Raju XTTS-v2 for all 5 scenes...")
    voice = tts.narrate(plan["scenes"], work, voice_cfg)
    total = sum(s["durationSec"] for s in plan["scenes"])
    print(f"🎙️ Narration total length: {total:.2f} seconds")

    # Pick Indian battle / energetic BGM
    epic_bgm = ROOT / "data" / "audio" / "bgm" / "maksymmalko-hindi-hindi-music-604960.mp3"
    if not epic_bgm.exists():
        epic_bgm = ROOT / "data" / "audio" / "bgm" / "old-school-hip-hop-motivational-591352.mp3"

    print(f"🎵 Mixing audio with BGM ({epic_bgm.name})...")
    audio.mix(voice, total, work / "audio.mp3", bgm_file=epic_bgm)

    # Remotion Render props
    rp = {
        "book": book,
        "theme": theme,
        "template": template,
        "scenes": plan["scenes"]
    }
    jsave(work / "plan.json", rp)

    silent = work / "silent.mp4"
    npx = shutil.which("npx.cmd") or shutil.which("npx") or "npx.cmd"

    print("\n🎬 Rendering Remotion Composition in Flat Vector Puppet / Cutout Style...")
    subprocess.run([
        npx, "remotion", "render", "src/index.ts", "Main", str(silent),
        f"--props={(work / 'plan.json').resolve().as_posix()}"
    ], cwd=ROOT / "remotion", check=True)

    final = out / "final.mp4"
    print("🎞️ Packaging final streamable video with FFmpeg...")
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(silent),
        "-i", str(work / "audio.mp3"),
        "-c:v", "libx264", "-crf", "24", "-preset", "fast",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest", str(final)
    ], check=True)

    print(f"✅ Video created: {final} ({final.stat().st_size / (1024*1024):.2f} MB)")

    caption = (
        "🎬 *New Story: Chhatrapati Shivaji Maharaj & Wagh Nakh!* 🐅🚩\n\n"
        "🎨 *Style:* Flat Vector “Puppet / Cutout” Animation (Jointed Limbs, Lip-sync, Paper Drop-Shadow)\n"
        "🎙️ *Voice:* Raju XTTS-v2 Cloned Voice (No robotic fallback)\n"
        "📜 *Subtitles:* Pure Devanagari Hindi word-by-word synced\n"
        "📱 Strict 1080x1920 9:16 Vertical HD\n\n"
        "👉 Tap *PASS* button to upload to YouTube & Instagram!"
    )

    print("\n📲 Dispatching to Telegram...")
    notify.send(str(final), caption, str(out))
    print("🎉 All done! Video sent to Telegram successfully!")

if __name__ == "__main__":
    main()
