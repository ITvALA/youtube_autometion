import base64, subprocess
from pathlib import Path

import pytest

from src import tts


def _wav_bytes(tmp_path, secs=0.6):
    p = tmp_path / "t.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"sine=f=300:d={secs}:r=24000",
                    "-ac", "1", str(p)], check=True)
    return p.read_bytes()


class FakeResp:
    def __init__(self, status=200, payload=None, text=""):
        self.status_code, self._p, self.text = status, payload or {}, text

    def json(self):
        return self._p

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


def _mp3(path, secs=0.7):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"sine=f=200:d={secs}",
                    "-c:a", "libmp3lame", str(path)], check=True)


def test_strip_tags():
    assert tts.strip_tags("Dekho <short pause> yeh  <breath> sach hai") == "Dekho yeh sach hai"
    assert tts.strip_tags("") == ""


def test_gemini_new_api_style_in_metadata_and_tags_kept(tmp_path, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "k")
    seen = {}

    def fake_post(url, json=None, headers=None, timeout=0):
        seen.update(url=url, body=json, headers=headers)
        b64 = base64.b64encode(_wav_bytes(tmp_path)).decode()
        return FakeResp(200, {"steps": [{"type": "model_output", "content": [{"type": "audio", "mime_type": "audio/wav", "data": b64}]}]})

    monkeypatch.setattr(tts.requests, "post", fake_post)
    out = tmp_path / "o.mp3"
    cfg = {"voice": "Charon", "style": "warm and friendly", "gemini_models": ["gemini-3.8-flash-tts"]}
    tts._synth_gemini("देखो <short pause> ये सच है", cfg, out)
    assert out.exists() and out.stat().st_size > 500
    assert seen["url"].endswith("/v1beta/interactions")
    item = seen["body"]["input"][0]["content"][0]
    assert item["text"] == "देखो <short pause> ये सच है"          # tag transcript me rehta hai
    assert item["annotations"][0] == {"type": "speech_metadata", "style": "warm and friendly"}
    assert seen["body"]["generation_config"]["speech_config"] == [{"voice": "Charon"}]
    assert seen["headers"]["x-goog-api-key"] == "k"


def test_gemini_designed_voice_id_is_passed(tmp_path, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "k")
    seen = {}

    def fake_post(url, json=None, headers=None, timeout=0):
        seen["body"] = json
        b64 = base64.b64encode(_wav_bytes(tmp_path)).decode()
        return FakeResp(200, {"steps": [{"type": "model_output", "content": [{"type": "audio", "data": b64}]}]})

    monkeypatch.setattr(tts.requests, "post", fake_post)
    tts._synth_gemini("नमस्ते", {"voice": "voice_abc123", "gemini_models": ["gemini-3.8-flash-tts"]}, tmp_path / "o.mp3")
    assert seen["body"]["generation_config"]["speech_config"] == [{"voice": "voice_abc123"}]
    assert "annotations" not in seen["body"]["input"][0]["content"][0]        # style khaali = koi annotation nahi


def test_gemini_legacy_model_uses_generate_content_and_strips_tags(tmp_path, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "k")
    seen = {}

    def fake_post(url, json=None, headers=None, timeout=0):
        seen.update(url=url, body=json)
        pcm = base64.b64encode(b"\x00\x01" * 12000).decode()
        return FakeResp(200, {"candidates": [{"content": {"parts": [{"inlineData": {"mimeType": "audio/L16;rate=24000", "data": pcm}}]}}]})

    monkeypatch.setattr(tts.requests, "post", fake_post)
    tts._synth_gemini("एक <breath> दो", {"voice": "Kore", "style": "calm", "gemini_models": ["gemini-2.5-flash-preview-tts"]}, tmp_path / "o.mp3")
    assert ":generateContent" in seen["url"]
    assert seen["body"]["contents"][0]["parts"][0]["text"] == "calm: एक दो"


def test_fallback_report_and_edge_gets_clean_text(tmp_path, monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "k")
    monkeypatch.setattr(tts, "CACHE_DIR", tmp_path / "cache")
    monkeypatch.setattr(tts.requests, "post", lambda *a, **k: FakeResp(429, text="quota"))
    got = {}

    def fake_edge(text, cfg, out):
        got["text"] = text
        _mp3(out)
        return []

    monkeypatch.setitem(tts.PROVIDERS, "edge-tts", fake_edge)
    scenes = [{"narration": "Dekho yeh sach hai", "tts_text": "देखो <short pause> ये सच है", "delivery": "curious"}]
    cfg = {"providers": ["gemini_tts", "edge-tts"], "voice": "Charon", "gemini_models": ["gemini-3.8-flash-tts"],
           "voices": {"edge-tts": "hi-IN-MadhurNeural"}, "normalize": False}
    tts.narrate(scenes, tmp_path / "w", cfg)
    assert got["text"] == "देखो ये सच है"                  # tag Edge ko nahi gaya
    rep = tts.narrate.report
    assert rep[0]["provider"] == "edge-tts" and rep[0]["fails"] == ["gemini_tts"]
    assert scenes[0]["voiceProvider"] == "edge-tts"
    line = tts.voice_summary()
    assert "fallback" in line and "gemini tts failed" in line and "HTTP 429" in line
    assert not any(c in line for c in "_*`[")            # Telegram Markdown safe


def test_cache_key_changes_with_style(tmp_path, monkeypatch):
    monkeypatch.setattr(tts, "CACHE_DIR", tmp_path / "cache")
    calls = []

    def fake(text, cfg, out):
        calls.append(cfg.get("style"))
        _mp3(out)
        return []

    monkeypatch.setitem(tts.PROVIDERS, "gemini_tts", fake)
    base = {"providers": ["gemini_tts"], "voice": "Charon"}
    tts.synth_speech("नमस्ते", dict(base, style="calm"), tmp_path / "a.mp3")
    tts.synth_speech("नमस्ते", dict(base, style="calm"), tmp_path / "b.mp3")       # cache hit
    tts.synth_speech("नमस्ते", dict(base, style="excited"), tmp_path / "c.mp3")    # naya style = naya audio
    assert calls == ["calm", "excited"]
