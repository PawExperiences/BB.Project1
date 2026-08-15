## 0.1.0 -- e2e link checker 0.1.0

# Changelog

All notable changes to `linkcheck` are documented in this file.

## [0.1.0] - 2026-08-15
### Added
- `linkcheck` Python package skeleton (`pyproject.toml`, `src/linkcheck/__init__.py`, `src/linkcheck/cli.py`) declaring project name `linkcheck`, version `0.1.0`, and a `[project.scripts]` entry point so `linkcheck` is on PATH after `pip install .`.
- CLI usage `linkcheck <file>`: scans a single Markdown file for inline links (`[text](target)`) and reference-style link definitions (`[id]: target`), tracking the 1-based source line number of each occurrence.
- Fixed lexical broken-link rules (no network access, no site root): a target is BROKEN if it is empty, uses a scheme other than `http`, `https`, or `mailto`, contains whitespace, or starts with `/`.
- Deterministic stdout diagnostics, one line per broken link in ascending line-number order, in the exact format `<line>:<target>: <reason>`.
- Stable exit-status contract: `0` clean scan, `1` one or more broken links found, `2` usage error (bad/missing argument or unreadable file) — usage errors do not print any broken-link lines.
- A single stderr-only summary line per scan reporting files scanned, links found, and broken-link count, keeping stdout reserved for machine-parseable diagnostics.
- `README.md` documenting installation, `linkcheck <file>` usage, the classification rules, the output line format, and the 0/1/2 exit-code contract.
- Test suite `tests/test_linkcheck.py` against fixtures `tests/fixtures/sample.md` (one instance each of a good http(s) link, a good `mailto:` link, a good reference definition, an empty target, an `ftp://` target, a target with a space, and a non-existent `/absolute` path) and `tests/fixtures/clean.md` (all well-formed, resolvable links), asserting exact reported line numbers and exit codes 1 / 0 respectively. No test performs live network requests.

### Changed
- N/A — initial release.

### Fixed
- N/A — initial release.
