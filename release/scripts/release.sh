#!/bin/sh
# release.sh — Tags the current HEAD as v0.1.0 and pushes the tag to origin.
# Run ONCE after CI is green and before creating the GitHub Release.
# Idempotent: if the tag already exists locally it skips creation and pushes.
set -e

TAG="v0.1.0"
MESSAGE="Release e2e calculator 0.1.0"

if git tag -l "$TAG" | grep -q "^${TAG}$"; then
  echo "Tag $TAG already exists locally -- skipping creation, pushing only."
else
  echo "+ git tag -a $TAG -m '$MESSAGE'"
  git tag -a "$TAG" -m "$MESSAGE"
  echo "Created annotated tag $TAG"
fi

echo "+ git push origin $TAG"
git push origin "$TAG"

echo ""
echo "Done. Tag $TAG pushed to origin."
echo "Next step: create the GitHub Release at https://github.com/PawExperiences/BB.Project1/releases/new"
