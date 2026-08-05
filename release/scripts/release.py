#!/usr/bin/env python3
"""release.py — packages game files, creates git tag v0.1.0, pushes tag to origin.
Run from the repository root after all manual checks pass."""
import os
import subprocess
import sys
import zipfile

VERSION = "0.1.0"
TAG = f"v{VERSION}"
ZIP_NAME = f"e2e-space-invaders-{VERSION}.zip"
FILES = [
    "index.html", "game.js", "gameConfig.js", "input.js", "player.js",
    "invaders.js", "collision.js", "explosion.js", "level1.js", "level2.js",
    "level3.js", "boss.js", "README.md",
]

def run(cmd, check=True):
    print(f"  + {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout.rstrip())
    if result.stderr:
        print(result.stderr.rstrip(), file=sys.stderr)
    if check and result.returncode != 0:
        sys.exit(f"Command failed: {' '.join(cmd)}")
    return result

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.join(root, "..", "..")
    os.chdir(os.path.normpath(repo_root))
    print(f"Working in: {os.getcwd()}")

    # 1. Check clean working tree
    status = run(["git", "status", "--porcelain"])
    if status.stdout.strip():
        sys.exit("Working tree is not clean. Commit or stash changes first.")
    print("Working tree is clean.")

    # 2. Check required files exist
    missing = [f for f in FILES if not os.path.isfile(f)]
    if missing:
        sys.exit(f"Missing files: {missing}")
    print(f"All {len(FILES)} source files present.")

    # 3. Create zip artefact
    zip_path = os.path.join("release", "scripts", ZIP_NAME)
    os.makedirs(os.path.dirname(zip_path), exist_ok=True)
    print(f"Creating {zip_path} ...")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in FILES:
            zf.write(f)
            print(f"  added {f}")
    print(f"Artefact created: {zip_path}")

    # 4. Create annotated tag (idempotent: skip if already exists)
    existing = run(["git", "tag", "-l", TAG])
    if existing.stdout.strip() == TAG:
        print(f"Tag {TAG} already exists, skipping tag creation.")
    else:
        run(["git", "tag", "-a", TAG, "-m", f"Release {TAG} – initial four-level Space Invaders"])
        print(f"Tag {TAG} created.")

    # 5. Push tag
    run(["git", "push", "origin", TAG])
    print(f"Tag {TAG} pushed to origin.")
    print(f"\nDone. Upload {zip_path} to the GitHub Release for {TAG}.")

if __name__ == "__main__":
    main()
