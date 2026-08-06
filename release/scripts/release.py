#!/usr/bin/env python3
"""release.py – Build prime_tester, tag v0.3.0, push tag to origin.
Run from the repository root after all 0.3.0 changes are merged to main."""
import subprocess
import sys
import os

VERSION = "0.3.0"
TAG = f"v{VERSION}"
BUILD_DIR = "build"

def run(cmd, **kwargs):
    print(f">>> {' '.join(cmd)}")
    result = subprocess.run(cmd, **kwargs)
    if result.returncode != 0:
        print(f"ERROR: command failed with exit code {result.returncode}", file=sys.stderr)
        sys.exit(result.returncode)
    return result

def main():
    # 1. Configure
    run(["cmake", "-S", ".", "-B", BUILD_DIR, "-DCMAKE_BUILD_TYPE=Release"])
    # 2. Build
    run(["cmake", "--build", BUILD_DIR])
    print(f"Build complete. Artifact: {BUILD_DIR}/prime_tester")

    # 3. Check tag does not already exist remotely
    result = subprocess.run(["git", "ls-remote", "--tags", "origin", TAG],
                            capture_output=True, text=True)
    if TAG in result.stdout:
        print(f"ERROR: tag {TAG} already exists on origin. Aborting.", file=sys.stderr)
        sys.exit(1)

    # 4. Create annotated tag
    run(["git", "tag", "-a", TAG, "-m", f"Release e2e prime tester {VERSION}"])
    # 5. Push tag
    run(["git", "push", "origin", TAG])
    print(f"Tag {TAG} pushed to origin. Upload the artifact to the GitHub release manually.")

if __name__ == "__main__":
    main()
