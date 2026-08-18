#!/bin/sh
# release.sh -- release e2e prime tester 0.3.0 (POSIX sh).
#
# Automated release steps, in order:
#   1. clean CMake configure + build (cmake -B build && cmake --build build)
#   2. run the CTest suite (ctest --output-on-failure, from build/)
#   3. smoke-test the CLI (argv mode, stdin mode, --upto 30, bad-token exit 1)
#   4. package the binary as prime_tester-<version>-<os>-<arch>.tar.gz
#   5. create and push annotated git tag v0.3.0
#   6. create the GitHub release via gh and upload the package
#
# Run once, when the release is approved:  ./release/scripts/release.sh
# Idempotent: an existing tag / release / asset is skipped, so re-running
# after a failure is safe. If gh is missing, the tag is still pushed and
# the exact manual gh command is printed.
set -eu

VERSION="${VERSION:-0.3.0}"
TAG="${TAG:-v$VERSION}"
TITLE="e2e prime tester $VERSION"

say() { printf '[release] %s\n' "$*"; }

cd "$(dirname "$0")/../.."

say "step 1/6: clean build"
rm -rf build
cmake -B build
cmake --build build

say "step 2/6: ctest"
( cd build && ctest --output-on-failure )

say "step 3/6: CLI smoke tests"
EXE=""
for c in build/prime_tester build/prime_tester.exe \
         build/Debug/prime_tester.exe build/Release/prime_tester.exe \
         build/Debug/prime_tester build/Release/prime_tester; do
  if [ -f "$c" ]; then EXE="$c"; break; fi
done
if [ -z "$EXE" ]; then
  say "FAILED: prime_tester binary not found under build/"
  exit 1
fi

OUT=$("$EXE" 2 4 17) || { say "FAILED smoke: argv mode exit code"; exit 1; }
if [ "$OUT" != "2 is prime
4 is not prime
17 is prime" ]; then
  say "FAILED smoke: argv mode output:"
  printf '%s\n' "$OUT"
  exit 1
fi

OUT=$("$EXE" --upto 30) || { say "FAILED smoke: --upto exit code"; exit 1; }
if [ "$OUT" != "2
3
5
7
11
13
17
19
23
29" ]; then
  say "FAILED smoke: --upto output:"
  printf '%s\n' "$OUT"
  exit 1
fi

OUT=$(printf '2\n4\n17\n' | "$EXE") || { say "FAILED smoke: stdin exit code"; exit 1; }
if [ "$OUT" != "2 is prime
4 is not prime
17 is prime" ]; then
  say "FAILED smoke: stdin output:"
  printf '%s\n' "$OUT"
  exit 1
fi

RC=0
ERR=$("$EXE" abc 2>&1 >/dev/null) || RC=$?
if [ "$RC" -ne 1 ]; then
  say "FAILED smoke: bad-token exit code $RC (want 1)"
  exit 1
fi
case "$ERR" in
  *"not a number: abc"*) : ;;
  *) say "FAILED smoke: bad-token stderr: $ERR"; exit 1 ;;
esac
say "smoke tests passed"

say "step 4/6: package binary"
OS=$(uname -s 2>/dev/null | tr '[:upper:]' '[:lower:]') || OS=""
ARCH=$(uname -m 2>/dev/null | tr '[:upper:]' '[:lower:]') || ARCH=""
case "$OS" in
  *linux*) OS=linux ;;
  *darwin*) OS=macos ;;
  *mingw*|*msys*|*cygwin*|*windows*) OS=windows ;;
  *) [ -n "$OS" ] || OS=unknown ;;
esac
[ -n "$ARCH" ] || ARCH=unknown
ARCHIVE="prime_tester-$VERSION-$OS-$ARCH.tar.gz"
rm -f "$ARCHIVE"
tar czf "$ARCHIVE" -C "$(dirname "$EXE")" "$(basename "$EXE")"
say "wrote $ARCHIVE"

say "step 5/6: git tag $TAG"
if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null 2>&1; then
  say "local tag $TAG already exists; skipping creation"
else
  git tag -a "$TAG" -m "$TITLE"
fi
if git ls-remote --tags origin "refs/tags/$TAG" | grep -q "refs/tags/$TAG"; then
  say "remote tag $TAG already exists; skipping push"
else
  git push origin "$TAG"
fi

say "step 6/6: GitHub release"
NOTES_FILE="build/release-notes.md"
cat > "$NOTES_FILE" <<'NOTES'
e2e prime tester 0.3.0

First release of the Prime Number Tester: a dependency-free C++17
command-line program, built with CMake (>= 3.16).

Highlights
- Single-number primality: "prime_tester 2 4 17" prints one verdict per
  line ("2 is prime", "4 is not prime", "17 is prime").
- Bulk generation: "prime_tester --upto N" lists every prime up to N, one
  per line, via a Sieve of Eratosthenes (N = 10000000 finishes in seconds).
- Forgiving input: non-numeric or out-of-range tokens are echoed verbatim
  to stderr as "not a number: <token>"; processing continues and the exit
  status is 1 if any bad token occurred, 0 on a clean run.
- Two-command build: cmake -B build && cmake --build build. The README's
  worked-examples table gives eight copy-pasteable commands with the exact
  expected output and exit status for manual verification.

Verify the build: cd build && ctest --output-on-failure
NOTES

if ! command -v gh >/dev/null 2>&1; then
  say "gh CLI not found; skipping GitHub release creation."
  say "tag $TAG is pushed; publish manually with:"
  say "  gh release create $TAG --title \"$TITLE\" --notes-file $NOTES_FILE $ARCHIVE"
  exit 0
fi
if gh release view "$TAG" >/dev/null 2>&1; then
  say "release $TAG already exists; skipping creation"
else
  gh release create "$TAG" --title "$TITLE" --notes-file "$NOTES_FILE"
fi
if gh release view "$TAG" --json assets --jq '.assets[].name' | grep -qx "$ARCHIVE"; then
  say "asset $ARCHIVE already uploaded; skipping"
else
  gh release upload "$TAG" "$ARCHIVE"
fi
say "done: release $TAG published"
