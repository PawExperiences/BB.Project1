#!/usr/bin/env python3
"""run.py -- Build (if needed) and run the e2e prime tester console app.
Pass any arguments after -- to forward them to the binary.
Example: python release/scripts/run.py -- 97
"""
import subprocess
import sys
import os
import pathlib

BUILD_DIR = "build"
BINARY_NAME = "prime_tester"

def main():
    repo_root = pathlib.Path(__file__).resolve().parents[2]
    os.chdir(repo_root)
    print(f"[run.py] Working directory: {repo_root}")

    # Build if binary is missing
    built = False
    for candidate in [
        pathlib.Path(BUILD_DIR) / BINARY_NAME,
        pathlib.Path(BUILD_DIR) / "Release" / BINARY_NAME,
        pathlib.Path(BUILD_DIR) / f"{BINARY_NAME}.exe",
        pathlib.Path(BUILD_DIR) / "Release" / f"{BINARY_NAME}.exe",
    ]:
        if candidate.exists():
            binary = str(candidate)
            built = True
            break

    if not built:
        print("[run.py] Binary not found -- building with CMake...")
        subprocess.run(["cmake", "-B", BUILD_DIR, "-S", ".", "-DCMAKE_BUILD_TYPE=Release"], check=True)
        subprocess.run(["cmake", "--build", BUILD_DIR, "--config", "Release"], check=True)
        for candidate in [
            pathlib.Path(BUILD_DIR) / BINARY_NAME,
            pathlib.Path(BUILD_DIR) / "Release" / BINARY_NAME,
            pathlib.Path(BUILD_DIR) / f"{BINARY_NAME}.exe",
            pathlib.Path(BUILD_DIR) / "Release" / f"{BINARY_NAME}.exe",
        ]:
            if candidate.exists():
                binary = str(candidate)
                built = True
                break

    if not built:
        print(f"[run.py] ERROR: Could not locate binary '{BINARY_NAME}' after build.")
        sys.exit(1)

    # Forward extra args after '--'
    extra = []
    if "--" in sys.argv:
        extra = sys.argv[sys.argv.index("--") + 1:]

    print(f"[run.py] Running: {binary} {' '.join(extra)}")
    result = subprocess.run([binary] + extra)
    sys.exit(result.returncode)

if __name__ == "__main__":
    main()
