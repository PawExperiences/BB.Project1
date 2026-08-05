#!/bin/sh
# run.sh — serve the game locally on http://localhost:8080. Run from repo root.
set -e

PORT=8080
# Navigate to repo root (two levels up from release/scripts/)
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)

cd "$REPO_ROOT"
echo "Serving e2e Space Invaders from: $REPO_ROOT"
echo "Open: http://localhost:$PORT/index.html"
echo "Press Ctrl+C to stop."

# Use Python 3 if available, fall back to Python 2
if command -v python3 > /dev/null 2>&1; then
  python3 -m http.server $PORT
elif command -v python > /dev/null 2>&1; then
  python -m SimpleHTTPServer $PORT
else
  echo "ERROR: Python is required to run the dev server." >&2
  exit 1
fi
