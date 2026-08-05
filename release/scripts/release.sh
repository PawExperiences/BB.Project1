#!/bin/sh
# release.sh — packages game files, creates git tag v0.1.0, pushes tag to origin.
# Run from the repository root after all manual checks pass.
set -eu

VERSION="0.1.0"
TAG="v${VERSION}"
ZIP_NAME="e2e-space-invaders-${VERSION}.zip"
FILES="index.html game.js gameConfig.js input.js player.js invaders.js collision.js explosion.js level1.js level2.js level3.js boss.js README.md"

# Move to repo root (script lives in release/scripts/)
cd "$(dirname "$0")/../.."
echo "Working in: $(pwd)"

# 1. Clean working tree check
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: Working tree is not clean. Commit or stash changes first." >&2
  exit 1
fi
echo "Working tree is clean."

# 2. Check required files
for f in $FILES; do
  if [ ! -f "$f" ]; then
    echo "ERROR: Missing file: $f" >&2
    exit 1
  fi
done
echo "All source files present."

# 3. Create zip artefact (idempotent: overwrite)
OUT="release/scripts/${ZIP_NAME}"
mkdir -p release/scripts
rm -f "$OUT"
zip -j "$OUT" $FILES
echo "Artefact created: $OUT"

# 4. Create annotated tag (idempotent)
if git tag -l "$TAG" | grep -q "^${TAG}$"; then
  echo "Tag $TAG already exists, skipping tag creation."
else
  git tag -a "$TAG" -m "Release $TAG - initial four-level Space Invaders"
  echo "Tag $TAG created."
fi

# 5. Push tag
git push origin "$TAG"
echo "Tag $TAG pushed to origin."
echo ""
echo "Done. Upload $OUT to the GitHub Release for $TAG."
