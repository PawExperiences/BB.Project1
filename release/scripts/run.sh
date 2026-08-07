#!/bin/sh
# run.sh — serve the Space Invaders game over a local HTTP server and open it in the browser.
# Use when the browser blocks ES module imports from file:// URLs.
# Usage: sh release/scripts/run.sh [PORT]
set -e

PORT="${1:-8080}"

# Navigate to repo root (two levels up from release/scripts/)
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/../.." && pwd)
cd "$REPO_ROOT"

echo "Serving $REPO_ROOT on http://localhost:${PORT}/"
echo "Press Ctrl+C to stop."

# Try python3 first, then python
if command -v python3 > /dev/null 2>&1; then
  PY=python3
elif command -v python > /dev/null 2>&1; then
  PY=python
else
  echo "ERROR: python3 or python is required to run the local server."
  exit 1
fi

# Open browser after a short delay (best-effort)
(sleep 1 && {
  if command -v xdg-open > /dev/null 2>&1; then
    xdg-open "http://localhost:${PORT}/index.html"
  elif command -v open > /dev/null 2>&1; then
    open "http://localhost:${PORT}/index.html"
  fi
}) &

exec $PY -m http.server "$PORT"
