#!/bin/sh
# release.sh -- packages e2e Space Invaders 0.1.0 into a release zip.
# Run from the repository root after tagging v0.1.0.
# Idempotent: re-running overwrites the zip.
set -e

VERSION="0.1.0"
PROJECT="e2e-space-invaders"
OUT_DIR="release"
OUT_FILE="${OUT_DIR}/${PROJECT}-${VERSION}.zip"

FILES="index.html game.js gameConfig.js input.js player.js invaders.js collisions.js explosions.js level1.js level2.js level3.js boss.js README.md"

mkdir -p "${OUT_DIR}"

MISSING=""
for f in $FILES; do
  if [ ! -f "$f" ]; then
    MISSING="$MISSING $f"
  fi
done

if [ -n "$MISSING" ]; then
  echo "ERROR: missing files:$MISSING" >&2
  exit 1
fi

rm -f "${OUT_FILE}"
for f in $FILES; do
  zip -q "${OUT_FILE}" "$f"
  echo "  added: $f"
done

echo ""
echo "Artifact written: ${OUT_FILE}"
