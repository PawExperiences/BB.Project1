#!/usr/bin/env python3
"""release.py -- Tag, build, and publish GitHub release for e2e prime tester 0.3.0.
Run ONCE after CI is green on main. Requires: git, cmake, gh (GitHub CLI) on PATH.
"""
import subprocess
import sys
import os
import pathlib

TAG = "v0.3.0"
RELEASE_TITLE = "e2e prime tester 0.3.0"
NOTES_FILE = "docs/releases/0-3-0.md"
BUILD_DIR = "build"
# Update BINARY_NAME to match the executable CMake produces
BINARY_NAME = "prime_tester"

def run(cmd, **kwargs):
    print(f"[release.py] Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, **kwargs)
    if result.returncode != 0:
        print(f"[release.py] ERROR: command failed with exit code {result.returncode}")
        sys.exit(result.returncode)
    return result

def main():
    repo_root = pathlib.Path(__file__).resolve().parents[2]
    os.chdir(repo_root)
    print(f"[release.py] Working directory: {repo_root}")

    # Check tag does not already exist
    existing = subprocess.run(["git", "tag", "--list", TAG], capture_output=True, text=True)
    if TAG in existing.stdout.split():
        print(f"[release.py] Tag {TAG} already exists -- skipping tag creation (idempotent).")
    else:
        run(["git", "tag", "-a", TAG, "-m", f"Release {RELEASE_TITLE}"])
        print(f"[release.py] Tag {TAG} created.")
        run(["git", "push", "origin", TAG])
        print(f"[release.py] Tag pushed to origin.")

    # Build
    run(["cmake", "-B", BUILD_DIR, "-S", ".", "-DCMAKE_BUILD_TYPE=Release"])
    run(["cmake", "--build", BUILD_DIR, "--config", "Release"])

    # Locate binary (search common subdirs)
    binary = None
    for candidate in [
        pathlib.Path(BUILD_DIR) / BINARY_NAME,
        pathlib.Path(BUILD_DIR) / "Release" / BINARY_NAME,
        pathlib.Path(BUILD_DIR) / f"{BINARY_NAME}.exe",
        pathlib.Path(BUILD_DIR) / "Release" / f"{BINARY_NAME}.exe",
    ]:
        if candidate.exists():
            binary = str(candidate)
            break
    if binary is None:
        print(f"[release.py] WARNING: binary '{BINARY_NAME}' not found in {BUILD_DIR}. Proceeding without artifact.")
        artifact_args = []
    else:
        print(f"[release.py] Binary found: {binary}")
        artifact_args = [binary]

    # Publish GitHub release (idempotent: fails gracefully if already exists)
    gh_cmd = [
        "gh", "release", "create", TAG,
        "--title", RELEASE_TITLE,
        "--notes-file", NOTES_FILE,
    ] + artifact_args
    result = subprocess.run(gh_cmd)
    if result.returncode != 0:
        print("[release.py] GitHub release may already exist or gh CLI failed. Check manually.")
    else:
        print(f"[release.py] GitHub release {TAG} published successfully.")

if __name__ == "__main__":
    main()
