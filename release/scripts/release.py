#!/usr/bin/env python3
"""release.py — verify static files, tag the release, and package the artifact.

Run from the repository root after smoke-test sign-off.
Usage: python3 release/scripts/release.py [--check-only]
"""
import os
import sys
import subprocess
import zipfile
import datetime

VERSION = "0.1.0"
TAG = f"v{VERSION}"
ARTIFACT = f"space-invaders-{TAG}.zip"

REQUIRED_FILES = [
    "index.html",
    "game.js",
    "gameConfig.js",
    "input.js",
    "player.js",
    "formation.js",
    "invaders.js",
    "collision.js",
    "state.js",
    "level1.js",
    "level2.js",
    "level3.js",
    "boss.js",
    "README.md",
    ".github/workflows/build.yml",
]

def check_files():
    missing = [f for f in REQUIRED_FILES if not os.path.exists(f)]
    if missing:
        print("ERROR: Missing required files:")
        for f in missing:
            print(f"  {f}")
        sys.exit(1)
    print(f"OK: All {len(REQUIRED_FILES)} required files present.")

def tag_exists(tag):
    result = subprocess.run(["git", "tag", "-l", tag], capture_output=True, text=True)
    return tag in result.stdout.strip().split()

def create_tag():
    if tag_exists(TAG):
        print(f"INFO: Tag {TAG} already exists — skipping tag creation.")
        return
    print(f"Creating annotated tag {TAG} ...")
    subprocess.run(
        ["git", "tag", "-a", TAG, "-m", f"Release {TAG} — initial release"],
        check=True,
    )
    print(f"Pushing tag {TAG} to origin ...")
    subprocess.run(["git", "push", "origin", TAG], check=True)
    print(f"OK: Tag {TAG} pushed.")

def package_artifact():
    static_exts = {".html", ".js", ".css", ".md"}
    files_to_pack = []
    for f in REQUIRED_FILES:
        if os.path.exists(f):
            _, ext = os.path.splitext(f)
            if ext in static_exts or f == "README.md":
                files_to_pack.append(f)
    # Also include any top-level .js and .html files not in REQUIRED_FILES
    for entry in os.listdir("."):
        if entry not in files_to_pack and os.path.isfile(entry):
            _, ext = os.path.splitext(entry)
            if ext in static_exts:
                files_to_pack.append(entry)
    files_to_pack = sorted(set(files_to_pack))
    print(f"Packaging {len(files_to_pack)} files into {ARTIFACT} ...")
    with zipfile.ZipFile(ARTIFACT, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files_to_pack:
            zf.write(f)
            print(f"  + {f}")
    print(f"OK: Artifact written to {ARTIFACT}")

def main():
    check_only = "--check-only" in sys.argv
    print(f"=== e2e Space Invaders release script — {VERSION} ===")
    print(f"Timestamp: {datetime.datetime.utcnow().isoformat()}Z")
    check_files()
    if check_only:
        print("Check-only mode — done.")
        return
    create_tag()
    package_artifact()
    print("\nRelease steps complete. Upload", ARTIFACT, "to the GitHub Release.")

if __name__ == "__main__":
    main()
