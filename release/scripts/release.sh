#!/bin/sh
# release.sh — tag v0.1.0, push, and zip the distributable artifact.
# Run from the repository root. Idempotent: skips tag creation if already exists.
set -e

VERSION="v0.1.0"
ZIP_NAME="e2e-space-invaders-${VERSION}.zip"

FILES="index.html game.js gameConfig.js input.js player.js invaders.js collision.js level1.js level2.js level3.js boss.js shared/invaders.js README.md"

echo "[release] Checking for existing tag ${VERSION}..."
if git tag -l "${VERSION}" | grep -q "${VERSION}"; then
  echo "[release] Tag ${VERSION} already exists — skipping tag creation."
else
  echo "[release] Creating annotated tag ${VERSION}..."
  git tag -a "${VERSION}" -m "Release ${VERSION} — e2e Space Invaders initial release"
  echo "[release] Pushing tag ${VERSION} to origin..."
  git push origin "${VERSION}"
fi

echo "[release] Packaging artifact ${ZIP_NAME}..."
if command -v zip >/dev/null 2>&1; then
  EXISTING_FILES=""
  for f in $FILES; do
    if [ -f "$f" ]; then
      EXISTING_FILES="$EXISTING_FILES $f"
    else
      echo "  SKIP (not found): $f"
    fi
  done
  zip -r "$ZIP_NAME" $EXISTING_FILES
  echo "[release] Artifact written: ${ZIP_NAME}"
elif command -v python3 >/dev/null 2>&1; then
  python3 -c "
import zipfile, os
files = '$FILES'.split()
with zipfile.ZipFile('$ZIP_NAME', 'w', zipfile.ZIP_DEFLATED) as zf:
    for f in files:
        if os.path.exists(f):
            zf.write(f)
            print('  added', f)
        else:
            print('  SKIP (not found):', f)
print('[release] Artifact written: $ZIP_NAME')
"
else
  echo "[release] WARNING: neither zip nor python3 found — skipping artifact packaging."
fi

echo "[release] Done. Upload the zip to the GitHub Release page manually."
