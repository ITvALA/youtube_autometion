"""PASS = upload to YouTube, save book in completed_books.md, delete leftovers."""
import os, sys, shutil, pathlib, datetime
from common import ROOT, load_env, jload

def append_completed_book(title, author="", category="Self Improvement", video_url=""):
    cp = ROOT / "completed_books.md"
    content = cp.read_text(encoding="utf-8") if cp.exists() else ""
    lines = [line for line in content.splitlines() if line.strip().startswith("|") and not line.strip().startswith("| No.") and not line.strip().startswith("| :---")]
    next_no = len(lines) + 1
    today_str = datetime.date.today().isoformat()
    new_row = f"| {next_no} | {today_str} | {title} | {author or 'Unknown'} | {category} | {video_url or 'Archived'} |\n"
    with open(cp, "a", encoding="utf-8") as f:
        f.write(new_row)

def upload(d, dry_run=False, progress_callback=None):
    d = pathlib.Path(d)
    meta = jload(d / "meta.json", {})
    video_path = str(d / "final.mp4")
    title = meta.get("title", f"{d.name} Summary #MindSpark")[:100]
    description = meta.get("description", "")
    tags = meta.get("tags", ["Shorts", "MindSpark", "Books"])
    privacy = os.environ.get("YOUTUBE_PRIVACY", "public")

    # If dry_run is set via flag or env var
    if dry_run or os.environ.get("DRY_RUN", "").lower() in ("1", "true"):
        print(f"[DRY RUN] Simulating upload for '{title}' (privacy: {privacy})")
        if progress_callback:
            progress_callback(100)
        return "dry_run_video_id"

    # 1. Try local OAuth client first
    token_file = ROOT / "config" / "youtube_token.json"
    secrets_file = ROOT / "config" / "client_secrets.json"
    if token_file.exists() and secrets_file.exists():
        try:
            sys.path.insert(0, str(ROOT))
            from src.youtube.youtube_client import youtube_uploader
            res = youtube_uploader.upload_video(
                video_path=video_path,
                title=title,
                description=description,
                tags=tags,
                privacy_status=privacy,
                dry_run=False,
                progress_callback=progress_callback
            )
            vid = res.get("video_id")
            if res.get("status") == "success" and vid and vid != "uploaded":
                return vid
            err_msg = res.get("error", str(res))
            print(f"Warning: Local OAuth upload returned non-success ({err_msg}), falling back to direct token refresh...")
        except Exception as e:
            print(f"Warning: Local OAuth upload failed ({e}), trying direct refresh credentials...")

    # 2. Fallback to direct token refresh (works in CI and local)
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload

    # Load client id & secret from env, or secrets_file if present
    client_id = os.environ.get("YT_CLIENT_ID")
    client_secret = os.environ.get("YT_CLIENT_SECRET")
    if (not client_id or not client_secret) and secrets_file.exists():
        sec_data = jload(secrets_file, {})
        installed = sec_data.get("installed") or sec_data.get("web") or {}
        client_id = client_id or installed.get("client_id")
        client_secret = client_secret or installed.get("client_secret")

    refresh_token = os.environ.get("YT_REFRESH_TOKEN")
    if not refresh_token and token_file.exists():
        token_data = jload(token_file, {})
        refresh_token = token_data.get("refresh_token")

    if not client_id or not client_secret:
        raise RuntimeError("Missing YT_CLIENT_ID or YT_CLIENT_SECRET in GitHub Secrets / environment")
    if not refresh_token:
        raise RuntimeError("Missing YT_REFRESH_TOKEN in GitHub Secrets / environment")

    creds = Credentials(
        None,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=client_id,
        client_secret=client_secret,
        scopes=["https://www.googleapis.com/auth/youtube.upload"]
    )
    yt = build("youtube", "v3", credentials=creds)
    body = {
        "snippet": {
            "title": title[:100],
            "description": description[:5000],
            "tags": tags,
            "categoryId": "27",
            "defaultLanguage": "hi",
            "defaultAudioLanguage": "hi"
        },
        "status": {
            "privacyStatus": privacy if privacy in ["private", "unlisted", "public"] else "public",
            "selfDeclaredMadeForKids": False
        }
    }
    req = yt.videos().insert(
        part="snippet,status",
        body=body,
        media_body=MediaFileUpload(video_path, chunksize=1024*1024, resumable=True)
    )
    resp = None
    while resp is None:
        status, resp = req.next_chunk()
        if status and progress_callback:
            try:
                progress_callback(int(status.progress() * 100))
            except Exception:
                pass
    return resp["id"]

def approve(d, dry_run=False):
    d = pathlib.Path(d)
    meta = jload(d / "meta.json", {})
    vid = upload(d, dry_run=dry_run)
    book_title = meta.get("book", d.name)
    video_url = f"https://youtu.be/{vid}" if vid and vid != "dry_run_video_id" else "Archived"
    append_completed_book(book_title, meta.get("author", ""), "Productivity & Wisdom", video_url)
    shutil.rmtree(d, ignore_errors=True)
    return vid

if __name__ == "__main__":
    load_env()
    for p in sys.argv[1:]:
        print(p, "->", approve(p))
