#!/usr/bin/env sh
# release.sh -- Tag v0.1.0, package artifact, publish GitHub Release.
# Run from the repository root after smoke tests pass.
# Requires: git, gh (GitHub CLI) authenticated with contents:write scope, zip.
set -e

VERSION="0.1.0"
TAG="v${VERSION}"
ARTIFACT="e2e-space-invaders-${VERSION}.zip"
RELEASE_TITLE="e2e space invaders ${VERSION}"
RELEASE_NOTES_FILE="RELEASE_NOTES.md"

SOURCE_FILES="index.html game.js gameConfig.js input.js player.js invaders.js collision.js level1.js level2.js level3.js boss.js README.md"

echo "Working directory: $(pwd)"

# 1. Check tag does not already exist
if git tag -l "${TAG}" | grep -q "^${TAG}$"; then
  echo "ERROR: Tag ${TAG} already exists. Aborting to prevent overwrite."
  exit 1
fi

# 2. Create annotated tag
git tag -a "${TAG}" -m "Release ${TAG} - e2e space invaders initial release"
echo "Created tag ${TAG}"

# 3. Push tag
git push origin "${TAG}"
echo "Pushed tag ${TAG} to origin"

# 4. Package artifact (only existing files)
echo "Creating artifact: ${ARTIFACT}"
FILES_TO_ZIP=""
for f in ${SOURCE_FILES}; do
  if [ -f "${f}" ]; then
    FILES_TO_ZIP="${FILES_TO_ZIP} ${f}"
    echo "  + ${f}"
  else
    echo "  WARNING: ${f} not found, skipping."
  fi
done
# shellcheck disable=SC2086
zip "${ARTIFACT}" ${FILES_TO_ZIP}
echo "Artifact ready: ${ARTIFACT}"

# 5. Write release notes if not present
if [ ! -f "${RELEASE_NOTES_FILE}" ]; then
  printf '## e2e space invaders %s\n\nInitial release. See CHANGELOG.md for full details.\n' "${VERSION}" > "${RELEASE_NOTES_FILE}"
  echo "Wrote placeholder ${RELEASE_NOTES_FILE}"
fi

# 6. Publish GitHub Release
gh release create "${TAG}" "${ARTIFACT}" \
  --title "${RELEASE_TITLE}" \
  --notes-file "${RELEASE_NOTES_FILE}"
echo "GitHub Release ${TAG} published with artifact ${ARTIFACT}"
