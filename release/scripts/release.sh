#!/bin/sh
# Purpose: cut and publish a wordcount release (tag, build artifacts, create GitHub release).
# Usage: release/scripts/release.sh [version]   (default: 0.1.0)
set -eu

VERSION="${1:-0.1.0}"
TAG="v${VERSION}"
DIST_DIR="dist"
NOTES_FILE="release/RELEASE_NOTES.md"

echo "==> Releasing wordcount ${TAG}"

BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "Refusing to release from branch '${BRANCH}' (expected 'main')" >&2
  exit 1
fi

echo "==> Checking toolchain"
go version

echo "==> Formatting check (gofmt -l .)"
UNFORMATTED=$(gofmt -l .)
if [ -n "$UNFORMATTED" ]; then
  echo "gofmt found unformatted files:" >&2
  echo "$UNFORMATTED" >&2
  exit 1
fi

echo "==> Building"
go build ./...

echo "==> Vetting"
go vet ./...

echo "==> Testing"
go test ./...

echo "==> Tagging ${TAG} (idempotent: skips if the tag already exists)"
if git rev-parse "${TAG}" >/dev/null 2>&1; then
  echo "Tag ${TAG} already exists, skipping tag creation"
else
  git tag -a "${TAG}" -m "Release ${TAG}"
  git push origin "${TAG}"
fi

echo "==> Building release artifacts into ${DIST_DIR}/"
mkdir -p "${DIST_DIR}"
for combo in "linux amd64" "linux arm64" "darwin amd64" "darwin arm64" "windows amd64"; do
  os=$(echo "$combo" | cut -d' ' -f1)
  arch=$(echo "$combo" | cut -d' ' -f2)
  ext=""
  if [ "$os" = "windows" ]; then ext=".exe"; fi
  out="${DIST_DIR}/wordcount_${os}_${arch}${ext}"
  echo "  building ${out}"
  GOOS="$os" GOARCH="$arch" go build -o "$out" .
done

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found; skipping GitHub release creation. Install gh, or create the release manually and upload the files in ${DIST_DIR}/." >&2
  echo "==> Done. Artifacts in ${DIST_DIR}/"
  exit 0
fi

echo "==> Creating GitHub release ${TAG} (idempotent: skips if it already exists)"
if gh release view "${TAG}" >/dev/null 2>&1; then
  echo "Release ${TAG} already exists, skipping creation"
else
  if [ -f "$NOTES_FILE" ]; then
    gh release create "${TAG}" "${DIST_DIR}"/* --title "wordcount ${TAG}" --notes-file "$NOTES_FILE"
  else
    gh release create "${TAG}" "${DIST_DIR}"/* --title "wordcount ${TAG}" --notes "See CHANGELOG.md for details."
  fi
fi

echo "==> Done. Artifacts in ${DIST_DIR}/"
