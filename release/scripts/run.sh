#!/bin/sh
# Launch the calculator desktop app.
# Locates target/calculator-*.jar (running mvn -B package first if missing)
# and starts it with java -jar. Requires a Java 21 runtime and a graphical
# display. Run from the repository root. Usage: sh release/scripts/run.sh
set -eu

jar=""
for j in target/calculator-*.jar; do
  case "$j" in *-sources.jar|*-javadoc.jar) continue;; esac
  if [ -f "$j" ]; then
    if [ -n "$jar" ]; then
      echo "ERROR: multiple JARs match target/calculator-*.jar" >&2
      exit 1
    fi
    jar="$j"
  fi
done

if [ -z "$jar" ]; then
  echo "No built JAR found; running: mvn -B package (full test suite)"
  mvn -B package
  for j in target/calculator-*.jar; do
    case "$j" in *-sources.jar|*-javadoc.jar) continue;; esac
    [ -f "$j" ] && jar="$j"
  done
fi

if [ -z "$jar" ]; then
  echo "ERROR: no target/calculator-*.jar available after build." >&2
  exit 1
fi
echo "Launching: java -jar $jar"
exec java -jar "$jar"
