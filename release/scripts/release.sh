#!/bin/sh
# Automated release steps for factorlib 0.1.0.
# Idempotent: safe to re-run. Requires git, python3 with pip, and (for the
# publish step) an authenticated GitHub CLI (gh).
#
# Usage: sh release/scripts/release.sh
set -eu

VERSION="0.1.0"
TAG="v${VERSION}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "${SCRIPT_DIR}/../.." && pwd)
DIST_DIR="${REPO_ROOT}/dist"
NOTES_FILE="${REPO_ROOT}/release/notes/${TAG}.md"

cd "${REPO_ROOT}"

echo "-- Verifying working tree is clean --"
if [ -n "$(git status --porcelain)" ]; then
    echo "Working tree is not clean; commit or stash changes before releasing." >&2
    git status --porcelain >&2
    exit 1
fi
echo "Working tree is clean."

echo "-- Installing factorlib (editable) and release tooling --"
python3 -m pip install --quiet -e .
python3 -m pip install --quiet pytest ruff build

echo "-- Running test suite --"
python3 -m pytest -q

echo "-- Running lint checks --"
python3 -m ruff check .
python3 -m ruff format --check .

echo "-- Building sdist and wheel --"
rm -rf "${DIST_DIR}"
python3 -m build

echo "-- Smoke-testing the built wheel in a throwaway venv --"
SMOKE_DIR=$(mktemp -d)
trap 'rm -rf "${SMOKE_DIR}"' EXIT
python3 -m venv "${SMOKE_DIR}/venv"
SMOKE_PY="${SMOKE_DIR}/venv/bin/python"
WHEEL=$(find "${DIST_DIR}" -name '*.whl' | sort | tail -n 1)
if [ -z "${WHEEL}" ]; then
    echo "No wheel found in dist/; the build step must run first." >&2
    exit 1
fi
"${SMOKE_PY}" -m pip install --quiet "${WHEEL}"
OUT=$("${SMOKE_PY}" -m factorlib.cli 12 18 7)
echo "${OUT}"
echo "${OUT}" | grep -qx "12: 2 2 3"
echo "${OUT}" | grep -qx "18: 2 3 3"
echo "${OUT}" | grep -qx "7: 7"
if "${SMOKE_PY}" -m factorlib.cli 0 >/dev/null 2>&1; then
    echo "Smoke test failed: 'factorlib 0' should exit with a non-zero status." >&2
    exit 1
fi
echo "Smoke test passed."

echo "-- Tagging ${TAG} --"
if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
    echo "Tag ${TAG} already exists locally; skipping tag creation."
else
    git tag -a "${TAG}" -m "factorlib ${VERSION}"
fi
git push origin "${TAG}"

echo "-- Publishing GitHub release ${TAG} --"
if gh release view "${TAG}" >/dev/null 2>&1; then
    echo "GitHub release ${TAG} already exists; skipping creation."
else
    if [ -f "${NOTES_FILE}" ]; then
        gh release create "${TAG}" "${DIST_DIR}"/* --title "factorlib ${VERSION}" --notes-file "${NOTES_FILE}"
    else
        gh release create "${TAG}" "${DIST_DIR}"/* --title "factorlib ${VERSION}" --notes "factorlib ${VERSION}"
    fi
fi

echo "Release ${TAG} complete."
