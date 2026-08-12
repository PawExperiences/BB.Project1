#!/bin/sh
# Cut and publish the release: tag the commit, push the tag, publish the GitHub release.
set -eu

VERSION="${RELEASE_VERSION:-0.1.0}"
TAG="v${VERSION}"
BRANCH="${RELEASE_BRANCH:-main}"
NOTES_PATH="${RELEASE_NOTES_PATH:-release/RELEASE_NOTES.md}"

echo "Releasing ${TAG} from branch ${BRANCH}"

if [ ! -f "${NOTES_PATH}" ]; then
    echo "Release notes file not found at ${NOTES_PATH}." >&2
    exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
    echo "Working tree is not clean. Commit or stash changes before releasing." >&2
    exit 1
fi

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "${CURRENT_BRANCH}" != "${BRANCH}" ]; then
    echo "Expected to be on '${BRANCH}', but on '${CURRENT_BRANCH}'." >&2
    exit 1
fi

if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null 2>&1; then
    echo "Tag ${TAG} already exists locally, skipping tag creation."
else
    echo "+ git tag -a ${TAG} -m 'Release ${TAG}'"
    git tag -a "${TAG}" -m "Release ${TAG}"
fi

if [ -n "$(git ls-remote --tags origin "${TAG}")" ]; then
    echo "Tag ${TAG} already exists on origin, skipping push."
else
    echo "+ git push origin ${TAG}"
    git push origin "${TAG}"
fi

if gh release view "${TAG}" >/dev/null 2>&1; then
    echo "GitHub release ${TAG} already exists, skipping creation."
else
    echo "+ gh release create ${TAG} --title ${TAG} --notes-file ${NOTES_PATH}"
    gh release create "${TAG}" --title "${TAG}" --notes-file "${NOTES_PATH}"
fi

echo "Release ${TAG} complete."
