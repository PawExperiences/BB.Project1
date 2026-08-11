#!/bin/sh
# Automated release: verify, test, lint, build, tag and publish units 0.1.0.
set -eu

VERSION="0.1.0"
TAG="v$VERSION"
REMOTE="origin"

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
cd "$REPO_ROOT"

echo "== Releasing units $VERSION ($TAG) =="

if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean. Commit or stash changes before releasing."
  exit 1
fi

echo "-- Installing dependencies (uv sync) --"
uv sync

echo "-- Running test suite (pytest) --"
uv run pytest -q

echo "-- Running lint checks (ruff) --"
uv run ruff check .
uv run ruff format --check .

echo "-- Building distribution artifacts (uv build) --"
uv build

if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG already exists locally, skipping tag creation."
else
  echo "-- Tagging $TAG --"
  git tag -a "$TAG" -m "units $VERSION"
fi

if [ -n "$(git ls-remote --tags "$REMOTE" "$TAG")" ]; then
  echo "Tag $TAG already exists on $REMOTE, skipping push."
else
  echo "-- Pushing tag $TAG to $REMOTE --"
  git push "$REMOTE" "$TAG"
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found: skipping GitHub release creation. Install gh and re-run, or create the release manually."
  exit 0
fi

if gh release view "$TAG" >/dev/null 2>&1; then
  echo "GitHub release $TAG already exists, skipping creation."
  exit 0
fi

NOTES_FILE="$REPO_ROOT/release/notes/RELEASE_NOTES.md"
echo "-- Creating GitHub release --"
if [ -f "$NOTES_FILE" ]; then
  gh release create "$TAG" dist/* --title "units $VERSION" --notes-file "$NOTES_FILE"
else
  gh release create "$TAG" dist/* --title "units $VERSION" --notes "units $VERSION"
fi

echo "== Release complete =="
