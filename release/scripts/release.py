#!/usr/bin/env python3
"""Release helper for romans 0.1.0 (e2e provider kimi).

Runs the automated release steps end to end and is safe to re-run:
  1. builds the distribution with `uv build`
  2. verifies the wheel ships romans/__init__.py, romans/table.py, romans/py.typed
  3. creates the annotated git tag v0.1.0 (skipped if it already exists)
  4. pushes the tag to origin
  5. creates the GitHub release with the dist artifacts attached
     (uses the `gh` CLI; prints the exact manual command if `gh` is absent)

Run from the repository root AFTER the release-notes commit has landed:
    python release/scripts/release.py
"""

from __future__ import annotations

import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

VERSION = "0.1.0"
TAG = "v" + VERSION
TITLE = "e2e provider kimi " + VERSION
NOTES_FILE = Path("docs/releases/0-1-0.md")
EXPECTED_WHEEL_MEMBERS = (
    "romans/__init__.py",
    "romans/table.py",
    "romans/py.typed",
)


def run(cmd):
    print("$ " + " ".join(cmd))
    return subprocess.run(cmd, check=True)


def have(tool):
    return shutil.which(tool) is not None


def main():
    if not Path("pyproject.toml").is_file():
        print("ERROR: run this script from the repository root (pyproject.toml not found).")
        return 1

    if not have("uv"):
        print("ERROR: `uv` not found on PATH; install it from https://docs.astral.sh/uv/")
        return 1

    print("== 1/5 Building the distribution ==")
    run(["uv", "build"])

    print("== 2/5 Verifying wheel contents ==")
    wheels = sorted(Path("dist").glob("*.whl"))
    if not wheels:
        print("ERROR: no wheel found under dist/ after `uv build`.")
        return 1
    wheel = wheels[-1]
    with zipfile.ZipFile(str(wheel)) as zf:
        names = set(zf.namelist())
    missing = [m for m in EXPECTED_WHEEL_MEMBERS if m not in names]
    if missing:
        print("ERROR: " + wheel.name + " is missing expected members: " + ", ".join(missing))
        return 1
    print("OK: " + wheel.name + " contains " + ", ".join(EXPECTED_WHEEL_MEMBERS))

    print("== 3/5 Tagging the release ==")
    tag_exists = subprocess.run(
        ["git", "rev-parse", "-q", "--verify", "refs/tags/" + TAG],
        check=False,
        capture_output=True,
    ).returncode == 0
    if tag_exists:
        print("Tag " + TAG + " already exists locally; skipping creation.")
    else:
        run(["git", "tag", "-a", TAG, "-m", TITLE])

    print("== 4/5 Pushing the tag ==")
    run(["git", "push", "origin", TAG])

    print("== 5/5 Creating the GitHub release ==")
    if not have("gh"):
        print("`gh` CLI not found; create the release manually:")
        print("  gh release create " + TAG + " dist/* --title '" + TITLE + "' --notes-file " + str(NOTES_FILE))
        print("or use the GitHub web UI with the same title, notes and artifacts.")
        return 0
    release_exists = subprocess.run(
        ["gh", "release", "view", TAG], check=False, capture_output=True
    ).returncode == 0
    if release_exists:
        print("GitHub release " + TAG + " already exists; skipping creation (no remote state is modified).")
    else:
        artifacts = [str(p) for p in sorted(Path("dist").glob("*")) if p.is_file()]
        if not artifacts:
            print("ERROR: no artifacts under dist/ to attach to the release.")
            return 1
        if NOTES_FILE.is_file():
            notes_args = ["--notes-file", str(NOTES_FILE)]
        else:
            notes_args = ["--notes", TITLE]
        run(["gh", "release", "create", TAG] + artifacts + ["--title", TITLE] + notes_args)

    print("")
    print("Release " + TAG + " prepared. Remaining manual step: publish to PyPI with `uv publish`")
    print("only if/when a human approves (project-name ownership + credentials required).")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except subprocess.CalledProcessError as exc:
        cmd = exc.cmd if isinstance(exc.cmd, str) else " ".join(exc.cmd)
        print("ERROR: command failed with exit code " + str(exc.returncode) + ": " + cmd)
        sys.exit(exc.returncode or 1)
