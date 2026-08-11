#!/bin/sh
set -e

VERSION="0.1.0"
TAG="v0.1.0"
BRANCH="main"

echo "== mdpdf release ${VERSION} =="

echo "-> Fetching tags and checking working tree"
git fetch --quiet origin "${BRANCH}" --tags
git checkout --quiet "${BRANCH}"
git pull --quiet origin "${BRANCH}"
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: working tree is not clean. Commit or stash changes first." >&2
  exit 1
fi

echo "-> Installing dependencies"
python3 -m pip install --quiet --upgrade pip
python3 -m pip install --quiet -e .
python3 -m pip install --quiet pytest build

echo "-> Running test suite"
python3 -m pytest tests/ -q

echo "-> Building sdist and wheel"
rm -rf dist build
python3 -m build

echo "-> Smoke-testing built wheel in a temporary venv"
SMOKE_DIR=$(mktemp -d)
python3 -m venv "${SMOKE_DIR}/venv"
"${SMOKE_DIR}/venv/bin/pip" install --quiet dist/*.whl
"${SMOKE_DIR}/venv/bin/mdpdf" sample.md -o "${SMOKE_DIR}/sample.html"
if [ ! -s "${SMOKE_DIR}/sample.html" ]; then
  echo "ERROR: smoke test did not produce output HTML" >&2
  exit 1
fi
set +e
"${SMOKE_DIR}/venv/bin/mdpdf" does-not-exist.md >/dev/null 2>&1
STATUS=$?
set -e
if [ "$STATUS" -ne 2 ]; then
  echo "ERROR: expected exit code 2 for missing input, got ${STATUS}" >&2
  exit 1
fi
rm -rf "${SMOKE_DIR}"
echo "-> Smoke test passed"

echo "-> Tagging release"
if git rev-parse "${TAG}" >/dev/null 2>&1; then
  echo "Tag ${TAG} already exists locally, skipping tag creation"
else
  git tag -a "${TAG}" -m "Release mdpdf ${VERSION}"
fi
git push origin "${TAG}"

echo "-> Publishing GitHub release"
if command -v gh >/dev/null 2>&1; then
  NOTES_FILE=$(mktemp)
  cat > "${NOTES_FILE}" <<'EOF'
# mdpdf 0.1.0

mdpdf converts a constrained Markdown subset into a single, print-ready HTML
document, so you can produce a clean PDF using nothing more than your
browser's Print dialog. This is the first release: the CLI, the parser, and
a print-tuned stylesheet ship together as one installable package.

## Highlights
- New mdpdf CLI: `mdpdf IN.md -o OUT.html` writes a file, `mdpdf IN.md` writes to stdout
- Headings, paragraphs, bold/italic, inline code, fenced code blocks, links, and ordered/unordered lists
- Dedicated inline.py / blocks.py parser modules producing a typed, reusable representation
- Print CSS tuned for A4: serif 11pt body, monospace code on a light background, headings never orphaned at a page break
- sample.md fixture plus README docs on producing a PDF via a browser's Print to PDF
- A missing input file fails fast with exit code 2 and names the missing path

## Install
    pip install dist/mdpdf-0.1.0-py3-none-any.whl
or from source:
    pip install .

## Usage
    mdpdf report.md -o report.html
    (open report.html in a browser, then Print > Save as PDF)
EOF
  if gh release view "${TAG}" >/dev/null 2>&1; then
    gh release edit "${TAG}" --title "mdpdf ${VERSION}" --notes-file "${NOTES_FILE}"
  else
    gh release create "${TAG}" --title "mdpdf ${VERSION}" --notes-file "${NOTES_FILE}"
  fi
  gh release upload "${TAG}" dist/*.whl dist/*.tar.gz --clobber
  rm -f "${NOTES_FILE}"
else
  echo "WARNING: gh CLI not found. Publish the release manually using the files in dist/." >&2
fi

echo "== Release ${VERSION} complete =="
