#!/usr/bin/env sh
# run.sh -- Serve the game locally on http://localhost:8080 and open it.
# Run from the repository root. Requires Python 3 (for the server) and
# xdg-open / open / start depending on OS.
set -e

PORT=8080
URL="http://localhost:${PORT}/index.html"

# Resolve repo root (two levels up from release/scripts/)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

cd "${REPO_ROOT}"
echo "Serving ${REPO_ROOT} on ${URL}"

python3 -m http.server ${PORT} &
SERVER_PID=$!
echo "Server PID: ${SERVER_PID}"
sleep 1

# Open in default browser (cross-platform best-effort)
if command -v xdg-open > /dev/null 2>&1; then
  xdg-open "${URL}"
elif command -v open > /dev/null 2>&1; then
  open "${URL}"
elif command -v start > /dev/null 2>&1; then
  start "${URL}"
else
  echo "Could not detect a browser opener. Open manually: ${URL}"
fi

echo "Press Ctrl+C to stop."
wait ${SERVER_PID}
