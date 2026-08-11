#!/usr/bin/env python3
"""Performs the automated release steps for todo-api v0.1.0
(build+test, version bump, git tag, push, GitHub release, artifact upload).
Run from a clean checkout of the commit you intend to release, on a machine
with push access to origin and an authenticated gh CLI."""
import json
import shutil
import subprocess
import sys
import tarfile
from pathlib import Path

VERSION = "0.1.0"
TAG = f"v{VERSION}"
TITLE = f"todo-api v{VERSION}"
ARTIFACT_DIR = Path("dist")
ARTIFACT_NAME = f"todo-api-{VERSION}.tar.gz"
NOTES_FILE = Path("release/RELEASE_NOTES.md")


def run(cmd, **kwargs):
    print("$ " + " ".join(cmd))
    return subprocess.run(cmd, check=True, **kwargs)


def run_ok(cmd, **kwargs):
    return subprocess.run(cmd, **kwargs).returncode == 0


def main():
    print("==> Checking working tree is clean")
    status = subprocess.run(
        ["git", "status", "--porcelain"], check=True, capture_output=True, text=True
    ).stdout
    if status.strip():
        print("ERROR: working tree has uncommitted changes. Commit or stash first.", file=sys.stderr)
        sys.exit(1)

    print("==> Installing dependencies")
    run(["npm", "ci"])

    print("==> Building (TypeScript strict compile)")
    run(["npm", "run", "build"])

    print("==> Running tests (Vitest)")
    run(["npm", "test"])

    print(f"==> Ensuring package.json version is {VERSION}")
    pkg_path = Path("package.json")
    pkg = json.loads(pkg_path.read_text())
    if pkg.get("version") != VERSION:
        pkg["version"] = VERSION
        pkg_path.write_text(json.dumps(pkg, indent=2))
        run(["git", "add", "package.json"])
        run(["git", "commit", "-m", f"chore(release): v{VERSION}"])
        print("    package.json version bumped and committed.")
    else:
        print(f"    package.json already at {VERSION}, skipping commit.")

    print("==> Tagging release")
    if run_ok(["git", "rev-parse", "-q", "--verify", f"refs/tags/{TAG}"], capture_output=True):
        print(f"    Tag {TAG} already exists, skipping.")
    else:
        run(["git", "tag", "-a", TAG, "-m", TITLE])
        print(f"    Created tag {TAG}.")

    print("==> Pushing branch and tag to origin")
    run(["git", "push", "origin", "HEAD"])
    run(["git", "push", "origin", TAG])

    if shutil.which("gh"):
        print("==> Checking GitHub release")
        if run_ok(["gh", "release", "view", TAG], capture_output=True):
            print(f"    Release {TAG} already exists, skipping creation.")
        else:
            if NOTES_FILE.exists():
                run(["gh", "release", "create", TAG, "--title", TITLE, "--notes-file", str(NOTES_FILE)])
            else:
                run(["gh", "release", "create", TAG, "--title", TITLE,
                     "--notes", f"Release {TITLE}. See CHANGELOG.md for details."])
            print(f"    Created release {TAG}.")

        print("==> Packaging and uploading artifact")
        if ARTIFACT_DIR.is_dir():
            with tarfile.open(ARTIFACT_NAME, "w:gz") as tar:
                for item in ARTIFACT_DIR.iterdir():
                    tar.add(item, arcname=item.name)
            existing = subprocess.run(
                ["gh", "release", "view", TAG, "--json", "assets", "--jq", ".assets[].name"],
                capture_output=True, text=True,
            ).stdout.splitlines()
            if ARTIFACT_NAME in existing:
                print(f"    Asset {ARTIFACT_NAME} already attached, skipping upload.")
            else:
                run(["gh", "release", "upload", TAG, ARTIFACT_NAME])
                print(f"    Uploaded {ARTIFACT_NAME}.")
        else:
            print(f"    WARNING: {ARTIFACT_DIR} not found, skipping artifact upload.", file=sys.stderr)
    else:
        print("==> 'gh' CLI not found; skipping GitHub release creation and artifact upload.")
        print("    Install https://cli.github.com and re-run, or create the release manually.")

    print(f"==> Release {TAG} complete.")


if __name__ == "__main__":
    main()
