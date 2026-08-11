#!/usr/bin/env python3
# release/scripts/release.py
# Purpose: build, tag, and publish a badge-maker release (idempotent).
# Usage: VERSION=0.1.0 python3 release/scripts/release.py
import json
import os
import shutil
import subprocess
import sys

VERSION = os.environ.get("VERSION", "0.1.0")
TAG = "v" + VERSION
NOTES_FILE = os.environ.get("RELEASE_NOTES_FILE", "RELEASE_NOTES.md")


def run(cmd):
    print("-- " + " ".join(cmd))
    subprocess.run(cmd, check=True)


def output(cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True).stdout.strip()


def main():
    print("== badge-maker release script ==")
    print("Version : " + VERSION)
    print("Tag     : " + TAG)

    status = output(["git", "status", "--porcelain"])
    if status:
        print("ERROR: working tree is not clean. Commit or stash changes first.", file=sys.stderr)
        sys.exit(1)

    run(["npm", "ci"])
    run(["npm", "run", "build"])

    if not os.path.isfile(os.path.join("dist", "index.js")) or not os.path.isfile(os.path.join("dist", "index.d.ts")):
        print("ERROR: build did not produce dist/index.js and dist/index.d.ts.", file=sys.stderr)
        sys.exit(1)

    with open("package.json") as f:
        pkg_version = json.load(f)["version"]
    if pkg_version != VERSION:
        print("ERROR: package.json version (%s) != VERSION (%s)." % (pkg_version, VERSION), file=sys.stderr)
        sys.exit(1)

    tag_exists = subprocess.run(
        ["git", "rev-parse", "-q", "--verify", "refs/tags/" + TAG],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    ).returncode == 0
    if tag_exists:
        print("-- tag %s already exists locally, skipping tag creation" % TAG)
    else:
        run(["git", "tag", "-a", TAG, "-m", "Release " + TAG])

    remote_tags = output(["git", "ls-remote", "--tags", "origin", "refs/tags/" + TAG])
    if TAG in remote_tags:
        print("-- tag %s already on origin, skipping push" % TAG)
    else:
        run(["git", "push", "origin", TAG])

    run(["npm", "pack"])
    tarball = "badge-maker-%s.tgz" % VERSION
    if not os.path.isfile(tarball):
        print("ERROR: expected artifact %s was not created by npm pack." % tarball, file=sys.stderr)
        sys.exit(1)
    print("-- artifact ready: " + tarball)

    if shutil.which("gh"):
        release_exists = subprocess.run(
            ["gh", "release", "view", TAG],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        ).returncode == 0
        if release_exists:
            print("-- GitHub release %s already exists, skipping creation" % TAG)
        elif os.path.isfile(NOTES_FILE):
            run(["gh", "release", "create", TAG, tarball, "--title", TAG, "--notes-file", NOTES_FILE])
        else:
            run(["gh", "release", "create", TAG, tarball, "--title", TAG, "--notes", "Release " + TAG])
    else:
        print("-- gh CLI not found: create the GitHub release for %s manually and upload %s" % (TAG, tarball))

    print("== done. Remember: 'npm publish' requires interactive 2FA and is a separate manual step. ==")


if __name__ == "__main__":
    main()
