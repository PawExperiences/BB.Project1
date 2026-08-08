#!/usr/bin/env sh
# release.sh — packages shippable source files into a versioned zip artifact.
# Run after `git tag v0.1.0` and a green CI build, before uploading to GitHub Releases.
set -e

VERSION="0.1.0"
OUT_DIR="dist"
OUT_FILE="${OUT_DIR}/e2e-space-invaders-v${VERSION}.zip"

FILES="index.html game.js gameConfig.js input.js player.js invaders.js collision.js level1.js level2.js level3.js boss.js main.js style.css README.md"

# Navigate to repo root (two levels up from release/scripts/)
cd "$(dirname "$0")/../.."

mkdir -p "${OUT_DIR}"

# Check all files exist
for f in ${FILES}; do
  if [ ! -f "$f" ]; then
    echo "ERROR: missing file: $f" >&2
    exit 1
  fi
done

# Remove existing artifact if present (idempotent)
rm -f "${OUT_FILE}"

for f in ${FILES}; do
  echo "  + $f"
done

zip -q "${OUT_FILE}" ${FILES}

echo ""
echo "Artifact written: ${OUT_FILE}"
