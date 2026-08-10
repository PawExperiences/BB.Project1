#!/usr/bin/env python3
"""release.py - build, test, tag, and publish the e2e calculator release."""
import os
import shutil
import subprocess
import sys
from pathlib import Path

VERSION = os.environ.get("VERSION", "0.4.0")
TAG = os.environ.get("TAG", "v" + VERSION)
ARTIFACT = Path(os.environ.get("ARTIFACT", "target/calculator-0.1.0.jar"))
TITLE = os.environ.get("TITLE", "e2e calculator cc " + VERSION)
NOTES_FILE = Path(os.environ.get("NOTES_FILE", "release/notes/RELEASE_NOTES.md"))


def run(cmd):
    print("-> " + " ".join(cmd))
    subprocess.run(cmd, check=True)


def run_ok(cmd):
    print("-> " + " ".join(cmd))
    result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return result.returncode == 0


def main():
    print("== release.py: releasing {} ==".format(TAG))

    status = subprocess.run(["git", "status", "--porcelain"], capture_output=True, text=True, check=True)
    if status.stdout.strip():
        print("ERROR: working tree is not clean. Commit or stash changes first.", file=sys.stderr)
        sys.exit(1)

    print("-> running test suite (mvn -B test)")
    run(["mvn", "-B", "test"])

    print("-> building artifact (mvn -B package)")
    run(["mvn", "-B", "package"])

    if not ARTIFACT.is_file():
        print("ERROR: expected artifact not found at {}".format(ARTIFACT), file=sys.stderr)
        sys.exit(1)
    print("-> artifact present: {}".format(ARTIFACT))

    if run_ok(["git", "rev-parse", TAG]):
        print("-> tag {} already exists locally, skipping tag creation".format(TAG))
    else:
        print("-> creating annotated tag {}".format(TAG))
        run(["git", "tag", "-a", TAG, "-m", TITLE])

    remote_tags = subprocess.run(
        ["git", "ls-remote", "--tags", "origin", "refs/tags/" + TAG],
        capture_output=True, text=True, check=True,
    )
    if remote_tags.stdout.strip():
        print("-> tag {} already present on origin, skipping push".format(TAG))
    else:
        print("-> pushing tag {} to origin".format(TAG))
        run(["git", "push", "origin", TAG])

    if shutil.which("gh") is None:
        print("NOTE: gh CLI not found; skipping GitHub release creation.", file=sys.stderr)
        return

    if run_ok(["gh", "release", "view", TAG]):
        print("-> GitHub release {} already exists, uploading/overwriting artifact only".format(TAG))
        run(["gh", "release", "upload", TAG, str(ARTIFACT), "--clobber"])
    else:
        print("-> creating GitHub release {}".format(TAG))
        if NOTES_FILE.is_file():
            run(["gh", "release", "create", TAG, str(ARTIFACT), "--title", TITLE, "--notes-file", str(NOTES_FILE)])
        else:
            print("NOTE: {} not found, creating release with a placeholder note".format(NOTES_FILE), file=sys.stderr)
            run(["gh", "release", "create", TAG, str(ARTIFACT), "--title", TITLE, "--notes", "See CHANGELOG.md"])

    print("== release.py: done ==")


if __name__ == "__main__":
    main()
