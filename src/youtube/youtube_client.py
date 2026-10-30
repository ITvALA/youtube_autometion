import os
import json
import logging
from typing import Dict, Any, Optional
from pathlib import Path
from config.settings import config

logger = logging.getLogger("YouTubeUploader")

class YouTubeUploader:
    def __init__(self):
        self.client_secrets_file = config.youtube.client_secrets_file
        self.token_file = config.youtube.token_file
        self.scopes = config.youtube.scopes

    def is_configured(self) -> bool:
        """
        Returns True if client_secrets.json exists.
        """
        return os.path.exists(self.client_secrets_file)

    def is_authorized(self) -> bool:
        """
        Returns True if an authorized user token exists and is valid.
        """
        if not os.path.exists(self.token_file):
            return False
        try:
            from google.oauth2.credentials import Credentials
            from google.auth.transport.requests import Request
            creds = Credentials.from_authorized_user_file(self.token_file, self.scopes)
            if creds and creds.valid:
                return True
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
                with open(self.token_file, "w", encoding="utf-8") as f:
                    f.write(creds.to_json())
                return True
            return False
        except Exception:
            return False

    def get_auth_url(self) -> Optional[str]:
        """
        Generates OAuth 2.0 authorization URL for the user to authorize their channel.
        """
        if not self.is_configured():
            return None
        try:
            from google_auth_oauthlib.flow import Flow
            flow = Flow.from_client_secrets_file(
                self.client_secrets_file,
                scopes=self.scopes,
                redirect_uri="urn:ietf:wg:oauth:2.0:oob"
            )
            auth_url, _ = flow.authorization_url(prompt="consent", access_type="offline")
            return auth_url
        except Exception as e:
            logger.error(f"Error creating auth URL: {e}")
            return None

    def finish_auth_with_code(self, code: str) -> bool:
        """
        Exchanges the authorization code for access and refresh tokens and stores them securely.
        """
        if not self.is_configured():
            return False
        try:
            from google_auth_oauthlib.flow import Flow
            flow = Flow.from_client_secrets_file(
                self.client_secrets_file,
                scopes=self.scopes,
                redirect_uri="urn:ietf:wg:oauth:2.0:oob"
            )
            flow.fetch_token(code=code.strip())
            creds = flow.credentials

            os.makedirs(os.path.dirname(self.token_file), exist_ok=True)
            with open(self.token_file, "w", encoding="utf-8") as f:
                f.write(creds.to_json())
            return True
        except Exception as e:
            logger.error(f"Failed to exchange code: {e}")
            return False

    def upload_video(
        self,
        video_path: str,
        title: str,
        description: str,
        tags: Optional[list] = None,
        privacy_status: str = "private",
        thumbnail_path: Optional[str] = None,
        dry_run: bool = False,
        progress_callback: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Uploads an MP4 video to YouTube Data API v3.
        Defaults strictly to 'private'.
        """
        if dry_run:
            return {
                "status": "dry_run_success",
                "video_id": "DRY_RUN_MOCK_ID",
                "video_url": "https://youtu.be/DRY_RUN_MOCK_ID",
                "privacy": privacy_status,
                "message": "Dry run upload simulated successfully without hitting API quota."
            }

        if not self.is_authorized():
            return {
                "status": "not_authorized",
                "error": "YouTube OAuth credentials not found or expired. Please authorize channel in Settings."
            }

        try:
            from google.oauth2.credentials import Credentials
            from google.auth.transport.requests import Request
            from googleapiclient.discovery import build
            from googleapiclient.http import MediaFileUpload

            creds = Credentials.from_authorized_user_file(self.token_file, self.scopes)
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
                with open(self.token_file, "w", encoding="utf-8") as f:
                    f.write(creds.to_json())

            youtube = build("youtube", "v3", credentials=creds)

            body = {
                "snippet": {
                    "title": title[:100],
                    "description": description[:5000],
                    "tags": tags or ["Hindi explainer", "MindSpark"],
                    "categoryId": "27",  # Education category
                    "defaultLanguage": "hi",
                    "defaultAudioLanguage": "hi"
                },
                "status": {
                    "privacyStatus": privacy_status if privacy_status in ["private", "unlisted", "public"] else "private",
                    "selfDeclaredMadeForKids": False
                }
            }

            media = MediaFileUpload(
                video_path,
                mimetype="video/mp4",
                resumable=True,
                chunksize=1024 * 1024 * 1  # 1MB chunks for smooth live progress
            )

            request = youtube.videos().insert(
                part="snippet,status",
                body=body,
                media_body=media
            )

            response = None
            while response is None:
                status, response = request.next_chunk()
                if status:
                    pct = int(status.progress() * 100)
                    logger.info(f"Uploaded {pct}%")
                    if progress_callback:
                        try:
                            progress_callback(pct)
                        except Exception:
                            pass

            video_id = response.get("id")
            video_url = f"https://youtu.be/{video_id}"

            # Try uploading custom thumbnail if provided
            if thumbnail_path and os.path.exists(thumbnail_path):
                try:
                    youtube.thumbnails().set(
                        videoId=video_id,
                        media_body=MediaFileUpload(thumbnail_path, mimetype="image/jpeg")
                    ).execute()
                    logger.info(f"Custom thumbnail uploaded for video {video_id}")
                except Exception as te:
                    logger.warning(f"Note: Custom thumbnail upload skipped or requires channel verification: {te}")

            return {
                "status": "success",
                "video_id": video_id,
                "video_url": video_url,
                "privacy": privacy_status
            }
        except Exception as e:
            logger.error(f"Upload failed: {e}")
            return {
                "status": "error",
                "error": str(e)
            }

youtube_uploader = YouTubeUploader()
