#!/bin/sh
# Release script for e2e calculator cc: builds, tags, and publishes a GitHub release.
# Run this once CI is green and the changelog/release-notes PR has merged.
# Requires: git, mvn (Maven), and the GitHub CLI (gh) authenticated, all on PATH.
set -e

JAR_PATH="target/calculator-0.1.0.jar"
RELEASE_TAG="${RELEASE_TAG:-v0.4.0}"
RELEASE_TITLE="${RELEASE_TITLE:-e2e calculator cc 0.4.0}"
NOTES_PATH="${RELEASE_NOTES_PATH:-release/RELEASE_NOTES.md}"

echo "== 1/4: building and testing with Maven =="
echo "+ mvn -B package"
mvn -B package

if [ ! -f "$JAR_PATH" ]; then
  echo "ERROR: expected jar not found at $JAR_PATH"
  exit 1
fi

echo "== 2/4: tagging $RELEASE_TAG =="
if git rev-parse -q --verify "refs/tags/$RELEASE_TAG" >/dev/null 2>&1; then
  echo "$RELEASE_TAG already exists locally, skipping tag creation"
else
  echo "+ git tag -a $RELEASE_TAG -m \"$RELEASE_TITLE\""
  git tag -a "$RELEASE_TAG" -m "$RELEASE_TITLE"
fi

echo "== 3/4: pushing tag to origin =="
echo "+ git push origin $RELEASE_TAG"
git push origin "$RELEASE_TAG"

echo "== 4/4: publishing GitHub release =="
if gh release view "$RELEASE_TAG" >/dev/null 2>&1; then
  echo "GitHub release $RELEASE_TAG already exists, skipping creation (upload assets manually if needed)"
else
  if [ -f "$NOTES_PATH" ]; then
    echo "+ gh release create $RELEASE_TAG $JAR_PATH --title \"$RELEASE_TITLE\" --notes-file $NOTES_PATH"
    gh release create "$RELEASE_TAG" "$JAR_PATH" --title "$RELEASE_TITLE" --notes-file "$NOTES_PATH"
  else
    echo "+ gh release create $RELEASE_TAG $JAR_PATH --title \"$RELEASE_TITLE\" --notes \"$RELEASE_TITLE\""
    gh release create "$RELEASE_TAG" "$JAR_PATH" --title "$RELEASE_TITLE" --notes "$RELEASE_TITLE"
  fi
fi

echo "Done: $RELEASE_TAG built, tagged, pushed, and published."
