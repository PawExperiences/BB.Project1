#!/bin/sh
# Purpose: build (if needed) and run the wordcount binary, forwarding all args/stdin.
# Usage: release/scripts/run.sh [file...]   (no args reads stdin, per the tool's own CLI rules)
set -eu

BIN="./wordcount"

NEED_BUILD=0
if [ ! -x "$BIN" ]; then
  NEED_BUILD=1
elif [ "main.go" -nt "$BIN" ] || [ "count.go" -nt "$BIN" ]; then
  NEED_BUILD=1
fi

if [ "$NEED_BUILD" -eq 1 ]; then
  echo "==> Building wordcount" >&2
  go build -o "$BIN" .
fi

echo "==> Running: $BIN $*" >&2
exec "$BIN" "$@"
