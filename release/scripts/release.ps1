# release.ps1 -- Tag and push v0.1.0 to origin.
# Run from the repository root after CI is green.
# Idempotent: skips tag creation if v0.1.0 already exists locally.

$ErrorActionPreference = 'Stop'

$VERSION = 'v0.1.0'
$RELEASE_MSG = 'Release v0.1.0 -- e2e Space Invaders initial release'
$ARCHIVE = 'e2e-space-invaders-0.1.0.zip'

Write-Host '[release] Checking working tree is clean...'
$status = & git status --porcelain 2>&1
if ($status) {
    Write-Error 'Working tree is dirty. Commit or stash changes first.'
    exit 1
}

Write-Host "[release] Checking if tag $VERSION already exists..."
$existingTag = & git tag -l $VERSION 2>&1
if ($existingTag -match [regex]::Escape($VERSION)) {
    Write-Host "[release] Tag $VERSION already exists locally -- skipping creation."
} else {
    Write-Host "[release] Creating annotated tag $VERSION..."
    & git tag -a $VERSION -m $RELEASE_MSG
    Write-Host "[release] Tag $VERSION created."
}

Write-Host "[release] Pushing tag $VERSION to origin..."
$pushOut = & git push origin $VERSION 2>&1
if ($pushOut -match 'already exists|Everything up-to-date') {
    Write-Host "[release] Tag $VERSION already on remote -- nothing to push."
} else {
    Write-Host "[release] Tag $VERSION pushed to origin."
}

Write-Host '[release] Packaging release archive...'
$filesToPackage = @(
    'index.html', 'game.js', 'gameConfig.js', 'input.js', 'player.js',
    'invaders.js', 'collision.js', 'level1.js', 'level2.js', 'level3.js',
    'boss.js', 'README.md'
)
$existingFiles = $filesToPackage | Where-Object { Test-Path $_ }
$missingFiles = $filesToPackage | Where-Object { -not (Test-Path $_) }
if ($missingFiles) {
    Write-Host "WARNING: These files were not found and will be omitted: $($missingFiles -join ', ')"
}
if (Get-Command Compress-Archive -ErrorAction SilentlyContinue) {
    Compress-Archive -Path $existingFiles -DestinationPath $ARCHIVE -Force
    Write-Host "[release] Archive created: $ARCHIVE"
} else {
    Write-Host "WARNING: Compress-Archive not available. Package files manually."
}

Write-Host "[release] Done. Upload $ARCHIVE to the GitHub Release manually."
