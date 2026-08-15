#!/usr/bin/env python3
"""release/scripts/run.py
Purpose: run the greet CLI, forwarding any arguments given to this
script. Use this to try the release artifact locally, e.g.
  python3 release/scripts/run.py Alice Bob
  python3 release/scripts/run.py --help
"""
import os
import subprocess
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, "..", ".."))
GREET_JS = os.path.join(REPO_ROOT, "greet.js")


def main():
    if not os.path.isfile(GREET_JS):
        print("ERROR: " + GREET_JS + " not found.", file=sys.stderr)
        sys.exit(1)

    args = sys.argv[1:]
    print("==> Running: node greet.js " + " ".join(args))
    result = subprocess.run(["node", GREET_JS] + args)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
