#!/usr/bin/env python3
# Runs caltool: uses the published binary in out/ if present, otherwise
# falls back to 'dotnet run'. Pass <year> <month> to print a specific month.
import os
import platform
import subprocess
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(os.path.dirname(SCRIPT_DIR))
PUBLISH_DIR = os.path.join(PROJECT_DIR, "out")
BINARY_NAME = "caltool.exe" if platform.system() == "Windows" else "caltool"
BINARY_PATH = os.path.join(PUBLISH_DIR, BINARY_NAME)


def main():
    args = sys.argv[1:]
    if os.path.isfile(BINARY_PATH):
        print("[run] Using published binary: " + BINARY_PATH)
        cmd = [BINARY_PATH] + args
    else:
        print("[run] No published binary found in 'out/'; falling back to 'dotnet run'")
        cmd = ["dotnet", "run", "--project", os.path.join(PROJECT_DIR, "caltool.csproj")]
        if args:
            cmd = cmd + ["--"] + args
    print("[run] $ " + " ".join(cmd))
    result = subprocess.run(cmd, cwd=PROJECT_DIR)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
