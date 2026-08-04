#!/usr/bin/env sh
# release.sh — package source, tag, and publish the GitHub Release.
# Usage: sh release/scripts/release.sh 0.1.0
set -eu

VERSION="${1:-}"
if [ -z "$VERSION" ]; then
  echo "Usage: $0 <version>  e.g. $0 0.1.0" >&2
  exit 1
fi

TAG="v${VERSION}"
ZIP="spaceinvaders-${VERSION}.zip"
SOURCES="index.html game.js gameConfig.js input.js player.js invaders.js collision.js README.md CHANGELOG.md"

# Step 1: create zip artifact
echo "[1/4] Creating artifact ${ZIP}..."
if [ -f "${ZIP}" ]; then
  echo "      ${ZIP} already exists, overwriting (idempotent)."
  rm "${ZIP}"
fi
for f in $SOURCES; do
  if [ -f "$f" ]; then
    echo "      adding $f"
    zip -q "${ZIP}" "$f"
  else
    echo "      WARNING: $f not found, skipping" >&2
  fi
done
echo "      ${ZIP} created."

# Step 2: create annotated tag (idempotent)
echo "[2/4] Tagging ${TAG}..."
if git tag -l | grep -qx "${TAG}"; then
  echo "      Tag ${TAG} already exists, skipping."
else
  git tag -a "${TAG}" -m "Release ${TAG} — e2e Space Invaders"
fi

# Step 3: push tag
echo "[3/4] Pushing tag ${TAG} to origin..."
git push origin "${TAG}"

# Step 4: create GitHub Release
echo "[4/4] Creating GitHub Release ${TAG}..."
if [ -f CHANGELOG.md ]; then
  NOTES_FLAG="--notes-file CHANGELOG.md"
else
  NOTES_FLAG="--notes Release ${TAG}"
fi
# shellcheck disable=SC2086
gh release create "${TAG}" \
  --title "e2e Space Invaders ${TAG}" \
  $NOTES_FLAG \
  "${ZIP}"

echo "
Release ${TAG} complete. Artifact: ${ZIP}"
