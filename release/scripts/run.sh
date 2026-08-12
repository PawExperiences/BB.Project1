#!/bin/sh
# Serves the built standup-poster app using Vite's preview server.
# Run this AFTER `npm run build` has produced dist/, to smoke-test the
# production build locally before/after release.
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
cd "$REPO_ROOT"

PORT="${PORT:-4173}"

if [ ! -f dist/index.html ]; then
  echo "ERROR: dist/index.html not found. Run 'npm ci && npm run build' first." >&2
  exit 1
fi

echo "-- Serving dist/ with 'vite preview' on port $PORT --"
npx vite preview --outDir dist --port "$PORT"
