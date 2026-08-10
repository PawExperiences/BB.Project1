#!/bin/sh
set -eu

ARTIFACT="${ARTIFACT:-target/calculator-0.1.0.jar}"

echo "== run.sh: launching e2e calculator =="
if [ ! -f "$ARTIFACT" ]; then
  echo "-> $ARTIFACT not found, building it first (mvn -B package)"
  mvn -B package
fi

if [ ! -f "$ARTIFACT" ]; then
  echo "ERROR: build did not produce $ARTIFACT" >&2
  exit 1
fi

echo "-> starting: java -jar $ARTIFACT"
exec java -jar "$ARTIFACT"
