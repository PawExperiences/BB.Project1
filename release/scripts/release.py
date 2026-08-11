#!/usr/bin/env python3
"""Automates the factorlib release: lint, test, build, tag, push, and create the GitHub release.

Idempotent - re-running skips any step whose result already exists (tag, GitHub release).
Run from a clean checkout after CI is green. Requires: ruff, pytest, the 'build' package,
git, and the 'gh' CLI (already authenticated) on PATH.
"""
import pathlib
import subprocess
import sys
import tomllib

REPO_ROOT = pathlib.Path(__file__).resolve().parents[2]
DIST_DIR = REPO_ROOT / "dist"


def run(cmd):
    print("+ " + " ".join(cmd))
    subprocess.run(cmd, cwd=REPO_ROOT, check=True)


def read_project_name_and_version():
    pyproject_path = REPO_ROOT / "pyproject.toml"
    data = tomllib.loads(pyproject_path.read_text(encoding="utf-8"))
    return data["project"]["name"], data["project"]["version"]


def tag_exists_locally(tag):
    result = subprocess.run(
        ["git", "rev-parse", "-q", "--verify", "refs/tags/" + tag],
        cwd=REPO_ROOT, capture_output=True,
    )
    return result.returncode == 0


def tag_exists_on_remote(tag):
    result = subprocess.run(
        ["git", "ls-remote", "--tags", "origin", tag],
        cwd=REPO_ROOT, capture_output=True, text=True,
    )
    return bool(result.stdout.strip())


def github_release_exists(tag):
    result = subprocess.run(
        ["gh", "release", "view", tag], cwd=REPO_ROOT, capture_output=True,
    )
    return result.returncode == 0


def main():
    name, version = read_project_name_and_version()
    tag = "v" + version
    print("Releasing " + name + " " + version + " as tag " + tag)

    print("\n== Lint (ruff) ==")
    run(["ruff", "check", "."])

    print("\n== Test (pytest) ==")
    run(["pytest", "-q"])

    print("\n== Build sdist + wheel ==")
    run([sys.executable, "-m", "build"])

    print("\n== Git tag ==")
    if tag_exists_locally(tag):
        print("  tag " + tag + " already exists locally, skipping git tag")
    else:
        run(["git", "tag", "-a", tag, "-m", name + " " + version])

    if tag_exists_on_remote(tag):
        print("  tag " + tag + " already exists on origin, skipping push")
    else:
        run(["git", "push", "origin", tag])

    print("\n== GitHub release ==")
    if github_release_exists(tag):
        print("  GitHub release " + tag + " already exists, skipping gh release create")
    else:
        notes_file = REPO_ROOT / "release" / "RELEASE_NOTES.md"
        dist_files = sorted(str(p) for p in DIST_DIR.glob("*"))
        cmd = ["gh", "release", "create", tag] + dist_files + ["--title", name + " " + version]
        if notes_file.exists():
            cmd += ["--notes-file", str(notes_file)]
        else:
            cmd += ["--notes", name + " " + version]
        run(cmd)

    print("\nDone. Publishing to PyPI is a separate manual step - run:")
    print("  twine upload " + str(DIST_DIR) + "/*")


if __name__ == "__main__":
    main()
