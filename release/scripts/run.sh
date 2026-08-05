#!/bin/sh
# run.sh — starts a local HTTP server on port 8080 serving the repo root.
# Use when testing over http:// (e.g. DevTools profiling); file:// still works without this.
set -eu

PORT=8080

# Move to repo root
cd "$(dirname "$0")/../.."
echo "Serving e2e space invaders from: $(pwd)"
echo "Open http://localhost:${PORT}/index.html in your browser."
echo "Press Ctrl+C to stop."
python3 -m http.server "$PORT"
