## 0.1.0 -- e2e gate check 0.1.0

## [0.1.0] - 2026-08-11

### Added
- `factorlib` package skeleton: src-layout, `pyproject.toml` (setuptools.build_meta backend, `project.requires-python = ">=3.12"`), and a `py.typed` marker for downstream type-checking. (#238)
- `prime_factors(n: int) -> list[int]` in `src/factorlib/factor.py`: trial-division prime factorization (divide out 2, then odd candidates up to sqrt), re-exported from the package's public API (`from factorlib import prime_factors`). `prime_factors(1) == []`; `n <= 0` raises `ValueError` naming the offending value; non-int input raises `TypeError`. (#239)
- `factorlib` CLI (`src/factorlib/cli.py`, wired via `[project.scripts]`): factorizes one or more integers, printing `<n>: <factor1> <factor2> ...` per line to stdout (Unix `factor`-style), reporting per-integer errors to stderr, and exiting 1 if any input errored (0 otherwise). Runnable via `uv run factorlib ...` or the installed `factorlib` command. (#240)
- `tests/test_factor.py` covering a composite (12), a prime (97), a prime square (49), `1`, `0`, a negative integer, and a non-int argument; full suite passes with no skips or xfails.

This is the initial release, so there is nothing to list under Changed or Fixed.
