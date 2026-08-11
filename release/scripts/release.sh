#!/bin/sh
set -eu

VERSION="${RELEASE_VERSION:-0.1.0}"
TAG="${RELEASE_TAG:-v$VERSION}"
REMOTE="${RELEASE_REMOTE:-origin}"
BRANCH="${RELEASE_BRANCH:-main}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
cd "$REPO_ROOT"

echo "-- Running test suite (python -m pytest) --"
python3 -m pytest -q

echo "-- Running ruff lint and format checks --"
ruff check src tests
ruff format --check src tests

echo "-- Verifying shipped unit tables match the resolved metric-only spec --"
python3 - <<'PYEOF'
import sys
sys.path.insert(0, "src")
from units import LENGTH_FACTORS, MASS_FACTORS
expected_length = {"m", "km", "cm", "mm"}
expected_mass = {"g", "kg", "mg"}
if set(LENGTH_FACTORS) != expected_length or set(MASS_FACTORS) != expected_mass:
    print("!! Unit table mismatch: this release bundle has two conflicting task specs.")
    print("   expected length=%s mass=%s" % (sorted(expected_length), sorted(expected_mass)))
    print("   found    length=%s mass=%s" % (sorted(LENGTH_FACTORS), sorted(MASS_FACTORS)))
    print("   STOP and have a human confirm which unit set is meant to ship before releasing.")
    sys.exit(1)
print("   unit tables OK")
PYEOF

rm -rf dist
if command -v uv >/dev/null 2>&1; then
  echo "-- Building distribution artifacts (uv build) --"
  uv build
else
  echo "-- uv not found, building with python -m build --"
  python3 -m build
fi

WHEEL=$(find dist -maxdepth 1 -name "*${VERSION}*" | head -n 1)
if [ -z "$WHEEL" ]; then
  echo "!! No build artifacts matching version $VERSION found in dist/"
  exit 1
fi
echo "   built artifacts:"
find dist -maxdepth 1 -type f -name "*${VERSION}*" -print

if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  echo "-- Tag $TAG already exists locally, skipping tag creation --"
else
  echo "-- Creating annotated tag $TAG --"
  git tag -a "$TAG" -m "e2e unit converter $VERSION"
  echo "-- Pushing tag $TAG to $REMOTE --"
  git push "$REMOTE" "$TAG"
fi

if command -v gh >/dev/null 2>&1; then
  if gh release view "$TAG" >/dev/null 2>&1; then
    echo "-- GitHub release $TAG already exists, skipping creation --"
  else
    NOTES_FILE="release/RELEASE_NOTES.md"
    echo "-- Creating GitHub release $TAG --"
    if [ -f "$NOTES_FILE" ]; then
      gh release create "$TAG" dist/*"${VERSION}"* --title "e2e unit converter $VERSION" --target "$BRANCH" --notes-file "$NOTES_FILE"
    else
      gh release create "$TAG" dist/*"${VERSION}"* --title "e2e unit converter $VERSION" --target "$BRANCH" --notes "e2e unit converter $VERSION"
    fi
  fi
else
  echo "-- GitHub CLI (gh) not found; skipping release publish. Install gh and re-run, or publish manually. --"
fi

echo "Release $TAG complete."
