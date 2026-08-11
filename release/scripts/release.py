#!/usr/bin/env python3
"""Automated release script for e2e quote page.
Builds the site, tags the release, and publishes a GitHub release with the dist artifact.
Run from the repository root after CI is green on the release commit.
"""
import os
import shutil
import subprocess
import sys
import zipfile

VERSION = "0.1.0"
TAG = "v" + VERSION
DIST_DIR = "dist"
ARCHIVE_NAME = "dist-" + TAG + ".zip"


def run(cmd):
    print("+ " + " ".join(cmd))
    subprocess.run(cmd, check=True)


def tag_exists(tag):
    result = subprocess.run(
        ["git", "rev-parse", "-q", "--verify", "refs/tags/" + tag],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    return result.returncode == 0


def main():
    print("== Release " + TAG + " ==")

    print("-- Installing dependencies (npm ci) --")
    run(["npm", "ci"])

    print("-- Building site (npm run build) --")
    run(["npm", "run", "build"])

    index_html = os.path.join(DIST_DIR, "index.html")
    if not os.path.isfile(index_html):
        print("ERROR: " + index_html + " was not produced by the build.", file=sys.stderr)
        sys.exit(1)
    print(index_html + " built successfully.")

    if tag_exists(TAG):
        print("Tag " + TAG + " already exists locally; skipping tag creation.")
    else:
        print("-- Tagging release " + TAG + " --")
        run(["git", "tag", "-a", TAG, "-m", "Release " + TAG])
        run(["git", "push", "origin", TAG])

    print("-- Archiving " + DIST_DIR + " --")
    if os.path.isfile(ARCHIVE_NAME):
        os.remove(ARCHIVE_NAME)
    with zipfile.ZipFile(ARCHIVE_NAME, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _dirs, files in os.walk(DIST_DIR):
            for name in files:
                full = os.path.join(root, name)
                zf.write(full, os.path.relpath(full, DIST_DIR))
    print("Wrote " + ARCHIVE_NAME)

    gh = shutil.which("gh")
    if gh is None:
        print("gh CLI not found; skipping GitHub release publish. Install gh and re-run, or run:")
        print("  gh release create " + TAG + " " + ARCHIVE_NAME + " --title " + TAG + " --generate-notes")
        return

    check = subprocess.run(["gh", "release", "view", TAG],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if check.returncode == 0:
        print("GitHub release " + TAG + " already exists; skipping creation.")
    else:
        print("-- Creating GitHub release " + TAG + " --")
        run(["gh", "release", "create", TAG, ARCHIVE_NAME, "--title", TAG, "--generate-notes"])

    print("== Release " + TAG + " complete ==")


if __name__ == "__main__":
    main()
