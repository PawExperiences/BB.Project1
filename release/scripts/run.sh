#!/usr/bin/env sh
# Run script for e2e space invaders.
# Opens index.html in the default system browser via a file:// URL.
# Run from the repository root — no server required.
set -e

INDEX="$(pwd)/index.html"
if [ ! -f "$INDEX" ]; then
  echo "ERROR: index.html not found. Run from the repository root."
  exit 1
fi

URL="file://${INDEX}"
echo "[run] Opening game: ${URL}"

if command -v xdg-open > /dev/null 2>&1; then
  xdg-open "${URL}"
elif command -v open > /dev/null 2>&1; then
  open "${URL}"
else
  echo "ERROR: No browser opener found (tried xdg-open, open). Open ${URL} manually."
  exit 1
fi

echo "[run] Browser launched. No server process to manage."
