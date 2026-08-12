import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = REPO_ROOT / "src"
FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"

SAMPLE_MD = FIXTURES_DIR / "sample.md"
CLEAN_MD = FIXTURES_DIR / "clean.md"

# Lines in sample.md that carry an intentionally broken link target.
SAMPLE_BROKEN_LINES = {11, 13, 15, 17}


def run_linkcheck(path):
    env = dict(os.environ)
    env["PYTHONPATH"] = str(SRC_DIR) + os.pathsep + env.get("PYTHONPATH", "")
    result = subprocess.run(
        [sys.executable, "-m", "linkcheck.cli", str(path)],
        capture_output=True,
        text=True,
        env=env,
    )
    return result


def reported_lines(stdout):
    lines = set()
    for row in stdout.splitlines():
        if not row.strip():
            continue
        lineno = row.split(":", 1)[0]
        lines.add(int(lineno))
    return lines


def test_sample_reports_exact_broken_lines():
    result = run_linkcheck(SAMPLE_MD)
    assert reported_lines(result.stdout) == SAMPLE_BROKEN_LINES


def test_sample_exits_with_status_1():
    result = run_linkcheck(SAMPLE_MD)
    assert result.returncode == 1


def test_clean_reports_no_issues():
    result = run_linkcheck(CLEAN_MD)
    assert reported_lines(result.stdout) == set()
    assert result.stdout == ""


def test_clean_exits_with_status_0():
    result = run_linkcheck(CLEAN_MD)
    assert result.returncode == 0
