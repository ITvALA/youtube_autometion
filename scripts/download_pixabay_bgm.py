"""Downloads motivational background tracks from Pixabay search into data/audio/bgm/"""
import os, sys, re, time
from pathlib import Path
from curl_cffi import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
BGM_DIR = ROOT / "data" / "audio" / "bgm"
BGM_DIR.mkdir(parents=True, exist_ok=True)

def download_pixabay_motivational(limit=12):
    search_url = "https://pixabay.com/music/search/background%20music%20motivational/"
    print(f"[Pixabay BGM] Fetching search page: {search_url}")
    r = requests.get(search_url, impersonate="chrome124", timeout=30)
    if r.status_code != 200:
        print(f"[Pixabay BGM] Failed to load search page: HTTP {r.status_code}")
        return []

    soup = BeautifulSoup(r.text, "html.parser")
    track_links = []
    seen = set()
    for a in soup.find_all("a", href=True):
        href = a['href']
        # Match track URLs e.g. /music/corporate-motivational-music-594875/
        if re.search(r'/music/[^/]+-\d+/?', href):
            clean_href = href.split("?")[0].rstrip("/")
            if clean_href not in seen:
                seen.add(clean_href)
                title = a.text.strip() or clean_href.split("/")[-1]
                track_links.append((clean_href, title))

    print(f"[Pixabay BGM] Found {len(track_links)} motivational tracks on page 1.")
    downloaded = []

    for i, (href, title) in enumerate(track_links[:limit]):
        full_url = f"https://pixabay.com{href}/" if href.startswith("/") else f"{href}/"
        try:
            print(f"[{i+1}/{min(limit, len(track_links))}] Inspecting: {title} ({full_url})")
            tr = requests.get(full_url, impersonate="chrome124", timeout=30)
            if tr.status_code != 200:
                print(f"  -> Error HTTP {tr.status_code}")
                continue

            # Extract CDN mp3 url
            mp3_match = re.search(r'https://cdn\.pixabay\.com/download/audio/[^\s"\'<>]+\.mp3[^\s"\'<>]*', tr.text)
            if not mp3_match:
                # Fallback to any cdn.pixabay audio mp3
                mp3_match = re.search(r'https://cdn\.pixabay\.com/[^\s"\'<>]+\.mp3[^\s"\'<>]*', tr.text)

            if mp3_match:
                mp3_url = mp3_match.group(0)
                # Clean filename
                slug = re.sub(r'[^a-zA-Z0-9_-]+', '_', href.strip("/").split("/")[-1])
                out_path = BGM_DIR / f"{slug}.mp3"
                if out_path.exists() and out_path.stat().st_size > 100000:
                    print(f"  -> Already exists ({out_path.stat().st_size // 1024} KB): {out_path.name}")
                    downloaded.append(out_path)
                    continue

                print(f"  -> Downloading MP3...")
                ar = requests.get(mp3_url, impersonate="chrome124", timeout=60)
                if ar.status_code == 200 and len(ar.content) > 50000:
                    with open(out_path, "wb") as f:
                        f.write(ar.content)
                    print(f"  -> Saved {out_path.name} ({len(ar.content) // 1024} KB)")
                    downloaded.append(out_path)
                else:
                    print(f"  -> Failed download: status={ar.status_code}, len={len(ar.content)}")
            else:
                print("  -> No MP3 link found on track page.")
            time.sleep(1)
        except Exception as e:
            print(f"  -> Exception: {e}")

    print(f"\n[Pixabay BGM] Completed! Total tracks available in {BGM_DIR}: {len(list(BGM_DIR.glob('*.mp3')))}")
    return downloaded

if __name__ == "__main__":
    download_pixabay_motivational()
