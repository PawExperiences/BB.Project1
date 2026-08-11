#!/usr/bin/env python3
# release/scripts/release.py
# Purpose: build prime_tester in Release mode, smoke-test it against the task
# acceptance criteria, then tag, push, and publish a GitHub release with the
# binary attached. Run once the CI-currency and release-tree checks have both
# passed, from a clean checkout of the branch being released.
# Usage: python3 release/scripts/release.py [VERSION]
import os
import subprocess
import shutil
import sys

VERSION = sys.argv[1] if len(sys.argv) > 1 else "0.6.0"
TAG = "v" + VERSION
BUILD_DIR = "build"
NOTES_FILE = os.path.join("release", "notes", TAG + ".md")

CANDIDATES = [
    os.path.join(BUILD_DIR, "prime_tester"),
    os.path.join(BUILD_DIR, "Release", "prime_tester"),
    os.path.join(BUILD_DIR, "Release", "prime_tester.exe"),
    os.path.join(BUILD_DIR, "prime_tester.exe"),
]


def run(cmd):
    print("+ " + " ".join(cmd))
    subprocess.run(cmd, check=True)


def find_binary():
    return next((c for c in CANDIDATES if os.path.isfile(c)), None)


def fail(msg):
    print("ERROR: " + msg, file=sys.stderr)
    sys.exit(1)


def main():
    print("== prime_tester release {} ==".format(TAG))

    print("-- Checking working tree is clean --")
    status = subprocess.run(["git", "status", "--porcelain"], check=True, capture_output=True, text=True)
    if status.stdout.strip():
        fail("working tree has uncommitted changes. Commit or stash first.")

    print("-- Configuring and building (Release) --")
    run(["cmake", "-B", BUILD_DIR, "-DCMAKE_BUILD_TYPE=Release"])
    run(["cmake", "--build", BUILD_DIR, "--config", "Release"])

    binary = find_binary()
    if binary is None:
        fail("built executable not found under {}".format(BUILD_DIR))
    print("Found executable: {}".format(binary))

    print("-- Smoke test: argv mode --")
    result = subprocess.run([binary, "2", "3", "4", "17", "18"], capture_output=True, text=True)
    expected = "2 is prime\n3 is prime\n4 is not prime\n17 is prime\n18 is not prime\n"
    if result.stdout != expected:
        fail("argv-mode smoke test mismatch. Got:\n" + result.stdout)

    print("-- Smoke test: --upto 30 --")
    result_upto = subprocess.run([binary, "--upto", "30"], capture_output=True, text=True)
    expected_upto = "2\n3\n5\n7\n11\n13\n17\n19\n23\n29\n"
    if result_upto.stdout != expected_upto:
        fail("--upto 30 smoke test mismatch.")

    print("-- Smoke test: empty stdin --")
    result_empty = subprocess.run([binary], input="", capture_output=True, text=True)
    if result_empty.stdout != "":
        fail("empty-stdin smoke test produced output, expected none.")

    print("-- Smoke test: malformed token --")
    result_bad = subprocess.run([binary], input="abc\n", capture_output=True, text=True)
    if result_bad.returncode != 1 or result_bad.stderr.strip() != "not a number: abc":
        fail("malformed-token smoke test mismatch (status={} stderr={!r}).".format(result_bad.returncode, result_bad.stderr))

    print("All smoke tests passed.")

    tag_exists = subprocess.run(["git", "rev-parse", TAG], capture_output=True).returncode == 0
    if tag_exists:
        print("Tag {} already exists locally; skipping tag creation.".format(TAG))
    else:
        print("-- Creating annotated tag {} --".format(TAG))
        run(["git", "tag", "-a", TAG, "-m", "Release {}".format(TAG)])

    print("-- Pushing tag {} to origin --".format(TAG))
    run(["git", "push", "origin", TAG])

    if shutil.which("gh"):
        release_exists = subprocess.run(["gh", "release", "view", TAG], capture_output=True).returncode == 0
        if release_exists:
            print("GitHub release {} already exists; skipping creation.".format(TAG))
        else:
            if not os.path.isfile(NOTES_FILE):
                fail("notes file {} not found. Write releaseNotes there first.".format(NOTES_FILE))
            print("-- Creating GitHub release {} --".format(TAG))
            run(["gh", "release", "create", TAG, binary, "--title", "prime_tester {}".format(TAG), "--notes-file", NOTES_FILE])
    else:
        print("gh CLI not found; skipping GitHub release creation. Install it and re-run, or publish manually with {} attached.".format(binary), file=sys.stderr)

    print("== Release {} complete ==".format(TAG))


if __name__ == "__main__":
    main()
