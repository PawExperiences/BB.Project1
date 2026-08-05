#!/usr/bin/env python3
"""run.py — Starts the e2e calculator application by invoking the built JAR.
Requires: JDK 21 on PATH, target/calculator-0.1.0.jar present (run `mvn -B package` first).
Run after a successful build to smoke-test or use the calculator."""
import subprocess
import sys
import os

JAR = os.path.join("target", "calculator-0.1.0.jar")

def main():
    if not os.path.isfile(JAR):
        print(f"ERROR: {JAR} not found. Run 'mvn -B package' first.", file=sys.stderr)
        sys.exit(1)
    print(f"Launching: java -jar {JAR}")
    result = subprocess.run(["java", "-jar", JAR])
    sys.exit(result.returncode)

if __name__ == "__main__":
    main()
