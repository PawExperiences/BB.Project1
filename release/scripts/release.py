#!/usr/bin/env python3
"""Release script for e2e standup poster.
Tags the currently checked-out commit as a release, builds it, and
publishes a GitHub release with the dist/ artifact attached.
Run this ONLY after checking out the confirmed release commit (see the
runbook: current main HEAD may not contain the app -- a
'chore: reset for the next e2e project' commit appears to have deleted
it). Idempotent: safe to re-run.
"""
import os
import subprocess
import sys
import zipfile
import pathlib

VERSION = os.environ.get("RELEASE_VERSION", "0.1.0")
TAG = os.environ.get("RELEASE_TAG", "v" + VERSION)
NOTES_FILE = os.environ.get("RELEASE_NOTES_FILE", "release/RELEASE_NOTES.md")
REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]


def run(cmd, **kw):
    print("+ " + " ".join(cmd))
    return subprocess.run(cmd, check=True, cwd=REPO_ROOT, **kw)


def main():
    print("== Releasing " + TAG + " ==")

    pkg = REPO_ROOT / "package.json"
    if not pkg.exists():
        sys.exit(
            "ERROR: package.json not found at repo root.\n"
            "This checkout does not contain the standup-poster app.\n"
            "Confirm you have checked out the correct release commit\n"
            "(see runbook step 1 -- current main HEAD may have been wiped\n"
            "by the 'chore: reset for the next e2e project' commit)."
        )

    print("-- Installing dependencies (npm ci) --")
    run(["npm", "ci"])

    print("-- Building (npm run build) --")
    run(["npm", "run", "build"])

    dist_index = REPO_ROOT / "dist" / "index.html"
    if not dist_index.exists():
        sys.exit("ERROR: build did not produce dist/index.html")
    print("Build OK: " + str(dist_index))

    print("-- Packaging dist/ artifact --")
    artifact = REPO_ROOT / ("standup-poster-" + VERSION + ".zip")
    if artifact.exists():
        artifact.unlink()
    dist_dir = REPO_ROOT / "dist"
    with zipfile.ZipFile(artifact, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in dist_dir.rglob("*"):
            if f.is_file():
                zf.write(f, f.relative_to(dist_dir))
    print("Artifact written: " + str(artifact))

    print("-- Checking whether tag " + TAG + " already exists --")
    existing = subprocess.run(
        ["git", "rev-parse", "-q", "--verify", "refs/tags/" + TAG],
        cwd=REPO_ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    if existing.returncode != 0:
        print("-- Creating annotated tag " + TAG + " on current commit --")
        run(["git", "tag", "-a", TAG, "-m", "Release " + TAG])
    else:
        print("Tag " + TAG + " already exists locally; not re-tagging (idempotent).")
    print("-- Pushing tag " + TAG + " to origin (additive, no force) --")
    run(["git", "push", "origin", TAG])

    print("-- Checking whether GitHub release " + TAG + " already exists --")
    view = subprocess.run(
        ["gh", "release", "view", TAG], cwd=REPO_ROOT,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    notes_path = REPO_ROOT / NOTES_FILE
    if view.returncode != 0:
        print("-- Creating GitHub release " + TAG + " --")
        cmd = ["gh", "release", "create", TAG, str(artifact), "--title", TAG]
        if notes_path.exists():
            cmd += ["--notes-file", str(notes_path)]
        else:
            cmd += ["--generate-notes"]
        run(cmd)
    else:
        print("Release " + TAG + " already exists; uploading/overwriting artifact only.")
        run(["gh", "release", "upload", TAG, str(artifact), "--clobber"])

    print("== Done. Release " + TAG + " published. ==")


if __name__ == "__main__":
    main()
