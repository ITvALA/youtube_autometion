"""Renders demo video for each of the 22 templates with Remotion.
Verifies ffprobe dimensions (must be 1080x1920), records render time, and prints Markdown table.
"""
import os, sys, time, json, shutil, subprocess
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

from common import ROOT, jload
import template_engine

def get_video_dimensions(video_path):
    try:
        cmd = [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height",
            "-of", "csv=s=x:p=0", str(video_path)
        ]
        out = subprocess.check_output(cmd, stderr=subprocess.STDOUT).decode().strip()
        dims = out.split("x")
        return f"{dims[0]}x{dims[1]}"
    except Exception as e:
        return "Unknown"

def run_all_renders():
    templates = template_engine.load_templates()
    print(f"=== Starting Remotion Renders for {len(templates)} Templates ===\n")
    
    npx = shutil.which("npx.cmd") or shutil.which("npx") or "npx.cmd"
    test_out_dir = ROOT / "data" / "test_renders"
    test_out_dir.mkdir(parents=True, exist_ok=True)
    
    results = []

    for idx, t in enumerate(templates, 1):
        tid = t["id"]
        tname = t["name"]
        plan_file = ROOT / "data" / f"demo_plan_{tid}.json"
        out_video = test_out_dir / f"demo_{tid}.mp4"
        
        if not plan_file.exists():
            results.append((tid, tname, "FAIL", "0.0s", "Missing plan file"))
            continue

        print(f"[{idx:02d}/{len(templates):02d}] Rendering template: {tid} ({tname})...")
        t0 = time.time()
        
        # Render first 60 frames (2 seconds) to thoroughly test React component mounts, transitions & backdrops
        cmd = [
            npx, "remotion", "render", "src/index.ts", "Main",
            str(out_video),
            f"--props={plan_file.resolve().as_posix()}",
            "--frames=0-60",
            "--log=error"
        ]
        
        try:
            res = subprocess.run(cmd, cwd=ROOT / "remotion", capture_output=True, text=True, check=True)
            elapsed = time.time() - t0
            dims = get_video_dimensions(out_video)
            status = "OK" if dims == "1080x1920" else "FAIL (Dimensions)"
            results.append((tid, tname, status, f"{elapsed:.1f}s", dims))
            print(f"       -> Status: {status} | Time: {elapsed:.1f}s | Size: {dims}")
        except subprocess.CalledProcessError as err:
            elapsed = time.time() - t0
            err_msg = (err.stderr or err.stdout or "Render error")[:120].strip()
            print(f"       -> FAIL: {err_msg}")
            results.append((tid, tname, "FAIL", f"{elapsed:.1f}s", "Render Failed"))

    print("\n" + "=" * 80)
    print("### TEMPLATE RENDER VERIFICATION TABLE")
    print("=" * 80)
    header = f"| # | Template ID | Template Name | Render Status | Render Time | Output Resolution |"
    sep = f"|---|-------------|---------------|---------------|-------------|-------------------|"
    print(header)
    print(sep)
    for i, r in enumerate(results, 1):
        print(f"| {i:02d} | `{r[0]}` | {r[1]} | **{r[2]}** | {r[3]} | `{r[4]}` |")
    print("=" * 80)

if __name__ == "__main__":
    run_all_renders()
