#!/bin/sh
# release/scripts/release.sh
# Purpose: build, tag, and publish a badge-maker release (idempotent).
# Usage: VERSION=0.1.0 sh release/scripts/release.sh
set -eu

VERSION="${VERSION:-0.1.0}"
TAG="v${VERSION}"
NOTES_FILE="${RELEASE_NOTES_FILE:-RELEASE_NOTES.md}"

echo "== badge-maker release script =="
echo "Version : ${VERSION}"
echo "Tag     : ${TAG}"

# 1. Require a clean working tree.
if [ -n "$(git status --porcelain)" ]; then
    echo "ERROR: working tree is not clean. Commit or stash changes first." >&2
    exit 1
fi

# 2. Reproducible install + build.
echo "-- npm ci"
npm ci
echo "-- npm run build"
npm run build

if [ ! -f dist/index.js ] || [ ! -f dist/index.d.ts ]; then
    echo "ERROR: build did not produce dist/index.js and dist/index.d.ts." >&2
    exit 1
fi

# 3. Confirm package.json version matches VERSION (idempotent guard).
PKG_VERSION=$(node -p "require('./package.json').version")
if [ "$PKG_VERSION" != "$VERSION" ]; then
    echo "ERROR: package.json version ($PKG_VERSION) != VERSION ($VERSION)." >&2
    exit 1
fi

# 4. Create the annotated tag only if it does not already exist.
if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
    echo "-- tag ${TAG} already exists locally, skipping tag creation"
else
    echo "-- creating annotated tag ${TAG}"
    git tag -a "${TAG}" -m "Release ${TAG}"
fi

# 5. Push the tag if it is not already on origin.
if git ls-remote --tags origin "refs/tags/${TAG}" | grep -q "${TAG}"; then
    echo "-- tag ${TAG} already on origin, skipping push"
else
    echo "-- pushing tag ${TAG} to origin"
    git push origin "${TAG}"
fi

# 6. Build the npm package tarball artifact.
echo "-- npm pack"
npm pack >/dev/null
TARBALL="badge-maker-${VERSION}.tgz"
if [ ! -f "$TARBALL" ]; then
    echo "ERROR: expected artifact $TARBALL was not created by npm pack." >&2
    exit 1
fi
echo "-- artifact ready: ${TARBALL}"

# 7. Create the GitHub release, if the gh CLI is available and it doesn't exist yet.
if command -v gh >/dev/null 2>&1; then
    if gh release view "${TAG}" >/dev/null 2>&1; then
        echo "-- GitHub release ${TAG} already exists, skipping creation"
    else
        if [ -f "$NOTES_FILE" ]; then
            echo "-- creating GitHub release ${TAG} with notes from ${NOTES_FILE}"
            gh release create "${TAG}" "${TARBALL}" --title "${TAG}" --notes-file "${NOTES_FILE}"
        else
            echo "-- creating GitHub release ${TAG} (no notes file found at ${NOTES_FILE})"
            gh release create "${TAG}" "${TARBALL}" --title "${TAG}" --notes "Release ${TAG}"
        fi
    fi
else
    echo "-- gh CLI not found: create the GitHub release for ${TAG} manually and upload ${TARBALL}"
fi

echo "== done. Remember: 'npm publish' requires interactive 2FA and is a separate manual step. =="
