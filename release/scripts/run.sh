#!/usr/bin/env sh
# run.sh – Serve e2e Space Invaders locally and open it in the browser.
# Run from the repository root.
# Starts Python's built-in HTTP server on port 8080.
# Press Ctrl+C to stop.
set -e

PORT=8080
URL="http://localhost:${PORT}/index.html"

# Change to repo root (two levels up from release/scripts/)
cd "$(dirname "$0")/../.."

echo "[run] Serving at ${URL}"
echo "[run] Press Ctrl+C to stop."

# Open browser in background after 1s
(
  sleep 1
  if command -v xdg-open > /dev/null 2>&1; then
    xdg-open "${URL}"
  elif command -v open > /dev/null 2>&1; then
    open "${URL}"
  else
    echo "[run] Open ${URL} in your browser."
  fi
) &

python3 -m http.server "${PORT}"
