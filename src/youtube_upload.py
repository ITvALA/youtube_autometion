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

    # Try local OAuth client first (from old project)
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
            return res.get("video_id", "uploaded")
        except Exception as e:
            print(f"Warning: Local OAuth upload failed ({e}), trying environment credentials...")

    # Fallback to CI / GitHub Actions environment variables
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    creds = Credentials(None, refresh_token=os.environ["YT_REFRESH_TOKEN"], token_uri="https://oauth2.googleapis.com/token",
                        client_id=os.environ["YT_CLIENT_ID"], client_secret=os.environ["YT_CLIENT_SECRET"],
                        scopes=["https://www.googleapis.com/auth/youtube.upload"])
    yt = build("youtube", "v3", credentials=creds)
    body = {"snippet": {"title": title, "description": description, "tags": tags, "categoryId": "27"},
            "status": {"privacyStatus": privacy, "selfDeclaredMadeForKids": False}}
    req = yt.videos().insert(part="snippet,status", body=body, media_body=MediaFileUpload(video_path, chunksize=1024*1024, resumable=True))
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
