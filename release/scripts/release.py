#!/usr/bin/env python3
"""release/scripts/release.py
Performs the automated e2e-cli-greeter release steps: verify, tag, and publish a GitHub release.
Usage: VERSION=0.1.0 python3 release/scripts/release.py
"""
import json
import os
import subprocess
import sys
from pathlib import Path
from shutil import which

VERSION = os.environ.get("VERSION", "0.1.0")
REMOTE = os.environ.get("REMOTE", "origin")
TAG = "v" + VERSION
NOTES_FILE = os.environ.get("NOTES_FILE", "release/notes/v{}.md".format(VERSION))
TITLE = os.environ.get("TITLE", "e2e cli greeter {}".format(VERSION))


def run(cmd, check=True):
    print("-> " + " ".join(cmd))
    return subprocess.run(cmd, check=check)


def main():
    print("== release.py: releasing {} as tag {} ==".format(TITLE, TAG))

    status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True, check=True)
    if status.stdout.strip():
        print("ERROR: working tree is not clean. Commit or stash changes before releasing.", file=sys.stderr)
        sys.exit(1)
    print("OK: working tree is clean.")

    if Path("package.json").exists():
        run(["npm", "ci"])
        scripts = json.loads(Path("package.json").read_text()).get("scripts", {})
        if "lint" in scripts:
            run(["npm", "run", "lint"])
        else:
            print("SKIP: no 'lint' script in package.json")
        if "test" in scripts:
            run(["npm", "test"])
        else:
            print("SKIP: no 'test' script in package.json")
    else:
        print("SKIP: no package.json found")

    if Path("check.js").exists():
        run(["node", "check.js"])
    else:
        print("SKIP: check.js not found")

    tag_exists = subprocess.run(["git", "rev-parse", TAG], capture_output=True).returncode == 0
    if tag_exists:
        print("SKIP: local tag {} already exists".format(TAG))
    else:
        run(["git", "tag", "-a", TAG, "-m", "Release {}".format(TAG)])

    remote_tags = subprocess.run(["git", "ls-remote", "--tags", REMOTE, "refs/tags/" + TAG],
                                  capture_output=True, text=True, check=True)
    if TAG in remote_tags.stdout:
        print("SKIP: tag {} already on {}".format(TAG, REMOTE))
    else:
        run(["git", "push", REMOTE, TAG])

    if not which("gh"):
        print("ERROR: GitHub CLI (gh) not found. Install gh, then create the release manually:", file=sys.stderr)
        print("  gh release create {} --title \"{}\" --notes-file \"{}\"".format(TAG, TITLE, NOTES_FILE), file=sys.stderr)
        sys.exit(1)

    release_exists = subprocess.run(["gh", "release", "view", TAG], capture_output=True).returncode == 0
    if release_exists:
        print("SKIP: GitHub release {} already exists".format(TAG))
    else:
        if not Path(NOTES_FILE).exists():
            print("ERROR: notes file {} not found. Save the release notes there first.".format(NOTES_FILE), file=sys.stderr)
            sys.exit(1)
        run(["gh", "release", "create", TAG, "--title", TITLE, "--notes-file", NOTES_FILE])

    for f in ["greet.js", "README.md", "check.js"]:
        if Path(f).exists():
            run(["gh", "release", "upload", TAG, f, "--clobber"])

    print("== release.py: done ==")


if __name__ == "__main__":
    main()
