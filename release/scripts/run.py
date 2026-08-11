#!/usr/bin/env python3
"""Run the factorlib CLI (console script).

Installs factorlib from this checkout in editable mode if it is not already
installed, then runs `factorlib` with any arguments given (defaults to
"12 18 7" as a demo).

Usage: python3 release/scripts/run.py [INT ...]
"""
from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]


def ensure_installed():
    check = subprocess.run([sys.executable, "-c", "import factorlib"], capture_output=True)
    if check.returncode != 0:
        print("factorlib is not installed; installing in editable mode from this checkout...")
        subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "-e", str(REPO_ROOT)], check=True)
    else:
        print("factorlib is already installed.")


def find_console_script():
    found = shutil.which("factorlib")
    if found:
        return found
    bin_dir = Path(sys.executable).parent
    if sys.platform == "win32":
        candidate = bin_dir / "factorlib.exe"
    else:
        candidate = bin_dir / "factorlib"
    if candidate.exists():
        return str(candidate)
    return "factorlib"


def main():
    ensure_installed()
    args = sys.argv[1:] if len(sys.argv) > 1 else ["12", "18", "7"]
    exe = find_console_script()
    print("==> " + exe + " " + " ".join(args))
    result = subprocess.run([exe] + args)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
