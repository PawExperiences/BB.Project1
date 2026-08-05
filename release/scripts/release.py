#!/usr/bin/env python3
"""release.py -- tag and push v0.1.0 to origin.

Run from the repository root on the clean default branch,
immediately before creating the GitHub Release.
Idempotent: if the tag already exists locally and remotely it reports so and exits 0.
"""
import subprocess
import sys

TAG = "v0.1.0"
MESSAGE = "Release e2e prime tester 0.1.0"
REMOTE = "origin"


def run(cmd, check=True):
    print(f"  + {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        sys.exit(result.returncode)
    return result


def main():
    print(f"[release] Tagging {TAG} ...")

    # Check if tag already exists locally
    existing = run(["git", "tag", "-l", TAG], check=False)
    if TAG in existing.stdout.splitlines():
        print(f"[release] Tag {TAG} already exists locally -- skipping creation.")
    else:
        run(["git", "tag", "-a", TAG, "-m", MESSAGE])
        print(f"[release] Created annotated tag {TAG}.")

    # Check if tag already exists on remote
    remote_check = run(["git", "ls-remote", "--tags", REMOTE, TAG], check=False)
    if TAG in remote_check.stdout:
        print(f"[release] Tag {TAG} already present on {REMOTE} -- skipping push.")
    else:
        run(["git", "push", REMOTE, TAG])
        print(f"[release] Pushed {TAG} to {REMOTE}.")

    print(f"[release] Done. Verify at: https://github.com/PawExperiences/BB.Project1/releases")


if __name__ == "__main__":
    main()
