#!/bin/sh
# Performs the e2e ticket mirror release: install, build, test, tag, and publish to GitHub.
set -e

VERSION="${RELEASE_VERSION:-0.1.0}"
TAG="${RELEASE_TAG:-v$VERSION}"
REMOTE="${RELEASE_REMOTE:-origin}"
NOTES_FILE="${RELEASE_NOTES_FILE:-RELEASE_NOTES.md}"

echo "Releasing e2e ticket mirror $TAG"

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean; commit or stash changes before releasing."
  exit 1
fi

echo "+ npm ci"
npm ci

echo "+ npm run build"
npm run build

if node -e "var s=require('./package.json').scripts||{}; process.exit(s.test?0:1)" 2>/dev/null; then
  echo "+ npm test"
  npm test
else
  echo "+ npx --yes vitest run"
  npx --yes vitest run
fi

if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG already exists locally; skipping tag creation."
else
  echo "+ git tag -a $TAG -m Release-$TAG"
  git tag -a "$TAG" -m "Release $TAG"
fi

echo "+ git push $REMOTE $TAG"
git push "$REMOTE" "$TAG"

if gh release view "$TAG" >/dev/null 2>&1; then
  echo "GitHub release $TAG already exists; skipping creation."
else
  if [ -f "$NOTES_FILE" ]; then
    echo "+ gh release create $TAG --title $TAG --notes-file $NOTES_FILE"
    gh release create "$TAG" --title "$TAG" --notes-file "$NOTES_FILE"
  else
    echo "+ gh release create $TAG --title $TAG --notes Release-$TAG"
    gh release create "$TAG" --title "$TAG" --notes "Release $TAG"
  fi
fi

echo "Release $TAG complete."
