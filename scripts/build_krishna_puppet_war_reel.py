"""Build and render 5000 VS 1 LAKH: Krishna War Secret Reel
using the Marionette Cutout PuppetKit Engine with Raju XTTS-v2 voice and Devanagari Hindi subtitles.
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

from common import ROOT, load_env
import notify

def main():
    load_env()
    print("=" * 60)
    print("🚩 5000 VS 1 LAKH: KRISHNA WAR SECRET")
    print("Marionette Cutout Puppet Engine + Raju XTTS-v2 Voice")
    print("=" * 60)

    unique_ts = datetime.datetime.now().strftime("%Y-%m-%d_%H%M%S")
    key = f"{unique_ts}_krishna-5000-vs-1lakh-puppet-war"
    work = ROOT / "data" / "work" / key
    out = ROOT / "data" / "output" / key
    out.mkdir(parents=True, exist_ok=True)
    work.mkdir(parents=True, exist_ok=True)

    silent = work / "silent.mp4"
    npx = shutil.which("npx.cmd") or shutil.which("npx") or "npx.cmd"

    print("\n🎬 Rendering Remotion Composition: 'PuppetWarStory' (1209 frames, ~40.3 sec)...")
    subprocess.run([
        npx, "remotion", "render", "src/index.ts", "PuppetWarStory", str(silent)
    ], cwd=ROOT / "remotion", check=True)

    audio_file = ROOT / "data" / "output" / "trial_audio" / "trial_raju_with_bgm.mp3"
    if not audio_file.exists():
        raise FileNotFoundError(f"Audio file not found: {audio_file}")

    final = out / "final.mp4"
    print(f"\n🎵 Packaging final video with Raju XTTS-v2 audio & BGM...")
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(silent),
        "-i", str(audio_file),
        "-c:v", "libx264", "-crf", "23", "-preset", "fast",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest", str(final)
    ], check=True)

    print(f"✅ Video created: {final} ({final.stat().st_size / (1024*1024):.2f} MB)")

    caption = (
        "👑 *5000 VS 1 LAKH: Krishna War Secret!* 🚩✨\n\n"
        "🎨 *Style:* Marionette Cutout Puppet Kit (Temple Arch, Glowing Diyas, Raja with Crown & Sword, Lord Krishna with Divine Star Halo)\n"
        "🎙️ *Voice:* Raju XTTS-v2 Cloned Voice (100% Raju authentic voice)\n"
        "📜 *Subtitles:* Pure Devanagari Hindi word-synced highlight badge\n"
        "📱 *Format:* 1080x1920 9:16 Vertical HD (30 FPS)\n\n"
        "તમારા ફોટો મુજબ Raja, Krishna અને Cutout Puppet સ્ટાઇલ મિક્સ કરીને આ ફાઈનલ વિડિયો બનાવ્યો છે!"
    )

    print("\n📲 Dispatching to Telegram...")
    notify.send(str(final), caption, str(out))
    print("🎉 All done! Video sent to Telegram successfully!")

if __name__ == "__main__":
    main()
