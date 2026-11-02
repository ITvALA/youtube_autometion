"""Build and render PuppetKit test video and send directly to Telegram."""
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

from common import ROOT, load_env, jsave
import notify

def main():
    load_env()
    print("=" * 60)
    print("🎭 PUPPET KIT - FLAT VECTOR CUTOUT MARIONETTE TEST REEL")
    print("Rendering 1080x1920 Demo Video from User Code")
    print("=" * 60)

    unique_ts = datetime.datetime.now().strftime("%Y-%m-%d_%H%M%S")
    key = f"{unique_ts}_puppet-kit-marionette-demo"
    work = ROOT / "data" / "work" / key
    out = ROOT / "data" / "output" / key
    out.mkdir(parents=True, exist_ok=True)
    work.mkdir(parents=True, exist_ok=True)

    silent = work / "silent.mp4"
    npx = shutil.which("npx.cmd") or shutil.which("npx") or "npx.cmd"

    print("\n🎬 Rendering Remotion Composition: 'PuppetStory' (435 frames, 14.5 sec)...")
    subprocess.run([
        npx, "remotion", "render", "src/index.ts", "PuppetStory", str(silent)
    ], cwd=ROOT / "remotion", check=True)

    # Pick Indian temple / atmospheric BGM
    epic_bgm = ROOT / "data" / "audio" / "bgm" / "maksymmalko-hindi-hindi-music-604960.mp3"
    if not epic_bgm.exists():
        epic_bgm = ROOT / "data" / "audio" / "bgm" / "old-school-hip-hop-motivational-591352.mp3"

    final = out / "final.mp4"
    print(f"🎵 Packaging streamable video with BGM ({epic_bgm.name})...")
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(silent),
        "-i", str(epic_bgm),
        "-c:v", "libx264", "-crf", "22", "-preset", "fast",
        "-c:a", "aac", "-b:a", "192k",
        "-af", "afade=t=out:st=12.5:d=2.0",
        "-shortest", str(final)
    ], check=True)

    print(f"✅ Video created: {final} ({final.stat().st_size / (1024*1024):.2f} MB)")

    caption = (
        "🎭 *Puppet Kit Marionette Cutout Demo Reel!*\n\n"
        "🎨 *Style:* 100% Code-Drawn SVG Cutout Puppet (Temple Arch, Diyas, Gold Dust, Marionette Limbs)\n"
        "✨ *Features:* Joint-based arm/leg posing, Vanara warrior with mace, Teal king with halo, Staggered subtitles\n"
        "📱 *Format:* 1080x1920 9:16 Vertical HD (30 FPS)\n\n"
        "તમારા આપેલા કોડ મુજબનો આ ટેસ્ટ વિડિયો છે, જોઈને જણાવો!"
    )

    print("\n📲 Dispatching to Telegram...")
    notify.send(str(final), caption, str(out))
    print("🎉 All done! Puppet Kit video sent to Telegram successfully!")

if __name__ == "__main__":
    main()

