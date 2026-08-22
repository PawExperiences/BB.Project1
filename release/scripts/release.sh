#!/bin/sh
# release.sh - tag, package and publish the Space Invaders release.
#
# WHAT IT DOES
#   1. refuses to run on a dirty working tree
#   2. creates the annotated tag v<version> on HEAD (skipped if it exists)
#   3. pushes the tag to the remote (skipped if the remote already has it)
#   4. packages the tagged tree into <dist>/space-invaders-<version>.zip
#   5. publishes the GitHub release from the notes file and uploads the zip,
#      when the GitHub CLI (gh) is installed and authenticated
#
# WHEN TO RUN IT
#   From the repository root, after the release-notes PR is merged and CI on the
#   release commit is green - steps 9 to 11 of the release runbook.
#
# Idempotent and additive: already-done work is skipped and nothing is ever
# deleted, moved or force-pushed.  If the tag exists but points somewhere other
# than HEAD the script stops and asks a human.

set -eu

VERSION="0.5.0"
REMOTE="origin"
NOTES="docs/releases/0-5-0.md"
DIST="dist"
TITLE="e2e space invaders cc"
ALLOW_DIRTY=0
DRY_RUN=0

say() {
  printf '[release] %s\n' "$*"
}

usage() {
  printf '%s\n' "Usage: release.sh [--version X.Y.Z] [--remote NAME] [--notes FILE] [--dist DIR] [--allow-dirty] [--dry-run]"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --version) VERSION="${2:-}"; shift 2 ;;
    --remote) REMOTE="${2:-}"; shift 2 ;;
    --notes) NOTES="${2:-}"; shift 2 ;;
    --dist) DIST="${2:-}"; shift 2 ;;
    --allow-dirty) ALLOW_DIRTY=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) say "unknown option: $1"; usage; exit 1 ;;
  esac
done

TAG="v$VERSION"
ZIP_NAME="space-invaders-$VERSION.zip"
ZIP_PATH="$DIST/$ZIP_NAME"

if ! command -v git >/dev/null 2>&1; then
  say "git is not on PATH - cannot continue"
  exit 1
fi

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
say "repository root: $ROOT"
if [ "$DRY_RUN" -eq 1 ]; then
  say "DRY RUN - nothing will be created, pushed or published"
fi

DIRTY=$(git status --porcelain)
if [ -n "$DIRTY" ] && [ "$ALLOW_DIRTY" -eq 0 ]; then
  say "working tree is not clean - commit or stash first (or pass --allow-dirty):"
  printf '%s\n' "$DIRTY"
  exit 1
fi

HEAD_SHA=$(git rev-parse HEAD)
say "HEAD is $HEAD_SHA"

# 1. annotated tag ------------------------------------------------------------
if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null 2>&1; then
  TAG_SHA=$(git rev-parse "$TAG^{commit}")
  if [ "$TAG_SHA" != "$HEAD_SHA" ]; then
    say "tag $TAG already exists and points at $TAG_SHA, not HEAD ($HEAD_SHA)."
    say "refusing to move or delete an existing tag - ask a human."
    exit 1
  fi
  say "tag $TAG already exists on HEAD - skipping"
else
  if [ "$DRY_RUN" -eq 1 ]; then
    say "would run: git tag -a $TAG -m '$TITLE $VERSION'"
  else
    git tag -a "$TAG" -m "$TITLE $VERSION"
    say "created annotated tag $TAG"
  fi
fi

# 2. push the tag -------------------------------------------------------------
REMOTE_TAG=$(git ls-remote --tags "$REMOTE" "refs/tags/$TAG" || true)
if [ -n "$REMOTE_TAG" ]; then
  say "tag $TAG is already on $REMOTE - skipping push"
elif [ "$DRY_RUN" -eq 1 ]; then
  say "would run: git push $REMOTE $TAG"
else
  git push "$REMOTE" "$TAG"
  say "pushed $TAG to $REMOTE"
fi

# 3. package the artifact -----------------------------------------------------
if [ -f "$ZIP_PATH" ]; then
  say "artifact $ZIP_PATH already exists - skipping packaging"
elif [ "$DRY_RUN" -eq 1 ]; then
  say "would package $ZIP_PATH from $TAG"
else
  mkdir -p "$DIST"
  git archive --format=zip --prefix="space-invaders-$VERSION/" -o "$ZIP_PATH" "$TAG"
  say "packaged $ZIP_PATH"
fi

# 4. publish -------------------------------------------------------------------
if ! command -v gh >/dev/null 2>&1; then
  say "GitHub CLI (gh) not found - the tag and the artifact are ready."
  say "publish by hand with:"
  say "  gh release create $TAG --title '$TITLE $VERSION' --notes-file $NOTES"
  say "  gh release upload $TAG $ZIP_PATH"
  exit 0
fi

if gh release view "$TAG" >/dev/null 2>&1; then
  say "GitHub release $TAG already exists - skipping create"
elif [ "$DRY_RUN" -eq 1 ]; then
  say "would run: gh release create $TAG --notes-file $NOTES"
else
  if [ ! -f "$NOTES" ]; then
    say "notes file $NOTES is missing - write it first (runbook step 6)"
    exit 1
  fi
  gh release create "$TAG" --title "$TITLE $VERSION" --notes-file "$NOTES"
  say "published GitHub release $TAG"
fi

ASSETS=$(gh release view "$TAG" --json assets --jq '.assets[].name' 2>/dev/null || true)
if printf '%s\n' "$ASSETS" | grep -Fxq "$ZIP_NAME"; then
  say "asset $ZIP_NAME is already attached to $TAG - skipping upload"
elif [ "$DRY_RUN" -eq 1 ]; then
  say "would run: gh release upload $TAG $ZIP_PATH"
elif [ ! -f "$ZIP_PATH" ]; then
  say "artifact $ZIP_PATH is missing - nothing to upload"
else
  gh release upload "$TAG" "$ZIP_PATH"
  say "uploaded $ZIP_PATH"
fi

say "done - $TAG is tagged, packaged and published. Nothing was deleted."
