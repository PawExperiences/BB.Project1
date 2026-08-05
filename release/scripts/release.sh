#!/usr/bin/env sh
# release.sh — Creates and pushes the v0.1.0 annotated release tag.
# Run ONCE on main after all pre-release checks pass.
set -eu

TAG="v0.1.0"
MESSAGE="e2e Space Invaders 0.1.0 — initial release"
REMOTE="origin"

echo "[release] Checking current branch..."
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  printf "[release] WARNING: current branch is '%s', not 'main'. Proceed? [y/N] " "$BRANCH"
  read -r REPLY
  case "$REPLY" in
    y|Y) ;;
    *) echo "[release] Aborted."; exit 1 ;;
  esac
fi

echo "[release] Checking if tag already exists locally..."
if git tag -l "$TAG" | grep -q "^${TAG}$"; then
  echo "[release] Tag $TAG already exists locally — skipping tag creation."
else
  echo "[release] Creating annotated tag $TAG..."
  git tag -a "$TAG" -m "$MESSAGE"
  echo "[release] Tag $TAG created."
fi

echo "[release] Checking if tag already exists on $REMOTE..."
if git ls-remote --tags "$REMOTE" "$TAG" | grep -q "$TAG"; then
  echo "[release] Tag $TAG already exists on $REMOTE — skipping push."
else
  echo "[release] Pushing tag $TAG to $REMOTE..."
  git push "$REMOTE" "$TAG"
  echo "[release] Tag $TAG pushed."
fi

echo "[release] Done. Release $TAG is live on $REMOTE."
echo "[release] Next step: publish the GitHub Release at"
echo "  https://github.com/PawExperiences/BB.Project1/releases/new?tag=$TAG"
