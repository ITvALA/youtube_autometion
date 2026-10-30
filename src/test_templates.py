"""Simulation test: verifies 30 consecutive daily runs with template engine
proving that no template repeats within the no_repeat_last window.
"""
import sys, os, random
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

def test_simulation(num_runs=30, window=7):
    print(f"=== Running Simulation: {num_runs} Days with no_repeat_last = {window} ===")
    history = []
    config = {"template_mode": "random", "no_repeat_last": window}
    rng = random.Random(42)  # reproducible seed
    
    violation_count = 0
    chosen_sequence = []

    for day in range(1, num_runs + 1):
        tmpl = template_engine.pick_template(history=history, config=config, rng=rng)
        tid = tmpl["id"]
        tname = tmpl["name"]
        pal = tmpl["theme"]["palette"]
        
        # Check window violation
        recent_window = [h["template_id"] for h in history[-window:]]
        if tid in recent_window:
            print(f"[FAIL] DAY {day:02d}: VIOLATION! '{tid}' repeated inside last {window} runs: {recent_window}")
            violation_count += 1
        else:
            print(f"[OK] DAY {day:02d}: [{tid:20s}] {tname:28s} | Palette: {pal:16s}")
            
        history.append({"template_id": tid, "palette": pal, "day": day})
        chosen_sequence.append(tid)

    unique_templates = len(set(chosen_sequence))
    print(f"\n--- Simulation Results ---")
    print(f"Total Runs: {num_runs}")
    print(f"Window Size: {window}")
    print(f"Unique Templates Used: {unique_templates}/22")
    print(f"Violations: {violation_count}")

    assert violation_count == 0, f"Expected 0 violations, got {violation_count}"
    print("\nALL NO-REPEAT CONSTRAINTS VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    test_simulation()
