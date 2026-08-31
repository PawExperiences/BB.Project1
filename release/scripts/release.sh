#!/bin/sh
# Release helper for romans 0.1.0 (e2e provider kimi).
# Runs the automated release steps and is safe to re-run:
#   1. builds the distribution with `uv build`
#   2. verifies the wheel ships romans/__init__.py, romans/table.py, romans/py.typed
#   3. creates the annotated git tag v0.1.0 (skipped if it already exists)
#   4. pushes the tag to origin
#   5. creates the GitHub release with the dist artifacts attached
#      (uses the gh CLI; prints the exact manual command if gh is absent)
# Run from the repository root AFTER the release-notes commit has landed:
#     sh release/scripts/release.sh
set -eu

VERSION="0.1.0"
TAG="v${VERSION}"
TITLE="e2e provider kimi ${VERSION}"
NOTES_FILE="docs/releases/0-1-0.md"

if [ ! -f pyproject.toml ]; then
    echo "ERROR: run this script from the repository root (pyproject.toml not found)." >&2
    exit 1
fi

if ! command -v uv >/dev/null 2>&1; then
    echo "ERROR: uv not found on PATH; see https://docs.astral.sh/uv/" >&2
    exit 1
fi

echo "== 1/5 Building the distribution =="
uv build

echo "== 2/5 Verifying wheel contents =="
if ! ls dist/*.whl >/dev/null 2>&1; then
    echo "ERROR: no wheel found under dist/ after 'uv build'." >&2
    exit 1
fi
WHEEL="$(ls dist/*.whl | head -n 1)"
if command -v unzip >/dev/null 2>&1; then
    LISTING="$(unzip -l "$WHEEL")"
elif command -v python3 >/dev/null 2>&1; then
    LISTING="$(python3 -m zipfile -l "$WHEEL")"
else
    echo "ERROR: need unzip or python3 to inspect the wheel." >&2
    exit 1
fi
for member in romans/__init__.py romans/table.py romans/py.typed; do
    if ! printf '%s\n' "$LISTING" | grep -q "$member"; then
        echo "ERROR: $WHEEL is missing expected member $member" >&2
        exit 1
    fi
done
echo "OK: $WHEEL contains romans/__init__.py, romans/table.py, romans/py.typed"

echo "== 3/5 Tagging the release =="
if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null 2>&1; then
    echo "Tag ${TAG} already exists locally; skipping creation."
else
    git tag -a "${TAG}" -m "${TITLE}"
fi

echo "== 4/5 Pushing the tag =="
git push origin "${TAG}"

echo "== 5/5 Creating the GitHub release =="
if ! command -v gh >/dev/null 2>&1; then
    echo "gh CLI not found; create the release manually:"
    echo "  gh release create ${TAG} dist/* --title '${TITLE}' --notes-file ${NOTES_FILE}"
    echo "or use the GitHub web UI with the same title, notes and artifacts."
elif gh release view "${TAG}" >/dev/null 2>&1; then
    echo "GitHub release ${TAG} already exists; skipping creation (no remote state is modified)."
else
    if [ -f "${NOTES_FILE}" ]; then
        gh release create "${TAG}" dist/* --title "${TITLE}" --notes-file "${NOTES_FILE}"
    else
        gh release create "${TAG}" dist/* --title "${TITLE}" --notes "${TITLE}"
    fi
fi

echo ""
echo "Release ${TAG} prepared. Remaining manual step: publish to PyPI with 'uv publish'"
echo "only if/when a human approves (project-name ownership + credentials required)."
