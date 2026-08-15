#!/usr/bin/env python3
# Automated release script for caltool. Restores, builds, tests, publishes,
# tags, pushes the tag, and creates the GitHub release for the given version.
import os
import shutil
import subprocess
import sys
import zipfile

VERSION = os.environ.get("CALTOOL_VERSION", "0.1.0")
TAG = "v" + VERSION
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
PUBLISH_DIR = os.path.join(PROJECT_DIR, "out")
ARTIFACT_ZIP = os.path.join(PROJECT_DIR, "caltool-" + VERSION + ".zip")
NOTES_FILE = os.path.join(PROJECT_DIR, "release", "RELEASE_NOTES.md")


def run(cmd, check=True):
    print("[release] $ " + " ".join(cmd))
    return subprocess.run(cmd, cwd=PROJECT_DIR, check=check)


def tag_exists(tag):
    result = subprocess.run(["git", "tag", "--list", tag], cwd=PROJECT_DIR,
                             capture_output=True, text=True)
    return tag in result.stdout.split()


def release_exists(tag):
    result = subprocess.run(["gh", "release", "view", tag], cwd=PROJECT_DIR,
                             capture_output=True, text=True)
    return result.returncode == 0


def main():
    print("[release] Preparing release " + TAG + " for caltool")

    print("[release] Restoring, building, and testing (gate before publish)")
    run(["dotnet", "restore", "caltool.csproj"])
    run(["dotnet", "build", "caltool.csproj", "-c", "Release"])
    run(["dotnet", "test", os.path.join("tests", "CalendarTests.csproj")])

    print("[release] Publishing to " + PUBLISH_DIR)
    if os.path.isdir(PUBLISH_DIR):
        shutil.rmtree(PUBLISH_DIR)
    run(["dotnet", "publish", "caltool.csproj", "-c", "Release", "-o", PUBLISH_DIR])

    print("[release] Packaging artifact " + ARTIFACT_ZIP)
    if os.path.exists(ARTIFACT_ZIP):
        os.remove(ARTIFACT_ZIP)
    with zipfile.ZipFile(ARTIFACT_ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _dirs, files in os.walk(PUBLISH_DIR):
            for file in files:
                full = os.path.join(root, file)
                rel = os.path.relpath(full, PUBLISH_DIR)
                zf.write(full, rel)

    if tag_exists(TAG):
        print("[release] Tag " + TAG + " already exists locally, skipping tag creation")
    else:
        print("[release] Creating annotated tag " + TAG)
        run(["git", "tag", "-a", TAG, "-m", "caltool " + VERSION])

    print("[release] Pushing tag " + TAG + " to origin (safe no-op if already present)")
    run(["git", "push", "origin", TAG], check=False)

    if shutil.which("gh") is None:
        print("[release] gh CLI not found; skipping GitHub release creation.")
        print("[release] Create it manually: attach " + ARTIFACT_ZIP + " and use release/RELEASE_NOTES.md as the body.")
        return

    if release_exists(TAG):
        print("[release] GitHub release " + TAG + " already exists, skipping creation")
    else:
        print("[release] Creating GitHub release " + TAG)
        args = ["gh", "release", "create", TAG, ARTIFACT_ZIP, "--title", "caltool " + VERSION]
        if os.path.exists(NOTES_FILE):
            args += ["--notes-file", NOTES_FILE]
        else:
            args += ["--notes", "caltool " + VERSION]
        run(args)

    print("[release] Done.")


if __name__ == "__main__":
    main()
