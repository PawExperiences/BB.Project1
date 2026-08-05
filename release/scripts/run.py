#!/usr/bin/env python3
"""run.py -- build (if necessary) and run the prime_tester executable.

Forwards all arguments after '--' to prime_tester.
Example: python release/scripts/run.py -- 7 42 97
Run from the repository root at any time.
"""
import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
BUILD_DIR = REPO_ROOT / "build"
EXE_NAME = "prime_tester.exe" if sys.platform == "win32" else "prime_tester"
EXE_PATH = BUILD_DIR / EXE_NAME


def build():
    print("[run] Building prime_tester ...")
    subprocess.run(
        ["cmake", "-B", str(BUILD_DIR)],
        cwd=str(REPO_ROOT), check=True
    )
    subprocess.run(
        ["cmake", "--build", str(BUILD_DIR)],
        cwd=str(REPO_ROOT), check=True
    )
    print("[run] Build complete.")


def main():
    # Strip leading '--' separator if present
    args = sys.argv[1:]
    if args and args[0] == "--":
        args = args[1:]

    if not EXE_PATH.exists():
        build()

    print(f"[run] Executing: {EXE_PATH} {' '.join(args)}")
    result = subprocess.run([str(EXE_PATH)] + args)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
