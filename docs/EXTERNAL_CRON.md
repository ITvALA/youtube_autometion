# External Cron Trigger for Reliable Hourly Videos

GitHub Actions `schedule` triggers are "best effort" — under load they can be delayed
15–45 minutes or even skipped entirely. To guarantee hourly video production, set up
an external trigger that calls the GitHub API.

## Setup via cron-job.org (Free)

1. **Create a Fine-Grained PAT** in GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens:
   - Repository: `<owner>/<repo>`
   - Permissions: **Actions → Read and write**
   - Copy the token.

2. **Register at [cron-job.org](https://cron-job.org)** (free tier, no credit card).

3. **Create a new cron job:**
   - **URL:**
     ```
     https://api.github.com/repos/<owner>/<repo>/actions/workflows/daily.yml/dispatches
     ```
   - **Schedule:** Every 1 hour (e.g. `0 * * * *`)
   - **Request method:** POST
   - **Headers:**
     ```
     Authorization: Bearer <YOUR_FINE_GRAINED_PAT>
     Accept: application/vnd.github+json
     ```
   - **Request body:**
     ```json
     {"ref": "main"}
     ```

4. **Save.** The cron job will trigger `workflow_dispatch` every hour.

## How the Guard Works

The `daily.yml` workflow has a built-in guard: if `data/pending_video.json` shows a
video was created less than 45 minutes ago, the run exits early (exit 0). This means
even if both the GitHub cron _and_ the external cron fire within the same hour, only
one video is produced.

## Keeping the Repo Active

GitHub disables scheduled workflows on public repos after 60 days of inactivity.
The daily commit of `data/*_history.json` files keeps the repo active automatically.
If you stop producing videos, make any commit within 60 days to prevent disabling.

## Rate Limits

- GitHub REST API: 5,000 requests/hour with a PAT. One dispatch call per hour is negligible.
- cron-job.org free tier: up to 1 job/minute, 60 jobs total — more than enough.
