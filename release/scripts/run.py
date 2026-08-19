#!/usr/bin/env python3
"""Launch the calculator desktop app.

Locates target/calculator-*.jar (running mvn -B package first if it is
missing) and starts it with java -jar. Requires a Java 21 runtime and a
graphical display. Run from the repository root:

    python release/scripts/run.py
"""

import glob
import os
import subprocess
import sys


def find_jar():
    jars = [
        j for j in glob.glob(os.path.join("target", "calculator-*.jar"))
        if not j.endswith("-sources.jar") and not j.endswith("-javadoc.jar")
    ]
    return jars[0] if len(jars) == 1 else None


jar = find_jar()
if jar is None:
    print("No single built JAR found; running: mvn -B package (full test suite)")
    subprocess.run(["mvn", "-B", "package"], check=True)
    jar = find_jar()
if jar is None:
    sys.exit("ERROR: no target/calculator-*.jar available after build.")
print("Launching: java -jar " + jar)
sys.exit(subprocess.run(["java", "-jar", jar]).returncode)
