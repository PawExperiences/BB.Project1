#!/usr/bin/env python3
"""Installs factorlib (editable, if not already installed) and runs its CLI with the given arguments.

Usage: python run.py <int> [<int> ...]
If no arguments are given, runs a smoke-test call: factorlib 12 17.
"""
import importlib.util
import pathlib
import shutil
import subprocess
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]


def ensure_installed():
    if importlib.util.find_spec("factorlib") is None:
        print("factorlib is not installed; installing in editable mode ...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-e", str(REPO_ROOT)], check=True)
    else:
        print("factorlib is already installed")


def main():
    ensure_installed()
    args = sys.argv[1:] if len(sys.argv) > 1 else ["12", "17"]
    factorlib_cmd = shutil.which("factorlib")
    if factorlib_cmd is None:
        print("error: the factorlib console script was not found on PATH after install", file=sys.stderr)
        sys.exit(1)
    print("+ factorlib " + " ".join(args))
    result = subprocess.run([factorlib_cmd] + args)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
