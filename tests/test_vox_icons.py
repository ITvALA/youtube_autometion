import re
from pathlib import Path

from src.llm import VOX_ICONS
from src.style_engine import STYLE_IDS, style_traits, _STRIDE, _TOTAL, N_PAPERS, N_PALS, N_FONTS

ROOT = Path(__file__).resolve().parent.parent
VOX = ROOT / "remotion" / "src" / "vox"


def test_icon_list_matches_remotion():
    keys = []
    for name in ("icons.tsx", "icons2.tsx", "icons3.tsx"):
        src = (VOX / name).read_text(encoding="utf-8")
        keys += re.findall(r"^  (\w+): \(p", src, flags=re.M)
    assert keys == VOX_ICONS
    assert len(keys) == len(set(keys)) == 126


def test_212_unique_paper_palette_font_triples():
    triples = {style_traits(s) for s in STYLE_IDS}
    assert len(triples) == 212


def test_python_constants_match_style_table():
    ts = (VOX / "styleTable.ts").read_text(encoding="utf-8")
    assert f"const STRIDE = {_STRIDE}" in ts
    assert "VOX_COUNT = 212" in ts
    assert ts.count('{id: "') == N_PAPERS + N_FONTS
    assert len(re.findall(r'\{name: "', ts)) == N_PALS
    assert _TOTAL == N_PAPERS * N_PALS * N_FONTS
