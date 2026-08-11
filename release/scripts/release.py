#!/usr/bin/env python3
"""Release script for e2e calculator cc: builds, tags, and publishes a GitHub release.

Run this once CI is green and the changelog/release-notes PR has merged.
Requires: git, mvn (Maven), and the GitHub CLI (gh) authenticated, all on PATH.
"""
import os
import subprocess
import sys

JAR_PATH = os.path.join("target", "calculator-0.1.0.jar")
RELEASE_TAG = os.environ.get("RELEASE_TAG", "v0.4.0")
RELEASE_TITLE = os.environ.get("RELEASE_TITLE", "e2e calculator cc 0.4.0")
NOTES_PATH = os.environ.get("RELEASE_NOTES_PATH", os.path.join("release", "RELEASE_NOTES.md"))


def run(cmd):
    print("+ " + " ".join(cmd))
    subprocess.run(cmd, check=True)


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


def main():
    print("== 1/4: building and testing with Maven ==")
    run(["mvn", "-B", "package"])

    if not os.path.isfile(JAR_PATH):
        print("ERROR: expected jar not found at " + JAR_PATH)
        sys.exit(1)

    print("== 2/4: tagging " + RELEASE_TAG + " ==")
    if tag_exists(RELEASE_TAG):
        print(RELEASE_TAG + " already exists locally, skipping tag creation")
    else:
        run(["git", "tag", "-a", RELEASE_TAG, "-m", RELEASE_TITLE])

    print("== 3/4: pushing tag to origin ==")
    run(["git", "push", "origin", RELEASE_TAG])

    print("== 4/4: publishing GitHub release ==")
    if release_exists(RELEASE_TAG):
        print("GitHub release " + RELEASE_TAG + " already exists, skipping creation (upload assets manually if needed)")
    else:
        if os.path.isfile(NOTES_PATH):
            run(["gh", "release", "create", RELEASE_TAG, JAR_PATH, "--title", RELEASE_TITLE, "--notes-file", NOTES_PATH])
        else:
            run(["gh", "release", "create", RELEASE_TAG, JAR_PATH, "--title", RELEASE_TITLE, "--notes", RELEASE_TITLE])

    print("Done: " + RELEASE_TAG + " built, tagged, pushed, and published.")


if __name__ == "__main__":
    main()
