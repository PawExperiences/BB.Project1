#!/bin/sh
# release/scripts/run.sh
# Purpose: run the greet CLI, forwarding any arguments given to this
# script. Use this to try the release artifact locally, e.g.
#   ./release/scripts/run.sh Alice Bob
#   ./release/scripts/run.sh --help
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "${SCRIPT_DIR}/../.." && pwd)
GREET_JS="${REPO_ROOT}/greet.js"

if [ ! -f "${GREET_JS}" ]; then
  echo "ERROR: ${GREET_JS} not found." >&2
  exit 1
fi

echo "==> Running: node greet.js $*"
exec node "${GREET_JS}" "$@"
