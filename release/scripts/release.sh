#!/bin/sh
# Automates the factorlib release: lint, test, build, tag, push, and create the GitHub release.
# Idempotent - re-running skips any step whose result already exists (tag, GitHub release).
# Run from a clean checkout after CI is green. Requires: ruff, pytest, python3 -m build,
# git, and the gh CLI (already authenticated) on PATH.
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
DIST_DIR="$REPO_ROOT/dist"
cd "$REPO_ROOT"

NAME=$(python3 -c "import tomllib; print(tomllib.load(open('pyproject.toml', 'rb'))['project']['name'])")
VERSION=$(python3 -c "import tomllib; print(tomllib.load(open('pyproject.toml', 'rb'))['project']['version'])")
TAG="v$VERSION"

echo "Releasing $NAME $VERSION as tag $TAG"

echo ""
echo "== Lint (ruff) =="
echo "+ ruff check ."
ruff check .

echo ""
echo "== Test (pytest) =="
echo "+ pytest -q"
pytest -q

echo ""
echo "== Build sdist + wheel =="
echo "+ python3 -m build"
python3 -m build

echo ""
echo "== Git tag =="
if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null 2>&1; then
    echo "  tag $TAG already exists locally, skipping git tag"
else
    echo "+ git tag -a $TAG -m \"$NAME $VERSION\""
    git tag -a "$TAG" -m "$NAME $VERSION"
fi

if [ -n "$(git ls-remote --tags origin "$TAG")" ]; then
    echo "  tag $TAG already exists on origin, skipping push"
else
    echo "+ git push origin $TAG"
    git push origin "$TAG"
fi

echo ""
echo "== GitHub release =="
if gh release view "$TAG" >/dev/null 2>&1; then
    echo "  GitHub release $TAG already exists, skipping gh release create"
else
    NOTES_FILE="$REPO_ROOT/release/RELEASE_NOTES.md"
    if [ -f "$NOTES_FILE" ]; then
        echo "+ gh release create $TAG $DIST_DIR/* --title \"$NAME $VERSION\" --notes-file $NOTES_FILE"
        gh release create "$TAG" "$DIST_DIR"/* --title "$NAME $VERSION" --notes-file "$NOTES_FILE"
    else
        echo "+ gh release create $TAG $DIST_DIR/* --title \"$NAME $VERSION\" --notes \"$NAME $VERSION\""
        gh release create "$TAG" "$DIST_DIR"/* --title "$NAME $VERSION" --notes "$NAME $VERSION"
    fi
fi

echo ""
echo "Done. Publishing to PyPI is a separate manual step - run:"
echo "  twine upload $DIST_DIR/*"
