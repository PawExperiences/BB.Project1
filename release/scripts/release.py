#!/usr/bin/env python3
"""release.py -- Tag v0.1.0, package artifact, publish GitHub Release.
Run from the repository root after smoke tests pass.
Requires: git, gh (GitHub CLI) authenticated with contents:write scope.
"""
import subprocess
import sys
import os
import zipfile
import pathlib

VERSION = "0.1.0"
TAG = f"v{VERSION}"
ARTIFACT = f"e2e-space-invaders-{VERSION}.zip"
RELEASE_TITLE = f"e2e space invaders {VERSION}"
RELEASE_NOTES_FILE = "RELEASE_NOTES.md"

SOURCE_FILES = [
    "index.html", "game.js", "gameConfig.js", "input.js",
    "player.js", "invaders.js", "collision.js",
    "level1.js", "level2.js", "level3.js", "boss.js", "README.md"
]

def run(cmd, **kwargs):
    print(f">>> {' '.join(cmd)}")
    result = subprocess.run(cmd, check=True, **kwargs)
    return result

def main():
    root = pathlib.Path(".").resolve()
    print(f"Working directory: {root}")

    # 1. Check tag does not already exist
    existing = subprocess.run(["git", "tag", "-l", TAG], capture_output=True, text=True)
    if TAG in existing.stdout.split():
        print(f"ERROR: Tag {TAG} already exists. Aborting to prevent overwrite.")
        sys.exit(1)

    # 2. Create annotated tag
    run(["git", "tag", "-a", TAG, "-m", f"Release {TAG} – e2e space invaders initial release"])
    print(f"Created tag {TAG}")

    # 3. Push tag
    run(["git", "push", "origin", TAG])
    print(f"Pushed tag {TAG} to origin")

    # 4. Package artifact
    print(f"Creating artifact: {ARTIFACT}")
    with zipfile.ZipFile(ARTIFACT, "w", zipfile.ZIP_DEFLATED) as zf:
        for fname in SOURCE_FILES:
            fpath = root / fname
            if fpath.exists():
                zf.write(fpath, arcname=fname)
                print(f"  + {fname}")
            else:
                print(f"  WARNING: {fname} not found, skipping.")
    print(f"Artifact ready: {ARTIFACT}")

    # 5. Write release notes if not present
    notes_path = root / RELEASE_NOTES_FILE
    if not notes_path.exists():
        notes_path.write_text(
            f"## e2e space invaders {VERSION}\n\n"
            "Initial release. See CHANGELOG.md for full details.\n"
        )
        print(f"Wrote placeholder {RELEASE_NOTES_FILE}")

    # 6. Publish GitHub Release
    run([
        "gh", "release", "create", TAG, ARTIFACT,
        "--title", RELEASE_TITLE,
        "--notes-file", RELEASE_NOTES_FILE
    ])
    print(f"GitHub Release {TAG} published with artifact {ARTIFACT}")

if __name__ == "__main__":
    main()
