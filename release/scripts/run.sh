#!/bin/sh
set -e

if ! command -v mdpdf >/dev/null 2>&1; then
  echo "-> 'mdpdf' not found on PATH, installing package in editable mode"
  python3 -m pip install --quiet -e .
fi

if [ "$#" -gt 0 ]; then
  echo "-> Running: mdpdf $*"
  exec mdpdf "$@"
fi

OUTPUT_PATH="mdpdf_output.html"
echo "-> No arguments given, converting the bundled sample.md"
echo "-> Running: mdpdf sample.md -o ${OUTPUT_PATH}"
mdpdf sample.md -o "${OUTPUT_PATH}"
echo "-> Wrote ${OUTPUT_PATH}"
echo "-> Open it in a browser and use Print > Save as PDF to produce a PDF"
