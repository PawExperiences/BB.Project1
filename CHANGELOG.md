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
