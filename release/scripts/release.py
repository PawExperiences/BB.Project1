#!/usr/bin/env python3
"""Automated release steps for e2e-space-invaders-cc: tag, package, and publish
the GitHub Release. Run from anywhere inside the repo after CI is green and
release/RELEASE_NOTES.md has been written. Idempotent: safe to re-run.
"""
import os
import subprocess
import sys
import zipfile
from pathlib import Path

VERSION = os.environ.get("RELEASE_VERSION", "0.5.0")
TAG = VERSION  # delivery-github-release tag_template is "{version}" -- no "v" prefix
REPO_ROOT = Path(__file__).resolve().parents[2]
ARTIFACT_FILES = [
    "index.html", "game.js", "gameConfig.js", "input.js", "player.js",
    "invaders.js", "collision.js", "level1.js", "level2.js", "level3.js",
    "boss.js", "README.md",
]
ZIP_NAME = "e2e-space-invaders-cc-{0}.zip".format(VERSION)
RELEASE_NOTES_PATH = REPO_ROOT / "release" / "RELEASE_NOTES.md"


def run(cmd):
    print("+ " + " ".join(cmd))
    subprocess.run(cmd, cwd=str(REPO_ROOT), check=True)


def tag_exists(tag):
    result = subprocess.run(["git", "tag", "-l", tag], cwd=str(REPO_ROOT),
                             capture_output=True, text=True, check=True)
    return tag in result.stdout.split()


def release_exists(tag):
    result = subprocess.run(["gh", "release", "view", tag], cwd=str(REPO_ROOT),
                             capture_output=True, text=True)
    return result.returncode == 0


def main():
    missing = [f for f in ARTIFACT_FILES if not (REPO_ROOT / f).is_file()]
    if missing:
        print("ERROR: missing expected shipped file(s): {0}".format(missing))
        sys.exit(1)

    if tag_exists(TAG):
        print("Tag {0} already exists locally, skipping tag creation.".format(TAG))
    else:
        run(["git", "tag", "-a", TAG, "-m", "e2e space invaders cc {0}".format(VERSION)])

    run(["git", "push", "origin", TAG])

    zip_path = REPO_ROOT / ZIP_NAME
    print("Packaging {0} files into {1}".format(len(ARTIFACT_FILES), zip_path.name))
    with zipfile.ZipFile(str(zip_path), "w", zipfile.ZIP_DEFLATED) as zf:
        for f in ARTIFACT_FILES:
            zf.write(str(REPO_ROOT / f), arcname=f)

    if release_exists(TAG):
        print("GitHub release {0} already exists; uploading/overwriting the asset only.".format(TAG))
        run(["gh", "release", "upload", TAG, str(zip_path), "--clobber"])
    else:
        if not RELEASE_NOTES_PATH.is_file():
            print("ERROR: {0} not found; write the release notes before running this script.".format(RELEASE_NOTES_PATH))
            sys.exit(1)
        run([
            "gh", "release", "create", TAG,
            str(zip_path),
            "--title", "e2e space invaders cc {0}".format(VERSION),
            "--notes-file", str(RELEASE_NOTES_PATH),
        ])

    print("Release {0} published.".format(TAG))


if __name__ == "__main__":
    main()
