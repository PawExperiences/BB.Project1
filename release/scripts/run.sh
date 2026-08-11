#!/bin/sh
# Run the factorlib CLI (console script).
#
# Installs factorlib from this checkout in editable mode if it is not
# already installed, then runs `factorlib` with any arguments given
# (defaults to "12 18 7" as a demo).
#
# Usage: sh release/scripts/run.sh [INT ...]
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "${SCRIPT_DIR}/../.." && pwd)

if ! python3 -c "import factorlib" >/dev/null 2>&1; then
    echo "factorlib is not installed; installing in editable mode from this checkout..."
    python3 -m pip install --quiet -e "${REPO_ROOT}"
else
    echo "factorlib is already installed."
fi

if command -v factorlib >/dev/null 2>&1; then
    EXE=$(command -v factorlib)
else
    EXE="$(dirname "$(command -v python3)")/factorlib"
fi

if [ "$#" -eq 0 ]; then
    set -- 12 18 7
fi

echo "==> ${EXE} $*"
exec "${EXE}" "$@"
