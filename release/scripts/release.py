#!/usr/bin/env python3
# Purpose: cut and publish a wordcount release (tag, build artifacts, create GitHub release).
# Usage: python release/scripts/release.py [version]   (default: 0.1.0)
import os
import shutil
import subprocess
import sys
from pathlib import Path

VERSION = sys.argv[1] if len(sys.argv) > 1 else "0.1.0"
TAG = "v" + VERSION
DIST_DIR = Path("dist")
NOTES_FILE = Path("release/RELEASE_NOTES.md")

TARGETS = [
    ("linux", "amd64", ""),
    ("linux", "arm64", ""),
    ("darwin", "amd64", ""),
    ("darwin", "arm64", ""),
    ("windows", "amd64", ".exe"),
]


def run(cmd, **kwargs):
    print("==> " + " ".join(cmd))
    subprocess.run(cmd, check=True, **kwargs)


def main():
    print("==> Releasing wordcount " + TAG)

    branch = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    if branch != "main":
        print("Refusing to release from branch '" + branch + "' (expected 'main')", file=sys.stderr)
        sys.exit(1)

    print("==> Checking toolchain")
    run(["go", "version"])

    print("==> Formatting check (gofmt -l .)")
    result = subprocess.run(["gofmt", "-l", "."], capture_output=True, text=True, check=True)
    if result.stdout.strip():
        print("gofmt found unformatted files:", file=sys.stderr)
        print(result.stdout, file=sys.stderr)
        sys.exit(1)

    run(["go", "build", "./..."])
    run(["go", "vet", "./..."])
    run(["go", "test", "./..."])

    print("==> Tagging " + TAG + " (idempotent: skips if the tag already exists)")
    tag_check = subprocess.run(["git", "rev-parse", TAG], capture_output=True)
    if tag_check.returncode == 0:
        print("Tag " + TAG + " already exists, skipping tag creation")
    else:
        run(["git", "tag", "-a", TAG, "-m", "Release " + TAG])
        run(["git", "push", "origin", TAG])

    print("==> Building release artifacts into " + str(DIST_DIR) + "/")
    DIST_DIR.mkdir(parents=True, exist_ok=True)
    for goos, goarch, ext in TARGETS:
        out = DIST_DIR / ("wordcount_" + goos + "_" + goarch + ext)
        print("  building " + str(out))
        env = os.environ.copy()
        env["GOOS"] = goos
        env["GOARCH"] = goarch
        subprocess.run(["go", "build", "-o", str(out), "."], check=True, env=env)

    if shutil.which("gh") is None:
        print("gh CLI not found; skipping GitHub release creation. Install gh, or create the release manually and upload the files in " + str(DIST_DIR) + "/.", file=sys.stderr)
        print("==> Done. Artifacts in " + str(DIST_DIR) + "/")
        return

    print("==> Creating GitHub release " + TAG + " (idempotent: skips if it already exists)")
    release_check = subprocess.run(["gh", "release", "view", TAG], capture_output=True)
    if release_check.returncode == 0:
        print("Release " + TAG + " already exists, skipping creation")
    else:
        artifacts = [str(p) for p in sorted(DIST_DIR.glob("*"))]
        cmd = ["gh", "release", "create", TAG] + artifacts + ["--title", "wordcount " + TAG]
        if NOTES_FILE.exists():
            cmd += ["--notes-file", str(NOTES_FILE)]
        else:
            cmd += ["--notes", "See CHANGELOG.md for details."]
        run(cmd)

    print("==> Done. Artifacts in " + str(DIST_DIR) + "/")


if __name__ == "__main__":
    main()
