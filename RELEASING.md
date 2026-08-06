# Releasing

Follow these steps in order to cut a new release.

1. Review all entries under the `[Unreleased]` section of `CHANGELOG.md` and determine the next version number by applying Semantic Versioning rules: increment the major version for breaking changes, the minor version for new backwards-compatible features, and the patch version for backwards-compatible bug fixes.
2. In `CHANGELOG.md`, replace the `[Unreleased]` heading with `[X.Y.Z] - YYYY-MM-DD`, substituting the version number chosen in step 1 and today's date in ISO 8601 format (e.g. `2026-06-15`).
3. Add a new `[Unreleased]` section with all six empty subheadings (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`) above the new dated release section.
4. Update the comparison-link footer in `CHANGELOG.md` to add an entry for the new version tag and reset the `[Unreleased]` diff link to compare the new tag against `HEAD`.
5. Commit the changelog updates with a message such as `chore: release vX.Y.Z`.
6. Create an annotated git tag pointing to the release commit with `git tag -a vX.Y.Z -m "Release X.Y.Z"`.
7. Push the new tag to the remote with `git push origin vX.Y.Z`.
8. Open `https://github.com/PawExperiences/BB.Project1/tags` and confirm the tag `vX.Y.Z` appears in the list.
9. If the tag was pushed with incorrect content, delete it locally with `git tag -d vX.Y.Z`, then ask a human team member to delete the remote tag on GitHub (navigate to the repository → Tags → select the tag → Delete), because removing remote tags is a protected action that must not be performed by automated tooling.
10. Once the incorrect remote tag has been deleted by a human, recreate the corrected annotated tag locally with `git tag -a vX.Y.Z -m "Release X.Y.Z"` and push it again with `git push origin vX.Y.Z`.
