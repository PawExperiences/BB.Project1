#!/usr/bin/env python3
"""Open the built e2e-space-invaders-cc game directly from disk (file://),
matching the project's no-server, no-build-step design. Idempotent: just
opens a browser tab, no state is changed.
"""
import sys
import webbrowser
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]
INDEX_HTML = REPO_ROOT / "index.html"


def main():
    if not INDEX_HTML.is_file():
        print("ERROR: {0} not found. Run this from a checkout that contains index.html.".format(INDEX_HTML))
        sys.exit(1)
    url = INDEX_HTML.resolve().as_uri()
    print("Opening {0} in the default browser (file:// -- no server needed)".format(url))
    webbrowser.open(url)


if __name__ == "__main__":
    main()
