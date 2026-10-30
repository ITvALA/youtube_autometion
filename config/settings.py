import os
from pathlib import Path
from dataclasses import dataclass, field
from dotenv import load_dotenv

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

@dataclass
class PathConfig:
    base_dir: Path = BASE_DIR
    config_dir: Path = BASE_DIR / "config"
    src_dir: Path = BASE_DIR / "src"
    data_dir: Path = BASE_DIR / "data"
    output_dir: Path = BASE_DIR / "data" / "output"

    def ensure_directories(self):
        for p in [self.config_dir, self.src_dir, self.data_dir, self.output_dir]:
            p.mkdir(parents=True, exist_ok=True)

@dataclass
class YouTubeSettings:
    client_secrets_file: str = os.getenv(
        "YOUTUBE_CLIENT_SECRETS_FILE", str(BASE_DIR / "config" / "client_secrets.json")
    )
    token_file: str = os.getenv(
        "YOUTUBE_TOKEN_FILE", str(BASE_DIR / "config" / "youtube_token.json")
    )
    default_privacy: str = os.getenv("DEFAULT_UPLOAD_PRIVACY", "private")
    scopes: list[str] = field(
        default_factory=lambda: [
            "https://www.googleapis.com/auth/youtube.upload",
            "https://www.googleapis.com/auth/youtube.readonly",
        ]
    )

@dataclass
class AppConfig:
    paths: PathConfig = field(default_factory=PathConfig)
    youtube: YouTubeSettings = field(default_factory=YouTubeSettings)

config = AppConfig()
config.paths.ensure_directories()
