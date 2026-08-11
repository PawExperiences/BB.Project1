#!/bin/sh
# Idempotent release script for e2e word count.
set -eu

VERSION="v0.1.0"
BINARY_NAME="wordcount"
DIST_DIR="dist"

echo "== e2e word count release $VERSION =="

echo "-- Running gofmt check"
UNFORMATTED=$(gofmt -l .)
if [ -n "$UNFORMATTED" ]; then
    echo "gofmt found unformatted files:" >&2
    echo "$UNFORMATTED" >&2
    exit 1
fi

echo "-- Running go build"
go build ./...

echo "-- Running go test"
go test ./...

echo "-- Preparing dist directory: $DIST_DIR"
mkdir -p "$DIST_DIR"

build_target() {
    goos=$1
    goarch=$2
    ext=$3
    out="$DIST_DIR/${BINARY_NAME}_${goos}_${goarch}${ext}"
    echo "-- Building $out"
    GOOS="$goos" GOARCH="$goarch" go build -o "$out" .
}

build_target linux amd64 ""
build_target linux arm64 ""
build_target darwin amd64 ""
build_target darwin arm64 ""
build_target windows amd64 ".exe"

echo "-- Tagging $VERSION (skipped if it already exists)"
if git rev-parse "$VERSION" >/dev/null 2>&1; then
    echo "Tag $VERSION already exists locally, skipping tag creation"
else
    git tag -a "$VERSION" -m "e2e word count $VERSION"
fi

echo "-- Pushing tag $VERSION to origin (additive only)"
git push origin "$VERSION"

if command -v gh >/dev/null 2>&1; then
    echo "-- Publishing GitHub release via gh CLI"
    if gh release view "$VERSION" >/dev/null 2>&1; then
        echo "Release $VERSION already exists on GitHub, skipping creation"
    else
        gh release create "$VERSION" "$DIST_DIR"/* \
            --title "e2e word count $VERSION" \
            --notes-file RELEASE_NOTES.md
    fi
else
    echo "gh CLI not found; skipping GitHub release publish step." >&2
    echo "Install https://cli.github.com/ or publish manually with the artifacts in $DIST_DIR" >&2
fi

echo "== Release $VERSION complete =="
