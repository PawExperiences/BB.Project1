# release.ps1 - packages shippable source files into a versioned zip artifact.
# Run after `git tag v0.1.0` and a green CI build, before uploading to GitHub Releases.

$ErrorActionPreference = 'Stop'

$Version  = '0.1.0'
$OutDir   = 'dist'
$OutFile  = Join-Path $OutDir "e2e-space-invaders-v$Version.zip"

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
    'main.js',
    'style.css',
    'README.md'
)

# Navigate to repo root (two levels up from release/scripts/)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $ScriptDir '../..')

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

foreach ($f in $Files) {
    if (-not (Test-Path $f)) {
        Write-Error "ERROR: missing file: $f"
        exit 1
    }
}

if (Test-Path $OutFile) { Remove-Item $OutFile }

foreach ($f in $Files) { Write-Host "  + $f" }

Compress-Archive -Path $Files -DestinationPath $OutFile

Write-Host ""
Write-Host "Artifact written: $OutFile"
