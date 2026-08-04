#!/usr/bin/env sh
# run.sh -- open index.html in the default browser via file:// URL.
# Run from the directory containing index.html. No server is started.
set -eu

if [ ! -f "index.html" ]; then
  echo "ERROR: index.html not found in $(pwd)"
  exit 1
fi

ABS_PATH="$(cd "$(dirname "index.html")" && pwd)/index.html"
URL="file://${ABS_PATH}"

echo "[run.sh] Opening ${URL}"

if command -v xdg-open > /dev/null 2>&1; then
  xdg-open "${URL}"
elif command -v open > /dev/null 2>&1; then
  open "${URL}"
else
  echo "  Could not detect a browser launcher. Open this URL manually: ${URL}"
  exit 1
fi

echo "[run.sh] Done."
