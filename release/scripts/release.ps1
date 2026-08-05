# release.ps1 - Tag v0.1.0, push to origin, and create the release ZIP.
# Run once from the repository root before publishing the GitHub Release.

$ErrorActionPreference = 'Stop'

$Version = '0.1.0'
$Tag = "v$Version"
$ZipDir = 'release'
$ZipName = "e2e-space-invaders-$Version.zip"
$SourceFiles = @(
    'index.html',
    'game.js',
    'gameConfig.js',
    'input.js',
    'player.js',
    'invaders.js',
    'collision.js',
    'level1.js',
    'level2.js',
    'README.md'
)

Write-Host "[release.ps1] Releasing $Tag"

# Warn on dirty working tree
$Status = & git status --porcelain
if ($Status) {
    Write-Warning "Working tree is not clean. Uncommitted changes detected."
    Write-Host $Status
}

# Create annotated tag (idempotent)
$ExistingTag = & git tag -l $Tag
if ($ExistingTag -eq $Tag) {
    Write-Host "  Tag $Tag already exists locally - skipping tag creation."
} else {
    & git tag -a $Tag -m "Release $Tag`: e2e Space Invaders initial release"
    Write-Host "  Created annotated tag $Tag"
}

# Push tag to origin
& git push origin $Tag
Write-Host "  Pushed $Tag to origin"

# Verify source files exist
foreach ($f in $SourceFiles) {
    if (-not (Test-Path $f)) {
        Write-Error "Missing source file: $f"
        exit 1
    }
}

# Build release ZIP
if (-not (Test-Path $ZipDir)) {
    New-Item -ItemType Directory -Path $ZipDir | Out-Null
}
$ZipPath = Join-Path $ZipDir $ZipName

# Compress-Archive is available in PS 5.0+; overwrite if already exists
Compress-Archive -Path $SourceFiles -DestinationPath $ZipPath -Force
Write-Host "  Created artifact: $ZipPath"

Write-Host "[release.ps1] Done. Attach the ZIP to the GitHub Release at:"
Write-Host "  https://github.com/PawExperiences/BB.Project1/releases/new"
