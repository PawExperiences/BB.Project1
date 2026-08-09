#!/bin/sh
# release.sh — Creates a GitHub Release for e2e space invaders 0.1.0 and uploads the artifact.
# Run AFTER pushing the v0.1.0 tag. Requires env var GITHUB_TOKEN with repo write scope.
set -e

REPO="PawExperiences/BB.Project1"
TAG="v0.1.0"
RELEASE_NAME="e2e space invaders 0.1.0"
ARTIFACT_NAME="e2e-space-invaders-0.1.0.zip"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "ERROR: GITHUB_TOKEN is not set" >&2
  exit 1
fi

SOURCE_FILES="index.html main.js style.css game.js gameConfig.js input.js player.js invaders.js collision.js level1.js level2.js level3.js boss.js README.md"

echo "Checking for existing release ${TAG}..."
RELEASE_JSON=$(curl -sf \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  "https://api.github.com/repos/${REPO}/releases/tags/${TAG}" 2>/dev/null || true)

if [ -n "$RELEASE_JSON" ] && echo "$RELEASE_JSON" | grep -q '"id"'; then
  echo "Release already exists. Skipping creation."
  UPLOAD_URL=$(echo "$RELEASE_JSON" | grep -o '"upload_url":"[^"]*"' | sed 's/"upload_url":"//;s/"//')
else
  echo "Creating release ${TAG}..."
  RELEASE_BODY=$(printf 'First playable release. Open `index.html` in any modern browser from the filesystem and press Enter to play.')
  CREATE_JSON=$(curl -sf \
    -X POST \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -H "Content-Type: application/json" \
    "https://api.github.com/repos/${REPO}/releases" \
    -d "{\"tag_name\":\"${TAG}\",\"name\":\"${RELEASE_NAME}\",\"body\":\"${RELEASE_BODY}\",\"draft\":false,\"prerelease\":false}")
  echo "Release created."
  UPLOAD_URL=$(echo "$CREATE_JSON" | grep -o '"upload_url":"[^"]*"' | sed 's/"upload_url":"//;s/"//')
fi

ZIP_PATH="$SCRIPT_DIR/$ARTIFACT_NAME"
echo "Building artifact ${ARTIFACT_NAME}..."
cd "$REPO_ROOT"
zip -j "$ZIP_PATH" $SOURCE_FILES
echo "Artifact built: $ZIP_PATH"

BASE_UPLOAD_URL=$(echo "$UPLOAD_URL" | sed 's/{.*}//')
echo "Uploading ${ARTIFACT_NAME}..."
curl -sf \
  -X POST \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  -H "Content-Type: application/zip" \
  "${BASE_UPLOAD_URL}?name=${ARTIFACT_NAME}" \
  --data-binary @"$ZIP_PATH" > /dev/null
echo "Asset uploaded."
echo "Done."
