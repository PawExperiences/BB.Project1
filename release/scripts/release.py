#!/usr/bin/env python3
"""release.py -- Tag and push v0.1.0 to origin.
Run from the repository root after CI is green.
Idempotent: skips tag creation if v0.1.0 already exists locally."""
import subprocess
import sys

VERSION = "v0.1.0"
RELEASE_MSG = "Release v0.1.0 -- e2e Space Invaders initial release"


def run(cmd, check=True):
    print(f"  + {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"ERROR: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(result.returncode)
    return result


def main():
    print("[release] Checking working tree is clean...")
    status = run(["git", "status", "--porcelain"])
    if status.stdout.strip():
        print("ERROR: Working tree is dirty. Commit or stash changes first.", file=sys.stderr)
        sys.exit(1)

    print(f"[release] Checking if tag {VERSION} already exists...")
    existing = run(["git", "tag", "-l", VERSION], check=False)
    if VERSION in existing.stdout.split():
        print(f"[release] Tag {VERSION} already exists locally -- skipping creation.")
    else:
        print(f"[release] Creating annotated tag {VERSION}...")
        run(["git", "tag", "-a", VERSION, "-m", RELEASE_MSG])
        print(f"[release] Tag {VERSION} created.")

    print(f"[release] Pushing tag {VERSION} to origin...")
    push = run(["git", "push", "origin", VERSION], check=False)
    if push.returncode != 0:
        if "already exists" in push.stderr or "Everything up-to-date" in push.stdout:
            print(f"[release] Tag {VERSION} already on remote -- nothing to push.")
        else:
            print(f"ERROR pushing tag: {push.stderr.strip()}", file=sys.stderr)
            sys.exit(push.returncode)
    else:
        print(f"[release] Tag {VERSION} pushed to origin.")

    print("[release] Packaging release archive...")
    import zipfile, os
    files_to_package = [
        "index.html", "game.js", "gameConfig.js", "input.js", "player.js",
        "invaders.js", "collision.js", "level1.js", "level2.js", "level3.js",
        "boss.js", "README.md"
    ]
    archive_name = f"e2e-space-invaders-0.1.0.zip"
    existing_files = [f for f in files_to_package if os.path.isfile(f)]
    missing = [f for f in files_to_package if not os.path.isfile(f)]
    if missing:
        print(f"WARNING: These files were not found and will be omitted: {missing}")
    with zipfile.ZipFile(archive_name, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in existing_files:
            zf.write(f)
            print(f"  + added {f}")
    print(f"[release] Archive created: {archive_name}")
    print("[release] Done. Upload the archive to the GitHub Release manually.")


if __name__ == "__main__":
    main()
