## 0.1.0 -- e2e link checker 0.1.0

## [0.1.0] - 2026-08-12

### Added
- New `linkcheck` Python package and installable CLI (`pip install .` / `pip install -e .`), PEP 517 packaged via `pyproject.toml`, exposing a `linkcheck` console script (`linkcheck.cli:main`). No third-party runtime dependencies. (#298)
- Static, offline link checker for a single Markdown file: extracts every inline link `[text](target)` (excluding image syntax `![alt](target)`) and every reference-style link definition `[id]: target`, each with its 1-based line number. (#298)
- Broken-target detection, checked in priority order: empty/whitespace-only target (`empty target`), non-http/https/mailto scheme (`unsupported scheme`), whitespace inside the target (`contains a space`), and scheme-less absolute path starting with `/` (`absolute path not supported`). Reported to stdout as `<line>:<target>: <reason>`. (#298)
- Exit-status contract: `0` clean, `1` one or more broken links, `2` usage/IO error (missing args or an unreadable file path). (#298, #299)
- Human-readable run summary (files scanned, links found, broken links) written to **stderr**, keeping stdout machine-parseable for CI/piping. (#299)
- `README.md`: install/usage instructions, the four broken-link rules, the output line format, and the exit-status contract. (#298, #299)
- Regression test suite (`tests/test_linkcheck.py`) driving the CLI as a subprocess against `tests/fixtures/sample.md` (mixed valid/broken links; asserts the exact set of reported line numbers and exit status 1) and `tests/fixtures/clean.md` (only valid links; asserts no stdout output and exit status 0). (#300)

### Changed
- The usage/IO-error exit status, described in the initial implementation as "non-zero other than 1 (e.g. 2)", is now pinned exactly to `2` and documented as part of the formal exit-status contract. (#299)

