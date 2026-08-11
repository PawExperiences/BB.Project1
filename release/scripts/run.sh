#!/bin/sh
# Builds (if needed) and runs the wordcount CLI, forwarding all arguments to it.
# With no file arguments the CLI reads stdin, matching normal wc-like usage.
# Usage: sh release/scripts/run.sh [file ...]
set -eu

OUT_PATH="${OUT_PATH:-dist/wordcount}"

echo "==> Building ${OUT_PATH}"
mkdir -p "$(dirname "$OUT_PATH")"
go build -o "$OUT_PATH" ./...

echo "==> Running ${OUT_PATH} $*"
exec "$OUT_PATH" "$@"
