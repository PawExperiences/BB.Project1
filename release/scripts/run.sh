#!/bin/sh
# Builds (if needed) and runs the wordcount CLI, forwarding all arguments.
set -eu

BINARY_NAME="wordcount"

if [ ! -x "./$BINARY_NAME" ]; then
    echo "-- Binary not found, building $BINARY_NAME"
    go build -o "$BINARY_NAME" .
else
    echo "-- Using existing ./$BINARY_NAME binary"
fi

echo "-- Running ./$BINARY_NAME $*"
exec "./$BINARY_NAME" "$@"
