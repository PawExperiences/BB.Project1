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

- Level 3 split-formation mechanic with independent left/right halves (`level3.js`).
- Bunker collision system that degrades and consumes bullets (`level3.js` — `collideBulletWithBunkers`).
- UFO spawn and enemy bullet firing in Level 2 (`level2.js` — `spawnUfo`, `fireEnemyBullet`).
- Player respawn support in Level 2 (`level2.js` — `respawnPlayer`).

### Fixed

- Boss health bar no longer renders after the win screen is displayed (`boss.js` — `renderHealthBar`).
- Win/lose event listeners are now properly detached on scene exit to prevent duplicate callbacks (`boss.js` — `_detachWinListeners`).

### Removed

- Placeholder single-level entry point removed; game now bootstraps through the level-registration system (`game.js` — `registerLevel`).

## [0.1.0] - 2026-01-01

### Added

- Project started.

[Unreleased]: https://github.com/PawExperiences/BB.Project1/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/PawExperiences/BB.Project1/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/PawExperiences/BB.Project1/releases/tag/v0.1.0
