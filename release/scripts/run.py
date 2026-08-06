#!/usr/bin/env python3
"""run.py — build (if needed) and launch the prime_tester executable."""
import subprocess, sys, os, platform

BUILD_DIR = "build"

def find_exe():
    candidates = [os.path.join(BUILD_DIR, "prime_tester")]
    if platform.system() == "Windows":
        candidates = [
            os.path.join(BUILD_DIR, "Release", "prime_tester.exe"),
            os.path.join(BUILD_DIR, "prime_tester.exe"),
        ] + candidates
    return next((c for c in candidates if os.path.isfile(c)), None)

def main():
    exe = find_exe()
    if not exe:
        print("Executable not found — building now...")
        os.makedirs(BUILD_DIR, exist_ok=True)
        subprocess.run(["cmake", "-B", BUILD_DIR], check=True)
        subprocess.run(["cmake", "--build", BUILD_DIR, "--config", "Release"], check=True)
        exe = find_exe()
    if not exe:
        print("ERROR: could not locate prime_tester after build.", file=sys.stderr)
        sys.exit(1)
    args = sys.argv[1:]
    cmd = [exe] + args
    print(f"+ {' '.join(cmd)}")
    result = subprocess.run(cmd)
    sys.exit(result.returncode)

if __name__ == "__main__":
    main()
