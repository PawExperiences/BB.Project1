#!/bin/sh
# Tag and publish a GitHub release.
# Usage: sh release/scripts/release.sh VERSION [NOTES_FILE] [REMOTE] [BRANCH]
set -eu

if [ $# -lt 1 ]; then
  echo "Usage: release.sh VERSION [NOTES_FILE] [REMOTE] [BRANCH]" >&2
  exit 1
fi
VERSION="$1"
NOTES_FILE="${2:-}"
REMOTE="${3:-origin}"
BRANCH="${4:-main}"
TAG="v$VERSION"

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"
echo "OK: running from repo root '$REPO_ROOT'"

echo "+ git rev-parse --abbrev-ref HEAD"
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  echo "ERROR: expected branch '$BRANCH', currently on '$CURRENT_BRANCH'" >&2
  exit 1
fi
echo "OK: on branch '$BRANCH'"

echo "+ git status --porcelain"
STATUS=$(git status --porcelain)
if [ -n "$STATUS" ]; then
  echo "ERROR: working tree is not clean:" >&2
  echo "$STATUS" >&2
  exit 1
fi
echo "OK: working tree is clean"

echo "+ git fetch $REMOTE --tags"
git fetch "$REMOTE" --tags

if ! grep -qF "## [$VERSION] - " CHANGELOG.md; then
  echo "ERROR: CHANGELOG.md has no '## [$VERSION] - YYYY-MM-DD' heading" >&2
  exit 1
fi
echo "OK: CHANGELOG.md has a '[$VERSION]' section"

if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null 2>&1; then
  echo "OK: tag '$TAG' already exists locally, skipping tag creation (idempotent)"
else
  echo "+ git tag -a $TAG -m Release $TAG"
  git tag -a "$TAG" -m "Release $TAG"
  echo "OK: created annotated tag '$TAG'"
fi

if git ls-remote --tags "$REMOTE" | grep -q "refs/tags/$TAG"; then
  echo "OK: tag '$TAG' already exists on '$REMOTE', skipping push (idempotent)"
else
  echo "+ git push $REMOTE $TAG"
  git push "$REMOTE" "$TAG"
  echo "OK: pushed tag '$TAG' to '$REMOTE'"
fi

if command -v gh >/dev/null 2>&1; then
  if gh release view "$TAG" >/dev/null 2>&1; then
    echo "OK: GitHub release '$TAG' already exists, skipping creation (idempotent)"
  else
    if [ -n "$NOTES_FILE" ]; then
      echo "+ gh release create $TAG --title $TAG --notes-file $NOTES_FILE"
      gh release create "$TAG" --title "$TAG" --notes-file "$NOTES_FILE"
    else
      echo "+ gh release create $TAG --title $TAG --generate-notes"
      gh release create "$TAG" --title "$TAG" --generate-notes
    fi
    echo "OK: created GitHub release '$TAG'"
  fi
else
  echo "NOTE: 'gh' CLI not found; create the GitHub release for '$TAG' manually"
fi

echo "DONE: release $TAG tagged and published"
