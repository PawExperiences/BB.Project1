#!/usr/bin/env sh
# release.sh — Tag v0.1.0, push to origin, and create the release ZIP.
# Run once from the repository root before publishing the GitHub Release.
set -e

VERSION="0.1.0"
TAG="v${VERSION}"
ZIP_DIR="release"
ZIP_NAME="e2e-space-invaders-${VERSION}.zip"
SOURCE_FILES="index.html game.js gameConfig.js input.js player.js invaders.js collision.js level1.js level2.js README.md"

echo "[release.sh] Releasing ${TAG}"

# Warn on dirty working tree
if [ -n "$(git status --porcelain)" ]; then
  echo "WARNING: Working tree is not clean. Uncommitted changes detected."
  git status --short
fi

# Create annotated tag (idempotent)
if git tag -l "${TAG}" | grep -q "${TAG}"; then
  echo "  Tag ${TAG} already exists locally — skipping tag creation."
else
  git tag -a "${TAG}" -m "Release ${TAG}: e2e Space Invaders initial release"
  echo "  Created annotated tag ${TAG}"
fi

# Push tag to origin
git push origin "${TAG}"
echo "  Pushed ${TAG} to origin"

# Build release ZIP
mkdir -p "${ZIP_DIR}"
ZIP_PATH="${ZIP_DIR}/${ZIP_NAME}"

# Verify source files exist
for f in ${SOURCE_FILES}; do
  if [ ! -f "${f}" ]; then
    echo "ERROR: Missing source file: ${f}" >&2
    exit 1
  fi
done

zip -j "${ZIP_PATH}" ${SOURCE_FILES}
echo "  Created artifact: ${ZIP_PATH}"

echo "[release.sh] Done. Attach the ZIP to the GitHub Release at:"
echo "  https://github.com/PawExperiences/BB.Project1/releases/new"
