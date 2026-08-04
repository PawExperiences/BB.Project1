#!/usr/bin/env sh
# run.sh — serve e2e Space Invaders on localhost:8080.
# Usage: sh release/scripts/run.sh [port]
set -eu

PORT="${1:-8080}"

# Resolve repo root (two levels up from release/scripts/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "Serving ${REPO_ROOT} on http://localhost:${PORT}"
echo "Open http://localhost:${PORT}/index.html in your browser."
echo "Press Ctrl+C to stop."

cd "${REPO_ROOT}"
python3 -m http.server "${PORT}"
