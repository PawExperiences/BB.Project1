# release.ps1 -- Tag v0.1.0, package artifact, publish GitHub Release.
# Run from the repository root after smoke tests pass.
# Requires: git, gh (GitHub CLI) authenticated with contents:write scope.

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Version = '0.1.0'
$Tag = "v$Version"
$Artifact = "e2e-space-invaders-$Version.zip"
$ReleaseTitle = "e2e space invaders $Version"
$ReleaseNotesFile = 'RELEASE_NOTES.md'

$SourceFiles = @(
    'index.html', 'game.js', 'gameConfig.js', 'input.js',
    'player.js', 'invaders.js', 'collision.js',
    'level1.js', 'level2.js', 'level3.js', 'boss.js', 'README.md'
)

Write-Host "Working directory: $(Get-Location)"

# 1. Check tag does not already exist
$existingTags = git tag -l $Tag 2>&1
if ($existingTags -match [regex]::Escape($Tag)) {
    Write-Error "ERROR: Tag $Tag already exists. Aborting to prevent overwrite."
    exit 1
}

# 2. Create annotated tag
git tag -a $Tag -m "Release $Tag - e2e space invaders initial release"
Write-Host "Created tag $Tag"

# 3. Push tag
git push origin $Tag
Write-Host "Pushed tag $Tag to origin"

# 4. Package artifact
Write-Host "Creating artifact: $Artifact"
$filesToZip = @()
foreach ($f in $SourceFiles) {
    if (Test-Path $f) {
        $filesToZip += $f
        Write-Host "  + $f"
    } else {
        Write-Host "  WARNING: $f not found, skipping."
    }
}
if (Test-Path $Artifact) { Remove-Item $Artifact }
Compress-Archive -Path $filesToZip -DestinationPath $Artifact
Write-Host "Artifact ready: $Artifact"

# 5. Write release notes if not present
if (-not (Test-Path $ReleaseNotesFile)) {
    Set-Content -Path $ReleaseNotesFile -Value "## e2e space invaders $Version`n`nInitial release. See CHANGELOG.md for full details."
    Write-Host "Wrote placeholder $ReleaseNotesFile"
}

# 6. Publish GitHub Release
gh release create $Tag $Artifact --title $ReleaseTitle --notes-file $ReleaseNotesFile
Write-Host "GitHub Release $Tag published with artifact $Artifact"
