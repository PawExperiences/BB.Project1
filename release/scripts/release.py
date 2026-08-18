#!/usr/bin/env python3
"""
release.py -- automated release steps for Space Invaders 0.1.0.

WHAT IT DOES (in order; every step is idempotent, safe to re-run):
  1. Verifies that every game file of the release is present.
  2. Warns if the git working tree has uncommitted changes.
  3. Builds the release artifact dist/space-invaders-0.1.0.zip from the
     game files (rebuilt from scratch on every run).
  4. Creates the annotated git tag v0.1.0 (skipped if it already exists).
  5. Pushes the tag to origin (skipped if the remote already has it).
  6. Creates the GitHub release v0.1.0 with the zip attached IF the gh
     CLI is installed and authenticated (skipped if the release exists);
     otherwise prints the exact manual steps to finish in the web UI.

WHEN TO RUN: once, from an up-to-date checkout of main, AFTER the
release PR (changelog + notes + these scripts) is merged and CI is green.

USAGE: python release/scripts/release.py
Standard library only; requires git on PATH (and optionally gh).
"""

import os
import shutil
import subprocess
import sys
import zipfile

VERSION = "0.1.0"
TAG = "v" + VERSION
TITLE = "Space Invaders " + VERSION
DIST_DIR = "dist"
ARTIFACT = os.path.join(DIST_DIR, "space-invaders-" + VERSION + ".zip")

CORE_FILES = [
    "index.html", "game.js", "gameConfig.js", "input.js", "player.js",
    "invaders.js", "collision.js", "level1.js", "level2.js",
    "level3.js", "boss.js", "README.md",
]
OPTIONAL_FILES = ["levels.js", "CHANGELOG.md"]

DEFAULT_NOTES = (
    "Space Invaders " + VERSION + " - a complete four-level Space Invaders\n"
    "in dependency-free ES modules. Download the zip, open index.html in a\n"
    "browser (file:// works, no server needed) and press ENTER to play.\n"
    "See CHANGELOG.md for the full list of changes."
)


def run(cmd, check=False):
    print("+ " + " ".join(cmd))
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if check and proc.returncode != 0:
        print(proc.stdout)
        print(proc.stderr)
        print("ERROR: command failed: " + " ".join(cmd))
        sys.exit(1)
    return proc


def main():
    root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    os.chdir(root)
    print("Releasing " + TITLE + " from " + root)

    # 1. verify files
    missing = [f for f in CORE_FILES if not os.path.isfile(f)]
    if missing:
        print("ERROR: missing release files: " + ", ".join(missing))
        print("All bundled game cards must be merged before tagging.")
        sys.exit(1)
    files = list(CORE_FILES)
    for f in OPTIONAL_FILES:
        if os.path.isfile(f):
            files.append(f)
    print("All " + str(len(files)) + " release files present.")

    # 2. dirty-tree warning (the zip is built from the working tree)
    status = run(["git", "status", "--porcelain"]).stdout.strip()
    if status:
        print("WARNING: working tree has uncommitted changes; the zip is")
        print("built from the working tree while the tag points at HEAD.")

    # 3. build artifact
    os.makedirs(DIST_DIR, exist_ok=True)
    with zipfile.ZipFile(ARTIFACT, "w", zipfile.ZIP_DEFLATED) as z:
        for f in files:
            z.write(f, f)
    size = os.path.getsize(ARTIFACT)
    print("Built " + ARTIFACT + " (" + str(size) + " bytes, "
          + str(len(files)) + " files).")

    # 4. tag
    have_tag = run(["git", "rev-parse", "-q", "--verify", "refs/tags/" + TAG])
    if have_tag.returncode == 0:
        print("Tag " + TAG + " already exists locally - skipping.")
    else:
        run(["git", "tag", "-a", TAG, "-m", TITLE], check=True)
        print("Created annotated tag " + TAG + ".")

    # 5. push tag
    remote = run(["git", "ls-remote", "--tags", "origin", TAG]).stdout
    if TAG in remote:
        print("Remote already has " + TAG + " - skipping push.")
    else:
        push = run(["git", "push", "origin", TAG])
        if push.returncode != 0:
            print("WARNING: could not push the tag (auth/network?).")
            print("Push it manually: git push origin " + TAG)
        else:
            print("Pushed " + TAG + " to origin.")

    # 6. github release
    if shutil.which("gh"):
        view = run(["gh", "release", "view", TAG])
        if view.returncode == 0:
            print("GitHub release " + TAG + " already exists - skipping.")
        else:
            notes_file = os.path.join("release", "RELEASE_NOTES.md")
            cmd = ["gh", "release", "create", TAG, ARTIFACT,
                   "--title", TITLE, "--latest"]
            if os.path.isfile(notes_file):
                cmd += ["--notes-file", notes_file]
            else:
                cmd += ["--notes", DEFAULT_NOTES]
            create = run(cmd)
            if create.returncode != 0:
                print("WARNING: gh release create failed; finish manually")
                print("using the steps printed for the no-gh case below.")
            else:
                print("GitHub release " + TAG + " created with " + ARTIFACT)
    else:
        print("gh CLI not found - finish the release manually:")
        print("  1. Open https://github.com/PawExperiences/BB.Project1/releases/new")
        print("  2. Choose tag " + TAG + ", title '" + TITLE + "'")
        print("  3. Paste the release notes and attach " + ARTIFACT)

    print("Done. " + TITLE + " release steps completed.")


if __name__ == "__main__":
    main()
