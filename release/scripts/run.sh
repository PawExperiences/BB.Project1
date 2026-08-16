#!/bin/sh
# Run the built prime_tester CLI, building it first if needed.
# Usage: sh release/scripts/run.sh [prime_tester args...]
set -e

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
BUILD_DIR=${BUILD_DIR:-build}
BINARY="$REPO_ROOT/$BUILD_DIR/prime_tester"

if [ ! -x "$BINARY" ]; then
  if [ ! -f "$REPO_ROOT/CMakeLists.txt" ]; then
    echo "no CMakeLists.txt at $REPO_ROOT and no built binary at $BINARY -- nothing to run yet" >&2
    exit 1
  fi
  echo "$BINARY not found -- building it first"
  cmake -S "$REPO_ROOT" -B "$REPO_ROOT/$BUILD_DIR"
  cmake --build "$REPO_ROOT/$BUILD_DIR"
fi

echo "+ $BINARY $*"
exec "$BINARY" "$@"
