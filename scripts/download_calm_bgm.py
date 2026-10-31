import os, sys, re, time
from pathlib import Path
from curl_cffi import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
BGM_DIR = ROOT / "data" / "audio" / "bgm"
BGM_DIR.mkdir(parents=True, exist_ok=True)

def download_calm_tracks():
    queries = [
        "https://pixabay.com/music/search/calm%20motivational/",
        "https://pixabay.com/music/search/inspirational%20piano/"
    ]
    downloaded = []
    seen = set(p.stem for p in BGM_DIR.glob("*.mp3"))
    
    for q in queries:
        print(f"Scraping {q}...")
        try:
            r = requests.get(q, impersonate="chrome124", timeout=30)
            if r.status_code != 200:
                continue
            soup = BeautifulSoup(r.text, "html.parser")
            track_links = []
            for a in soup.find_all("a", href=True):
                href = a['href']
                if re.search(r'/music/[^/]+-\d+/?', href):
                    clean_href = href.split("?")[0].rstrip("/")
                    slug = re.sub(r'[^a-zA-Z0-9_-]+', '_', clean_href.strip("/").split("/")[-1])
                    if slug not in seen:
                        seen.add(slug)
                        track_links.append((clean_href, slug))
            
            print(f"Found {len(track_links)} new candidate tracks for {q}")
            for href, slug in track_links[:5]:
                full_url = f"https://pixabay.com{href}/" if href.startswith("/") else f"{href}/"
                tr = requests.get(full_url, impersonate="chrome124", timeout=30)
                if tr.status_code != 200:
                    continue
                mp3_match = re.search(r'https://cdn\.pixabay\.com/[^\s"\'<>]+\.mp3[^\s"\'<>]*', tr.text)
                if mp3_match:
                    mp3_url = mp3_match.group(0)
                    out_path = BGM_DIR / f"{slug}.mp3"
                    ar = requests.get(mp3_url, impersonate="chrome124", timeout=60)
                    if ar.status_code == 200 and len(ar.content) > 50000:
                        with open(out_path, "wb") as f:
                            f.write(ar.content)
                        print(f"Downloaded calm track: {out_path.name} ({len(ar.content)//1024} KB)")
                        downloaded.append(out_path)
                time.sleep(1)
        except Exception as e:
            print(f"Error scraping {q}: {e}")
            
    print(f"Done! Downloaded {len(downloaded)} calm tracks.")

if __name__ == "__main__":
    download_calm_tracks()

