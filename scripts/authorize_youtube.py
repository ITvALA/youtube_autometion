import os
import sys
import webbrowser
from pathlib import Path

# Enforce UTF-8 for Windows console
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config.settings import config
from google_auth_oauthlib.flow import InstalledAppFlow

def main():
    print("==========================================================")
    print("🎬 MINDSPARK YOUTUBE CHANNEL AUTHORIZATION")
    print("==========================================================")

    secrets_file = config.youtube.client_secrets_file
    token_file = config.youtube.token_file

    if not os.path.exists(secrets_file):
        print(f"\n❌ ERROR: {secrets_file} not found!")
        return

    print("Starting local authorization server on port 8080...")
    print("Your browser should open automatically in a few seconds.")
    print("If it does not open, click the URL that will be printed below.\n")

    try:
        flow = InstalledAppFlow.from_client_secrets_file(
            secrets_file,
            scopes=config.youtube.scopes
        )
        # Run local server to catch the redirect code
        creds = flow.run_local_server(port=8080, prompt="consent", open_browser=True)

        os.makedirs(os.path.dirname(token_file), exist_ok=True)
        with open(token_file, "w", encoding="utf-8") as f:
            f.write(creds.to_json())

        print("\n==========================================================")
        print("✅ SUCCESS! Your YouTube channel is now connected!")
        print(f"Token saved at: {token_file}")
        print("Now running .\\create_next_video.ps1 will upload videos to your channel!")
        print("==========================================================")

    except Exception as e:
        print(f"\n❌ Authorization failed: {e}")

if __name__ == "__main__":
    main()
