## 0.1.0 -- e2e gate check 0.1.0

# Changelog

## [0.1.0] - 2026-08-11

### Added
- `factorlib` package (src-layout, setuptools `build_meta` backend, Python >=3.12) with a `prime_factors(n: int) -> list[int]` public API computed by trial division (divide out 2, then odd divisors up to sqrt(n)).
- Boundary behavior for `prime_factors`: raises `ValueError` (naming the offending value) for `n <= 0`, returns `[]` for `n == 1`, returns the ascending multiset of prime factors for `n >= 2`, and raises `TypeError` for non-`int` input.
- `factorlib` console-script CLI (`factorlib N1 [N2 ...]`) that prints one `N: f1 f2 f3` line per integer, exits 0 on success, and on the first failing integer prints the already-succeeded lines, writes the error to stderr, and exits 1 without processing further integers.
- Test suite (`tests/test_factor.py`) covering all seven `prime_factors` boundary cases: 12, 97, 49, 1, 0, a negative integer, and a non-int argument.

