#!/usr/bin/env sh
# run.sh — build (if needed) and launch the prime_tester executable.
set -eu

BUILD_DIR="build"
EXE="${BUILD_DIR}/prime_tester"

if [ ! -f "${EXE}" ]; then
  echo "Executable not found — building now..."
  mkdir -p "${BUILD_DIR}"
  cmake -B "${BUILD_DIR}"
  cmake --build "${BUILD_DIR}" --config Release
fi

if [ ! -f "${EXE}" ]; then
  echo "ERROR: could not locate ${EXE} after build." >&2
  exit 1
fi

echo "+ ${EXE} $*"
exec "${EXE}" "$@"
