#!/usr/bin/env python3
"""Automated release script for units 0.1.0."""
import shutil
import subprocess
import sys
import tempfile
import venv
from pathlib import Path

VERSION = "0.1.0"
TAG = "v" + VERSION
PACKAGE = "units"
REMOTE = "origin"
REPO_ROOT = Path(__file__).resolve().parents[2]


def run(cmd):
    print("[release] $ " + " ".join(cmd))
    subprocess.run(cmd, check=True, cwd=REPO_ROOT)


def run_capture(cmd):
    result = subprocess.run(cmd, cwd=REPO_ROOT, check=True, capture_output=True, text=True)
    return result.stdout.strip()


def ensure_clean_tree():
    status = run_capture(["git", "status", "--porcelain"])
    if status:
        print("[release] ERROR: working tree is not clean:", file=sys.stderr)
        print(status, file=sys.stderr)
        sys.exit(1)


def run_tests():
    print("[release] running test suite")
    run([sys.executable, "-m", "pytest", "-q"])


def run_lint():
    print("[release] running ruff lint and format check")
    run(["ruff", "check", "src", "tests"])
    run(["ruff", "format", "--check", "src", "tests"])


def build_dist():
    dist_dir = REPO_ROOT / "dist"
    if dist_dir.exists():
        shutil.rmtree(dist_dir)
    print("[release] building sdist and wheel")
    run([sys.executable, "-m", "build"])
    artifacts = sorted(dist_dir.glob("*"))
    if not artifacts:
        print("[release] ERROR: no artifacts produced in dist/", file=sys.stderr)
        sys.exit(1)
    return artifacts


def tag_exists():
    result = subprocess.run(
        ["git", "rev-parse", "-q", "--verify", "refs/tags/" + TAG], cwd=REPO_ROOT
    )
    return result.returncode == 0


def create_tag():
    if tag_exists():
        print("[release] tag " + TAG + " already exists locally, skipping tag creation")
    else:
        print("[release] creating annotated tag " + TAG)
        run(["git", "tag", "-a", TAG, "-m", PACKAGE + " " + VERSION])
    print("[release] pushing tag " + TAG + " to " + REMOTE)
    run(["git", "push", REMOTE, TAG])


def release_exists():
    result = subprocess.run(
        ["gh", "release", "view", TAG], cwd=REPO_ROOT, capture_output=True, text=True
    )
    return result.returncode == 0


def publish_release(artifacts):
    if release_exists():
        print("[release] GitHub release " + TAG + " already exists, skipping creation")
    else:
        notes_path = REPO_ROOT / "release" / "RELEASE_NOTES.md"
        print("[release] creating GitHub release " + TAG)
        cmd = ["gh", "release", "create", TAG, "--title", PACKAGE + " " + VERSION]
        if notes_path.exists():
            cmd += ["--notes-file", str(notes_path)]
        else:
            cmd += ["--notes", PACKAGE + " " + VERSION]
        run(cmd)
    print("[release] uploading artifacts")
    run(["gh", "release", "upload", TAG] + [str(a) for a in artifacts] + ["--clobber"])


def smoke_test(artifacts):
    wheel = next((a for a in artifacts if a.suffix == ".whl"), None)
    if wheel is None:
        print("[release] no wheel artifact found, skipping smoke test", file=sys.stderr)
        return
    with tempfile.TemporaryDirectory() as tmp:
        env_dir = Path(tmp) / "venv"
        print("[release] creating smoke-test venv at " + str(env_dir))
        venv.EnvBuilder(with_pip=True).create(env_dir)
        bin_dir = "Scripts" if sys.platform == "win32" else "bin"
        pip_name = "pip.exe" if sys.platform == "win32" else "pip"
        python_name = "python.exe" if sys.platform == "win32" else "python"
        pip = env_dir / bin_dir / pip_name
        python = env_dir / bin_dir / python_name
        subprocess.run([str(pip), "install", str(wheel)], check=True)
        check = "from units import convert; assert convert(1000, 'm', 'km') == 1.0; print('smoke test ok')"
        subprocess.run([str(python), "-c", check], check=True)


def main():
    ensure_clean_tree()
    run_tests()
    run_lint()
    artifacts = build_dist()
    create_tag()
    publish_release(artifacts)
    smoke_test(artifacts)
    print("[release] " + PACKAGE + " " + VERSION + " released as " + TAG)


if __name__ == "__main__":
    main()
