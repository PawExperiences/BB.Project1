#!/usr/bin/env python3
"""Serve the built quote page locally for manual verification.
Builds the site if dist/index.html is missing, then runs `astro preview` to serve dist/.
Run this after release.py, or any time you want to eyeball the built page before shipping.
"""
import os
import subprocess
import sys

DIST_DIR = "dist"
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = os.environ.get("PORT", "4321")


def run(cmd):
    print("+ " + " ".join(cmd))
    subprocess.run(cmd, check=True)


def main():
    index_html = os.path.join(DIST_DIR, "index.html")
    if not os.path.isfile(index_html):
        print(index_html + " not found; building first.")
        run(["npm", "ci"])
        run(["npm", "run", "build"])

    print("-- Serving " + DIST_DIR + " at http://" + HOST + ":" + PORT + " (Ctrl+C to stop) --")
    subprocess.run(["npx", "astro", "preview", "--host", HOST, "--port", PORT])


if __name__ == "__main__":
    sys.exit(main() or 0)
