#!/usr/bin/env python3
"""release.py — Tag v0.1.0, push to origin, and create the release ZIP.
Run once from the repository root before publishing the GitHub Release.
"""
import subprocess
import zipfile
import os
import sys

VERSION = "0.1.0"
TAG = f"v{VERSION}"
ZIP_DIR = "release"
ZIP_NAME = f"e2e-space-invaders-{VERSION}.zip"
SOURCE_FILES = [
    "index.html",
    "game.js",
    "gameConfig.js",
    "input.js",
    "player.js",
    "invaders.js",
    "collision.js",
    "level1.js",
    "level2.js",
    "README.md",
]

def run(cmd, **kwargs):
    print(f"  $ {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True, **kwargs)
    if result.returncode != 0:
        print(f"ERROR: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(result.returncode)
    if result.stdout.strip():
        print(f"  {result.stdout.strip()}")
    return result

def tag_exists(tag):
    result = subprocess.run(["git", "tag", "-l", tag], capture_output=True, text=True)
    return tag in result.stdout.strip().splitlines()

def main():
    print(f"[release.py] Releasing {TAG}")

    # Verify clean working tree
    status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
    if status.stdout.strip():
        print("WARNING: Working tree is not clean. Uncommitted changes detected.")
        print(status.stdout.strip())

    # Create annotated tag (idempotent)
    if tag_exists(TAG):
        print(f"  Tag {TAG} already exists locally — skipping tag creation.")
    else:
        run(["git", "tag", "-a", TAG, "-m", f"Release {TAG}: e2e Space Invaders initial release"])
        print(f"  Created annotated tag {TAG}")

    # Push tag to origin
    run(["git", "push", "origin", TAG])
    print(f"  Pushed {TAG} to origin")

    # Build release ZIP
    os.makedirs(ZIP_DIR, exist_ok=True)
    zip_path = os.path.join(ZIP_DIR, ZIP_NAME)
    missing = [f for f in SOURCE_FILES if not os.path.isfile(f)]
    if missing:
        print(f"ERROR: Missing source files: {missing}", file=sys.stderr)
        sys.exit(1)
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for fname in SOURCE_FILES:
            zf.write(fname)
            print(f"  Added {fname}")
    print(f"  Created artifact: {zip_path}")
    print("[release.py] Done. Attach the ZIP to the GitHub Release at:")
    print("  https://github.com/PawExperiences/BB.Project1/releases/new")

if __name__ == "__main__":
    main()
