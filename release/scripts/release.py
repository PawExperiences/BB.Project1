#!/usr/bin/env python3
"""release.py — Tags the current HEAD as v0.1.0 and pushes the tag to origin.
Run ONCE after CI is green and before creating the GitHub Release.
Idempotent: if the tag already exists locally it reports so and still pushes."""
import subprocess
import sys

TAG = "v0.1.0"
MESSAGE = "Release e2e calculator 0.1.0"

def run(cmd, check=True):
    print(f"+ {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.stdout.strip():
        print(result.stdout.strip())
    if result.stderr.strip():
        print(result.stderr.strip(), file=sys.stderr)
    if check and result.returncode != 0:
        print(f"ERROR: command exited with code {result.returncode}", file=sys.stderr)
        sys.exit(result.returncode)
    return result

def main():
    # Check if tag already exists locally
    existing = run(["git", "tag", "-l", TAG], check=False)
    if TAG in existing.stdout.split():
        print(f"Tag {TAG} already exists locally — skipping creation, pushing only.")
    else:
        run(["git", "tag", "-a", TAG, "-m", MESSAGE])
        print(f"Created annotated tag {TAG}")

    run(["git", "push", "origin", TAG])
    print(f"\nDone. Tag {TAG} pushed to origin.")
    print("Next step: create the GitHub Release at https://github.com/PawExperiences/BB.Project1/releases/new")

if __name__ == "__main__":
    main()
