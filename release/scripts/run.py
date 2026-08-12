#!/usr/bin/env python3
"""Serves the built standup-poster app using Vite's preview server.
Run this AFTER `npm run build` has produced dist/, to smoke-test the
production build locally before/after release.
"""
import os
import pathlib
import subprocess
import sys

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
DIST = REPO_ROOT / "dist"
PORT = os.environ.get("PORT", "4173")


def main():
    if not (DIST / "index.html").exists():
        sys.exit("ERROR: dist/index.html not found. Run 'npm ci && npm run build' first.")
    print("-- Serving " + str(DIST) + " with 'vite preview' on port " + PORT + " --")
    subprocess.run(
        ["npx", "vite", "preview", "--outDir", "dist", "--port", PORT],
        cwd=REPO_ROOT,
        check=True,
    )


if __name__ == "__main__":
    main()
