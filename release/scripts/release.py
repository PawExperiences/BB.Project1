#!/usr/bin/env python3
"""Performs the e2e ticket mirror release: install, build, test, tag, and publish to GitHub."""
import json
import os
import subprocess
import sys

VERSION = os.environ.get("RELEASE_VERSION", "0.1.0")
TAG = os.environ.get("RELEASE_TAG", "v" + VERSION)
REMOTE = os.environ.get("RELEASE_REMOTE", "origin")
NOTES_FILE = os.environ.get("RELEASE_NOTES_FILE", "RELEASE_NOTES.md")


def run(cmd):
    print("+ " + " ".join(cmd))
    result = subprocess.run(cmd)
    if result.returncode != 0:
        print("Command failed: " + " ".join(cmd))
        sys.exit(result.returncode)


def tag_exists(tag):
    result = subprocess.run(
        ["git", "rev-parse", "-q", "--verify", "refs/tags/" + tag],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    return result.returncode == 0


def release_exists(tag):
    result = subprocess.run(
        ["gh", "release", "view", tag],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    return result.returncode == 0


def has_test_script():
    if not os.path.exists("package.json"):
        return False
    with open("package.json") as f:
        data = json.load(f)
    return "test" in data.get("scripts", {})


def main():
    print("Releasing e2e ticket mirror " + TAG)

    status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True)
    if status.stdout.strip():
        print("Working tree is not clean; commit or stash changes before releasing.")
        sys.exit(1)

    run(["npm", "ci"])
    run(["npm", "run", "build"])

    if has_test_script():
        run(["npm", "test"])
    else:
        run(["npx", "--yes", "vitest", "run"])

    if tag_exists(TAG):
        print("Tag " + TAG + " already exists locally; skipping tag creation.")
    else:
        run(["git", "tag", "-a", TAG, "-m", "Release " + TAG])

    run(["git", "push", REMOTE, TAG])

    if release_exists(TAG):
        print("GitHub release " + TAG + " already exists; skipping creation.")
    else:
        cmd = ["gh", "release", "create", TAG, "--title", TAG]
        if os.path.exists(NOTES_FILE):
            cmd += ["--notes-file", NOTES_FILE]
        else:
            cmd += ["--notes", "Release " + TAG]
        run(cmd)

    print("Release " + TAG + " complete.")


if __name__ == "__main__":
    main()
