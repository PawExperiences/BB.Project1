#!/bin/sh
# run.sh -- build (if necessary) and run prime_tester.
#
# Usage: sh release/scripts/run.sh -- 7 42 97
# Run from the repository root.

set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BUILD_DIR="${REPO_ROOT}/build"
EXE="${BUILD_DIR}/prime_tester"

# Strip leading '--' separator if present
if [ "$1" = "--" ]; then
  shift
fi

if [ ! -f "${EXE}" ]; then
  echo "[run] Building prime_tester ..."
  cmake -B "${BUILD_DIR}" "${REPO_ROOT}"
  cmake --build "${BUILD_DIR}"
  echo "[run] Build complete."
fi

echo "[run] Executing: ${EXE} $*"
exec "${EXE}" "$@"
