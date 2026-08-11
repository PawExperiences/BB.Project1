## 0.1.0 -- e2e gate check 0.1.0

# Changelog

## [0.1.0] - 2026-08-11

### Added
- `factorlib` Python package: `src/`-layout, setuptools build backend, `requires-python = ">=3.12"`, shipped with a `py.typed` marker for downstream type-checking.
- `factorlib.prime_factors(n: int) -> list[int]` (`src/factorlib/factor.py`): trial division by 2 then odd divisors up to `sqrt(n)`. For `n >= 2` returns the ascending-order multiset of prime factors (e.g. `prime_factors(12) == [2, 2, 3]`, `prime_factors(97) == [97]`, `prime_factors(49) == [7, 7]`); `prime_factors(1) == []`; raises `ValueError` (naming the offending value) for `n <= 0`; raises `TypeError` for non-int input. Exported from `src/factorlib/__init__.py` as `from factorlib import prime_factors`.
- `factorlib` command-line front end (`src/factorlib/cli.py`) registered as a console script in `pyproject.toml`: `factorlib <int> [<int> ...]` prints one `N: p1 x p2 x ... x pk` line per integer, in the order given; fails fast on the first integer that errors (no output for remaining integers, error to stderr, exit code 1); exit code 0 when all integers succeed.
- Test suite: `tests/test_factor.py` (composite/prime/prime-square/1/0/negative/non-int cases) and `tests/test_cli.py` (multi-integer success formatting, fail-fast stderr/exit-1 behavior, exit-0 on full success).
- `README.md` documenting the package layout.

### Changed
- N/A (first release).

### Fixed
- N/A (first release).
