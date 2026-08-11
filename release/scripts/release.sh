#!/bin/sh
# Automated release script for units 0.1.0.
# Run from a clean checkout of main, after every manual step in the release
# runbook is checked off. Safe to re-run: each stage skips itself if already done.
set -e

VERSION="0.1.0"
TAG="v${VERSION}"
PACKAGE="units"
REMOTE="origin"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
cd "$REPO_ROOT"

echo "[release] checking working tree is clean"
if [ -n "$(git status --porcelain)" ]; then
    echo "[release] ERROR: working tree is not clean" >&2
    git status --porcelain >&2
    exit 1
fi

echo "[release] running test suite"
python3 -m pytest -q

echo "[release] running ruff lint and format check"
ruff check src tests
ruff format --check src tests

echo "[release] building sdist and wheel"
rm -rf dist
python3 -m build

if [ -z "$(ls dist 2>/dev/null)" ]; then
    echo "[release] ERROR: no artifacts produced in dist/" >&2
    exit 1
fi

if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null 2>&1; then
    echo "[release] tag $TAG already exists locally, skipping tag creation"
else
    echo "[release] creating annotated tag $TAG"
    git tag -a "$TAG" -m "$PACKAGE $VERSION"
fi
echo "[release] pushing tag $TAG to $REMOTE"
git push "$REMOTE" "$TAG"

if gh release view "$TAG" >/dev/null 2>&1; then
    echo "[release] GitHub release $TAG already exists, skipping creation"
else
    echo "[release] creating GitHub release $TAG"
    if [ -f "release/RELEASE_NOTES.md" ]; then
        gh release create "$TAG" --title "$PACKAGE $VERSION" --notes-file "release/RELEASE_NOTES.md"
    else
        gh release create "$TAG" --title "$PACKAGE $VERSION" --notes "$PACKAGE $VERSION"
    fi
fi

echo "[release] uploading artifacts"
gh release upload "$TAG" dist/* --clobber

echo "[release] running smoke test in a temporary venv"
TMP_VENV=$(mktemp -d)
python3 -m venv "$TMP_VENV"
WHEEL=$(ls dist/*.whl | head -n 1)
"$TMP_VENV/bin/pip" install "$WHEEL"
"$TMP_VENV/bin/python" -c "from units import convert; assert convert(1000, 'm', 'km') == 1.0; print('smoke test ok')"
rm -rf "$TMP_VENV"

echo "[release] $PACKAGE $VERSION released as $TAG"
