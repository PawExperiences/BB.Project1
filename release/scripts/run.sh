#!/bin/sh
# run.sh -- serves the game locally on http://localhost:8080 and opens it.
# Run from the repository root. Ctrl-C to stop. Requires Python 3.
set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PORT=8080
URL="http://localhost:${PORT}/index.html"

cd "${REPO_ROOT}"
echo "Serving on ${URL}  (Ctrl-C to stop)"
python3 -m http.server "${PORT}" &
SERVER_PID=$!
sleep 1

if command -v xdg-open > /dev/null 2>&1; then
  xdg-open "${URL}"
elif command -v open > /dev/null 2>&1; then
  open "${URL}"
else
  echo "Open your browser and navigate to ${URL}"
fi

wait "${SERVER_PID}"
