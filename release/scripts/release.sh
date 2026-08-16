#!/bin/sh
# BuildBoard release helper: tags, builds and publishes a GitHub Release.
# Usage: GITHUB_TOKEN=xxxx sh release/scripts/release.sh
set -e

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)
VERSION=${RELEASE_VERSION:-0.6.0}
REPO=${GITHUB_REPO:-PawExperiences/BB.Project1}
BUILD_DIR=${BUILD_DIR:-build}
NOTES_FILE=${RELEASE_NOTES_FILE:-RELEASE_NOTES.md}
API=https://api.github.com

echo "== releasing $VERSION for $REPO =="

# 1. tag (idempotent)
if git -C "$REPO_ROOT" tag --list "$VERSION" | grep -qx "$VERSION"; then
  echo "tag $VERSION already exists locally -- skipping"
else
  echo "+ git tag -a $VERSION"
  git -C "$REPO_ROOT" tag -a "$VERSION" -m "Release $VERSION"
fi
if git -C "$REPO_ROOT" ls-remote --tags origin "$VERSION" 2>/dev/null | grep -q "refs/tags/$VERSION"; then
  echo "tag $VERSION already on origin -- skipping push"
else
  echo "+ git push origin refs/tags/$VERSION"
  git -C "$REPO_ROOT" push origin "refs/tags/$VERSION"
fi

# 2. build (skipped with a message if there is nothing to build yet)
ARTIFACT=""
if [ -f "$REPO_ROOT/CMakeLists.txt" ]; then
  echo "+ cmake -S $REPO_ROOT -B $REPO_ROOT/$BUILD_DIR -DCMAKE_BUILD_TYPE=Release"
  cmake -S "$REPO_ROOT" -B "$REPO_ROOT/$BUILD_DIR" -DCMAKE_BUILD_TYPE=Release
  echo "+ cmake --build $REPO_ROOT/$BUILD_DIR"
  cmake --build "$REPO_ROOT/$BUILD_DIR"
  ARTIFACT="$REPO_ROOT/${BUILD_DIR}-${VERSION}.zip"
  if [ -f "$ARTIFACT" ]; then
    echo "$(basename "$ARTIFACT") already exists -- reusing it"
  elif command -v zip >/dev/null 2>&1; then
    echo "+ zip -rq $(basename "$ARTIFACT") $BUILD_DIR"
    (cd "$REPO_ROOT" && zip -rq "$(basename "$ARTIFACT")" "$BUILD_DIR" -x "*/CMakeFiles/*")
  else
    echo "zip not found -- skipping artifact packaging (asset upload will be skipped)"
    ARTIFACT=""
  fi
else
  echo "no CMakeLists.txt at $REPO_ROOT -- nothing to build; publishing without a binary asset"
fi

# 3. publish the GitHub release (idempotent)
if [ -z "$GITHUB_TOKEN" ]; then
  echo "GITHUB_TOKEN is not set -- export a token with Contents: read/write and retry" >&2
  exit 1
fi
STATUS=$(curl -s -o /tmp/bb_release.json -w "%{http_code}" \
  -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" \
  "$API/repos/$REPO/releases/tags/$VERSION")
if [ "$STATUS" = "200" ]; then
  echo "GitHub release $VERSION already exists -- reusing it"
else
  BODY="Release $VERSION."
  [ -f "$REPO_ROOT/$NOTES_FILE" ] && BODY=$(cat "$REPO_ROOT/$NOTES_FILE")
  ESCAPED_BODY=$(printf '%s' "$BODY" | sed ':a;N;$!ba;s/\\/\\\\/g;s/"/\\"/g;s/\n/\\n/g')
  echo "+ POST /repos/$REPO/releases"
  curl -s -o /tmp/bb_release.json -w "%{http_code}\n" -X POST \
    -H "Authorization: Bearer $GITHUB_TOKEN" -H "Accept: application/vnd.github+json" \
    -d "{\"tag_name\":\"$VERSION\",\"name\":\"e2e prime tester cc $VERSION\",\"body\":\"$ESCAPED_BODY\",\"draft\":false,\"prerelease\":false}" \
    "$API/repos/$REPO/releases"
fi

# 4. upload the artifact (idempotent, skipped if none was built)
if [ -n "$ARTIFACT" ] && [ -f "$ARTIFACT" ]; then
  UPLOAD_URL=$(grep -o '"upload_url": *"[^"]*"' /tmp/bb_release.json | head -1 | sed -E 's/.*"(https:[^"]*)\{.*/\1/')
  ASSET_NAME=$(basename "$ARTIFACT")
  if [ -n "$UPLOAD_URL" ]; then
    if grep -q "\"name\": *\"$ASSET_NAME\"" /tmp/bb_release.json; then
      echo "asset $ASSET_NAME already attached -- skipping upload"
    else
      echo "+ uploading $ASSET_NAME"
      curl -s -o /dev/null -w "upload status: %{http_code}\n" -X POST \
        -H "Authorization: Bearer $GITHUB_TOKEN" -H "Content-Type: application/zip" \
        --data-binary "@$ARTIFACT" "$UPLOAD_URL?name=$ASSET_NAME"
    fi
  else
    echo "could not determine upload_url from the release response -- attach $ASSET_NAME by hand from the Releases page" >&2
  fi
fi

echo "== done =="
