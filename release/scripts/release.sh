#!/bin/sh
# Releases wordcount: runs fmt/vet/build/test checks, builds the CLI binary,
# tags the commit, pushes the tag, and publishes/refreshes the GitHub release.
# Usage: VERSION=0.1.0 sh release/scripts/release.sh
set -eu

VERSION="${VERSION:-0.1.0}"
TAG="v${VERSION}"
REMOTE="${REMOTE:-origin}"
BRANCH="${BRANCH:-main}"
OUT_PATH="${OUT_PATH:-dist/wordcount}"
NOTES_FILE="${NOTES_FILE:-release/notes/${TAG}.md}"

echo "==> Releasing ${TAG} from branch ${BRANCH}"

echo "==> Checking working tree is clean"
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree is not clean. Commit or stash changes first." >&2
  exit 1
fi

echo "==> Fetching and fast-forwarding ${BRANCH}"
git fetch "$REMOTE"
git checkout "$BRANCH"
git merge --ff-only "$REMOTE/$BRANCH"

echo "==> Checking gofmt"
UNFORMATTED="$(gofmt -l .)"
if [ -n "$UNFORMATTED" ]; then
  echo "ERROR: the following files are not gofmt-clean:" >&2
  echo "$UNFORMATTED" >&2
  exit 1
fi

echo "==> Running go vet ./..."
go vet ./...

echo "==> Running go test ./..."
go test ./...

echo "==> Building ${OUT_PATH}"
mkdir -p "$(dirname "$OUT_PATH")"
go build -o "$OUT_PATH" ./...

echo "==> Tagging ${TAG}"
if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag ${TAG} already exists locally, skipping tag creation."
else
  git tag -a "$TAG" -m "e2e word count ${TAG}"
fi

echo "==> Pushing tag ${TAG} to ${REMOTE}"
if git ls-remote --tags "$REMOTE" | grep -q "refs/tags/${TAG}$"; then
  echo "Tag ${TAG} already exists on ${REMOTE}, skipping push."
else
  git push "$REMOTE" "$TAG"
fi

echo "==> Publishing GitHub release ${TAG}"
if ! command -v gh >/dev/null 2>&1; then
  echo "WARNING: gh CLI not found; skipping GitHub release creation. Install the GitHub CLI and re-run, or create the release manually and upload ${OUT_PATH}." >&2
  exit 0
fi

if gh release view "$TAG" >/dev/null 2>&1; then
  echo "GitHub release ${TAG} already exists, refreshing artifact."
  gh release upload "$TAG" "$OUT_PATH" --clobber
else
  if [ -f "$NOTES_FILE" ]; then
    gh release create "$TAG" "$OUT_PATH" --title "e2e word count ${VERSION}" --notes-file "$NOTES_FILE"
  else
    echo "WARNING: notes file ${NOTES_FILE} not found; creating release with auto-generated notes." >&2
    gh release create "$TAG" "$OUT_PATH" --title "e2e word count ${VERSION}" --generate-notes
  fi
fi

echo "==> Done. Released ${TAG}."
