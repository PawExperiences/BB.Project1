#!/usr/bin/env python3
"""Run the factorlib CLI against the arguments given on the command line.

Installs factorlib in editable mode if the `factorlib` console script is
not already on PATH, then invokes it with the given arguments (default:
12 18 7 if none are given) so a maintainer can see the CLI's real output.
"""
import shutil
import subprocess
import sys


def ensure_installed():
    if shutil.which("factorlib") is None:
        print("factorlib console script not found; installing in editable mode...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-e", "."], check=True)


def main():
    ensure_installed()
    args = sys.argv[1:] or ["12", "18", "7"]
    cmd = ["factorlib"] + args
    print("+ " + " ".join(cmd))
    result = subprocess.run(cmd)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
