#!/bin/sh
# release.sh -- tag, push, create GitHub Release draft, upload artifact.
# Run after CI is green and the build artifact exists.
# Required env vars: GITHUB_TOKEN, GITHUB_REPO (owner/repo), RELEASE_VERSION, ARTIFACT_PATH.
set -eu

die() { printf 'ERROR: %s\n' "$1" >&2; exit 1; }
require_env() { eval "val=\$$1"; [ -n "${val:-}" ] || die "$1 is not set"; }

require_env GITHUB_TOKEN
require_env GITHUB_REPO
require_env RELEASE_VERSION
require_env ARTIFACT_PATH

TAG="v${RELEASE_VERSION}"
API="https://api.github.com"

# 1. Create annotated tag (idempotent)
printf '[release.sh] Creating annotated tag %s ...\n' "$TAG"
if git tag -a "$TAG" -m "Release $TAG" 2>/dev/null; then
  printf '[release.sh] Tag %s created.\n' "$TAG"
else
  printf '[release.sh] Tag %s already exists, skipping.\n' "$TAG"
fi

# 2. Push tag
printf '[release.sh] Pushing tag %s to origin ...\n' "$TAG"
git push origin "$TAG" || printf '[release.sh] Tag already on remote, continuing.\n'

# 3. Create GitHub Release draft
CHANGELOG_BODY='## e2e prime tester 0.3.0 -- Initial Release\n\n### Added\n- prime_tester C++17 console app with 6k+-1 trial division.\n- Dual input mode (argv / stdin).\n- Robust error handling; exit code 1 on invalid tokens.\n- README with build instructions and worked-examples table.\n- CHANGELOG, CONTRIBUTING, RELEASING docs added.\n- CI workflow updated for C++17/CMake.\n- Release and run helper scripts.\n'
printf '[release.sh] Creating GitHub Release draft ...\n'
RESPONSE=$(
  curl -fsSL \
    -X POST \
    -H "Authorization: token ${GITHUB_TOKEN}" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: application/json" \
    "${API}/repos/${GITHUB_REPO}/releases" \
    --data "{\"tag_name\":\"${TAG}\",\"name\":\"e2e prime tester ${RELEASE_VERSION}\",\"body\":\"${CHANGELOG_BODY}\",\"draft\":true,\"prerelease\":false}"
)
UPLOAD_URL=$(printf '%s' "$RESPONSE" | grep '"upload_url"' | sed 's/.*"upload_url": *"\([^{]*\).*/\1/')
printf '[release.sh] Draft release created. Upload URL: %s\n' "$UPLOAD_URL"

# 4. Upload artifact
[ -f "$ARTIFACT_PATH" ] || die "Artifact not found at $ARTIFACT_PATH"
ARTIFACT_NAME=$(basename "$ARTIFACT_PATH")
printf '[release.sh] Uploading artifact %s ...\n' "$ARTIFACT_NAME"
curl -fsSL \
  -X POST \
  -H "Authorization: token ${GITHUB_TOKEN}" \
  -H "Accept: application/vnd.github+json" \
  -H "Content-Type: application/octet-stream" \
  "${UPLOAD_URL}?name=${ARTIFACT_NAME}" \
  --data-binary "@${ARTIFACT_PATH}" > /dev/null
printf '[release.sh] Artifact uploaded.\n'
printf '[release.sh] Done. Review and publish the draft at: https://github.com/%s/releases\n' "$GITHUB_REPO"
