#!/usr/bin/env python3
"""release.py — package source, tag, and publish the GitHub Release.
Usage: python release/scripts/release.py --version 0.1.0"""
import argparse
import os
import subprocess
import sys
import zipfile

SOURCE_FILES = [
    "index.html",
    "game.js",
    "gameConfig.js",
    "input.js",
    "player.js",
    "invaders.js",
    "collision.js",
    "README.md",
    "CHANGELOG.md",
]

def run(cmd, **kwargs):
    print(f"  + {' '.join(cmd)}")
    result = subprocess.run(cmd, check=True, **kwargs)
    return result

def main():
    parser = argparse.ArgumentParser(description="Release helper for e2e Space Invaders")
    parser.add_argument("--version", required=True, help="Release version, e.g. 0.1.0")
    args = parser.parse_args()
    version = args.version
    tag = f"v{version}"
    zip_name = f"spaceinvaders-{version}.zip"

    # Step 1: create zip artifact
    print(f"[1/4] Creating artifact {zip_name}...")
    with zipfile.ZipFile(zip_name, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in SOURCE_FILES:
            if os.path.exists(f):
                zf.write(f)
                print(f"      added {f}")
            else:
                print(f"      WARNING: {f} not found, skipping", file=sys.stderr)
    print(f"      {zip_name} created.")

    # Step 2: create annotated tag (idempotent: skip if already exists)
    print(f"[2/4] Tagging {tag}...")
    existing = subprocess.run(["git", "tag", "-l", tag], capture_output=True, text=True)
    if tag in existing.stdout.strip().split():
        print(f"      Tag {tag} already exists, skipping tag creation.")
    else:
        run(["git", "tag", "-a", tag, "-m", f"Release {tag} — e2e Space Invaders"])

    # Step 3: push tag
    print(f"[3/4] Pushing tag {tag} to origin...")
    run(["git", "push", "origin", tag])

    # Step 4: create GitHub Release
    print(f"[4/4] Creating GitHub Release {tag}...")
    notes_file = "CHANGELOG.md" if os.path.exists("CHANGELOG.md") else None
    gh_cmd = [
        "gh", "release", "create", tag,
        "--title", f"e2e Space Invaders {tag}",
        zip_name,
    ]
    if notes_file:
        gh_cmd += ["--notes-file", notes_file]
    else:
        gh_cmd += ["--notes", f"Release {tag}"]
    run(gh_cmd)

    print(f"\nRelease {tag} complete. Artifact: {zip_name}")

if __name__ == "__main__":
    main()
