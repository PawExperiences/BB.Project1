#!/usr/bin/env python3
"""Tag and publish a GitHub release for this repository."""
import argparse
import os
import shutil
import subprocess
import sys


def run(cmd):
    print("+ " + " ".join(cmd))
    subprocess.run(cmd, check=True)


def run_output(cmd):
    print("+ " + " ".join(cmd))
    result = subprocess.run(cmd, check=True, capture_output=True, text=True)
    return result.stdout.strip()


def require_clean_worktree():
    status = run_output(["git", "status", "--porcelain"])
    if status:
        print("ERROR: working tree is not clean:")
        print(status)
        sys.exit(1)
    print("OK: working tree is clean")


def require_branch(branch):
    current = run_output(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    if current != branch:
        print("ERROR: expected to be on branch '%s', currently on '%s'" % (branch, current))
        sys.exit(1)
    print("OK: on branch '%s'" % branch)


def require_changelog_section(version):
    with open("CHANGELOG.md", "r", encoding="utf-8") as f:
        text = f.read()
    needle = "## [%s] - " % version
    if needle not in text:
        print("ERROR: CHANGELOG.md has no '## [%s] - YYYY-MM-DD' heading" % version)
        sys.exit(1)
    print("OK: CHANGELOG.md has a '[%s]' section" % version)


def tag_exists_locally(tag):
    result = subprocess.run(
        ["git", "rev-parse", "-q", "--verify", "refs/tags/%s" % tag],
        capture_output=True,
    )
    return result.returncode == 0


def main():
    parser = argparse.ArgumentParser(description="Tag and publish a GitHub release.")
    parser.add_argument("version", help="Release version without the leading 'v', e.g. 0.1.0")
    parser.add_argument("--remote", default="origin", help="Git remote to push the tag to (default: origin)")
    parser.add_argument("--branch", default="main", help="Branch the release is cut from (default: main)")
    parser.add_argument("--notes-file", default=None, help="Path to a markdown file with the GitHub release body")
    parser.add_argument(
        "--skip-checks",
        action="store_true",
        help="Skip worktree/branch/changelog pre-flight checks (not recommended)",
    )
    args = parser.parse_args()

    repo_root = run_output(["git", "rev-parse", "--show-toplevel"])
    os.chdir(repo_root)
    print("OK: running from repo root '%s'" % repo_root)

    tag = "v%s" % args.version

    if not args.skip_checks:
        require_branch(args.branch)
        require_clean_worktree()
        run(["git", "fetch", args.remote, "--tags"])
        require_changelog_section(args.version)

    if tag_exists_locally(tag):
        print("OK: tag '%s' already exists locally, skipping tag creation (idempotent)" % tag)
    else:
        run(["git", "tag", "-a", tag, "-m", "Release %s" % tag])
        print("OK: created annotated tag '%s'" % tag)

    remote_tags = run_output(["git", "ls-remote", "--tags", args.remote])
    if ("refs/tags/%s" % tag) in remote_tags:
        print("OK: tag '%s' already exists on '%s', skipping push (idempotent)" % (tag, args.remote))
    else:
        run(["git", "push", args.remote, tag])
        print("OK: pushed tag '%s' to '%s'" % (tag, args.remote))

    if shutil.which("gh"):
        existing = subprocess.run(["gh", "release", "view", tag], capture_output=True)
        if existing.returncode == 0:
            print("OK: GitHub release '%s' already exists, skipping creation (idempotent)" % tag)
        else:
            cmd = ["gh", "release", "create", tag, "--title", tag]
            if args.notes_file:
                cmd += ["--notes-file", args.notes_file]
            else:
                cmd += ["--generate-notes"]
            run(cmd)
            print("OK: created GitHub release '%s'" % tag)
    else:
        print("NOTE: 'gh' CLI not found; create the GitHub release for '%s' manually" % tag)

    print("DONE: release %s tagged and published" % tag)


if __name__ == "__main__":
    main()
