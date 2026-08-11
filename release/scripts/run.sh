#!/bin/sh
# Run script for factorlib.
# Ensures factorlib is installed (editable install from the repo) and
# then invokes the factorlib console script with any arguments passed
# to this script. Run this to try the CLI end-to-end, e.g.:
#   sh release/scripts/run.sh 12 18 7
# With no arguments, prints usage instead of running.
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "${SCRIPT_DIR}/../.." && pwd)

if [ "$#" -eq 0 ]; then
    echo "usage: run.sh N1 [N2 ...]  (prints prime factors of each integer via the factorlib CLI)"
    exit 0
fi

if ! python3 -c "import factorlib" >/dev/null 2>&1; then
    echo "-- factorlib not importable, installing editable package --"
    python3 -m pip install -e "${REPO_ROOT}"
fi

if ! command -v factorlib >/dev/null 2>&1; then
    echo "ERROR: 'factorlib' console script not found on PATH after install" >&2
    exit 1
fi

echo "+ factorlib $*"
exec factorlib "$@"
