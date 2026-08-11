## 0.6.0 -- e2e prime tester cc 0.6.0

# Changelog

## [0.6.0] - 2026-08-11

### Added
- `prime_tester`: a C++17 CLI that reports primality for integers passed as command-line arguments, or read one per line from stdin when no arguments are given. Prints `<n> is prime` / `<n> is not prime` per value. (#201)
- `is_prime(long long n)` in `src/prime.h` / `src/prime.cpp`: trial division up to sqrt(n) with the classic 6k+/-1 skip, used by the CLI and reusable as a library function. (#201)
- Error handling: a malformed token (not an integer, or out of `long long` range), from either argv or stdin, is reported to stderr as `not a number: <token>`; the run continues processing remaining input and exits with status 1 once done. A run with no bad tokens exits 0; empty stdin is a valid, silent, zero-exit run. (#201)
- `--upto N` mode: prints every prime from 2 up to N inclusive, one per line, in ascending order; N < 2 prints nothing and exits 0. (#202)
- `primes_up_to(long long n)` in `src/sieve.h` / `src/sieve.cpp`: a Sieve-of-Eratosthenes range sieve, kept separate from and not replacing the single-number `is_prime` check. (#202)
- Root `CMakeLists.txt` (CMake >=3.16, C++17) building a single `prime_tester` executable from `src/main.cpp`, `src/prime.cpp`, and `src/sieve.cpp`, with no third-party dependencies, no test framework, and no install step. (#201, #202)
- `README.md`: exact build/run commands (`cmake -B build`, `cmake --build build`) and an 8-row manual-verification table (prime, composite, 0, 1, negative, non-numeric token, empty stdin, `--upto 30`) with verbatim expected stdout and exit status for each. (#203)

