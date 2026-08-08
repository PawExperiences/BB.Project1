#!/usr/bin/env sh
# release.sh — pre-flight check and artefact packager for e2e Space Invaders 0.1.0.
# Verifies required files exist, then zips them into e2e-space-invaders-0.1.0.zip.
# Run from the repository root before pushing the v0.1.0 tag.
set -e

VERSION="0.1.0"
ARTIFACT="e2e-space-invaders-${VERSION}.zip"
REQUIRED="index.html game.js gameConfig.js input.js player.js invaders.js collision.js level1.js level2.js level3.js boss.js README.md"

echo "[release.sh] e2e Space Invaders ${VERSION} — pre-flight check"
FAILED=0
for f in $REQUIRED; do
  if [ -f "$f" ]; then
    echo "  [OK] $f"
  else
    echo "  [MISSING] $f"
    FAILED=1
  fi
done

if [ "$FAILED" -eq 1 ]; then
  echo "\nPre-flight FAILED. See MISSING files above."
  exit 1
fi

echo "\n[release.sh] All required files present. Creating ${ARTIFACT} ..."
# Remove stale artefact if present (idempotent)
rm -f "$ARTIFACT"
zip "$ARTIFACT" $REQUIRED
echo "[release.sh] Artefact created: ${ARTIFACT}"
echo "[release.sh] Next step: push tag v0.1.0, then upload this zip to GitHub Releases."
