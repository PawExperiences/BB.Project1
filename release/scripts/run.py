#!/usr/bin/env python3
'''Run script for factorlib.

Ensures factorlib is installed (editable install from the repo) and
then invokes the factorlib console script with any arguments passed
to this script. Run this to try the CLI end-to-end, e.g.:
    python release/scripts/run.py 12 18 7
With no arguments, prints usage instead of running.
'''
import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]


def factorlib_importable():
    return subprocess.run(
        [sys.executable, '-c', 'import factorlib'],
        cwd=REPO_ROOT, capture_output=True,
    ).returncode == 0


def main():
    args = sys.argv[1:]
    if not args:
        print('usage: run.py N1 [N2 ...]  (prints prime factors of each integer via the factorlib CLI)')
        return

    if not factorlib_importable():
        print('-- factorlib not importable, installing editable package --')
        subprocess.run(
            [sys.executable, '-m', 'pip', 'install', '-e', str(REPO_ROOT)],
            check=True,
        )

    exe = shutil.which('factorlib')
    if not exe:
        print("ERROR: 'factorlib' console script not found on PATH after install", file=sys.stderr)
        sys.exit(1)

    cmd = [exe] + args
    print('+ ' + ' '.join(cmd))
    result = subprocess.run(cmd)
    sys.exit(result.returncode)


if __name__ == '__main__':
    main()
