#!/usr/bin/env python3
"""run.py – Build (if needed) and run the prime_tester console app.
Usage: python release/scripts/run.py [prime_tester args...]
Example: python release/scripts/run.py --range 1 100"""
import subprocess
import sys
import os
import platform

BUILD_DIR = "build"
BINARY = os.path.join(BUILD_DIR, "prime_tester" + (".exe" if platform.system() == "Windows" else ""))

def run(cmd):
    print(f">>> {' '.join(cmd)}")
    result = subprocess.run(cmd)
    if result.returncode != 0:
        sys.exit(result.returncode)

def main():
    if not os.path.isfile(BINARY):
        print("Binary not found – building first...")
        run(["cmake", "-S", ".", "-B", BUILD_DIR, "-DCMAKE_BUILD_TYPE=Release"])
        run(["cmake", "--build", BUILD_DIR])
    else:
        print(f"Using existing binary: {BINARY}")
    args = sys.argv[1:]
    run([BINARY] + args)

if __name__ == "__main__":
    main()
