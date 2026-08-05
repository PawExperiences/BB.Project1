#!/usr/bin/env python3
"""run.py -- Build (if needed) and launch prime_tester.
Pass integers or tokens as arguments; they are forwarded to the executable."""
import subprocess
import sys
import os

ARTIFACT = os.path.join("build", "prime_tester")
if sys.platform == "win32":
    ARTIFACT = ARTIFACT + ".exe"

def run_cmd(cmd):
    print(f"[run.py] Running: {' '.join(cmd)}")
    result = subprocess.run(cmd)
    return result.returncode

def main():
    if not os.path.isfile(ARTIFACT):
        print("[run.py] Artifact not found -- building...", file=sys.stderr)
        rc = run_cmd(["cmake", "-B", "build", "-DCMAKE_BUILD_TYPE=Release"])
        if rc != 0:
            sys.exit(rc)
        rc = run_cmd(["cmake", "--build", "build", "--config", "Release"])
        if rc != 0:
            sys.exit(rc)
    user_args = sys.argv[1:]
    cmd = [ARTIFACT] + user_args
    print(f"[run.py] Launching: {' '.join(cmd)}")
    result = subprocess.run(cmd)
    sys.exit(result.returncode)

if __name__ == "__main__":
    main()
