#!/usr/bin/env python3
"""release.py — tag v0.1.0, push, and zip the distributable artifact.
Run from the repository root. Idempotent: skips tag creation if already exists."""
import subprocess
import zipfile
import os
import sys

VERSION = "v0.1.0"
ZIP_NAME = f"e2e-space-invaders-{VERSION}.zip"
FILES = [
    "index.html",
    "game.js",
    "gameConfig.js",
    "input.js",
    "player.js",
    "invaders.js",
    "collision.js",
    "level1.js",
    "level2.js",
    "level3.js",
    "boss.js",
    os.path.join("shared", "invaders.js"),
    "README.md",
]

def run(cmd, check=True):
    print(f"  $ {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.stdout.strip():
        print(result.stdout.strip())
    if result.returncode != 0:
        print(result.stderr.strip(), file=sys.stderr)
        if check:
            sys.exit(result.returncode)
    return result

print(f"[release] Checking for existing tag {VERSION}...")
existing = run(["git", "tag", "-l", VERSION], check=False)
if VERSION in existing.stdout.split():
    print(f"[release] Tag {VERSION} already exists — skipping tag creation.")
else:
    print(f"[release] Creating annotated tag {VERSION}...")
    run(["git", "tag", "-a", VERSION, "-m", f"Release {VERSION} — e2e Space Invaders initial release"])
    print(f"[release] Pushing tag {VERSION} to origin...")
    run(["git", "push", "origin", VERSION])

print(f"[release] Packaging artifact {ZIP_NAME}...")
missing = [f for f in FILES if not os.path.exists(f)]
if missing:
    print(f"[release] WARNING: the following files are missing and will be skipped: {missing}")

with zipfile.ZipFile(ZIP_NAME, "w", zipfile.ZIP_DEFLATED) as zf:
    for f in FILES:
        if os.path.exists(f):
            zf.write(f)
            print(f"  added {f}")
        else:
            print(f"  SKIP (not found): {f}")

print(f"[release] Artifact written: {ZIP_NAME}")
print("[release] Done. Upload the zip to the GitHub Release page manually.")
