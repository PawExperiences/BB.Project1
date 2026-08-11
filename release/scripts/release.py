#!/usr/bin/env python3
"""Idempotently tag and publish a GitHub release for this project.

Usage:
    python3 release/scripts/release.py

Environment variables:
    RELEASE_VERSION   Version to release, e.g. "0.4.0" (default: 0.4.0)
    RELEASE_NAME      Human release title (default: "e2e calculator cc <version>")
    GIT_REMOTE        Git remote to push the tag to (default: origin)
    GITHUB_REPO       "owner/repo" slug for the GitHub release (default: PawExperiences/BB.Project1)
    CHANGELOG_FILE    Path to changelog excerpt to use as the release body (default: CHANGELOG.md)
    DRY_RUN           If set to "1", print actions without executing them

Requires: git in PATH, and the GitHub CLI ("gh", authenticated) to publish the
GitHub release. If "gh" is not available, the script tags and pushes the tag
only, and prints the manual "gh release create" command to run.
"""
import os
import subprocess
import sys
import shutil


def run(cmd, dry_run=False):
    print("+ " + " ".join(cmd))
    if dry_run:
        return ""
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        sys.stderr.write(result.stderr)
        raise SystemExit(result.returncode)
    return result.stdout.strip()


def main():
    version = os.environ.get("RELEASE_VERSION", "0.4.0")
    tag = version if version.startswith("v") else "v" + version
    remote = os.environ.get("GIT_REMOTE", "origin")
    repo_slug = os.environ.get("GITHUB_REPO", "PawExperiences/BB.Project1")
    release_name = os.environ.get("RELEASE_NAME", "e2e calculator cc " + version)
    changelog_file = os.environ.get("CHANGELOG_FILE", "CHANGELOG.md")
    dry_run = os.environ.get("DRY_RUN") == "1"

    existing_tags = run(["git", "tag", "--list", tag])
    if existing_tags.strip() == tag:
        print("Tag %s already exists locally; skipping tag creation." % tag)
    else:
        print("Creating annotated tag %s at HEAD..." % tag)
        run(["git", "tag", "-a", tag, "-m", release_name], dry_run=dry_run)

    print("Pushing tag %s to %s (additive; never deletes or rewrites history)..." % (tag, remote))
    run(["git", "push", remote, tag], dry_run=dry_run)

    if shutil.which("gh") is None:
        print("gh CLI not found. To publish the GitHub release manually, run:")
        print('  gh release create %s --repo %s --title "%s" --notes-file %s' % (tag, repo_slug, release_name, changelog_file))
        return

    print("Creating GitHub release %s via gh CLI..." % tag)
    notes_arg = ["--notes-file", changelog_file] if os.path.isfile(changelog_file) else ["--notes", release_name]
    run(["gh", "release", "create", tag, "--repo", repo_slug, "--title", release_name] + notes_arg, dry_run=dry_run)
    print("Done.")


if __name__ == "__main__":
    main()
