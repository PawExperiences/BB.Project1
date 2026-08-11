#!/bin/sh
# Serve the built e2e quote page (dist/) locally for a smoke check.
# Run this after `npm run build` (or release/scripts/release.sh) to
# view the shipped static site at http://127.0.0.1:4173 (or $PORT).
set -e

REPO_ROOT=$(git rev-parse --show-toplevel)
DIST_DIR="$REPO_ROOT/dist"
PORT="${PORT:-4173}"

if [ ! -f "$DIST_DIR/index.html" ]; then
  echo "ERROR: $DIST_DIR/index.html not found. Run 'npm ci && npm run build' first."
  exit 1
fi

echo "Serving $DIST_DIR at http://127.0.0.1:$PORT (Ctrl+C to stop)"
cd "$DIST_DIR"
if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "$PORT" --bind 127.0.0.1
elif command -v python >/dev/null 2>&1; then
  exec python -m http.server "$PORT" --bind 127.0.0.1
else
  echo "No python interpreter found to run a local server."
  echo "The site is fully static with zero runtime network requests, so you can"
  echo "also just open $DIST_DIR/index.html directly in a browser instead."
  exit 1
fi
