# Releasing

Follow this checklist to cut a release.

1. Decide the next version number from the `[Unreleased]` entries in `CHANGELOG.md` using semantic versioning rules.
2. Move the `[Unreleased]` entries in `CHANGELOG.md` under a new heading for the release, dated with the release date.
3. Create a release tag matching the new version number.
4. Push the release tag to the remote repository.
5. If the tag was pushed incorrectly, delete the local and remote tag manually, then re-tag and re-push the corrected release.
