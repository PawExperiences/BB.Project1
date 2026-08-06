#!/usr/bin/env sh
# run.sh – Build (if needed) and run the prime_tester console app.
# Usage: sh release/scripts/run.sh [prime_tester args...]
# Example: sh release/scripts/run.sh --range 1 100
set -eu

BUILD_DIR="build"
BINARY="${BUILD_DIR}/prime_tester"

if [ ! -f "${BINARY}" ]; then
  echo "Binary not found -- building first..."
  cmake -S . -B "${BUILD_DIR}" -DCMAKE_BUILD_TYPE=Release
  cmake --build "${BUILD_DIR}"
else
  echo "Using existing binary: ${BINARY}"
fi

echo ">>> ${BINARY} $*"
exec "${BINARY}" "$@"
