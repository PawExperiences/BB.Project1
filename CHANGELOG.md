## 0.6.0 -- e2e prime tester cc 0.6.0

## 0.6.0 - 2026-08-11

### Added
- `prime_tester` CLI (native C++17, CMake-built, zero third-party dependencies): reports primality for integers passed as command-line arguments or read one-per-line from stdin, printing `<n> is prime` / `<n> is not prime` for each input in order (`src/main.cpp`).
- Reusable primality core `bool is_prime(long long n)` (`src/prime.h`, `src/prime.cpp`) using trial division to `sqrt(n)` with the 6k±1 optimisation. `is_prime` is false for every n < 2, true for 2 and 3, false for even n > 2.
- Malformed-input handling: a token that isn't a parseable `long long` prints exactly `not a number: <token>` to stderr, processing continues for the remaining tokens/lines, and the process exits 1 if any token was malformed (0 if every token was valid; 0 on empty stdin).
- `--upto N` range mode backed by a new Sieve of Eratosthenes, `std::vector<long long> primes_up_to(long long n)` (`src/sieve.h`, `src/sieve.cpp`): prints every prime from 2 up to N inclusive, one per line, ascending; prints nothing and exits 0 for N < 2. The existing single-number trial-division path is unchanged.
- CTest-registered sieve benchmark (`src/bench_sieve.cpp`) timing `primes_up_to` at N ~ 10,000,000 and reporting elapsed time as informational output only (no pass/fail threshold).
- `CMakeLists.txt`: CMake >= 3.16, C++17, a single `prime_tester` executable target, no third-party dependencies, no install() step.
- `README.md`: new **Build** section with the exact configure/build commands and where to find/run the executable, and a new **Manual Verification** section with a Command / Expected stdout / Expected exit status table covering all 8 core scenarios (prime, composite, 0, 1, negative, non-numeric token, empty stdin, `--upto 30`).

