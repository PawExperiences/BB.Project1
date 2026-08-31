$releaseVersion = "0.1.0"

# Tag the release
git tag -a "v$releaseVersion" -m "Release version $releaseVersion"
# Push the tag
git push origin "v$releaseVersion"
Write-Host "Release $releaseVersion tagged and pushed successfully."
