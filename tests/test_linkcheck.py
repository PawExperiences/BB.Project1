"""Regression tests for the linkcheck CLI's observable behaviour."""

import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = REPO_ROOT / "src"
FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"


def run_linkcheck(path):
    env = os.environ.copy()
    env["PYTHONPATH"] = os.pathsep.join(
        filter(None, [str(SRC_DIR), env.get("PYTHONPATH", "")])
    )
    return subprocess.run(
        [sys.executable, "-m", "linkcheck.cli", str(path)],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
    )


def test_sample_fixture_reports_exactly_the_broken_links():
    result = run_linkcheck(FIXTURES_DIR / "sample.md")

    assert result.returncode == 1
    assert result.stdout.splitlines() == [
        "9:: empty target",
        "11:ftp://files.example.com/file.zip: disallowed scheme",
        "13:docs/my file.md: contains space",
        "15:/etc/passwd: absolute path",
    ]


def test_sample_fixture_does_not_flag_good_links():
    result = run_linkcheck(FIXTURES_DIR / "sample.md")

    for good_target in (
        "https://example.com/page",
        "mailto:hello@example.com",
        "https://example.com/reference",
    ):
        assert good_target not in result.stdout


def test_clean_fixture_reports_nothing():
    result = run_linkcheck(FIXTURES_DIR / "clean.md")

    assert result.returncode == 0
    assert result.stdout == ""
