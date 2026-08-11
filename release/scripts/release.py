#!/usr/bin/env python3
"""Automated release: verify, test, lint, build, tag and publish units 0.1.0."""
import subprocess
import sys
import shutil
from pathlib import Path

VERSION = "0.1.0"
TAG = "v" + VERSION
REMOTE = "origin"
REPO_ROOT = Path(__file__).resolve().parents[2]


def run(cmd):
    print("+ " + " ".join(cmd))
    subprocess.run(cmd, check=True, cwd=REPO_ROOT)


def capture(cmd):
    result = subprocess.run(cmd, cwd=REPO_ROOT, capture_output=True, text=True)
    return result.returncode, result.stdout.strip()


def has_tool(name):
    return shutil.which(name) is not None


def main():
    print("== Releasing units " + VERSION + " (" + TAG + ") ==")

    _, dirty = capture(["git", "status", "--porcelain"])
    if dirty:
        print("Working tree is not clean. Commit or stash changes before releasing.")
        sys.exit(1)

    print("-- Installing dependencies (uv sync) --")
    run(["uv", "sync"])

    print("-- Running test suite (pytest) --")
    run(["uv", "run", "pytest", "-q"])

    print("-- Running lint checks (ruff) --")
    run(["uv", "run", "ruff", "check", "."])
    run(["uv", "run", "ruff", "format", "--check", "."])

    print("-- Building distribution artifacts (uv build) --")
    run(["uv", "build"])
    dist_dir = REPO_ROOT / "dist"

    code, _ = capture(["git", "rev-parse", "-q", "--verify", "refs/tags/" + TAG])
    if code == 0:
        print("Tag " + TAG + " already exists locally, skipping tag creation.")
    else:
        print("-- Tagging " + TAG + " --")
        run(["git", "tag", "-a", TAG, "-m", "units " + VERSION])

    _, remote_out = capture(["git", "ls-remote", "--tags", REMOTE, TAG])
    if remote_out:
        print("Tag " + TAG + " already exists on " + REMOTE + ", skipping push.")
    else:
        print("-- Pushing tag " + TAG + " to " + REMOTE + " --")
        run(["git", "push", REMOTE, TAG])

    if not has_tool("gh"):
        print("gh CLI not found: skipping GitHub release creation. Install gh and re-run, or create the release manually.")
        return

    code, _ = capture(["gh", "release", "view", TAG])
    if code == 0:
        print("GitHub release " + TAG + " already exists, skipping creation.")
        return

    notes_file = REPO_ROOT / "release" / "notes" / "RELEASE_NOTES.md"
    artifacts = [str(p) for p in sorted(dist_dir.glob("*"))]
    cmd = ["gh", "release", "create", TAG] + artifacts + ["--title", "units " + VERSION]
    if notes_file.exists():
        cmd += ["--notes-file", str(notes_file)]
    else:
        cmd += ["--notes", "units " + VERSION]
    print("-- Creating GitHub release --")
    run(cmd)
    print("== Release complete ==")


if __name__ == "__main__":
    main()
