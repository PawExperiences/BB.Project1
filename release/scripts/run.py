#!/usr/bin/env python3
"""Build (if needed) and run the prime_tester CLI, forwarding all arguments.

Use it to quickly try the released binary, e.g.:
    python release/scripts/run.py 2 4 17
    python release/scripts/run.py --upto 30
    printf '2\n4\n17\n' | python release/scripts/run.py

Exits with prime_tester's own exit status (1 if any bad token occurred).
"""

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BUILD = ROOT / "build"

EXE_CANDIDATES = (
    "prime_tester",
    "prime_tester.exe",
    "Debug/prime_tester.exe",
    "Release/prime_tester.exe",
    "Debug/prime_tester",
    "Release/prime_tester",
)


def main():
    os.chdir(ROOT)
    if not (BUILD / "CMakeCache.txt").exists():
        print("[run] configuring: cmake -B build", flush=True)
        subprocess.check_call(["cmake", "-B", "build"])
    print("[run] building: cmake --build build", flush=True)
    subprocess.check_call(["cmake", "--build", "build"])
    exe = None
    for rel in EXE_CANDIDATES:
        candidate = BUILD / rel
        if candidate.is_file():
            exe = candidate
            break
    if exe is None:
        print("[run] FAILED: prime_tester binary not found under build/", file=sys.stderr)
        return 1
    print("[run] starting: %s %s" % (exe, " ".join(sys.argv[1:])), flush=True)
    result = subprocess.run([str(exe)] + sys.argv[1:])
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
