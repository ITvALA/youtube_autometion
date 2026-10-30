# MINDSPARK studio (Remotion + Claude + GitHub Actions)

Har video ka look alag: palette, font, layout, pattern, transition, chart style, size (format),
scene order. `src/theme_engine.py` pichle videos yaad rakhta hai (`data/theme_history.json`).

## Local chalana
1. `cp .env.example .env` aur keys bharo (LLM_API_KEY, LLM_BASE_URL ...).
2. `pip install -r requirements.txt` ; `cd remotion && npm install && npx remotion browser ensure`
3. FFmpeg install hona chahiye (`ffmpeg -version`).
4. Remotion test (bina API ke): `cd remotion && npm run studio` ya `npm run demo`
5. Poora video: `python src/daily_pipeline.py`  (ek book: `--book "Deep Work"`)
6. Phone review: `python src/review_app/mobile_server.py` -> http://<pc-ip>:8080 (PASS / FAIL / EDIT)

## GitHub Actions (PC band ho tab bhi)
Settings > Secrets > Actions me daalo: LLM_API_KEY, LLM_BASE_URL, LLM_MODEL, LLM_API_STYLE
(`openai` ya `anthropic`), TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN.
- `Daily studio` roz 2 PM IST chalta hai, video Telegram pe aata hai (aur Artifacts me 7 din).
- PASS: Actions > "Approve and upload" > Run workflow > run_id daalo. Video YouTube pe **private** upload hota hai.
- FAIL: kuch mat karo. Us book ko dobara chahiye to `data/theme_history.json` se uski entry hatao.

## Settings
- `config/voice_config.json` : voice, pitch, rate, `allow_wide` (true = 16:9 bhi, Shorts nahi banega)
- `data/books.json` : kitaabon ki library
- Naya scene type: `remotion/src/Video.tsx` me component + `src/llm.py` me TYPES/NEED.
