"""Subprocess-level regression tests for the linkcheck CLI.

These tests invoke the built ``linkcheck`` CLI as a subprocess against the
fixture documents in ``tests/fixtures/`` and assert on its stdout output
(parsed with the ``<line>:<target>: <reason>`` contract documented in
README.md) and exit status only. No network access is performed by the CLI
or by these tests.
"""

import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = REPO_ROOT / "src"
FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"

SAMPLE_MD = FIXTURES_DIR / "sample.md"
CLEAN_MD = FIXTURES_DIR / "clean.md"

# Lines in sample.md whose link targets are malformed, and the reason each
# should be reported for. Every other link in the file is well-formed.
EXPECTED_BROKEN_LINES = {
    12: "empty target",
    14: "unsupported scheme",
    16: "contains a space",
    18: "absolute path not supported",
}


def run_linkcheck(path):
    env = {"PYTHONPATH": str(SRC_DIR)}
    result = subprocess.run(
        [sys.executable, "-m", "linkcheck.cli", str(path)],
        cwd=REPO_ROOT,
        env=env,
        capture_output=True,
        text=True,
        timeout=10,
        check=False,
    )
    return result


def parse_reported_lines(stdout):
    """Parse ``<line>:<target>: <reason>`` stdout lines into {line: reason}."""
    reported = {}
    for raw_line in stdout.splitlines():
        if not raw_line:
            continue
        lineno_str, _, rest = raw_line.partition(":")
        _, _, reason = rest.rpartition(": ")
        reported[int(lineno_str)] = reason
    return reported


def test_sample_reports_exactly_the_malformed_lines():
    result = run_linkcheck(SAMPLE_MD)

    reported = parse_reported_lines(result.stdout)

    assert reported == EXPECTED_BROKEN_LINES


def test_sample_exits_with_status_one():
    result = run_linkcheck(SAMPLE_MD)

    assert result.returncode == 1


def test_clean_document_reports_nothing():
    result = run_linkcheck(CLEAN_MD)

    assert result.stdout == ""


def test_clean_document_exits_with_status_zero():
    result = run_linkcheck(CLEAN_MD)

    assert result.returncode == 0
