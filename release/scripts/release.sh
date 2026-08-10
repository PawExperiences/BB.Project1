#!/bin/sh
set -eu

VERSION="${VERSION:-0.4.0}"
TAG="${TAG:-v${VERSION}}"
ARTIFACT="${ARTIFACT:-target/calculator-0.1.0.jar}"
TITLE="${TITLE:-e2e calculator cc ${VERSION}}"
NOTES_FILE="${NOTES_FILE:-release/notes/RELEASE_NOTES.md}"

echo "== release.sh: releasing ${TAG} =="

echo "-> checking working tree is clean"
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree is not clean. Commit or stash changes first." >&2
  exit 1
fi

echo "-> running test suite (mvn -B test)"
mvn -B test

echo "-> building artifact (mvn -B package)"
mvn -B package

if [ ! -f "$ARTIFACT" ]; then
  echo "ERROR: expected artifact not found at $ARTIFACT" >&2
  exit 1
fi
echo "-> artifact present: $ARTIFACT"

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "-> tag $TAG already exists locally, skipping tag creation"
else
  echo "-> creating annotated tag $TAG"
  git tag -a "$TAG" -m "$TITLE"
fi

if git ls-remote --tags origin "refs/tags/$TAG" | grep -q "$TAG"; then
  echo "-> tag $TAG already present on origin, skipping push"
else
  echo "-> pushing tag $TAG to origin"
  git push origin "$TAG"
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "NOTE: gh CLI not found; skipping GitHub release creation. Install gh and re-run, or create the release manually." >&2
  exit 0
fi

if gh release view "$TAG" >/dev/null 2>&1; then
  echo "-> GitHub release $TAG already exists, uploading/overwriting artifact only"
  gh release upload "$TAG" "$ARTIFACT" --clobber
else
  echo "-> creating GitHub release $TAG"
  if [ -f "$NOTES_FILE" ]; then
    gh release create "$TAG" "$ARTIFACT" --title "$TITLE" --notes-file "$NOTES_FILE"
  else
    echo "NOTE: $NOTES_FILE not found, creating release with a placeholder note" >&2
    gh release create "$TAG" "$ARTIFACT" --title "$TITLE" --notes "See CHANGELOG.md"
  fi
fi

echo "== release.sh: done =="
