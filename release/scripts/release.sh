#!/bin/sh

# Define the release version
RELEASE_VERSION="0.1.0"

# Tag the release
git tag -a "v$RELEASE_VERSION" -m "Release version $RELEASE_VERSION"
# Push the tag
git push origin "v$RELEASE_VERSION"
echo "Release $RELEASE_VERSION tagged and pushed successfully."
