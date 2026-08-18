#!/bin/sh
# run.sh -- build (if needed) and run the prime_tester CLI, forwarding all
# arguments. Use it to quickly try the released binary:
#   ./release/scripts/run.sh 2 4 17
#   ./release/scripts/run.sh --upto 30
#   printf '2\n4\n17\n' | ./release/scripts/run.sh
# Exits with prime_tester's own exit status (1 if any bad token occurred).
set -eu

cd "$(dirname "$0")/../.."

if [ ! -f build/CMakeCache.txt ]; then
  echo "[run] configuring: cmake -B build"
  cmake -B build
fi
echo "[run] building: cmake --build build"
cmake --build build

EXE=""
for c in build/prime_tester build/prime_tester.exe \
         build/Debug/prime_tester.exe build/Release/prime_tester.exe \
         build/Debug/prime_tester build/Release/prime_tester; do
  if [ -f "$c" ]; then EXE="$c"; break; fi
done
if [ -z "$EXE" ]; then
  echo "[run] FAILED: prime_tester binary not found under build/" >&2
  exit 1
fi

echo "[run] starting: $EXE $*"
exec "$EXE" "$@"
