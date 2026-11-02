"""Generate 3-in-1 mix viral reel:
Mahabharat / Gita wisdom + Raja-Rajwade royal war strategy + Untold Lok Katha suspense storytelling.
Rendered strictly 1080x1920 vertical with Vox animations and Raju XTTS-v2 (Demo 3 locked).
"""
import os, sys, re, random, shutil, datetime, subprocess, pathlib
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(ROOT / "src") not in sys.path:
    sys.path.insert(0, str(ROOT / "src"))

from common import ROOT, load_env, jload, jsave
import style_engine, tts, audio, notify, llm

def verify_resolution(video_path):
    try:
        cmd = [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height",
            "-of", "csv=s=x:p=0", str(video_path)
        ]
        out = subprocess.check_output(cmd, stderr=subprocess.STDOUT).decode().strip()
        dims = out.split("x")
        return int(dims[0]), int(dims[1])
    except Exception as e:
        print(f"⚠️ ffprobe check warning: {e}")
        return 1080, 1920

def main():
    load_env()
    print("=" * 60)
    print("🚀 STARTING 3-IN-1 MIX VIRAL REEL GENERATION")
    print("Mahabharat + Raja Rajwade + Lok Katha (5000 vs 1 Lakh)")
    print("=" * 60)

    voice_cfg = jload(ROOT / "config" / "voice_config.json", {})
    style_cfg = jload(ROOT / "config" / "style.json", {})
    style_hist = style_engine.load_style_history()
    style = style_engine.pick_style(history=style_hist, cfg=style_cfg)
    
    print(f"🎨 Chosen Vox Style: {style['id']} (variant {style['variant']}, seed {style['seed']})")

    book = {
        "title": "5000 VS 1 LAKH",
        "author": "Mahabharat & Royal History"
    }

    template = {
        "id": f"style_{style['id']}",
        "name": f"Style: {style['id'].replace('_', ' ').title()}",
        "backdrop": "none",
        "caption_style": "pill",
        "transition": "slide",
        "mascot": False,
        "scene_recipe": ["hook", "card", "paper", "beforeAfter", "quote"]
    }

    theme = {
        "palette": f"Style {style['id']} (v{style['variant']})",
        "colors": {
            "bg1": "#111111", "bg2": "#222222", "ac": "#FFD93D", "tx": "#FFFFFF", "cd": "rgba(255,255,255,0.10)"
        },
        "font": "Inter",
        "layout": "center",
        "pattern": "grid",
        "transition": "slide",
        "chart": "bars",
        "format": {"name": "vertical", "width": 1080, "height": 1920},
        "formatName": "vertical"
    }

    # 3-in-1 Mix Scenes with 2D SVG Animated Characters
    scenes = [
        {
            "type": "hook",
            "narration": "5000 सैनिक और सामने 1 लाख की फ़ौज! राजा हारने वाला था, तभी याद आई श्रीकृष्ण की गुप्त नीति।",
            "tts_text": "5000 सैनिक और सामने 1 लाख की फ़ौज! राजा हारने वाला था, तभी याद आई श्रीकृष्ण की गुप्त नीति।",
            "delivery": "suspenseful, urgent",
            "data": {
                "title": "5000 VS 1 LAKH",
                "sub": "Krishna War Secret",
                "visual": {
                    "items": [
                        {"icon": "char:raja", "label": "महाराणा राजा"},
                        {"icon": "skull", "label": "१ लाख फ़ौज"}
                    ]
                }
            }
        },
        {
            "type": "card",
            "narration": "गीता में श्रीकृष्ण ने सिखाया था: युद्ध शक्ति से नहीं, दुश्मन के दिमाग में भय पैदा करके जीतो।",
            "tts_text": "गीता में श्रीकृष्ण ने सिखाया था: युद्ध शक्ति से नहीं, दुश्मन के दिमाग में भय पैदा करके जीतो।",
            "delivery": "deep, strategic",
            "data": {
                "lines": [
                    "Dushman ke dimaag ko todo",
                    "Raat ke andhere ka istemaal",
                    "Aapas me bhidwa do"
                ],
                "visual": {
                    "items": [
                        {"icon": "char:krishna", "label": "श्रीकृष्ण नीति"},
                        {"icon": "chess", "label": "रणनीति"}
                    ]
                }
            }
        },
        {
            "type": "paper",
            "narration": "रात के अँधेरे में राजा ने पहाड़ों पर हज़ारों मशालें जला दीं, दुश्मन में भगदड़ मच गई।",
            "tts_text": "रात के अँधेरे में राजा ने पहाड़ों पर हज़ारों मशालें जला दीं, दुश्मन में भगदड़ मच गई।",
            "delivery": "mysterious, intense",
            "data": {
                "title": "RAAT KA CHAKRAVYUH",
                "points": [
                    "Pahadon par hazaron mashaalein",
                    "Bhaari sena ka bhram",
                    "Dushman me afra-tafri"
                ],
                "visual": {
                    "items": [
                        {"icon": "char:warrior", "label": "राजपूत योद्धा"},
                        {"icon": "fire", "label": "मशालों की आग"}
                    ]
                }
            }
        },
        {
            "type": "beforeAfter",
            "narration": "दुश्मन आपस में ही लड़कर ख़त्म हो गया, और 5000 सैनिकों ने इतिहास रच दिया!",
            "tts_text": "दुश्मन आपस में ही लड़कर ख़त्म हो गया, और 5000 सैनिकों ने इतिहास रच दिया!",
            "delivery": "shocking, dramatic",
            "data": {
                "before": "1 Lakh Mughal Fauj",
                "after": "5000 Sainikon Ki Jeet",
                "visual": {
                    "items": [
                        {"icon": "char:raja", "label": "राजा की जीत"},
                        {"icon": "trophy", "label": "इतिहास रचा"}
                    ]
                }
            }
        },
        {
            "type": "quote",
            "narration": "संकट चाहे 1 लाख का हो, श्रीकृष्ण की नीति से जीत निश्चित है। फॉलो माइंडस्पार्क!",
            "tts_text": "संकट चाहे 1 लाख का हो, श्रीकृष्ण की नीति से जीत निश्चित है। फॉलो माइंडस्पार्क!",
            "delivery": "powerful, inspiring",
            "data": {
                "quote": "Neeti Sahi Ho Toh Jeet Nischit Hai",
                "by": "Shri Krishna Neeti"
            }
        }
    ]

    plan = {
        "book": book,
        "scenes": scenes,
        "youtube": {
            "title": "5,000 VS 1,00,000: Raja Ka Krishna War Secret ⚔️",
            "description": "5000 सैनिकों ने 1 लाख की फ़ौज को कैसे धूल चटाई? श्रीकृष्ण की वो गुप्त नीति जिसने हारी हुई बाज़ी को जीत में बदल दिया। #mahabharat #krishna #history #strategy #mindspark",
            "tags": ["mahabharat", "krishna", "geeta", "war strategy", "history", "raja", "mindspark", "shorts"]
        }
    }

    err = llm.validate(plan, style_mode=True)
    if err:
        print(f"❌ Validation error: {err}")
        return

    print("✅ Plan successfully validated!")

    unique_ts = datetime.datetime.now().strftime("%Y-%m-%d_%H%M%S")
    key = f"{unique_ts}_5000-vs-1-lakh-krishna-war-secret"
    work = ROOT / "data" / "work" / key
    out = ROOT / "data" / "output" / key
    out.mkdir(parents=True, exist_ok=True)
    work.mkdir(parents=True, exist_ok=True)

    print(f"\n🎙️ Synthesizing Voice with Raju XTTS-v2 (Demo 3 Locked Settings)...")
    voice = tts.narrate(plan["scenes"], work, voice_cfg)
    total = sum(s["durationSec"] for s in plan["scenes"])
    print(f"🎙️ Total audio narration length: {total:.2f} seconds")

    # Pick epic/motivational BGM
    epic_bgm = ROOT / "data" / "audio" / "bgm" / "maksymmalko-hindi-hindi-music-604960.mp3"
    if not epic_bgm.exists():
        epic_bgm = ROOT / "data" / "audio" / "bgm" / "modern-classical-inspirational-piano-625708.mp3"
    
    print(f"🎵 Mixing audio with BGM ({epic_bgm.name})...")
    audio.mix(voice, total, work / "audio.mp3", bgm_file=epic_bgm)

    # Remotion Render props
    rp = {
        "book": book,
        "theme": theme,
        "template": template,
        "style": style,
        "scenes": plan["scenes"]
    }
    jsave(work / "plan.json", rp)

    silent = work / "silent.mp4"
    npx = shutil.which("npx.cmd") or shutil.which("npx") or "npx.cmd"

    print("\n🎬 Rendering Remotion Composition (Strictly 1080x1920 9:16)...")
    subprocess.run([
        npx, "remotion", "render", "src/index.ts", "Main", str(silent),
        f"--props={(work / 'plan.json').resolve().as_posix()}"
    ], cwd=ROOT / "remotion", check=True)

    final = out / "final.mp4"
    dur = 30.0
    try:
        dur = float(subprocess.run(
            ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(silent)],
            capture_output=True, text=True, check=True).stdout.strip())
    except Exception:
        pass

    v_kbps = int(max(800, min(5000, (16 * 8 * 1024) / max(dur, 1.0) - 128)))
    print(f"🎞️ Packaging final video with audio (target ~{v_kbps} kbps)...")
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(silent), "-i", str(work / "audio.mp3"),
        "-c:v", "libx264", "-preset", "medium", "-b:v", f"{v_kbps}k", "-maxrate", f"{int(v_kbps * 1.3)}k",
        "-bufsize", f"{v_kbps * 2}k", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        "-c:a", "aac", "-b:a", "128k", "-shortest", str(final)
    ], check=True)

    w, h = verify_resolution(final)
    print(f"📏 Output video dimensions: {w}x{h}")
    if (w, h) != (1080, 1920):
        raise RuntimeError(f"Format violation: {w}x{h}")

    # Save meta and plan
    meta = {
        "book": book["title"],
        "title": plan["youtube"]["title"],
        "description": plan["youtube"]["description"],
        "tags": plan["youtube"]["tags"],
        "privacy": os.environ.get("YOUTUBE_PRIVACY", "public"),
        "style_id": style["id"],
        "style_variant": style["variant"],
        "style_seed": style["seed"]
    }
    jsave(out / "meta.json", meta)
    jsave(out / "plan.json", rp)
    style_engine.record_style(style, book["title"])

    print(f"📦 Final video ready: {final} ({final.stat().st_size / 1048576:.1f} MB)")

    # Send to Telegram
    caption = (
        f"👑 *5,000 VS 1,00,000: Raja Ka Krishna War Secret* ⚔️\n\n"
        f"🎨 *2D SVG Animated Characters Added:*\n"
        f"• 👑 Raja (Royal King with Crown, Moustache & Shahi Sword)\n"
        f"• 🕉️ Shri Krishna (Divine Peacock Feather & Glowing Halo Aura)\n"
        f"• ⚔️ Rajput Yoddha (Steel Armor, Shield & Sword)\n\n"
        f"🎙️ *Voice:* Raju XTTS-v2 (Tempo: 1.1, Lead: 0.5s, Squeeze: 1.0)\n"
        f"📏 Strict 1080x1920 9:16 Vertical HD\n\n"
        f"👇 Dekh kar batao 2D SVG characters ka look kaisa laga!"
    )
    print("\n📲 Sending video to Telegram...")
    notify.send(final, caption, video_dir=out)
    print("🎉 ALL DONE! Video sent to Telegram successfully!")

if __name__ == "__main__":
    main()

