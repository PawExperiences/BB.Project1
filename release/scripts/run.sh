#!/bin/sh
# run.sh - serve the Space Invaders game locally and open it in a browser.
#
# WHAT IT DOES
#   Starts a read-only static file server (Python's standard-library
#   http.server) rooted at the repository root and opens
#   http://localhost:<port>/index.html.  Serving over http:// is what makes the
#   ES module imports work: Chrome and Edge refuse <script type="module">
#   imports from a file:// origin because the origin is null.
#
# WHEN TO RUN IT
#   Whenever you want to play or smoke-test the game: the manual verification
#   step of the release runbook, or after unzipping the release artifact.
#   Ctrl-C stops the server.
#
# It writes nothing and serves only.  Idempotent: if something already answers
# on the port it reports that and exits instead of starting a second server.

set -eu

PORT=8080
OPEN_BROWSER=1

say() {
  printf '[run] %s\n' "$*"
}

usage() {
  printf '%s\n' "Usage: run.sh [--port N] [--no-browser]"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --port) PORT="${2:-}"; shift 2 ;;
    --no-browser) OPEN_BROWSER=0; shift ;;
    -h|--help) usage; exit 0 ;;
    *) say "unknown option: $1"; usage; exit 1 ;;
  esac
done

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)

if [ ! -f "$ROOT/index.html" ]; then
  say "index.html was not found in $ROOT"
  say "run this from the repository checkout (release/scripts/run.sh)"
  exit 1
fi

PY=""
for candidate in python3 python; do
  if command -v "$candidate" >/dev/null 2>&1; then
    PY="$candidate"
    break
  fi
done

if [ -z "$PY" ]; then
  say "no python interpreter found - cannot start a local server."
  say "install Python 3, or open $ROOT/index.html in a browser that permits"
  say "ES module imports from file:// origins."
  exit 1
fi

URL="http://localhost:$PORT/index.html"

BUSY=0
if "$PY" -c "import socket,sys;s=socket.socket();s.settimeout(0.5);r=s.connect_ex(('127.0.0.1',int(sys.argv[1])));s.close();sys.exit(0 if r==0 else 1)" "$PORT"; then
  BUSY=1
fi

if [ "$BUSY" -eq 1 ]; then
  say "port $PORT is already serving - not starting a second server"
  say "open $URL"
  exit 0
fi

open_url() {
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$1" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    open "$1" >/dev/null 2>&1 || true
  else
    say "open $1 in your browser"
  fi
}

say "serving $ROOT at $URL"
say "controls: ENTER starts and restarts, Left/Right or A/D move, Space fires"
say "press Ctrl-C here to stop the server"

if [ "$OPEN_BROWSER" -eq 1 ]; then
  ( sleep 1; open_url "$URL" ) &
fi

cd "$ROOT"
exec "$PY" -m http.server "$PORT" --bind 127.0.0.1
