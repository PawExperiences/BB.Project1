#!/bin/sh
# Automated release steps for e2e quote page: build, tag, publish GitHub release.
set -eu

VERSION="${RELEASE_VERSION:-0.1.0}"
TAG="v${VERSION}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "${SCRIPT_DIR}/../.." && pwd)
DIST_DIR="${REPO_ROOT}/dist"
CHANGELOG_PATH="${REPO_ROOT}/CHANGELOG.md"

cd "${REPO_ROOT}"

echo "+ git status --porcelain"
if [ -n "$(git status --porcelain)" ]; then
  echo "Working tree is not clean. Commit or stash changes before releasing."
  exit 1
fi
echo "Working tree is clean."

echo "+ npm ci"
npm ci
echo "+ npm run build"
npm run build

if [ ! -f "${DIST_DIR}/index.html" ]; then
  echo "Build did not produce dist/index.html"
  exit 1
fi
echo "Build produced dist/index.html"

if [ -f "${CHANGELOG_PATH}" ] && grep -q "## \\[${VERSION}\\]" "${CHANGELOG_PATH}"; then
  echo "CHANGELOG.md already has an entry for ${VERSION}, skipping PR."
else
  BRANCH="release/changelog-v${VERSION}"
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  echo "+ git checkout -B ${BRANCH}"
  git checkout -B "${BRANCH}"

  TMP_FILE=$(mktemp)
  {
    echo "## [${VERSION}] - unreleased"
    echo
    echo "### Added"
    echo "- Astro static homepage that renders one of five quotes, chosen deterministically at build time."
    echo "- src/lib/pick.ts deterministic seeded picker."
    echo "- src/styles/print.css print stylesheet (black on white, 12pt serif body)."
    echo "- README documentation for install/build usage and adding a new quote."
    echo
    if [ -f "${CHANGELOG_PATH}" ]; then
      cat "${CHANGELOG_PATH}"
    else
      echo "# Changelog"
      echo
    fi
  } > "${TMP_FILE}"
  mv "${TMP_FILE}" "${CHANGELOG_PATH}"

  git add CHANGELOG.md
  git commit -m "docs: add changelog for v${VERSION}"
  git push -u origin "${BRANCH}"
  PR_TITLE="docs: changelog for v${VERSION}"
  PR_BODY="Adds the CHANGELOG.md entry for release v${VERSION}."
  gh pr create --title "${PR_TITLE}" --body "${PR_BODY}" --base "${CURRENT_BRANCH}" --head "${BRANCH}" || echo "gh pr create failed or PR already exists, continuing."

  git checkout "${CURRENT_BRANCH}"
fi

if [ -n "$(git tag --list "${TAG}")" ]; then
  echo "Tag ${TAG} already exists locally, skipping tag creation."
else
  echo "+ git tag -a ${TAG}"
  git tag -a "${TAG}" -m "e2e quote page ${VERSION}"
fi
echo "+ git push origin ${TAG}"
git push origin "${TAG}"

if command -v zip >/dev/null 2>&1; then
  ARCHIVE="${REPO_ROOT}/dist-${TAG}.zip"
  rm -f "${ARCHIVE}"
  (cd "${DIST_DIR}" && zip -r "${ARCHIVE}" .)
else
  ARCHIVE="${REPO_ROOT}/dist-${TAG}.tar.gz"
  rm -f "${ARCHIVE}"
  tar -czf "${ARCHIVE}" -C "${DIST_DIR}" .
fi
echo "Packaged ${ARCHIVE}"

if gh release view "${TAG}" >/dev/null 2>&1; then
  echo "GitHub release ${TAG} already exists, skipping creation."
else
  gh release create "${TAG}" "${ARCHIVE}" --title "e2e quote page ${VERSION}" --notes "See CHANGELOG.md for details."
fi

echo "Release ${TAG} complete."
