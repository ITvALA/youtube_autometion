import os
import sys
import json
import shutil
import socket
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
from pathlib import Path

# Ensure UTF-8 output on Windows consoles
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr and sys.stderr.encoding and sys.stderr.encoding.lower() != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
SRC_DIR = PROJECT_ROOT / "src"
if str(SRC_DIR) not in sys.path:
    sys.path.insert(0, str(SRC_DIR))

from common import ROOT, load_env, jload, jsave
import youtube_upload

HOST = "0.0.0.0"
PORT = 8080
OUT = ROOT / "data" / "output"

def get_local_ip():
    """Finds local network IP so the user can open it on their phone."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

class MobileReviewHandler(SimpleHTTPRequestHandler):
    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path

        # 1. API: Get Current Video Review State
        if path == "/api/state":
            dirs = sorted(OUT.glob("*/meta.json"))
            if dirs:
                latest = dirs[-1].parent
                meta = jload(latest / "meta.json", {})
                plan = jload(latest / "plan.json", {})
                scenes = plan.get("scenes", [])
                sections = []
                for idx, s in enumerate(scenes):
                    sections.append({
                        "chapter_title": f"Scene {idx+1} ({s.get('type', '')})",
                        "hindi_chapter_title": s.get("type", "").upper(),
                        "headline": s.get("narration", "")[:80] + ("..." if len(s.get("narration", "")) > 80 else "")
                    })
                total_duration = round(sum(s.get("durationSec", 6.0) for s in scenes) / 60.0, 1)
                state = {
                    "status": "ready_for_review",
                    "ready_time": meta.get("created_at", "Today"),
                    "book_title": meta.get("title", meta.get("book", latest.name)),
                    "english_title": meta.get("book", latest.name),
                    "author": meta.get("author", plan.get("book", {}).get("author", "MindSpark")),
                    "category": plan.get("theme", {}).get("formatName", "Vertical Video (9:16)"),
                    "core_concept": f"Palette: {plan.get('theme', {}).get('palette', '')} | Trans: {plan.get('theme', {}).get('transition', '')}",
                    "duration_minutes": total_duration or 0.6,
                    "video_url": f"/video/{latest.name}/final.mp4",
                    "folder": latest.name,
                    "script_data": {"sections": sections}
                }
            else:
                state = {
                    "status": "waiting_generation",
                    "message": "No pending videos found in data/output. Run python src/daily_pipeline.py"
                }

            cfg_path = ROOT / "config" / "voice_config.json"
            if cfg_path.exists():
                try:
                    state["voice_config"] = jload(cfg_path, {})
                except Exception:
                    pass

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(state, ensure_ascii=False).encode("utf-8"))
            return

        # 2. Serve Audio Files
        if path.startswith("/audio/voice/"):
            voice_file = path.replace("/audio/voice/", "")
            v_path = OUT / "voices" / voice_file
            if v_path.exists():
                self.send_response(200)
                self.send_header("Content-Type", "audio/mpeg")
                self.send_header("Content-Length", str(v_path.stat().st_size))
                self.end_headers()
                with open(v_path, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, "Voice Audio Not Found")
            return

        if path == "/audio/bgm":
            bgm_path = ROOT / "data" / "audio" / "bgm" / "ambient_lofi_pad.mp3"
            if bgm_path.exists():
                self.send_response(200)
                self.send_header("Content-Type", "audio/mpeg")
                self.send_header("Content-Length", str(bgm_path.stat().st_size))
                self.end_headers()
                with open(bgm_path, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, "BGM Not Found")
            return

        # 3. Serve Dynamic & Sample Videos
        if path.startswith("/video/") and path.endswith("/final.mp4"):
            parts = path.strip("/").split("/")
            if len(parts) == 3:
                folder_name = parts[1]
                v_path = OUT / folder_name / "final.mp4"
                if v_path.exists():
                    self.send_response(200)
                    self.send_header("Content-Type", "video/mp4")
                    self.send_header("Content-Length", str(v_path.stat().st_size))
                    self.end_headers()
                    if self.command != "HEAD":
                        with open(v_path, "rb") as f:
                            shutil.copyfileobj(f, self.wfile)
                    return
            self.send_error(404, "Rendered Video Not Found")
            return

        if path.startswith("/video/sample_"):
            clean_name = path.replace("/video/", "") + ".mp4"
            sample_file = OUT / "samples" / clean_name
            if sample_file.exists():
                self.send_response(200)
                self.send_header("Content-Type", "video/mp4")
                self.send_header("Content-Length", str(sample_file.stat().st_size))
                self.end_headers()
                if self.command != "HEAD":
                    with open(sample_file, "rb") as f:
                        shutil.copyfileobj(f, self.wfile)
            else:
                self.send_error(404, f"Sample Video '{clean_name}' Not Found")
            return

        # 4. Main HTML UI
        if path in ["/", "/index.html"]:
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(self._render_mobile_ui().encode("utf-8"))
            return

        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8") if length > 0 else ""
        data = {}
        if body:
            try:
                data = json.loads(body)
            except Exception:
                data = {k: v[0] for k, v in parse_qs(body).items()}

        folder_name = data.get("folder")
        if not folder_name:
            dirs = sorted(OUT.glob("*/meta.json"))
            if dirs:
                folder_name = dirs[-1].parent.name

        target_dir = OUT / folder_name if folder_name else None

        # API: PASS Action
        if path in ["/api/pass", "/pass"]:
            if not target_dir or not target_dir.exists():
                self._send_json({"error": "No pending video found to pass."}, 400)
                return
            try:
                if data.get("title") or data.get("description") or data.get("privacy"):
                    meta = jload(target_dir / "meta.json", {})
                    meta.update({
                        "title": data.get("title", meta.get("title", "")),
                        "description": data.get("description", meta.get("description", "")),
                        "privacy": data.get("privacy", meta.get("privacy", "private"))
                    })
                    jsave(target_dir / "meta.json", meta)

                dry = data.get("dry_run", False) or os.environ.get("DRY_RUN", "").lower() in ("1", "true")
                vid = youtube_upload.approve(target_dir, dry_run=dry)
                self._send_json({
                    "status": "passed_and_uploaded",
                    "youtube_url": f"https://youtu.be/{vid}" if vid else "Archived",
                    "video_id": vid
                })
            except Exception as e:
                self._send_json({"error": str(e)}, 500)
            return

        # API: FAIL Action
        if path in ["/api/fail", "/fail"]:
            if target_dir and target_dir.exists():
                shutil.rmtree(target_dir, ignore_errors=True)
            self._send_json({"status": "failed_and_discarded"})
            return

        # API: Select Voice
        if path == "/api/select_voice":
            voice_id = data.get("voice_id", "")
            voice_name = data.get("voice_name", "")
            cfg_path = ROOT / "config" / "voice_config.json"
            cfg = jload(cfg_path, {})
            cfg["selected_voice_id"] = voice_id
            cfg["selected_voice_name"] = voice_name
            jsave(cfg_path, cfg)
            self._send_json({"status": "ok", "saved": cfg})
            return

        self.send_error(404, "Endpoint Not Found")

    def _send_json(self, payload: dict, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(payload, ensure_ascii=False).encode("utf-8"))

    def _render_mobile_ui(self) -> str:
        local_ip = get_local_ip()
        return f"""<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>MindSpark Book Studio — Mobile Review</title>
  <style>
    :root {{
      --bg: #0C0A09;
      --card-bg: #1A1714;
      --gold: #D4AF37;
      --gold-glow: rgba(212, 175, 55, 0.25);
      --text: #FDFBF7;
      --text-muted: #A8A29E;
      --green: #10B981;
      --red: #EF4444;
      --blue: #3B82F6;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-tap-highlight-color: transparent; }}
    body {{ background: var(--bg); color: var(--text); min-height: 100vh; padding: 16px; padding-bottom: 90px; }}
    
    .header {{ display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }}
    .brand {{ font-size: 1.25rem; font-weight: 800; color: var(--gold); letter-spacing: 1px; }}
    .time-badge {{ background: #26221D; border: 1px solid var(--gold); color: var(--gold); font-size: 0.75rem; font-weight: 700; padding: 4px 10px; border-radius: 999px; }}

    .video-card {{ background: var(--card-bg); border-radius: 20px; overflow: hidden; border: 1px solid rgba(212, 175, 55, 0.3); box-shadow: 0 10px 30px rgba(0,0,0,0.8); margin-bottom: 16px; }}
    video {{ width: 100%; aspect-ratio: 9/16; max-height: 55vh; object-fit: contain; background: #000; display: block; }}
    .video-info {{ padding: 16px; }}
    .book-title {{ font-size: 1.15rem; font-weight: 800; line-height: 1.3; margin-bottom: 4px; }}
    .book-author {{ font-size: 0.85rem; color: var(--text-muted); margin-bottom: 10px; }}
    .book-concept {{ font-size: 0.82rem; color: var(--gold); background: rgba(212,175,55,0.1); padding: 8px 12px; border-radius: 10px; border-left: 3px solid var(--gold); }}

    .actions-grid {{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 16px; }}
    .btn {{ border: none; border-radius: 14px; padding: 14px 8px; font-size: 0.95rem; font-weight: 800; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; transition: transform 0.1s, opacity 0.2s; }}
    .btn:active {{ transform: scale(0.96); }}
    .btn-pass {{ background: var(--green); color: #fff; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); }}
    .btn-fail {{ background: #292524; color: var(--red); border: 1px solid var(--red); }}
    .btn-edit {{ background: #292524; color: var(--blue); border: 1px solid var(--blue); }}

    .section-title {{ font-size: 0.9rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }}
    .chapter-card {{ background: var(--card-bg); border-radius: 14px; padding: 12px 14px; margin-bottom: 8px; border: 1px solid #292524; font-size: 0.85rem; display: flex; align-items: center; gap: 10px; }}
    .ch-num {{ background: var(--gold); color: #000; font-weight: 800; font-size: 0.75rem; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }}

    #editModal {{ display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 100; align-items: flex-end; }}
    .modal-sheet {{ background: #1C1917; width: 100%; border-radius: 24px 24px 0 0; padding: 24px 20px; border-top: 2px solid var(--gold); max-height: 85vh; overflow-y: auto; }}
    .modal-title {{ font-size: 1.1rem; font-weight: 800; margin-bottom: 16px; color: var(--gold); }}
    .field {{ margin-bottom: 14px; }}
    .field label {{ display: block; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 6px; font-weight: 600; }}
    .field input, .field textarea, .field select {{ width: 100%; background: #292524; border: 1px solid #44403C; border-radius: 10px; padding: 10px; color: #fff; font-size: 0.85rem; }}
    .modal-btns {{ display: flex; gap: 10px; margin-top: 16px; }}

    .voice-card {{ background: #1C1917; border-radius: 14px; padding: 12px; margin-bottom: 10px; border: 1px solid #292524; }}
    .voice-header {{ display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }}
    .voice-tag {{ font-size: 0.65rem; font-weight: 800; background: rgba(245, 158, 11, 0.2); color: #F59E0B; padding: 2px 8px; border-radius: 6px; display: inline-block; margin-bottom: 4px; }}
    .voice-name {{ font-size: 0.88rem; font-weight: 800; color: #FFF; }}
    .voice-desc {{ font-size: 0.75rem; color: #A8A29E; margin-top: 2px; }}
    .voice-select-btn {{ background: #292524; color: #FFF; border: 1px solid #44403C; border-radius: 8px; padding: 6px 12px; font-size: 0.75rem; font-weight: 700; cursor: pointer; white-space: nowrap; }}
    .voice-select-btn:active {{ transform: scale(0.95); }}

    #toast {{ position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: #10B981; color: #fff; padding: 12px 24px; border-radius: 999px; font-weight: 700; font-size: 0.85rem; display: none; z-index: 200; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}

    .sample-tabs-container {{ display: flex; gap: 8px; margin-bottom: 14px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: none; }}
    .sample-tabs-container::-webkit-scrollbar {{ display: none; }}
    .sample-tab-btn {{ background: #1C1917; color: #D4D4D8; border: 1px solid #3F3F46; padding: 10px 16px; border-radius: 12px; font-weight: 800; font-size: 0.82rem; cursor: pointer; white-space: nowrap; transition: all 0.2s ease; }}
    .sample-tab-btn.active {{ background: #10B981; color: #000; border-color: #10B981; box-shadow: 0 0 18px rgba(16, 185, 129, 0.5); transform: scale(1.02); }}
  </style>
</head>
<body>

  <div class="header">
    <div class="brand">⚡ MINDSPARK STUDIO</div>
    <div class="time-badge">⏰ DAILY REVIEW</div>
  </div>

  <div style="font-size: 0.8rem; font-weight: 800; color: #10B981; margin-bottom: 8px; letter-spacing: 1px; display: flex; align-items: center; justify-content: space-between;">
    <span>🎯 TEST SAMPLES (VOICE 5 + BGM)</span>
    <span style="font-size: 0.7rem; color: #A8A29E; background: #26221D; padding: 2px 8px; border-radius: 6px;">Tap to switch</span>
  </div>
  <div class="sample-tabs-container">
    <button class="sample-tab-btn active" id="tab_daily" onclick="loadState()">⭐ TODAY'S VIDEO</button>
    <button class="sample-tab-btn" id="tab_sample_1" onclick="switchSampleVideo('/video/sample_1_atomic_habits', 'Atomic Habits (James Clear)', 'The 1% Compounding Law', 'tab_sample_1')">1. ATOMIC HABITS</button>
    <button class="sample-tab-btn" id="tab_sample_2" onclick="switchSampleVideo('/video/sample_2_psychology_of_money', 'The Psychology of Money', 'Freedom vs Status', 'tab_sample_2')">2. PSYCHOLOGY OF MONEY</button>
    <button class="sample-tab-btn" id="tab_sample_3" onclick="switchSampleVideo('/video/sample_3_deep_work', 'Deep Work (Cal Newport)', 'Focus & Flow State', 'tab_sample_3')">3. DEEP WORK</button>
  </div>

  <div class="video-card">
    <video id="player" controls playsinline preload="metadata">
      <source id="videoSource" src="" type="video/mp4">
      Your browser does not support HTML5 video.
    </video>
    <div class="video-info">
      <div class="book-title" id="bookTitle">Loading Today's Master Video...</div>
      <div class="book-author" id="bookAuthor">🎙️ Voice 5 (Prabhat) • 🎵 Ambient Lo-Fi BGM Mixed In</div>
      <div class="book-concept" id="bookConcept">✨ MindSpark Dynamic Remotion Theme</div>
    </div>
  </div>

  <div class="actions-grid">
    <button class="btn btn-pass" onclick="handlePass()">
      <span>✅ PASS</span>
      <span style="font-size: 0.65rem; opacity: 0.9;">Upload & Record</span>
    </button>
    <button class="btn btn-fail" onclick="handleFail()">
      <span>❌ FAIL</span>
      <span style="font-size: 0.65rem; opacity: 0.8;">Discard</span>
    </button>
    <button class="btn btn-edit" onclick="openEditModal()">
      <span>✏️ EDIT</span>
      <span style="font-size: 0.65rem; opacity: 0.8;">Manual Edit</span>
    </button>
  </div>

  <!-- SCENE BREAKDOWN -->
  <div style="margin-bottom: 24px;">
    <div class="section-title">📖 SCENE BREAKDOWN</div>
    <div id="chaptersList"></div>
  </div>

  <!-- VOICE AUDITION STUDIO -->
  <div style="background: #141620; border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 20px; padding: 18px; margin-bottom: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
    <div style="font-size: 1.1rem; font-weight: 800; color: #F59E0B; margin-bottom: 6px;">🎙️ VOICE AUDITION STUDIO</div>
    <div style="font-size: 0.8rem; color: #94A3B8; margin-bottom: 16px;">Selected voice: <strong>Voice 5 (Prabhat Neural, -2Hz)</strong></div>

    <div class="voice-card">
      <div class="voice-header">
        <div>
          <span class="voice-tag">LOCKED DEFAULT</span>
          <div class="voice-name">5. Prabhat (Modern Tech & Hinglish Male)</div>
          <div class="voice-desc">Fast, modern Indian podcast & explainer tone</div>
        </div>
        <button class="voice-select-btn" id="btn_voice_5_prabhat_tech" style="background: #10B981;">✓ ACTIVE</button>
      </div>
      <audio controls style="width: 100%; margin-top: 8px; height: 32px;" src="/audio/voice/voice_5_prabhat_tech.mp3"></audio>
    </div>

    <div class="voice-card">
      <div class="voice-header">
        <div>
          <span class="voice-tag">NATURAL</span>
          <div class="voice-name">1. Madhur (Natural Explainer Male)</div>
          <div class="voice-desc">Warm, conversational Hindi narrator</div>
        </div>
        <button class="voice-select-btn" id="btn_voice_1_madhur_natural" onclick="selectVoice('voice_1_madhur_natural', '1. Madhur (Natural Explainer Male)')">Select Voice</button>
      </div>
      <audio controls style="width: 100%; margin-top: 8px; height: 32px;" src="/audio/voice/voice_1_madhur_natural.mp3"></audio>
    </div>

    <div class="voice-card">
      <div class="voice-header">
        <div>
          <span class="voice-tag">FEMALE</span>
          <div class="voice-name">3. Swara (Warm & Conversational Female)</div>
          <div class="voice-desc">Clear, friendly tone</div>
        </div>
        <button class="voice-select-btn" id="btn_voice_3_swara_natural" onclick="selectVoice('voice_3_swara_natural', '3. Swara')">Select Voice</button>
      </div>
      <audio controls style="width: 100%; margin-top: 8px; height: 32px;" src="/audio/voice/voice_3_swara_natural.mp3"></audio>
    </div>
  </div>

  <!-- EDIT MODAL -->
  <div id="editModal">
    <div class="modal-sheet">
      <div class="modal-title">✏️ EDIT METADATA BEFORE UPLOAD</div>
      <div class="field">
        <label>Video Title</label>
        <input type="text" id="editTitle" value="">
      </div>
      <div class="field">
        <label>Description</label>
        <textarea id="editDesc" rows="4"></textarea>
      </div>
      <div class="field">
        <label>Privacy</label>
        <select id="editPrivacy">
          <option value="private">Private (सुरक्षित - Recommended)</option>
          <option value="unlisted">Unlisted (सिर्फ लिंक वाले)</option>
          <option value="public">Public (सीधे लाइव)</option>
        </select>
      </div>
      <div class="modal-btns">
        <button class="btn btn-pass" style="flex: 2;" onclick="saveAndPass()">🚀 Upload to YouTube</button>
        <button class="btn btn-fail" style="flex: 1;" onclick="closeEditModal()">Cancel</button>
      </div>
    </div>
  </div>

  <div id="toast"></div>

  <script>
    let currentState = {{}};

    async function loadState() {{
      try {{
        const res = await fetch('/api/state');
        const data = await res.json();
        currentState = data;
        if (data.status === 'ready_for_review') {{
          document.getElementById('bookTitle').textContent = data.book_title;
          document.getElementById('bookAuthor').textContent = `✍️ ${{data.author}} • ⏱️ ${{data.duration_minutes}} mins`;
          document.getElementById('bookConcept').textContent = `💡 ${{data.core_concept || 'Daily Master Breakdown'}}`;
          document.getElementById('editTitle').value = `${{data.book_title}} - Summary (${{data.author}}) #MindSpark`;
          document.getElementById('editDesc').value = `📚 ${{data.book_title}} by ${{data.author}}.\\n\\n${{data.core_concept}}\\n\\nSubscribe for daily book videos!\\n#Books #MindSpark`;

          const p = document.getElementById('player');
          p.src = data.video_url;
          p.load();

          const list = document.getElementById('chaptersList');
          list.innerHTML = '';
          const sections = data.script_data?.sections || [];
          sections.forEach((s, idx) => {{
            const div = document.createElement('div');
            div.className = 'chapter-card';
            div.innerHTML = `
              <div class="ch-num">${{idx + 1}}</div>
              <div>
                <strong>${{s.hindi_chapter_title || s.chapter_title}}</strong>
                <div style="font-size: 0.75rem; color: #A8A29E; margin-top: 2px;">${{s.headline}}</div>
              </div>
            `;
            list.appendChild(div);
          }});
          document.querySelectorAll('.sample-tab-btn').forEach(b => b.classList.remove('active'));
          document.getElementById('tab_daily').classList.add('active');
        }} else {{
          document.getElementById('bookTitle').textContent = 'No Pending Video';
          document.getElementById('bookConcept').textContent = data.message || 'Run pipeline to generate a video.';
        }}
      }} catch (e) {{
        console.error(e);
      }}
    }}

    function showToast(msg, bg = '#10B981') {{
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.style.background = bg;
      t.style.display = 'block';
      setTimeout(() => {{ t.style.display = 'none'; }}, 3500);
    }}

    async function handlePass() {{
      showToast('🚀 Uploading to YouTube & archiving book...', '#3B82F6');
      try {{
        const res = await fetch('/api/pass', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ folder: currentState.folder }})
        }});
        const data = await res.json();
        if (data.status === 'passed_and_uploaded') {{
          showToast('✅ Uploaded to YouTube! Book archived.', '#10B981');
          setTimeout(() => location.reload(), 2500);
        }} else {{
          showToast('❌ Upload failed: ' + (data.error || 'Unknown error'), '#EF4444');
        }}
      }} catch (e) {{
        showToast('❌ Network error', '#EF4444');
      }}
    }}

    async function handleFail() {{
      if (!confirm('Are you sure you want to discard this video?')) return;
      try {{
        await fetch('/api/fail', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ folder: currentState.folder }})
        }});
        showToast('🗑️ Video discarded.', '#EF4444');
        setTimeout(() => location.reload(), 1500);
      }} catch (e) {{}}
    }}

    function openEditModal() {{
      document.getElementById('editModal').style.display = 'flex';
    }}

    function closeEditModal() {{
      document.getElementById('editModal').style.display = 'none';
    }}

    async function saveAndPass() {{
      const title = document.getElementById('editTitle').value;
      const desc = document.getElementById('editDesc').value;
      const privacy = document.getElementById('editPrivacy').value;
      closeEditModal();
      showToast('🚀 Uploading edited video to YouTube...', '#3B82F6');
      try {{
        const res = await fetch('/api/pass', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ folder: currentState.folder, title, description: desc, privacy }})
        }});
        const data = await res.json();
        if (data.status === 'passed_and_uploaded') {{
          showToast('✅ Uploaded! Saved to completed_books.md', '#10B981');
          setTimeout(() => location.reload(), 2500);
        }} else {{
          showToast('❌ Error: ' + (data.error || 'Failed'), '#EF4444');
        }}
      }} catch (e) {{
        showToast('❌ Upload error', '#EF4444');
      }}
    }}

    function switchSampleVideo(videoSrc, title, concept, tabId) {{
      const p = document.getElementById('player');
      p.src = videoSrc;
      p.load();
      p.play().catch(e => {{}});
      document.getElementById('bookTitle').textContent = title;
      document.getElementById('bookAuthor').textContent = '🎙️ Voice 5 (Prabhat) • 🎵 Ambient Lo-Fi BGM Mixed In';
      document.getElementById('bookConcept').textContent = '✨ ' + concept;
      document.querySelectorAll('.sample-tab-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById(tabId);
      if (activeBtn) activeBtn.classList.add('active');
      showToast('🎬 ' + title, '#10B981');
    }}

    async function selectVoice(voiceId, voiceName) {{
      showToast('🎙️ Setting ' + voiceName + '...', '#3B82F6');
      try {{
        const res = await fetch('/api/select_voice', {{
          method: 'POST',
          headers: {{ 'Content-Type': 'application/json' }},
          body: JSON.stringify({{ voice_id: voiceId, voice_name: voiceName }})
        }});
        const d = await res.json();
        if (d.status === 'ok') {{
          showToast('✅ Selected: ' + voiceName, '#10B981');
          location.reload();
        }}
      }} catch (e) {{
        showToast('❌ Error setting voice', '#EF4444');
      }}
    }}

    loadState();
  </script>
</body>
</html>
"""

def run_mobile_server(port: int = PORT):
    load_env()
    server = HTTPServer((HOST, port), MobileReviewHandler)
    local_ip = get_local_ip()
    print("=" * 60)
    print("📱 MINDSPARK MOBILE REVIEW APP READY!")
    print(f"👉 Local Access:   http://localhost:{port}")
    print(f"📲 Phone Access:   http://{local_ip}:{port}")
    print("=" * 60)
    server.serve_forever()

if __name__ == "__main__":
    run_mobile_server()
