#!/usr/bin/env sh
# release.sh – Build prime_tester, tag v0.3.0, push tag to origin.
# Run from the repository root after all 0.3.0 changes are merged to main.
set -eu

VERSION="0.3.0"
TAG="v${VERSION}"
BUILD_DIR="build"

echo ">>> cmake -S . -B ${BUILD_DIR} -DCMAKE_BUILD_TYPE=Release"
cmake -S . -B "${BUILD_DIR}" -DCMAKE_BUILD_TYPE=Release

echo ">>> cmake --build ${BUILD_DIR}"
cmake --build "${BUILD_DIR}"
echo "Build complete. Artifact: ${BUILD_DIR}/prime_tester"

# Check tag does not already exist remotely
if git ls-remote --tags origin | grep -q "refs/tags/${TAG}$"; then
  echo "ERROR: tag ${TAG} already exists on origin. Aborting." >&2
  exit 1
fi

echo ">>> git tag -a ${TAG} -m 'Release e2e prime tester ${VERSION}'"
git tag -a "${TAG}" -m "Release e2e prime tester ${VERSION}"

echo ">>> git push origin ${TAG}"
git push origin "${TAG}"
echo "Tag ${TAG} pushed to origin. Upload the artifact to the GitHub release manually."
