# release.ps1 - verify static files, tag the release, and package the artifact.
# Run from the repository root after smoke-test sign-off.
# Usage: .\release\scripts\release.ps1 [-CheckOnly]
[CmdletBinding()]
param(
    [switch]$CheckOnly
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$Version  = '0.1.0'
$Tag      = "v$Version"
$Artifact = "space-invaders-$Tag.zip"

$RequiredFiles = @(
    'index.html', 'game.js', 'gameConfig.js', 'input.js', 'player.js',
    'formation.js', 'invaders.js', 'collision.js', 'state.js',
    'level1.js', 'level2.js', 'level3.js', 'boss.js', 'README.md',
    '.github/workflows/build.yml'
)

Write-Host "=== e2e Space Invaders release script -- $Version ==="
Write-Host "Timestamp: $([datetime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))"

# --- check files ---
$Missing = $RequiredFiles | Where-Object { -not (Test-Path $_) }
if ($Missing.Count -gt 0) {
    Write-Host 'ERROR: Missing required files:'
    $Missing | ForEach-Object { Write-Host "  $_" }
    exit 1
}
Write-Host "OK: All $($RequiredFiles.Count) required files present."

if ($CheckOnly) {
    Write-Host 'Check-only mode -- done.'
    exit 0
}

# --- tag ---
$ExistingTags = & git tag -l $Tag 2>&1
if ($ExistingTags -match [regex]::Escape($Tag)) {
    Write-Host "INFO: Tag $Tag already exists -- skipping tag creation."
} else {
    Write-Host "Creating annotated tag $Tag ..."
    & git tag -a $Tag -m "Release $Tag -- initial release"
    Write-Host "Pushing tag $Tag to origin ..."
    & git push origin $Tag
    Write-Host "OK: Tag $Tag pushed."
}

# --- package ---
Write-Host "Packaging static files into $Artifact ..."
$Extensions = @('.html', '.js', '.css', '.md')
$FilesToPack = Get-ChildItem -File | Where-Object { $Extensions -contains $_.Extension } | Select-Object -ExpandProperty Name
$FilesToPack += '.github\workflows\build.yml'
$FilesToPack = $FilesToPack | Where-Object { Test-Path $_ } | Sort-Object -Unique

if (Test-Path $Artifact) { Remove-Item $Artifact -Force }
Compress-Archive -Path $FilesToPack -DestinationPath $Artifact -CompressionLevel Optimal
Write-Host "OK: Artifact written to $Artifact"

Write-Host ""
Write-Host "Release steps complete. Upload $Artifact to the GitHub Release."
