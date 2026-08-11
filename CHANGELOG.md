## 0.1.0 -- e2e gate check 0.1.0

# Changelog

## [0.1.0] - 2026-08-11

### Added
- `factorlib` package skeleton: installable via `pyproject.toml` (setuptools build backend, `src/` layout, `requires-python = ">=3.12"`, and a `py.typed` marker shipped as package data for the typed-library contract).
- `factorlib.prime_factors(n: int) -> list[int]`: prime factorization by trial division (2, then odd numbers up to `sqrt(n)`), returning factors with multiplicity in ascending order (e.g. `prime_factors(12) == [2, 2, 3]`).
- Input contract for `prime_factors`: raises `TypeError` on non-int input; raises `ValueError` naming the offending value for `n <= 0`; returns `[]` for `n == 1` (no prime factors, by convention).
- `factorlib` console-script CLI (`src/factorlib/cli.py`, wired via `[project.scripts]`): `factorlib <n> [<n> ...]` prints one `n: p1 p2 p3` line per argument, in the order given; stops fail-fast on the first error (message to stderr, exit code 1) without discarding output already printed for prior arguments; exits 0 once all arguments succeed.
- Test suite (`tests/test_factor.py`) covering a composite (12), a prime (97), a prime square (49), 1, 0, a negative number, and a non-int input.

