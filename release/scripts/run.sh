#!/bin/sh
# run.sh -- Build (if needed) and launch prime_tester.
# Pass integers or tokens as arguments; they are forwarded to the executable.
set -e

ARTIFACT="build/prime_tester"

if [ ! -f "${ARTIFACT}" ]; then
  echo "[run.sh] Artifact not found -- building..." >&2
  cmake -B build -DCMAKE_BUILD_TYPE=Release
  cmake --build build --config Release
fi

echo "[run.sh] Launching: ${ARTIFACT} $*"
exec "${ARTIFACT}" "$@"
