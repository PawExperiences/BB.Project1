#!/usr/bin/env python3
"""Run script for e2e space invaders.
Opens index.html in the default system browser using a file:// URL.
Run from the repository root at any time — no server required."""
import os
import sys
import webbrowser

def main():
    index = os.path.abspath("index.html")
    if not os.path.isfile(index):
        print("ERROR: index.html not found. Run from the repository root.")
        sys.exit(1)
    url = "file:///" + index.replace(os.sep, "/")
    print(f"[run] Opening game in default browser: {url}")
    webbrowser.open(url)
    print("[run] Browser launched. No server process to manage.")

if __name__ == "__main__":
    main()
