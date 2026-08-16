#!/usr/bin/env python3
"""Run the built prime_tester CLI, building it first if needed.

Usage:
    python3 release/scripts/run.py [prime_tester args...]
    e.g. python3 release/scripts/run.py 97 100 --upto 30
"""
from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
BUILD_DIR = os.environ.get("BUILD_DIR", "build")
BINARY_NAME = "prime_tester.exe" if os.name == "nt" else "prime_tester"


def main():
    build_dir = REPO_ROOT / BUILD_DIR
    binary = build_dir / BINARY_NAME
    if not binary.exists():
        cmakelists = REPO_ROOT / "CMakeLists.txt"
        if not cmakelists.exists():
            print(
                f"no CMakeLists.txt at {REPO_ROOT} and no built binary at {binary} -- nothing to run yet",
                file=sys.stderr,
            )
            sys.exit(1)
        print(f"{binary} not found -- building it first")
        subprocess.run(["cmake", "-S", str(REPO_ROOT), "-B", str(build_dir)], check=True)
        subprocess.run(["cmake", "--build", str(build_dir)], check=True)
    print(f"+ {binary} {' '.join(sys.argv[1:])}")
    result = subprocess.run([str(binary), *sys.argv[1:]])
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
