#!/bin/sh
# Idempotent: ensures the 'linkcheck' console script is installed, then runs
# it against each Markdown file path given as an argument, forwarding its
# exit code. Usage: run.sh <markdown-file> [more files...]
set -eu

if [ "$#" -lt 1 ]; then
  echo "[run] usage: run.sh <markdown-file> [more files...]"
  exit 2
fi

if ! command -v linkcheck >/dev/null 2>&1; then
  echo "[run] 'linkcheck' not found on PATH; installing package with 'pip install .'"
  python3 -m pip install .
else
  echo "[run] 'linkcheck' already on PATH"
fi

exit_code=0
for target in "$@"; do
  echo "[run] linkcheck ${target}"
  set +e
  linkcheck "${target}"
  rc=$?
  set -e
  if [ "${rc}" -eq 2 ]; then
    exit 2
  elif [ "${rc}" -eq 1 ]; then
    exit_code=1
  fi
done

exit "${exit_code}"
