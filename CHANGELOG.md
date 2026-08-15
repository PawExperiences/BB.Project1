## 0.1.0 -- e2e changelog writer 0.1.0

## [0.1.0] - 2026-08-15

### Added
- `CHANGELOG.md` at the repository root, in Keep a Changelog 1.1.0 format: an `## [Unreleased]` section with all six standard subheadings (Added, Changed, Deprecated, Removed, Fixed, Security) plus a seed `## [0.1.0] - 2026-01-01` / `### Added` entry recording that the project was started.
- `RELEASING.md` at the repository root: a numbered checklist for cutting a release -- decide the next semver version from the Unreleased entries, move those entries into a new dated CHANGELOG.md heading, create the release tag, push it, and what to do by hand if a tag was pushed incorrectly.
- `CONTRIBUTING.md` at the repository root: how to write a changelog entry -- a one-sentence description of what belongs in each Keep a Changelog category (Added/Changed/Deprecated/Removed/Fixed/Security), one realistic user-facing example entry per category, and a before/after comparison contrasting commit-style phrasing with user-facing phrasing.

### Changed
- `CHANGELOG.md`'s `[Unreleased]` section was walked through RELEASING.md's own release-cut step once, as a worked example: the entries it held under Added/Fixed/Removed were relocated verbatim into a new `## [0.2.0] - 2026-03-01` section, leaving `[Unreleased]`'s six subheadings in place but empty. This is a mechanical demonstration recorded inside the file itself -- it is not an actual tagged `v0.2.0` release. The only tag this runbook cuts is `v0.1.0`.

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

### Fixed

### Removed

## [0.1.0] - 2026-01-01

### Added

- Project started.
