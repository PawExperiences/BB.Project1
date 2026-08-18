#!/usr/bin/env python3
"""Release e2e prime tester 0.3.0.

Automated release steps, in order:
  1. clean CMake configure + build (cmake -B build && cmake --build build)
  2. run the CTest suite (ctest --output-on-failure, from build/)
  3. smoke-test the CLI (argv mode, stdin mode, --upto 30, bad-token exit 1)
  4. package the built binary as prime_tester-<version>-<os>-<arch>.tar.gz
  5. create and push annotated git tag v0.3.0
  6. create the GitHub release via the gh CLI and upload the package

Run it once, when the release is approved:
    python release/scripts/release.py

Idempotent: an existing build, tag, release, or uploaded asset is skipped,
so re-running after a failure is safe. If gh is not installed, the tag is
still pushed and the exact manual gh command is printed.
"""

import os
import platform
import shutil
import subprocess
import sys
import tarfile
from pathlib import Path

VERSION = os.environ.get("VERSION", "0.3.0")
TAG = os.environ.get("TAG", "v" + VERSION)
TITLE = "e2e prime tester " + VERSION

NOTES = """e2e prime tester 0.3.0

First release of the Prime Number Tester: a dependency-free C++17
command-line program, built with CMake (>= 3.16).

Highlights
- Single-number primality: "prime_tester 2 4 17" prints one verdict per
  line ("2 is prime", "4 is not prime", "17 is prime").
- Bulk generation: "prime_tester --upto N" lists every prime up to N, one
  per line, via a Sieve of Eratosthenes (N = 10000000 finishes in seconds).
- Forgiving input: non-numeric or out-of-range tokens are echoed verbatim
  to stderr as "not a number: <token>"; processing continues and the exit
  status is 1 if any bad token occurred, 0 on a clean run.
- Two-command build: cmake -B build && cmake --build build. The README's
  worked-examples table gives eight copy-pasteable commands with the exact
  expected output and exit status for manual verification.

Verify the build: cd build && ctest --output-on-failure
"""

ROOT = Path(__file__).resolve().parents[2]
BUILD = ROOT / "build"

EXE_CANDIDATES = (
    "prime_tester",
    "prime_tester.exe",
    "Debug/prime_tester.exe",
    "Release/prime_tester.exe",
    "Debug/prime_tester",
    "Release/prime_tester",
)


def say(msg):
    print("[release] " + msg, flush=True)


def run(cmd, **kwargs):
    say("+ " + " ".join(str(c) for c in cmd))
    return subprocess.run([str(c) for c in cmd], **kwargs)


def must(cmd, **kwargs):
    result = run(cmd, **kwargs)
    if result.returncode != 0:
        say("FAILED (exit %d): %s" % (result.returncode, cmd[0]))
        sys.exit(1)
    return result


def find_exe():
    for rel in EXE_CANDIDATES:
        candidate = BUILD / rel
        if candidate.is_file():
            return candidate
    return None


def clean_build():
    say("step 1/6: clean build")
    if BUILD.exists():
        shutil.rmtree(BUILD)
    must(["cmake", "-B", "build"], cwd=str(ROOT))
    must(["cmake", "--build", "build"], cwd=str(ROOT))


def run_tests():
    say("step 2/6: ctest")
    must(["ctest", "--output-on-failure"], cwd=str(BUILD))


def smoke_test(exe):
    say("step 3/6: CLI smoke tests")
    cases = [
        ([str(exe), "2", "4", "17"], None, 0,
         "2 is prime\n4 is not prime\n17 is prime\n"),
        ([str(exe), "--upto", "30"], None, 0,
         "2\n3\n5\n7\n11\n13\n17\n19\n23\n29\n"),
        ([str(exe)], "2\n4\n17\n", 0,
         "2 is prime\n4 is not prime\n17 is prime\n"),
    ]
    for cmd, stdin_data, want_rc, want_out in cases:
        result = run(cmd, input=stdin_data, capture_output=True, text=True)
        if result.returncode != want_rc or result.stdout != want_out:
            say("FAILED smoke: %s" % " ".join(cmd))
            say("  rc=%d (want %d) stdout=%r" % (result.returncode, want_rc, result.stdout))
            sys.exit(1)
    result = run([str(exe), "abc"], capture_output=True, text=True)
    if result.returncode != 1 or "not a number: abc" not in result.stderr:
        say("FAILED smoke: bad-token contract (rc=%d stderr=%r)" % (result.returncode, result.stderr))
        sys.exit(1)
    say("smoke tests passed")


def package(exe):
    say("step 4/6: package binary")
    os_name = {"linux": "linux", "darwin": "macos", "win32": "windows"}.get(sys.platform, sys.platform)
    arch = (platform.machine() or "unknown").lower()
    archive = ROOT / ("prime_tester-%s-%s-%s.tar.gz" % (VERSION, os_name, arch))
    if archive.exists():
        archive.unlink()
    with tarfile.open(str(archive), "w:gz") as tar:
        tar.add(str(exe), arcname=exe.name)
    say("wrote %s" % archive.name)
    return archive


def tag():
    say("step 5/6: git tag " + TAG)
    result = run(["git", "rev-parse", "-q", "--verify", "refs/tags/" + TAG],
                 capture_output=True, text=True, cwd=str(ROOT))
    if result.returncode == 0:
        say("local tag %s already exists; skipping creation" % TAG)
    else:
        must(["git", "tag", "-a", TAG, "-m", TITLE], cwd=str(ROOT))
    result = run(["git", "ls-remote", "--tags", "origin", "refs/tags/" + TAG],
                 capture_output=True, text=True, cwd=str(ROOT))
    if ("refs/tags/" + TAG) in result.stdout:
        say("remote tag %s already exists; skipping push" % TAG)
    else:
        must(["git", "push", "origin", TAG], cwd=str(ROOT))


def publish(archive):
    say("step 6/6: GitHub release")
    notes_file = BUILD / "release-notes.md"
    notes_file.write_text(NOTES, encoding="ascii")
    if shutil.which("gh") is None:
        say("gh CLI not found; skipping GitHub release creation.")
        say("tag %s is pushed; publish manually with:" % TAG)
        say('  gh release create %s --title "%s" --notes-file %s %s'
            % (TAG, TITLE, notes_file, archive.name))
        return
    result = run(["gh", "release", "view", TAG], capture_output=True, cwd=str(ROOT))
    if result.returncode == 0:
        say("release %s already exists; skipping creation" % TAG)
    else:
        must(["gh", "release", "create", TAG, "--title", TITLE,
              "--notes-file", str(notes_file)], cwd=str(ROOT))
    result = run(["gh", "release", "view", TAG, "--json", "assets",
                  "--jq", ".assets[].name"], capture_output=True, text=True, cwd=str(ROOT))
    if archive.name in result.stdout.split():
        say("asset %s already uploaded; skipping" % archive.name)
    else:
        must(["gh", "release", "upload", TAG, str(archive)], cwd=str(ROOT))
    say("done: release %s published" % TAG)


def main():
    say("releasing %s (%s) from %s" % (TITLE, TAG, ROOT))
    clean_build()
    run_tests()
    exe = find_exe()
    if exe is None:
        say("FAILED: prime_tester binary not found under build/")
        sys.exit(1)
    smoke_test(exe)
    archive = package(exe)
    tag()
    publish(archive)
    say("release %s complete" % TAG)


if __name__ == "__main__":
    main()
