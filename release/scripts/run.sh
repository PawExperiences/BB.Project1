#!/bin/sh
# run.sh -- build (if needed) and run the prime_tester console app.
#
# WHAT IT DOES: locates build/prime_tester relative to the repository root,
# configures and builds it with CMake if it is missing (unless --no-build), then
# runs it with every remaining argument passed straight through and exits with
# the app's own exit code.
#
# WHEN TO RUN: any time you want to exercise the app -- a smoke check of a fresh
# clone or of an unpacked release artefact.
#
#   ./release/scripts/run.sh 7 8 1 -3 2
#   printf '11\n12\n' | ./release/scripts/run.sh
#   ./release/scripts/run.sh --upto 30
#
# Script options must come first and are consumed before the app's arguments:
#   --no-build        fail instead of building when the executable is missing
#   --build-dir DIR   cmake build directory (default build, or $BUILD_DIR)
#   --                stop option parsing; everything after goes to the app
#
# POSIX sh. Idempotent: an existing build is reused, never rebuilt from scratch.
# All progress messages go to stderr so the app's stdout stays pipeable.

set -eu

EXE_NAME="prime_tester"
BUILD_DIR="${BUILD_DIR:-build}"
NO_BUILD=0

note() { printf '%s\n' "$*" >&2; }
fail() { printf 'error: %s\n' "$*" >&2; exit 1; }

while [ $# -gt 0 ]; do
    case "$1" in
        --no-build)  NO_BUILD=1; shift ;;
        --build-dir) BUILD_DIR="${2:?--build-dir needs a value}"; shift 2 ;;
        --)          shift; break ;;
        *)           break ;;
    esac
done

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
cd "$ROOT"
note "==> repository: $ROOT"

find_exe() {
    for cand in \
        "$BUILD_DIR/$EXE_NAME" \
        "$BUILD_DIR/Release/$EXE_NAME" \
        "$BUILD_DIR/$EXE_NAME.exe" \
        "$BUILD_DIR/Release/$EXE_NAME.exe"
    do
        if [ -f "$cand" ]; then printf '%s' "$cand"; return 0; fi
    done
    return 1
}

EXE=$(find_exe || true)

if [ -z "$EXE" ]; then
    if [ "$NO_BUILD" -eq 1 ]; then
        fail "$EXE_NAME not found under $BUILD_DIR and --no-build was given"
    fi
    note "==> $EXE_NAME not found under $BUILD_DIR; building it now"
    note "    + cmake -B $BUILD_DIR -DCMAKE_BUILD_TYPE=Release"
    cmake -B "$BUILD_DIR" -DCMAKE_BUILD_TYPE=Release >&2
    note "    + cmake --build $BUILD_DIR"
    cmake --build "$BUILD_DIR" >&2
    EXE=$(find_exe || true)
    [ -n "$EXE" ] || fail "build finished but $EXE_NAME is still not under $BUILD_DIR"
else
    note "==> reusing existing build"
fi

note "==> running: $EXE $*"
exec "$EXE" "$@"
