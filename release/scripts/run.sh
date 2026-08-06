#!/usr/bin/env sh
# run.sh -- Build (if needed) and run the e2e prime tester console app.
# Usage: sh release/scripts/run.sh [args to pass to the binary]
# Example: sh release/scripts/run.sh 97
set -e

BUILD_DIR="build"
BINARY_NAME="prime_tester"

cd "$(dirname "$0")/../.."
echo "[run.sh] Working directory: $(pwd)"

# Locate or build binary
BINARY=""
for CANDIDATE in \
  "$BUILD_DIR/$BINARY_NAME" \
  "$BUILD_DIR/Release/$BINARY_NAME" \
  "$BUILD_DIR/${BINARY_NAME}.exe" \
  "$BUILD_DIR/Release/${BINARY_NAME}.exe"; do
  if [ -f "$CANDIDATE" ]; then
    BINARY="$CANDIDATE"
    break
  fi
done

if [ -z "$BINARY" ]; then
  echo "[run.sh] Binary not found -- building with CMake..."
  cmake -B "$BUILD_DIR" -S . -DCMAKE_BUILD_TYPE=Release
  cmake --build "$BUILD_DIR" --config Release
  for CANDIDATE in \
    "$BUILD_DIR/$BINARY_NAME" \
    "$BUILD_DIR/Release/$BINARY_NAME" \
    "$BUILD_DIR/${BINARY_NAME}.exe" \
    "$BUILD_DIR/Release/${BINARY_NAME}.exe"; do
    if [ -f "$CANDIDATE" ]; then
      BINARY="$CANDIDATE"
      break
    fi
  done
fi

if [ -z "$BINARY" ]; then
  echo "[run.sh] ERROR: Could not locate binary '$BINARY_NAME' after build."
  exit 1
fi

echo "[run.sh] Running: $BINARY $*"
exec "$BINARY" "$@"
