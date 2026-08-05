#!/usr/bin/env python3
"""release.py -- Tag v0.1.0, build prime_tester, publish GitHub Release.
Run once after CI passes on the release commit."""
import subprocess
import sys
import os
import shutil

TAG = "v0.1.0"
COMMIT = "f7a4f1c"
TITLE = "e2e prime tester 0.1.0"
RELEASE_NOTES = "release/RELEASE_NOTES.md"
ARTIFACT = os.path.join("build", "prime_tester")
if sys.platform == "win32":
    ARTIFACT = ARTIFACT + ".exe"

def run(cmd, **kwargs):
    print(f"[release.py] Running: {' '.join(cmd)}")
    result = subprocess.run(cmd, **kwargs)
    if result.returncode != 0:
        print(f"[release.py] ERROR: command failed with exit code {result.returncode}", file=sys.stderr)
        sys.exit(result.returncode)
    return result

def main():
    # 1. Tag
    run(["git", "tag", "-a", TAG, COMMIT, "-m", f"Release {TITLE}"])
    run(["git", "push", "origin", TAG])
    print(f"[release.py] Tag {TAG} pushed.")

    # 2. Build
    run(["cmake", "-B", "build", "-DCMAKE_BUILD_TYPE=Release"])
    run(["cmake", "--build", "build", "--config", "Release"])
    if not os.path.isfile(ARTIFACT):
        print(f"[release.py] ERROR: artifact not found at {ARTIFACT}", file=sys.stderr)
        sys.exit(1)
    print(f"[release.py] Artifact built: {ARTIFACT}")

    # 3. Publish GitHub Release
    notes_flag = ["--notes-file", RELEASE_NOTES] if os.path.isfile(RELEASE_NOTES) else ["--notes", TITLE]
    run(["gh", "release", "create", TAG, ARTIFACT,
         "--title", TITLE] + notes_flag)
    print(f"[release.py] GitHub Release {TAG} published.")

if __name__ == "__main__":
    main()
