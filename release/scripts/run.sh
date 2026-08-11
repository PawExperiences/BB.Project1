#!/bin/sh
# Serve the built static site from dist/ for local review.
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "${SCRIPT_DIR}/../.." && pwd)
DIST_DIR="${REPO_ROOT}/dist"
PORT="${PORT:-4321}"

if [ ! -d "${DIST_DIR}" ]; then
  echo "dist/ not found. Run release/scripts/release.sh (or npm ci && npm run build) first."
  exit 1
fi

echo "Serving ${DIST_DIR} at http://0.0.0.0:${PORT}/"

if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "${PORT}" --directory "${DIST_DIR}" --bind 0.0.0.0
elif command -v python >/dev/null 2>&1; then
  exec python -m http.server "${PORT}" --directory "${DIST_DIR}" --bind 0.0.0.0
elif command -v npx >/dev/null 2>&1; then
  exec npx --yes astro preview --root "${REPO_ROOT}" --host 0.0.0.0 --port "${PORT}"
else
  echo "No python3, python, or npx found to serve dist/. Install one of these and retry."
  exit 1
fi
