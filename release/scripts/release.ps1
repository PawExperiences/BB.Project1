# Release script for e2e calculator cc: builds, tags, and publishes a GitHub release.
# Run this once CI is green and the changelog/release-notes PR has merged.
# Requires: git, mvn (Maven), and the GitHub CLI (gh) authenticated, all on PATH.

$ErrorActionPreference = "Stop"

$JarPath = "target/calculator-0.1.0.jar"
$ReleaseTag = if ($env:RELEASE_TAG) { $env:RELEASE_TAG } else { "v0.4.0" }
$ReleaseTitle = if ($env:RELEASE_TITLE) { $env:RELEASE_TITLE } else { "e2e calculator cc 0.4.0" }
$NotesPath = if ($env:RELEASE_NOTES_PATH) { $env:RELEASE_NOTES_PATH } else { "release/RELEASE_NOTES.md" }

Write-Host "== 1/4: building and testing with Maven =="
Write-Host "+ mvn -B package"
mvn -B package
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not (Test-Path $JarPath)) {
    Write-Host "ERROR: expected jar not found at $JarPath"
    exit 1
}

Write-Host "== 2/4: tagging $ReleaseTag =="
git rev-parse -q --verify "refs/tags/$ReleaseTag" | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "$ReleaseTag already exists locally, skipping tag creation"
} else {
    Write-Host "+ git tag -a $ReleaseTag -m ---title---"
    git tag -a $ReleaseTag -m $ReleaseTitle
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "== 3/4: pushing tag to origin =="
Write-Host "+ git push origin $ReleaseTag"
git push origin $ReleaseTag
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "== 4/4: publishing GitHub release =="
gh release view $ReleaseTag | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "GitHub release $ReleaseTag already exists, skipping creation (upload assets manually if needed)"
} else {
    if (Test-Path $NotesPath) {
        Write-Host "+ gh release create $ReleaseTag $JarPath --title ---title--- --notes-file $NotesPath"
        gh release create $ReleaseTag $JarPath --title $ReleaseTitle --notes-file $NotesPath
    } else {
        Write-Host "+ gh release create $ReleaseTag $JarPath --title ---title--- --notes ---title---"
        gh release create $ReleaseTag $JarPath --title $ReleaseTitle --notes $ReleaseTitle
    }
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "Done: $ReleaseTag built, tagged, pushed, and published."
