## 0.3.0 -- e2e prime tester 0.3.0

# Changelog

## [0.3.0] - Initial Release

### Added
- **Prime Tester Console App** (`prime_tester` executable)
  - `src/prime.h`: Declares `bool is_prime(long long n);` with include guard.
  - `src/prime.cpp`: Implements trial-division primality test with 6k±1 optimisation; correct edge-cases for n < 2, n = 2, n = 3, and even n > 2.
  - `src/main.cpp`: Dual-mode entry point — argv mode (each CLI argument tested) and stdin mode (whitespace-delimited tokens read until EOF); invalid/overflow tokens reported to stderr with exit code 1.
  - `CMakeLists.txt`: Root-level CMake build file; `cmake_minimum_required(VERSION 3.16)`, project `prime_tester`, C++17, single executable target from `src/main.cpp` and `src/prime.cpp`.
  - `README.md`: Project description, build instructions, argv/stdin usage examples, edge-case notes.
- **Sieve of Eratosthenes — Range Primes + `--upto` Benchmark Mode**
  - `src/sieve.h`: Declares `std::vector<long long> primes_up_to(long long n);`.
  - `src/sieve.cpp`: Implements standard Sieve of Eratosthenes using `std::vector<bool>`; correct up to n = 10⁸ (5,761,455 primes); returns empty vector for n < 2.
  - `src/main.cpp` extended: `--upto N` mode calls `primes_up_to(N)` and prints each prime on its own line; missing/invalid N exits 1 with usage message.
  - `CMakeLists.txt` updated: `src/sieve.cpp` added to the `prime_tester` source list.
- **CI / Build workflow** (`.github/workflows/build.yml`): BuildBoard-managed CMake build workflow scaffolded/updated.
- **Repository documentation**: `CHANGELOG.md`, `CONTRIBUTING.md`, `RELEASING.md` created.
- **Release helper scripts**: `release/scripts/release.{py,sh,ps1}`, `release/scripts/run.{py,sh,ps1}`.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.2.0] - 2026-03-01

### Added

- **Prime tester console app** (`src/main.cpp`, `src/prime.cpp`, `src/prime.h`): command-line application that tests whether a given integer is prime.
- **Sieve of Eratosthenes with benchmark** (`src/sieve.cpp`, `src/sieve.h`): range-based prime sieve implementation with integrated benchmarking support.
- **CMake build system** (`CMakeLists.txt`): full CMake project configuration for building the prime tester and sieve components.
- **Manual verification steps in README** (`README.md`): step-by-step instructions for building, running, and verifying the application manually.
- **Release helper scripts** (`release/scripts/release.{py,sh,ps1}`, `release/scripts/run.{py,sh,ps1}`): automated release and run scripts for all major platforms.
- **CI build workflow** (`.github/workflows/build.yml`): BuildBoard-managed workflow scaffolded and updated for this project.
- **Release documentation** (`docs/releases/0-3-0.md`, `CHANGELOG.md`): structured release notes and changelog.

### Fixed

- The boss health bar no longer remains visible after the win screen is displayed.

### Removed

- The single-level practice mode has been removed; all play now starts from Level 1 of the full four-level campaign.

## [0.1.0] - 2026-01-01

### Added

- Project started.

[Unreleased]: https://github.com/PawExperiences/BB.Project1/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/PawExperiences/BB.Project1/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/PawExperiences/BB.Project1/releases/tag/v0.1.0
