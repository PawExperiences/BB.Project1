#!/usr/bin/env python3
"""Run the mdpdf CLI against the bundled sample.md as a smoke test.

Installs mdpdf in editable mode if it is not already importable, converts
sample.md to sample.html, and prints where the file was written.
Run from the repository root. Idempotent: safe to re-run at any time.
"""
import importlib.util
import subprocess
import sys
from pathlib import Path

SAMPLE = Path("sample.md")
OUTPUT = Path("sample.html")


def run(cmd):
    print("+ " + " ".join(cmd))
    subprocess.run(cmd, check=True)


def main():
    if importlib.util.find_spec("mdpdf") is None:
        print("mdpdf is not installed; installing in editable mode")
        run([sys.executable, "-m", "pip", "install", "-e", "."])

    if not SAMPLE.exists():
        print("error: sample file not found at " + str(SAMPLE.resolve()), file=sys.stderr)
        sys.exit(1)

    run(["mdpdf", str(SAMPLE), "-o", str(OUTPUT)])
    print("wrote " + str(OUTPUT.resolve()))
    print("open it in a browser and use Print -> Save as PDF to export a PDF")


if __name__ == "__main__":
    main()
