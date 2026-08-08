#!/usr/bin/env python3
"""release.py — Tag v0.1.0, package artifact, create GitHub Release.
Run from the repository root with GH_TOKEN env var set (PAT, contents: write).
"""
import os
import sys
import subprocess
import zipfile
import pathlib

RELEASE_VERSION = "0.1.0"
TAG = f"v{RELEASE_VERSION}"
RELEASE_TITLE = f"e2e Space Invaders {RELEASE_VERSION}"
OUTPUT_DIR = pathlib.Path("release")
ARTIFACT_NAME = f"e2e-space-invaders-{RELEASE_VERSION}.zip"
ARTIFACT_PATH = OUTPUT_DIR / ARTIFACT_NAME
NOTES_PATH = OUTPUT_DIR / "RELEASE_NOTES.md"

FILES_TO_PACKAGE = [
    "index.html", "game.js", "gameConfig.js", "constants.js",
    "input.js", "player.js", "invaders.js", "collision.js",
    "level1.js", "level2.js", "level3.js", "boss.js", "README.md",
]

RELEASE_NOTES = """## e2e Space Invaders v0.1.0

First playable release — a pure-browser, zero-dependency Space Invaders clone built with vanilla ES modules and the HTML5 Canvas API.

Open `index.html` directly from your filesystem (no server, no bundler, no npm) and play through four levels to the multi-phase boss finale.

### Highlights
- Full four-level arc: classic grid → enemies shoot back with UFO bonuses → destructible shields + formation split → two-phase boss
- Fixed-timestep game loop with delta capping (no burst updates on tab restore)
- Procedural canvas-primitive rendering throughout — no image assets
- Progressive difficulty: step interval scales with survivor count; boss doubles fire rate at half HP
- Zero external dependencies; works at file:// URL
"""


def run(cmd, check=True):
    print(f"[run] {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout.strip())
    if result.stderr:
        print(result.stderr.strip(), file=sys.stderr)
    if check and result.returncode != 0:
        print(f"[error] Command failed with exit code {result.returncode}", file=sys.stderr)
        sys.exit(result.returncode)
    return result


def check_prerequisites():
    if not os.environ.get("GH_TOKEN"):
        print("[error] GH_TOKEN environment variable is not set.", file=sys.stderr)
        sys.exit(1)
    result = run(["gh", "--version"], check=False)
    if result.returncode != 0:
        print("[error] GitHub CLI (gh) is not installed or not on PATH.", file=sys.stderr)
        sys.exit(1)
    for f in FILES_TO_PACKAGE:
        if not pathlib.Path(f).exists():
            print(f"[error] Required file not found: {f}", file=sys.stderr)
            sys.exit(1)


def create_tag():
    result = run(["git", "tag", "-l", TAG], check=False)
    if TAG in result.stdout:
        print(f"[info] Tag {TAG} already exists locally — skipping tag creation.")
    else:
        run(["git", "checkout", "main"])
        run(["git", "pull", "origin", "main"])
        run(["git", "tag", "-a", TAG, "-m", f"Release {TAG} — e2e Space Invaders initial release"])
        print(f"[info] Created tag {TAG}.")
    push_result = run(["git", "push", "origin", TAG], check=False)
    if push_result.returncode != 0 and "already exists" not in push_result.stderr:
        print(f"[error] Failed to push tag {TAG}.", file=sys.stderr)
        sys.exit(push_result.returncode)
    print(f"[info] Tag {TAG} is on remote.")


def package_artifact():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    if ARTIFACT_PATH.exists():
        print(f"[info] Artifact {ARTIFACT_PATH} already exists — overwriting.")
        ARTIFACT_PATH.unlink()
    print(f"[info] Packaging artifact: {ARTIFACT_PATH}")
    with zipfile.ZipFile(ARTIFACT_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in FILES_TO_PACKAGE:
            p = pathlib.Path(f)
            if p.exists():
                zf.write(p, p.name)
                print(f"  + {p.name}")
            else:
                print(f"  [warn] Skipping missing file: {f}")
    print(f"[info] Artifact created: {ARTIFACT_PATH}")


def write_release_notes():
    NOTES_PATH.write_text(RELEASE_NOTES, encoding="utf-8")
    print(f"[info] Release notes written to {NOTES_PATH}")


def create_github_release():
    check_result = run(
        ["gh", "release", "view", TAG, "--json", "tagName"],
        check=False
    )
    if check_result.returncode == 0:
        print(f"[info] GitHub Release {TAG} already exists — skipping creation.")
        return
    run([
        "gh", "release", "create", TAG,
        "--title", RELEASE_TITLE,
        "--notes-file", str(NOTES_PATH),
        str(ARTIFACT_PATH),
    ])
    print(f"[info] GitHub Release {TAG} created with artifact {ARTIFACT_NAME}.")


if __name__ == "__main__":
    print(f"=== Release {TAG} ===")
    check_prerequisites()
    create_tag()
    package_artifact()
    write_release_notes()
    create_github_release()
    print(f"=== Done. Visit: https://github.com/PawExperiences/BB.Project1/releases/tag/{TAG} ===")
