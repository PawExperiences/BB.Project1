#!/bin/sh
# Idempotent release script: tags, packages, and publishes the GitHub release for v0.5.0.
set -eu

VERSION="0.5.0"
TAG="v$VERSION"
REPO_SLUG="${REPO_SLUG:-PawExperiences/BB.Project1}"
ARTIFACT_NAME="space-invaders-cc-$VERSION.zip"
ARTIFACT_FILES="index.html gameConfig.js game.js input.js player.js README.md"

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"

echo "+ checking working tree is clean"
if [ -n "$(git status --porcelain)" ]; then
    echo "working tree is not clean; commit or stash changes before releasing" >&2
    exit 1
fi

if git rev-parse --verify --quiet "$TAG" >/dev/null; then
    echo "tag $TAG already exists locally, skipping creation"
else
    echo "+ git tag -a $TAG -m 'Release $TAG'"
    git tag -a "$TAG" -m "Release $TAG"
fi

if git ls-remote --tags origin "$TAG" | grep -q "$TAG"; then
    echo "tag $TAG already exists on origin, skipping push"
else
    echo "+ git push origin $TAG"
    git push origin "$TAG"
fi

if [ -f "$ARTIFACT_NAME" ]; then
    echo "artifact $ARTIFACT_NAME already exists, skipping packaging"
else
    echo "+ packaging $ARTIFACT_NAME"
    if command -v zip >/dev/null 2>&1; then
        # shellcheck disable=SC2086
        zip -q "$ARTIFACT_NAME" $ARTIFACT_FILES
    else
        # shellcheck disable=SC2086
        tar czf "${ARTIFACT_NAME%.zip}.tar.gz" $ARTIFACT_FILES
        ARTIFACT_NAME="${ARTIFACT_NAME%.zip}.tar.gz"
    fi
    echo "packaged artifact at $ROOT/$ARTIFACT_NAME"
fi

NOTES_FILE=""
if [ -f "release/RELEASE_NOTES.md" ]; then
    NOTES_FILE="release/RELEASE_NOTES.md"
elif [ -f "CHANGELOG.md" ]; then
    NOTES_FILE="CHANGELOG.md"
fi

if gh release view "$TAG" --repo "$REPO_SLUG" >/dev/null 2>&1; then
    echo "GitHub release $TAG already exists, skipping creation"
else
    if [ -n "$NOTES_FILE" ]; then
        echo "+ gh release create $TAG $ARTIFACT_NAME --notes-file $NOTES_FILE"
        gh release create "$TAG" "$ARTIFACT_NAME" --repo "$REPO_SLUG" --title "e2e space invaders cc $VERSION" --notes-file "$NOTES_FILE"
    else
        echo "+ gh release create $TAG $ARTIFACT_NAME --notes 'Release $TAG'"
        gh release create "$TAG" "$ARTIFACT_NAME" --repo "$REPO_SLUG" --title "e2e space invaders cc $VERSION" --notes "Release $TAG. See CHANGELOG.md for details."
    fi
    echo "published GitHub release $TAG"
fi

echo "release $TAG complete"
