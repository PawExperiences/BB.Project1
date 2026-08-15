#!/bin/sh
set -eu
# Open the built e2e-space-invaders-cc game directly from disk (file://),
# matching the project's no-server, no-build-step design. Idempotent: just
# opens a browser tab, no state is changed.

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
INDEX_HTML="$REPO_ROOT/index.html"

if [ ! -f "$INDEX_HTML" ]; then
  echo "ERROR: $INDEX_HTML not found. Run this from a checkout that contains index.html." >&2
  exit 1
fi

echo "Opening file://$INDEX_HTML in the default browser (file:// -- no server needed)"

if command -v xdg-open >/dev/null 2>&1; then
  xdg-open "$INDEX_HTML"
elif command -v open >/dev/null 2>&1; then
  open "$INDEX_HTML"
else
  echo "Could not detect a way to open a browser automatically. Open this file manually:"
  echo "file://$INDEX_HTML"
fi
