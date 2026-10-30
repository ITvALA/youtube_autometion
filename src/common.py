import json, os, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent

def load_env():
    p = ROOT / ".env"
    if p.exists():
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
    # Fallback mappings for old .env keys
    if "LLM_API_KEY" not in os.environ and "ANTHROPIC_API_KEY" in os.environ:
        os.environ["LLM_API_KEY"] = os.environ["ANTHROPIC_API_KEY"]
    if "LLM_BASE_URL" not in os.environ and "ANTHROPIC_BASE_URL" in os.environ:
        os.environ["LLM_BASE_URL"] = os.environ["ANTHROPIC_BASE_URL"]
    if "LLM_MODEL" not in os.environ and "ANTHROPIC_MODEL" in os.environ:
        os.environ["LLM_MODEL"] = os.environ["ANTHROPIC_MODEL"]
    if "LLM_API_STYLE" not in os.environ:
        os.environ["LLM_API_STYLE"] = "openai"

def jload(path, default):
    try:
        return json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
    except Exception:
        return default

def jsave(path, data):
    p = pathlib.Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
