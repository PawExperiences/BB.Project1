# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security

## [0.2.0] – 2026-03-01
### Added
- You can now fight a multi-phase boss in Level 4, complete with a health bar, phase-shift visual, and a win screen showing your final score.
- Level 3 introduces four destructible bunkers that erode cell-by-cell when hit by any projectile, and the invader formation splits into two independent halves at the halfway point.
- A UFO bonus target now crosses the screen every 20 seconds in Level 2, awarding tiered bonus points when shot.
- Release helper scripts (`release/scripts/release.{py,sh,ps1}`, `release/scripts/run.{py,sh,ps1}`) are now included for packaging and running the project on all major platforms.
- The prime tester console application (`src/main.cpp`, `src/prime.cpp`, `src/prime.h`) is now available, allowing integers to be tested for primality via command-line arguments or stdin.
- A Sieve of Eratosthenes range mode (`src/sieve.cpp`, `src/sieve.h`) is now available via `--upto N`, printing every prime up to N.
- The CMake build system (`CMakeLists.txt`) is now configured and builds the prime tester and sieve components.
- The CI build workflow (`.github/workflows/build.yml`) is now scaffolded and operational for this project.

### Fixed
- The boss health bar no longer remains visible after the win screen is displayed.
- Restarting after the boss fight no longer triggers duplicate sound effects or leaves stale event listeners active.

### Removed
- The single-level practice mode has been removed; all play now starts from Level 1 of the full four-level campaign.
