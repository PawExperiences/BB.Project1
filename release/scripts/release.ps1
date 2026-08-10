# Idempotent release script: tags, packages, and publishes the GitHub release for v0.5.0.
$ErrorActionPreference = "Stop"

$Version = "0.5.0"
$Tag = "v$Version"
$RepoSlug = $env:REPO_SLUG
if (-not $RepoSlug) { $RepoSlug = "PawExperiences/BB.Project1" }
$ArtifactName = "space-invaders-cc-$Version.zip"
$ArtifactFiles = @("index.html", "gameConfig.js", "game.js", "input.js", "player.js", "README.md")

$Root = (git rev-parse --show-toplevel).Trim()
Set-Location $Root

Write-Host "+ checking working tree is clean"
$status = git status --porcelain
if ($status) {
    Write-Error "working tree is not clean; commit or stash changes before releasing"
    exit 1
}

git rev-parse --verify --quiet $Tag *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "tag $Tag already exists locally, skipping creation"
} else {
    Write-Host "+ git tag -a $Tag -m 'Release $Tag'"
    git tag -a $Tag -m "Release $Tag"
}

$remoteTags = git ls-remote --tags origin $Tag
if ($remoteTags -match [regex]::Escape($Tag)) {
    Write-Host "tag $Tag already exists on origin, skipping push"
} else {
    Write-Host "+ git push origin $Tag"
    git push origin $Tag
}

if (Test-Path $ArtifactName) {
    Write-Host "artifact $ArtifactName already exists, skipping packaging"
} else {
    Write-Host "+ packaging $ArtifactName"
    $existing = $ArtifactFiles | Where-Object { Test-Path $_ }
    Compress-Archive -Path $existing -DestinationPath $ArtifactName -Force
    Write-Host "packaged artifact at $Root\$ArtifactName"
}

$NotesFile = $null
if (Test-Path "release/RELEASE_NOTES.md") {
    $NotesFile = "release/RELEASE_NOTES.md"
} elseif (Test-Path "CHANGELOG.md") {
    $NotesFile = "CHANGELOG.md"
}

gh release view $Tag --repo $RepoSlug *> $null
if ($LASTEXITCODE -eq 0) {
    Write-Host "GitHub release $Tag already exists, skipping creation"
} else {
    if ($NotesFile) {
        Write-Host "+ gh release create $Tag $ArtifactName --notes-file $NotesFile"
        gh release create $Tag $ArtifactName --repo $RepoSlug --title "e2e space invaders cc $Version" --notes-file $NotesFile
    } else {
        Write-Host "+ gh release create $Tag $ArtifactName --notes 'Release $Tag'"
        gh release create $Tag $ArtifactName --repo $RepoSlug --title "e2e space invaders cc $Version" --notes "Release $Tag. See CHANGELOG.md for details."
    }
    Write-Host "published GitHub release $Tag"
}

Write-Host "release $Tag complete"
