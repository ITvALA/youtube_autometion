"""Verification script: renders and tests all 22 templates with Remotion.
Checks ffprobe dimensions (1080x1920), records render time, and generates verification table.
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

import template_engine

def get_dimensions(file_path):
    try:
        cmd = [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-show_entries", "stream=width,height",
            "-of", "csv=s=x:p=0", str(file_path)
        ]
        out = subprocess.check_output(cmd, stderr=subprocess.STDOUT).decode().strip()
        return out
    except Exception as e:
        return f"Error: {e}"

def verify_all():
    templates = template_engine.load_templates()
    print(f"=== Verifying All {len(templates)} Templates with Remotion ===")
    
    npx = shutil.which("npx.cmd") or shutil.which("npx") or "npx.cmd"
    test_out_dir = ROOT / "data" / "test_renders"
    test_out_dir.mkdir(parents=True, exist_ok=True)
    
    results = []

    for idx, t in enumerate(templates, 1):
        tid = t["id"]
        tname = t["name"]
        plan_file = ROOT / "data" / f"demo_plan_{tid}.json"
        out_image = test_out_dir / f"test_{tid}.png"

        if not plan_file.exists():
            results.append((tid, tname, "FAIL", "0.0s", "Plan not found"))
            continue

        print(f"[{idx:02d}/22] Testing '{tid}' ({tname})...", end=" ", flush=True)
        t0 = time.time()
        
        # Test full Remotion render pipeline
        cmd = [
            npx, "remotion", "still", "src/index.ts", "Main",
            str(out_image),
            f"--props={plan_file.resolve().as_posix()}",
            "--frame=25",
            "--log=error"
        ]
        
        try:
            res = subprocess.run(cmd, cwd=str(ROOT / "remotion"), capture_output=True, text=True, check=True)
            elapsed = time.time() - t0
            dims = get_dimensions(out_image)
            status = "OK" if dims == "1080x1920" else "FAIL"
            results.append((tid, tname, status, f"{elapsed:.1f}s", dims))
            print(f"OK ({elapsed:.1f}s, {dims})")
        except subprocess.CalledProcessError as err:
            elapsed = time.time() - t0
            err_msg = (err.stderr or err.stdout or "Render error")[:80].strip()
            print(f"FAIL: {err_msg}")
            results.append((tid, tname, "FAIL", f"{elapsed:.1f}s", "Render Error"))

    print("\n" + "=" * 85)
    print("### TEMPLATE VERIFICATION RESULTS")
    print("=" * 85)
    print("| # | Template ID | Template Name | Render Status | Render Time | Resolution |")
    print("|---|-------------|---------------|---------------|-------------|------------|")
    for i, r in enumerate(results, 1):
        print(f"| {i:02d} | `{r[0]}` | {r[1]} | **{r[2]}** | {r[3]} | `{r[4]}` |")
    print("=" * 85)

if __name__ == "__main__":
    verify_all()
