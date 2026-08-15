#!/bin/sh
# Starts the built e2e ticket mirror app with `next start` (run `npm run build` first).
set -e

PORT="${PORT:-3000}"

if [ ! -d ".next" ]; then
  echo "No .next build found. Run 'npm run build' (or release/scripts/release.sh) first."
  exit 1
fi

echo "Starting e2e ticket mirror on port $PORT ..."
npx --yes next start -p "$PORT"
