#!/usr/bin/env python3
"""Tag, package and publish the Space Invaders release.

WHAT IT DOES
  1. refuses to run on a dirty working tree
  2. creates the annotated tag v<version> on HEAD (skipped if it already exists)
  3. pushes the tag to the remote (skipped if the remote already has it)
  4. packages the tagged tree into <dist>/space-invaders-<version>.zip
  5. publishes the GitHub release from the notes file and uploads the zip,
     when the GitHub CLI (gh) is installed and authenticated

WHEN TO RUN IT
  From the repository root, after the release-notes PR is merged and CI on the
  release commit is green - steps 9 to 11 of the release runbook.

Every action is idempotent and additive: already-done work is skipped, and the
script never deletes, moves or force-pushes anything.  If the tag exists but
points somewhere other than HEAD it stops and asks a human.

Standard library only.  Works anywhere Python 3.7+ and git are installed.
"""

import argparse
import json
import os
import shutil
import subprocess
import sys

DEFAULT_VERSION = "0.5.0"
DEFAULT_REMOTE = "origin"
DEFAULT_NOTES = os.path.join("docs", "releases", "0-5-0.md")
RELEASE_TITLE = "e2e space invaders cc"


def say(message):
    print("[release] " + message)


def run(cmd, check=True):
    """Run a command, returning (exit code, combined output)."""
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                            universal_newlines=True)
    out, _ = proc.communicate()
    out = (out or "").strip()
    if check and proc.returncode != 0:
        say("FAILED: " + " ".join(cmd))
        if out:
            print(out)
        sys.exit(1)
    return proc.returncode, out


def main():
    parser = argparse.ArgumentParser(
        description="Tag, package and publish the Space Invaders release.")
    parser.add_argument("--version", default=DEFAULT_VERSION,
                        help="version to release (default: %s)" % DEFAULT_VERSION)
    parser.add_argument("--remote", default=DEFAULT_REMOTE,
                        help="git remote to push the tag to (default: %s)" % DEFAULT_REMOTE)
    parser.add_argument("--notes", default=DEFAULT_NOTES,
                        help="markdown file used as the GitHub release body")
    parser.add_argument("--dist", default="dist",
                        help="directory the zip is written to (default: dist)")
    parser.add_argument("--allow-dirty", action="store_true",
                        help="do not refuse to run on a dirty working tree")
    parser.add_argument("--dry-run", action="store_true",
                        help="print what would happen and change nothing")
    args = parser.parse_args()

    tag = "v" + args.version
    zip_name = "space-invaders-%s.zip" % args.version

    if shutil.which("git") is None:
        say("git is not on PATH - cannot continue")
        return 1

    _, root = run(["git", "rev-parse", "--show-toplevel"])
    os.chdir(root)
    say("repository root: " + root)
    if args.dry_run:
        say("DRY RUN - nothing will be created, pushed or published")

    zip_path = os.path.join(args.dist, zip_name)

    _, dirty = run(["git", "status", "--porcelain"])
    if dirty and not args.allow_dirty:
        say("working tree is not clean - commit or stash first (or pass --allow-dirty):")
        print(dirty)
        return 1

    _, head = run(["git", "rev-parse", "HEAD"])
    say("HEAD is " + head)

    # 1. annotated tag ----------------------------------------------------
    code, _ = run(["git", "rev-parse", "-q", "--verify", "refs/tags/" + tag], check=False)
    if code == 0:
        _, tagged = run(["git", "rev-parse", tag + "^{commit}"])
        if tagged != head:
            say("tag %s already exists and points at %s, not HEAD (%s)." % (tag, tagged, head))
            say("refusing to move or delete an existing tag - ask a human.")
            return 1
        say("tag %s already exists on HEAD - skipping" % tag)
    else:
        message = "%s %s" % (RELEASE_TITLE, args.version)
        if args.dry_run:
            say("would run: git tag -a %s -m '%s'" % (tag, message))
        else:
            run(["git", "tag", "-a", tag, "-m", message])
            say("created annotated tag " + tag)

    # 2. push the tag -----------------------------------------------------
    _, remote_tag = run(["git", "ls-remote", "--tags", args.remote, "refs/tags/" + tag],
                        check=False)
    if remote_tag:
        say("tag %s is already on %s - skipping push" % (tag, args.remote))
    elif args.dry_run:
        say("would run: git push %s %s" % (args.remote, tag))
    else:
        run(["git", "push", args.remote, tag])
        say("pushed %s to %s" % (tag, args.remote))

    # 3. package the artifact ---------------------------------------------
    if os.path.exists(zip_path):
        say("artifact %s already exists - skipping packaging" % zip_path)
    elif args.dry_run:
        say("would package %s from %s" % (zip_path, tag))
    else:
        if not os.path.isdir(args.dist):
            os.makedirs(args.dist)
        run(["git", "archive", "--format=zip",
             "--prefix=space-invaders-%s/" % args.version,
             "-o", zip_path, tag])
        say("packaged " + zip_path)

    # 4. publish -----------------------------------------------------------
    gh = shutil.which("gh")
    if gh is None:
        say("GitHub CLI (gh) not found - the tag and the artifact are ready.")
        say("publish by hand with:")
        say("  gh release create %s --title '%s %s' --notes-file %s"
            % (tag, RELEASE_TITLE, args.version, args.notes))
        say("  gh release upload %s %s" % (tag, zip_path))
        return 0

    code, _ = run([gh, "release", "view", tag], check=False)
    if code == 0:
        say("GitHub release %s already exists - skipping create" % tag)
    elif args.dry_run:
        say("would run: gh release create %s --notes-file %s" % (tag, args.notes))
    else:
        if not os.path.isfile(args.notes):
            say("notes file %s is missing - write it first (runbook step 6)" % args.notes)
            return 1
        run([gh, "release", "create", tag,
             "--title", "%s %s" % (RELEASE_TITLE, args.version),
             "--notes-file", args.notes])
        say("published GitHub release " + tag)

    code, assets = run([gh, "release", "view", tag, "--json", "assets",
                        "--jq", ".assets[].name"], check=False)
    uploaded = assets.splitlines() if code == 0 else []
    if zip_name in uploaded:
        say("asset %s is already attached to %s - skipping upload" % (zip_name, tag))
    elif args.dry_run:
        say("would run: gh release upload %s %s" % (tag, zip_path))
    elif not os.path.exists(zip_path):
        say("artifact %s is missing - nothing to upload" % zip_path)
    else:
        run([gh, "release", "upload", tag, zip_path])
        say("uploaded " + zip_path)

    say("done - %s is tagged, packaged and published. Nothing was deleted." % tag)
    return 0


if __name__ == "__main__":
    sys.exit(main())
