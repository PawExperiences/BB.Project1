#!/usr/bin/env sh
# release.sh — tag, build, package, and publish prime_tester 0.3.0 to GitHub Releases.
set -eu

VERSION="0.3.0"
TAG="v${VERSION}"
REPO="PawExperiences/BB.Project1"
BUILD_DIR="build"
DIST_DIR="dist"
SYSTEM=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCHIVE="prime_tester-${VERSION}-${SYSTEM}.tar.gz"

echo "=== 1. Tag ==="
git fetch --tags
if git rev-parse "${TAG}" >/dev/null 2>&1; then
  echo "Tag ${TAG} already exists — skipping."
else
  git tag -a "${TAG}" -m "Release e2e prime tester ${VERSION}"
  git push origin "${TAG}"
fi

echo "=== 2. Build ==="
mkdir -p "${BUILD_DIR}"
cmake -B "${BUILD_DIR}" -DCMAKE_BUILD_TYPE=Release
cmake --build "${BUILD_DIR}" --config Release

echo "=== 3. Locate executable ==="
EXE="${BUILD_DIR}/prime_tester"
if [ ! -f "${EXE}" ]; then
  echo "ERROR: executable not found at ${EXE}" >&2
  exit 1
fi

echo "=== 4. Package ==="
mkdir -p "${DIST_DIR}"
tar czf "${DIST_DIR}/${ARCHIVE}" -C "${BUILD_DIR}" prime_tester
echo "Packaged: ${DIST_DIR}/${ARCHIVE}"

echo "=== 5. Publish GitHub Release ==="
gh release create "${TAG}" \
  --repo "${REPO}" \
  --title "e2e prime tester ${VERSION}" \
  --notes "Release ${VERSION} of the e2e prime tester project." \
  "${DIST_DIR}/${ARCHIVE}"
echo "Done."
