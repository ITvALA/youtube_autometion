import os, sys, subprocess, glob, shutil, zipfile
from pathlib import Path
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT / "data" / "dataset_sanatan" / "raw_audio"
OUT_DIR = ROOT / "data" / "dataset_sanatan" / "wavs"
shutil.rmtree(OUT_DIR, ignore_errors=True)
OUT_DIR.mkdir(parents=True, exist_ok=True)

wav_files = list(RAW_DIR.glob("*.wav"))
print(f"Found {len(wav_files)} raw audio files in {RAW_DIR}")

for wav in wav_files:
    print(f"Processing full audio {wav.name}...")
    out_pattern = str(OUT_DIR / f"{wav.stem}_chunk_%04d.wav")
    # 40kHz mono 16-bit PCM, segment into 10-second clips
    cmd = [
        "ffmpeg", "-y", "-i", str(wav),
        "-ac", "1",
        "-ar", "40000",
        "-af", "highpass=f=65,lowpass=f=12000,loudnorm=I=-16:TP=-1.5:LRA=11",
        "-f", "segment",
        "-segment_time", "10",
        "-c:a", "pcm_s16le",
        out_pattern
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

all_chunks = sorted(list(OUT_DIR.glob("*.wav")))
print(f"Total sliced clean chunks created: {len(all_chunks)}")

# Filter out very small chunks (< 3 seconds) or completely silent
valid_chunks = []
total_duration = 0.0
for c in all_chunks:
    info = sf.info(str(c))
    if info.duration >= 3.0:
        valid_chunks.append(c)
        total_duration += info.duration
    else:
        c.unlink()

print(f"Valid clean chunks (>= 3s): {len(valid_chunks)}")
print(f"Total training dataset duration: {total_duration/60:.2f} minutes ({total_duration:.1f} seconds)")

# Create ZIP archive for 1-click Google Colab upload
zip_path = ROOT / "data" / "dataset_sanatan" / "sanatan_voice_dataset.zip"
print(f"Creating ZIP archive at {zip_path}...")
with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for c in valid_chunks:
        zf.write(c, arcname=c.name)

zip_size_mb = zip_path.stat().st_size / (1024 * 1024)
print(f"Dataset ZIP ready: {zip_path} ({zip_size_mb:.2f} MB, {len(valid_chunks)} chunks, {total_duration/60:.2f} mins)")
