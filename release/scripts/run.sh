#!/bin/sh
# Run the factorlib CLI against the arguments given on the command line.
# Installs factorlib in editable mode if the `factorlib` console script is
# not already on PATH, then invokes it (default args: 12 18 7).
set -eu

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

if ! command -v factorlib >/dev/null 2>&1; then
  echo "factorlib console script not found; installing in editable mode..."
  python3 -m pip install -e .
fi

if [ "$#" -eq 0 ]; then
  set -- 12 18 7
fi

echo "+ factorlib $*"
factorlib "$@"
