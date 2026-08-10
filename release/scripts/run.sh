#!/bin/sh
# Serve the built static game (index.html, game.js, etc.) over HTTP for local testing.
set -eu

PORT="${PORT:-8000}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)

if [ ! -f "$ROOT/index.html" ]; then
    ROOT=$(pwd)
fi

cd "$ROOT"
echo "serving $ROOT at http://127.0.0.1:$PORT/index.html (Ctrl+C to stop)"
echo "the game also runs directly via file://$ROOT/index.html"

if command -v python3 >/dev/null 2>&1; then
    exec python3 -m http.server "$PORT" --bind 127.0.0.1
elif command -v python >/dev/null 2>&1; then
    exec python -m SimpleHTTPServer "$PORT"
else
    echo "python3 or python is required to serve the game locally" >&2
    exit 1
fi
