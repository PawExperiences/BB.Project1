#!/bin/sh
# run.sh — Serves the Space Invaders game on http://localhost:8080 and opens it in the browser.
# Use when you want to test via http://. The game also works directly from file://.
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PORT=8080
URL="http://localhost:${PORT}/index.html"

cd "$REPO_ROOT"
echo "Serving e2e space invaders from $REPO_ROOT"
echo "Opening $URL ..."
echo "Press Ctrl+C to stop."

# Open browser after a short delay
(sleep 1 && (
  if command -v xdg-open > /dev/null 2>&1; then xdg-open "$URL"
  elif command -v open > /dev/null 2>&1; then open "$URL"
  else echo "Open $URL in your browser."
  fi
)) &

python3 -m http.server $PORT
