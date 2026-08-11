## 0.1.0 -- e2e csv cleaner 0.1.0

## [0.1.0] - 2026-08-11
### Added
- `csvclean` CLI command (`csvclean IN.csv -o OUT.csv`) that strips leading/trailing whitespace from every field of every data row, leaves the header row byte-for-byte unchanged, and drops any data row that is entirely empty after trimming.
- Output to a file via `-o OUT.csv`, or to stdout when `-o` is omitted (with only the CSV on stdout — the run summary goes to stderr).
- Per-run summary on stderr: rows read, rows dropped, fields trimmed. Exit code 2 (naming the missing path) when the input file does not exist; exit code 0 on success.
- `src/csvclean/rules.py` — the single authoritative module exposing `clean_row(row)` and `is_blank(row)`, imported by both the CLI and the test suite instead of being re-implemented in each.
- `pyproject.toml` packaging: project name `csvclean`, version `0.1.0`, `requires-python = ">=3.12"`, and a `[project.scripts]` entry point so `pip install -e .` (or a built wheel) puts `csvclean` on PATH. `python -m build` produces a wheel and sdist.
- `tests/test_rules.py` plus `tests/fixtures/messy.csv` (and `tests/conftest.py`) — a pytest regression suite covering a whitespace-padded header, a fully blank row, a whitespace-only row, and an RFC-4180 quoted field with an embedded comma.
- `README.md` documenting install and usage.

Note: the raw diffstat supplied for this range shows only deletions. That reflects commit `944b6aa` ("reset for the next e2e project"), which wiped a prior e2e run's copy of this same demo project before the three feature commits (`82109a9`, `1f3b11c`, `0a33742`) rebuilt it. Since PREVIOUS is `None`, this changelog treats 0.1.0 as the initial shippable release of `csvclean`, per the bundled tasks' acceptance criteria (all files listed above are net-new in the current tree).
