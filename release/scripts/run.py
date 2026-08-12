#!/usr/bin/env python3
"""release/scripts/run.py
Runs the e2e-cli-greeter CLI, forwarding all arguments to greet.js.
Usage: python3 release/scripts/run.py [NAME...]   (or: python3 release/scripts/run.py --help)
"""
import subprocess
import sys
from pathlib import Path


def main():
    script_dir = Path(__file__).resolve().parent
    repo_root = script_dir.parent.parent
    greet_js = repo_root / "greet.js"

    if not greet_js.exists():
        print("ERROR: {} not found.".format(greet_js), file=sys.stderr)
        sys.exit(1)

    cmd = ["node", str(greet_js)] + sys.argv[1:]
    print("-> " + " ".join(cmd))
    result = subprocess.run(cmd)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
