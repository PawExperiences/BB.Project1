#!/usr/bin/env python3
"""Release script for e2e space invaders v0.1.0.
Creates annotated tag, zips source files, pushes tag to origin.
Run from the repository root with a clean working tree."""
import subprocess
import zipfile
import os
import sys

VERSION = "0.1.0"
TAG = f"v{VERSION}"
ZIP_NAME = f"e2e-space-invaders-{VERSION}.zip"
SOURCE_FILES = [
    "index.html",
    "gameConfig.js",
    "game.js",
    "input.js",
    "player.js",
    "invaders.js",
    "collision.js",
    "README.md",
]

def run(cmd, **kwargs):
    print(f"  >> {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True, **kwargs)
    if result.returncode != 0:
        print(f"ERROR: {result.stderr.strip()}")
        sys.exit(1)
    if result.stdout.strip():
        print(f"     {result.stdout.strip()}")
    return result

def main():
    print("[release] Checking working tree is clean...")
    status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
    if status.stdout.strip():
        print("ERROR: Working tree is not clean. Commit or stash changes first.")
        sys.exit(1)

    print("[release] Verifying source files exist...")
    missing = [f for f in SOURCE_FILES if not os.path.isfile(f)]
    if missing:
        print(f"ERROR: Missing files: {missing}")
        sys.exit(1)
    print(f"  All {len(SOURCE_FILES)} source files present.")

    print(f"[release] Creating zip artifact: {ZIP_NAME}")
    with zipfile.ZipFile(ZIP_NAME, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in SOURCE_FILES:
            zf.write(f)
            print(f"  added: {f}")
    print(f"  Created: {ZIP_NAME} ({os.path.getsize(ZIP_NAME)} bytes)")

    print(f"[release] Checking if tag {TAG} already exists...")
    existing = subprocess.run(["git", "tag", "-l", TAG], capture_output=True, text=True)
    if existing.stdout.strip() == TAG:
        print(f"  Tag {TAG} already exists locally — skipping tag creation.")
    else:
        print(f"[release] Creating annotated tag {TAG}...")
        run(["git", "tag", "-a", TAG, "-m",
             f"Release {TAG} — Game loop and canvas framework"])

    print(f"[release] Pushing tag {TAG} to origin...")
    run(["git", "push", "origin", TAG])

    print(f"\n[release] Done. Tag {TAG} pushed. Upload {ZIP_NAME} to the GitHub Release page manually.")

if __name__ == "__main__":
    main()
