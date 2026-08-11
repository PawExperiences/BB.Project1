#!/bin/sh
# Automated release script for e2e quote page.
# Builds the site, tags the release, and publishes a GitHub release with the dist artifact.
# Run from the repository root after CI is green on the release commit.
set -e

VERSION="0.1.0"
TAG="v$VERSION"
DIST_DIR="dist"
ARCHIVE_NAME="dist-$TAG.zip"

echo "== Release $TAG =="

echo "-- Installing dependencies (npm ci) --"
npm ci

echo "-- Building site (npm run build) --"
npm run build

if [ ! -f "$DIST_DIR/index.html" ]; then
  echo "ERROR: $DIST_DIR/index.html was not produced by the build." >&2
  exit 1
fi
echo "$DIST_DIR/index.html built successfully."

if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG already exists locally; skipping tag creation."
else
  echo "-- Tagging release $TAG --"
  git tag -a "$TAG" -m "Release $TAG"
  git push origin "$TAG"
fi

echo "-- Archiving $DIST_DIR --"
rm -f "$ARCHIVE_NAME"
if command -v zip >/dev/null 2>&1; then
  (cd "$DIST_DIR" && zip -r "../$ARCHIVE_NAME" .)
else
  ARCHIVE_NAME="${ARCHIVE_NAME%.zip}.tar.gz"
  rm -f "$ARCHIVE_NAME"
  tar -czf "$ARCHIVE_NAME" -C "$DIST_DIR" .
fi
echo "Wrote $ARCHIVE_NAME"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found; skipping GitHub release publish. Install gh and re-run, or run:"
  echo "  gh release create $TAG $ARCHIVE_NAME --title \"$TAG\" --generate-notes"
  exit 0
fi

if gh release view "$TAG" >/dev/null 2>&1; then
  echo "GitHub release $TAG already exists; skipping creation."
else
  echo "-- Creating GitHub release $TAG --"
  gh release create "$TAG" "$ARCHIVE_NAME" --title "$TAG" --generate-notes
fi

echo "== Release $TAG complete =="
