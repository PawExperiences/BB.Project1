#Requires -Version 5.1
# release.ps1 -- tag v0.1.0, zip artifact, create draft GitHub release.
# Run from the repo root after CI passes. Requires git and gh (GitHub CLI) on PATH.
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$VERSION      = '0.1.0'
$TAG          = "v$VERSION"
$ZIP_NAME     = "space-invaders-$VERSION.zip"
$NOTES_PATH   = "release/notes-$VERSION.md"

$ARTIFACT_FILES = @(
    'index.html','game.js','gameConfig.js','input.js','player.js',
    'invaders.js','collision.js','shields.js','README.md'
)

$RELEASE_NOTES = @"
## e2e Space Invaders $VERSION

First public release. Open ``index.html`` from the downloaded ZIP directly in
Chrome or Firefox (no server needed). Three fully playable levels:

- Level 1: classic accelerating 11x5 invader grid
- Level 2: invader return fire, player respawn/blink, bonus UFO with tier scoring
- Level 3: destructible shield bunkers + formation split at 50% kills

See README.md inside the ZIP for manual verification steps.
"@

Write-Host "[release.ps1] Releasing $TAG"

# 1. Tag (idempotent)
$existingTag = & git tag -l $TAG 2>&1
if ($existingTag -match [regex]::Escape($TAG)) {
    Write-Host "  Tag $TAG already exists -- skipping."
} else {
    & git tag -a $TAG -m "Release $VERSION -- e2e Space Invaders initial release"
    & git push origin $TAG
    Write-Host "  Tag $TAG created and pushed."
}

# 2. Package artifact
foreach ($f in $ARTIFACT_FILES) {
    if (-not (Test-Path $f)) {
        Write-Error "  ERROR: missing file: $f"
        exit 1
    }
}
if (Test-Path $ZIP_NAME) { Remove-Item $ZIP_NAME -Force }
Compress-Archive -Path $ARTIFACT_FILES -DestinationPath $ZIP_NAME
$size = (Get-Item $ZIP_NAME).Length
Write-Host "  Artifact: $ZIP_NAME ($size bytes)"

# 3. Write release notes
$notesDir = Split-Path $NOTES_PATH
if (-not (Test-Path $notesDir)) { New-Item -ItemType Directory -Path $notesDir | Out-Null }
[System.IO.File]::WriteAllText($NOTES_PATH, $RELEASE_NOTES, [System.Text.Encoding]::UTF8)
Write-Host "  Notes written to $NOTES_PATH"

# 4. Create draft GitHub release (idempotent)
$viewResult = & gh release view $TAG 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  GitHub release $TAG already exists -- skipping creation."
} else {
    & gh release create $TAG $ZIP_NAME `
        --title "e2e Space Invaders $VERSION" `
        --notes-file $NOTES_PATH `
        --draft
    Write-Host "  Draft release created: https://github.com/PawExperiences/BB.Project1/releases"
}

Write-Host "[release.ps1] Done. Review the draft on GitHub, then publish manually."
