#!/usr/bin/env python3
"""run.py -- build (if needed) and run the prime_tester console app.

WHAT IT DOES: locates build/prime_tester relative to the repository root,
configures and builds it with CMake if it is missing (unless --no-build), then
runs it with every remaining argument passed straight through and exits with the
app's own exit code.

WHEN TO RUN: any time you want to exercise the app -- a smoke check of a fresh
clone or of an unpacked release artefact.

    python3 release/scripts/run.py 7 8 1 -3 2
    printf '11\\n12\\n' | python3 release/scripts/run.py
    python3 release/scripts/run.py --upto 30

Script options must come first and are consumed before the app's arguments:
    --no-build        fail instead of building when the executable is missing
    --build-dir DIR   cmake build directory (default build, or $BUILD_DIR)
    --                stop option parsing; everything after goes to the app

Standard library only. Idempotent: an existing build is reused, never rebuilt
from scratch. Options are parsed by hand rather than with argparse so that a
negative number such as -3 reaches the app instead of being read as a flag. All
progress messages go to stderr so the app's stdout stays pipeable.
"""

import os
import subprocess
import sys

EXE_NAME = "prime_tester"


def note(message):
    print(message, file=sys.stderr, flush=True)


def fail(message):
    print("error: " + message, file=sys.stderr, flush=True)
    sys.exit(1)


def find_executable(build_dir):
    candidates = [
        os.path.join(build_dir, EXE_NAME),
        os.path.join(build_dir, "Release", EXE_NAME),
        os.path.join(build_dir, EXE_NAME + ".exe"),
        os.path.join(build_dir, "Release", EXE_NAME + ".exe"),
        os.path.join(build_dir, "Debug", EXE_NAME + ".exe"),
    ]
    for candidate in candidates:
        if os.path.isfile(candidate):
            return candidate
    return ""


def main(argv):
    build_dir = os.environ.get("BUILD_DIR", "build")
    no_build = False
    rest = list(argv)

    while rest:
        if rest[0] == "--no-build":
            no_build = True
            rest.pop(0)
        elif rest[0] == "--build-dir":
            if len(rest) < 2:
                fail("--build-dir needs a value")
            build_dir = rest[1]
            rest = rest[2:]
        elif rest[0] == "--":
            rest.pop(0)
            break
        else:
            break

    script_dir = os.path.dirname(os.path.abspath(__file__))
    root = os.path.abspath(os.path.join(script_dir, os.pardir, os.pardir))
    os.chdir(root)
    note("==> repository: " + root)

    exe = find_executable(build_dir)
    if not exe:
        if no_build:
            fail(EXE_NAME + " not found under " + build_dir
                 + " and --no-build was given")
        note("==> " + EXE_NAME + " not found under " + build_dir
             + "; building it now")
        configure = ["cmake", "-B", build_dir, "-DCMAKE_BUILD_TYPE=Release"]
        note("    + " + " ".join(configure))
        if subprocess.call(configure, stdout=sys.stderr) != 0:
            fail("cmake configure failed")
        build = ["cmake", "--build", build_dir]
        note("    + " + " ".join(build))
        if subprocess.call(build, stdout=sys.stderr) != 0:
            fail("cmake build failed")
        exe = find_executable(build_dir)
        if not exe:
            fail("build finished but " + EXE_NAME + " is still not under "
                 + build_dir)
    else:
        note("==> reusing existing build")

    note("==> running: " + exe + " " + " ".join(rest))
    return subprocess.call([exe] + rest)


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
