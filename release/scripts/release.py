#!/usr/bin/env python3
"""release.py — Creates a GitHub Release for e2e space invaders 0.1.0 and uploads the artifact.
Run AFTER pushing the v0.1.0 tag. Requires env var GITHUB_TOKEN with repo write scope."""
import os
import sys
import json
import zipfile
import urllib.request
import urllib.error

REPO = "PawExperiences/BB.Project1"
TAG = "v0.1.0"
RELEASE_NAME = "e2e space invaders 0.1.0"
ARTIFACT_NAME = "e2e-space-invaders-0.1.0.zip"
SOURCE_FILES = [
    "index.html", "main.js", "style.css", "game.js", "gameConfig.js",
    "input.js", "player.js", "invaders.js", "collision.js",
    "level1.js", "level2.js", "level3.js", "boss.js", "README.md"
]
RELEASE_BODY = """## e2e space invaders 0.1.0

First playable release. Open `index.html` in any modern browser from the filesystem (no server needed) and press Enter to play.

See the full changelog and runbook for details.
"""

def api(method, path, data=None, content_type="application/json"):
    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("ERROR: GITHUB_TOKEN not set", file=sys.stderr)
        sys.exit(1)
    url = f"https://api.github.com{path}"
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    if body:
        req.add_header("Content-Type", content_type)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()}", file=sys.stderr)
        sys.exit(1)

def upload_asset(upload_url, path, name):
    token = os.environ.get("GITHUB_TOKEN")
    base_url = upload_url.split("{")[0]
    url = f"{base_url}?name={name}"
    with open(path, "rb") as f:
        data = f.read()
    req = urllib.request.Request(url, data=data, method="POST")
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Content-Type", "application/zip")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"Upload HTTP {e.code}: {e.read().decode()}", file=sys.stderr)
        sys.exit(1)

def main():
    # Check existing release
    print(f"Checking for existing release {TAG}...")
    try:
        existing = api("GET", f"/repos/{REPO}/releases/tags/{TAG}")
        print(f"Release already exists (id={existing['id']}). Skipping creation.")
        release = existing
    except SystemExit:
        print(f"Creating release {TAG}...")
        release = api("POST", f"/repos/{REPO}/releases", {
            "tag_name": TAG,
            "name": RELEASE_NAME,
            "body": RELEASE_BODY,
            "draft": False,
            "prerelease": False
        })
        print(f"Release created: {release['html_url']}")

    # Build artifact zip
    repo_root = os.path.join(os.path.dirname(__file__), "..", "..")
    zip_path = os.path.join(os.path.dirname(__file__), ARTIFACT_NAME)
    print(f"Building artifact {ARTIFACT_NAME}...")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for fname in SOURCE_FILES:
            fpath = os.path.join(repo_root, fname)
            if os.path.exists(fpath):
                zf.write(fpath, fname)
                print(f"  added {fname}")
            else:
                print(f"  WARNING: {fname} not found, skipping")

    # Upload artifact
    print(f"Uploading {ARTIFACT_NAME}...")
    result = upload_asset(release["upload_url"], zip_path, ARTIFACT_NAME)
    print(f"Asset uploaded: {result.get('browser_download_url', 'uploaded')}")
    print("Done.")

if __name__ == "__main__":
    main()
