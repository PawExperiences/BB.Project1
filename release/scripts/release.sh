#!/usr/bin/env sh
# release.sh — Tag v0.1.0, package artifact, create GitHub Release.
# Run from the repository root with GH_TOKEN env var set (PAT, contents: write).
set -e

RELEASE_VERSION="0.1.0"
TAG="v${RELEASE_VERSION}"
RELEASE_TITLE="e2e Space Invaders ${RELEASE_VERSION}"
OUTPUT_DIR="release"
ARTIFACT_NAME="e2e-space-invaders-${RELEASE_VERSION}.zip"
ARTIFACT_PATH="${OUTPUT_DIR}/${ARTIFACT_NAME}"
NOTES_PATH="${OUTPUT_DIR}/RELEASE_NOTES.md"

FILES="index.html game.js gameConfig.js constants.js input.js player.js invaders.js collision.js level1.js level2.js level3.js boss.js README.md"

echo "=== Release ${TAG} ==="

# Prerequisites
if [ -z "${GH_TOKEN}" ]; then
  echo "[error] GH_TOKEN environment variable is not set." >&2
  exit 1
fi
if ! command -v gh > /dev/null 2>&1; then
  echo "[error] GitHub CLI (gh) is not installed or not on PATH." >&2
  exit 1
fi
if ! command -v zip > /dev/null 2>&1; then
  echo "[error] zip is not installed or not on PATH." >&2
  exit 1
fi
for f in ${FILES}; do
  if [ ! -f "${f}" ]; then
    echo "[error] Required file not found: ${f}" >&2
    exit 1
  fi
done

# Tag
if git tag -l "${TAG}" | grep -q "${TAG}"; then
  echo "[info] Tag ${TAG} already exists locally — skipping tag creation."
else
  git checkout main
  git pull origin main
  git tag -a "${TAG}" -m "Release ${TAG} — e2e Space Invaders initial release"
  echo "[info] Created tag ${TAG}."
fi
git push origin "${TAG}" 2>&1 | grep -v "already exists" || true
echo "[info] Tag ${TAG} is on remote."

# Package artifact
mkdir -p "${OUTPUT_DIR}"
if [ -f "${ARTIFACT_PATH}" ]; then
  echo "[info] Artifact ${ARTIFACT_PATH} already exists — overwriting."
  rm "${ARTIFACT_PATH}"
fi
echo "[info] Packaging artifact: ${ARTIFACT_PATH}"
zip "${ARTIFACT_PATH}" ${FILES}
echo "[info] Artifact created: ${ARTIFACT_PATH}"

# Write release notes
mkdir -p "${OUTPUT_DIR}"
cat > "${NOTES_PATH}" << 'NOTES_EOF'
## e2e Space Invaders v0.1.0

First playable release — a pure-browser, zero-dependency Space Invaders clone built with vanilla ES modules and the HTML5 Canvas API.

Open `index.html` directly from your filesystem (no server, no bundler, no npm) and play through four levels to the multi-phase boss finale.

### Highlights
- Full four-level arc: classic grid → enemies shoot back with UFO bonuses → destructible shields + formation split → two-phase boss
- Fixed-timestep game loop with delta capping (no burst updates on tab restore)
- Procedural canvas-primitive rendering throughout — no image assets
- Progressive difficulty: step interval scales with survivor count; boss doubles fire rate at half HP
- Zero external dependencies; works at file:// URL
NOTES_EOF
echo "[info] Release notes written to ${NOTES_PATH}"

# Create GitHub Release
if gh release view "${TAG}" --json tagName > /dev/null 2>&1; then
  echo "[info] GitHub Release ${TAG} already exists — skipping creation."
else
  gh release create "${TAG}" \
    --title "${RELEASE_TITLE}" \
    --notes-file "${NOTES_PATH}" \
    "${ARTIFACT_PATH}"
  echo "[info] GitHub Release ${TAG} created with artifact ${ARTIFACT_NAME}."
fi

echo "=== Done. Visit: https://github.com/PawExperiences/BB.Project1/releases/tag/${TAG} ==="
