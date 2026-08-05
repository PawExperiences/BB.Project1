#!/usr/bin/env python3
"""release.py – Tag, package, and publish e2e space invaders 0.1.0.

Run from the repository root after smoke tests pass.
Requires: git, gh (GitHub CLI), GH_TOKEN env var with repo scope.
Idempotent: skips steps already completed.
"""
import os
import subprocess
import zipfile
import sys

VERSION = "0.1.0"
TAG = f"v{VERSION}"
REPO = "PawExperiences/BB.Project1"
ARTIFACT = f"e2e-space-invaders-{VERSION}.zip"
SOURCE_FILES = [
    "index.html",
    "game.js",
    "gameConfig.js",
    "input.js",
    "player.js",
    "invaders.js",
    "collision.js",
    "README.md",
    ".github/workflows/build.yml",
]
CHANGELOG = "CHANGELOG.md"


def run(cmd, check=True, capture=False):
    print(f"  + {' '.join(cmd)}")
    return subprocess.run(
        cmd, check=check, capture_output=capture, text=True
    )


def tag_exists(tag):
    r = run(["git", "tag", "-l", tag], capture=True)
    return tag in r.stdout.strip().splitlines()


def step_tag():
    if tag_exists(TAG):
        print(f"[skip] Tag {TAG} already exists.")
        return
    print(f"[tag] Creating annotated tag {TAG}...")
    run(["git", "tag", "-a", TAG, "-m", f"Release e2e space invaders {VERSION}"])
    run(["git", "push", "origin", TAG])
    print(f"[tag] {TAG} pushed.")


def step_package():
    if os.path.exists(ARTIFACT):
        print(f"[skip] Artifact {ARTIFACT} already exists.")
        return
    print(f"[package] Creating {ARTIFACT}...")
    missing = [f for f in SOURCE_FILES if not os.path.exists(f)]
    if missing:
        print(f"[warn] Missing files (will be skipped): {missing}")
    with zipfile.ZipFile(ARTIFACT, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in SOURCE_FILES:
            if os.path.exists(f):
                zf.write(f)
                print(f"  added: {f}")
    print(f"[package] {ARTIFACT} created.")


def step_release():
    token = os.environ.get("GH_TOKEN")
    if not token:
        print("[error] GH_TOKEN env var is not set. Cannot create GitHub Release.")
        sys.exit(1)
    # Check if release already exists
    r = run(["gh", "release", "view", TAG, "--repo", REPO], check=False, capture=True)
    if r.returncode == 0:
        print(f"[skip] GitHub Release {TAG} already exists.")
        return
    notes_flag = ["--notes-file", CHANGELOG] if os.path.exists(CHANGELOG) else ["--notes", f"e2e space invaders {VERSION} – initial release."]
    print(f"[release] Creating GitHub Release {TAG}...")
    run([
        "gh", "release", "create", TAG, ARTIFACT,
        "--repo", REPO,
        "--title", f"e2e space invaders {VERSION}",
    ] + notes_flag)
    print(f"[release] GitHub Release {TAG} published.")


if __name__ == "__main__":
    print(f"=== Release {VERSION} ===")
    step_tag()
    step_package()
    step_release()
    print("=== Done ===")
