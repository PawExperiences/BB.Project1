#!/usr/bin/env python3
# release/scripts/run.py
# Purpose: build prime_tester if it hasn't been built yet, then run it,
# forwarding all CLI arguments and stdin unchanged. Use this for local/manual
# runs of the shipped CLI (argv mode, stdin mode, or --upto N mode).
# Usage: python3 release/scripts/run.py [args...]
import os
import subprocess
import sys

BUILD_DIR = "build"
CANDIDATES = [
    os.path.join(BUILD_DIR, "prime_tester"),
    os.path.join(BUILD_DIR, "Release", "prime_tester"),
    os.path.join(BUILD_DIR, "Release", "prime_tester.exe"),
    os.path.join(BUILD_DIR, "prime_tester.exe"),
]


def find_binary():
    return next((c for c in CANDIDATES if os.path.isfile(c)), None)


def main():
    binary = find_binary()
    if binary is None:
        print("No build found under {}; configuring and building first.".format(BUILD_DIR), file=sys.stderr)
        subprocess.run(["cmake", "-B", BUILD_DIR], check=True)
        subprocess.run(["cmake", "--build", BUILD_DIR], check=True)
        binary = find_binary()
    if binary is None:
        print("ERROR: build succeeded but executable was not found under {}".format(BUILD_DIR), file=sys.stderr)
        sys.exit(1)

    args = sys.argv[1:]
    print("Running: {} {}".format(binary, " ".join(args)), file=sys.stderr)
    result = subprocess.run([binary] + args)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
