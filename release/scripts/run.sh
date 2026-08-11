#!/bin/sh
# run.sh - build (if needed) and run the prime_tester CLI, forwarding all arguments.
set -eu

BUILD_DIR="${BUILD_DIR:-build}"
ARTIFACT="${BUILD_DIR}/prime_tester"

if [ ! -x "${ARTIFACT}" ]; then
  echo "==> No build found at ${ARTIFACT}; configuring and building first"
  cmake -B "${BUILD_DIR}"
  cmake --build "${BUILD_DIR}"
fi

echo "==> Running ${ARTIFACT} $*"
exec "${ARTIFACT}" "$@"
