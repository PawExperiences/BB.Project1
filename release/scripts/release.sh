#!/usr/bin/env sh
# Release script for e2e space invaders v0.1.0.
# Creates annotated tag, zips source files, pushes tag to origin.
# Run from the repository root with a clean working tree.
set -e

VERSION="0.1.0"
TAG="v${VERSION}"
ZIP_NAME="e2e-space-invaders-${VERSION}.zip"
SOURCE_FILES="index.html gameConfig.js game.js input.js player.js invaders.js collision.js README.md"

echo "[release] Checking working tree is clean..."
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: Working tree is not clean. Commit or stash changes first."
  exit 1
fi

echo "[release] Verifying source files exist..."
for f in $SOURCE_FILES; do
  if [ ! -f "$f" ]; then
    echo "ERROR: Missing file: $f"
    exit 1
  fi
done
echo "  All source files present."

echo "[release] Creating zip artifact: ${ZIP_NAME}"
zip -j "${ZIP_NAME}" $SOURCE_FILES
echo "  Created: ${ZIP_NAME}"

echo "[release] Checking if tag ${TAG} already exists..."
if git tag -l "${TAG}" | grep -q "${TAG}"; then
  echo "  Tag ${TAG} already exists locally — skipping tag creation."
else
  echo "[release] Creating annotated tag ${TAG}..."
  git tag -a "${TAG}" -m "Release ${TAG} — Game loop and canvas framework"
fi

echo "[release] Pushing tag ${TAG} to origin..."
git push origin "${TAG}"

echo ""
echo "[release] Done. Tag ${TAG} pushed. Upload ${ZIP_NAME} to the GitHub Release page manually."
