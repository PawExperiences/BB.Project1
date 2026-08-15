#!/bin/sh
# Run script for e2e standup poster.
# Builds the app if needed, then serves the built dist/ folder locally
# via 'vite preview' so a maintainer can smoke-test the release artifact.
set -eu

REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
PORT=${PORT:-4173}
cd "$REPO_ROOT"

if [ ! -f "dist/index.html" ]; then
  echo "dist/index.html not found, building first"
  echo "+ npm ci"
  npm ci
  echo "+ npm run build"
  npm run build
fi

echo "== Serving dist/ at http://localhost:$PORT (Ctrl+C to stop) =="
echo "+ npx --yes vite preview --outDir dist --port $PORT"
npx --yes vite preview --outDir dist --port "$PORT"
