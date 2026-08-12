## 0.1.0 -- e2e changelog writer 0.1.0

## [0.1.0] - 2026-08-12

### Added
- `CHANGELOG.md` at the repository root, following [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) and Semantic Versioning: an empty `## [Unreleased]` section with all six standard subheadings (Added, Changed, Deprecated, Removed, Fixed, Security), followed by a `## [0.1.0] - 2026-01-01` entry recording that the project was started.
- `RELEASING.md` at the repository root: a five-step numbered checklist for cutting a release (choose the next version via semver from the Unreleased entries, move those entries under a new dated heading, tag the release commit, push the tag, and correct a tag that was pushed incorrectly).
- `CONTRIBUTING.md` at the repository root: guidance on which Keep a Changelog category (Added, Changed, Deprecated, Removed, Fixed, Security) a change belongs in, one concrete example entry per category, and a before/after pairing that contrasts commit-message-style wording with user-facing wording.

### Notes
- This is the project's first release. No application code, schema, or CI/workflow files are part of this release.
- A bundled task (titled 'A worked second release') describing a `0.2.0` CHANGELOG section is not reflected in the supplied commit log/diffstat for this range and targets a different version; it is intentionally excluded from this 0.1.0 changelog. See the summary and the 'Resolve the task-3 scope mismatch' step below.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security

## [0.1.0] - 2026-01-01

### Added

- Started the project.
