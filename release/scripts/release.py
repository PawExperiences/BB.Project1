#!/usr/bin/env python3
"""release.py — Creates and pushes the v0.1.0 annotated release tag.
Run ONCE on main after all pre-release checks pass."""
import subprocess
import sys

TAG = "v0.1.0"
MESSAGE = "e2e Space Invaders 0.1.0 — initial release"
REMOTE = "origin"


def run(cmd, **kwargs):
    print(f"  + {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True, **kwargs)
    if result.stdout.strip():
        print(result.stdout.strip())
    if result.returncode != 0:
        print(f"ERROR: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(result.returncode)
    return result.stdout.strip()


def main():
    print("[release] Checking current branch is main...")
    branch = run(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    if branch != "main":
        print(f"WARNING: current branch is '{branch}', not 'main'. Proceed? [y/N] ", end="")
        if input().strip().lower() != "y":
            print("Aborted.")
            sys.exit(1)

    print("[release] Checking tag does not already exist...")
    existing = subprocess.run(["git", "tag", "-l", TAG], capture_output=True, text=True)
    if TAG in existing.stdout.split():
        print(f"[release] Tag {TAG} already exists locally — skipping tag creation.")
    else:
        print(f"[release] Creating annotated tag {TAG}...")
        run(["git", "tag", "-a", TAG, "-m", MESSAGE])
        print(f"[release] Tag {TAG} created.")

    print(f"[release] Pushing tag {TAG} to {REMOTE}...")
    remote_check = subprocess.run(
        ["git", "ls-remote", "--tags", REMOTE, TAG],
        capture_output=True, text=True
    )
    if TAG in remote_check.stdout:
        print(f"[release] Tag {TAG} already exists on {REMOTE} — skipping push.")
    else:
        run(["git", "push", REMOTE, TAG])
        print(f"[release] Tag {TAG} pushed to {REMOTE}.")

    print(f"[release] Done. Release {TAG} is live on {REMOTE}.")
    print(f"[release] Next step: publish the GitHub Release at")
    print(f"  https://github.com/PawExperiences/BB.Project1/releases/new?tag={TAG}")


if __name__ == "__main__":
    main()
