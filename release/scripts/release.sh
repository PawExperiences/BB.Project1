#!/bin/sh
# Idempotently tag and publish a GitHub release for this project.
#
# Usage: sh release/scripts/release.sh
#
# Environment variables:
#   RELEASE_VERSION   Version to release, e.g. "0.4.0" (default: 0.4.0)
#   RELEASE_NAME      Human release title (default: "e2e calculator cc <version>")
#   GIT_REMOTE        Git remote to push the tag to (default: origin)
#   GITHUB_REPO       "owner/repo" slug for the GitHub release (default: PawExperiences/BB.Project1)
#   CHANGELOG_FILE    Path to changelog excerpt to use as the release body (default: CHANGELOG.md)
#   DRY_RUN           If set to "1", print actions without executing them
#
# Requires: git in PATH, and the GitHub CLI ("gh", authenticated) to publish
# the GitHub release. If "gh" is not available, the script tags and pushes
# the tag only, and prints the manual "gh release create" command to run.

set -eu

VERSION="${RELEASE_VERSION:-0.4.0}"
case "$VERSION" in
  v*) TAG="$VERSION" ;;
  *) TAG="v$VERSION" ;;
esac
REMOTE="${GIT_REMOTE:-origin}"
REPO_SLUG="${GITHUB_REPO:-PawExperiences/BB.Project1}"
RELEASE_NAME="${RELEASE_NAME:-e2e calculator cc $VERSION}"
CHANGELOG_FILE="${CHANGELOG_FILE:-CHANGELOG.md}"
DRY_RUN="${DRY_RUN:-0}"

run() {
  echo "+ $*"
  if [ "$DRY_RUN" != "1" ]; then
    "$@"
  fi
}

if git tag --list "$TAG" | grep -qx "$TAG"; then
  echo "Tag $TAG already exists locally; skipping tag creation."
else
  echo "Creating annotated tag $TAG at HEAD..."
  run git tag -a "$TAG" -m "$RELEASE_NAME"
fi

echo "Pushing tag $TAG to $REMOTE (additive; never deletes or rewrites history)..."
run git push "$REMOTE" "$TAG"

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. To publish the GitHub release manually, run:"
  echo "  gh release create $TAG --repo $REPO_SLUG --title \"$RELEASE_NAME\" --notes-file $CHANGELOG_FILE"
  exit 0
fi

echo "Creating GitHub release $TAG via gh CLI..."
if [ -f "$CHANGELOG_FILE" ]; then
  run gh release create "$TAG" --repo "$REPO_SLUG" --title "$RELEASE_NAME" --notes-file "$CHANGELOG_FILE"
else
  run gh release create "$TAG" --repo "$REPO_SLUG" --title "$RELEASE_NAME" --notes "$RELEASE_NAME"
fi
echo "Done."
