#!/usr/bin/env python3
"""run.py -- Open index.html in the default browser via a file:// URL.
Run from the repository root. No server required."""
import os
import sys
import webbrowser

def main():
    index = os.path.abspath("index.html")
    if not os.path.isfile(index):
        print("ERROR: index.html not found in the current directory.", file=sys.stderr)
        print("Run this script from the repository root.", file=sys.stderr)
        sys.exit(1)
    url = "file://" + index.replace("\\", "/")
    print(f"[run] Opening {url}")
    webbrowser.open(url)
    print("[run] Game launched in default browser.")

if __name__ == "__main__":
    main()
