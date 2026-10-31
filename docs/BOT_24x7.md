# Telegram Bot 24/7 — How It Works

## GitHub Actions Workaround

GitHub Actions jobs die after **6 hours**. The `bot.yml` workflow works around this:

1. Runs the bot for **5h50m** (`timeout 21000`)
2. Before the 6h limit, triggers a **new run of itself** (`gh workflow run bot.yml`)
3. A `concurrency` group (`telegram-bot`, `cancel-in-progress: false`) ensures only
   **one bot polls at a time** — Telegram returns 409 Conflict if two instances poll
   simultaneously. The bot handles 409 by sleeping 5s and retrying.
4. A `*/30 * * * *` cron acts as a **watchdog**: if the bot crashed and didn't
   restart itself, the cron picks it up within 30 minutes.

### Caveats

- **GitHub Actions minutes**: on a **private** repo, each bot session uses ~355 min.
  Running 24/7 ≈ 4.3 sessions/day × 355 ≈ **1,525 min/month** from the bot alone.
  Combined with hourly video runs, you **will exceed the 2,000 free minutes**.
  → Make the repo **public** (unlimited minutes) or use an alternative below.
- **Restart gap**: there is a brief gap (~1–3 min) between runs while the new job
  starts. Telegram buffers unread updates for 24h, so no messages are lost.

## Recommended Alternatives (Always-On)

For a truly 24/7 bot, use one of these:

### Option 1: Oracle Cloud Free VM (Always Free Tier)

```bash
# On the VM:
sudo apt update && sudo apt install -y python3-pip git
git clone https://github.com/<owner>/<repo>.git
cd <repo>
pip3 install -r requirements.txt
# Copy .env with secrets
sudo cp mindspark-bot.service /etc/systemd/system/
sudo systemctl enable --now mindspark-bot
```

### Option 2: Docker + Any VPS / Railway / Fly.io

**Dockerfile** (save as `Dockerfile.bot`):

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/ src/
COPY config/ config/
COPY data/ data/
COPY .env .env
CMD ["python", "src/telegram_bot.py"]
```

```bash
docker build -f Dockerfile.bot -t mindspark-bot .
docker run -d --restart=always --name mindspark-bot mindspark-bot
```

### Option 3: systemd Service (Own PC / Linux Server)

Save as `/etc/systemd/system/mindspark-bot.service`:

```ini
[Unit]
Description=MindSpark Telegram Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/mindspark
EnvironmentFile=/home/ubuntu/mindspark/.env
ExecStart=/usr/bin/python3 src/telegram_bot.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mindspark-bot
sudo journalctl -u mindspark-bot -f   # watch logs
```
