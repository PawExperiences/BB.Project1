#!/usr/bin/env python3
"""Automated release steps for factorlib 0.1.0.

Idempotent: safe to re-run; each step checks current state before acting.
Requires git, python3 with pip, and (for the publish step) the GitHub CLI
`gh` authenticated with a token that can create releases on this repo.

Usage: python3 release/scripts/release.py
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
import venv
from pathlib import Path

VERSION = "0.1.0"
TAG = "v" + VERSION
SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]
DIST_DIR = REPO_ROOT / "dist"
NOTES_FILE = REPO_ROOT / "release" / "notes" / (TAG + ".md")


def run(cmd):
    print("==> " + " ".join(cmd))
    subprocess.run(cmd, cwd=REPO_ROOT, check=True)


def step_verify_clean_tree():
    print("-- Verifying working tree is clean --")
    status = subprocess.run(
        ["git", "status", "--porcelain"],
        cwd=REPO_ROOT,
        check=True,
        capture_output=True,
        text=True,
    )
    if status.stdout.strip():
        print("Working tree is not clean; commit or stash changes before releasing:", file=sys.stderr)
        print(status.stdout, file=sys.stderr)
        sys.exit(1)
    print("Working tree is clean.")


def step_install_tooling():
    print("-- Installing factorlib (editable) and release tooling --")
    run([sys.executable, "-m", "pip", "install", "--quiet", "-e", "."])
    run([sys.executable, "-m", "pip", "install", "--quiet", "pytest", "ruff", "build"])


def step_test():
    print("-- Running test suite --")
    run([sys.executable, "-m", "pytest", "-q"])


def step_lint():
    print("-- Running lint checks --")
    run([sys.executable, "-m", "ruff", "check", "."])
    run([sys.executable, "-m", "ruff", "format", "--check", "."])


def step_build():
    print("-- Building sdist and wheel --")
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    run([sys.executable, "-m", "build"])


def step_smoke_test():
    print("-- Smoke-testing the built wheel in a throwaway venv --")
    wheels = sorted(DIST_DIR.glob("*.whl"))
    if not wheels:
        print("No wheel found in dist/; the build step must run first.", file=sys.stderr)
        sys.exit(1)
    wheel = wheels[-1]
    with tempfile.TemporaryDirectory() as tmp:
        venv_dir = Path(tmp) / "smoke-venv"
        venv.EnvBuilder(with_pip=True).create(venv_dir)
        if sys.platform == "win32":
            python = venv_dir / "Scripts" / "python.exe"
        else:
            python = venv_dir / "bin" / "python"
        subprocess.run([str(python), "-m", "pip", "install", "--quiet", str(wheel)], check=True)
        result = subprocess.run(
            [str(python), "-m", "factorlib.cli", "12", "18", "7"],
            capture_output=True,
            text=True,
        )
        print(result.stdout, end="")
        expected = {"12: 2 2 3", "18: 2 3 3", "7: 7"}
        got = {line.strip() for line in result.stdout.splitlines() if line.strip()}
        if result.returncode != 0 or not expected.issubset(got):
            print("Smoke test failed: unexpected CLI output for valid input.", file=sys.stderr)
            sys.exit(1)
        failing = subprocess.run(
            [str(python), "-m", "factorlib.cli", "0"],
            capture_output=True,
            text=True,
        )
        if failing.returncode != 1:
            print("Smoke test failed: 'factorlib 0' should exit with status 1.", file=sys.stderr)
            sys.exit(1)
    print("Smoke test passed.")


def step_tag_and_push():
    print("-- Tagging " + TAG + " --")
    existing = subprocess.run(
        ["git", "rev-parse", "-q", "--verify", "refs/tags/" + TAG],
        cwd=REPO_ROOT,
        capture_output=True,
    )
    if existing.returncode == 0:
        print("Tag " + TAG + " already exists locally; skipping tag creation.")
    else:
        run(["git", "tag", "-a", TAG, "-m", "factorlib " + VERSION])
    run(["git", "push", "origin", TAG])


def step_publish_release():
    print("-- Publishing GitHub release " + TAG + " --")
    exists = subprocess.run(["gh", "release", "view", TAG], cwd=REPO_ROOT, capture_output=True)
    if exists.returncode == 0:
        print("GitHub release " + TAG + " already exists; skipping creation.")
        return
    if NOTES_FILE.exists():
        notes_args = ["--notes-file", str(NOTES_FILE)]
    else:
        notes_args = ["--notes", "factorlib " + VERSION]
    artifacts = [str(p) for p in DIST_DIR.glob("*")]
    run(["gh", "release", "create", TAG] + artifacts + ["--title", "factorlib " + VERSION] + notes_args)


def main():
    step_verify_clean_tree()
    step_install_tooling()
    step_test()
    step_lint()
    step_build()
    step_smoke_test()
    step_tag_and_push()
    step_publish_release()
    print("Release " + TAG + " complete.")


if __name__ == "__main__":
    main()
