#!/usr/bin/env python3
"""run.py - build (if needed) and run the prime_tester CLI, forwarding all arguments."""
import os
import subprocess
import sys

BUILD_DIR = os.environ.get("BUILD_DIR", "build")


def resolve_artifact():
    return os.path.join(BUILD_DIR, "prime_tester.exe" if os.name == "nt" else "prime_tester")


def main():
    artifact = resolve_artifact()
    if not os.path.isfile(artifact) or (os.name != "nt" and not os.access(artifact, os.X_OK)):
        print("==> No build found at %s; configuring and building first" % artifact)
        subprocess.run(["cmake", "-B", BUILD_DIR], check=True)
        subprocess.run(["cmake", "--build", BUILD_DIR], check=True)
        artifact = resolve_artifact()

    args = sys.argv[1:]
    print("==> Running %s %s" % (artifact, " ".join(args)))
    result = subprocess.run([artifact] + args)
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
