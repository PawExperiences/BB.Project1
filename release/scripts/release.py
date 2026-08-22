#!/usr/bin/env python3
"""release.py -- run the automated release steps for prime_tester.

WHAT IT DOES: refuses a dirty working tree; checks whether the release tag
already exists locally or on the remote and never moves or deletes one that
does; builds build/prime_tester with CMake in Release mode; runs the CTest suite
and two CLI smoke checks; packages the executable into
dist/prime_tester-<version>-<os>-<arch>.tar.gz; creates and pushes the annotated
tag; creates the GitHub release with that asset attached.

WHEN TO RUN: on a clean checkout of main, after the release-notes PR is merged
and the BuildBoard build of main is green. Run it with --dry-run first.

Standard library only. Idempotent: re-running after a partial release skips what
is already done instead of redoing or undoing it. It never force-pushes and
never deletes a tag, a release or an asset.
"""

import argparse
import os
import platform
import shutil
import subprocess
import sys
import tarfile

EXE_NAME = "prime_tester"


def say(message):
    print(message, flush=True)


def fail(message):
    print("error: " + message, file=sys.stderr, flush=True)
    sys.exit(1)


def run(cmd, dry_run, check=True):
    say("  + " + " ".join(cmd))
    if dry_run:
        return 0
    code = subprocess.call(cmd)
    if check and code != 0:
        fail(" ".join(cmd) + " failed with exit code " + str(code))
    return code


def capture(cmd):
    """Run cmd, return (stdout stripped, returncode). Never raises."""
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, _err = proc.communicate()
    return out.decode("utf-8", "replace").strip(), proc.returncode


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


def parse_args(argv):
    parser = argparse.ArgumentParser(
        description="Run the automated release steps for prime_tester.")
    parser.add_argument("--version", dest="version", default="0.6.0",
                        help="version being released (default 0.6.0)")
    parser.add_argument("--tag", default="",
                        help="tag to create (default v<version>)")
    parser.add_argument("--remote", default="origin",
                        help="git remote to push to (default origin)")
    parser.add_argument("--build-dir", default="build",
                        help="cmake build directory (default build)")
    parser.add_argument("--dist-dir", default="dist",
                        help="where the packaged asset is written (default dist)")
    parser.add_argument("--notes", default="docs/releases/0-6-0.md",
                        help="release notes body (default docs/releases/0-6-0.md)")
    parser.add_argument("--skip-build", action="store_true",
                        help="reuse an existing build directory")
    parser.add_argument("--skip-tests", action="store_true",
                        help="skip ctest and the CLI smoke checks")
    parser.add_argument("--no-publish", action="store_true",
                        help="stop after pushing the tag")
    parser.add_argument("--dry-run", action="store_true",
                        help="print every command, change nothing")
    return parser.parse_args(argv)


def main(argv):
    args = parse_args(argv)
    tag = args.tag or ("v" + args.version)
    dry = args.dry_run

    root, code = capture(["git", "rev-parse", "--show-toplevel"])
    if code != 0 or not root:
        fail("not inside a git repository")
    os.chdir(root)

    say("==> prime_tester release")
    say("    repository : " + root)
    say("    version    : " + args.version)
    say("    tag        : " + tag)
    say("    remote     : " + args.remote)
    if dry:
        say("    mode       : DRY RUN (nothing will change)")

    say("==> checking the working tree is clean")
    dirty, _ = capture(["git", "status", "--porcelain"])
    if dirty:
        if dry:
            say("    !! working tree is dirty (tolerated because of --dry-run)")
        else:
            fail("working tree is dirty; commit or stash before releasing")
    else:
        say("    clean")

    head_sha, _ = capture(["git", "rev-parse", "HEAD"])
    say("    release commit: " + head_sha)

    say("==> preflight: does " + tag + " already exist?")
    local_tag, local_code = capture(["git", "rev-parse", "-q", "--verify",
                                     "refs/tags/" + tag])
    has_local = (local_code == 0 and bool(local_tag))
    remote_line, _ = capture(["git", "ls-remote", "--tags", args.remote,
                              "refs/tags/" + tag])
    has_remote = bool(remote_line.strip())
    tag_commit = ""
    if has_local:
        tag_commit, _ = capture(["git", "rev-list", "-n", "1", tag])

    if has_local and tag_commit != head_sha:
        fail("local tag " + tag + " points at " + tag_commit + ", not HEAD ("
             + head_sha + "). This script never moves a tag.")
    if has_remote and tag_commit != head_sha:
        fail(tag + " already exists on " + args.remote + " (published by an "
             "earlier run). Moving or deleting a published tag is forbidden -- "
             "ask a human to confirm it or bump the version (--version 0.6.1).")
    if has_remote:
        say("    " + tag + " already on " + args.remote
            + " and points at HEAD; nothing to create")
    elif has_local:
        say("    " + tag + " exists locally at HEAD but is not pushed yet")
    else:
        say("    not found locally or on " + args.remote + " -- good")

    if args.skip_build:
        say("==> build: skipped (--skip-build)")
    else:
        say("==> build: cmake configure + build (Release)")
        run(["cmake", "-B", args.build_dir, "-DCMAKE_BUILD_TYPE=Release"], dry)
        run(["cmake", "--build", args.build_dir], dry)

    exe = find_executable(args.build_dir)
    if not exe:
        if dry:
            exe = os.path.join(args.build_dir, EXE_NAME)
            say("==> executable: " + exe + " (assumed; dry run)")
        else:
            fail("executable " + EXE_NAME + " not found under " + args.build_dir)
    else:
        say("==> executable: " + exe)

    if args.skip_tests:
        say("==> tests: skipped (--skip-tests)")
    else:
        say("==> tests: ctest")
        run(["ctest", "--test-dir", args.build_dir, "--output-on-failure"], dry)
        if not dry:
            say("==> smoke: --upto 10 must print 2 3 5 7 and exit 0")
            got, got_code = capture([exe, "--upto", "10"])
            if got_code != 0 or got.split() != ["2", "3", "5", "7"]:
                fail("smoke failed: '" + exe + " --upto 10' exited "
                     + str(got_code) + " and printed [" + got + "]")
            say("==> smoke: a bad token must exit 1 without aborting the run")
            _out, bad_code = capture([exe, "5", "abc", "6"])
            if bad_code != 1:
                fail("smoke failed: '" + exe + " 5 abc 6' exited "
                     + str(bad_code) + ", expected 1")
            say("    smoke checks passed")

    asset_name = (EXE_NAME + "-" + args.version + "-" + platform.system()
                  + "-" + platform.machine() + ".tar.gz")
    asset = os.path.join(args.dist_dir, asset_name)
    say("==> package: " + asset)
    if dry:
        say("  + tar -czf " + asset + " (" + exe + " + README.md + CHANGELOG.md)")
    else:
        stage = os.path.join(args.dist_dir, "stage-" + args.version)
        if os.path.isdir(stage):
            shutil.rmtree(stage)
        os.makedirs(stage)
        shutil.copy2(exe, stage)
        for extra in ("README.md", "CHANGELOG.md", "LICENSE"):
            if os.path.isfile(extra):
                shutil.copy2(extra, stage)
        if os.path.isfile(asset):
            os.remove(asset)
        with tarfile.open(asset, "w:gz") as archive:
            for name in sorted(os.listdir(stage)):
                archive.add(os.path.join(stage, name), arcname=name)
        shutil.rmtree(stage)
        say("    wrote " + asset)

    if has_local:
        say("==> tag: " + tag + " already exists locally at HEAD; not re-creating")
    else:
        say("==> tag: creating annotated tag " + tag)
        run(["git", "tag", "-a", tag, "-m", EXE_NAME + " " + args.version], dry)

    if has_remote:
        say("==> push: " + tag + " already on " + args.remote + "; skipping")
    else:
        say("==> push: " + tag + " -> " + args.remote + " (no force, ever)")
        run(["git", "push", args.remote, "refs/tags/" + tag], dry)

    title = EXE_NAME + " " + args.version
    if args.no_publish:
        say("==> publish: skipped (--no-publish)")
    elif shutil.which("gh") is None:
        say("==> publish: gh CLI not found -- create the release by hand:")
        say("    gh release create " + tag + " --title \"" + title
            + "\" --notes-file " + args.notes + " " + asset)
    else:
        _view, view_code = capture(["gh", "release", "view", tag])
        if view_code == 0:
            say("==> publish: release " + tag + " already exists; not "
                "re-creating and not deleting anything")
            say("    if the asset is missing, attach it by hand: "
                "gh release upload " + tag + " " + asset)
        else:
            say("==> publish: creating GitHub release " + tag)
            if os.path.isfile(args.notes):
                run(["gh", "release", "create", tag, "--title", title,
                     "--notes-file", args.notes, asset], dry)
            else:
                say("    !! " + args.notes
                    + " not found; falling back to generated notes")
                run(["gh", "release", "create", tag, "--title", title,
                     "--generate-notes", asset], dry)

    say("==> done")
    say("    commit : " + head_sha)
    say("    tag    : " + tag)
    say("    asset  : " + asset)
    say("    next   : announce the release, then run the post-release checks")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
