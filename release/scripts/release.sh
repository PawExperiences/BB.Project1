#!/bin/sh
# Automated release script for factorlib.
# Builds the sdist+wheel, tags the release, pushes the tag, and creates
# (or reuses) the corresponding GitHub release with the built artifacts
# attached. Idempotent: safe to re-run if a previous step already
# completed.
# Run from the repository root: sh release/scripts/release.sh
set -eu

VERSION="0.1.0"
TAG="v${VERSION}"
TITLE="e2e gate check 0.1.0"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "${SCRIPT_DIR}/../.." && pwd)
DIST_DIR="${REPO_ROOT}/dist"

cd "${REPO_ROOT}"

echo "== Releasing factorlib ${VERSION} =="

echo "-- Building distribution artifacts --"
rm -rf "${DIST_DIR}"
python3 -m pip install --upgrade build
python3 -m build
set -- "${DIST_DIR}"/*
if [ ! -e "$1" ]; then
    echo "ERROR: no artifacts produced in dist/" >&2
    exit 1
fi
for f in "${DIST_DIR}"/*; do
    echo "  built: ${f}"
done

echo "-- Tagging release --"
if [ "$(git tag --list "${TAG}")" = "${TAG}" ]; then
    echo "  tag ${TAG} already exists locally, skipping tag creation"
else
    git tag -a "${TAG}" -m "${TITLE}"
fi

echo "-- Pushing tag --"
git push origin "${TAG}"

echo "-- Creating GitHub release --"
if gh release view "${TAG}" >/dev/null 2>&1; then
    echo "  release ${TAG} already exists on GitHub, skipping creation"
else
    if [ -f "${REPO_ROOT}/RELEASE_NOTES.md" ]; then
        gh release create "${TAG}" "${DIST_DIR}"/* --title "${TITLE}" --notes-file "${REPO_ROOT}/RELEASE_NOTES.md"
    elif [ -f "${REPO_ROOT}/CHANGELOG.md" ]; then
        gh release create "${TAG}" "${DIST_DIR}"/* --title "${TITLE}" --notes-file "${REPO_ROOT}/CHANGELOG.md"
    else
        gh release create "${TAG}" "${DIST_DIR}"/* --title "${TITLE}" --notes "Release ${TITLE}"
    fi
fi

echo "== Done: ${TAG} released =="
