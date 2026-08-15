#!/usr/bin/env python3
"""Starts the built e2e ticket mirror app with `next start` (run `npm run build` first)."""
import os
import subprocess
import sys

PORT = os.environ.get("PORT", "3000")


def main():
    if not os.path.isdir(".next"):
        print("No .next build found. Run 'npm run build' (or release/scripts/release.py) first.")
        sys.exit(1)
    print("Starting e2e ticket mirror on port " + PORT + " ...")
    subprocess.run(["npx", "--yes", "next", "start", "-p", PORT], check=True)


if __name__ == "__main__":
    main()
