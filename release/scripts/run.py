#!/usr/bin/env python3
"""Idempotent: ensures the 'linkcheck' console script is installed, then runs
it against each Markdown file path given as an argument, forwarding its exit
code. Usage: run.py <markdown-file> [more files...]
"""
import shutil
import subprocess
import sys


def main():
    if len(sys.argv) < 2:
        print("[run] usage: run.py <markdown-file> [more files...]")
        sys.exit(2)

    if shutil.which("linkcheck") is None:
        print("[run] 'linkcheck' not found on PATH; installing package with 'pip install .'")
        subprocess.run([sys.executable, "-m", "pip", "install", "."], check=True)
    else:
        print("[run] 'linkcheck' already on PATH")

    exit_code = 0
    for target in sys.argv[1:]:
        print("[run] linkcheck " + target)
        result = subprocess.run(["linkcheck", target])
        if result.returncode == 2:
            sys.exit(2)
        if result.returncode == 1:
            exit_code = 1

    sys.exit(exit_code)


if __name__ == "__main__":
    main()
