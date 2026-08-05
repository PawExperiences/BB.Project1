## 0.1.0 -- e2e prime tester 0.1.0

# Changelog

## [0.1.0] - Initial Release

### Added
- `CMakeLists.txt`: CMake build definition at repository root targeting C++17, producing the `prime_tester` executable from `src/main.cpp` and `src/prime.cpp`.
- `src/prime.h`: Public header declaring `bool is_prime(long long n)` with include guard.
- `src/prime.cpp`: Implementation of `is_prime` using trial division up to √n with 6k±1 optimisation; handles edge cases (n < 2, n = 2, n = 3, even n > 2).
- `src/main.cpp`: Entry-point supporting argument mode (test each `argv[1..argc-1]`) and stdin mode (read one token per line until EOF); outputs `<n> is prime` / `<n> is not prime` to stdout; writes `not a number: <token>` to stderr for invalid tokens; exits with status 1 if any invalid token was seen.
- `README.md`: Project documentation covering build instructions, usage examples, and algorithm description.
- `test/sample-pr.txt`: Dummy text file added as a sample untracked PR artefact (no functional impact).
- `.github/workflows/build.yml`: BuildBoard-managed CI workflow scaffolded to build the project with `cmake -B build && cmake --build build` and capture the `build/prime_tester` artifact.
