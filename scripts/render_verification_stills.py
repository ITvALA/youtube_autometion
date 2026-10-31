import json
import subprocess
import shutil
import sys
from pathlib import Path

# Force UTF-8 stdout
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path(__file__).resolve().parent.parent
demo_plan = json.loads((ROOT / "data" / "demo_plan.json").read_text(encoding="utf-8"))

out_dir = ROOT / "remotion" / "out" / "verification_stills"
out_dir.mkdir(parents=True, exist_ok=True)

test_styles = [
    ("s001", "Midnight Marker", 30),
    ("s015", "Blueprint Grid", 30),
    ("s032", "Horizon Synthwave", 30),
    ("s048", "Glitch Colour Bars", 30),
    ("s080", "Halftone Pulse", 30),
    ("s150", "Tiles Diamond", 30),
    ("t01", "Midnight Thinking Loader", 30),
]

npx = shutil.which("npx.cmd") or shutil.which("npx") or "npx.cmd"

for sid, label, frame in test_styles:
    plan = dict(demo_plan)
    plan["style"] = {"id": sid, "variant": 0, "seed": 42}
    plan_path = out_dir / f"plan_{sid}.json"
    plan_path.write_text(json.dumps(plan, indent=2), encoding="utf-8")
    
    img_out = out_dir / f"still_{sid}.png"
    print(f"Rendering {sid} ({label}) at frame {frame}...")
    cmd = [
        npx, "remotion", "still", "src/index.ts", "Main", str(img_out),
        f"--props={plan_path.resolve().as_posix()}",
        f"--frame={frame}"
    ]
    subprocess.run(cmd, cwd=ROOT / "remotion", check=True)
    print(f"Rendered: {img_out.name} (size: {img_out.stat().st_size} bytes)")

print("\nAll 7 verification stills rendered successfully!")
