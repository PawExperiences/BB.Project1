#!/bin/sh
# release.sh — verify static files, tag the release, and package the artifact.
# Run from the repository root after smoke-test sign-off.
# Usage: sh release/scripts/release.sh [--check-only]
set -e

VERSION="0.1.0"
TAG="v${VERSION}"
ARTIFACT="space-invaders-${TAG}.zip"

REQUIRED_FILES="index.html game.js gameConfig.js input.js player.js formation.js invaders.js collision.js state.js level1.js level2.js level3.js boss.js README.md .github/workflows/build.yml"

echo "=== e2e Space Invaders release script — ${VERSION} ==="
echo "Timestamp: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"

# --- check files ---
MISSING=""
for f in $REQUIRED_FILES; do
  if [ ! -f "$f" ]; then
    MISSING="$MISSING $f"
  fi
done
if [ -n "$MISSING" ]; then
  echo "ERROR: Missing required files:"
  for f in $MISSING; do echo "  $f"; done
  exit 1
fi
echo "OK: All required files present."

if [ "$1" = "--check-only" ]; then
  echo "Check-only mode — done."
  exit 0
fi

# --- tag ---
if git tag -l "$TAG" | grep -q "$TAG"; then
  echo "INFO: Tag $TAG already exists — skipping tag creation."
else
  echo "Creating annotated tag $TAG ..."
  git tag -a "$TAG" -m "Release ${TAG} — initial release"
  echo "Pushing tag $TAG to origin ..."
  git push origin "$TAG"
  echo "OK: Tag $TAG pushed."
fi

# --- package ---
echo "Packaging static files into $ARTIFACT ..."
if command -v zip > /dev/null 2>&1; then
  # Collect top-level static files
  FILES_TO_PACK=""
  for f in *.html *.js *.css *.md; do
    [ -f "$f" ] && FILES_TO_PACK="$FILES_TO_PACK $f"
  done
  FILES_TO_PACK="$FILES_TO_PACK .github/workflows/build.yml"
  # shellcheck disable=SC2086
  zip -r "$ARTIFACT" $FILES_TO_PACK
  echo "OK: Artifact written to $ARTIFACT"
else
  echo "WARNING: 'zip' not found. Packaging with python3 as fallback."
  python3 -c "
import zipfile, os, glob
artifact = '${ARTIFACT}'
files = glob.glob('*.html') + glob.glob('*.js') + glob.glob('*.css') + glob.glob('*.md') + ['.github/workflows/build.yml']
files = [f for f in files if os.path.isfile(f)]
print('Packing:', files)
with zipfile.ZipFile(artifact, 'w', zipfile.ZIP_DEFLATED) as zf:
    for f in files: zf.write(f)
print('OK: Artifact written to', artifact)
"
fi

echo ""
echo "Release steps complete. Upload $ARTIFACT to the GitHub Release."
