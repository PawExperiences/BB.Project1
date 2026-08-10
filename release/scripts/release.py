#!/usr/bin/env python3
"""Idempotent release script: tags, packages, and publishes the GitHub release for v0.5.0."""
import os
import subprocess
import sys
import zipfile

VERSION = "0.5.0"
TAG = "v" + VERSION
REPO_SLUG = os.environ.get("REPO_SLUG", "PawExperiences/BB.Project1")
ARTIFACT_FILES = ["index.html", "gameConfig.js", "game.js", "input.js", "player.js", "README.md"]
ARTIFACT_NAME = "space-invaders-cc-%s.zip" % VERSION
NOTES_CANDIDATES = ["release/RELEASE_NOTES.md", "CHANGELOG.md"]


def run(cmd, check=True, capture=False):
    print("+ " + " ".join(cmd))
    result = subprocess.run(cmd, check=False, text=True, capture_output=capture)
    if check and result.returncode != 0:
        sys.exit("command failed: %s" % " ".join(cmd))
    return result


def repo_root():
    r = run(["git", "rev-parse", "--show-toplevel"], capture=True)
    return r.stdout.strip()


def ensure_clean_tree():
    r = run(["git", "status", "--porcelain"], capture=True)
    if r.stdout.strip():
        sys.exit("working tree is not clean; commit or stash changes before releasing")


def tag_exists_locally(tag):
    r = run(["git", "rev-parse", "--verify", "--quiet", tag], check=False, capture=True)
    return r.returncode == 0


def tag_exists_remotely(tag):
    r = run(["git", "ls-remote", "--tags", "origin", tag], capture=True)
    return tag in r.stdout


def create_tag(tag):
    if tag_exists_locally(tag):
        print("tag %s already exists locally, skipping creation" % tag)
    else:
        run(["git", "tag", "-a", tag, "-m", "Release %s" % tag])
        print("created annotated tag %s" % tag)


def push_tag(tag):
    if tag_exists_remotely(tag):
        print("tag %s already exists on origin, skipping push" % tag)
    else:
        run(["git", "push", "origin", tag])
        print("pushed tag %s to origin" % tag)


def build_artifact(root):
    dest = os.path.join(root, ARTIFACT_NAME)
    if os.path.exists(dest):
        print("artifact %s already exists, skipping packaging" % dest)
        return dest
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zf:
        for name in ARTIFACT_FILES:
            path = os.path.join(root, name)
            if os.path.exists(path):
                zf.write(path, arcname=name)
            else:
                print("warning: expected file missing, skipped: %s" % name)
    print("packaged artifact at %s" % dest)
    return dest


def find_notes(root):
    for candidate in NOTES_CANDIDATES:
        path = os.path.join(root, candidate)
        if os.path.exists(path):
            return path
    return None


def release_exists(tag):
    r = run(["gh", "release", "view", tag, "--repo", REPO_SLUG], check=False, capture=True)
    return r.returncode == 0


def create_release(tag, artifact, notes_path):
    if release_exists(tag):
        print("GitHub release %s already exists, skipping creation" % tag)
        return
    cmd = ["gh", "release", "create", tag, artifact,
           "--repo", REPO_SLUG,
           "--title", "e2e space invaders cc %s" % VERSION]
    if notes_path:
        cmd += ["--notes-file", notes_path]
    else:
        cmd += ["--notes", "Release %s. See CHANGELOG.md for details." % tag]
    run(cmd)
    print("published GitHub release %s" % tag)


def main():
    root = repo_root()
    os.chdir(root)
    ensure_clean_tree()
    create_tag(TAG)
    push_tag(TAG)
    artifact = build_artifact(root)
    notes_path = find_notes(root)
    create_release(TAG, artifact, notes_path)
    print("release %s complete" % TAG)


if __name__ == "__main__":
    main()
