#!/bin/sh
# release/scripts/run.sh
# Purpose: build prime_tester if it hasn't been built yet, then run it,
# forwarding all CLI arguments and stdin unchanged. Use this for local/manual
# runs of the shipped CLI (argv mode, stdin mode, or --upto N mode).
# Usage: sh release/scripts/run.sh [args...]
#        printf '2\n4\n17\n' | sh release/scripts/run.sh
set -eu

BUILD_DIR="build"
find_bin() {
  for c in "$BUILD_DIR/prime_tester" "$BUILD_DIR/Release/prime_tester" "$BUILD_DIR/Release/prime_tester.exe" "$BUILD_DIR/prime_tester.exe"; do
    if [ -f "$c" ]; then echo "$c"; return 0; fi
  done
  return 1
}

BIN="$(find_bin || true)"
if [ -z "$BIN" ]; then
  echo "No build found under $BUILD_DIR; configuring and building first." >&2
  cmake -B "$BUILD_DIR"
  cmake --build "$BUILD_DIR"
  BIN="$(find_bin || true)"
fi
if [ -z "$BIN" ]; then
  echo "ERROR: build succeeded but executable was not found under $BUILD_DIR" >&2
  exit 1
fi

echo "Running: $BIN $*" >&2
exec "$BIN" "$@"
