#!/usr/bin/env python3
"""run.py - build (if needed) and launch the e2e calculator JAR."""
import os
import subprocess
import sys
from pathlib import Path

ARTIFACT = Path(os.environ.get("ARTIFACT", "target/calculator-0.1.0.jar"))


def main():
    print("== run.py: launching e2e calculator ==")
    if not ARTIFACT.is_file():
        print("-> {} not found, building it first (mvn -B package)".format(ARTIFACT))
        subprocess.run(["mvn", "-B", "package"], check=True)

    if not ARTIFACT.is_file():
        print("ERROR: build did not produce {}".format(ARTIFACT), file=sys.stderr)
        sys.exit(1)

    print("-> starting: java -jar {}".format(ARTIFACT))
    subprocess.run(["java", "-jar", str(ARTIFACT)], check=True)


if __name__ == "__main__":
    main()
