# Releasing

Follow these steps to cut a release:

1. Decide the next version number by applying semver rules to the entries currently listed under `## [Unreleased]` in `CHANGELOG.md`.
2. Move those Unreleased entries into a new `## [MAJOR.MINOR.PATCH] - YYYY-MM-DD` heading dated with the release date.
3. Tag the release commit with the new version, using the `vMAJOR.MINOR.PATCH` naming convention (e.g. `v0.2.0`).
4. Push the tag to the remote so it appears on GitHub.
5. If the wrong tag was pushed, push a corrected tag pointing at the intended commit rather than deleting or force-pushing over the existing one, and open an issue noting the mistake.
