#!/usr/bin/env sh
# release.sh – Tag, package, and publish e2e space invaders 0.1.0.
# Run from the repository root after smoke tests pass.
# Requires: git, gh (GitHub CLI), GH_TOKEN env var with repo scope.
# Idempotent: skips steps already completed.
set -e

VERSION="0.1.0"
TAG="v${VERSION}"
REPO="PawExperiences/BB.Project1"
ARTIFACT="e2e-space-invaders-${VERSION}.zip"
CHANGELOG="CHANGELOG.md"
SOURCE_FILES="index.html game.js gameConfig.js input.js player.js invaders.js collision.js README.md .github/workflows/build.yml"

echo "=== Release ${VERSION} ==="

# --- Tag ---
if git tag -l "${TAG}" | grep -q "${TAG}"; then
  echo "[skip] Tag ${TAG} already exists."
else
  echo "[tag] Creating annotated tag ${TAG}..."
  git tag -a "${TAG}" -m "Release e2e space invaders ${VERSION}"
  git push origin "${TAG}"
  echo "[tag] ${TAG} pushed."
fi

# --- Package ---
if [ -f "${ARTIFACT}" ]; then
  echo "[skip] Artifact ${ARTIFACT} already exists."
else
  echo "[package] Creating ${ARTIFACT}..."
  # Use python zip for portability (zip may not be installed everywhere)
  python3 - <<'PYEOF'
import zipfile, os, sys
artifact = os.environ.get('ARTIFACT', 'e2e-space-invaders-0.1.0.zip')
files = os.environ.get('SOURCE_FILES', '').split()
with zipfile.ZipFile(artifact, 'w', zipfile.ZIP_DEFLATED) as zf:
    for f in files:
        if os.path.exists(f):
            zf.write(f)
            print(f'  added: {f}')
        else:
            print(f'  [warn] missing: {f}')
print(f'[package] {artifact} created.')
PYEOF
fi

# --- GitHub Release ---
if [ -z "${GH_TOKEN}" ]; then
  echo "[error] GH_TOKEN env var is not set. Cannot create GitHub Release."
  exit 1
fi

if gh release view "${TAG}" --repo "${REPO}" > /dev/null 2>&1; then
  echo "[skip] GitHub Release ${TAG} already exists."
else
  echo "[release] Creating GitHub Release ${TAG}..."
  if [ -f "${CHANGELOG}" ]; then
    gh release create "${TAG}" "${ARTIFACT}" \
      --repo "${REPO}" \
      --title "e2e space invaders ${VERSION}" \
      --notes-file "${CHANGELOG}"
  else
    gh release create "${TAG}" "${ARTIFACT}" \
      --repo "${REPO}" \
      --title "e2e space invaders ${VERSION}" \
      --notes "e2e space invaders ${VERSION} - initial release."
  fi
  echo "[release] GitHub Release ${TAG} published."
fi

export ARTIFACT SOURCE_FILES
echo "=== Done ==="
