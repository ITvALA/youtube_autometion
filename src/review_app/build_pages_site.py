"""Builds a standalone mobile review website for GitHub Pages or static hosting."""
import os, sys, json, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "data" / "output"
PUBLIC = ROOT / "public"

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>MindSpark Studio | Mobile Video Review</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090D16;
      --card: rgba(26, 34, 52, 0.7);
      --border: rgba(255, 255, 255, 0.08);
      --accent: #00F5A0;
      --accent-glow: rgba(0, 245, 160, 0.25);
      --text: #F8FAFC;
      --muted: #94A3B8;
      --danger: #EF4444;
      --pass: #10B981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body {
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      -webkit-font-smoothing: antialiased;
    }
    .header {
      width: 100%;
      max-width: 480px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 4px 20px;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 800;
      font-size: 1.15rem;
      letter-spacing: -0.5px;
    }
    .badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      background: rgba(0, 245, 160, 0.12);
      color: var(--accent);
      border: 1px solid rgba(0, 245, 160, 0.3);
      padding: 3px 8px;
      border-radius: 99px;
      text-transform: uppercase;
      font-weight: 700;
    }
    .container {
      width: 100%;
      max-width: 480px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .video-card {
      background: #000;
      border-radius: 20px;
      overflow: hidden;
      border: 1px solid var(--border);
      box-shadow: 0 20px 40px rgba(0,0,0,0.6);
      position: relative;
      aspect-ratio: 9 / 16;
      max-height: 65vh;
      display: flex;
      justify-content: center;
      background-size: cover;
    }
    video {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .card {
      background: var(--card);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border);
      border-radius: 18px;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .card-title {
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-title {
      font-size: 1.1rem;
      font-weight: 700;
      line-height: 1.35;
      color: #FFF;
    }
    .meta-desc {
      font-size: 0.85rem;
      color: var(--muted);
      line-height: 1.5;
      white-space: pre-line;
      background: rgba(0,0,0,0.25);
      padding: 12px;
      border-radius: 12px;
      max-height: 100px;
      overflow-y: auto;
    }
    .tags-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .tag {
      font-size: 0.75rem;
      background: rgba(255,255,255,0.06);
      color: #CBD5E1;
      padding: 4px 10px;
      border-radius: 99px;
    }
    .actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding-bottom: 24px;
    }
    .btn {
      border: none;
      padding: 16px;
      border-radius: 16px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }
    .btn-pass {
      background: linear-gradient(135deg, #00F5A0, #00D084);
      color: #042416;
      box-shadow: 0 8px 24px var(--accent-glow);
      grid-column: span 2;
    }
    .btn-pass:active { transform: scale(0.98); }
    .btn-fail {
      background: rgba(239, 68, 68, 0.15);
      color: #F87171;
      border: 1px solid rgba(239, 68, 68, 0.25);
    }
    .btn-download {
      background: rgba(255, 255, 255, 0.08);
      color: #FFF;
      text-decoration: none;
    }
    .status-msg {
      font-size: 0.85rem;
      text-align: center;
      padding: 10px;
      border-radius: 12px;
      display: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">
      <span>⚡ MindSpark Studio</span>
    </div>
    <span class="badge">Live Review</span>
  </div>

  <div class="container">
    <div class="video-card">
      <video controls playsinline preload="metadata">
        <source src="video.mp4" type="video/mp4">
        Your browser does not support video playback.
      </video>
    </div>

    <div class="card">
      <div class="card-title">YouTube Video Details</div>
      <div class="meta-title">__TITLE__</div>
      <div class="meta-desc">__DESC__</div>
      <div class="tags-wrap">
        __TAGS__
      </div>
    </div>

    <div id="statusBox" class="status-msg"></div>

    <div class="actions">
      <a href="video.mp4" download="mindspark_daily.mp4" class="btn btn-download">
        ⬇️ Save Video
      </a>
      <button class="btn btn-fail" onclick="rejectVideo()">
        ✕ Discard
      </button>
      <button class="btn btn-pass" onclick="approveAndUpload()">
        🚀 PASS & UPLOAD TO YOUTUBE
      </button>
    </div>
  </div>

  <script>
    const runId = "__RUN_ID__";
    const repo = "ITvALA/youtube_autometion";

    function showStatus(msg, isSuccess) {
      const box = document.getElementById("statusBox");
      box.style.display = "block";
      box.style.background = isSuccess ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)";
      box.style.color = isSuccess ? "#34D399" : "#F87171";
      box.style.border = isSuccess ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)";
      box.innerHTML = msg;
    }

    async function approveAndUpload() {
      let token = localStorage.getItem("gh_token");
      if (!token) {
        token = prompt("Enter your GitHub Personal Access Token (with workflow permission) to trigger upload:");
        if (token) localStorage.setItem("gh_token", token);
        else return;
      }
      showStatus("⏳ Triggering YouTube upload workflow in GitHub Actions...", true);
      try {
        const resp = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/approve.yml/dispatches`, {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + token,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ ref: "main", inputs: { run_id: runId || "latest" } })
        });
        if (resp.ok) {
          showStatus("✅ SUCCESS! Upload triggered! Video will appear on YouTube channel in ~60 seconds.", true);
        } else {
          showStatus("⚠️ GitHub API error: " + resp.status + ". Token may lack workflow permissions.", false);
        }
      } catch (err) {
        showStatus("⚠️ Request error: " + err.message, false);
      }
    }

    function rejectVideo() {
      if (confirm("Reject this video?")) {
        showStatus("❌ Video rejected. It will not be published.", false);
      }
    }
  </script>
</body>
</html>
"""

def build_site(run_id=""):
    PUBLIC.mkdir(parents=True, exist_ok=True)
    dirs = sorted(OUT.glob("*/meta.json"))
    if not dirs:
        print("No videos found in data/output/")
        return
    latest = dirs[-1].parent
    meta = json.loads((latest / "meta.json").read_text(encoding="utf-8")) if (latest / "meta.json").exists() else {}
    video_path = latest / "final.mp4"
    if video_path.exists():
        shutil.copy2(video_path, PUBLIC / "video.mp4")
        print(f"Copied {video_path} to {PUBLIC / 'video.mp4'} ({video_path.stat().st_size} bytes)")

    title = meta.get("title", "Daily MindSpark Shorts")
    desc = meta.get("description", "")
    tags_html = "".join(f'<span class="tag">#{t}</span>' for t in meta.get("tags", []))

    html = HTML_TEMPLATE.replace("__TITLE__", title)
    html = html.replace("__DESC__", desc)
    html = html.replace("__TAGS__", tags_html)
    html = html.replace("__RUN_ID__", str(run_id))

    (PUBLIC / "index.html").write_text(html, encoding="utf-8")
    print(f"Generated standalone mobile review site at {PUBLIC / 'index.html'}")

if __name__ == "__main__":
    run_id = sys.argv[1] if len(sys.argv) > 1 else ""
    build_site(run_id)

