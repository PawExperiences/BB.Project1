#!/bin/sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "${SCRIPT_DIR}/../.." && pwd)
PUBLISH_DIR="${PROJECT_DIR}/out"
BINARY_PATH="${PUBLISH_DIR}/caltool"

cd "${PROJECT_DIR}"

if [ -x "${BINARY_PATH}" ]; then
  echo "[run] Using published binary: ${BINARY_PATH}"
  exec "${BINARY_PATH}" "$@"
fi

echo "[run] No published binary found in 'out/'; falling back to 'dotnet run'"
if [ "$#" -gt 0 ]; then
  exec dotnet run --project "${PROJECT_DIR}/caltool.csproj" -- "$@"
else
  exec dotnet run --project "${PROJECT_DIR}/caltool.csproj"
fi
