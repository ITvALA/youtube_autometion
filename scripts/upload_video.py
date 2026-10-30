import os
import sys
import argparse
import logging
from pathlib import Path

# Enforce UTF-8 for Windows console
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if sys.stderr and sys.stderr.encoding and sys.stderr.encoding.lower() != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.youtube.youtube_client import youtube_uploader

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("YouTubeUploadCLI")

def main():
    parser = argparse.ArgumentParser(description="Upload any video to YouTube via YouTube Data API v3")
    parser.add_argument("--file", "-f", type=str, help="Path to the video file (.mp4)")
    parser.add_argument("--title", "-t", type=str, default="", help="Title of the video")
    parser.add_argument("--description", "-d", type=str, default="", help="Description of the video")
    parser.add_argument("--tags", type=str, default="", help="Comma-separated tags (e.g. 'Shorts,Motivation,MindSpark')")
    parser.add_argument("--privacy", "-p", type=str, choices=["private", "unlisted", "public"], default="private", help="Privacy status (default: private)")
    parser.add_argument("--thumbnail", type=str, default=None, help="Path to custom thumbnail (.jpg or .png)")
    parser.add_argument("--dry-run", action="store_true", help="Simulate upload without hitting YouTube API")
    args = parser.parse_args()

    print("=" * 60)
    print("▶️ YOUTUBE VIDEO UPLOADER")
    print("=" * 60)

    # Check OAuth authorization
    if not youtube_uploader.is_configured():
        print("❌ Error: config/client_secrets.json not found.")
        print("Please place your Google Cloud OAuth client_secrets.json in the config/ folder.")
        sys.exit(1)

    if not youtube_uploader.is_authorized():
        print("⚠️ YouTube account is not authorized yet.")
        print("Run: .\\connect_youtube.ps1 (or python scripts/authorize_youtube.py)")
        sys.exit(1)

    # Interactive prompt if video path not passed via arguments
    video_path = args.file
    if not video_path:
        video_path = input("Enter path to video file (.mp4): ").strip().strip('"')

    if not os.path.exists(video_path):
        print(f"❌ Error: Video file not found at: {video_path}")
        sys.exit(1)

    title = args.title.strip()
    if not title:
        default_title = Path(video_path).stem.replace("_", " ").title()
        title_input = input(f"Enter video title [Default: '{default_title}']: ").strip()
        title = title_input if title_input else default_title

    description = args.description.strip()
    if not description:
        description = f"{title}\n\nUploaded via YouTube Automation."

    tags_list = [t.strip() for t in args.tags.split(",") if t.strip()]
    if not tags_list:
        tags_list = ["Shorts", "YouTube", "Video"]

    privacy = args.privacy

    print("\n📋 Upload Details:")
    print(f"   📁 File:        {video_path}")
    print(f"   📝 Title:       {title}")
    print(f"   📄 Description: {description[:60]}...")
    print(f"   🏷️ Tags:        {tags_list}")
    print(f"   🔒 Privacy:     {privacy}")
    print(f"   🖼️ Thumbnail:   {args.thumbnail or 'None'}")
    print(f"   🧪 Dry Run:     {args.dry_run}")
    print("-" * 60)

    print("🚀 Starting upload to YouTube...")
    res = youtube_uploader.upload_video(
        video_path=video_path,
        title=title,
        description=description,
        tags=tags_list,
        privacy_status=privacy,
        thumbnail_path=args.thumbnail,
        dry_run=args.dry_run
    )

    print("=" * 60)
    if res.get("status") in ["success", "dry_run_success"]:
        print("✅ UPLOAD SUCCESSFUL!")
        print(f"   🎥 Video ID:   {res.get('video_id')}")
        print(f"   🔗 Video URL:  {res.get('video_url')}")
        print(f"   🔒 Privacy:    {res.get('privacy')}")
    else:
        print("❌ UPLOAD FAILED!")
        print(f"   Error: {res.get('error')}")
    print("=" * 60)

if __name__ == "__main__":
    main()

