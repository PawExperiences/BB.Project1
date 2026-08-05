#!/usr/bin/env sh
# run.sh — Serve the game locally on http://localhost:8080.
# Use when file:// ES module loading is blocked by browser security policy.
# Run from the repository root.
set -e

PORT=8080
URL="http://localhost:${PORT}/index.html"

echo "[run.sh] Serving e2e Space Invaders at ${URL}"
echo "  Press Ctrl+C to stop."

# Change to repo root (two levels up from release/scripts/)
cd "$(dirname "$0")/../.."

# Prefer python3, fall back to python, then npx serve
if command -v python3 > /dev/null 2>&1; then
  python3 -m http.server ${PORT}
elif command -v python > /dev/null 2>&1; then
  python -m http.server ${PORT}
else
  echo "ERROR: python3 or python is required to run the local server." >&2
  exit 1
fi
