#!/bin/sh
# Run the mdpdf CLI against the bundled sample.md as a smoke test.
# Installs mdpdf in editable mode if not already on PATH, converts
# sample.md to sample.html, and prints where the file was written.
# Run from the repository root. Idempotent: safe to re-run at any time.
set -e

if ! command -v mdpdf >/dev/null 2>&1; then
  echo "mdpdf is not installed; installing in editable mode"
  echo "+ pip install -e ."
  pip install -e .
fi

if [ ! -f "sample.md" ]; then
  echo "error: sample file not found at $(pwd)/sample.md" >&2
  exit 1
fi

echo "+ mdpdf sample.md -o sample.html"
mdpdf sample.md -o sample.html

echo "wrote $(pwd)/sample.html"
echo "open it in a browser and use Print -> Save as PDF to export a PDF"
