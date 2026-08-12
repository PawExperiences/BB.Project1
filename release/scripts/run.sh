#!/bin/sh
# release/scripts/run.sh
# Runs the e2e-cli-greeter CLI, forwarding all arguments to greet.js.
# Usage: sh release/scripts/run.sh [NAME...]   (or: sh release/scripts/run.sh --help)
set -e
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
GREET_JS="$REPO_ROOT/greet.js"

if [ ! -f "$GREET_JS" ]; then
  echo "ERROR: $GREET_JS not found." >&2
  exit 1
fi

echo "-> node $GREET_JS $*"
exec node "$GREET_JS" "$@"
