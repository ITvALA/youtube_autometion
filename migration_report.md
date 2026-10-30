# 🚀 MindSpark Studio Migration Report

## 1. Executive Summary
The migration from the old project (`D:\youtube_automation`) to the new unified target project (`D:\mindspark`) is complete. All useful components, voice configurations, background music, authorized YouTube credentials, and mobile review capabilities from the old project have been merged with MindSpark's dynamic Remotion theme engine, variety rules, and Claude-powered script planner.

The combined project is tested and verified on Windows with 3 distinct end-to-end video generations.

---

## 2. Inventory of Changes

### What was Copied (Old Wins)
1. **`.env`**: Copied as-is to preserve all active API keys, Claude model/relay endpoints, and YouTube tokens. Mapped `ANTHROPIC_*` keys to `LLM_*` keys with `LLM_API_STYLE=openai`.
2. **`config/voice_config.json`**: Restored full voice configuration for **Voice 5 (Prabhat Neural, pitch -2Hz, rate +0%, locked)** with both old and new schema fields (`selected_voice_id`, `selected_voice_name`, `voice_model`, `voice`, `allow_wide`).
3. **`config/client_secrets.json` & `config/youtube_token.json`**: Restored local Google OAuth 2.0 app credentials and active channel refresh token for direct channel uploads.
4. **`completed_books.md`**: Restored complete markdown archive containing *Chanakya Neeti* so previously produced books are never repeated.
5. **`data/audio/bgm/ambient_lofi_pad.mp3`**: Restored studio background music (821 KB) used for automatic audio mixing ducked at -16 dB.
6. **`data/output/voices/`**: Restored voice audition clips (Madhur, Swara, Prabhat, Neerja) for the mobile review server's audio player.
7. **`data/output/samples/`**: Restored test samples and proof JSON files.
8. **`src/youtube/` & `scripts/`**: Copied YouTube Data API v3 upload engine, browser OAuth authorization scripts (`authorize_youtube.py`), and helper CLI tools.
9. **`connect_youtube.ps1` & `upload_video.ps1`**: Copied PowerShell shortcuts for channel connection and video publishing.
10. **`tests/test_youtube_upload.py`**: Copied test suite verifying configuration, authorization status, and dry-run execution.

### What was Replaced
1. **`.gitignore`**: Replaced to ensure secrets (`.env`, `config/client_secrets.json`, `config/youtube_token.json`, `*.mp4`, `node_modules/`, `data/work/`, `.venv/`) are strictly protected from source control.
2. **`requirements.txt`**: Combined modern dependencies from both projects (`edge-tts`, `requests`, `google-api-python-client`, `google-auth`, `google-auth-oauthlib`, `google-auth-httplib2`, `python-dotenv`, `pytest`).
3. **`src/review_app/mobile_server.py`**: Upgraded the basic review server to the complete 750+ line mobile PWA review application featuring dark mode UI, live video streaming, voice selector, BGM preview, and PASS / FAIL / EDIT buttons with local network IP detection for mobile phones.

### What was Skipped
1. **`xmrig-6.26.0-windows-x64.zip`**: External archive unrelated to video production.
2. **`remotion_explainer/node_modules` & `.venv`**: Generated environment folders (cleanly re-installed in MindSpark).
3. **Large intermediate video builds**: Intermediate raw test clips were omitted to keep the workspace clean.

---

## 3. Files Edited & Purpose

| File | Modification & Reason |
| :--- | :--- |
| **`src/common.py`** | Added fallback environment variable mappings so `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`, and `ANTHROPIC_MODEL` automatically populate `LLM_API_KEY`, `LLM_BASE_URL`, and `LLM_MODEL`, setting `LLM_API_STYLE = "openai"`. |
| **`src/tts.py`** | Updated `_synth` to support both `cfg["voice"]` and `cfg["voice_model"]` so both voice configuration formats function interchangeably. |
| **`src/audio.py`** | Updated `mix()` to detect `data/audio/bgm/ambient_lofi_pad.mp3` and automatically mix it under the speech track at `-16 dB` with volume ducking and fade in/out, falling back to synthetic pad only if missing. |
| **`src/daily_pipeline.py`** | Fixed Windows command resolution (`npx.cmd` vs `npx`) and converted file paths to POSIX strings for `--props` arguments to prevent backslash parsing errors in Node.js. |
| **`src/youtube_upload.py`** | Unified upload logic to support both local OAuth credentials (`config/youtube_token.json`) and CI environment variables (`YT_REFRESH_TOKEN`), added markdown table logging to `completed_books.md`, and added dry-run safety. |
| **`tests/test_youtube_upload.py`** | Added root directory path resolution for pytest execution. |

---

## 4. Verification & Diversity Proof

Three consecutive videos were produced from different books. The MindSpark theme engine and history tracker (`data/theme_history.json`) ensured each video received completely distinct palettes, transitions, layouts, and sizes:

| Book | Palette | Accent Color | Transition | Layout | Pattern | Format Size |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Deep Work** | Mint Paper | `#E4572E` | `slide` | `left` | `dots` | **Portrait** (1080x1350) |
| **Atomic Habits** | Graphite | `#FF6B6B` | `flip` | `center` | `grid` | **Vertical** (1080x1920) |
| **The Psychology of Money** | Neon Night | `#00F5A0` | `zoom` | `left` | `rays` | **Square** (1080x1080) |

- **Remotion Demo**: Verified (`remotion/out/demo.mp4`, 1.6 MB).
- **YouTube Test Suite**: 3/3 tests passed (`pytest tests/test_youtube_upload.py`).

---

## 5. Daily Production Commands

### Generate Daily Video
```powershell
# Pick an unread book automatically from library:
python src/daily_pipeline.py

# Or force a specific book:
python src/daily_pipeline.py --book "Deep Work"
```

### Start Mobile Review App
```powershell
python src/review_app/mobile_server.py
```
- Open on your PC: `http://localhost:8080`
- Open on your Phone (same Wi-Fi): `http://10.60.86.83:8080`

### Review Actions in Mobile App:
- **PASS**: Uploads to YouTube as private (or selected privacy), records book in `completed_books.md`, and cleans up temp files.
- **FAIL**: Discards and deletes the pending video.
- **EDIT**: Lets you adjust the YouTube title, description, and privacy directly before approving.

---

---

## 7. 2D Anime & Motion Comic (2.5D Parallax) Engine Upgrade

In response to the user's requirement for viral 2D Animation, Japanese Anime style, and Motion Comic (2.5D Parallax) video formats, the following components and pipeline features were built and verified:

### New Components (`remotion/src/components/anime/`):
1. **`AnimeCharacter.tsx`**:
   - Scalable 2D vector anime character with dynamic expressions (`focus`, `thinking`, `triumph`, `warning`).
   - Natural idle breathing via spring-based sine wave oscillation (`scaleY`).
   - Eye blinking system cycling every 80 frames.
   - Dynamic energy aura glow reacting to the current scene's theme accent color.
2. **`AnimeSpeedLines.tsx`**:
   - Procedural radial action speed lines with per-frame pseudo-random jitter for high-octane anime emphasis.
3. **`AnimeFloatingParticles.tsx`**:
   - Ambient floating bokeh/ember particle field drifting upwards with sinusoidal sway for multi-layer depth.
4. **`MangaPanels.tsx`**:
   - Split comic strip layout with manga screentone texture overlay, dynamic border glow, and comic badge spring tags.
5. **New Scene Types Registered in `SCENES` (`remotion/src/Video.tsx` & `src/llm.py`)**:
   - **`animeParallax`**: Multi-layer 2.5D parallax push-in where the background drifts, action speed lines fire, ambient particles float, and the anime character pans across with idle breathing.
   - **`motionComic`**: Split manga panels comparing "Problem vs Breakthrough" with reaction badges and side character animations.

### Verification:
- **Test Render**: `remotion/out/demo_anime.mp4` (7.8 MB, 735 frames, 1080x1920 vertical) rendered with zero errors.
- **Unit Test Suite**: 6/6 tests passing (`pytest tests/ -v`).
- **Backup Archive**: Verified baseline preserved at `d:\mindspark_backup_working_baseline.zip` and git tag/commits.


