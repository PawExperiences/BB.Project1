#!/usr/bin/env python3
"""
run.py -- start Space Invaders 0.1.0.

WHAT IT DOES: opens the game's index.html in the default web browser via
a file:// URL. The game is fully static (no server, no build step, no
dependencies), so this is all that is needed to play.

WHEN TO RUN: any time you want to play or smoke-test the released game:
  python release/scripts/run.py
Standard library only.
"""

import sys
import webbrowser
from pathlib import Path


def main():
    root = Path(__file__).resolve().parent.parent.parent
    index = root / "index.html"
    if not index.is_file():
        print("ERROR: index.html not found at " + str(index))
        print("Run this script from a checkout (or unpacked zip) of the release.")
        sys.exit(1)
    url = index.as_uri()
    print("Opening " + url + " in the default browser ...")
    webbrowser.open(url)
    print("Controls: ENTER = start/advance scene, Arrow keys or A/D = move, Space = fire.")
    print("If the browser did not open, double-click index.html instead.")


if __name__ == "__main__":
    main()
