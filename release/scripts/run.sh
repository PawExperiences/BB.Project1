#!/usr/bin/env sh
# run.sh — local HTTP server for e2e Space Invaders.
# Serves the repository root on http://localhost:8080/index.html.
# Run from the repository root. Press Ctrl+C to stop.
set -e

PORT=8080
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "[run.sh] Serving e2e Space Invaders at http://localhost:${PORT}/index.html"
echo "[run.sh] Press Ctrl+C to stop."

# Try Python 3, fall back to Python 2
if command -v python3 > /dev/null 2>&1; then
    python3 -m http.server "$PORT"
elif command -v python > /dev/null 2>&1; then
    python -m SimpleHTTPServer "$PORT"
else
    echo "[run.sh] ERROR: Python not found. Open index.html via file:// instead."
    exit 1
fi
