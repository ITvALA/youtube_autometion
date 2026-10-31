import os, sys, json, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
demo_path = ROOT / "data" / "demo_plan.json"
demo = json.loads(demo_path.read_text(encoding="utf-8"))

stills_dir = ROOT / "data" / "stills"
stills_dir.mkdir(parents=True, exist_ok=True)

STYLE_IDS = [
    "motion_graphics", "perspective_3d", "cutout_collage",
    "blueprint", "swiss_poster", "isometric"
]

results = []

for sid in STYLE_IDS:
    for variant in [0, 1, 2]:
        name = f"{sid}_var{variant}"
        plan = dict(demo)
        plan["style"] = {"id": sid, "variant": variant, "seed": 42 + variant * 100}
        plan_file = stills_dir / f"plan_{name}.json"
        plan_file.write_text(json.dumps(plan), encoding="utf-8")
        
        out_img = stills_dir / f"{name}.png"
        cmd = [
            "npx.cmd", "remotion", "still", "src/index.ts", "Main",
            str(out_img.resolve()),
            f"--props={plan_file.resolve().as_posix()}",
            "--frame=25"
        ]
        print(f"Rendering {name}...")
        res = subprocess.run(cmd, cwd=ROOT / "remotion", capture_output=True, text=True)
        if res.returncode != 0:
            print(f"FAILED {name}: {res.stderr}")
            results.append((name, False, res.stderr))
            continue
            
        # Check dimensions
        probe = subprocess.check_output([
            "ffprobe", "-v", "error", "-show_entries", "stream=width,height",
            "-of", "csv=s=x:p=0", str(out_img)
        ]).decode().strip()
        
        print(f"Rendered {name}: {probe}")
        results.append((name, probe == "1080x1920", probe))

all_ok = all(ok for _, ok, _ in results)
print("=" * 40)
print(f"Total: {len(results)}, Succeeded: {sum(1 for _, ok, _ in results if ok)}")
if not all_ok:
    sys.exit(1)
