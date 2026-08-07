#!/bin/sh
# run.sh -- locate and launch the prime_tester binary.
# Forwards all arguments to the binary. Run after `cmake --build build`.
# Usage: sh release/scripts/run.sh [numbers or tokens]
set -eu

BINARY=''
for candidate in build/prime_tester build/prime_tester.exe build/Release/prime_tester.exe build/Debug/prime_tester.exe; do
    if [ -f "$candidate" ]; then
        BINARY="$candidate"
        break
    fi
done

if [ -z "$BINARY" ]; then
    printf 'ERROR: prime_tester binary not found. Run `cmake -B build && cmake --build build` first.\n' >&2
    exit 1
fi

printf '[run.sh] Launching: %s %s\n' "$BINARY" "$*"
exec "$BINARY" "$@"
