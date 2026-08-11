#!/usr/bin/env python3
"""Start the built csvclean CLI.

Ensures csvclean is installed (editable install from the repo if the
`csvclean` command is not already on PATH) and then invokes `csvclean`,
forwarding any arguments given to this script. With no arguments, shows
--help.

Usage:
    python release/scripts/run.py [csvclean args...]
    python release/scripts/run.py sample.csv -o cleaned.csv
"""
import shutil
import subprocess
import sys


def main():
    if shutil.which("csvclean") is None:
        print("-- csvclean not on PATH, installing with 'pip install -e .' --")
        subprocess.run([sys.executable, "-m", "pip", "install", "-e", "."], check=True)

    args = sys.argv[1:] if len(sys.argv) > 1 else ["--help"]
    cmd = ["csvclean"] + args
    print("+ " + " ".join(cmd))
    subprocess.run(cmd, check=True)


if __name__ == "__main__":
    main()
