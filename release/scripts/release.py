#!/usr/bin/env python3
"""Automated release steps for e2e quote page: build, tag, publish GitHub release."""
import os
import subprocess
import sys
import zipfile

VERSION = os.environ.get("RELEASE_VERSION", "0.1.0")
TAG = "v" + VERSION
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DIST_DIR = os.path.join(REPO_ROOT, "dist")
CHANGELOG_PATH = os.path.join(REPO_ROOT, "CHANGELOG.md")


def run(cmd):
    print("+ " + " ".join(cmd))
    subprocess.run(cmd, cwd=REPO_ROOT, check=True)


def run_ok(cmd, **kwargs):
    print("+ " + " ".join(cmd))
    return subprocess.run(cmd, cwd=REPO_ROOT, **kwargs)


def ensure_clean_worktree():
    result = subprocess.run(
        ["git", "status", "--porcelain"], cwd=REPO_ROOT,
        capture_output=True, text=True, check=True
    )
    if result.stdout.strip():
        print("Working tree is not clean. Commit or stash changes before releasing.")
        sys.exit(1)
    print("Working tree is clean.")


def build():
    run(["npm", "ci"])
    run(["npm", "run", "build"])
    index_html = os.path.join(DIST_DIR, "index.html")
    if not os.path.isfile(index_html):
        print("Build did not produce dist/index.html")
        sys.exit(1)
    print("Build produced dist/index.html")


CHANGELOG_ENTRY = """## [{version}] - unreleased

### Added
- Astro static homepage that renders one of five quotes, chosen deterministically at build time.
- src/lib/pick.ts deterministic seeded picker.
- src/styles/print.css print stylesheet (black on white, 12pt serif body).
- README documentation for install/build usage and adding a new quote.

""".format(version=VERSION)


def ensure_changelog_pr():
    heading = "## [{}]".format(VERSION)
    existing = ""
    if os.path.isfile(CHANGELOG_PATH):
        with open(CHANGELOG_PATH, "r", encoding="utf-8") as f:
            existing = f.read()
    if heading in existing:
        print("CHANGELOG.md already has an entry for {}, skipping PR.".format(VERSION))
        return

    branch = "release/changelog-v{}".format(VERSION)
    current_branch = subprocess.run(
        ["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=REPO_ROOT,
        capture_output=True, text=True, check=True
    ).stdout.strip()

    run(["git", "checkout", "-B", branch])
    new_content = CHANGELOG_ENTRY + existing if existing else "# Changelog\n\n" + CHANGELOG_ENTRY
    with open(CHANGELOG_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)
    run(["git", "add", "CHANGELOG.md"])
    run(["git", "commit", "-m", "docs: add changelog for v{}".format(VERSION)])
    run(["git", "push", "-u", "origin", branch])
    run_ok([
        "gh", "pr", "create",
        "--title", "docs: changelog for v{}".format(VERSION),
        "--body", "Adds the CHANGELOG.md entry for release v{}.".format(VERSION),
        "--base", current_branch, "--head", branch,
    ])
    run(["git", "checkout", current_branch])


def tag_and_push():
    existing = subprocess.run(
        ["git", "tag", "--list", TAG], cwd=REPO_ROOT,
        capture_output=True, text=True, check=True
    ).stdout.strip()
    if existing:
        print("Tag {} already exists locally, skipping tag creation.".format(TAG))
    else:
        run(["git", "tag", "-a", TAG, "-m", "e2e quote page {}".format(VERSION)])
    run(["git", "push", "origin", TAG])


def package_artifact():
    archive_path = os.path.join(REPO_ROOT, "dist-{}.zip".format(TAG))
    if os.path.isfile(archive_path):
        os.remove(archive_path)
    with zipfile.ZipFile(archive_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _dirs, files in os.walk(DIST_DIR):
            for name in files:
                full = os.path.join(root, name)
                zf.write(full, os.path.relpath(full, DIST_DIR))
    print("Packaged {}".format(archive_path))
    return archive_path


def publish_release(archive_path):
    check = run_ok(["gh", "release", "view", TAG], capture_output=True, text=True)
    if check.returncode == 0:
        print("GitHub release {} already exists, skipping creation.".format(TAG))
        return
    run([
        "gh", "release", "create", TAG, archive_path,
        "--title", "e2e quote page {}".format(VERSION),
        "--notes", "See CHANGELOG.md for details.",
    ])


def main():
    ensure_clean_worktree()
    build()
    ensure_changelog_pr()
    tag_and_push()
    archive_path = package_artifact()
    publish_release(archive_path)
    print("Release {} complete.".format(TAG))


if __name__ == "__main__":
    main()
