#!/bin/sh
# Idempotent: runs tests, verifies install, tags HEAD as vVERSION, pushes the
# tag, and publishes a GitHub release from RELEASE_NOTES_FILE. Run from the
# repo root on the exact commit you intend to ship, after tests are green.
#
# Env vars:
#   RELEASE_VERSION     version to release, default 0.1.0
#   RELEASE_NOTES_FILE  path to the release notes markdown, default RELEASE_NOTES.md
#   RELEASE_TITLE       GitHub release title, default "e2e link checker <version>"
set -eu

VERSION="${RELEASE_VERSION:-0.1.0}"
TAG="v${VERSION}"
NOTES_FILE="${RELEASE_NOTES_FILE:-RELEASE_NOTES.md}"
TITLE="${RELEASE_TITLE:-e2e link checker ${VERSION}}"

echo "[release] running test suite as a release gate"
python3 -m pytest

echo "[release] verifying the package installs cleanly"
python3 -m pip install .

if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null 2>&1; then
  echo "[release] tag ${TAG} already exists locally; skipping tag creation"
else
  echo "[release] creating tag ${TAG}"
  git tag -a "${TAG}" -m "${TITLE}"
fi

echo "[release] pushing tag ${TAG} to origin"
git push origin "${TAG}"

if [ ! -f "${NOTES_FILE}" ]; then
  echo "[release] ERROR: ${NOTES_FILE} not found; cannot publish release notes" >&2
  exit 1
fi

if gh release view "${TAG}" >/dev/null 2>&1; then
  echo "[release] GitHub release ${TAG} already exists; skipping creation"
else
  echo "[release] creating GitHub release ${TAG}"
  gh release create "${TAG}" --title "${TITLE}" --notes-file "${NOTES_FILE}"
fi

echo "[release] done"
