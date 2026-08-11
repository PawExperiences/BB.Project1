#!/bin/sh
# Automated release script for e2e quote page v0.1.0.
# Builds the static site, tags the commit, packages dist/ into a
# tar.gz, and (if the GitHub CLI is available and authenticated)
# publishes a GitHub release with the artifact attached. Safe to
# re-run. Run only after the runbook's STOP-GATE steps are confirmed.
set -e

VERSION="0.1.0"
TAG="v$VERSION"
REPO_ROOT=$(git rev-parse --show-toplevel)
DIST_DIR="$REPO_ROOT/dist"
RELEASE_DIR="$REPO_ROOT/release"
ARTIFACT="$RELEASE_DIR/e2e-quote-page-$VERSION.tar.gz"
NOTES_FILE="$RELEASE_DIR/RELEASE_NOTES.md"

echo "== e2e quote page release script =="

if [ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]; then
  echo "ERROR: working tree is not clean. Commit or stash changes before releasing."
  exit 1
fi

MISSING=""
for f in package.json astro.config.mjs src/pages/index.astro src/data/quotes.json src/styles/print.css src/lib/pick.ts README.md; do
  if [ ! -e "$REPO_ROOT/$f" ]; then
    MISSING="$MISSING $f"
  fi
done
if [ -n "$MISSING" ]; then
  echo "ERROR: this checkout is missing required release files:$MISSING"
  echo "This matches the STOP-GATE concern in the runbook -- do not release."
  echo "Confirm the correct commit is checked out before re-running this script."
  exit 1
fi

echo "-- Installing dependencies (npm ci) --"
( cd "$REPO_ROOT" && npm ci )

echo "-- Building static site (npm run build) --"
( cd "$REPO_ROOT" && npm run build )

if [ ! -f "$DIST_DIR/index.html" ]; then
  echo "ERROR: build did not produce dist/index.html"
  exit 1
fi
echo "Build OK: $DIST_DIR/index.html"

mkdir -p "$RELEASE_DIR"
rm -f "$ARTIFACT"
echo "-- Packaging $DIST_DIR -> $ARTIFACT --"
( cd "$DIST_DIR" && tar -czf "$ARTIFACT" . )
echo "Artifact written: $ARTIFACT"

if git -C "$REPO_ROOT" rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  echo "Tag $TAG already exists, skipping tag creation."
else
  echo "-- Creating annotated tag $TAG --"
  git -C "$REPO_ROOT" tag -a "$TAG" -m "e2e quote page $VERSION"
  echo "-- Pushing tag $TAG to origin --"
  git -C "$REPO_ROOT" push origin "$TAG"
fi

if command -v gh >/dev/null 2>&1; then
  if gh release view "$TAG" >/dev/null 2>&1; then
    echo "GitHub release $TAG already exists, uploading artifact if missing..."
    gh release upload "$TAG" "$ARTIFACT" --clobber
  else
    echo "-- Creating GitHub release $TAG --"
    if [ -f "$NOTES_FILE" ]; then
      gh release create "$TAG" "$ARTIFACT" --title "e2e quote page $VERSION" --notes-file "$NOTES_FILE"
    else
      gh release create "$TAG" "$ARTIFACT" --title "e2e quote page $VERSION" --notes "e2e quote page $VERSION"
    fi
  fi
else
  echo "GitHub CLI (gh) not found; skipping GitHub release publish step."
  echo "Publish manually: gh release create $TAG $ARTIFACT --title \"e2e quote page $VERSION\" --notes-file $NOTES_FILE"
fi

echo "== Release script complete =="
