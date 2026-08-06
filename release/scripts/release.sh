#!/usr/bin/env sh
# release.sh -- Tag, build, and publish GitHub release for e2e prime tester 0.3.0.
# Run ONCE after CI is green on main. Requires: git, cmake, gh (GitHub CLI) on PATH.
set -e

TAG="v0.3.0"
RELEASE_TITLE="e2e prime tester 0.3.0"
NOTES_FILE="docs/releases/0-3-0.md"
BUILD_DIR="build"
BINARY_NAME="prime_tester"

cd "$(dirname "$0")/../.."
echo "[release.sh] Working directory: $(pwd)"

# Tag (idempotent)
if git tag --list | grep -qx "$TAG"; then
  echo "[release.sh] Tag $TAG already exists -- skipping tag creation."
else
  git tag -a "$TAG" -m "Release $RELEASE_TITLE"
  echo "[release.sh] Tag $TAG created."
  git push origin "$TAG"
  echo "[release.sh] Tag pushed to origin."
fi

# Build
cmake -B "$BUILD_DIR" -S . -DCMAKE_BUILD_TYPE=Release
cmake --build "$BUILD_DIR" --config Release

# Locate binary
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
  echo "[release.sh] WARNING: binary '$BINARY_NAME' not found in $BUILD_DIR. Proceeding without artifact."
  gh release create "$TAG" --title "$RELEASE_TITLE" --notes-file "$NOTES_FILE" || echo "[release.sh] GitHub release may already exist."
else
  echo "[release.sh] Binary found: $BINARY"
  gh release create "$TAG" --title "$RELEASE_TITLE" --notes-file "$NOTES_FILE" "$BINARY" || echo "[release.sh] GitHub release may already exist."
fi

echo "[release.sh] Done."
