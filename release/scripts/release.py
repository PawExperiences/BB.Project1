#!/usr/bin/env python3
"""release/scripts/release.py
Purpose: run pre-release checks, create and push the git tag, and publish
the GitHub release for this version. Run from a clean checkout of the
commit that should become the release, on a machine with push access and
(optionally) an authenticated gh CLI.
"""
import os
import shutil
import subprocess
import sys

VERSION = os.environ.get("RELEASE_VERSION", "0.1.0")
TAG = "v" + VERSION
NOTES_FILE = os.environ.get("RELEASE_NOTES_FILE", os.path.join("release", "RELEASE_NOTES.md"))


def run(cmd, check=True, capture=False):
    print("==> " + " ".join(cmd))
    result = subprocess.run(cmd, check=False, text=True, capture_output=capture)
    if check and result.returncode != 0:
        sys.exit(result.returncode)
    return result


def has(tool):
    return shutil.which(tool) is not None


def main():
    print("==> Releasing " + TAG)

    status = run(["git", "status", "--porcelain"], capture=True)
    if status.stdout.strip():
        print("ERROR: working tree is not clean. Commit or stash changes first.", file=sys.stderr)
        sys.exit(1)

    if has("npm") and os.path.isfile("package.json"):
        print("==> Installing dependencies (npm ci)")
        run(["npm", "ci"])

        if os.path.isfile("tsconfig.json"):
            print("==> Type-checking (tsc --noEmit)")
            run(["npx", "tsc", "--noEmit"])

        scripts_out = run(["npm", "run"], check=False, capture=True)
        if "test" in scripts_out.stdout:
            print("==> Running test suite (npm test)")
            run(["npm", "test", "--silent"])

    if os.path.isfile("check.js"):
        print("==> Running CLI self-check (node check.js)")
        run(["node", "check.js"])

    tag_exists = run(["git", "rev-parse", TAG], check=False, capture=True)
    if tag_exists.returncode == 0:
        print("Tag " + TAG + " already exists locally; skipping tag creation.")
    else:
        print("==> Creating annotated tag " + TAG)
        run(["git", "tag", "-a", TAG, "-m", "Release " + TAG])

    print("==> Pushing tag " + TAG + " to origin")
    run(["git", "push", "origin", TAG])

    if has("gh"):
        exists = run(["gh", "release", "view", TAG], check=False, capture=True)
        if exists.returncode == 0:
            print("==> GitHub release " + TAG + " already exists; skipping creation.")
        else:
            print("==> Creating GitHub release " + TAG)
            if os.path.isfile(NOTES_FILE):
                run(["gh", "release", "create", TAG, "--title", TAG, "--notes-file", NOTES_FILE])
            else:
                run(["gh", "release", "create", TAG, "--title", TAG, "--generate-notes"])
    else:
        print("NOTE: gh CLI not found; create the GitHub release for " + TAG + " manually.")

    print("==> Done. Released " + TAG + ".")


if __name__ == "__main__":
    main()
