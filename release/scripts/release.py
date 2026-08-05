#!/usr/bin/env python3
"""release.py -- packages e2e Space Invaders 0.1.0 into a release zip.
Run from the repository root after tagging v0.1.0.
Idempotent: re-running overwrites the zip."""
import zipfile
import os
import sys

VERSION = "0.1.0"
PROJECT = "e2e-space-invaders"
OUT_DIR = os.path.join("release")
OUT_FILE = os.path.join(OUT_DIR, f"{PROJECT}-{VERSION}.zip")

FILES = [
    "index.html",
    "game.js",
    "gameConfig.js",
    "input.js",
    "player.js",
    "invaders.js",
    "collisions.js",
    "explosions.js",
    "level1.js",
    "level2.js",
    "level3.js",
    "boss.js",
    "README.md",
]

def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    missing = [f for f in FILES if not os.path.isfile(f)]
    if missing:
        print(f"ERROR: missing files: {missing}", file=sys.stderr)
        sys.exit(1)
    with zipfile.ZipFile(OUT_FILE, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in FILES:
            zf.write(f)
            print(f"  added: {f}")
    print(f"\nArtifact written: {OUT_FILE}")

if __name__ == "__main__":
    main()
