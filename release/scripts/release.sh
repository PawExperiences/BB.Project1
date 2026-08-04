#!/usr/bin/env sh
# release.sh — tag v0.1.0, zip artifact, create draft GitHub release.
# Run from the repo root after CI passes. Requires git, zip, and gh on PATH.
set -eu

VERSION="0.1.0"
TAG="v${VERSION}"
ZIP_NAME="space-invaders-${VERSION}.zip"
NOTES_PATH="release/notes-${VERSION}.md"

ARTIFACT_FILES="index.html game.js gameConfig.js input.js player.js invaders.js collision.js shields.js README.md"

RELEASE_NOTES='## e2e Space Invaders 0.1.0

First public release. Open `index.html` from the downloaded ZIP directly in
Chrome or Firefox (no server needed). Three fully playable levels:

- Level 1: classic accelerating 11x5 invader grid
- Level 2: invader return fire, player respawn/blink, bonus UFO with tier scoring
- Level 3: destructible shield bunkers + formation split at 50% kills

See README.md inside the ZIP for manual verification steps.
'

echo "[release.sh] Releasing ${TAG}"

# 1. Tag (idempotent)
if git tag -l "${TAG}" | grep -q "${TAG}"; then
  echo "  Tag ${TAG} already exists — skipping."
else
  git tag -a "${TAG}" -m "Release ${VERSION} — e2e Space Invaders initial release"
  git push origin "${TAG}"
  echo "  Tag ${TAG} created and pushed."
fi

# 2. Package artifact (idempotent — re-zips each run)
for f in ${ARTIFACT_FILES}; do
  if [ ! -f "${f}" ]; then
    echo "  ERROR: missing file: ${f}"
    exit 1
  fi
done
rm -f "${ZIP_NAME}"
zip "${ZIP_NAME}" ${ARTIFACT_FILES}
echo "  Artifact: ${ZIP_NAME}"

# 3. Write release notes
mkdir -p "$(dirname "${NOTES_PATH}")"
printf '%s' "${RELEASE_NOTES}" > "${NOTES_PATH}"
echo "  Notes written to ${NOTES_PATH}"

# 4. Create draft GitHub release (idempotent)
if gh release view "${TAG}" > /dev/null 2>&1; then
  echo "  GitHub release ${TAG} already exists — skipping creation."
else
  gh release create "${TAG}" "${ZIP_NAME}" \
    --title "e2e Space Invaders ${VERSION}" \
    --notes-file "${NOTES_PATH}" \
    --draft
  echo "  Draft release created: https://github.com/PawExperiences/BB.Project1/releases"
fi

echo "[release.sh] Done. Review the draft on GitHub, then publish manually."
