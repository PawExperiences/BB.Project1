#!/bin/sh
# Start the built csvclean CLI.
#
# Ensures csvclean is installed (editable install from the repo if the
# csvclean command is not already on PATH) and then invokes csvclean,
# forwarding any arguments given to this script. With no arguments, shows
# --help.
#
# Usage:
#   sh release/scripts/run.sh [csvclean args...]
#   sh release/scripts/run.sh sample.csv -o cleaned.csv
set -eu

if ! command -v csvclean >/dev/null 2>&1; then
  echo "-- csvclean not on PATH, installing with 'pip install -e .' --"
  python3 -m pip install -e .
fi

if [ "$#" -eq 0 ]; then
  set -- --help
fi

echo "+ csvclean $*"
csvclean "$@"
