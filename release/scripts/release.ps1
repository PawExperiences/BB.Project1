# Release script for e2e space invaders v0.1.0.
# Creates annotated tag, zips source files, pushes tag to origin.
# Run from the repository root with a clean working tree.

$ErrorActionPreference = 'Stop'

$Version = '0.1.0'
$Tag = "v$Version"
$ZipName = "e2e-space-invaders-$Version.zip"
$SourceFiles = @('index.html','gameConfig.js','game.js','input.js','player.js','invaders.js','collision.js','README.md')

Write-Host '[release] Checking working tree is clean...'
$Status = & git status --porcelain
if ($Status) {
    Write-Error 'ERROR: Working tree is not clean. Commit or stash changes first.'
    exit 1
}

Write-Host '[release] Verifying source files exist...'
foreach ($f in $SourceFiles) {
    if (-not (Test-Path $f)) {
        Write-Error "ERROR: Missing file: $f"
        exit 1
    }
}
Write-Host "  All $($SourceFiles.Count) source files present."

Write-Host "[release] Creating zip artifact: $ZipName"
if (Test-Path $ZipName) { Remove-Item $ZipName }
Compress-Archive -Path $SourceFiles -DestinationPath $ZipName
$Size = (Get-Item $ZipName).Length
Write-Host "  Created: $ZipName ($Size bytes)"

Write-Host "[release] Checking if tag $Tag already exists..."
$ExistingTag = & git tag -l $Tag
if ($ExistingTag -eq $Tag) {
    Write-Host "  Tag $Tag already exists locally -- skipping tag creation."
} else {
    Write-Host "[release] Creating annotated tag $Tag..."
    & git tag -a $Tag -m "Release $Tag -- Game loop and canvas framework"
    if ($LASTEXITCODE -ne 0) { exit 1 }
}

Write-Host "[release] Pushing tag $Tag to origin..."
& git push origin $Tag
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ''
Write-Host "[release] Done. Tag $Tag pushed. Upload $ZipName to the GitHub Release page manually."
