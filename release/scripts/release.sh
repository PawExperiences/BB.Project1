#!/bin/sh
# Automated release script for wordcount v0.1.0.
# Runs the verification suite, cross-builds release binaries, tags the
# repo, and publishes a GitHub release with the changelog notes.
# Run from the repository root after all release checks pass.
# Idempotent: safe to re-run; skips steps that are already done.
set -eu

VERSION=0.1.0
TAG=v$VERSION
MODULE=wordcount
DIST_DIR=dist
NOTES_FILE=release/RELEASE_NOTES.md
TARGETS='linux/amd64 darwin/amd64 darwin/arm64 windows/amd64'

if ! command -v go >/dev/null 2>&1; then
  echo 'error: go toolchain not found on PATH' >&2
  exit 1
fi
if ! command -v git >/dev/null 2>&1; then
  echo 'error: git not found on PATH' >&2
  exit 1
fi

echo '== running verification suite =='
go build ./...
go vet ./...
go test ./...

UNFORMATTED=$(gofmt -l .)
if [ -n "$UNFORMATTED" ]; then
  echo 'error: gofmt reports unformatted files:' >&2
  echo "$UNFORMATTED" >&2
  exit 1
fi

echo '== building release binaries =='
mkdir -p $DIST_DIR
for target in $TARGETS; do
  GOOS=${target%/*}
  GOARCH=${target#*/}
  EXT=
  [ "$GOOS" = windows ] && EXT=.exe
  OUT=$DIST_DIR/$MODULE-$VERSION-$GOOS-$GOARCH$EXT
  echo "+ GOOS=$GOOS GOARCH=$GOARCH go build -o $OUT ."
  CGO_ENABLED=0 GOOS=$GOOS GOARCH=$GOARCH go build -o "$OUT" .
  echo "built $OUT"
done

echo '== tagging release =='
if git rev-parse -q --verify refs/tags/$TAG >/dev/null 2>&1; then
  echo "$TAG already exists locally, skipping tag creation"
else
  git tag -a $TAG -m "Release $TAG"
fi
git push origin $TAG

echo '== publishing GitHub release =='
if ! command -v gh >/dev/null 2>&1; then
  echo 'gh CLI not found; skipping automated publish.'
  echo "Publish manually: create a GitHub release for $TAG using $NOTES_FILE as the body and upload files from $DIST_DIR"
  exit 0
fi

if gh release view $TAG >/dev/null 2>&1; then
  echo "$TAG release already exists on GitHub, skipping create"
else
  gh release create $TAG "$DIST_DIR"/* --title $TAG --notes-file $NOTES_FILE
fi

echo "release $TAG complete"
