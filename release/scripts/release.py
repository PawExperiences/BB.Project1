#!/usr/bin/env python3
"""release.py — tag and push v0.1.0. Run from repo root on the release branch."""
import subprocess
import sys

VERSION = "v0.1.0"
MESSAGE = "Release v0.1.0 — initial release: e2e Space Invaders"

def run(cmd, **kwargs):
    print(f">> {' '.join(cmd)}")
    result = subprocess.run(cmd, **kwargs)
    if result.returncode != 0:
        print(f"ERROR: command failed with exit code {result.returncode}", file=sys.stderr)
        sys.exit(result.returncode)
    return result

def main():
    # Idempotency: skip tag creation if it already exists locally
    existing = subprocess.run(["git", "tag", "-l", VERSION], capture_output=True, text=True)
    if VERSION in existing.stdout.splitlines():
        print(f"Tag {VERSION} already exists locally — skipping creation.")
    else:
        run(["git", "tag", "-a", VERSION, "-m", MESSAGE])
        print(f"Created annotated tag {VERSION}.")

    # Push tag (--no-force ensures we never overwrite remote history)
    run(["git", "push", "origin", VERSION])
    print(f"Tag {VERSION} pushed to origin. Release complete.")

if __name__ == "__main__":
    main()
