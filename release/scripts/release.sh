#!/bin/sh
# release.sh -- tag and push v0.1.0 to origin.
#
# Run from the repository root on the clean default branch,
# immediately before creating the GitHub Release.
# Idempotent: if the tag already exists locally and remotely it reports so and exits 0.

set -e

TAG="v0.1.0"
MESSAGE="Release e2e prime tester 0.1.0"
REMOTE="origin"

echo "[release] Tagging ${TAG} ..."

# Check if tag already exists locally
if git tag -l "${TAG}" | grep -q "${TAG}"; then
  echo "[release] Tag ${TAG} already exists locally -- skipping creation."
else
  git tag -a "${TAG}" -m "${MESSAGE}"
  echo "[release] Created annotated tag ${TAG}."
fi

# Check if tag already exists on remote
if git ls-remote --tags "${REMOTE}" "${TAG}" | grep -q "${TAG}"; then
  echo "[release] Tag ${TAG} already present on ${REMOTE} -- skipping push."
else
  git push "${REMOTE}" "${TAG}"
  echo "[release] Pushed ${TAG} to ${REMOTE}."
fi

echo "[release] Done. Verify at: https://github.com/PawExperiences/BB.Project1/releases"
