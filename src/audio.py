"""Original ambient pad ducked at -16 dB under the voice."""
import subprocess
from common import ROOT

def mix(voice, total, out):
    bgm_file = ROOT / "data" / "audio" / "bgm" / "ambient_lofi_pad.mp3"
    if bgm_file.exists():
        fc = (f"[1:a]volume=-16dB,afade=t=in:d=1.5,afade=t=out:st={max(0, total - 2):.2f}:d=2[m];"
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
        d = total + 1
        fc = ("[1][2][3]amix=inputs=3:normalize=0,tremolo=f=0.25:d=0.5,volume=-16dB,"
              f"afade=t=in:d=2,afade=t=out:st={max(0, total - 2):.2f}:d=2[m];"
              "[0][m]amix=inputs=2:duration=first:normalize=0[a]")
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(voice)]
        for f in (130.81, 164.81, 196.0):
            cmd += ["-f", "lavfi", "-i", f"sine=f={f}:d={d}"]
        cmd += ["-filter_complex", fc, "-map", "[a]", "-ar", "44100", str(out)]
        subprocess.run(cmd, check=True)
