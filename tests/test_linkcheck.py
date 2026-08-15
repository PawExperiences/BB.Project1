"""Behavioural tests for the linkcheck CLI, run against fixed fixtures.

Sibling tasks own the concrete interface. As implemented in
``src/linkcheck/cli.py`` there is no ``__main__.py``, so the runnable
entry point is the module ``linkcheck.cli`` (``python -m linkcheck.cli
<file>``, equivalent to the installed ``linkcheck`` console script). Each
broken link is printed to stdout as ``<line>:<target>: <reason>``; a
summary line goes to stderr. Exit status is 0 (clean), 1 (broken links
found), or 2 (usage error). These tests only assert on line numbers and
exit status, per this task's scope, and invoke the checker as a
subprocess with no network access.
"""

import os
import re
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = REPO_ROOT / "src"
FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"

REPORTED_LINE_RE = re.compile(r"^(\d+):")

# Lines in sample.md that must be reported, and only these:
#   12 - empty target
#   13 - ftp:// target (unsupported scheme)
#   14 - target containing a space
#   15 - target that is a non-existent /absolute path
EXPECTED_BROKEN_LINES = {12, 13, 14, 15}


def run_linkcheck(path):
    env = dict(os.environ)
    env["PYTHONPATH"] = str(SRC_DIR)
    return subprocess.run(
        [sys.executable, "-m", "linkcheck.cli", str(path)],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
    )


def reported_lines(stdout):
    lines = set()
    for output_line in stdout.splitlines():
        match = REPORTED_LINE_RE.match(output_line)
        if match:
            lines.add(int(match.group(1)))
    return lines


def test_sample_fixture_reports_exactly_the_broken_lines():
    result = run_linkcheck(FIXTURES_DIR / "sample.md")

    assert result.returncode == 1
    assert reported_lines(result.stdout) == EXPECTED_BROKEN_LINES


def test_clean_fixture_reports_no_issues():
    result = run_linkcheck(FIXTURES_DIR / "clean.md")

    assert result.returncode == 0
    assert reported_lines(result.stdout) == set()
    assert result.stdout == ""
