#!/bin/sh
# run.sh — serve the project over HTTP and open index.html in the browser.
# Serves on http://localhost:8080. Press Ctrl+C to stop.

PORT=8080
URL="http://localhost:${PORT}/index.html"

# Change to repo root (two levels up from release/scripts)
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT" || exit 1

echo "[run] Serving '${REPO_ROOT}' at ${URL}"
echo "[run] Press Ctrl+C to stop."

# Try python3 first, then python2 fallback
if command -v python3 >/dev/null 2>&1; then
  # Open browser after short delay
  (sleep 1 && (open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || true)) &
  python3 -m http.server $PORT
elif command -v python >/dev/null 2>&1; then
  (sleep 1 && (open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || true)) &
  python -m SimpleHTTPServer $PORT
elif command -v busybox >/dev/null 2>&1; then
  echo "[run] Using busybox httpd. Open ${URL} manually."
  busybox httpd -f -p $PORT
else
  echo "[run] No suitable HTTP server found. Open index.html directly via file:// URL."
  exit 1
fi
