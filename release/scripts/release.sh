#!/bin/sh
# release.sh -- run the automated release steps for prime_tester.
#
# WHAT IT DOES: refuses a dirty working tree; checks whether the release tag
# already exists locally or on the remote and never moves or deletes one that
# does; builds build/prime_tester with CMake in Release mode; runs the CTest
# suite and two CLI smoke checks; packages the executable into
# dist/prime_tester-<version>-<os>-<arch>.tar.gz; creates and pushes the
# annotated tag; creates the GitHub release with that asset attached.
#
# WHEN TO RUN: on a clean checkout of main, after the release-notes PR is merged
# and the BuildBoard build of main is green. Run it with --dry-run first.
#
# POSIX sh, no bashisms. Idempotent: re-running after a partial release skips
# what is already done instead of redoing or undoing it. It never force-pushes
# and never deletes a tag, a release or an asset.

set -eu

VERSION="0.6.0"
TAG=""
REMOTE="origin"
BUILD_DIR="build"
DIST_DIR="dist"
EXE_NAME="prime_tester"
NOTES_FILE="docs/releases/0-6-0.md"
DRY_RUN=0
SKIP_BUILD=0
SKIP_TESTS=0
PUBLISH=1

usage() {
    cat <<'USAGE'
Usage: release/scripts/release.sh [options]
  --version X.Y.Z  version being released       (default 0.6.0)
  --tag NAME       tag to create                (default v<version>)
  --remote NAME    git remote to push to        (default origin)
  --notes FILE     release notes body           (default docs/releases/0-6-0.md)
  --build-dir DIR  cmake build directory        (default build)
  --skip-build     reuse an existing build directory
  --skip-tests     skip ctest and the CLI smoke checks
  --no-publish     stop after pushing the tag (no GitHub release)
  --dry-run        print every command, change nothing
  -h, --help       show this text
USAGE
}

while [ $# -gt 0 ]; do
    case "$1" in
        --version)   VERSION="${2:?--version needs a value}";   shift 2 ;;
        --tag)       TAG="${2:?--tag needs a value}";           shift 2 ;;
        --remote)    REMOTE="${2:?--remote needs a value}";     shift 2 ;;
        --notes)     NOTES_FILE="${2:?--notes needs a value}";  shift 2 ;;
        --build-dir) BUILD_DIR="${2:?--build-dir needs a value}"; shift 2 ;;
        --skip-build) SKIP_BUILD=1; shift ;;
        --skip-tests) SKIP_TESTS=1; shift ;;
        --no-publish) PUBLISH=0;   shift ;;
        --dry-run)    DRY_RUN=1;   shift ;;
        -h|--help)    usage; exit 0 ;;
        *) printf 'error: unknown option %s\n' "$1" >&2; usage >&2; exit 2 ;;
    esac
done

[ -n "$TAG" ] || TAG="v$VERSION"

say()  { printf '%s\n' "$*"; }
fail() { printf 'error: %s\n' "$*" >&2; exit 1; }
run()  {
    say "  + $*"
    if [ "$DRY_RUN" -eq 1 ]; then return 0; fi
    "$@"
}

ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || fail "not inside a git repository"
cd "$ROOT"

say "==> prime_tester release"
say "    repository : $ROOT"
say "    version    : $VERSION"
say "    tag        : $TAG"
say "    remote     : $REMOTE"
if [ "$DRY_RUN" -eq 1 ]; then say "    mode       : DRY RUN (nothing will change)"; fi

say "==> checking the working tree is clean"
if [ -n "$(git status --porcelain)" ]; then
    if [ "$DRY_RUN" -eq 1 ]; then
        say "    !! working tree is dirty (tolerated because of --dry-run)"
    else
        fail "working tree is dirty; commit or stash before releasing"
    fi
else
    say "    clean"
fi

HEAD_SHA=$(git rev-parse HEAD)
say "    release commit: $HEAD_SHA"

say "==> preflight: does $TAG already exist?"
LOCAL_TAG=$(git rev-parse -q --verify "refs/tags/$TAG" 2>/dev/null || true)
REMOTE_LINE=$(git ls-remote --tags "$REMOTE" "refs/tags/$TAG" 2>/dev/null || true)
REMOTE_TAG=$(printf '%s' "$REMOTE_LINE" | awk 'NR==1 {print $1}')
TAG_COMMIT=""
if [ -n "$LOCAL_TAG" ]; then
    TAG_COMMIT=$(git rev-list -n 1 "$TAG")
fi

if [ -n "$LOCAL_TAG" ] && [ "$TAG_COMMIT" != "$HEAD_SHA" ]; then
    fail "local tag $TAG points at $TAG_COMMIT, not HEAD ($HEAD_SHA). This script never moves a tag. Check out the right commit or release a new version."
fi
if [ -n "$REMOTE_TAG" ] && [ "$TAG_COMMIT" != "$HEAD_SHA" ]; then
    fail "$TAG already exists on $REMOTE (published by an earlier run). Moving or deleting a published tag is forbidden -- ask a human to confirm it or bump to the next version (e.g. --version 0.6.1)."
fi
if [ -n "$REMOTE_TAG" ]; then
    say "    $TAG already on $REMOTE and points at HEAD; nothing to create"
elif [ -n "$LOCAL_TAG" ]; then
    say "    $TAG exists locally at HEAD but is not pushed yet"
else
    say "    not found locally or on $REMOTE -- good"
fi

if [ "$SKIP_BUILD" -eq 1 ]; then
    say "==> build: skipped (--skip-build)"
else
    say "==> build: cmake configure + build (Release)"
    run cmake -B "$BUILD_DIR" -DCMAKE_BUILD_TYPE=Release
    run cmake --build "$BUILD_DIR"
fi

EXE=""
for cand in \
    "$BUILD_DIR/$EXE_NAME" \
    "$BUILD_DIR/Release/$EXE_NAME" \
    "$BUILD_DIR/$EXE_NAME.exe" \
    "$BUILD_DIR/Release/$EXE_NAME.exe"
do
    if [ -f "$cand" ]; then EXE="$cand"; break; fi
done
if [ -z "$EXE" ]; then
    if [ "$DRY_RUN" -eq 1 ]; then
        EXE="$BUILD_DIR/$EXE_NAME"
        say "==> executable: $EXE (assumed; dry run)"
    else
        fail "executable $EXE_NAME not found under $BUILD_DIR"
    fi
else
    say "==> executable: $EXE"
fi

if [ "$SKIP_TESTS" -eq 1 ]; then
    say "==> tests: skipped (--skip-tests)"
else
    say "==> tests: ctest"
    run ctest --test-dir "$BUILD_DIR" --output-on-failure
    if [ "$DRY_RUN" -eq 0 ]; then
        say "==> smoke: --upto 10 must print 2 3 5 7 and exit 0"
        got=$("$EXE" --upto 10)
        want=$(printf '2\n3\n5\n7')
        if [ "$got" != "$want" ]; then
            fail "smoke failed: '$EXE --upto 10' printed [$got]"
        fi
        say "==> smoke: a bad token must exit 1 without aborting the run"
        set +e
        "$EXE" 5 abc 6 >/dev/null 2>&1
        rc=$?
        set -e
        if [ "$rc" -ne 1 ]; then
            fail "smoke failed: '$EXE 5 abc 6' exited $rc, expected 1"
        fi
        say "    smoke checks passed"
    fi
fi

OS=$(uname -s 2>/dev/null || echo unknown)
ARCH=$(uname -m 2>/dev/null || echo unknown)
ASSET="$DIST_DIR/${EXE_NAME}-${VERSION}-${OS}-${ARCH}.tar.gz"
say "==> package: $ASSET"
run mkdir -p "$DIST_DIR"
if [ "$DRY_RUN" -eq 0 ]; then
    STAGE="$DIST_DIR/stage-$VERSION"
    rm -rf "$STAGE"
    mkdir -p "$STAGE"
    cp "$EXE" "$STAGE/"
    for extra in README.md CHANGELOG.md LICENSE; do
        if [ -f "$extra" ]; then cp "$extra" "$STAGE/"; fi
    done
    rm -f "$ASSET"
    tar -czf "$ASSET" -C "$STAGE" .
    rm -rf "$STAGE"
    say "    wrote $ASSET"
fi

if [ -n "$LOCAL_TAG" ]; then
    say "==> tag: $TAG already exists locally at HEAD; not re-creating"
else
    say "==> tag: creating annotated tag $TAG"
    run git tag -a "$TAG" -m "$EXE_NAME $VERSION"
fi

if [ -n "$REMOTE_TAG" ]; then
    say "==> push: $TAG already on $REMOTE; skipping"
else
    say "==> push: $TAG -> $REMOTE (no force, ever)"
    run git push "$REMOTE" "refs/tags/$TAG"
fi

if [ "$PUBLISH" -eq 0 ]; then
    say "==> publish: skipped (--no-publish)"
elif ! command -v gh >/dev/null 2>&1; then
    say "==> publish: gh CLI not found -- create the release by hand:"
    say "    gh release create $TAG --title \"$EXE_NAME $VERSION\" --notes-file $NOTES_FILE $ASSET"
else
    if gh release view "$TAG" >/dev/null 2>&1; then
        say "==> publish: release $TAG already exists; not re-creating and not deleting anything"
        say "    if the asset is missing, attach it by hand: gh release upload $TAG $ASSET"
    else
        say "==> publish: creating GitHub release $TAG"
        if [ -f "$NOTES_FILE" ]; then
            run gh release create "$TAG" --title "$EXE_NAME $VERSION" --notes-file "$NOTES_FILE" "$ASSET"
        else
            say "    !! $NOTES_FILE not found; falling back to generated notes"
            run gh release create "$TAG" --title "$EXE_NAME $VERSION" --generate-notes "$ASSET"
        fi
    fi
fi

say "==> done"
say "    commit : $HEAD_SHA"
say "    tag    : $TAG"
say "    asset  : $ASSET"
say "    next   : announce the release, then run the post-release verification"
