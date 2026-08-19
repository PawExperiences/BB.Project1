#!/bin/sh
# Release helper for e2e calculator 0.2.0.
# Builds the JAR, verifies the manifest, tags v0.2.0 (idempotent), pushes the
# tag, and creates the GitHub release via gh when available. Never deletes
# remote state; safe to re-run. Run from the repository root.
# Requires: mvn, git, unzip; gh optional. Usage: sh release/scripts/release.sh
set -eu

VERSION="0.2.0"
TAG="v$VERSION"
TITLE="e2e calculator $VERSION"
MAIN_CLASS="com.buildboard.calculator.Main"
NOTES_FILE="docs/releases/0-2-0.md"

echo "==> Building with: mvn -B clean package (full test suite)"
mvn -B clean package

jar=""
count=0
for j in target/calculator-*.jar; do
  case "$j" in *-sources.jar|*-javadoc.jar) continue;; esac
  if [ -f "$j" ]; then jar="$j"; count=$((count + 1)); fi
done
if [ "$count" -ne 1 ]; then
  echo "ERROR: expected exactly one target/calculator-*.jar, found $count" >&2
  exit 1
fi
echo "==> Artifact: $jar"

echo "==> Verifying manifest Main-Class entry"
if ! unzip -p "$jar" META-INF/MANIFEST.MF | grep -q "Main-Class: $MAIN_CLASS"; then
  echo "ERROR: $jar manifest lacks 'Main-Class: $MAIN_CLASS'" >&2
  exit 1
fi
echo "    OK: Main-Class: $MAIN_CLASS"

if [ "$(git tag -l "$TAG")" = "$TAG" ]; then
  echo "==> Tag $TAG already exists locally; leaving it untouched"
else
  echo "==> Creating annotated tag $TAG"
  git tag -a "$TAG" -m "$TITLE"
fi

if git ls-remote --exit-code --tags origin "$TAG" >/dev/null 2>&1; then
  echo "==> Tag $TAG already on origin; not pushing"
else
  echo "==> Pushing tag to origin"
  git push origin "$TAG"
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "==> gh CLI not found; create the release manually with:"
  echo "    gh release create $TAG $jar --title \"$TITLE\" --notes-file $NOTES_FILE"
  exit 0
fi

if gh release view "$TAG" >/dev/null 2>&1; then
  echo "==> Release $TAG already exists; uploading asset with --clobber"
  gh release upload "$TAG" "$jar" --clobber
else
  echo "==> Creating GitHub release $TAG"
  if [ -f "$NOTES_FILE" ]; then
    gh release create "$TAG" "$jar" --title "$TITLE" --notes-file "$NOTES_FILE"
  else
    gh release create "$TAG" "$jar" --title "$TITLE" --notes "See CHANGELOG.md for details."
  fi
fi

echo "==> Done: release $TAG published with $jar"
