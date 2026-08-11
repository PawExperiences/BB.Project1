#!/bin/sh
# Automated release script for factorlib 0.1.0.
# Installs build/test tooling, installs factorlib editable, runs the test
# suite, builds the sdist+wheel, smoke-tests the CLI, tags the commit,
# pushes the tag, and creates a DRAFT GitHub Release with the artifacts
# attached. Run from anywhere inside the repo, on the commit that should
# become v0.1.0. A human must still review and publish the draft release
# on GitHub -- this script never makes it public.
set -eu

VERSION="0.1.0"
TAG="v${VERSION}"
REPO="PawExperiences/BB.Project1"

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

echo "== 1. Ensuring build/test tooling =="
for pkg in pytest build; do
  if ! python3 -c "import ${pkg}" >/dev/null 2>&1; then
    echo "${pkg} not found; installing..."
    python3 -m pip install "${pkg}"
  fi
done

echo "== 2. Installing factorlib (editable) =="
python3 -m pip install -e .

echo "== 3. Running test suite =="
python3 -m pytest

echo "== 4. Building sdist and wheel =="
python3 -m build

echo "== 5. Smoke-testing the CLI =="
factorlib 12 18 7

echo "== 6. Tagging release =="
if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null 2>&1; then
  echo "Tag ${TAG} already exists locally, skipping tag creation."
else
  git tag -a "${TAG}" -m "factorlib ${VERSION}"
fi

echo "== 7. Pushing tag =="
git push origin "${TAG}"

echo "== 8. Creating draft GitHub release =="
NOTES_PATH="${REPO_ROOT}/release/RELEASE_NOTES.md"
DIST_FILES=$(ls dist/factorlib-${VERSION}* 2>/dev/null || true)
if [ -f "${NOTES_PATH}" ]; then
  gh release create "${TAG}" ${DIST_FILES} --repo "${REPO}" --title "factorlib ${VERSION}" --draft --notes-file "${NOTES_PATH}"
else
  gh release create "${TAG}" ${DIST_FILES} --repo "${REPO}" --title "factorlib ${VERSION}" --draft --notes "factorlib ${VERSION}"
fi

echo "Release ${TAG} prepared as a DRAFT. A maintainer must review and publish it on GitHub."
