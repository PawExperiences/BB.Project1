#!/usr/bin/env python3
"""Automated release script for factorlib 0.1.0.

Installs build/test tooling, installs factorlib editable, runs the test
suite, builds the sdist+wheel, smoke-tests the CLI, tags the commit,
pushes the tag, and creates a DRAFT GitHub Release with the artifacts
attached. Run this from anywhere inside the repo, on the commit that
should become v0.1.0. A human must still review and publish the draft
release on GitHub -- this script never makes it public.
"""
import os
import subprocess
import sys

VERSION = "0.1.0"
TAG = "v" + VERSION
REPO = "PawExperiences/BB.Project1"


def run(cmd):
    print("+ " + " ".join(cmd))
    subprocess.run(cmd, check=True)


def ensure_tooling():
    for module, package in (("pytest", "pytest"), ("build", "build")):
        try:
            __import__(module)
        except ImportError:
            print(package + " not found; installing...")
            run([sys.executable, "-m", "pip", "install", package])


def tag_exists(tag):
    result = subprocess.run(
        ["git", "rev-parse", "-q", "--verify", "refs/tags/" + tag],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return result.returncode == 0


def main():
    repo_root = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        check=True, capture_output=True, text=True,
    ).stdout.strip()
    os.chdir(repo_root)

    print("== 1. Ensuring build/test tooling ==")
    ensure_tooling()

    print("== 2. Installing factorlib (editable) ==")
    run([sys.executable, "-m", "pip", "install", "-e", "."])

    print("== 3. Running test suite ==")
    run([sys.executable, "-m", "pytest"])

    print("== 4. Building sdist and wheel ==")
    run([sys.executable, "-m", "build"])

    print("== 5. Smoke-testing the CLI ==")
    run(["factorlib", "12", "18", "7"])

    print("== 6. Tagging release ==")
    if tag_exists(TAG):
        print("Tag " + TAG + " already exists locally, skipping tag creation.")
    else:
        run(["git", "tag", "-a", TAG, "-m", "factorlib " + VERSION])

    print("== 7. Pushing tag ==")
    run(["git", "push", "origin", TAG])

    print("== 8. Creating draft GitHub release ==")
    dist_dir = os.path.join(repo_root, "dist")
    dist_files = [
        os.path.join(dist_dir, f)
        for f in sorted(os.listdir(dist_dir))
        if f.startswith("factorlib-" + VERSION)
    ]
    notes_path = os.path.join(repo_root, "release", "RELEASE_NOTES.md")
    gh_cmd = [
        "gh", "release", "create", TAG,
        *dist_files,
        "--repo", REPO,
        "--title", "factorlib " + VERSION,
        "--draft",
    ]
    if os.path.exists(notes_path):
        gh_cmd += ["--notes-file", notes_path]
    else:
        gh_cmd += ["--notes", "factorlib " + VERSION]
    run(gh_cmd)

    print("Release " + TAG + " prepared as a DRAFT. A maintainer must review and publish it on GitHub.")


if __name__ == "__main__":
    main()
