#!/bin/sh
# Installs factorlib (editable, if not already installed) and runs its CLI with the given arguments.
# Usage: ./run.sh <int> [<int> ...]
# If no arguments are given, runs a smoke-test call: factorlib 12 17.
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../.." && pwd)

if ! python3 -c "import factorlib" >/dev/null 2>&1; then
    echo "factorlib is not installed; installing in editable mode ..."
    python3 -m pip install -e "$REPO_ROOT"
else
    echo "factorlib is already installed"
fi

if ! command -v factorlib >/dev/null 2>&1; then
    echo "error: the factorlib console script was not found on PATH after install" >&2
    exit 1
fi

if [ "$#" -gt 0 ]; then
    echo "+ factorlib $*"
    exec factorlib "$@"
else
    echo "+ factorlib 12 17"
    exec factorlib 12 17
fi
