#!/usr/bin/env sh
# run.sh -- Open index.html in the default browser via a file:// URL.
# Run from the repository root. No server required.

INDEX="$(pwd)/index.html"

if [ ! -f "${INDEX}" ]; then
  echo "ERROR: index.html not found in the current directory." >&2
  echo "Run this script from the repository root." >&2
  exit 1
fi

URL="file://${INDEX}"
echo "[run] Opening ${URL}"

if command -v xdg-open > /dev/null 2>&1; then
  xdg-open "${URL}"
elif command -v open > /dev/null 2>&1; then
  open "${URL}"
elif command -v start > /dev/null 2>&1; then
  start "${URL}"
else
  echo "Could not detect a browser launcher. Open this URL manually: ${URL}"
  exit 1
fi

echo "[run] Game launched in default browser."
