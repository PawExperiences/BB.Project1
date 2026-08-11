#!/usr/bin/env python3
"""Release automation for csvclean 0.1.0.

Confirms the CI build workflow still matches this release's toolchain, runs
the test suite, builds the sdist/wheel, smoke-tests the built wheel in a
throwaway venv, tags the release (if the tag does not already exist), and
creates the GitHub release (if it does not already exist). Safe to re-run:
every step is skipped or re-verified rather than redone if already done.

Requires: git and the GitHub CLI ("gh") authenticated with push/release
permissions on the repository remote.
"""
import os
import subprocess
import sys
import tempfile
import venv

VERSION = "0.1.0"
TAG = "v" + VERSION
RELEASE_TITLE = "csvclean " + VERSION
NOTES_PATH = os.path.join("release", "notes", TAG + ".md")
DIST_DIR = "dist"
WORKFLOW_PATH = os.path.join(".github", "workflows", "build.yml")


def run(cmd):
    print("+ " + " ".join(cmd))
    subprocess.run(cmd, check=True)


def check_ci_workflow():
    print("-- checking " + WORKFLOW_PATH + " matches this release's toolchain --")
    if not os.path.isfile(WORKFLOW_PATH):
        print("  WARNING: " + WORKFLOW_PATH + " not found; cannot verify CI toolchain currency")
        return
    with open(WORKFLOW_PATH, "r") as f:
        workflow = f.read()
    if "3.12" in workflow and "build" in workflow:
        print("  OK: workflow references Python 3.12 and a build command")
    else:
        print("  WARNING: " + WORKFLOW_PATH + " may not match pyproject.toml's requires-python")
        print("  (>=3.12) or the 'python -m build' command. If the build resource's command")
        print("  or artifact_path changed for this release, update the build resource config")
        print("  (not this workflow file) so it re-scaffolds.")


def find_wheel():
    if not os.path.isdir(DIST_DIR):
        return None
    for name in sorted(os.listdir(DIST_DIR)):
        if name.startswith("csvclean-" + VERSION) and name.endswith(".whl"):
            return os.path.join(DIST_DIR, name)
    return None


def smoke_test(wheel_path):
    print("-- smoke-testing built wheel in a temporary venv --")
    with tempfile.TemporaryDirectory() as tmp:
        venv_dir = os.path.join(tmp, "venv")
        venv.create(venv_dir, with_pip=True)
        if os.name == "nt":
            pip = os.path.join(venv_dir, "Scripts", "pip.exe")
            csvclean = os.path.join(venv_dir, "Scripts", "csvclean.exe")
        else:
            pip = os.path.join(venv_dir, "bin", "pip")
            csvclean = os.path.join(venv_dir, "bin", "csvclean")
        run([pip, "install", wheel_path])
        run([csvclean, "--help"])
    print("  OK: csvclean installs and runs from the built wheel")


def tag_exists(tag):
    result = subprocess.run(
        ["git", "rev-parse", "-q", "--verify", "refs/tags/" + tag],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    return result.returncode == 0


def release_exists(tag):
    result = subprocess.run(
        ["gh", "release", "view", tag],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    return result.returncode == 0


def main():
    print("== csvclean release " + VERSION + " ==")

    check_ci_workflow()

    print("-- running test suite --")
    run([sys.executable, "-m", "pytest"])

    print("-- building distribution artifacts --")
    run([sys.executable, "-m", "build"])

    wheel_path = find_wheel()
    if wheel_path:
        smoke_test(wheel_path)
    else:
        print("  WARNING: could not find a built wheel in " + DIST_DIR + " to smoke-test")

    if tag_exists(TAG):
        print("-- tag " + TAG + " already exists, skipping tag/push --")
    else:
        print("-- tagging " + TAG + " --")
        run(["git", "tag", "-a", TAG, "-m", RELEASE_TITLE])
        run(["git", "push", "origin", TAG])

    if release_exists(TAG):
        print("-- GitHub release " + TAG + " already exists, skipping create --")
    else:
        print("-- creating GitHub release " + TAG + " --")
        assets = []
        if os.path.isdir(DIST_DIR):
            assets = [
                os.path.join(DIST_DIR, name)
                for name in sorted(os.listdir(DIST_DIR))
                if VERSION in name
            ]
        cmd = ["gh", "release", "create", TAG] + assets + ["--title", RELEASE_TITLE]
        if os.path.isfile(NOTES_PATH):
            cmd += ["--notes-file", NOTES_PATH]
        else:
            cmd += ["--notes", "Release " + VERSION]
        run(cmd)

    print("== release " + VERSION + " complete ==")


if __name__ == "__main__":
    main()
