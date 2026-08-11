#!/usr/bin/env python3
# Build (if needed) and run the wordcount CLI, forwarding all arguments.
# Use this to try the tool locally: run without args to read from stdin,
# or pass one or more file paths to count lines/words/bytes in each.
import os
import shutil
import subprocess
import sys

MODULE = 'wordcount'
BIN_DIR = 'bin'


def main():
    if shutil.which('go') is None:
        print('error: go toolchain not found on PATH', file=sys.stderr)
        sys.exit(1)

    ext = '.exe' if os.name == 'nt' else ''
    binary = os.path.join(BIN_DIR, MODULE + ext)

    os.makedirs(BIN_DIR, exist_ok=True)
    print('+ go build -o ' + binary + ' .')
    subprocess.run(['go', 'build', '-o', binary, '.'], check=True)

    cmd = [os.path.abspath(binary)] + sys.argv[1:]
    print('+ ' + ' '.join(cmd))
    result = subprocess.run(cmd)
    sys.exit(result.returncode)


if __name__ == '__main__':
    main()
