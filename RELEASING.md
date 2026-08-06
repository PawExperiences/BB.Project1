# Releasing

Follow these steps in order to cut a new release.

1. Review all entries in the `[Unreleased]` section of `CHANGELOG.md` and decide the next version number by applying Semantic Versioning rules: increment the major version for breaking changes, the minor version for new backwards-compatible features, and the patch version for backwards-compatible bug fixes.
2. In `CHANGELOG.md`, rename the `[Unreleased]` heading to `[X.Y.Z] - YYYY-MM-DD`, substituting the version number chosen in step 1 and today's date in ISO 8601 format.
3. Add a fresh `[Unreleased]` section with all six empty subheadings (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`) above the new release section.
4. Update the comparison-link footer in `CHANGELOG.md` to add a link for the new version tag and reset the `[Unreleased]` diff link so it compares the new tag to `HEAD` (e.g. `[Unreleased]: https://github.com/PawExperiences/BB.Project1/compare/vX.Y.Z...HEAD` and `[X.Y.Z]: https://github.com/PawExperiences/BB.Project1/compare/vPREV...vX.Y.Z`).
5. Commit all changelog updates with a descriptive message such as `chore: release vX.Y.Z`.
6. Create an annotated tag and push it to the remote with `git tag -a vX.Y.Z -m "Release X.Y.Z" && git push origin vX.Y.Z`.
7. Open `https://github.com/PawExperiences/BB.Project1/tags` and confirm the new tag `vX.Y.Z` appears in the list.
8. If the tag was pushed incorrectly, delete it locally with `git tag -d vX.Y.Z`, then ask a human team member to delete the remote tag manually on GitHub (navigate to the repository → Tags → select the tag → Delete), because deleting remote tags is a human-only action that must not be performed by automated tooling; once the remote tag is deleted, recreate the corrected tag locally with `git tag -a vX.Y.Z -m "Release X.Y.Z"` and push it again with `git push origin vX.Y.Z`.
