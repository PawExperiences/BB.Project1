# Cut and publish the release: tag the commit, push the tag, publish the GitHub release.
$ErrorActionPreference = "Stop"

$Version = if ($env:RELEASE_VERSION) { $env:RELEASE_VERSION } else { "0.1.0" }
$Tag = "v$Version"
$Branch = if ($env:RELEASE_BRANCH) { $env:RELEASE_BRANCH } else { "main" }
$NotesPath = if ($env:RELEASE_NOTES_PATH) { $env:RELEASE_NOTES_PATH } else { "release/RELEASE_NOTES.md" }

Write-Host "Releasing $Tag from branch $Branch"

if (-not (Test-Path $NotesPath)) {
    Write-Error "Release notes file not found at $NotesPath."
    exit 1
}

$status = git status --porcelain
if ($status) {
    Write-Error "Working tree is not clean. Commit or stash changes before releasing."
    exit 1
}

$currentBranch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($currentBranch -ne $Branch) {
    Write-Error "Expected to be on '$Branch', but on '$currentBranch'."
    exit 1
}

git rev-parse -q --verify "refs/tags/$Tag" 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Tag $Tag already exists locally, skipping tag creation."
} else {
    Write-Host "+ git tag -a $Tag -m 'Release $Tag'"
    git tag -a $Tag -m "Release $Tag"
}

$remoteTag = git ls-remote --tags origin $Tag
if ($remoteTag) {
    Write-Host "Tag $Tag already exists on origin, skipping push."
} else {
    Write-Host "+ git push origin $Tag"
    git push origin $Tag
}

gh release view $Tag *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "GitHub release $Tag already exists, skipping creation."
} else {
    Write-Host "+ gh release create $Tag --title $Tag --notes-file $NotesPath"
    gh release create $Tag --title $Tag --notes-file $NotesPath
}

Write-Host "Release $Tag complete."
