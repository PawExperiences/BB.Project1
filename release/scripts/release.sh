#!/bin/sh
# Release automation for csvclean 0.1.0.
#
# Confirms the CI build workflow still matches this release's toolchain, runs
# the test suite, builds the sdist/wheel, smoke-tests the built wheel in a
# throwaway venv, tags the release (if the tag does not already exist), and
# creates the GitHub release (if it does not already exist). Safe to re-run.
#
# Requires: git and the GitHub CLI ("gh") authenticated with push/release
# permissions on the repository remote.
set -eu

VERSION="0.1.0"
TAG="v$VERSION"
RELEASE_TITLE="csvclean $VERSION"
NOTES_PATH="release/notes/$TAG.md"
DIST_DIR="dist"
WORKFLOW_PATH=".github/workflows/build.yml"

echo "== csvclean release $VERSION =="

echo "-- checking $WORKFLOW_PATH matches this release's toolchain --"
if [ -f "$WORKFLOW_PATH" ]; then
  if grep -q "3.12" "$WORKFLOW_PATH" && grep -q "build" "$WORKFLOW_PATH"; then
    echo "  OK: workflow references Python 3.12 and a build command"
  else
    echo "  WARNING: $WORKFLOW_PATH may not match pyproject.toml's requires-python (>=3.12)"
    echo "  or the 'python -m build' command. If the build resource's command or"
    echo "  artifact_path changed for this release, update the build resource config"
    echo "  (not this workflow file) so it re-scaffolds."
  fi
else
  echo "  WARNING: $WORKFLOW_PATH not found; cannot verify CI toolchain currency"
fi

echo "-- running test suite --"
python3 -m pytest

echo "-- building distribution artifacts --"
python3 -m build

WHEEL=""
if [ -d "$DIST_DIR" ]; then
  for f in "$DIST_DIR"/csvclean-"$VERSION"*.whl; do
    [ -e "$f" ] && WHEEL="$f"
  done
fi

if [ -n "$WHEEL" ]; then
  echo "-- smoke-testing built wheel in a temporary venv --"
  TMPVENV=$(mktemp -d)
  python3 -m venv "$TMPVENV"
  "$TMPVENV/bin/pip" install "$WHEEL"
  "$TMPVENV/bin/csvclean" --help
  rm -rf "$TMPVENV"
  echo "  OK: csvclean installs and runs from the built wheel"
else
  echo "  WARNING: could not find a built wheel in $DIST_DIR to smoke-test"
fi

if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null 2>&1; then
  echo "-- tag $TAG already exists, skipping tag/push --"
else
  echo "-- tagging $TAG --"
  git tag -a "$TAG" -m "$RELEASE_TITLE"
  git push origin "$TAG"
fi

if gh release view "$TAG" >/dev/null 2>&1; then
  echo "-- GitHub release $TAG already exists, skipping create --"
else
  echo "-- creating GitHub release $TAG --"
  ASSETS=""
  if [ -d "$DIST_DIR" ]; then
    for f in "$DIST_DIR"/*"$VERSION"*; do
      [ -e "$f" ] && ASSETS="$ASSETS $f"
    done
  fi
  if [ -f "$NOTES_PATH" ]; then
    gh release create "$TAG" $ASSETS --title "$RELEASE_TITLE" --notes-file "$NOTES_PATH"
  else
    gh release create "$TAG" $ASSETS --title "$RELEASE_TITLE" --notes "Release $VERSION"
  fi
fi

echo "== release $VERSION complete =="
