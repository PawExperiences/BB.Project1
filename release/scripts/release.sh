#!/bin/sh
set -eu
# Automated release steps for e2e-space-invaders-cc: tag, package, and publish
# the GitHub Release. Run after CI is green and release/RELEASE_NOTES.md has
# been written. Idempotent: safe to re-run.

VERSION="${RELEASE_VERSION:-0.5.0}"
TAG="$VERSION"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
ZIP_NAME="e2e-space-invaders-cc-${VERSION}.zip"
RELEASE_NOTES="$REPO_ROOT/release/RELEASE_NOTES.md"
ARTIFACT_FILES="index.html game.js gameConfig.js input.js player.js invaders.js collision.js level1.js level2.js level3.js boss.js README.md"

cd "$REPO_ROOT"

for f in $ARTIFACT_FILES; do
  if [ ! -f "$f" ]; then
    echo "ERROR: missing expected shipped file: $f" >&2
    exit 1
  fi
done

if git tag -l "$TAG" | grep -qx "$TAG"; then
  echo "Tag $TAG already exists locally, skipping tag creation."
else
  echo "+ git tag -a $TAG -m 'e2e space invaders cc $VERSION'"
  git tag -a "$TAG" -m "e2e space invaders cc $VERSION"
fi

echo "+ git push origin $TAG"
git push origin "$TAG"

echo "+ packaging $ZIP_NAME"
rm -f "$ZIP_NAME"
zip -q "$ZIP_NAME" $ARTIFACT_FILES

if gh release view "$TAG" >/dev/null 2>&1; then
  echo "GitHub release $TAG already exists; uploading/overwriting the asset only."
  gh release upload "$TAG" "$ZIP_NAME" --clobber
else
  if [ ! -f "$RELEASE_NOTES" ]; then
    echo "ERROR: $RELEASE_NOTES not found; write the release notes before running this script." >&2
    exit 1
  fi
  gh release create "$TAG" "$ZIP_NAME" --title "e2e space invaders cc $VERSION" --notes-file "$RELEASE_NOTES"
fi

echo "Release $TAG published."
