#!/usr/bin/env sh
# run.sh — Serves the Space Invaders game on http://localhost:8080.
# NOTE: The game is also fully playable by opening index.html directly
# from the filesystem (file:// URL) — no server is required.
set -eu

PORT=8080
ROOT=$(cd "$(dirname "$0")/../.." && pwd)

echo "[run] Serving '$ROOT' at http://localhost:$PORT"
echo "[run] Open http://localhost:$PORT/index.html in your browser."
echo "[run] Press Ctrl+C to stop."

cd "$ROOT"

if command -v python3 > /dev/null 2>&1; then
  python3 -m http.server $PORT
elif command -v python > /dev/null 2>&1; then
  python -m SimpleHTTPServer $PORT
elif command -v npx > /dev/null 2>&1; then
  npx --yes serve -l $PORT .
else
  echo "[run] ERROR: no suitable HTTP server found (python3, python, or npx required)." >&2
  exit 1
fi
