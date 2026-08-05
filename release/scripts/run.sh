#!/bin/sh
# run.sh -- Starts the e2e calculator application by invoking the built JAR.
# Requires: JDK 21 on PATH, target/calculator-0.1.0.jar present (run mvn -B package first).
# Run after a successful build to smoke-test or use the calculator.
set -e

JAR="target/calculator-0.1.0.jar"

if [ ! -f "$JAR" ]; then
  echo "ERROR: $JAR not found. Run 'mvn -B package' first." >&2
  exit 1
fi

echo "Launching: java -jar $JAR"
exec java -jar "$JAR"
