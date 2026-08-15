#!/usr/bin/env python3
"""Release script for e2e standup poster.
Performs the automated release steps: build, tag, push tag, create/update
the GitHub Release, and upload the build artifact. Safe to re-run: it
skips any step that has already been completed (idempotent). Never
deletes or force-pushes anything."""
import os
import subprocess
import sys
import zipfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
VERSION = os.environ.get("VERSION", "0.1.0")
TAG = os.environ.get("TAG", "v" + VERSION)
REMOTE = os.environ.get("REMOTE", "origin")
TARGET_BRANCH = os.environ.get("TARGET_BRANCH", "main")
DIST_DIR = REPO_ROOT / "dist"
NOTES_FILE = REPO_ROOT / "release" / "RELEASE_NOTES.md"
ARTIFACT = REPO_ROOT / "release" / ("e2e-standup-poster-" + VERSION + ".zip")
RELEASE_TITLE = os.environ.get("RELEASE_TITLE", "e2e standup poster " + VERSION)


def run(cmd, **kwargs):
    print("+ " + " ".join(cmd))
    return subprocess.run(cmd, cwd=str(REPO_ROOT), check=True, **kwargs)


def build():
    print("== Step 1/4: install dependencies and build ==")
    run(["npm", "ci"])
    run(["npm", "run", "build"])
    index_html = DIST_DIR / "index.html"
    if not index_html.exists():
        sys.exit("ERROR: " + str(index_html) + " was not produced by the build")
    print("OK: " + str(index_html) + " exists")


def tag_release():
    print("== Step 2/4: create and push git tag " + TAG + " ==")
    existing = subprocess.run(
        ["git", "rev-parse", "-q", "--verify", "refs/tags/" + TAG],
        cwd=str(REPO_ROOT), capture_output=True,
    )
    if existing.returncode == 0:
        print("SKIP: tag " + TAG + " already exists locally")
    else:
        run(["git", "tag", TAG])
    run(["git", "push", REMOTE, TAG])


def package_artifact():
    print("== Step 3/4: package the build artifact ==")
    ARTIFACT.parent.mkdir(parents=True, exist_ok=True)
    if ARTIFACT.exists():
        ARTIFACT.unlink()
    with zipfile.ZipFile(ARTIFACT, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in DIST_DIR.rglob("*"):
            if path.is_file():
                zf.write(path, path.relative_to(DIST_DIR))
    print("OK: wrote " + str(ARTIFACT))


def publish_release():
    print("== Step 4/4: create or update the GitHub Release ==")
    exists = subprocess.run(["gh", "release", "view", TAG], cwd=str(REPO_ROOT), capture_output=True)
    if exists.returncode == 0:
        print("SKIP: GitHub release " + TAG + " already exists, uploading artifact only")
    else:
        if NOTES_FILE.exists():
            run(["gh", "release", "create", TAG, "--title", RELEASE_TITLE,
                 "--target", TARGET_BRANCH, "--notes-file", str(NOTES_FILE)])
        else:
            run(["gh", "release", "create", TAG, "--title", RELEASE_TITLE,
                 "--target", TARGET_BRANCH, "--notes", "Release " + TAG])
    run(["gh", "release", "upload", TAG, str(ARTIFACT), "--clobber"])


def main():
    print("== Releasing e2e standup poster " + VERSION + " (" + TAG + ") ==")
    build()
    tag_release()
    package_artifact()
    publish_release()
    print("== Done. Nothing was deleted or force-pushed. ==")


if __name__ == "__main__":
    main()
