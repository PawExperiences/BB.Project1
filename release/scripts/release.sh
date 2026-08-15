#!/bin/sh
set -eu

VERSION="${CALTOOL_VERSION:-0.1.0}"
TAG="v${VERSION}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "${SCRIPT_DIR}/../.." && pwd)
PUBLISH_DIR="${PROJECT_DIR}/out"
ARTIFACT_ZIP="${PROJECT_DIR}/caltool-${VERSION}.zip"
NOTES_FILE="${PROJECT_DIR}/release/RELEASE_NOTES.md"

cd "${PROJECT_DIR}"

echo "[release] Preparing release ${TAG} for caltool"

echo "[release] Restoring, building, and testing (gate before publish)"
dotnet restore caltool.csproj
dotnet build caltool.csproj -c Release
dotnet test tests/CalendarTests.csproj

echo "[release] Publishing to ${PUBLISH_DIR}"
rm -rf "${PUBLISH_DIR}"
dotnet publish caltool.csproj -c Release -o "${PUBLISH_DIR}"

if ! command -v zip >/dev/null 2>&1; then
  echo "[release] ERROR: 'zip' command not found. Install zip and re-run." >&2
  exit 1
fi

echo "[release] Packaging artifact ${ARTIFACT_ZIP}"
rm -f "${ARTIFACT_ZIP}"
( cd "${PUBLISH_DIR}" && zip -r "${ARTIFACT_ZIP}" . )

EXISTING_TAG=$(git tag --list "${TAG}")
if [ "${EXISTING_TAG}" = "${TAG}" ]; then
  echo "[release] Tag ${TAG} already exists locally, skipping tag creation"
else
  echo "[release] Creating annotated tag ${TAG}"
  git tag -a "${TAG}" -m "caltool ${VERSION}"
fi

echo "[release] Pushing tag ${TAG} to origin (safe no-op if already present)"
git push origin "${TAG}" || true

if ! command -v gh >/dev/null 2>&1; then
  echo "[release] gh CLI not found; skipping GitHub release creation."
  echo "[release] Create it manually: attach ${ARTIFACT_ZIP} and use release/RELEASE_NOTES.md as the body."
  exit 0
fi

if gh release view "${TAG}" >/dev/null 2>&1; then
  echo "[release] GitHub release ${TAG} already exists, skipping creation"
else
  echo "[release] Creating GitHub release ${TAG}"
  if [ -f "${NOTES_FILE}" ]; then
    gh release create "${TAG}" "${ARTIFACT_ZIP}" --title "caltool ${VERSION}" --notes-file "${NOTES_FILE}"
  else
    gh release create "${TAG}" "${ARTIFACT_ZIP}" --title "caltool ${VERSION}" --notes "caltool ${VERSION}"
  fi
fi

echo "[release] Done."
