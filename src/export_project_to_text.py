"""Exports the entire MindSpark project codebase and configuration into a single text file.
Strictly excludes sensitive credentials (.env, tokens, secrets) and binary media assets.
"""
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

EXCLUDE_DIRS = {
    ".git", "node_modules", "__pycache__", ".pytest_cache",
    ".idea", ".vscode", "venv", ".venv", "build", "dist"
}

EXCLUDE_FILES = {
    ".env", "client_secrets.json", "youtube_token.json",
    "package-lock.json"
}

ALLOWED_EXTENSIONS = {
    ".py", ".ts", ".tsx", ".json", ".yml", ".yaml",
    ".md", ".txt", ".ini", ".toml", ".html", ".css", ".js"
}

EXCLUDE_PATH_SUBSTRINGS = [
    os.path.join("data", "work"),
    os.path.join("data", "output"),
    os.path.join("remotion", "node_modules"),
]

def should_include(rel_path: Path) -> bool:
    rel_str = str(rel_path)
    # Check directory exclusion
    for part in rel_path.parts[:-1]:
        if part in EXCLUDE_DIRS:
            return False
    # Check path substrings
    for sub in EXCLUDE_PATH_SUBSTRINGS:
        if sub in rel_str:
            return False
    # Check file exclusion
    if rel_path.name in EXCLUDE_FILES:
        return False
    # Check extension
    if rel_path.suffix.lower() not in ALLOWED_EXTENSIONS:
        return False
    # Don't include the output text file itself
    if rel_path.name in ("mindspark_project.txt", "project_codebase.txt"):
        return False
    return True

def generate_export():
    out_file = ROOT / "mindspark_project.txt"
    files_to_export = []

    for root, dirs, files in os.walk(ROOT):
        # Filter directories in-place
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not any(sub in os.path.join(root, d) for sub in EXCLUDE_PATH_SUBSTRINGS)]
        for f in files:
            full_path = Path(root) / f
            rel_path = full_path.relative_to(ROOT)
            if should_include(rel_path):
                files_to_export.append(rel_path)

    files_to_export.sort()

    with open(out_file, "w", encoding="utf-8") as out:
        out.write("=" * 80 + "\n")
        out.write("MINDSPARK STUDIO - COMPLETE CODEBASE ARCHIVE\n")
        out.write("=" * 80 + "\n")
        out.write(f"Total Files Included: {len(files_to_export)}\n")
        out.write("Generated for: MindSpark automated Hinglish YouTube Shorts Studio\n")
        out.write("=" * 80 + "\n\n")

        out.write("TABLE OF CONTENTS:\n")
        for i, fp in enumerate(files_to_export, 1):
            out.write(f"{i:3d}. {fp.as_posix()}\n")
        out.write("\n" + "=" * 80 + "\n\n")

        for i, fp in enumerate(files_to_export, 1):
            full_path = ROOT / fp
            out.write("\n" + "=" * 80 + "\n")
            out.write(f"FILE [{i}/{len(files_to_export)}]: {fp.as_posix()}\n")
            out.write("=" * 80 + "\n")
            try:
                content = full_path.read_text(encoding="utf-8", errors="replace")
                out.write(content)
                if not content.endswith("\n"):
                    out.write("\n")
            except Exception as e:
                out.write(f"[ERROR READING FILE: {e}]\n")

    print(f"Successfully generated archive with {len(files_to_export)} files at:")
    print(out_file)
    print(f"File size: {out_file.stat().st_size / 1024:.1f} KB")

if __name__ == "__main__":
    generate_export()

