#!/usr/bin/env python3
"""Idempotent: tests, verifies install, tags HEAD as vVERSION, pushes the tag,
and publishes a GitHub release from RELEASE_NOTES_FILE. Run from the repo root
on the exact commit you intend to ship, after tests are green.

Env vars:
  RELEASE_VERSION     version to release, default 0.1.0
  RELEASE_NOTES_FILE  path to the release notes markdown, default RELEASE_NOTES.md
  RELEASE_TITLE       GitHub release title, default "e2e link checker <version>"
"""
import os
import subprocess
import sys

VERSION = os.environ.get("RELEASE_VERSION", "0.1.0")
TAG = "v" + VERSION
NOTES_FILE = os.environ.get("RELEASE_NOTES_FILE", "RELEASE_NOTES.md")
TITLE = os.environ.get("RELEASE_TITLE", "e2e link checker " + VERSION)


def run(cmd):
    print("[release] $ " + " ".join(cmd))
    subprocess.run(cmd, check=True)


def tag_exists(tag):
    result = subprocess.run(
        ["git", "rev-parse", "-q", "--verify", "refs/tags/" + tag],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return result.returncode == 0


def release_exists(tag):
    result = subprocess.run(
        ["gh", "release", "view", tag],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return result.returncode == 0


def main():
    print("[release] running test suite as a release gate")
    run([sys.executable, "-m", "pytest"])

    print("[release] verifying the package installs cleanly")
    run([sys.executable, "-m", "pip", "install", "."])

    if tag_exists(TAG):
        print("[release] tag " + TAG + " already exists locally; skipping tag creation")
    else:
        print("[release] creating tag " + TAG)
        run(["git", "tag", "-a", TAG, "-m", TITLE])

    print("[release] pushing tag " + TAG + " to origin")
    run(["git", "push", "origin", TAG])

    if not os.path.exists(NOTES_FILE):
        print("[release] ERROR: " + NOTES_FILE + " not found; cannot publish release notes", file=sys.stderr)
        sys.exit(1)

    if release_exists(TAG):
        print("[release] GitHub release " + TAG + " already exists; skipping creation")
    else:
        print("[release] creating GitHub release " + TAG)
        run(["gh", "release", "create", TAG, "--title", TITLE, "--notes-file", NOTES_FILE])

    print("[release] done")


if __name__ == "__main__":
    main()
