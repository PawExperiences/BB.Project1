#!/usr/bin/env python3
"""Runs the built e2e calculator cc jar, building it first if it is missing.

Use this for the release smoke test, or any time you want to start the
calculator locally. Requires: a Java 21 runtime, and Maven (mvn) on PATH
if the jar has not been built yet.
"""
import os
import subprocess
import sys

JAR_PATH = os.path.join("target", "calculator-0.1.0.jar")


def run(cmd):
    print("+ " + " ".join(cmd))
    subprocess.run(cmd, check=True)


def main():
    if not os.path.isfile(JAR_PATH):
        print(JAR_PATH + " not found, building it first")
        run(["mvn", "-B", "package"])

    if not os.path.isfile(JAR_PATH):
        print("ERROR: build completed but " + JAR_PATH + " still not found")
        sys.exit(1)

    run(["java", "-jar", JAR_PATH])


if __name__ == "__main__":
    main()
