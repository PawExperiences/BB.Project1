#!/bin/sh
# release.sh -- automated release steps for Space Invaders 0.1.0.
#
# WHAT IT DOES (in order; every step is idempotent, safe to re-run):
#   1. Verifies that every game file of the release is present.
#   2. Creates the annotated git tag v0.1.0 (skipped if it already exists).
#   3. Builds dist/space-invaders-0.1.0.tar.gz FROM THE TAG via git archive,
#      so the artifact always matches the tagged source exactly (falls back
#      to tar from the working tree if git archive is unavailable).
#   4. Pushes the tag to origin (skipped if the remote already has it).
#   5. Creates the GitHub release v0.1.0 with the tarball attached IF the
#      gh CLI is available (skipped if the release exists); otherwise
#      prints the exact manual steps.
#
# WHEN TO RUN: once, from an up-to-date checkout of main, AFTER the
# release PR (changelog + notes + these scripts) is merged and CI is green.
#
# USAGE: sh release/scripts/release.sh
# POSIX sh only; requires git (and optionally gh).

set -u

VERSION="0.1.0"
TAG="v$VERSION"
TITLE="Space Invaders $VERSION"
ARTIFACT="dist/space-invaders-$VERSION.tar.gz"

CORE_FILES="index.html game.js gameConfig.js input.js player.js invaders.js collision.js level1.js level2.js level3.js boss.js README.md"
OPTIONAL_FILES="levels.js CHANGELOG.md"

cd "$(dirname "$0")/../.." || exit 1
echo "Releasing $TITLE from $(pwd)"

# 1. verify files
missing=""
for f in $CORE_FILES; do
  if [ ! -f "$f" ]; then missing="$missing $f"; fi
done
if [ -n "$missing" ]; then
  echo "ERROR: missing release files:$missing"
  echo "All bundled game cards must be merged before tagging."
  exit 1
fi
FILES="$CORE_FILES"
for f in $OPTIONAL_FILES; do
  if [ -f "$f" ]; then FILES="$FILES $f"; fi
done
echo "All release files present."

# 2. tag
if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG already exists locally - skipping."
else
  echo "+ git tag -a $TAG -m \"$TITLE\""
  git tag -a "$TAG" -m "$TITLE" || exit 1
  echo "Created annotated tag $TAG."
fi

# 3. artifact from the tag
mkdir -p dist
echo "+ git archive --format=tar.gz -o $ARTIFACT $TAG -- $FILES"
if git archive --format=tar.gz -o "$ARTIFACT" "$TAG" -- $FILES; then
  echo "Built $ARTIFACT from tag $TAG."
else
  echo "WARNING: git archive failed; falling back to tar from working tree."
  # intentional word splitting of $FILES
  tar -czf "$ARTIFACT" $FILES || exit 1
  echo "Built $ARTIFACT from working tree."
fi

# 4. push tag
if git ls-remote --tags origin "$TAG" 2>/dev/null | grep -F -q "$TAG"; then
  echo "Remote already has $TAG - skipping push."
else
  echo "+ git push origin $TAG"
  if git push origin "$TAG"; then
    echo "Pushed $TAG to origin."
  else
    echo "WARNING: could not push the tag (auth/network?)."
    echo "Push it manually: git push origin $TAG"
  fi
fi

# 5. github release
if command -v gh >/dev/null 2>&1; then
  if gh release view "$TAG" >/dev/null 2>&1; then
    echo "GitHub release $TAG already exists - skipping."
  else
    if [ -f release/RELEASE_NOTES.md ]; then
      echo "+ gh release create $TAG $ARTIFACT --notes-file release/RELEASE_NOTES.md"
      gh release create "$TAG" "$ARTIFACT" --title "$TITLE" --latest --notes-file release/RELEASE_NOTES.md
    else
      echo "+ gh release create $TAG $ARTIFACT --notes <default>"
      gh release create "$TAG" "$ARTIFACT" --title "$TITLE" --latest --notes "$TITLE - a complete four-level Space Invaders in dependency-free ES modules. Open index.html in a browser (file:// works, no server needed) and press ENTER. See CHANGELOG.md for the full list of changes."
    fi
    if [ $? -ne 0 ]; then
      echo "WARNING: gh release create failed; finish manually (see below)."
    else
      echo "GitHub release $TAG created with $ARTIFACT."
    fi
  fi
else
  echo "gh CLI not found - finish the release manually:"
  echo "  1. Open https://github.com/PawExperiences/BB.Project1/releases/new"
  echo "  2. Choose tag $TAG, title '$TITLE'"
  echo "  3. Paste the release notes and attach $ARTIFACT"
fi

echo "Done. $TITLE release steps completed."
