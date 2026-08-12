#!/bin/sh
# Release script for e2e standup poster.
# Tags the currently checked-out commit, builds it, and publishes a
# GitHub release with the dist/ artifact attached. Run this ONLY after
# checking out the confirmed release commit (see runbook: current main
# HEAD may not contain the app -- see the 'reset for the next e2e
# project' finding). Idempotent: safe to re-run.
set -eu

VERSION="${RELEASE_VERSION:-0.1.0}"
TAG="${RELEASE_TAG:-v$VERSION}"
NOTES_FILE="${RELEASE_NOTES_FILE:-release/RELEASE_NOTES.md}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
cd "$REPO_ROOT"

echo "== Releasing $TAG =="

if [ ! -f package.json ]; then
  echo "ERROR: package.json not found at repo root." >&2
  echo "This checkout does not contain the standup-poster app." >&2
  echo "Confirm you checked out the correct release commit (runbook step 1)." >&2
  exit 1
fi

echo "-- Installing dependencies (npm ci) --"
npm ci

echo "-- Building (npm run build) --"
npm run build

if [ ! -f dist/index.html ]; then
  echo "ERROR: build did not produce dist/index.html" >&2
  exit 1
fi
echo "Build OK: dist/index.html"

echo "-- Packaging dist/ artifact --"
ARTIFACT="standup-poster-$VERSION.tar.gz"
rm -f "$ARTIFACT"
tar -C dist -czf "$ARTIFACT" .
echo "Artifact written: $ARTIFACT"

echo "-- Checking whether tag $TAG already exists --"
if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  echo "Tag $TAG already exists locally; not re-tagging (idempotent)."
else
  echo "-- Creating annotated tag $TAG on current commit --"
  git tag -a "$TAG" -m "Release $TAG"
fi
echo "-- Pushing tag $TAG to origin (additive, no force) --"
git push origin "$TAG"

echo "-- Checking whether GitHub release $TAG already exists --"
if gh release view "$TAG" >/dev/null 2>&1; then
  echo "Release $TAG already exists; uploading/overwriting artifact only."
  gh release upload "$TAG" "$ARTIFACT" --clobber
else
  echo "-- Creating GitHub release $TAG --"
  if [ -f "$NOTES_FILE" ]; then
    gh release create "$TAG" "$ARTIFACT" --title "$TAG" --notes-file "$NOTES_FILE"
  else
    gh release create "$TAG" "$ARTIFACT" --title "$TAG" --generate-notes
  fi
fi

echo "== Done. Release $TAG published. =="
