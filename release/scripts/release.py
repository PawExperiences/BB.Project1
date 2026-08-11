#!/usr/bin/env python3
"""Automate the mdpdf 0.1.0 release: tag, build, and publish to GitHub Releases.

Requires: git, gh (GitHub CLI, authenticated), and the 'build' package
(pip install build) available to this Python interpreter.
Run from the repository root, on the commit that should become v0.1.0.
Idempotent: safe to re-run if it was interrupted after tagging or publishing.
"""
import shutil
import subprocess
import sys
from pathlib import Path

VERSION = "0.1.0"
TAG = "v" + VERSION
REPO = "PawExperiences/BB.Project1"
NOTES_FILE = Path("release/RELEASE_NOTES.md")
DIST_DIR = Path("dist")


def run(cmd):
    print("+ " + " ".join(cmd))
    subprocess.run(cmd, check=True)


def tag_exists(tag):
    result = subprocess.run(
        ["git", "rev-parse", "-q", "--verify", "refs/tags/" + tag],
        capture_output=True,
    )
    return result.returncode == 0


def release_exists(tag):
    result = subprocess.run(
        ["gh", "release", "view", tag, "--repo", REPO], capture_output=True
    )
    return result.returncode == 0


def require(binary):
    if shutil.which(binary) is None:
        print("error: required tool '" + binary + "' not found on PATH", file=sys.stderr)
        sys.exit(1)


def main():
    for tool in ("git", "gh"):
        require(tool)

    status = subprocess.run(
        ["git", "status", "--porcelain"], capture_output=True, text=True, check=True
    )
    if status.stdout.strip():
        print("error: working tree is not clean; commit or stash changes first", file=sys.stderr)
        sys.exit(1)

    if tag_exists(TAG):
        print("tag " + TAG + " already exists locally, skipping tag creation")
    else:
        run(["git", "tag", "-a", TAG, "-m", "mdpdf " + VERSION])

    print("+ git push origin " + TAG)
    run(["git", "push", "origin", TAG])

    print("building sdist and wheel with 'python -m build'")
    run([sys.executable, "-m", "build"])

    if release_exists(TAG):
        print("GitHub release " + TAG + " already exists, skipping release creation")
    else:
        if not NOTES_FILE.exists():
            print("error: " + str(NOTES_FILE) + " not found; write release notes before publishing", file=sys.stderr)
            sys.exit(1)
        assets = [str(p) for p in sorted(DIST_DIR.glob("*")) if p.is_file()]
        if not assets:
            print("error: no build artifacts found under " + str(DIST_DIR), file=sys.stderr)
            sys.exit(1)
        run(
            [
                "gh", "release", "create", TAG,
                "--repo", REPO,
                "--title", "mdpdf " + VERSION,
                "--notes-file", str(NOTES_FILE),
            ]
            + assets
        )

    print("release " + TAG + " complete")


if __name__ == "__main__":
    main()
