#!/usr/bin/env python3
"""release.py — packages shippable source files into a versioned zip artifact.
Run after `git tag v0.1.0` and a green CI build, before uploading to GitHub Releases.
"""
import zipfile
import os
import sys

VERSION = "0.1.0"
OUT_DIR = "dist"
OUT_FILE = os.path.join(OUT_DIR, f"e2e-space-invaders-v{VERSION}.zip")

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
    "main.js",
    "style.css",
    "README.md",
]

def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    os.chdir(repo_root)
    os.makedirs(OUT_DIR, exist_ok=True)

    missing = [f for f in FILES if not os.path.isfile(f)]
    if missing:
        print(f"ERROR: missing files: {missing}", file=sys.stderr)
        sys.exit(1)

    with zipfile.ZipFile(OUT_FILE, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in FILES:
            zf.write(f)
            print(f"  + {f}")

    print(f"\nArtifact written: {OUT_FILE}")

if __name__ == "__main__":
    main()
