#!/bin/sh
# Release script for e2e standup poster.
# Performs the automated release steps: build, tag, push tag, create/update
# the GitHub Release, and upload the build artifact. Safe to re-run. Never
# deletes or force-pushes anything.
set -eu

REPO_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
VERSION=${VERSION:-0.1.0}
TAG=${TAG:-v$VERSION}
REMOTE=${REMOTE:-origin}
TARGET_BRANCH=${TARGET_BRANCH:-main}
DIST_DIR="$REPO_ROOT/dist"
NOTES_FILE="$REPO_ROOT/release/RELEASE_NOTES.md"
ARTIFACT="$REPO_ROOT/release/e2e-standup-poster-$VERSION.zip"
RELEASE_TITLE=${RELEASE_TITLE:-"e2e standup poster $VERSION"}

cd "$REPO_ROOT"

echo "== Releasing e2e standup poster $VERSION ($TAG) =="

echo "== Step 1/4: install dependencies and build =="
echo "+ npm ci"
npm ci
echo "+ npm run build"
npm run build
if [ ! -f "$DIST_DIR/index.html" ]; then
  echo "ERROR: $DIST_DIR/index.html was not produced by the build" >&2
  exit 1
fi
echo "OK: $DIST_DIR/index.html exists"

echo "== Step 2/4: create and push git tag $TAG =="
if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null 2>&1; then
  echo "SKIP: tag $TAG already exists locally"
else
  echo "+ git tag $TAG"
  git tag "$TAG"
fi
echo "+ git push $REMOTE $TAG"
git push "$REMOTE" "$TAG"

echo "== Step 3/4: package the build artifact =="
mkdir -p "$(dirname "$ARTIFACT")"
rm -f "$ARTIFACT"
( cd "$DIST_DIR" && zip -r -q "$ARTIFACT" . )
echo "OK: wrote $ARTIFACT"

echo "== Step 4/4: create or update the GitHub Release =="
if gh release view "$TAG" >/dev/null 2>&1; then
  echo "SKIP: GitHub release $TAG already exists, uploading artifact only"
else
  if [ -f "$NOTES_FILE" ]; then
    echo "+ gh release create $TAG --title $RELEASE_TITLE --target $TARGET_BRANCH --notes-file $NOTES_FILE"
    gh release create "$TAG" --title "$RELEASE_TITLE" --target "$TARGET_BRANCH" --notes-file "$NOTES_FILE"
  else
    echo "+ gh release create $TAG --title $RELEASE_TITLE --target $TARGET_BRANCH --notes Release-$TAG"
    gh release create "$TAG" --title "$RELEASE_TITLE" --target "$TARGET_BRANCH" --notes "Release $TAG"
  fi
fi
echo "+ gh release upload $TAG $ARTIFACT --clobber"
gh release upload "$TAG" "$ARTIFACT" --clobber

echo "== Done. Nothing was deleted or force-pushed. =="
