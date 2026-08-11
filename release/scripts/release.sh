#!/bin/sh
# Purpose: performs the automated release steps for todo-api v0.1.0
#          (build+test, version bump, git tag, push, GitHub release, artifact upload).
# Run this from a clean checkout of the commit you intend to release, on the
# machine/CI runner that has push access to origin and an authenticated gh CLI.
set -eu

VERSION="0.1.0"
TAG="v${VERSION}"
TITLE="todo-api v${VERSION}"
ARTIFACT_DIR="dist"
ARTIFACT_NAME="todo-api-${VERSION}.tar.gz"
NOTES_FILE="release/RELEASE_NOTES.md"

echo "==> Checking working tree is clean"
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree has uncommitted changes. Commit or stash first." >&2
  exit 1
fi

echo "==> Installing dependencies"
npm ci

echo "==> Building (TypeScript strict compile)"
npm run build

echo "==> Running tests (Vitest)"
npm test

echo "==> Ensuring package.json version is ${VERSION}"
CURRENT_VERSION=$(node --input-type=commonjs -e "process.stdout.write(require('./package.json').version || '')")
if [ "$CURRENT_VERSION" != "$VERSION" ]; then
  node --input-type=commonjs -e "
    const fs = require('fs');
    const p = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    p.version = '${VERSION}';
    fs.writeFileSync('package.json', JSON.stringify(p, null, 2));
  "
  git add package.json
  git commit -m "chore(release): v${VERSION}"
  echo "    package.json version bumped and committed."
else
  echo "    package.json already at ${VERSION}, skipping commit."
fi

echo "==> Tagging release"
if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  echo "    Tag ${TAG} already exists, skipping."
else
  git tag -a "${TAG}" -m "${TITLE}"
  echo "    Created tag ${TAG}."
fi

echo "==> Pushing branch and tag to origin"
git push origin HEAD
git push origin "${TAG}"

if command -v gh >/dev/null 2>&1; then
  echo "==> Checking GitHub release"
  if gh release view "${TAG}" >/dev/null 2>&1; then
    echo "    Release ${TAG} already exists, skipping creation."
  else
    if [ -f "${NOTES_FILE}" ]; then
      gh release create "${TAG}" --title "${TITLE}" --notes-file "${NOTES_FILE}"
    else
      gh release create "${TAG}" --title "${TITLE}" --notes "Release ${TITLE}. See CHANGELOG.md for details."
    fi
    echo "    Created release ${TAG}."
  fi

  echo "==> Packaging and uploading artifact"
  if [ -d "${ARTIFACT_DIR}" ]; then
    tar -czf "${ARTIFACT_NAME}" -C "${ARTIFACT_DIR}" .
    if gh release view "${TAG}" --json assets --jq ".assets[].name" 2>/dev/null | grep -qx "${ARTIFACT_NAME}"; then
      echo "    Asset ${ARTIFACT_NAME} already attached, skipping upload."
    else
      gh release upload "${TAG}" "${ARTIFACT_NAME}"
      echo "    Uploaded ${ARTIFACT_NAME}."
    fi
  else
    echo "    WARNING: ${ARTIFACT_DIR} not found, skipping artifact upload." >&2
  fi
else
  echo "==> 'gh' CLI not found; skipping GitHub release creation and artifact upload."
  echo "    Install https://cli.github.com and re-run, or create the release manually."
fi

echo "==> Release ${TAG} complete."
