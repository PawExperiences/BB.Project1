#!/bin/sh
# Runs the built e2e calculator cc jar, building it first if it is missing.
# Use this for the release smoke test, or any time you want to start the calculator locally.
# Requires: a Java 21 runtime, and Maven (mvn) on PATH if the jar has not been built yet.
set -e

JAR_PATH="target/calculator-0.1.0.jar"

if [ ! -f "$JAR_PATH" ]; then
  echo "$JAR_PATH not found, building it first"
  echo "+ mvn -B package"
  mvn -B package
fi

if [ ! -f "$JAR_PATH" ]; then
  echo "ERROR: build completed but $JAR_PATH still not found"
  exit 1
fi

echo "+ java -jar $JAR_PATH"
java -jar "$JAR_PATH"
