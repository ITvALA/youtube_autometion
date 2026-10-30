import pytest, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from src.youtube.youtube_client import youtube_uploader

def test_youtube_uploader_configured():
    assert youtube_uploader.is_configured() is True

def test_youtube_uploader_authorized():
    assert youtube_uploader.is_authorized() is True

def test_youtube_uploader_dry_run():
    res = youtube_uploader.upload_video(
        video_path="dummy.mp4",
        title="Test YouTube Upload",
        description="Testing clean YouTube upload pipeline",
        tags=["Test", "MindSpark"],
        privacy_status="private",
        dry_run=True
    )
    assert res["status"] == "dry_run_success"
    assert res["video_id"] == "DRY_RUN_MOCK_ID"
    assert "https://youtu.be/DRY_RUN_MOCK_ID" in res["video_url"]
    assert res["privacy"] == "private"

