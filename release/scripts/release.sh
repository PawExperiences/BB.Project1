#!/bin/sh
# Automate the mdpdf 0.1.0 release: tag, build, and publish to GitHub Releases.
# Requires: git, gh (GitHub CLI, authenticated), python3 with the 'build'
# package installed (pip install build).
# Run from the repository root, on the commit that should become v0.1.0.
# Idempotent: safe to re-run if interrupted after tagging or publishing.
set -e

VERSION="0.1.0"
TAG="v$VERSION"
REPO="PawExperiences/BB.Project1"
NOTES_FILE="release/RELEASE_NOTES.md"
DIST_DIR="dist"

for tool in git gh python3; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "error: required tool '$tool' not found on PATH" >&2
    exit 1
  fi
done

if [ -n "$(git status --porcelain)" ]; then
  echo "error: working tree is not clean; commit or stash changes first" >&2
  exit 1
fi

if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null 2>&1; then
  echo "tag $TAG already exists locally, skipping tag creation"
else
  echo "+ git tag -a $TAG -m 'mdpdf $VERSION'"
  git tag -a "$TAG" -m "mdpdf $VERSION"
fi

echo "+ git push origin $TAG"
git push origin "$TAG"

echo "building sdist and wheel with 'python3 -m build'"
python3 -m build

if gh release view "$TAG" --repo "$REPO" >/dev/null 2>&1; then
  echo "GitHub release $TAG already exists, skipping release creation"
else
  if [ ! -f "$NOTES_FILE" ]; then
    echo "error: $NOTES_FILE not found; write release notes before publishing" >&2
    exit 1
  fi
  if [ -z "$(ls -A "$DIST_DIR" 2>/dev/null)" ]; then
    echo "error: no build artifacts found under $DIST_DIR" >&2
    exit 1
  fi
  echo "+ gh release create $TAG --repo $REPO --title 'mdpdf $VERSION' --notes-file $NOTES_FILE $DIST_DIR/*"
  gh release create "$TAG" --repo "$REPO" --title "mdpdf $VERSION" --notes-file "$NOTES_FILE" "$DIST_DIR"/*
fi

echo "release $TAG complete"
