## 0.1.0 -- e2e prime tester 0.1.0

## [0.1.0] - Initial Release

### Added
- `CMakeLists.txt`: CMake build definition (minimum 3.16, C++17, single executable target `prime_tester`).
- `src/prime.h`: Public header declaring `bool is_prime(long long n);`.
- `src/prime.cpp`: Implementation of `is_prime` using the 6k±1 trial-division optimisation.
- `src/main.cpp`: Entry-point with dual input modes (command-line arguments or stdin), per-token error reporting to stderr, and well-defined exit codes (0 = all valid, 1 = any invalid token).
- `README.md`: Usage documentation covering build steps, CLI contract, and examples.
- `.github/workflows/build.yml`: BuildBoard-managed CI workflow that builds `prime_tester` and archives the executable artifact.
- `test/sample-pr.txt`: Dummy text file added as sample untracked PR artefact (no functional impact).
