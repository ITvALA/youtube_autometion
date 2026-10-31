"""Motivational background music selection ducked under the voice."""
import random, subprocess
from pathlib import Path
from common import ROOT

BGM_DIR = ROOT / "data" / "audio" / "bgm"

def pick_random_bgm(bgm_dir=None):
    """Picks a random motivational background track from data/audio/bgm/."""
    target_dir = Path(bgm_dir) if bgm_dir else BGM_DIR
    if not target_dir.exists():
        return None
    tracks = [p for p in target_dir.glob("*.mp3") if p.stat().st_size > 10000]
    if not tracks:
        return None
    selected = random.choice(tracks)
    print(f"[Audio] 🎵 Selected random motivational BGM: {selected.name}")
    return selected

def mix(voice, total, out, bgm_file=None):
    """Mixes voice with background music ducked at -17dB with smooth fade."""
    if bgm_file is None or not Path(bgm_file).exists():
        bgm_file = pick_random_bgm()

    if bgm_file and Path(bgm_file).exists():
        fc = (f"[1:a]volume=-17dB,afade=t=in:d=1.5,afade=t=out:st={max(0, total - 2):.2f}:d=2[m];"
              "[0:a][m]amix=inputs=2:duration=first:normalize=0[a]")
        cmd = [
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(voice),
            "-stream_loop", "-1", "-i", str(bgm_file),
            "-filter_complex", fc,
            "-map", "[a]",
            "-t", str(total),
            "-ar", "44100",
            str(out)
        ]
        subprocess.run(cmd, check=True)
    else:
        # Fallback harmonic ambient chords
        d = total + 1
        fc = ("[1][2][3]amix=inputs=3:normalize=0,tremolo=f=0.25:d=0.5,volume=-17dB,"
              f"afade=t=in:d=2,afade=t=out:st={max(0, total - 2):.2f}:d=2[m];"
              "[0][m]amix=inputs=2:duration=first:normalize=0[a]")
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(voice)]
        for f in (130.81, 164.81, 196.0):
            cmd += ["-f", "lavfi", "-i", f"sine=f={f}:d={d}"]
        cmd += ["-filter_complex", fc, "-map", "[a]", "-ar", "44100", str(out)]
        subprocess.run(cmd, check=True)
