#!/usr/bin/env sh
# run.sh — serves the game over localhost:8080.
# Use when the browser blocks ES module imports from file:// URLs.
# The game also opens directly from disk (no server) in most browsers.
set -e

PORT=8080
cd "$(dirname "$0")/../.."

echo "Serving e2e Space Invaders at http://127.0.0.1:${PORT}/index.html"
echo "Press Ctrl+C to stop."

# Try python3 first, fall back to python
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server ${PORT} --bind 127.0.0.1
elif command -v python >/dev/null 2>&1; then
  python -m http.server ${PORT} --bind 127.0.0.1
else
  echo "ERROR: python3 or python required to run the dev server." >&2
  exit 1
fi
