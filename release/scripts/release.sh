#!/bin/sh
# release/scripts/release.sh
# Purpose: run pre-release checks, create and push the git tag, and publish
# the GitHub release for this version. Run from a clean checkout of the
# commit that should become the release, on a machine with push access and
# (optionally) an authenticated gh CLI.
set -eu

VERSION="${RELEASE_VERSION:-0.1.0}"
TAG="v${VERSION}"
NOTES_FILE="${RELEASE_NOTES_FILE:-release/RELEASE_NOTES.md}"

echo "==> Releasing ${TAG}"

echo "==> Checking working tree is clean"
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree is not clean. Commit or stash changes first." >&2
  exit 1
fi

if command -v npm >/dev/null 2>&1 && [ -f package.json ]; then
  echo "==> Installing dependencies (npm ci)"
  npm ci

  if [ -f tsconfig.json ]; then
    echo "==> Type-checking (tsc --noEmit)"
    npx tsc --noEmit
  fi

  if npm run 2>/dev/null | grep -q '^  test'; then
    echo "==> Running test suite (npm test)"
    npm test --silent
  fi
fi

if [ -f check.js ]; then
  echo "==> Running CLI self-check (node check.js)"
  node check.js
fi

echo "==> Checking tag ${TAG} does not already exist"
if git rev-parse "${TAG}" >/dev/null 2>&1; then
  echo "Tag ${TAG} already exists locally; skipping tag creation."
else
  echo "==> Creating annotated tag ${TAG}"
  git tag -a "${TAG}" -m "Release ${TAG}"
fi

echo "==> Pushing tag ${TAG} to origin"
git push origin "${TAG}"

if command -v gh >/dev/null 2>&1; then
  if gh release view "${TAG}" >/dev/null 2>&1; then
    echo "==> GitHub release ${TAG} already exists; skipping creation."
  else
    echo "==> Creating GitHub release ${TAG}"
    if [ -f "${NOTES_FILE}" ]; then
      gh release create "${TAG}" --title "${TAG}" --notes-file "${NOTES_FILE}"
    else
      gh release create "${TAG}" --title "${TAG}" --generate-notes
    fi
  fi
else
  echo "NOTE: gh CLI not found; create the GitHub release for ${TAG} manually."
fi

echo "==> Done. Released ${TAG}."
