# release.ps1 - tag v0.1.0, push, and zip the distributable artifact.
# Run from the repository root. Idempotent: skips tag creation if already exists.

$Version = 'v0.1.0'
$ZipName = "e2e-space-invaders-$Version.zip"
$Files = @(
    'index.html',
    'game.js',
    'gameConfig.js',
    'input.js',
    'player.js',
    'invaders.js',
    'collision.js',
    'level1.js',
    'level2.js',
    'level3.js',
    'boss.js',
    'shared/invaders.js',
    'README.md'
)

Write-Host "[release] Checking for existing tag $Version..."
$existing = git tag -l $Version 2>&1
if ($existing -match [regex]::Escape($Version)) {
    Write-Host "[release] Tag $Version already exists - skipping tag creation."
} else {
    Write-Host "[release] Creating annotated tag $Version..."
    git tag -a $Version -m "Release $Version - e2e Space Invaders initial release"
    if ($LASTEXITCODE -ne 0) { Write-Error 'git tag failed'; exit 1 }
    Write-Host "[release] Pushing tag $Version to origin..."
    git push origin $Version
    if ($LASTEXITCODE -ne 0) { Write-Error 'git push failed'; exit 1 }
}

Write-Host "[release] Packaging artifact $ZipName..."
$existingFiles = @()
foreach ($f in $Files) {
    $normalized = $f -replace '/', [System.IO.Path]::DirectorySeparatorChar
    if (Test-Path $normalized) {
        $existingFiles += $normalized
        Write-Host "  added $normalized"
    } else {
        Write-Host "  SKIP (not found): $normalized"
    }
}

if (Test-Path $ZipName) { Remove-Item $ZipName -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open((Join-Path (Get-Location) $ZipName), 'Create')
foreach ($f in $existingFiles) {
    $entryName = $f -replace [regex]::Escape([System.IO.Path]::DirectorySeparatorChar), '/'
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, (Resolve-Path $f).Path, $entryName) | Out-Null
}
$zip.Dispose()
Write-Host "[release] Artifact written: $ZipName"
Write-Host '[release] Done. Upload the zip to the GitHub Release page manually.'
