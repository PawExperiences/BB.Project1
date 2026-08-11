#!/usr/bin/env python3
"""Automated release script for e2e quote page v0.1.0.

Builds the static site, tags the commit, packages dist/ into a zip,
and (if the GitHub CLI is available and authenticated) publishes a
GitHub release with the artifact attached. Safe to re-run: every step
checks current state first and skips work that is already done. Run
this only after the runbook's STOP-GATE steps have been confirmed by
a human.
"""
import os
import shutil
import subprocess
import sys
import zipfile

VERSION = "0.1.0"
TAG = "v" + VERSION
REQUIRED_FILES = [
    "package.json",
    "astro.config.mjs",
    "src/pages/index.astro",
    "src/data/quotes.json",
    "src/styles/print.css",
    "src/lib/pick.ts",
    "README.md",
]


def run(cmd, cwd):
    print("$ " + " ".join(cmd))
    subprocess.run(cmd, cwd=cwd, check=True)


def main():
    print("== e2e quote page release script ==")
    repo_root = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    dist_dir = os.path.join(repo_root, "dist")
    release_dir = os.path.join(repo_root, "release")
    artifact = os.path.join(release_dir, "e2e-quote-page-" + VERSION + ".zip")
    notes_file = os.path.join(release_dir, "RELEASE_NOTES.md")

    status = subprocess.run(
        ["git", "status", "--porcelain"], cwd=repo_root,
        capture_output=True, text=True, check=True,
    ).stdout
    if status.strip():
        print("ERROR: working tree is not clean. Commit or stash changes before releasing.")
        sys.exit(1)

    missing = [f for f in REQUIRED_FILES if not os.path.exists(os.path.join(repo_root, f))]
    if missing:
        print("ERROR: this checkout is missing required release files: " + ", ".join(missing))
        print("This matches the STOP-GATE concern in the runbook -- do not release.")
        print("Confirm the correct commit is checked out before re-running this script.")
        sys.exit(1)

    print("-- Installing dependencies (npm ci) --")
    run(["npm", "ci"], repo_root)

    print("-- Building static site (npm run build) --")
    run(["npm", "run", "build"], repo_root)

    index_path = os.path.join(dist_dir, "index.html")
    if not os.path.exists(index_path):
        print("ERROR: build did not produce dist/index.html")
        sys.exit(1)
    print("Build OK: " + index_path)

    os.makedirs(release_dir, exist_ok=True)
    if os.path.exists(artifact):
        os.remove(artifact)
    print("-- Packaging " + dist_dir + " -> " + artifact + " --")
    with zipfile.ZipFile(artifact, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _dirs, files in os.walk(dist_dir):
            for name in files:
                full = os.path.join(root, name)
                zf.write(full, os.path.relpath(full, dist_dir))
    print("Artifact written: " + artifact)

    tag_check = subprocess.run(
        ["git", "rev-parse", "-q", "--verify", "refs/tags/" + TAG],
        cwd=repo_root, capture_output=True, text=True,
    )
    if tag_check.returncode == 0:
        print("Tag " + TAG + " already exists, skipping tag creation.")
    else:
        print("-- Creating annotated tag " + TAG + " --")
        run(["git", "tag", "-a", TAG, "-m", "e2e quote page " + VERSION], repo_root)
        print("-- Pushing tag " + TAG + " to origin --")
        run(["git", "push", "origin", TAG], repo_root)

    gh = shutil.which("gh")
    if gh is None:
        print("GitHub CLI (gh) not found; skipping GitHub release publish step.")
        print("Publish manually: gh release create " + TAG + " " + artifact +
              " --title \"e2e quote page " + VERSION + "\" --notes-file " + notes_file)
    else:
        existing = subprocess.run([gh, "release", "view", TAG], cwd=repo_root,
                                   capture_output=True, text=True)
        if existing.returncode == 0:
            print("GitHub release " + TAG + " already exists, uploading artifact if missing...")
            run([gh, "release", "upload", TAG, artifact, "--clobber"], repo_root)
        else:
            print("-- Creating GitHub release " + TAG + " --")
            args = [gh, "release", "create", TAG, artifact, "--title", "e2e quote page " + VERSION]
            if os.path.exists(notes_file):
                args += ["--notes-file", notes_file]
            else:
                args += ["--notes", "e2e quote page " + VERSION]
            run(args, repo_root)

    print("== Release script complete ==")


if __name__ == "__main__":
    main()
