#!/usr/bin/env sh
# release.sh -- Tag and push v0.1.0 to origin.
# Run from the repository root after CI is green.
# Idempotent: skips tag creation if v0.1.0 already exists locally.
set -e

VERSION="v0.1.0"
RELEASE_MSG="Release v0.1.0 -- e2e Space Invaders initial release"
ARCHIVE="e2e-space-invaders-0.1.0.zip"

echo "[release] Checking working tree is clean..."
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: Working tree is dirty. Commit or stash changes first." >&2
  exit 1
fi

echo "[release] Checking if tag ${VERSION} already exists..."
if git tag -l "${VERSION}" | grep -q "${VERSION}"; then
  echo "[release] Tag ${VERSION} already exists locally -- skipping creation."
else
  echo "[release] Creating annotated tag ${VERSION}..."
  git tag -a "${VERSION}" -m "${RELEASE_MSG}"
  echo "[release] Tag ${VERSION} created."
fi

echo "[release] Pushing tag ${VERSION} to origin..."
if git push origin "${VERSION}" 2>&1 | grep -qE "already exists|Everything up-to-date"; then
  echo "[release] Tag ${VERSION} already on remote -- nothing to push."
else
  git push origin "${VERSION}"
  echo "[release] Tag ${VERSION} pushed to origin."
fi

echo "[release] Packaging release archive..."
FILES="index.html game.js gameConfig.js input.js player.js invaders.js collision.js level1.js level2.js level3.js boss.js README.md"
if command -v zip > /dev/null 2>&1; then
  # shellcheck disable=SC2086
  zip "${ARCHIVE}" ${FILES}
  echo "[release] Archive created: ${ARCHIVE}"
else
  echo "WARNING: 'zip' not found. Skipping archive creation. Package files manually: ${FILES}"
fi

echo "[release] Done. Upload ${ARCHIVE} to the GitHub Release manually."
