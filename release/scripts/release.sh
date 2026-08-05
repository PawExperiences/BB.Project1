#!/bin/sh
# release.sh — tag and push v0.1.0. Run from repo root on the release branch.
set -e

VERSION="v0.1.0"
MESSAGE="Release v0.1.0 — initial release: e2e Space Invaders"

# Idempotency: skip if tag already exists locally
if git tag -l "$VERSION" | grep -q "$VERSION"; then
  echo "Tag $VERSION already exists locally — skipping creation."
else
  git tag -a "$VERSION" -m "$MESSAGE"
  echo "Created annotated tag $VERSION."
fi

# Push (no force — never overwrite remote history)
git push origin "$VERSION"
echo "Tag $VERSION pushed to origin. Release complete."
