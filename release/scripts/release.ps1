# release.ps1 -- packages e2e Space Invaders 0.1.0 into a release zip.
# Run from the repository root after tagging v0.1.0.
# Idempotent: re-running overwrites the zip.

$Version = '0.1.0'
$Project = 'e2e-space-invaders'
$OutDir  = 'release'
$OutFile = Join-Path $OutDir "$Project-$Version.zip"

$Files = @(
    'index.html',
    'game.js',
    'gameConfig.js',
    'input.js',
    'player.js',
    'invaders.js',
    'collisions.js',
    'explosions.js',
    'level1.js',
    'level2.js',
    'level3.js',
    'boss.js',
    'README.md'
)

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

$Missing = $Files | Where-Object { -not (Test-Path $_) }
if ($Missing) {
    Write-Error "Missing files: $($Missing -join ', ')"
    exit 1
}

if (Test-Path $OutFile) { Remove-Item $OutFile -Force }

Compress-Archive -Path $Files -DestinationPath $OutFile
foreach ($f in $Files) { Write-Host "  added: $f" }

Write-Host ""
Write-Host "Artifact written: $OutFile"
