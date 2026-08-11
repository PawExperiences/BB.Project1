#!/bin/sh
# Serve the built quote page locally for manual verification.
# Builds the site if dist/index.html is missing, then runs `astro preview` to serve dist/.
# Run this after release.sh, or any time you want to eyeball the built page before shipping.
set -e

DIST_DIR="dist"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-4321}"

if [ ! -f "$DIST_DIR/index.html" ]; then
  echo "$DIST_DIR/index.html not found; building first."
  npm ci
  npm run build
fi

echo "-- Serving $DIST_DIR at http://$HOST:$PORT (Ctrl+C to stop) --"
npx astro preview --host "$HOST" --port "$PORT"
