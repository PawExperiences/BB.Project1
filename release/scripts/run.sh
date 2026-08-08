#!/usr/bin/env sh
# run.sh — Serve the game locally on port 8080.
# Run from the repository root. Open http://localhost:8080/index.html in your browser.
# This is optional: the game also works directly via a file:// URL.
set -e

PORT=8080
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if ! command -v python3 > /dev/null 2>&1; then
  echo "[error] python3 is required to run the local server." >&2
  exit 1
fi

echo "[run] Serving from ${ROOT} on http://localhost:${PORT}/index.html"
echo "[run] Press Ctrl+C to stop."
cd "${ROOT}"
python3 -m http.server ${PORT}
