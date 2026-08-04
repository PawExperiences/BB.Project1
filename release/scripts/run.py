#!/usr/bin/env python3
"""run.py — open index.html in the default browser via file:// URL.
Run from the directory containing index.html. No server is started."""
import pathlib
import webbrowser
import sys

def main():
    index = pathlib.Path("index.html").resolve()
    if not index.exists():
        print(f"ERROR: index.html not found in {pathlib.Path('.').resolve()}")
        sys.exit(1)
    url = index.as_uri()
    print(f"[run.py] Opening {url}")
    webbrowser.open(url)
    print("[run.py] Browser launched. Close this script whenever you are done.")

if __name__ == "__main__":
    main()
