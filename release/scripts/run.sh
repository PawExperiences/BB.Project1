#!/bin/sh
# Build (if needed) and run the wordcount CLI, forwarding all arguments.
# Use this to try the tool locally: run without args to read from stdin,
# or pass one or more file paths to count lines/words/bytes in each.
set -eu

MODULE=wordcount
BIN_DIR=bin
BINARY=$BIN_DIR/$MODULE

if ! command -v go >/dev/null 2>&1; then
  echo 'error: go toolchain not found on PATH' >&2
  exit 1
fi

mkdir -p $BIN_DIR
echo "+ go build -o $BINARY ."
go build -o "$BINARY" .

echo "+ $BINARY $*"
exec "$BINARY" "$@"
