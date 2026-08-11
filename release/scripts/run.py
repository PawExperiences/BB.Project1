#!/usr/bin/env python3
"""Builds (if needed) and runs the wordcount CLI, forwarding all arguments to
it. With no file arguments the CLI reads stdin, matching normal wc-like usage.
Usage: python3 release/scripts/run.py [file ...]
"""
import os
import subprocess
import sys

OUT_PATH = os.environ.get("OUT_PATH", os.path.join("dist", "wordcount"))


def main():
    os.makedirs(os.path.dirname(OUT_PATH) or ".", exist_ok=True)
    print("==> Building {}".format(OUT_PATH))
    subprocess.run(["go", "build", "-o", OUT_PATH, "./..."], check=True)

    print("==> Running {} {}".format(OUT_PATH, " ".join(sys.argv[1:])))
    result = subprocess.run([OUT_PATH] + sys.argv[1:])
    sys.exit(result.returncode)


if __name__ == "__main__":
    main()
