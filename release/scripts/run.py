#!/usr/bin/env python3
"""Builds (if needed) and starts the todo-api server.
Run this to serve the app locally or in a deployment environment; it
listens on $PORT (default 3000), per the app's own fallback logic."""
import os
import subprocess
import sys
from pathlib import Path


def main():
    if not Path("dist").is_dir():
        print("==> No build output found, building first")
        subprocess.run(["npm", "run", "build"], check=True)

    port = os.environ.get("PORT", "3000")
    print(f"==> Starting todo-api on port {port}")
    os.execvp("npm", ["npm", "start"])


if __name__ == "__main__":
    sys.exit(main())
