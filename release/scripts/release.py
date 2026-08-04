#!/usr/bin/env python3
"""release.py — tag v0.1.0, zip artifact, create draft GitHub release.
Run from the repo root after CI passes. Requires git and gh (GitHub CLI) on PATH."""
import subprocess
import sys
import os
import zipfile
import pathlib

VERSION = "0.1.0"
TAG = f"v{VERSION}"
ZIP_NAME = f"space-invaders-{VERSION}.zip"
NOTES_PATH = pathlib.Path("release") / f"notes-{VERSION}.md"

RELEASE_NOTES = """## e2e Space Invaders 0.1.0

First public release. Open `index.html` from the downloaded ZIP directly in
Chrome or Firefox (no server needed). Three fully playable levels:

- Level 1: classic accelerating 11x5 invader grid
- Level 2: invader return fire, player respawn/blink, bonus UFO with tier scoring
- Level 3: destructible shield bunkers + formation split at 50% kills

See README.md inside the ZIP for manual verification steps.
"""

ARTIFACT_FILES = [
    "index.html",
    "game.js",
    "gameConfig.js",
    "input.js",
    "player.js",
    "invaders.js",
    "collision.js",
    "shields.js",
    "README.md",
]

def run(cmd, check=True):
    print(f"  >> {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(result.stderr)
        sys.exit(result.returncode)
    return result

def tag_exists(tag):
    r = run(["git", "tag", "-l", tag], check=False)
    return tag in r.stdout.strip().splitlines()

def main():
    print(f"[release.py] Releasing {TAG}")

    # 1. Tag
    if tag_exists(TAG):
        print(f"  Tag {TAG} already exists — skipping tag creation (idempotent).")
    else:
        run(["git", "tag", "-a", TAG, "-m", f"Release {VERSION} — e2e Space Invaders initial release"])
        run(["git", "push", "origin", TAG])
        print(f"  Tag {TAG} created and pushed.")

    # 2. Package artifact
    missing = [f for f in ARTIFACT_FILES if not pathlib.Path(f).exists()]
    if missing:
        print(f"  ERROR: missing source files: {missing}")
        sys.exit(1)
    with zipfile.ZipFile(ZIP_NAME, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in ARTIFACT_FILES:
            zf.write(f)
            print(f"  added {f}")
    print(f"  Artifact: {ZIP_NAME} ({os.path.getsize(ZIP_NAME)} bytes)")

    # 3. Write release notes
    NOTES_PATH.parent.mkdir(parents=True, exist_ok=True)
    NOTES_PATH.write_text(RELEASE_NOTES, encoding="utf-8")
    print(f"  Notes written to {NOTES_PATH}")

    # 4. Create draft GitHub release (idempotent: skip if already exists)
    r = run(["gh", "release", "view", TAG], check=False)
    if r.returncode == 0:
        print(f"  GitHub release {TAG} already exists — skipping creation.")
    else:
        run([
            "gh", "release", "create", TAG, ZIP_NAME,
            "--title", f"e2e Space Invaders {VERSION}",
            "--notes-file", str(NOTES_PATH),
            "--draft",
        ])
        print(f"  Draft release created: https://github.com/PawExperiences/BB.Project1/releases")

    print("[release.py] Done. Review the draft on GitHub, then publish manually.")

if __name__ == "__main__":
    main()
