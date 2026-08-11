#!/usr/bin/env python3
"""release.py - build, smoke-test, tag, and publish the prime_tester v0.6.0 release."""
import os
import shutil
import subprocess
import sys

VERSION = os.environ.get("VERSION", "0.6.0")
TAG = "v" + VERSION
BUILD_DIR = os.environ.get("BUILD_DIR", "build")
REMOTE = os.environ.get("REMOTE", "origin")
NOTES_FILE = os.environ.get("NOTES_FILE", os.path.join("release", "RELEASE_NOTES.md"))
ARTIFACT = os.path.join(BUILD_DIR, "prime_tester.exe" if os.name == "nt" else "prime_tester")


def run(cmd, **kwargs):
    print("==> " + " ".join(cmd))
    subprocess.run(cmd, check=True, **kwargs)


def ok(cmd):
    result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return result.returncode == 0


def expect_out(desc, expected_exit, expected_stdout, args, stdin_data=None):
    proc = subprocess.run([ARTIFACT] + args, input=stdin_data, capture_output=True, text=True)
    actual = proc.stdout.replace("\r\n", "\n").strip("\n")
    if proc.returncode != expected_exit or actual != expected_stdout:
        print("SMOKE TEST FAILED: %s (exit %d, stdout %r)" % (desc, proc.returncode, proc.stdout), file=sys.stderr)
        sys.exit(1)
    print("  OK: %s" % desc)


def main():
    print("==> Configuring: cmake -B %s" % BUILD_DIR)
    run(["cmake", "-B", BUILD_DIR])

    print("==> Building: cmake --build %s" % BUILD_DIR)
    run(["cmake", "--build", BUILD_DIR])

    print("==> Running CTest suite (unit checks + informational sieve benchmark)")
    subprocess.run(["ctest", "--output-on-failure"], cwd=BUILD_DIR, check=True)

    if not os.path.isfile(ARTIFACT) or not os.access(ARTIFACT, os.X_OK):
        print("ERROR: expected artifact not found or not executable: %s" % ARTIFACT, file=sys.stderr)
        sys.exit(1)
    print("==> Artifact ready: %s" % ARTIFACT)

    print("==> Smoke-testing artifact against the README Manual Verification scenarios")
    expect_out("prime input (17)", 0, "17 is prime", ["17"])
    expect_out("composite input (18)", 0, "18 is not prime", ["18"])
    expect_out("zero input (0)", 0, "0 is not prime", ["0"])
    expect_out("one input (1)", 0, "1 is not prime", ["1"])
    expect_out("negative input (-7)", 0, "-7 is not prime", ["-7"])
    expect_out("empty stdin", 0, "", [], stdin_data="")

    proc = subprocess.run([ARTIFACT, "abc"], capture_output=True, text=True)
    actual_err = proc.stderr.replace("\r\n", "\n").strip("\n")
    if proc.returncode != 1 or actual_err != "not a number: abc":
        print("SMOKE TEST FAILED: non-numeric token 'abc' should print 'not a number: abc' to stderr and exit 1", file=sys.stderr)
        sys.exit(1)
    print("  OK: non-numeric token 'abc' -> stderr 'not a number: abc', exit 1")

    expected_upto = "\n".join(["2", "3", "5", "7", "11", "13", "17", "19", "23", "29"])
    expect_out("--upto 30", 0, expected_upto, ["--upto", "30"])

    print("==> All smoke tests passed")

    if ok(["git", "rev-parse", TAG]):
        print("==> Tag %s already exists locally, skipping tag creation" % TAG)
    else:
        print("==> Creating annotated tag %s" % TAG)
        run(["git", "tag", "-a", TAG, "-m", "Release %s" % TAG])

    print("==> Pushing tag %s to %s" % (TAG, REMOTE))
    run(["git", "push", REMOTE, TAG])

    if shutil.which("gh") is None:
        print("NOTE: 'gh' CLI not found; skipping GitHub release creation/upload.", file=sys.stderr)
        print("      Publish manually and attach: %s" % ARTIFACT, file=sys.stderr)
    elif ok(["gh", "release", "view", TAG]):
        print("==> GitHub release %s already exists, skipping creation" % TAG)
    else:
        print("==> Creating GitHub release %s and uploading artifact" % TAG)
        cmd = ["gh", "release", "create", TAG, ARTIFACT, "--title", TAG]
        if os.path.isfile(NOTES_FILE):
            cmd += ["--notes-file", NOTES_FILE]
        else:
            cmd += ["--notes", "Release %s" % TAG]
        run(cmd)

    print("==> Done. Release %s built, smoke-tested, and published (or ready for manual publish)." % TAG)


if __name__ == "__main__":
    main()
