#!/usr/bin/env python3
"""Run script for e2e standup poster.
Builds the app if needed, then serves the built dist/ folder locally
via 'vite preview' so a maintainer can smoke-test the release artifact."""
import os
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
DIST_DIR = REPO_ROOT / "dist"
PORT = os.environ.get("PORT", "4173")


def run(cmd, **kwargs):
    print("+ " + " ".join(cmd))
    return subprocess.run(cmd, cwd=str(REPO_ROOT), check=True, **kwargs)


def main():
    if not (DIST_DIR / "index.html").exists():
        print("dist/index.html not found, building first")
        run(["npm", "ci"])
        run(["npm", "run", "build"])
    print("== Serving dist/ at http://localhost:" + PORT + " (Ctrl+C to stop) ==")
    run(["npx", "--yes", "vite", "preview", "--outDir", "dist", "--port", PORT])


if __name__ == "__main__":
    main()
