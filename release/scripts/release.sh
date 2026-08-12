#!/bin/sh
# release/scripts/release.sh
# Performs the automated e2e-cli-greeter release steps: verify, tag, and publish a GitHub release.
# Usage: VERSION=0.1.0 sh release/scripts/release.sh
set -e

VERSION="${VERSION:-0.1.0}"
REMOTE="${REMOTE:-origin}"
TAG="v${VERSION}"
NOTES_FILE="${NOTES_FILE:-release/notes/v${VERSION}.md}"
TITLE="${TITLE:-e2e cli greeter ${VERSION}}"

echo "== release.sh: releasing ${TITLE} as tag ${TAG} =="

if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree is not clean. Commit or stash changes before releasing." >&2
  exit 1
fi
echo "OK: working tree is clean."

if [ -f package.json ]; then
  echo "-> npm ci"
  npm ci
  if node -e "process.exit(require('./package.json').scripts && require('./package.json').scripts.lint ? 0 : 1)"; then
    echo "-> npm run lint"
    npm run lint
  else
    echo "SKIP: no 'lint' script in package.json"
  fi
  if node -e "process.exit(require('./package.json').scripts && require('./package.json').scripts.test ? 0 : 1)"; then
    echo "-> npm test"
    npm test
  else
    echo "SKIP: no 'test' script in package.json"
  fi
else
  echo "SKIP: no package.json found"
fi

if [ -f check.js ]; then
  echo "-> node check.js"
  node check.js
else
  echo "SKIP: check.js not found"
fi

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "SKIP: local tag $TAG already exists"
else
  echo "-> git tag -a $TAG"
  git tag -a "$TAG" -m "Release $TAG"
fi

if git ls-remote --tags "$REMOTE" "refs/tags/$TAG" | grep -q "$TAG"; then
  echo "SKIP: tag $TAG already on $REMOTE"
else
  echo "-> git push $REMOTE $TAG"
  git push "$REMOTE" "$TAG"
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: GitHub CLI (gh) not found. Install gh, then create the release manually:" >&2
  echo "  gh release create $TAG --title \"$TITLE\" --notes-file \"$NOTES_FILE\"" >&2
  exit 1
fi

if gh release view "$TAG" >/dev/null 2>&1; then
  echo "SKIP: GitHub release $TAG already exists"
else
  if [ ! -f "$NOTES_FILE" ]; then
    echo "ERROR: notes file $NOTES_FILE not found. Save the release notes there first." >&2
    exit 1
  fi
  echo "-> gh release create $TAG"
  gh release create "$TAG" --title "$TITLE" --notes-file "$NOTES_FILE"
fi

for f in greet.js README.md check.js; do
  if [ -f "$f" ]; then
    echo "-> gh release upload $TAG $f"
    gh release upload "$TAG" "$f" --clobber
  fi
done

echo "== release.sh: done =="
