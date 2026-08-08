#!/usr/bin/env python3
"""release.py — pre-flight check and artefact packager for e2e Space Invaders 0.1.0.
Verifies required files exist, then zips them into e2e-space-invaders-0.1.0.zip.
Run from the repository root before pushing the v0.1.0 tag."""
import os
import sys
import zipfile

VERSION = "0.1.0"
ARTIFACT = f"e2e-space-invaders-{VERSION}.zip"
REQUIRED = [
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
    "README.md",
]

def main():
    print(f"[release.py] e2e Space Invaders {VERSION} — pre-flight check")
    errors = []
    for f in REQUIRED:
        if os.path.isfile(f):
            print(f"  [OK] {f}")
        else:
            print(f"  [MISSING] {f}")
            errors.append(f)
    if errors:
        print(f"\nPre-flight FAILED. Missing files: {errors}")
        sys.exit(1)
    print(f"\n[release.py] All required files present. Creating {ARTIFACT} ...")
    with zipfile.ZipFile(ARTIFACT, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in REQUIRED:
            zf.write(f)
            print(f"  Added: {f}")
    size = os.path.getsize(ARTIFACT)
    print(f"\n[release.py] Artefact created: {ARTIFACT} ({size} bytes)")
    print("[release.py] Next step: push tag v0.1.0, then upload this zip to GitHub Releases.")

if __name__ == "__main__":
    main()
