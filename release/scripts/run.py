#!/usr/bin/env python3
"""run.py -- locate and launch the prime_tester binary.
Forwards all arguments to the binary. Run after `cmake --build build`.
Usage: python release/scripts/run.py [numbers or tokens]"""
import os, sys, subprocess

def find_binary():
    candidates = [
        os.path.join('build', 'prime_tester'),
        os.path.join('build', 'prime_tester.exe'),
        os.path.join('build', 'Release', 'prime_tester.exe'),
        os.path.join('build', 'Debug', 'prime_tester.exe'),
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return None

binary = find_binary()
if binary is None:
    print('ERROR: prime_tester binary not found. Run `cmake -B build && cmake --build build` first.', file=sys.stderr)
    sys.exit(1)

print(f'[run.py] Launching: {binary} {" ".join(sys.argv[1:])}')
result = subprocess.run([binary] + sys.argv[1:])
sys.exit(result.returncode)
