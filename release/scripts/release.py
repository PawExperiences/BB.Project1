#!/usr/bin/env python3
"""Releases wordcount: runs fmt/vet/build/test checks, builds the CLI binary,
tags the commit, pushes the tag, and publishes/refreshes the GitHub release.
Usage: VERSION=0.1.0 python3 release/scripts/release.py
"""
import os
import shutil
import subprocess
import sys

VERSION = os.environ.get("VERSION", "0.1.0")
TAG = "v" + VERSION
REMOTE = os.environ.get("REMOTE", "origin")
BRANCH = os.environ.get("BRANCH", "main")
OUT_PATH = os.environ.get("OUT_PATH", os.path.join("dist", "wordcount"))
NOTES_FILE = os.environ.get("NOTES_FILE", os.path.join("release", "notes", TAG + ".md"))


def run(cmd):
    print("==> " + " ".join(cmd))
    subprocess.run(cmd, check=True)


def capture(cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True).stdout


def tag_exists_locally(tag):
    return subprocess.run(["git", "rev-parse", tag], capture_output=True, text=True).returncode == 0


def tag_exists_remotely(tag, remote):
    return ("refs/tags/" + tag) in capture(["git", "ls-remote", "--tags", remote])


def main():
    print("==> Releasing {} from branch {}".format(TAG, BRANCH))

    print("==> Checking working tree is clean")
    if capture(["git", "status", "--porcelain"]).strip():
        print("ERROR: working tree is not clean. Commit or stash changes first.", file=sys.stderr)
        sys.exit(1)

    print("==> Fetching and fast-forwarding {}".format(BRANCH))
    run(["git", "fetch", REMOTE])
    run(["git", "checkout", BRANCH])
    run(["git", "merge", "--ff-only", "{}/{}".format(REMOTE, BRANCH)])

    print("==> Checking gofmt")
    unformatted = capture(["gofmt", "-l", "."])
    if unformatted.strip():
        print("ERROR: the following files are not gofmt-clean:", file=sys.stderr)
        print(unformatted, file=sys.stderr)
        sys.exit(1)

    run(["go", "vet", "./..."])
    run(["go", "test", "./..."])

    os.makedirs(os.path.dirname(OUT_PATH) or ".", exist_ok=True)
    run(["go", "build", "-o", OUT_PATH, "./..."])

    if tag_exists_locally(TAG):
        print("Tag {} already exists locally, skipping tag creation.".format(TAG))
    else:
        run(["git", "tag", "-a", TAG, "-m", "e2e word count {}".format(TAG)])

    if tag_exists_remotely(TAG, REMOTE):
        print("Tag {} already exists on {}, skipping push.".format(TAG, REMOTE))
    else:
        run(["git", "push", REMOTE, TAG])

    print("==> Publishing GitHub release {}".format(TAG))
    if shutil.which("gh") is None:
        print("WARNING: gh CLI not found; skipping GitHub release creation. "
              "Install the GitHub CLI and re-run, or create the release "
              "manually and upload {}.".format(OUT_PATH), file=sys.stderr)
        return

    exists = subprocess.run(["gh", "release", "view", TAG], capture_output=True, text=True).returncode == 0
    if exists:
        print("GitHub release {} already exists, refreshing artifact.".format(TAG))
        run(["gh", "release", "upload", TAG, OUT_PATH, "--clobber"])
    elif os.path.isfile(NOTES_FILE):
        run(["gh", "release", "create", TAG, OUT_PATH,
             "--title", "e2e word count {}".format(VERSION),
             "--notes-file", NOTES_FILE])
    else:
        print("WARNING: notes file {} not found; creating release with "
              "auto-generated notes.".format(NOTES_FILE), file=sys.stderr)
        run(["gh", "release", "create", TAG, OUT_PATH,
             "--title", "e2e word count {}".format(VERSION),
             "--generate-notes"])

    print("==> Done. Released {}.".format(TAG))


if __name__ == "__main__":
    main()
