## 0.6.0 -- e2e prime tester cc 0.6.0

## [0.6.0] - 2026-08-16

### Added
- BuildBoard-managed CI build workflow (`.github/workflows/build.yml`), scaffolded for the project's C++ (CMake) toolchain (`gcc:14-bookworm`, artifact path `build`) — commit `5e3fc19`.
- GitHub Release delivery channel wired to `PawExperiences/BB.Project1` for this and future versions.

### Changed
- None. No application source is present in this release's commit range.

### Fixed
- None.

### Notes
- First tagged release (previous: none). The commit range `3d812d4..8e02c96` contains only repository-reset housekeeping (`3d812d4`, `32e31f9`, `8e02c96`) and the CI scaffold (`5e3fc19`) — no bundled Done tasks, empty diffstat. See the pre-flight step in `steps` before publishing.
