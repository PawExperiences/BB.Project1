#!/usr/bin/env python3
# Purpose: build (if needed) and run the wordcount binary, forwarding all args/stdin.
# Usage: python release/scripts/run.py [file...]   (no args reads stdin, per the tool's own CLI rules)
import os
import subprocess
import sys

BIN = "wordcount.exe" if os.name == "nt" else "./wordcount"
SRC_FILES = ("main.go", "count.go")


def needs_build():
    if not os.path.exists(BIN):
        return True
    bin_mtime = os.path.getmtime(BIN)
    return any(os.path.exists(f) and os.path.getmtime(f) > bin_mtime for f in SRC_FILES)


def main():
    if needs_build():
        print("==> Building wordcount", file=sys.stderr)
        subprocess.run(["go", "build", "-o", BIN, "."], check=True)

    print("==> Running: " + BIN + " " + " ".join(sys.argv[1:]), file=sys.stderr)
    completed = subprocess.run([BIN] + sys.argv[1:])
    sys.exit(completed.returncode)


if __name__ == "__main__":
    main()
