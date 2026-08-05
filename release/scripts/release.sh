#!/bin/sh
# release.sh -- Tag v0.1.0, build prime_tester, publish GitHub Release.
# Run once after CI passes on the release commit.
set -e

TAG="v0.1.0"
COMMIT="f7a4f1c"
TITLE="e2e prime tester 0.1.0"
ARTIFACT="build/prime_tester"
RELEASE_NOTES="release/RELEASE_NOTES.md"

echo "[release.sh] Tagging ${TAG} at ${COMMIT}..."
git tag -a "${TAG}" "${COMMIT}" -m "Release ${TITLE}"
git push origin "${TAG}"
echo "[release.sh] Tag ${TAG} pushed."

echo "[release.sh] Building..."
cmake -B build -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release

if [ ! -f "${ARTIFACT}" ]; then
  echo "[release.sh] ERROR: artifact not found at ${ARTIFACT}" >&2
  exit 1
fi
echo "[release.sh] Artifact built: ${ARTIFACT}"

echo "[release.sh] Publishing GitHub Release..."
if [ -f "${RELEASE_NOTES}" ]; then
  gh release create "${TAG}" "${ARTIFACT}" --title "${TITLE}" --notes-file "${RELEASE_NOTES}"
else
  gh release create "${TAG}" "${ARTIFACT}" --title "${TITLE}" --notes "${TITLE}"
fi
echo "[release.sh] GitHub Release ${TAG} published."
