#!/bin/sh
# release/scripts/release.sh
# Purpose: build prime_tester in Release mode, smoke-test it against the task
# acceptance criteria, then tag, push, and publish a GitHub release with the
# binary attached. Run once the CI-currency and release-tree checks have both
# passed, from a clean checkout of the branch being released.
# Usage: sh release/scripts/release.sh [VERSION]   (VERSION defaults to 0.6.0)
set -eu

VERSION="${1:-0.6.0}"
TAG="v${VERSION}"
BUILD_DIR="build"
NOTES_FILE="release/notes/${TAG}.md"

echo "== prime_tester release ${TAG} =="

echo "-- Checking working tree is clean --"
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree has uncommitted changes. Commit or stash first." >&2
  exit 1
fi

echo "-- Configuring and building (Release) --"
cmake -B "$BUILD_DIR" -DCMAKE_BUILD_TYPE=Release
cmake --build "$BUILD_DIR" --config Release

BIN=""
for c in "$BUILD_DIR/prime_tester" "$BUILD_DIR/Release/prime_tester" "$BUILD_DIR/Release/prime_tester.exe" "$BUILD_DIR/prime_tester.exe"; do
  if [ -f "$c" ]; then BIN="$c"; break; fi
done
if [ -z "$BIN" ]; then
  echo "ERROR: built executable not found under $BUILD_DIR" >&2
  exit 1
fi
echo "Found executable: $BIN"

echo "-- Smoke test: argv mode --"
out="$("$BIN" 2 3 4 17 18)"
expected="2 is prime
3 is prime
4 is not prime
17 is prime
18 is not prime"
if [ "$out" != "$expected" ]; then
  echo "ERROR: argv-mode smoke test mismatch. Got:" >&2
  echo "$out" >&2
  exit 1
fi

echo "-- Smoke test: --upto 30 --"
out_upto="$("$BIN" --upto 30)"
expected_upto="2
3
5
7
11
13
17
19
23
29"
if [ "$out_upto" != "$expected_upto" ]; then
  echo "ERROR: --upto 30 smoke test mismatch" >&2
  exit 1
fi

echo "-- Smoke test: empty stdin --"
out_empty="$(printf '' | "$BIN")"
if [ -n "$out_empty" ]; then
  echo "ERROR: empty-stdin smoke test produced output, expected none" >&2
  exit 1
fi

echo "-- Smoke test: malformed token --"
set +e
err_bad="$(printf 'abc\n' | "$BIN" 2>&1 >/dev/null)"
bad_status=$?
set -e
if [ "$bad_status" -ne 1 ] || [ "$err_bad" != "not a number: abc" ]; then
  echo "ERROR: malformed-token smoke test mismatch (status=$bad_status stderr='$err_bad')" >&2
  exit 1
fi
echo "All smoke tests passed."

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG already exists locally; skipping tag creation."
else
  echo "-- Creating annotated tag $TAG --"
  git tag -a "$TAG" -m "Release ${TAG}"
fi

echo "-- Pushing tag $TAG to origin --"
git push origin "$TAG"

if command -v gh >/dev/null 2>&1; then
  if gh release view "$TAG" >/dev/null 2>&1; then
    echo "GitHub release $TAG already exists; skipping creation."
  else
    if [ ! -f "$NOTES_FILE" ]; then
      echo "ERROR: notes file $NOTES_FILE not found. Write releaseNotes there first." >&2
      exit 1
    fi
    echo "-- Creating GitHub release $TAG --"
    gh release create "$TAG" "$BIN" --title "prime_tester ${TAG}" --notes-file "$NOTES_FILE"
  fi
else
  echo "gh CLI not found; skipping GitHub release creation. Install it and re-run, or publish manually with $BIN attached." >&2
fi

echo "== Release ${TAG} complete =="
